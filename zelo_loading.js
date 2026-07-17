// ── ZELO — Indicadores de carregamento faseados ──
// Um indicador de "a carregar" não deve aparecer para operações quase
// instantâneas (evita o "flash" que mais confunde do que ajuda), e a
// mensagem deve corresponder à fase real em curso, não a um texto genérico
// fixo. Sequência: nada até 300ms; mensagem genérica dos 300ms ao 1s;
// mensagem específica da fase depois disso.
(function () {
  function iniciar(containerEl, textoEl, opcoes) {
    opcoes = opcoes || {};
    var generico = opcoes.generico || 'A carregar…';
    var fase = opcoes.fase || generico;
    var resolvido = false;

    if (containerEl) containerEl.style.visibility = 'hidden';
    if (textoEl) textoEl.textContent = generico;

    var t300 = setTimeout(function () {
      if (resolvido || !containerEl) return;
      containerEl.style.visibility = 'visible';
    }, 300);
    var t1000 = setTimeout(function () {
      if (resolvido || !textoEl) return;
      textoEl.textContent = fase;
    }, 1000);

    return {
      // Muda a mensagem para a fase seguinte (ex: de "A verificar sessão…"
      // para "A preparar o ambiente…"). Só tem efeito visível depois do
      // indicador já estar visível (ver acima) — antes disso fica em memória.
      fase: function (texto) {
        fase = texto;
        if (!resolvido && textoEl) textoEl.textContent = texto;
      },
      concluido: function () {
        resolvido = true;
        clearTimeout(t300);
        clearTimeout(t1000);
      }
    };
  }
  window.zeloLoadingFaseado = { iniciar: iniciar };
})();
