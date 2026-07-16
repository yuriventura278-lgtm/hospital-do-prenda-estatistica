// Gera o resumo mensal em PDF de todos os serviços e limpa o histórico
// confirmado do mês anterior no Firebase. Pensado para correr via
// GitHub Actions no dia 2 de cada mês (ver .github/workflows/relatorio-mensal.yml),
// mas pode ser executado manualmente com `npm run relatorio-mensal`.
import admin from 'firebase-admin';
import { chromium } from 'playwright';
import fs from 'fs';

const DATABASE_URL = 'https://hospital-do-prenda-1de35-default-rtdb.europe-west1.firebasedatabase.app';

const CATS = {
  cirurgicas: {label: 'Especialidades Cirúrgicas', color: '#DC2626'},
  internamento: {label: 'Internamento & Cuidados', color: '#7C3AED'},
  diagnostico: {label: 'Diagnóstico & Laboratório', color: '#0EA5E9'},
  ambulatorio: {label: 'Ambulatório & Saúde Mental', color: '#059669'},
  procedimentos: {label: 'Procedimentos de Enfermagem', color: '#D97706'},
};

const SERVICES = [
  {id:'cirurgia_geral', name:'Cirurgia Geral', cat:'cirurgicas'},
  {id:'ortopedia', name:'Ortopedia', cat:'cirurgicas'},
  {id:'neurocirurgia', name:'Neurocirurgia', cat:'cirurgicas'},
  {id:'cirurgia_maxilo_facial', name:'Maxilo Facial', cat:'cirurgicas'},
  {id:'oftalmologia', name:'Oftalmologia', cat:'cirurgicas'},
  {id:'otorrinolaringologia', name:'Otorrinolaringologia', cat:'cirurgicas'},
  {id:'bloco_operatorio', name:'Bloco Operatório', cat:'cirurgicas'},
  {id:'medicina_interna', name:'Medicina Interna', cat:'internamento'},
  {id:'nefrologia', name:'Nefrologia', cat:'internamento'},
  {id:'uci', name:'UCI', cat:'internamento'},
  {id:'fisioterapia', name:'Fisioterapia', cat:'internamento'},
  {id:'laboratorio_clinico', name:'Laboratório Clínico', cat:'diagnostico'},
  {id:'imagiologia', name:'Imagiologia', cat:'diagnostico'},
  {id:'consulta_externa', name:'Consulta Externa', cat:'ambulatorio'},
  {id:'psicologia_clinica', name:'Psicologia Clínica', cat:'ambulatorio'},
];

// Procedimentos de Enfermagem (registos_enf/<slug>) — namespace próprio no Firebase porque
// 3 slugs (nefrologia, neurocirurgia, ortopedia) coincidem com ids de bancos acima.
const PROC_CATS = [
  {id: 'medicacao', label: 'Medicação e Terapêutica'},
  {id: 'monitorizacao', label: 'Monitorização e Avaliação'},
  {id: 'invasivos', label: 'Procedimentos Invasivos e Sondas'},
  {id: 'curativos', label: 'Curativos, Pensos e Cirurgia Menor'},
  {id: 'higiene', label: 'Higiene, Conforto e Cuidados Gerais'},
  {id: 'avaliacao', label: 'Triagem, Consultas e Análises'},
  {id: 'gestao', label: 'Gestão do Doente'},
];
const PROC_LABELS = {
  cirurgia:'Cirurgia', ortopedia:'Ortopedia', neurocirurgia:'Neurocirurgia', maxilo_facial:'Maxilo Facial',
  nefrologia:'Nefrologia', uci_intermedio:'UCI / Cuidados Intermédios', medicina_homem:'Medicina Homem',
  medicina_mulher:'Medicina Mulher', bloco_operatorio:'Bloco Operatório', banco_urgencia:'Banco de Urgência',
  hospital_dia:'Hospital de Dia', consulta_externa:'Consulta Externa',
};
const PROC_SERVICES = Object.entries(PROC_LABELS).map(([slug, name])=>(
  {id:'proc_'+slug, name, cat:'procedimentos', slug, fbPrefix:'registos_enf'}
));
const ALL_SERVICES = [...SERVICES, ...PROC_SERVICES];

