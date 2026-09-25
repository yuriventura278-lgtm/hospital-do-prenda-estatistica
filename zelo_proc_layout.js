// ── ZELO — Procedimentos de Enfermagem: cabeçalho arrumado ──
// Em todas as páginas de Procedimentos de Enfermagem:
//   • o cabeçalho fica só com o essencial (identificação, Início, Tema,
//     Última alteração e Terminar sessão): Guardar, PDF, Email e WhatsApp
//     saem de lá (Guardar continua na barra do fundo);
//   • PDF, Email e Histórico de alterações passam para o menu lateral, no
//     fim, antes da Cópia de Segurança (Exportar / Restaurar / Backup
//     automático, que já lá estavam);
//   • a data do registo fica bem visível no topo do conteúdo;
//   • sem o aviso de registo em atraso nem a nota "Sem dados para esta data";
//   • o rodapé do sistema não fica escondido atrás do menu nem da barra
//     de Guardar;
//   • letras do menu maiores (11,5 px).
// Só mexe na disposição: os botões continuam a chamar as funções da página.
(function () {
  if (window.__zeloProcLayout) return;
  window.__zeloProcLayout = true;

  var css = [
    '.nav-item .ni-label{font-size:11.5px !important;letter-spacing:.4px !important}',
    '.sb-sec{font-size:10px !important;padding-top:8px !important}',
    '.sb-hdr span{font-size:10px !important}',
    '#atraso-banner{display:none !important}',
    '.zelo-proc-oculto{display:none !important}',
    // Data do registo em destaque
    '.zp-data{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:var(--surface,#fff);border:1px solid var(--accent-ring,#B9C6D9);border-left:4px solid var(--accent,#3E5C87);border-radius:12px;padding:12px 16px;margin-bottom:18px;box-shadow:0 1px 3px rgba(15,23,42,.05)}',
    '.zp-data .zp-rot{font:800 .66rem Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#64748B)}',
    '.zp-data .hdr-date{gap:0 !important}',
    '.zp-data .hdr-date label{display:none !important}',
    '.zp-data input[type=date]{font:700 1rem ui-monospace,Consolas,monospace !important;padding:8px 12px !important;border-radius:10px !important;border:1.5px solid var(--accent-ring,#B9C6D9) !important;background:#F8FAFC !important;color:#132033 !important;opacity:1 !important;cursor:pointer}',
    '.zp-data .date-disp{font:700 .95rem Inter,Arial,sans-serif !important;color:#2B415E !important;opacity:1 !important;white-space:normal !important}',
    'html.dark .zp-data .date-disp{color:#BFD3EE !important}',
    // Rodapé por cima do menu fixo e acima da barra de Guardar
    '.zr-rodape{position:relative !important;z-index:120 !important;margin-bottom:44px !important}',
    '@media(max-width:768px){.zp-data{padding:10px 12px}.zp-data input[type=date]{font-size:.9rem !important}}'
  ].join('\n');

  function ic(id) { return '<svg class="svc-icon" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  function aplicar() {
    var header = document.querySelector('body > header');
    var sidebar = document.getElementById('sidebar');
    var main = document.querySelector('.main-content');
    if (!header || !sidebar || !main || document.getElementById('zp-estilos')) return;
    var st = document.createElement('style'); st.id = 'zp-estilos'; st.textContent = css; document.head.appendChild(st);

    // 1) Cabeçalho: sai Guardar, WhatsApp, Email, PDF e Histórico.
    header.querySelectorAll('.btn-save, .wa, .email, .pdf, #ver-historico-btn').forEach(function (b) { b.classList.add('zelo-proc-oculto'); });

    // 2) Data em destaque no topo do conteúdo.
    var hd = header.querySelector('.hdr-date'), disp = document.getElementById('date-disp');
    if (hd) {
      var barra = document.createElement('div'); barra.className = 'zp-data';
      barra.innerHTML = '<span class="zp-rot">Data do registo</span>';
      barra.appendChild(hd);
      if (disp) { disp.classList.remove('zc-fundo-claro'); disp.style.color = ''; barra.appendChild(disp); }
      barra.querySelectorAll('*').forEach(function (e) { e.style.removeProperty('color'); });
      main.insertBefore(barra, main.firstChild);
    }

    // 3) "Sem dados para esta data": não aparece.
    var sync = document.getElementById('sync-info');
    if (sync) {
      var ver = function () { sync.classList.toggle('zelo-proc-oculto', /sem dados/i.test(sync.textContent || '')); };
      ver();
      if (window.MutationObserver) new MutationObserver(ver).observe(sync, { childList: true, characterData: true, subtree: true });
    }

    // 4) Menu: secção "Documento" no fim (antes da Cópia de Segurança).
    var itens = [];
    if (typeof window.exportPDF === 'function') itens.push(['pdf', 'Exportar PDF', function () { window.exportPDF(); }]);
    if (typeof window.acaoEmail === 'function') itens.push(['mail', 'Enviar por Email', function () { window.acaoEmail(); }]);
    if (typeof window.abrirHistoricoAlteracoes === 'function') itens.push(['notes', 'Histórico de Alterações', function () { window.abrirHistoricoAlteracoes(); }]);
    if (itens.length && !document.getElementById('zp-menu-doc')) {
      var sec = document.createElement('div'); sec.id = 'zp-menu-doc';
      sec.innerHTML = '<hr class="sb-divider"><div class="sb-sec">Documento</div><div class="nav-list"></div>';
      var lista = sec.querySelector('.nav-list');
      itens.forEach(function (it) {
        var d = document.createElement('div'); d.className = 'nav-item';
        d.innerHTML = '<span class="ni-icon">' + (it[0] === 'mail' ? '<svg class="svc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>' : ic(it[0])) + '</span><span class="ni-label">' + it[1] + '</span>';
        d.addEventListener('click', it[2]);
        lista.appendChild(d);
      });
      var backup = document.getElementById('backup-menu-section');
      if (backup) sidebar.insertBefore(sec, backup); else sidebar.appendChild(sec);
      if (backup) sidebar.appendChild(backup); // Cópia de Segurança fica em último
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
  else aplicar();
})();
