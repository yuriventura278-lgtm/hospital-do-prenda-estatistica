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
//   window.ZBK_gerarPDF(cadencia, periodoRefISO) → Promise<{ nome, blob }>
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

  async function _executarBackupCadencia(slug, cadencia, dataRefISO) {
    const pasta = await obterPastaAtiva(false);
    if (pasta.estado !== 'ok') return { ok: false, motivo: pasta.estado };
    const raizApp = await _subpasta(pasta.handle, 'ZELO_Backups', slug, NOMES_CADENCIA[cadencia]);
    let gravouJson = false, gravouPdf = false;
    try {
      if (typeof global.ZBK_getBackupJSON === 'function') {
        const r = global.ZBK_getBackupJSON(cadencia, dataRefISO);
        if (r && r.conteudo && Object.keys(r.conteudo).length) {
          await _escreverFicheiro(raizApp, r.nome, JSON.stringify({ version: '5', exported: new Date().toISOString(), data: r.conteudo }, null, 2));
          gravouJson = true;
        }
      }
    } catch (e) { console.warn('[ZeloAutoBackup] falha ao gravar JSON', e); }
    try {
      if (typeof global.ZBK_gerarPDF === 'function') {
        const r = await global.ZBK_gerarPDF(cadencia, dataRefISO);
        if (r && r.blob) {
          await _escreverFicheiro(raizApp, r.nome, r.blob);
          gravouPdf = true;
        }
      }
    } catch (e) { console.warn('[ZeloAutoBackup] falha ao gravar PDF', e); }
    return { ok: gravouJson || gravouPdf, gravouJson, gravouPdf };
  }

  const CADENCIAS = ['diario', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual'];

  function _chaveFeitaMarca(slug, cadencia, chave) {
    return 'zbk_feito_' + slug + '_' + cadencia + '_' + chave;
  }

  // Períodos a considerar para uma cadência: se a página fornecer
  // window.ZBK_periodosDisponiveis(cadencia) — lista de { chave, dataRefISO }
  // de TODOS os períodos já terminados que têm dados por gravar — usa-se essa
  // lista completa (permite recuperar o histórico todo na primeira
  // configuração da pasta, não só o período mais recente). Sem essa função,
  // cai-se apenas no último período terminado (comportamento mínimo).
  function _periodosAConsiderar(slug, cadencia, agora) {
    if (typeof global.ZBK_periodosDisponiveis === 'function') {
      try {
        const lista = global.ZBK_periodosDisponiveis(cadencia) || [];
        return lista.filter(p => p && p.chave && p.dataRefISO);
      } catch (e) { console.warn('[ZeloAutoBackup] ZBK_periodosDisponiveis falhou', e); }
    }
    return [_ultimoPeriodoTerminado(cadencia, agora)];
  }

  async function verificarEExecutar(slug) {
    const agora = new Date();
    const resultado = {};
    for (const cadencia of CADENCIAS) {
      const periodos = _periodosAConsiderar(slug, cadencia, agora);
      const pendentes = periodos.filter(p => !localStorage.getItem(_chaveFeitaMarca(slug, cadencia, p.chave)));
      if (pendentes.length === 0) { resultado[cadencia] = 'já feito'; continue; }
      let gravados = 0, falhas = 0, ultimoMotivo = null;
      for (const p of pendentes) {
        const r = await _executarBackupCadencia(slug, cadencia, p.dataRefISO);
        if (r.ok) {
          localStorage.setItem(_chaveFeitaMarca(slug, cadencia, p.chave), '1');
          localStorage.setItem(_chaveMarca(slug, cadencia), p.chave); // última chave feita, para a UI
          gravados++;
        } else {
          falhas++; ultimoMotivo = r.motivo;
        }
      }
      resultado[cadencia] = gravados > 0
        ? `gravado ${gravados}/${pendentes.length}` + (falhas ? ` (${falhas} pendente)` : '')
        : 'pendente — ' + ultimoMotivo;
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

  global.ZeloAutoBackup = {
    suportado,
    escolherPasta,
    esquecerPasta,
    obterPastaAtiva,
    verificarEExecutar,
    iniciar,
    _periodoAtual, _ultimoPeriodoTerminado, // expostas para testes
  };
})(window);