function num(v){ const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function saved(arr){ return Array.isArray(arr) ? arr.filter(x=>x && x.saved) : []; }
function pad(n){ return String(n).padStart(2,'0'); }

// ── BANCO DE URGÊNCIA — Tabela 2 (Atendimento) e Tabela 3 (Movimento) ─────
// As 7 especialidades que compõem o Banco de Urgência partilham a mesma
// estrutura de snapshot (idMen/idMai/pacTotal/transfR/transfE/intData/
// obitData/altas — ver Cirurgia_Geral.html buildSnapshot()). "Vindos de
// outros Hospitais" e "Transferidos para outras unidades" correspondem às
// listas detalhadas de Transferências Recebidas/Efetuadas (cada uma regista
// o hospital de origem/destino); "Transferidos para Internamento" corresponde
// ao Internamento próprio da especialidade (intData); "Falecidos" corresponde
// aos óbitos registados no próprio banco (obitData), não aos óbitos já
// internados.
const URGENCIA_ROWS = [
  {id:'medicina_interna', label:'Medicina'},
  {id:'cirurgia_geral', label:'Cirurgia'},
  {id:'ortopedia', label:'Ortopedia e Traumatologia'},
  {id:'cirurgia_maxilo_facial', label:'Maxilo Facial'},
  {id:'otorrinolaringologia', label:'Otorrinolaringologia'},
  {id:'neurocirurgia', label:'Neurocirurgia'},
  {id:'oftalmologia', label:'Oftalmologia'},
];
const URGENCIA_IDS = URGENCIA_ROWS.map(r=>r.id);
const URGENCIA_CLINICA_IDS = ['medicina_interna'];

function altasTotalFromSnapshot(s){
  const manual = num(s.altas);
  if(manual) return manual;
  return (s.altasV||[]).reduce((a,x)=>a+num(x&&x.v), 0);
}

/** Contagens do Banco de Urgência de UM dia, para uma das 7 especialidades acima. */
function urgenciaMetrics(s){
  return {
    idMen: num(s.idMen), idMai: num(s.idMai),
    vindosHospitais: saved(s.transfR).length,
    transfInternamento: saved(s.intData).length,
    altas: altasTotalFromSnapshot(s),
    falecidos: saved(s.obitData).length,
    transfOutrasUnidades: saved(s.transfE).length,
  };
}

// ── Top 20 Diagnósticos — normalização e agrupamento ──────────────────────
// Os diagnósticos são escritos livremente (diagData/patData), por vezes em
// abreviatura, por vezes por extenso, com/sem acentos. Para não duplicar
// "HTA" e "Hipertensão Arterial" como duas linhas diferentes no Top 20,
// normalizamos o texto e expandimos abreviaturas comuns antes de agrupar; no
// fim, um segundo passo aproximado (por semelhança de bigramas) junta ainda
// variações que a lista de abreviaturas não cobre (pequenas diferenças de
// escrita/erros de digitação). Isto é uma normalização de melhor-esforço —
// não substitui uma codificação clínica formal (CID).
const DIAG_SOURCE_IDS = ['medicina_interna','cirurgia_geral','ortopedia','cirurgia_maxilo_facial','neurocirurgia','oftalmologia','otorrinolaringologia','psicologia_clinica'];

const DIAG_ABREV = {
  hta:'hipertensao arterial', ha:'hipertensao arterial',
  dm:'diabetes mellitus', dm1:'diabetes mellitus tipo 1', dm2:'diabetes mellitus tipo 2',
  avc:'acidente vascular cerebral', ave:'acidente vascular cerebral',
  avci:'acidente vascular cerebral isquemico', avch:'acidente vascular cerebral hemorragico',
  tce:'traumatismo cranio encefalico', tcr:'traumatismo cranio raquidiano',
  ivu:'infecao trato urinario', itu:'infecao trato urinario',
  irc:'insuficiencia renal cronica', ira:'insuficiencia renal aguda',
  dpoc:'doenca pulmonar obstrutiva cronica',
  icc:'insuficiencia cardiaca congestiva',
  iam:'infarto agudo miocardio', sca:'sindrome coronariana aguda',
  fx:'fratura', fract:'fratura',
  tvp:'trombose venosa profunda', tep:'tromboembolismo pulmonar',
  hda:'hemorragia digestiva alta', hdb:'hemorragia digestiva baixa',
  drge:'doenca refluxo gastroesofagico',
  lca:'ligamento cruzado anterior', lcp:'ligamento cruzado posterior',
  hbp:'hiperplasia benigna prostata',
  ce:'corpo estranho', gea:'gastroenterite aguda',
  eap:'edema agudo pulmao', dcv:'doenca cardiovascular',
  ist:'infecao sexualmente transmissivel', its:'infecao sexualmente transmissivel', dst:'infecao sexualmente transmissivel',
  irpa:'insuficiencia respiratoria aguda', irespa:'insuficiencia respiratoria aguda',
  pcr:'paragem cardiorrespiratoria',
  hsa:'hemorragia subaracnoideia', hic:'hemorragia intracraniana',
  tcedve:'traumatismo cranio encefalico',
};
const DIAG_STOPWORDS = new Set(['de','do','da','dos','das','e','a','o','os','as','em','no','na','nos','nas','com','por','para','um','uma','ao','à','aos']);

function stripAccents(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g, ''); }

