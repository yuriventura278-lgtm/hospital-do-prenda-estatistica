// zelo_auto_backup.js — Backup automático numa pasta do computador, por
// página, nas cadências Diário/Semanal/Mensal/Trimestral/Semestral/Anual.
//
// Usa a File System Access API (só Chrome/Edge — não existe no Firefox nem
// Safari). O administrador escolhe a pasta UMA VEZ; a autorização e o
// identificador da pasta ficam guardados em IndexedDB, por isso não é
// preciso escolher de novo em cada visita (a menos que o navegador revogue
// a autorização, caso em que se pede para renovar com um clique).
//
// Cada página que queira usar isto define, antes de chamar
// ZeloAutoBackup.iniciar(...), duas funções globais opcionais:
//   window.ZBK_getBackupJSON(cadencia, periodoRefISO) → { nome, conteudo }
//     (pode devolver directamente ou uma Promise que resolva para isso —
//     páginas cujos dados vêm do Firebase, não de localStorage, precisam
//     de ler de forma assíncrona; ambos os casos são suportados)
//   window.ZBK_gerarPDF(cadencia, periodoRefISO) → Promise<{ nome, blob }>
//   window.ZBK_periodosDisponiveis(cadencia) → lista de {chave,dataRefISO},
//     também podendo devolver uma Promise
// Se uma delas não existir, esse tipo de ficheiro simplesmente não é
// gravado nessa página (ex.: uma página sem PDF só grava o JSON).
//
// Como o navegador só corre este código enquanto a página está aberta,
// "automático à meia-noite" quer dizer: dispara sozinho se a página estiver
// aberta a essa hora, e faz sempre uma verificação de recuperação (para o
// período mais recente já terminado) sempre que a página é aberta —
// cobrindo o caso de o computador/navegador estarem desligados à meia-noite.
(function (global) {
  const DB_NAME = 'zelo_backup_db';
  const STORE = 'handles';
  const HANDLE_KEY = 'pasta_raiz';
  const VERIFICACAO_MS = 5 * 60 * 1000; // verifica a cada 5 minutos enquanto a página estiver aberta

  function _abrirDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function _guardarHandle(handle) {
    const db = await _abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function _obterHandleGuardado() {
    const db = await _abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function _limparHandle() {
    const db = await _abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function suportado() {
    return typeof window.showDirectoryPicker === 'function';
  }

  // Só pode ser chamado a partir de um clique do utilizador (exigência do navegador).
  async function escolherPasta() {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await _guardarHandle(handle);
    return handle;
  }

  async function esquecerPasta() {
    await _limparHandle();
  }

  async function _verificarPermissao(handle, pedirSePreciso) {
    const opts = { mode: 'readwrite' };
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if (!pedirSePreciso) return false;
    try {
      return (await handle.requestPermission(opts)) === 'granted';
    } catch (e) {
      return false; // requestPermission falha se não houver gesto do utilizador
    }
  }

  // pedirSePreciso=true só deve usar-se dentro de um clique do utilizador.
  async function obterPastaAtiva(pedirSePreciso) {
    const handle = await _obterHandleGuardado();
    if (!handle) return { estado: 'sem_pasta' };
    const ok = await _verificarPermissao(handle, !!pedirSePreciso).catch(() => false);
    if (!ok) return { estado: 'sem_permissao', handle };
    return { estado: 'ok', handle };
  }

  async function _subpasta(raiz, ...partes) {
    let atual = raiz;
    for (const p of partes) atual = await atual.getDirectoryHandle(p, { create: true });
    return atual;
  }

  async function _escreverFicheiro(pasta, nome, conteudo) {
    const fh = await pasta.getFileHandle(nome, { create: true });
    const writable = await fh.createWritable();
    await writable.write(conteudo);
    await writable.close();
  }

  const NOMES_CADENCIA = {
    diario: 'Diario', semanal: 'Semanal', mensal: 'Mensal',
    trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
  };

  // Utilitário público — grava um único ficheiro (ex.: um PDF gerado por um
  // botão "Exportar PDF" manual) na mesma pasta/estrutura de subpastas do
  // backup automático, sem depender do fluxo de cadências/marcas. Usa-se
  // sempre que a página quer que uma exportação manual fique também
  // organizada na pasta de backup, além do download normal do navegador.
  // subpasta pode ser um nome da NOMES_CADENCIA (ex. 'Diario') ou qualquer
  // outro nome de pasta.
  async function gravarNaPasta(slug, subpasta, nome, conteudo) {
    const pasta = await obterPastaAtiva(false);
    if (pasta.estado !== 'ok') return { ok: false, motivo: pasta.estado };
    try {
      const raizApp = await _subpasta(pasta.handle, 'ZELO_Backups', slug, subpasta);
      await _escreverFicheiro(raizApp, nome, conteudo);
      return { ok: true };
    } catch (e) {
      console.warn('[ZeloAutoBackup] gravarNaPasta falhou', e);
      return { ok: false, motivo: 'erro' };
    }
  }

  // ── Cálculo do "período de referência" já TERMINADO mais recente, para
  // cada cadência, a partir de "agora". O backup diário de um dia só é
  // feito depois de esse dia ter terminado (ou seja, no dia seguinte).
  function _pad2(n) { return String(n).padStart(2, '0'); }
  function _ymd(d) { return d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate()); }

  function _semanaISO(d) {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const diaSemana = (dt.getUTCDay() + 6) % 7; // segunda=0
    dt.setUTCDate(dt.getUTCDate() - diaSemana + 3);
    const primeiraQuinta = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
    const semana = 1 + Math.round(((dt - primeiraQuinta) / 86400000 - 3 + ((primeiraQuinta.getUTCDay() + 6) % 7)) / 7);
    return dt.getUTCFullYear() + '-W' + _pad2(semana);
  }

  function _periodoAtual(cadencia, agora) {
    switch (cadencia) {
      case 'diario': return _ymd(agora);
      case 'semanal': return _semanaISO(agora);
      case 'mensal': return agora.getFullYear() + '-' + _pad2(agora.getMonth() + 1);
      case 'trimestral': return agora.getFullYear() + '-Q' + (Math.floor(agora.getMonth() / 3) + 1);
      case 'semestral': return agora.getFullYear() + '-S' + (agora.getMonth() < 6 ? 1 : 2);
      case 'anual': return String(agora.getFullYear());
    }
  }

  // Devolve { chave, dataRefISO } do último período TERMINADO (anterior ao
  // período atual em curso) — é esse período completo que se grava.
  function _ultimoPeriodoTerminado(cadencia, agora) {
    const ontem = new Date(agora); ontem.setDate(ontem.getDate() - 1);
    switch (cadencia) {
      case 'diario':
        return { chave: _ymd(ontem), dataRefISO: _ymd(ontem) };
      case 'semanal': {
        const diaSemanaAtual = (agora.getDay() + 6) % 7;
        const inicioSemanaAtual = new Date(agora); inicioSemanaAtual.setDate(agora.getDate() - diaSemanaAtual);
        const fimSemanaAnterior = new Date(inicioSemanaAtual); fimSemanaAnterior.setDate(fimSemanaAnterior.getDate() - 1);
        return { chave: _semanaISO(fimSemanaAnterior), dataRefISO: _ymd(fimSemanaAnterior) };
      }
      case 'mensal': {
        const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0);
        return { chave: fimMesAnterior.getFullYear() + '-' + _pad2(fimMesAnterior.getMonth() + 1), dataRefISO: _ymd(fimMesAnterior) };
      }
      case 'trimestral': {
        const trimAtual = Math.floor(agora.getMonth() / 3);
        const fimTrimAnterior = new Date(agora.getFullYear(), trimAtual * 3, 0);
        return { chave: fimTrimAnterior.getFullYear() + '-Q' + (Math.floor(fimTrimAnterior.getMonth() / 3) + 1), dataRefISO: _ymd(fimTrimAnterior) };
      }
      case 'semestral': {
        const semAtual = agora.getMonth() < 6 ? 1 : 2;
        const fimSemAnterior = semAtual === 1 ? new Date(agora.getFullYear() - 1, 11, 31) : new Date(agora.getFullYear(), 5, 30);
        return { chave: fimSemAnterior.getFullYear() + '-S' + (fimSemAnterior.getMonth() < 6 ? 1 : 2), dataRefISO: _ymd(fimSemAnterior) };
      }
      case 'anual': {
        const fimAnoAnterior = new Date(agora.getFullYear() - 1, 11, 31);
        return { chave: String(fimAnoAnterior.getFullYear()), dataRefISO: _ymd(fimAnoAnterior) };
      }
    }
  }

  function _chaveMarca(slug, cadencia) { return 'zbk_marca_' + slug + '_' + cadencia; }

  // Fingerprint rápido (não-criptográfico, FNV-1a) do conteúdo — usado só
  // para detetar se os dados de um período mudaram desde o último backup,
  // não para segurança.
  function _hashTexto(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16);
  }
  async function _hashBlob(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16);
  }
  function _chaveHashJson(slug, cadencia, chave) { return 'zbk_hash_json_' + slug + '_' + cadencia + '_' + chave; }
  function _chaveHashPdf(slug, cadencia, chave) { return 'zbk_hash_pdf_' + slug + '_' + cadencia + '_' + chave; }

  // Grava (ou regrava) o JSON e o PDF de um período — mas só escreve
  // ficheiro quando o conteúdo realmente mudou desde a última vez (compara
  // um hash do conteúdo, guardado em localStorage). Isto permite que um
  // registo editado depois de já ter sido gravado seja atualizado no
  // próximo ciclo de verificação, em vez de ficar "esquecido" com a versão
  // antiga para sempre. O PDF (quando a página o gera automaticamente) só
  // é recriado se o JSON tiver mudado, para não regenerar PDFs caros a
  // cada verificação quando nada mudou.
  async function _executarBackupCadencia(slug, cadencia, chave, dataRefISO) {
    const pasta = await obterPastaAtiva(false);
    if (pasta.estado !== 'ok') return { ok: false, motivo: pasta.estado };
    const raizApp = await _subpasta(pasta.handle, 'ZELO_Backups', slug, NOMES_CADENCIA[cadencia]);
    let gravouJson = false, gravouPdf = false, tentouAlgo = false, jsonMudou = false;
    try {
      if (typeof global.ZBK_getBackupJSON === 'function') {
        const r = await global.ZBK_getBackupJSON(cadencia, dataRefISO);
        if (r && r.conteudo && Object.keys(r.conteudo).length) {
          tentouAlgo = true;
          const hashConteudo = _hashTexto(JSON.stringify(r.conteudo));
          const chaveHash = _chaveHashJson(slug, cadencia, chave);
          if (localStorage.getItem(chaveHash) !== hashConteudo) {
            jsonMudou = true;
            const texto = JSON.stringify({ version: '5', exported: new Date().toISOString(), data: r.conteudo }, null, 2);
            await _escreverFicheiro(raizApp, r.nome, texto);
            localStorage.setItem(chaveHash, hashConteudo);
            gravouJson = true;
          }
        }
      }
    } catch (e) { console.warn('[ZeloAutoBackup] falha ao gravar JSON', e); }
    if (jsonMudou) {
      try {
        if (typeof global.ZBK_gerarPDF === 'function') {
          const r = await global.ZBK_gerarPDF(cadencia, dataRefISO);
          if (r && r.blob) {
            tentouAlgo = true;
            await _escreverFicheiro(raizApp, r.nome, r.blob);
            localStorage.setItem(_chaveHashPdf(slug, cadencia, chave), await _hashBlob(r.blob));
            gravouPdf = true;
          }
        }
      } catch (e) { console.warn('[ZeloAutoBackup] falha ao gravar PDF', e); }
    }
    return { ok: tentouAlgo, gravouJson, gravouPdf };
  }

  const CADENCIAS = ['diario', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual'];

  // Períodos a considerar para uma cadência: se a página fornecer
  // window.ZBK_periodosDisponiveis(cadencia) — lista de { chave, dataRefISO }
  // de TODOS os períodos já terminados que têm dados por gravar — usa-se essa
  // lista completa (permite recuperar o histórico todo na primeira
  // configuração da pasta, não só o período mais recente). Sem essa função,
  // cai-se apenas no último período terminado (comportamento mínimo).
  async function _periodosAConsiderar(slug, cadencia, agora) {
    if (typeof global.ZBK_periodosDisponiveis === 'function') {
      try {
        const lista = (await global.ZBK_periodosDisponiveis(cadencia)) || [];
        return lista.filter(p => p && p.chave && p.dataRefISO);
      } catch (e) { console.warn('[ZeloAutoBackup] ZBK_periodosDisponiveis falhou', e); }
    }
    return [_ultimoPeriodoTerminado(cadencia, agora)];
  }

  // Verifica TODOS os períodos disponíveis em cada cadência — não só os
  // que ainda não tinham sido gravados. Um período já gravado só é
  // regravado se o conteúdo tiver mudado (ver _executarBackupCadencia);
  // caso contrário fica marcado como "sem alterações" sem tocar no
  // ficheiro. Isto garante que editar um registo já feito atualiza o
  // backup no ciclo seguinte, em vez de ficar preso na versão antiga.
  async function verificarEExecutar(slug) {
    const agora = new Date();
    const resultado = {};
    for (const cadencia of CADENCIAS) {
      const periodos = await _periodosAConsiderar(slug, cadencia, agora);
      if (periodos.length === 0) { resultado[cadencia] = 'sem dados'; continue; }
      let atualizados = 0, semAlteracoes = 0, falhas = 0, ultimoMotivo = null;
      for (const p of periodos) {
        const r = await _executarBackupCadencia(slug, cadencia, p.chave, p.dataRefISO);
        if (r.ok) {
          localStorage.setItem(_chaveMarca(slug, cadencia), p.chave); // última chave processada, para a UI
          if (r.gravouJson || r.gravouPdf) atualizados++; else semAlteracoes++;
        } else {
          falhas++; ultimoMotivo = r.motivo;
        }
      }
      if (atualizados > 0) {
        resultado[cadencia] = `atualizado ${atualizados}` + (semAlteracoes ? `, ${semAlteracoes} sem alterações` : '') + (falhas ? ` (${falhas} falhou)` : '');
      } else if (semAlteracoes > 0) {
        resultado[cadencia] = `sem alterações (${semAlteracoes})` + (falhas ? ` (${falhas} falhou)` : '');
      } else {
        resultado[cadencia] = 'pendente — ' + ultimoMotivo;
      }
    }
    return resultado;
  }

  function iniciar(slug) {
    if (!suportado()) return;
    // Primeira verificação pouco depois de a página abrir (recuperação de
    // períodos terminados enquanto ninguém tinha o sistema aberto).
    setTimeout(() => { verificarEExecutar(slug).catch(() => {}); }, 4000);
    // Verificações periódicas — cobre o caso de a meia-noite passar com a
    // página aberta (só pode ser detetado enquanto está aberta).
    setInterval(() => { verificarEExecutar(slug).catch(() => {}); }, VERIFICACAO_MS);
  }

  // ── Fábrica de ZBK_getBackupJSON/ZBK_periodosDisponiveis para páginas cujos
  // dados diários vivem no Firebase Realtime Database, num nó em que cada
  // filho directo é uma data "AAAA-MM-DD" (ex.: registos_sistemas_locais/
  // laboratorio/2026-08-10) — o mesmo formato usado pela sincronização em
  // tempo real (onValue) que estas páginas já têm. Lê o nó inteiro UMA vez
  // (com cache de 60s, partilhada entre as 6 cadências e todos os períodos
  // verificados no mesmo ciclo) em vez de um pedido por dia.
  function criarBackupFirebase(caminhoBase) {
    let cacheTodos = null, cachePromessa = null, cacheTs = 0;
    const CACHE_MS = 60 * 1000;

    async function _lerTodos() {
      const agora = Date.now();
      if (cacheTodos && (agora - cacheTs) < CACHE_MS) return cacheTodos;
      if (cachePromessa) return cachePromessa;
      cachePromessa = (async () => {
        try {
          const dados = (typeof global.__fbGet === 'function') ? await global.__fbGet(caminhoBase) : null;
          cacheTodos = dados || {};
        } catch (e) {
          console.warn('[ZeloAutoBackup] falha ao ler ' + caminhoBase, e);
          cacheTodos = cacheTodos || {};
        }
        cacheTs = Date.now();
        cachePromessa = null;
        return cacheTodos;
      })();
      return cachePromessa;
    }

    function _limitesDoPeriodo(cadencia, fimISO) {
      const fim = new Date(fimISO + 'T00:00:00');
      let inicio;
      switch (cadencia) {
        case 'diario': inicio = new Date(fim); break;
        case 'semanal': inicio = new Date(fim); inicio.setDate(inicio.getDate() - 6); break;
        case 'mensal': inicio = new Date(fim.getFullYear(), fim.getMonth(), 1); break;
        case 'trimestral': inicio = new Date(fim.getFullYear(), Math.floor(fim.getMonth() / 3) * 3, 1); break;
        case 'semestral': inicio = new Date(fim.getFullYear(), fim.getMonth() < 6 ? 0 : 6, 1); break;
        case 'anual': inicio = new Date(fim.getFullYear(), 0, 1); break;
      }
      return { inicioISO: _ymd(inicio), fimISO: _ymd(fim) };
    }
    function _fimDoPeriodoContendo(cadencia, dataISO) {
      const d = new Date(dataISO + 'T00:00:00');
      let fim;
      switch (cadencia) {
        case 'diario': fim = new Date(d); break;
        case 'semanal': { const dow = (d.getDay() + 6) % 7; fim = new Date(d); fim.setDate(fim.getDate() + (6 - dow)); break; }
        case 'mensal': fim = new Date(d.getFullYear(), d.getMonth() + 1, 0); break;
        case 'trimestral': fim = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0); break;
        case 'semestral': fim = new Date(d.getFullYear(), d.getMonth() < 6 ? 6 : 12, 0); break;
        case 'anual': fim = new Date(d.getFullYear(), 12, 0); break;
      }
      return _ymd(fim);
    }

    async function ZBK_periodosDisponiveis(cadencia) {
      const todos = await _lerTodos();
      const hojeISO = _ymd(new Date());
      const vistos = {};
      Object.keys(todos).forEach(function (d) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
        if (!todos[d]) return;
        const fimISO = _fimDoPeriodoContendo(cadencia, d);
        if (fimISO >= hojeISO) return; // nunca o período em curso
        const chave = _periodoAtual(cadencia, new Date(fimISO + 'T00:00:00'));
        vistos[chave] = fimISO;
      });
      return Object.keys(vistos).map(function (chave) { return { chave: chave, dataRefISO: vistos[chave] }; });
    }

    async function ZBK_getBackupJSON(cadencia, fimISO) {
      const limites = _limitesDoPeriodo(cadencia, fimISO);
      const todos = await _lerTodos();
      const registos = {};
      Object.keys(todos).forEach(function (d) {
        if (d >= limites.inicioISO && d <= limites.fimISO && todos[d]) registos[d] = todos[d];
      });
      const nomeBase = caminhoBase.split('/').pop();
      return { nome: 'backup_' + nomeBase + '_' + cadencia + '_' + limites.fimISO + '.json', conteudo: registos };
    }

    return { ZBK_getBackupJSON: ZBK_getBackupJSON, ZBK_periodosDisponiveis: ZBK_periodosDisponiveis };
  }

  // ── Widget de UI partilhado: injecta o modal "Backup Automático" (uma
  // única vez por página) e um botão de atalho no cabeçalho, ligados ao
  // slug indicado. Poupa cada página de reimplementar o mesmo modal HTML/
  // CSS/JS — só precisa de chamar ZeloAutoBackup.montarUI('slug').
  const _ROTULOS_CADENCIA = { diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };

  function _encontrarInsercaoBotao() {
    const grupo = document.querySelector('header .header-right, header .hdr-actions, header .header-actions, header .tb-right, header .h-right, .zelo-topbar .tb-right');
    if (grupo) return { pai: grupo, antesDe: null };
    const inicio = document.querySelector('header a[href="index.html"], .topbar a[href="index.html"], .hi a[href="index.html"], .top a[href="index.html"]');
    if (inicio && inicio.parentNode) return { pai: inicio.parentNode, antesDe: inicio };
    const cabecalho = document.querySelector('header, .zelo-topbar, .topbar, .top');
    if (cabecalho) return { pai: cabecalho, antesDe: null };
    return null;
  }

  function montarUI(slug) {
    if (document.getElementById('zbkModal')) return; // já montado (ex.: chamada dupla)

    const modal = document.createElement('div');
    modal.id = 'zbkModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(13,27,62,.72);backdrop-filter:blur(8px);z-index:9500;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:20px;width:100%;max-width:440px;box-shadow:0 16px 48px rgba(13,27,62,.25);max-height:90vh;overflow:auto;font-family:system-ui,sans-serif;">' +
        '<div style="padding:20px 22px 4px;display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<h3 style="font-size:1rem;font-weight:800;color:#0F172A;margin:0;">Backup Automático</h3>' +
          '<button type="button" id="zbkFechar" aria-label="Fechar" style="background:#F1F5F9;border:none;border-radius:9px;width:30px;height:30px;cursor:pointer;color:#334155;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
        '<div style="padding:10px 22px 22px;">' +
          '<p id="zbkSuporte" style="display:none;color:#DC2626;font-size:.75rem;">O seu navegador não suporta esta funcionalidade — funciona apenas no Google Chrome ou Microsoft Edge (computador).</p>' +
          '<div id="zbkCorpo">' +
            '<p style="font-size:.75rem;color:#64748B;line-height:1.5;margin:0;">Escolha uma pasta no computador. O sistema grava automaticamente uma cópia em JSON dos registos guardados — Diário, Semanal, Mensal, Trimestral, Semestral e Anual — sempre que esta página estiver aberta à volta da meia-noite, ou assim que a abrir de novo.</p>' +
            '<p style="font-size:.7rem;color:#64748B;line-height:1.5;margin:8px 0 0;background:#F8FAFC;border-radius:8px;padding:8px 10px;">🔒 Queres que a pasta escolhida fique protegida contra remoção acidental e só se abra com um código? <a href="pasta_backup_protegida/LEIA-ME.txt" target="_blank" rel="noopener" style="color:#1E40AF;font-weight:700;">Ver instruções (Windows)</a>.</p>' +
            '<div id="zbkStatus" style="margin:10px 0;padding:10px 12px;background:#F8FAFC;border-radius:10px;font-size:.72rem;color:#334155;"><div id="zbkPastaNome">A verificar…</div></div>' +
            '<div id="zbkCadencias" style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font-size:.68rem;color:#64748B;margin-bottom:12px;"></div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
              '<button type="button" id="zbkEscolher" style="width:100%;padding:13px;background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;color:#1E40AF;font-size:.85rem;font-weight:700;font-family:inherit;cursor:pointer;">Escolher pasta</button>' +
              '<button type="button" id="zbkVerificar" style="width:100%;padding:13px;background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:10px;color:#166534;font-size:.85rem;font-weight:700;font-family:inherit;cursor:pointer;">Verificar agora</button>' +
              '<button type="button" id="zbkEsquecer" style="width:100%;padding:13px;background:#FEF2F2;border:1.5px solid #FECACA;border-radius:10px;color:#991B1B;font-size:.85rem;font-weight:700;font-family:inherit;cursor:pointer;">Esquecer pasta</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    function abrir() { modal.style.display = 'flex'; atualizarStatus(); }
    function fechar() { modal.style.display = 'none'; }
    modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
    document.getElementById('zbkFechar').addEventListener('click', fechar);

    async function atualizarStatus() {
      const suporteMsg = document.getElementById('zbkSuporte');
      const corpo = document.getElementById('zbkCorpo');
      if (!suportado()) { suporteMsg.style.display = 'block'; corpo.style.display = 'none'; return; }
      suporteMsg.style.display = 'none';
      corpo.style.display = 'block';
      const pasta = await obterPastaAtiva(false);
      const nomeEl = document.getElementById('zbkPastaNome');
      if (pasta.estado === 'ok') nomeEl.textContent = '📁 Pasta escolhida: ' + pasta.handle.name;
      else if (pasta.estado === 'sem_permissao') nomeEl.textContent = '⚠️ Autorização da pasta expirou — clique em "Escolher pasta" para renovar.';
      else nomeEl.textContent = 'Nenhuma pasta escolhida ainda.';
      const cadEl = document.getElementById('zbkCadencias');
      cadEl.innerHTML = Object.keys(_ROTULOS_CADENCIA).map(function (c) {
        const marca = localStorage.getItem(_chaveMarca(slug, c));
        return '<div>' + _ROTULOS_CADENCIA[c] + ': ' + (marca ? '✅ ' + marca : '— ainda não') + '</div>';
      }).join('');
    }

    document.getElementById('zbkEscolher').addEventListener('click', async function () {
      try {
        await escolherPasta();
        atualizarStatus();
        verificarEExecutar(slug).then(atualizarStatus);
      } catch (e) { /* utilizador cancelou o selector — nada a fazer */ }
    });
    document.getElementById('zbkEsquecer').addEventListener('click', async function () {
      await esquecerPasta();
      atualizarStatus();
    });
    document.getElementById('zbkVerificar').addEventListener('click', async function () {
      await verificarEExecutar(slug);
      atualizarStatus();
    });

    const local = _encontrarInsercaoBotao();
    if (local) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'zbkAbrirBtn';
      btn.title = 'Backup automático';
      btn.setAttribute('aria-label', 'Backup automático');
      btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:5px;color:inherit;background:rgba(120,120,120,.12);border:1px solid rgba(120,120,120,.28);padding:7px 12px;border-radius:100px;font-size:.72rem;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;';
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/></svg> Backup';
      btn.addEventListener('click', abrir);
      if (local.antesDe && local.antesDe.parentNode === local.pai) local.pai.insertBefore(btn, local.antesDe);
      else local.pai.appendChild(btn);
    }
  }

  global.ZeloAutoBackup = {
    suportado,
    escolherPasta,
    esquecerPasta,
    obterPastaAtiva,
    verificarEExecutar,
    criarBackupFirebase,
    montarUI,
    iniciar,
    gravarNaPasta,
    _periodoAtual, _ultimoPeriodoTerminado, // expostas para testes
  };
})(window);
