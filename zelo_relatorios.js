// ── ZELO — Acesso aos relatórios mensais e às cópias do mês ──
// Os relatórios mensais (gerados pela tarefa automática do GitHub, ver
// scripts/monthly-report.mjs) ficam na própria Realtime Database, em
// relatorios_mensais/…, que só os administradores podem ler (ver
// database.rules.json) — nunca no repositório GitHub, que é público. O
// Firebase Storage deixou de ser usado: no plano gratuito não está disponível.
//
// Os nomes "tipo ficheiro" continuam a ser os mesmos para as páginas:
//   relatorios/index.json  → relatorios_mensais/indice
//   relatorios/<ym>.json   → relatorios_mensais/dados/<ym>
//   relatorios/<ym>.pdf    → relatorios_mensais/pdf/<ym> (base64)
//   arquivo/<ym>/<prefixo>/<id>.json → gerado na hora a partir dos dados do
//     mês desse serviço no Firebase (que nunca são apagados)
// Usa sempre a app do Firebase já autenticada em zelo_auth.js.
import { app } from './zelo_auth.js';
import { getDatabase, ref, get, query, orderByKey, startAt, endAt } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const db = getDatabase(app);
const RAIZ = 'relatorios_mensais';

function caminho(path){
  if (path === 'relatorios/index.json') return { tipo: 'json', db: RAIZ + '/indice' };
  let m = /^relatorios\/(\d{4}-\d{2})\.json$/.exec(path);
  if (m) return { tipo: 'json', db: RAIZ + '/dados/' + m[1] };
  m = /^relatorios\/(\d{4}-\d{2})\.pdf$/.exec(path);
  if (m) return { tipo: 'pdf', db: RAIZ + '/pdf/' + m[1] };
  if (path === 'arquivo/index.json') return { tipo: 'arquivoIndice', db: RAIZ + '/indice' };
  m = /^arquivo\/(\d{4}-\d{2})\/index\.json$/.exec(path);
  if (m) return { tipo: 'arquivoMes', ym: m[1], db: RAIZ + '/dados/' + m[1] };
  m = /^arquivo\/(\d{4}-\d{2})\/([a-z_]+)\/([A-Za-z0-9_\-]+)\.json$/.exec(path);
  if (m) return { tipo: 'arquivo', ym: m[1], db: m[2] + '/' + m[3] };
  throw new Error('Caminho desconhecido: ' + path);
}

async function lerValor(c){
  if (c.tipo === 'arquivo') {
    const snap = await get(query(ref(db, c.db), orderByKey(), startAt(c.ym + '-01'), endAt(c.ym + '-31')));
    const tudo = snap.exists() ? snap.val() : {};
    const out = {};
    Object.keys(tudo || {}).forEach(k => { if (k.indexOf(c.ym + '-') === 0) out[k] = tudo[k]; }); // só o mês
    return out;
  }
  const snap = await get(ref(db, c.db));
  let v = snap.exists() ? snap.val() : null;
  if (v && !Array.isArray(v) && (c.tipo === 'arquivoIndice' || c.db === RAIZ + '/indice')) v = Object.keys(v).map(k => v[k]).filter(Boolean);
  // Índice das cópias mensais (Base de Dados): derivado do índice dos relatórios.
  if (c.tipo === 'arquivoIndice') return (v || []).map(e => ({ ym: e.ym, label: e.label, servicesCount: e.servicesCount || 0, generatedAt: e.generatedAt }));
  // Serviços com dados num mês: vêm dos dados do relatório desse mês.
  if (c.tipo === 'arquivoMes') {
    if (!v) return null;
    const lista = Array.isArray(v.arquivo) ? v.arquivo : Object.keys(v.arquivo || {}).map(k => v.arquivo[k]);
    return { ym: v.ym, label: v.label, generatedAt: v.generatedAt, services: lista.map(a => {
      const p = String(a.file || '').split('/'); // arquivo/<ym>/<prefixo>/<id>.json
      return { id: a.id, name: a.name, cat: a.cat, daysReported: a.daysReported, prefix: p[2], fbId: String(p[3] || '').replace(/\.json$/, '') };
    }) };
  }
  return v;
}

async function bytesDe(path){
  const c = caminho(path);
  const v = await lerValor(c);
  if (v == null) throw new Error('Ficheiro não encontrado: ' + path);
  if (c.tipo === 'pdf') {
    const bin = atob(String(v));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new TextEncoder().encode(JSON.stringify(v, null, 2));
}

/** Lê um relatório em JSON (ex: 'relatorios/index.json'). Devolve null se não
 *  existir, sem permissão ou sem rede — nunca lança para o chamador. */
async function fetchRelatorioJSON(path){
  try{
    const c = caminho(path);
    const v = await lerValor(c);
    if (v == null) return null;
    // A Realtime Database devolve listas como objetos {0:…,1:…} quando têm buracos.
    return v;
  }catch(e){
    console.warn('ZELO: não foi possível ler', path, e);
    return null;
  }
}

/** Descarrega um relatório (PDF ou JSON) para o computador. */
async function baixarRelatorioFicheiro(path, nomeFicheiro, tipo){
  const bytes = await bytesDe(path);
  const blob = new Blob([bytes], {type: tipo || 'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFicheiro || 'ficheiro';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 30000);
}

/** Abre um PDF numa nova aba (aberta já no clique, para não ser bloqueada). */
async function abrirRelatorioPDF(path){
  const win = window.open('', '_blank');
  try{
    const bytes = await bytesDe(path);
    const url = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}));
    if(win) win.location = url;
    else window.open(url, '_blank');
  }catch(e){
    if(win) win.close();
    throw e;
  }
}

export { fetchRelatorioJSON, baixarRelatorioFicheiro, abrirRelatorioPDF };

window.ZeloRelatorios = { fetchRelatorioJSON, baixarRelatorioFicheiro, abrirRelatorioPDF };