/** Chave normalizada usada para agrupar diagnósticos equivalentes. */
function normalizeDiagKey(raw){
  let s = stripAccents(String(raw||'').toLowerCase());
  s = s.replace(/[.,;:!?()"'`]/g, ' ').replace(/[-/]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  if(!s) return '';
  const tokens = s.split(' ').filter(t=>t && !DIAG_STOPWORDS.has(t));
  // Expandir abreviaturas primeiro (pode gerar frases com vários tokens), só depois
  // achatar e aplicar o singular simples — assim uma abreviatura e a forma por
  // extenso passam pelas mesmas regras e acabam com a mesma chave.
  const expandedStr = tokens.map(tok=>DIAG_ABREV[tok] || tok).join(' ');
  const finalTokens = expandedStr.split(' ').filter(Boolean).map(tok=>{
    if(tok.length > 4 && tok.endsWith('s') && !tok.endsWith('ss')) return tok.slice(0, -1);
    return tok;
  });
  finalTokens.sort();
  return finalTokens.join(' ');
}

function bigrams(s){
  const clean = s.replace(/\s+/g, '');
  const out = [];
  for(let i=0; i<clean.length-1; i++) out.push(clean.slice(i, i+2));
  return out;
}
function diceCoefficient(a, b){
  if(a === b) return 1;
  const ga = bigrams(a), gb = bigrams(b);
  if(!ga.length || !gb.length) return 0;
  const counts = {};
  gb.forEach(g=>{ counts[g] = (counts[g]||0) + 1; });
  let matches = 0;
  ga.forEach(g=>{ if(counts[g] > 0){ matches++; counts[g]--; } });
  return (2 * matches) / (ga.length + gb.length);
}

/**
 * Agrupa uma lista de {text, qty} em diagnósticos únicos, expandindo
 * abreviaturas e fundindo variações muito semelhantes (bigramas). Devolve
 * lista ordenada por qty desc, cada item com {label, qty} — o label é a
 * grafia original mais usada dentro do grupo.
 */
function mergeDiagCounts(entries){
  const groups = new Map(); // key -> {qty, labelCounts: Map<string,number>}
  for(const {text, qty} of entries){
    const clean = String(text||'').trim();
    if(!clean) continue;
    const key = normalizeDiagKey(clean);
    if(!key) continue;
    if(!groups.has(key)) groups.set(key, {qty: 0, labelCounts: new Map()});
    const g = groups.get(key);
    g.qty += qty;
    g.labelCounts.set(clean, (g.labelCounts.get(clean)||0) + qty);
  }
  // Segundo passo: fundir chaves muito semelhantes que a normalização não juntou
  // (pequenas diferenças de escrita / erros de digitação), começando pelos
  // grupos maiores para que o rótulo final seja o mais representativo.
  const keys = [...groups.keys()].sort((a,b)=>groups.get(b).qty - groups.get(a).qty);
  const merged = new Set();
  for(let i=0; i<keys.length; i++){
    const ka = keys[i];
    if(merged.has(ka) || !groups.has(ka)) continue;
    for(let j=i+1; j<keys.length; j++){
      const kb = keys[j];
      if(merged.has(kb) || !groups.has(kb)) continue;
      const lenRatio = Math.min(ka.length, kb.length) / Math.max(ka.length, kb.length);
      if(lenRatio < 0.6) continue;
      if(diceCoefficient(ka, kb) >= 0.85){
        const ga = groups.get(ka), gb = groups.get(kb);
        ga.qty += gb.qty;
        gb.labelCounts.forEach((v,k)=>ga.labelCounts.set(k, (ga.labelCounts.get(k)||0) + v));
        groups.delete(kb);
        merged.add(kb);
      }
    }
  }
  const result = [];
  groups.forEach(g=>{
    let bestLabel = '', bestCount = -1;
    g.labelCounts.forEach((count, label)=>{
      if(count > bestCount || (count === bestCount && label.length > bestLabel.length)){
        bestLabel = label; bestCount = count;
      }
    });
    result.push({label: bestLabel, qty: g.qty});
  });
  result.sort((a,b)=>b.qty - a.qty);
  return result;
}

/** Extrai a lista de {text, qty} de diagnósticos/patologias de UM dia. */
function diagEntriesFromSnapshot(id, s){
  if(id === 'psicologia_clinica'){
    return (s.patData||[]).filter(p=>p && p.nome && num(p.qty) > 0).map(p=>({text: p.nome, qty: num(p.qty)}));
  }
  return (s.diagData||[]).filter(d=>d && d.desc).map(d=>({text: d.desc, qty: Math.max(1, num(d.qty) || 1)}));
}

/** Métrica principal + secundárias de UM dia, por serviço (para somar ao longo do mês). */
function dayMetrics(id, s){
  switch(id){
    case 'bloco_operatorio': {
      const urg = saved(s.urgData).length, ele = saved(s.eleData).length, sus = saved(s.susData).length;
      return {headline: urg+ele, secondary: {'Urgentes': urg, 'Electivas': ele, 'Suspensas': sus}};
    }
    case 'uci':
      return {headline: num(s.internados), secondary: {'Ventilados': num(s.ventilados), 'Óbitos': num(s.falecidos)}};
    case 'nefrologia':
      return {headline: num(s.hemodialise), secondary: {'D. Peritoneal': num(s.dialisePeritoneal), 'Altas': num(s.altas)}};
    case 'fisioterapia': {
      const t = (s.intV||[]).reduce((a,x)=>a+num(x.v),0) + (s.modV||[]).reduce((a,x)=>a+num(x.v),0);
      return {headline: t, secondary: {}};
    }
    case 'laboratorio_clinico': {
      const ex = s.exameData||{}, pos = s.positivoData||{};
      const tEx = Object.values(ex).reduce((a,v)=>a+num(v&&v.urg)+num(v&&v.int),0);
      const tPos = Object.values(pos).reduce((a,v)=>a+num(v&&v.urg)+num(v&&v.int),0);
      return {headline: tEx, secondary: {'Positivos': tPos}};
    }
    case 'imagiologia': {
      const t = [...(s.bu||[]),...(s.int||[])].reduce((a,r)=>a+num(r.prx)+num(r.rx)+num(r.peco)+num(r.eco)+num(r.ptac)+num(r.tac),0);
      return {headline: t, secondary: {'ECG': num(s.ecg)}};
    }
    case 'consulta_externa': {
      const esp = s.espData||{};
      const t = Object.values(esp).reduce((a,d)=>a+num(d&&d.total),0);
      return {headline: t, secondary: {}};
    }
    case 'psicologia_clinica': {
      const t = Object.values(s.intVals||{}).reduce((a,v)=>a+num(v),0) + num(s.extTotal);
      return {headline: t, secondary: {'Externos': num(s.extTotal)}};
    }
    default: // Cirurgia Geral, Ortopedia, Neurocirurgia, Maxilo Facial, Oftalmologia, Otorrino, Medicina Interna
      return {headline: num(s.pacTotal), secondary: {'Altas': num(s.altas), 'Óbitos': saved(s.obitData).length}};
  }
}

/** Métrica de UM dia de procedimentos de enfermagem (snapshot no formato {sub:{subId:{cats:{catId:{d:[],n:[]}}}}}). */
function procDayMetrics(s){
  const sub = s.sub || {};
  const catTotal = {};
  PROC_CATS.forEach(c=>{ catTotal[c.label] = 0; });
  let total = 0;
  Object.values(sub).forEach(sd=>{
    PROC_CATS.forEach(c=>{
      const cd = sd && sd.cats && sd.cats[c.id];
      if(!cd) return;
      const t = (cd.d||[]).reduce((a,v)=>a+num(v),0) + (cd.n||[]).reduce((a,v)=>a+num(v),0);
      catTotal[c.label] += t;
      total += t;
    });
  });
  return {headline: total, secondary: catTotal};
}

const HEADLINE_LABEL = {
  bloco_operatorio: 'Cirurgias', uci: 'Internados', nefrologia: 'Hemodiálise',
  fisioterapia: 'Atendimentos', laboratorio_clinico: 'Exames', imagiologia: 'Exames',
  consulta_externa: 'Consultas', psicologia_clinica: 'Atendidos',
};
function headlineLabel(id){ if(id.startsWith('proc_')) return 'Procedimentos'; return HEADLINE_LABEL[id] || 'Pacientes'; }

function getTargetMonth(refDate){
  const d = refDate || new Date();
  const target = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return {year: target.getFullYear(), month: target.getMonth()};
}

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// O arquivo publicado no GitHub é público — nunca pode conter nomes de doentes.
// Remove recursivamente qualquer campo chamado "nome" (a qualquer profundidade) de um
// snapshot de um dia, mantendo todos os outros dados estatísticos intactos. Aplicado só
// a rec.snapshot — rec.criadoPor (autor do registo, para responsabilização interna) fica
// de fora porque está ao lado de snapshot, não dentro dele.
function stripNomesDoentes(value){
  if(Array.isArray(value)) return value.map(stripNomesDoentes);
  if(value && typeof value === 'object'){
    const out = {};
    for(const [k, v] of Object.entries(value)){
      if(/^nome$/i.test(k)) continue;
      out[k] = stripNomesDoentes(v);
    }
    return out;
  }
  return value;
}

/** Tabela 2 (Atendimento por especialidade/idade) + Tabela 3 (Movimento clínico/cirúrgico)
 *  + Top 20 Diagnósticos, para o Banco de Urgência (secção fixa do relatório mensal). */
function buildUrgenciaSectionHTML(urgenciaAgg, diagTop20){
  const rows2 = URGENCIA_ROWS.map(r=>{
    const a = urgenciaAgg[r.id];
    return {label: r.label, men: a.idMen, mai: a.idMai, tot: a.idMen + a.idMai};
  });
  const t2TotMen = rows2.reduce((s,r)=>s+r.men, 0);
  const t2TotMai = rows2.reduce((s,r)=>s+r.mai, 0);

  const clinicaRows = URGENCIA_ROWS.filter(r=>URGENCIA_CLINICA_IDS.includes(r.id));
  const cirurgicaRows = URGENCIA_ROWS.filter(r=>!URGENCIA_CLINICA_IDS.includes(r.id));
  const sumField = (rows, field) => rows.reduce((s,r)=>s+urgenciaAgg[r.id][field], 0);
  const obsField = rows => sumField(rows,'idMen') + sumField(rows,'idMai');
  const movRows = [
    {label:'Doentes Observados', clin: obsField(clinicaRows), cir: obsField(cirurgicaRows)},
    {label:'Vindos de outros Hospitais', clin: sumField(clinicaRows,'vindosHospitais'), cir: sumField(cirurgicaRows,'vindosHospitais')},
    {label:'Transferidos para Internamento', clin: sumField(clinicaRows,'transfInternamento'), cir: sumField(cirurgicaRows,'transfInternamento')},
    {label:'Altas', clin: sumField(clinicaRows,'altas'), cir: sumField(cirurgicaRows,'altas')},
    {label:'Falecidos', clin: sumField(clinicaRows,'falecidos'), cir: sumField(cirurgicaRows,'falecidos')},
    {label:'Transferidos para outras unidades', clin: sumField(clinicaRows,'transfOutrasUnidades'), cir: sumField(cirurgicaRows,'transfOutrasUnidades')},
  ];

  const tableStyle = `width:100%;border-collapse:collapse;font-size:10px;margin-top:8px;`;
  const thStyle = `background:#0D1B3E;color:#fff;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.03em;`;
  const tdStyle = `padding:5px 8px;border-bottom:1px solid #E2E8F0;`;
  const tdNum = `${tdStyle}text-align:right;font-family:'DM Mono',monospace;font-weight:700;`;

  const tabela2 = `
    <section style="margin-bottom:22px;break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:24px;height:3px;border-radius:2px;background:#1A56DB;display:inline-block;"></span>
        <h2 style="font-size:13px;font-weight:700;color:#0F172A;margin:0;">Tabela 2 — Atendimento no Banco de Urgência</h2>
      </div>
      <table style="${tableStyle}">
        <thead><tr>
          <th style="${thStyle}">Especialidade</th>
          <th style="${thStyle}text-align:right;">Menor de 15 anos</th>
          <th style="${thStyle}text-align:right;">15 anos e mais</th>
          <th style="${thStyle}text-align:right;">Total</th>
        </tr></thead>
        <tbody>
          ${rows2.map((r,i)=>`<tr style="background:${i%2===0?'#FAFBFF':'#fff'};">
            <td style="${tdStyle}">${esc(r.label)}</td>
            <td style="${tdNum}">${r.men}</td>
            <td style="${tdNum}">${r.mai}</td>
            <td style="${tdNum}color:#1A56DB;">${r.tot}</td>
          </tr>`).join('')}
          <tr style="background:#EFF6FF;font-weight:700;">
            <td style="${tdStyle}">TOTAL GERAL</td>
            <td style="${tdNum}">${t2TotMen}</td>
            <td style="${tdNum}">${t2TotMai}</td>
            <td style="${tdNum}color:#0D1B3E;">${t2TotMen + t2TotMai}</td>
          </tr>
        </tbody>
      </table>
    </section>`;

  const tabela3 = `
    <section style="margin-bottom:22px;break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:24px;height:3px;border-radius:2px;background:#7C3AED;display:inline-block;"></span>
        <h2 style="font-size:13px;font-weight:700;color:#0F172A;margin:0;">Tabela 3 — Movimento do Banco de Urgência</h2>
      </div>
      <table style="${tableStyle}">
        <thead><tr>
          <th style="${thStyle}"></th>
          <th style="${thStyle}text-align:right;">Urgências Média Clínica</th>
          <th style="${thStyle}text-align:right;">Urgências Média Cirúrgica</th>
          <th style="${thStyle}text-align:right;">Total</th>
        </tr></thead>
        <tbody>
          ${movRows.map((r,i)=>`<tr style="background:${i%2===0?'#FAFBFF':'#fff'};">
            <td style="${tdStyle}">${esc(r.label)}</td>
            <td style="${tdNum}">${r.clin}</td>
            <td style="${tdNum}">${r.cir}</td>
            <td style="${tdNum}color:#7C3AED;">${r.clin + r.cir}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>`;

  const tabelaDiag = diagTop20.length ? `
    <section style="margin-bottom:22px;break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:24px;height:3px;border-radius:2px;background:#D97706;display:inline-block;"></span>
        <h2 style="font-size:13px;font-weight:700;color:#0F172A;margin:0;">Top 20 Diagnósticos — Medicina, Cirurgia Geral, Ortopedia, Maxilo Facial, Neurocirurgia, Oftalmologia, Otorrinolaringologia e Psicologia Clínica</h2>
      </div>
      <table style="${tableStyle}">
        <thead><tr>
          <th style="${thStyle}">#</th>
          <th style="${thStyle}">Diagnóstico</th>
          <th style="${thStyle}text-align:right;">Casos</th>
        </tr></thead>
        <tbody>
          ${diagTop20.map((d,i)=>`<tr style="background:${i%2===0?'#FAFBFF':'#fff'};">
            <td style="${tdStyle}color:#D97706;font-weight:700;">${i+1}</td>
            <td style="${tdStyle}">${esc(d.label)}</td>
            <td style="${tdNum}color:#D97706;">${d.qty}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="font-size:8.5px;color:#94A3B8;margin-top:4px;">Diagnósticos escritos livremente pelos profissionais, agrupados automaticamente por semelhança (abreviaturas e variações de escrita); não substitui uma codificação clínica formal.</div>
    </section>` : '';

  return tabela2 + tabela3 + tabelaDiag;
}

function buildReportHTML(monthLabel, perService, ym, extra){
  const {urgenciaAgg, diagTop20} = extra || {};
  const totalDaysReported = perService.reduce((a,s)=>a+s.daysReported, 0);
  const groups = Object.entries(CATS).map(([catId, cat])=>{
    const items = perService.filter(s=>s.cat===catId);
    if(!items.length) return '';
    return `
      <section style="margin-bottom:22px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="width:24px;height:3px;border-radius:2px;background:${cat.color};display:inline-block;"></span>
          <h2 style="font-size:13px;font-weight:700;color:#0F172A;margin:0;">${esc(cat.label)}</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
          ${items.map(s=>`
            <div style="border:1px solid #E2E8F0;border-radius:10px;padding:12px 14px;background:#fff;break-inside:avoid;">
              <div style="font-size:12px;font-weight:700;color:#0F172A;margin-bottom:6px;">${esc(s.name)}</div>
              <div style="display:flex;align-items:baseline;gap:6px;">
                <span style="font-family:'DM Mono',monospace;font-size:22px;font-weight:700;color:${cat.color};">${s.headlineTotal}</span>
                <span style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:.04em;">${esc(s.headlineLabel)} · mês</span>
              </div>
              <div style="font-size:10px;color:#64748B;margin-top:4px;">${s.daysReported} dia(s) reportado(s) de ${s.daysInMonth}</div>
              ${Object.keys(s.secondaryTotals).length ? `
                <div style="display:flex;gap:10px;margin-top:8px;padding-top:8px;border-top:1px solid #F1F5F9;flex-wrap:wrap;">
                  ${Object.entries(s.secondaryTotals).map(([k,v])=>`<div style="font-size:10px;color:#334155;"><b style="font-family:'DM Mono',monospace;font-size:12px;">${v}</b><br/>${esc(k)}</div>`).join('')}
                </div>` : ''}
            </div>
          `).join('')}
        </div>
      </section>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-AO"><head><meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:26px 30px;color:#0F172A;}
  header{background:#0D1B3E;color:#fff;padding:18px 22px;border-radius:12px;margin-bottom:22px;}
  header .org{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#22D3EE;}
  header h1{font-size:18px;margin:4px 0 2px;}
  header p{font-size:11px;color:#C7D2E8;margin:0;}
  .stats{display:flex;gap:26px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.15);}
  .stats div{}
  .stats .n{font-family:'DM Mono',monospace;font-size:16px;font-weight:700;}
  .stats .l{font-size:9px;color:#8CA0C6;text-transform:uppercase;letter-spacing:.05em;}
  footer{margin-top:20px;padding-top:12px;border-top:1px solid #E2E8F0;font-size:9px;color:#94A3B8;text-align:center;}
</style></head>
<body>
  <header>
    <div class="org">Hospital do Prenda · Departamento de Estatística Médica</div>
    <h1>Resumo Mensal de Todos os Serviços</h1>
    <p>${esc(monthLabel)}</p>
    <div class="stats">
      <div><div class="n">${perService.length}</div><div class="l">Serviços</div></div>
      <div><div class="n">${totalDaysReported}</div><div class="l">Dias com registo (total)</div></div>
    </div>
  </header>
  ${urgenciaAgg ? buildUrgenciaSectionHTML(urgenciaAgg, diagTop20 || []) : ''}
  ${groups}
  <footer>Gerado automaticamente pelo sistema no dia 2 do mês seguinte · Hospital do Prenda · Uso interno · Luanda, Angola</footer>
</body></html>`;
}

async function main(){
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if(!serviceAccountRaw){
    throw new Error('Variável de ambiente FIREBASE_SERVICE_ACCOUNT não definida.');
  }
  const serviceAccount = JSON.parse(serviceAccountRaw);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: DATABASE_URL,
  });
  const db = admin.database();

  const {year, month} = getTargetMonth(); // month é 0-based, mês ANTERIOR ao actual
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ym = `${year}-${pad(month + 1)}`;
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-PT', {month: 'long', year: 'numeric'});

  console.log(`A gerar resumo de ${monthLabel} (${ym})…`);

  // Arquivo local dos dados em bruto — guardado ANTES da limpeza, para nunca perder o
  // detalhe dia-a-dia depois de o Firebase ser esvaziado. Fica organizado por mês/prefixo/serviço.
  const archiveDir = `arquivo/${ym}`;
  fs.mkdirSync('arquivo', {recursive: true});
  const archivedServices = [];

  const perService = [];
  const toDelete = []; // {prefix, id, date}

  // Banco de Urgência: contagens mensais (Tabela 2 — Atendimento, Tabela 3 — Movimento)
  // por especialidade, e diagnósticos em bruto para o Top 20 (ver URGENCIA_ROWS/
  // DIAG_SOURCE_IDS acima). Alimentados dentro do mesmo ciclo para não repetir
  // pedidos ao Firebase.
  const urgenciaAgg = {};
  URGENCIA_ROWS.forEach(r=>{
    urgenciaAgg[r.id] = {idMen:0, idMai:0, vindosHospitais:0, transfInternamento:0, altas:0, falecidos:0, transfOutrasUnidades:0};
  });
  const diagRaw = []; // {text, qty}

  for(const svc of ALL_SERVICES){
    const prefix = svc.fbPrefix || 'registos';
    const fbId = svc.slug || svc.id;
    const snap = await db.ref(prefix + '/' + fbId).once('value');
    const all = snap.val() || {};
    const monthEntries = Object.entries(all).filter(([date]) => date.startsWith(ym));

    let headlineTotal = 0;
    const secondaryTotals = {};
    for(const [date, rec] of monthEntries){
      const s = (rec && rec.snapshot) || {};
      const m = svc.cat === 'procedimentos' ? procDayMetrics(s) : dayMetrics(svc.id, s);
      headlineTotal += m.headline;
      for(const [k, v] of Object.entries(m.secondary)){
        secondaryTotals[k] = (secondaryTotals[k] || 0) + v;
      }
      if(URGENCIA_IDS.includes(svc.id)){
        const u = urgenciaMetrics(s);
        const agg = urgenciaAgg[svc.id];
        agg.idMen += u.idMen; agg.idMai += u.idMai;
        agg.vindosHospitais += u.vindosHospitais; agg.transfInternamento += u.transfInternamento;
        agg.altas += u.altas; agg.falecidos += u.falecidos; agg.transfOutrasUnidades += u.transfOutrasUnidades;
      }
      if(DIAG_SOURCE_IDS.includes(svc.id)){
        diagRaw.push(...diagEntriesFromSnapshot(svc.id, s));
      }
      toDelete.push({prefix, id: fbId, date});
    }

    if(monthEntries.length){
      const subDir = `${archiveDir}/${prefix}`;
      fs.mkdirSync(subDir, {recursive: true});
      const semNomes = monthEntries.map(([date, rec]) => {
        const limpo = Object.assign({}, rec);
        if(limpo && limpo.snapshot) limpo.snapshot = stripNomesDoentes(limpo.snapshot);
        return [date, limpo];
      });
      const raw = Object.fromEntries(semNomes.sort((a, b) => a[0].localeCompare(b[0])));
      fs.writeFileSync(`${subDir}/${fbId}.json`, JSON.stringify(raw, null, 2));
      archivedServices.push({id: svc.id, name: svc.name, cat: svc.cat, prefix, fbId, daysReported: monthEntries.length});
    }

    perService.push({
      id: svc.id, name: svc.name, cat: svc.cat,
      daysReported: monthEntries.length, daysInMonth,
      headlineTotal, headlineLabel: headlineLabel(svc.id), secondaryTotals,
    });
  }

  if(archivedServices.length){
    fs.writeFileSync(`${archiveDir}/index.json`, JSON.stringify({
      ym, label: monthLabel, generatedAt: new Date().toISOString(), services: archivedServices,
    }, null, 2));
  }

  const archiveIndexPath = 'arquivo/index.json';
  let archiveIndex = [];
  if(fs.existsSync(archiveIndexPath)){
    try{ archiveIndex = JSON.parse(fs.readFileSync(archiveIndexPath, 'utf-8')); }catch(e){ archiveIndex = []; }
  }
  archiveIndex = archiveIndex.filter(entry => entry.ym !== ym);
  if(archivedServices.length){
    archiveIndex.push({ym, label: monthLabel, servicesCount: archivedServices.length, generatedAt: new Date().toISOString()});
    archiveIndex.sort((a, b) => b.ym.localeCompare(a.ym));
  }
  fs.writeFileSync(archiveIndexPath, JSON.stringify(archiveIndex, null, 2));
  console.log(`Arquivo local de ${ym} guardado em ${archiveDir}/ (${archivedServices.length} serviço(s) com dados).`);

  const diagTop20 = mergeDiagCounts(diagRaw).slice(0, 20);

  const html = buildReportHTML(monthLabel, perService, ym, {urgenciaAgg, diagTop20});
  fs.mkdirSync('relatorios', {recursive: true});
  const pdfPath = `relatorios/${ym}.pdf`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, {waitUntil: 'load'});
  await page.pdf({
    path: pdfPath, format: 'A4', printBackground: true,
    margin: {top: '10mm', bottom: '10mm', left: '10mm', right: '10mm'},
  });
  await browser.close();
  console.log('PDF gerado em', pdfPath);

  const indexPath = 'relatorios/index.json';
  let index = [];
  if(fs.existsSync(indexPath)){
    try{ index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')); }catch(e){ index = []; }
  }
  index = index.filter(entry => entry.ym !== ym);
  index.push({ym, label: monthLabel, file: `${ym}.pdf`, generatedAt: new Date().toISOString()});
  index.sort((a, b) => b.ym.localeCompare(a.ym));
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log('Índice actualizado em', indexPath);

  if(process.env.SKIP_CLEANUP === 'true'){
    console.log('SKIP_CLEANUP=true — histórico do Firebase NÃO foi apagado (modo de teste).');
    return;
  }

  console.log(`A remover ${toDelete.length} registo(s) confirmado(s) de ${ym} do Firebase…`);
  for(const {prefix, id, date} of toDelete){
    await db.ref(prefix + '/' + id + '/' + date).remove();
  }
  console.log('Limpeza concluída.');
}

main().then(()=>process.exit(0)).catch(e=>{
  console.error('Falha ao gerar o resumo mensal:', e);
  process.exit(1);
});
