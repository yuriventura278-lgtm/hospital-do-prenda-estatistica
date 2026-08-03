// zelo_merge.js — mesclagem campo-a-campo entre dispositivos, para a família
// "banco" (um único snapshot por dia). Generaliza o algoritmo já provado em
// procedimentos_enfermagem_geral.html (_resolverCampo/_mesclarDadosDia) para
// campos escalares/objetos chave-valor (mesclarChaveValor) e para listas de
// registos com id próprio, tipo óbitos/operados/transferências
// (mesclarListaPorId) — sem isto, receber um snapshot remoto mais recente
// substituía sempre o dia inteiro, apagando silenciosamente qualquer edição
// concorrente de outro dispositivo.
(function (global) {

  // Decide o valor final de UM campo. Quando os dois lados têm carimbo de
  // hora próprio para este campo (gravações feitas depois desta
  // funcionalidade existir), vence sempre o carimbo mais recente — seja qual
  // for o valor, incluindo null (uma eliminação deliberada vence
  // legitimamente um valor antigo doutro dispositivo). Só quando NENHUM dos
  // lados tem carimbo para este campo (registos antigos, de antes desta
  // funcionalidade) é que se usa a regra de segurança anterior: um campo
  // vazio nunca vence um campo preenchido.
  function resolverCampo(lv, rv, ltTempo, rtTempo, remotoMaisRecente) {
    if (ltTempo !== undefined || rtTempo !== undefined) {
      if (rtTempo !== undefined && (ltTempo === undefined || rtTempo > ltTempo)) {
        return { valor: rv === undefined ? null : rv, ts: rtTempo };
      }
      return { valor: lv === undefined ? null : lv, ts: ltTempo };
    }
    if (lv === undefined || lv === null) return { valor: (rv === undefined ? null : rv), ts: undefined };
    if (rv === undefined || rv === null) return { valor: lv, ts: undefined };
    if (lv === rv) return { valor: lv, ts: undefined };
    return { valor: remotoMaisRecente ? rv : lv, ts: undefined };
  }

  // Mescla um objeto plano chave→valor (ex. campos escalares de topo de um
  // banco, ou tac/eco/rx da Imagiologia — chave = nome do exame, catálogo
  // fixo). `camposTsLocal`/`camposTsRemoto` são mapas { chave: timestamp }
  // com o carimbo de cada campo; `prefixo` é opcional, usado para compor a
  // chave do carimbo quando se mescla mais do que uma secção (ex. 'tac',
  // 'eco', 'rx') com o mesmo conjunto de camposTs partilhado.
  function mesclarChaveValor(localObj, remotoObj, camposTsLocal, camposTsRemoto, prefixo, remotoMaisRecente) {
    const l = localObj || {};
    const r = remotoObj || {};
    const ltTs = camposTsLocal || {};
    const rtTs = camposTsRemoto || {};
    const chaves = new Set([...Object.keys(l), ...Object.keys(r)]);
    const merged = {};
    const tsAtualizados = {};
    chaves.forEach(function (k) {
      const chaveTs = prefixo ? (prefixo + '|' + k) : k;
      const resultado = resolverCampo(l[k], r[k], ltTs[chaveTs], rtTs[chaveTs], remotoMaisRecente);
      merged[k] = resultado.valor;
      if (resultado.ts !== undefined) tsAtualizados[chaveTs] = resultado.ts;
    });
    return { valor: merged, camposTs: tsAtualizados };
  }

  // Mescla uma lista de registos (cada um com campo `id` estável) entre
  // local e remoto. Uma entrada só existe num lado → mantém-se (é nova,
  // ainda não chegou ao outro dispositivo). Existe nos dois → vence a
  // entrada com `_ts` mais recente, por inteiro (não campo a campo dentro do
  // registo — estas entradas são preenchidas de uma vez só num
  // formulário/modal, nunca editadas campo a campo em simultâneo por dois
  // dispositivos, ao contrário dos Procedimentos). Uma entrada eliminada
  // (presente num tombstone `{ [id]: timestamp da eliminação }`) só
  // desaparece se esse timestamp for mais recente do que o `_ts` da entrada
  // no outro lado — caso contrário, o outro lado editou-a DEPOIS de a
  // termos eliminado localmente, por isso a reedição vence e ela reaparece.
  function mesclarListaPorId(localArr, remotoArr, tombstonesLocal, tombstonesRemoto) {
    const l = localArr || [];
    const r = remotoArr || [];
    const tl = tombstonesLocal || {};
    const tr = tombstonesRemoto || {};

    const porId = {};
    l.forEach(function (item) { if (item && item.id !== undefined) { porId[item.id] = porId[item.id] || {}; porId[item.id].local = item; } });
    r.forEach(function (item) { if (item && item.id !== undefined) { porId[item.id] = porId[item.id] || {}; porId[item.id].remoto = item; } });

    const tombstonesUniao = Object.assign({}, tl);
    Object.keys(tr).forEach(function (id) {
      if (tombstonesUniao[id] === undefined || tr[id] > tombstonesUniao[id]) tombstonesUniao[id] = tr[id];
    });

    const resultado = [];
    const tombstonesFinais = {};
    Object.keys(porId).forEach(function (id) {
      const par = porId[id];
      const vencedor = (par.local && par.remoto)
        ? (((par.remoto._ts || 0) > (par.local._ts || 0)) ? par.remoto : par.local)
        : (par.local || par.remoto);
      const eliminadoTs = tombstonesUniao[id];
      // Uma eliminação só vence se for mais recente do que a última edição
      // conhecida da entrada — caso contrário, alguém reeditou-a DEPOIS de a
      // termos apagado localmente, e essa reedição deve prevalecer (a entrada
      // reaparece). Só se mantém o tombstone (para o próximo ciclo) enquanto a
      // eliminação continuar a vencer — sem isto, cresceria para sempre.
      if (eliminadoTs !== undefined && eliminadoTs >= (vencedor._ts || 0)) {
        tombstonesFinais[id] = eliminadoTs;
        return;
      }
      resultado.push(vencedor);
    });
    return { lista: resultado, tombstones: tombstonesFinais };
  }

  global.ZeloMerge = { resolverCampo, mesclarChaveValor, mesclarListaPorId };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.ZeloMerge;
})(typeof window !== 'undefined' ? window : globalThis);
