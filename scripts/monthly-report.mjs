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

function num(v){ const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function saved(arr){ return Array.isArray(arr) ? arr.filter(x=>x && x.saved) : []; }
function pad(n){ return String(n).padStart(2,'0'); }

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

const HEADLINE_LABEL = {
  bloco_operatorio: 'Cirurgias', uci: 'Internados', nefrologia: 'Hemodiálise',
  fisioterapia: 'Atendimentos', laboratorio_clinico: 'Exames', imagiologia: 'Exames',
  consulta_externa: 'Consultas', psicologia_clinica: 'Atendidos',
};
function headlineLabel(id){ return HEADLINE_LABEL[id] || 'Pacientes'; }

function getTargetMonth(refDate){
  const d = refDate || new Date();
  const target = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return {year: target.getFullYear(), month: target.getMonth()};
}

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function buildReportHTML(monthLabel, perService, ym){
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

  const perService = [];
  const toDelete = []; // {id, date}

  for(const svc of SERVICES){
    const snap = await db.ref('registos/' + svc.id).once('value');
    const all = snap.val() || {};
    const monthEntries = Object.entries(all).filter(([date]) => date.startsWith(ym));

    let headlineTotal = 0;
    const secondaryTotals = {};
    for(const [date, rec] of monthEntries){
      const s = (rec && rec.snapshot) || {};
      const m = dayMetrics(svc.id, s);
      headlineTotal += m.headline;
      for(const [k, v] of Object.entries(m.secondary)){
        secondaryTotals[k] = (secondaryTotals[k] || 0) + v;
      }
      toDelete.push({id: svc.id, date});
    }

    perService.push({
      id: svc.id, name: svc.name, cat: svc.cat,
      daysReported: monthEntries.length, daysInMonth,
      headlineTotal, headlineLabel: headlineLabel(svc.id), secondaryTotals,
    });
  }

  const html = buildReportHTML(monthLabel, perService, ym);
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
  for(const {id, date} of toDelete){
    await db.ref('registos/' + id + '/' + date).remove();
  }
  console.log('Limpeza concluída.');
}

main().then(()=>process.exit(0)).catch(e=>{
  console.error('Falha ao gerar o resumo mensal:', e);
  process.exit(1);
});
