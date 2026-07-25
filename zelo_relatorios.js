// ── ZELO — Acesso aos relatórios mensais e ao arquivo de dados ──
// Os PDFs mensais e o arquivo bruto por serviço deixaram de ser publicados
// no repositório GitHub (que é público) e passaram a viver no Firebase
// Storage, atrás das mesmas regras de segurança que só deixam ler quem tem
// sessão iniciada no ZELO (ver storage.rules). Este módulo é a única porta
// de entrada partilhada para esses ficheiros — usa sempre a app do Firebase
// já autenticada em zelo_auth.js, nunca cria uma segunda ligação.
import { app } from './zelo_auth.js';
import { getStorage, ref, getBytes } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const storage = getStorage(app);

/** Lê e interpreta um JSON guardado no Storage (ex: 'relatorios/index.json').
 *  Devolve null se o ficheiro não existir, se a sessão não tiver permissão
 *  de leitura, ou em caso de falha de rede — nunca lança para o chamador. */
async function fetchRelatorioJSON(path){
  try{
    const bytes = await getBytes(ref(storage, path));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  }catch(e){
    console.warn('ZELO: não foi possível ler', path, e);
    return null;
  }
}

/** Descarrega um ficheiro do Storage (PDF, JSON, etc.) para o dispositivo,
 *  como um "Guardar como" normal do browser — sem nunca gerar um link
 *  público/partilhável (ao contrário de getDownloadURL()). */
async function baixarRelatorioFicheiro(path, nomeFicheiro, tipo){
  const bytes = await getBytes(ref(storage, path));
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

/** Abre um PDF do Storage numa nova aba. Abre a aba em branco de imediato
 *  (ainda de forma síncrona, dentro do clique do utilizador) para não ser
 *  bloqueada como pop-up, e só depois preenche o conteúdo assim que o
 *  ficheiro chega. */
async function abrirRelatorioPDF(path){
  const win = window.open('', '_blank', 'noopener');
  try{
    const bytes = await getBytes(ref(storage, path));
    const blob = new Blob([bytes], {type: 'application/pdf'});
    const url = URL.createObjectURL(blob);
    if(win) win.location = url;
    else window.open(url, '_blank', 'noopener');
  }catch(e){
    if(win) win.close();
    throw e;
  }
}

export { fetchRelatorioJSON, baixarRelatorioFicheiro, abrirRelatorioPDF };

window.ZeloRelatorios = { fetchRelatorioJSON, baixarRelatorioFicheiro, abrirRelatorioPDF };
