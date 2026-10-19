"use strict";
/* Grupo Kambas — interface (vendas, documentos, stock, relatórios, utilizadores).
   Dois modos:
   - Supabase (window.KAMBAS_SUPABASE definido): login, dados partilhados e sincronizados.
   - Demonstração (sem Supabase): tudo neste navegador, com utilizadores fictícios. */
const SEED = /*__SEED__*/null;
const LOGO_AZUL = "__LOGO_AZUL__";
const SUPA = window.KAMBAS_SUPABASE || null;
const DEMO = !SUPA;
const CHAVE = "grupo-kambas-demo-v2";
const DOMINIO_LOGIN = "utilizadores.grupokambas.local";
let E = null;            // estado: eu, config, produtos, clientes, faturas (documentos), movimentos, utilizadores
let sb = null;           // cliente Supabase

/* ============================================================ utilidades */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const kz = n => fmt(n) + " Kz";
const nf = n => String(n).padStart(4, "0");
const pad = n => String(n).padStart(2, "0");
const isoLocal = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const diaDe = iso => iso.slice(0, 10);
const hoje = () => isoLocal().slice(0, 10);
const dataPt = iso => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";
const horaPt = iso => iso ? iso.slice(11, 16) : "";
const icon = n => `<svg class="i"><use href="#i-${n}"/></svg>`;
const inteiro = v => { const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10); return Number.isFinite(n) ? n : NaN; };
const byId = (lista, id) => lista.find(x => String(x.id) === String(id));
const produto = id => byId(E.produtos, id);
const utilizador = id => (E.utilizadores || []).find(u => u.id === id);
const precoPara = (p, q) => (p.tier_qtd && q >= p.tier_qtd ? p.tier_preco : p.preco);
const estadoStock = p => p.tipo !== "produto" ? null : p.stock <= 0 ? "bad" : p.stock <= p.stock_min ? "warn" : "ok";
const rotuloStock = p => ({ bad: "Esgotado", warn: "Stock baixo", ok: "Disponível" })[estadoStock(p)];
function precoTexto(p) {
  if (p.modo === "consulta") return `<small>Preço</small>Por consulta`;
  if (p.modo === "a_partir") return `<small>A partir de</small>${kz(p.preco)}`;
  return kz(p.preco);
}
const precoCurto = p => p.modo === "consulta" ? "Por consulta" : (p.modo === "a_partir" ? "desde " : "") + kz(p.preco);

const TIPOS_DOC = { FR: "Fatura-Recibo", FT: "Fatura", PP: "Fatura Pró-forma" };
const TITULO_DOC = { FR: "FATURA-RECIBO", FT: "FATURA", PP: "FATURA PRÓ-FORMA" };
const COR_DOC = { FR: [30, 138, 90], FT: [168, 100, 0], PP: [11, 106, 128] };
function significadoDoc(f) {
  if (f.estado === "anulada") return "Documento anulado: sem valor";
  if (f.estado === "convertida") return "Pró-forma já convertida em fatura";
  if (f.tipo === "FR") return "Pagamento recebido: vale como fatura e recibo";
  if (f.tipo === "FT") return f.pago ? `Paga em ${dataPt(f.pago_em)}` : "Pagamento pendente";
  return "Orçamento: não serve de fatura nem de recibo";
}
/* campo de senha com botão para mostrar/esconder */
function campoSenha(id, rotulo, auto, extra = "", nome = "") {
  return `<label class="field"><span>${rotulo}</span><span class="senha"><input class="f" id="${id}" ${nome ? `name="${nome}"` : ""} type="password" autocomplete="${auto}" ${extra}><button type="button" class="ver-senha" data-act="ver-senha" data-alvo="${id}" aria-label="Mostrar senha" aria-pressed="false">${icon("olho")}</button></span></label>`;
}
/* pede ao navegador/telemóvel para guardar a senha (Chrome, Edge, Android); o Safari guarda pelo próprio formulário */
async function guardarCredencial(utilizador, senha) {
  try { if (window.PasswordCredential && navigator.credentials && utilizador && senha) await Promise.race([navigator.credentials.store(new window.PasswordCredential({ id: utilizador, password: senha, name: utilizador })), new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* o utilizador pode recusar */ }
}
const docNum = f => f.pendente ? `${f.tipo} (por enviar)` : `${f.tipo} ${nf(f.numero)}`;
const pode = p => !!(E && E.eu && E.eu.perm && E.eu.perm[p]);
/* documentos que este utilizador pode ver (no Supabase já vêm filtrados; na demonstração filtra-se aqui) */
const docs = () => (pode("ver_todas") || pode("relatorios")) ? E.faturas : E.faturas.filter(f => f.vendedor_id === E.eu.id);
/* contam para faturação: FR e FT emitidas (pró-formas não) */
const emitidas = () => docs().filter(f => f.tipo !== "PP" && f.estado === "emitida");
function estadoDoc(f) {
  if (f.pendente) return f.erro ? ["Não aceite", "bad"] : ["Por enviar", "warn"];
  if (f.estado === "anulada") return ["Anulada", "bad"];
  if (f.estado === "convertida") return ["Convertida", ""];
  if (f.tipo === "PP") return ["Em aberto", "brand"];
  if (f.tipo === "FT" && !f.pago) return ["Por pagar", "warn"];
  return ["Paga", "ok"];
}
const PERMISSOES = [
  ["ver_todas", "Ver documentos de todos os vendedores"],
  ["anular", "Anular documentos"],
  ["produtos", "Registar produtos e alterar preços"],
  ["stock", "Gerir stock e saldos de recarga"],
  ["relatorios", "Ver relatórios e faturação"],
];
const PERM_CHAVES = ["vender", "ver_todas", "anular", "produtos", "stock", "relatorios", "admin"];

const OPERADORES_BASE = [["UNITEL", "Unitel", "Telemóvel", "Número de telefone"], ["AFRICELL", "Africell", "Telemóvel", "Número de telefone"],
  ["ZAP", "ZAP", "Televisão", "Nº do cartão ZAP"], ["DSTV", "DStv", "Televisão", "Nº do cartão (smartcard)"],
  ["EDEL", "EDEL", "Energia", "Nº do contador"], ["EPAL", "EPAL", "Água", "Nº do contador / cliente"]];
class ErroNegocio extends Error {}
const falha = m => { throw new ErroNegocio(m); };

/* ============================================================ motor de demonstração (mesmas regras do supabase/esquema.sql) */
function permDe(u) {
  const o = {};
  PERM_CHAVES.forEach(k => o[k] = !!u.ativo && (u.papel === "admin" || k === "vender" || (k !== "admin" && !!(u.permissoes || {})[k])));
  return o;
}
function guardarLocal() { try { localStorage.setItem(CHAVE, JSON.stringify(E)); } catch (e) { /* sem armazenamento: só em memória */ } }
const Local = {
  novo() {
    E = { config: { empresa: SEED.empresa, formas_pagamento: SEED.formas, seccoes: SEED.seccoes, seccoes_cod: SEED.seccoes_cod, numeracao: { FR: 1, FT: 1, PP: 1 }, validade_proforma: 15 },
          produtos: [], clientes: [], faturas: [], movimentos: [], _seq: { p: 0, c: 0, f: 0, i: 0, m: 0, u: 2 },
          utilizadores: [
            { id: "u1", nome: "Yuri Ventura", utilizador: "admin", papel: "admin", permissoes: {}, ativo: true },
            { id: "u2", nome: "Maria (vendedora)", utilizador: "maria", papel: "vendedor", permissoes: {}, ativo: true },
          ], _eu: "u1" };
    this.atualizarEu();
    this.semearOperadores();
    const d7 = this.dia(7, "08:00");
    [[10000, 9500], [5000, 4800], [20000, 19000], [15000, 14250], [8000, 7600], [4000, 3800]]
      .forEach(([v, c], k) => this.moverSaldo(E.operadores[k].id, "carga", v, c, `Saldo carregado: pago ${fmt(c)} Kz`, "", d7));
    SEED.produtos.forEach(s => {
      const p = { ...s, id: ++E._seq.p, stock: 0, ativo: true };
      E.produtos.push(p);
      if (p.tipo === "produto" && s.stock > 0) this.mover(p.id, "entrada", s.stock, "Stock inicial", "", d7);
    });
    const ids = SEED.clientes_exemplo.map(c => { const n = { ...c, id: ++E._seq.c, ativo: true }; E.clientes.push(n); return n.id; });
    const cod = Object.fromEntries(E.produtos.map(p => [p.codigo, p]));
    const tipos = ["FR", "FR", "FT", "FR", "PP", "FR", "FR"];
    SEED.vendas_exemplo.forEach(([dias, ci, itens, forma, desconto], n) => {
      E._eu = n % 2 ? "u2" : "u1"; this.atualizarEu();
      this.registarDocumento({
        tipo: tipos[n], cliente_id: ci === null ? null : ids[ci], forma_pagamento: tipos[n] === "FR" ? forma : null, desconto, observacoes: "",
        itens: itens.map(([c, q, pr]) => ({ produto_id: cod[c].id, descricao: cod[c].nome, qtd: q, preco_unit: pr ?? precoPara(cod[c], q) })),
      }, this.dia(dias, `${pad(10 + n % 7)}:${pad((n * 13) % 60)}`));
    });
    E._eu = "u1"; this.atualizarEu();
    // duas recargas de exemplo
    this.registarDocumento({ tipo: "FR", forma_pagamento: E.config.formas_pagamento[0], itens: [{ operador_id: E.operadores[0].id, referencia: "923 456 789", qtd: 1, preco_unit: 1000 }] }, this.dia(2, "15:40"));
    this.registarDocumento({ tipo: "FR", forma_pagamento: E.config.formas_pagamento[0], itens: [{ operador_id: E.operadores[2].id, referencia: "4012 3456", qtd: 1, preco_unit: 5000 }] }, this.dia(1, "11:20"));
  },
  semearOperadores() {
    E._seq.o = E._seq.o || 0; E._seq.ms = E._seq.ms || 0;
    E.operadores = OPERADORES_BASE.map(([codigo, nome, categoria, referencia], k) => ({ id: ++E._seq.o, codigo, nome, categoria, referencia, saldo: 0, custo: 0, saldo_min: 2000, ordem: k + 1, ativo: true }));
    E.movimentos_saldo = [];
  },
  /* igual a _mover_saldo do servidor: devolve o custo do movimento */
  moverSaldo(opId, tipo, valor, custo, motivo, ref = "", data = null) {
    const o = byId(E.operadores, opId) || falha("Operador não encontrado.");
    let c, delta;
    if (tipo === "venda") {
      if (-valor > o.saldo) falha(`Saldo ${o.nome} insuficiente: pediu ${-valor} Kz, há ${o.saldo} Kz.`);
      c = o.saldo > 0 ? Math.round(o.custo * (-valor) / o.saldo) : 0;
      o.saldo += valor; o.custo = Math.max(0, o.custo - c); delta = valor;
    } else if (tipo === "carga" || tipo === "anulacao") {
      c = custo || 0; o.saldo += valor; o.custo += c; delta = valor;
    } else {
      const novoCusto = o.saldo > 0 ? Math.round(o.custo * valor / o.saldo) : 0;
      delta = valor - o.saldo; c = novoCusto - o.custo; o.saldo = valor; o.custo = novoCusto;
    }
    E.movimentos_saldo.push({ id: ++E._seq.ms, data: data || isoLocal(), operador_id: o.id, tipo, valor: delta, custo: Math.abs(c), saldo_final: o.saldo, motivo: motivo || "", ref, utilizador_id: E.eu.id });
    return c;
  },
  carregarSaldo(d) {
    this.exigir("stock");
    const o = byId(E.operadores, d.operador_id) || falha("Escolha o operador.");
    const valor = inteiro(d.valor), pago = d.pago === "" || d.pago == null ? valor : inteiro(d.pago);
    if (!(valor > 0)) falha("Indique o saldo recebido em Kz.");
    if (!(pago > 0)) falha("Indique quanto pagou em Kz.");
    if (pago > valor * 2) falha("O valor pago parece demasiado alto para este saldo. Verifique.");
    this.moverSaldo(o.id, "carga", valor, pago, (d.motivo || "").trim() || `Saldo carregado: pago ${fmt(pago)} Kz`);
    return o;
  },
  ajustarSaldo(d) {
    this.exigir("stock");
    const o = byId(E.operadores, d.operador_id) || falha("Escolha o operador.");
    const novo = inteiro(d.saldo);
    if (Number.isNaN(novo) || novo < 0) falha("Indique o saldo certo em Kz (0 ou mais).");
    if (novo === o.saldo) falha("O saldo já é esse.");
    this.moverSaldo(o.id, "ajuste", novo, null, (d.motivo || "").trim() || "Correção do saldo");
    return o;
  },
  guardarOperador(d, id) {
    this.exigir("stock");
    const nome = (d.nome || "").trim(); if (!nome) falha("Indique o nome do operador.");
    const saldo_min = d.saldo_min === "" || d.saldo_min == null ? 2000 : inteiro(d.saldo_min);
    if (Number.isNaN(saldo_min) || saldo_min < 0) falha("Saldo mínimo inválido.");
    if (id) { const o = byId(E.operadores, id) || falha("Operador não encontrado."); return Object.assign(o, { nome, categoria: (d.categoria || "").trim() || o.categoria, referencia: (d.referencia || "").trim() || o.referencia, saldo_min }); }
    let codigo = nome.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "OP"; while (E.operadores.some(o => o.codigo === codigo)) codigo += "2";
    const o = { id: ++E._seq.o, codigo, nome, categoria: (d.categoria || "").trim() || "Outros", referencia: (d.referencia || "").trim() || "Referência", saldo: 0, custo: 0, saldo_min, ordem: E.operadores.length + 1, ativo: true };
    E.operadores.push(o); return o;
  },
  atualizarEu() { const u = E.utilizadores.find(x => x.id === E._eu); E.eu = { id: u.id, nome: u.nome, utilizador: u.utilizador, papel: u.papel, perm: permDe(u) }; },
  exigir(p) { if (!E.eu.perm[p]) falha("Não tem permissão para esta operação. Peça ao administrador."); return E.eu; },
  dia(diasAtras, hora) { const d = new Date(); d.setDate(d.getDate() - diasAtras); return `${isoLocal(d).slice(0, 10)}T${hora}:00`; },
  mover(pid, tipo, qtd, motivo, ref = "", data = null) {
    const p = produto(pid);
    p.stock = tipo === "entrada" ? p.stock + qtd : tipo === "saida" ? p.stock - qtd : qtd;
    E.movimentos.push({ id: ++E._seq.m, data: data || isoLocal(), produto_id: pid, tipo, qtd, stock_final: p.stock, motivo, ref, utilizador_id: E.eu.id });
    return p.stock;
  },
  registarDocumento(d, data = null) {
    const eu = this.exigir("vender"), tipo = d.tipo || "FR", forma = d.forma_pagamento || null;
    if (!["FR", "FT", "PP"].includes(tipo)) falha("Tipo de documento inválido.");
    if (!d.itens || !d.itens.length) falha("Adicione pelo menos um produto ou serviço.");
    if (forma && !E.config.formas_pagamento.includes(forma)) falha("Forma de pagamento inválida.");
    if (tipo === "FR" && !forma) falha("Escolha a forma de pagamento.");
    const precisa = {}, saldoPrec = {}, linhas = [];
    for (const it of d.itens) {
      const p = it.produto_id ? produto(it.produto_id) : null;
      if (it.produto_id && !p) falha("Produto não encontrado.");
      const qtd = inteiro(it.qtd), preco = inteiro(it.preco_unit);
      let descricao = (it.descricao || p?.nome || "").trim(), op = null, referencia = "";
      if (it.operador_id) {
        op = byId(E.operadores, it.operador_id) || falha("Operador de recarga não encontrado.");
        referencia = String(it.referencia || "").trim().slice(0, 40);
        descricao = `Recarga ${op.nome}${referencia ? " — " + referencia : ""}`;
        if (qtd > 0 && preco > 0) saldoPrec[op.id] = (saldoPrec[op.id] || 0) + qtd * preco;
      }
      if (!descricao) falha("Item sem descrição.");
      if (!(qtd > 0)) falha(`Quantidade inválida em '${descricao}'.`);
      if (!(preco > 0)) falha(`Indique o preço de '${descricao}'.`);
      if (p && p.modo === "a_partir" && preco < p.preco) falha(`'${p.nome}' custa a partir de ${p.preco} Kz.`);
      if (p && p.tipo === "produto") precisa[p.id] = (precisa[p.id] || 0) + qtd;
      linhas.push({ produto_id: p ? p.id : null, operador_id: op ? op.id : null, referencia, descricao, qtd, preco_unit: preco, total: qtd * preco, custo: 0 });
    }
    if (tipo !== "PP") for (const [pid, q] of Object.entries(precisa)) { const p = produto(pid); if (q > p.stock) falha(`Stock insuficiente de ${p.nome}: pediu ${q}, há ${p.stock}.`); }
    if (tipo !== "PP") for (const [oid, v] of Object.entries(saldoPrec)) { const o = byId(E.operadores, oid); if (v > o.saldo) falha(`Saldo ${o.nome} insuficiente: a venda pede ${v} Kz, há ${o.saldo} Kz.`); }
    const subtotal = linhas.reduce((s, l) => s + l.total, 0);
    const desconto = d.desconto ? inteiro(d.desconto) : 0;
    if (Number.isNaN(desconto) || desconto < 0 || desconto > subtotal) falha("O desconto tem de estar entre 0 e o subtotal.");
    let cli = { id: null, nome: "Consumidor final", nif: "", endereco: "", telefone: "" };
    if (d.cliente_id) cli = byId(E.clientes, d.cliente_id) || falha("Cliente não encontrado.");
    const numero = Math.max(E.config.numeracao[tipo] || 1, Math.max(0, ...E.faturas.filter(f => f.tipo === tipo).map(f => f.numero)) + 1);
    const agora = data || isoLocal();
    let validade = null;
    if (tipo === "PP") { const v = new Date(agora.slice(0, 10) + "T12:00:00"); v.setDate(v.getDate() + (E.config.validade_proforma || 15)); validade = isoLocal(v).slice(0, 10); }
    const f = { id: ++E._seq.f, tipo, numero, data: agora, cliente_id: cli.id, cliente_nome: cli.nome, cliente_nif: cli.nif, cliente_endereco: cli.endereco, cliente_telefone: cli.telefone,
      vendedor_id: eu.id, vendedor_nome: eu.nome, forma_pagamento: forma, subtotal, desconto, total: subtotal - desconto, observacoes: (d.observacoes || "").trim(),
      estado: "emitida", pago: tipo === "FR", pago_em: tipo === "FR" ? agora : null, validade, origem_id: d.origem_id || null,
      itens: linhas.map(l => ({ ...l, id: ++E._seq.i })) };
    E.faturas.push(f);
    if (tipo !== "PP") linhas.forEach(l => { if (precisa[l.produto_id]) this.mover(l.produto_id, "saida", l.qtd, "Venda", docNum(f), data); });
    if (tipo !== "PP") f.itens.forEach(l => { if (l.operador_id) l.custo = this.moverSaldo(l.operador_id, "venda", -l.total, null, "Venda", docNum(f), data); });
    E.config.numeracao[tipo] = numero + 1;
    return f;
  },
  podeVer(f) { return f.vendedor_id === E.eu.id || pode("ver_todas"); },
  anularDocumento(id, motivo = "") {
    this.exigir("anular");
    const f = byId(E.faturas, id) || falha("Documento não encontrado.");
    if (f.estado !== "emitida") falha("Este documento já não está ativo (anulado ou convertido).");
    if (f.tipo !== "PP") f.itens.forEach(it => { const p = produto(it.produto_id); if (p && p.tipo === "produto") this.mover(p.id, "entrada", it.qtd, "Documento anulado", docNum(f)); });
    if (f.tipo !== "PP") f.itens.forEach(it => { if (it.operador_id) this.moverSaldo(it.operador_id, "anulacao", it.total, it.custo || 0, "Documento anulado", docNum(f)); });
    f.estado = "anulada";
    f.observacoes = `${f.observacoes}\n${motivo.trim() ? "ANULADA: " + motivo.trim() : "ANULADA"}`.trim();
    return f;
  },
  converterProforma(id, tipo, forma) {
    this.exigir("vender");
    const pp = byId(E.faturas, id);
    if (!pp || pp.tipo !== "PP") falha("Pró-forma não encontrada.");
    if (!this.podeVer(pp)) falha("Não tem permissão para esta pró-forma.");
    if (pp.estado !== "emitida") falha("Esta pró-forma já foi convertida ou anulada.");
    if (!["FR", "FT"].includes(tipo)) falha("Escolha Fatura-Recibo ou Fatura.");
    const novo = this.registarDocumento({ tipo, forma_pagamento: forma, cliente_id: pp.cliente_id, desconto: pp.desconto, origem_id: pp.id,
      observacoes: `${pp.observacoes}\nReferente à pró-forma ${docNum(pp)}`.trim(),
      itens: pp.itens.map(i => ({ produto_id: i.produto_id, operador_id: i.operador_id || null, referencia: i.referencia || "", descricao: i.descricao, qtd: i.qtd, preco_unit: i.preco_unit })) });
    pp.estado = "convertida"; pp.observacoes = `${pp.observacoes}\nConvertida em ${docNum(novo)}`.trim();
    return novo;
  },
  registarPagamento(id, forma) {
    this.exigir("vender");
    const f = byId(E.faturas, id);
    if (!f || f.tipo !== "FT") falha("Fatura não encontrada.");
    if (!this.podeVer(f)) falha("Não tem permissão para esta fatura.");
    if (f.estado !== "emitida") falha("Fatura anulada.");
    if (f.pago) falha("Esta fatura já está paga.");
    if (!forma || !E.config.formas_pagamento.includes(forma)) falha("Escolha a forma de pagamento.");
    Object.assign(f, { pago: true, pago_em: isoLocal(), forma_pagamento: forma });
    return f;
  },
  movimentoStock(d) {
    this.exigir("stock");
    const p = produto(d.produto_id) || falha("Escolha o produto.");
    if (p.tipo !== "produto") falha("Serviços não têm stock.");
    if (!["entrada", "saida", "ajuste"].includes(d.tipo)) falha("Escolha entrada, saída ou contagem.");
    const qtd = inteiro(d.qtd);
    if (Number.isNaN(qtd)) falha("Indique uma quantidade válida.");
    if (qtd < 0 || (qtd === 0 && d.tipo !== "ajuste")) falha("A quantidade tem de ser maior que zero.");
    if (d.tipo === "saida" && qtd > p.stock) falha(`Só há ${p.stock} em stock de ${p.nome}.`);
    const motivo = (d.motivo || "").trim() || { entrada: "Compra / reposição", saida: "Saída manual", ajuste: "Contagem de stock" }[d.tipo];
    this.mover(p.id, d.tipo, qtd, motivo); return p;
  },
  contagemStock(itens, motivo) {
    this.exigir("stock"); let n = 0;
    for (const it of itens) {
      const p = produto(it.produto_id); if (!p || p.tipo !== "produto") continue;
      const q = inteiro(it.qtd); if (Number.isNaN(q) || q < 0) falha(`Quantidade inválida em ${p.nome}.`);
      if (q !== p.stock) { this.mover(p.id, "ajuste", q, (motivo || "").trim() || "Contagem de stock"); n++; }
    }
    return n;
  },
  guardarProduto(d, id) {
    this.exigir("produtos");
    const nome = (d.nome || "").trim(); if (!nome) falha("Indique o nome do produto ou serviço.");
    const tipo = d.tipo || "produto", modo = d.modo || "fixo", seccao = (d.seccao || "").trim() || "Outros";
    const preco = d.preco === "" || d.preco == null ? 0 : inteiro(d.preco);
    let stock_min = d.stock_min === "" || d.stock_min == null ? 0 : inteiro(d.stock_min);
    const tier_qtd = d.tier_qtd ? inteiro(d.tier_qtd) : null, tier_preco = d.tier_preco ? inteiro(d.tier_preco) : null;
    let ini = d.stock ? inteiro(d.stock) : 0;
    if ([preco, stock_min, ini].some(Number.isNaN) || Number.isNaN(tier_qtd) || Number.isNaN(tier_preco)) falha("Preços e quantidades têm de ser números inteiros (Kz).");
    if (preco < 0 || stock_min < 0 || ini < 0) falha("Valores não podem ser negativos.");
    if (modo !== "consulta" && preco === 0) falha("Indique o preço em Kz (ou escolha 'por consulta').");
    if ((tier_qtd === null) !== (tier_preco === null)) falha("Para preço por quantidade, indique a quantidade mínima e o preço.");
    if (tipo === "servico") { stock_min = 0; ini = 0; }
    const dados = { nome, descricao: (d.descricao || "").trim(), seccao, tipo, modo, preco, tier_qtd, tier_preco, stock_min };
    if (id) {
      const a = produto(id) || falha("Produto não encontrado.");
      if (a.tipo === "produto" && tipo === "servico" && a.stock > 0) falha("Este produto ainda tem stock. Faça uma contagem para 0 antes de o mudar para serviço.");
      return Object.assign(a, dados);
    }
    const sec = (E.config.seccoes_cod.find(([, n]) => n === seccao) || ["GK"])[0];
    let n = 1; while (E.produtos.some(x => x.codigo === sec + pad(n))) n++;
    const novo = { ...dados, id: ++E._seq.p, codigo: sec + pad(n), stock: 0, ativo: true };
    E.produtos.push(novo);
    if (ini) this.mover(novo.id, "entrada", ini, "Stock inicial");
    return novo;
  },
  removerProduto(id) { this.exigir("produtos"); const p = produto(id); E.produtos = E.produtos.filter(x => x !== p); (E._removidos ||= []).push(p); },
  guardarCliente(d, id) {
    this.exigir("vender");
    const nome = (d.nome || "").trim(); if (!nome) falha("Indique o nome do cliente.");
    const dados = { nome, nif: (d.nif || "").trim(), endereco: (d.endereco || "").trim(), telefone: (d.telefone || "").trim() };
    const igual = dados.nif && E.clientes.find(c => c.nif === dados.nif && c.id !== Number(id));
    if (igual) falha(`Já existe um cliente com o NIF ${dados.nif}: ${igual.nome}.`);
    if (id) return Object.assign(byId(E.clientes, id) || falha("Cliente não encontrado."), dados);
    const c = { ...dados, id: ++E._seq.c, ativo: true }; E.clientes.push(c); return c;
  },
  removerCliente(id) { this.exigir("admin"); E.clientes = E.clientes.filter(c => c.id !== Number(id)); },
  guardarConfig(d) {
    this.exigir("admin");
    if (d.empresa) E.config.empresa = { ...E.config.empresa, ...d.empresa };
    if (d.numeracao) for (const [k, v] of Object.entries(d.numeracao)) {
      const n = inteiro(v), maior = Math.max(0, ...E.faturas.filter(f => f.tipo === k).map(f => f.numero));
      if (!(n > maior)) falha(`O próximo número de ${k} tem de ser maior que ${nf(maior)}.`);
      E.config.numeracao[k] = n;
    }
    if (d.validade_proforma !== undefined) { const n = inteiro(d.validade_proforma); if (!(n >= 1 && n <= 365)) falha("Validade da pró-forma entre 1 e 365 dias."); E.config.validade_proforma = n; }
    return E.config;
  },
  limparUtilizador(d, novo) {
    const nome = (d.nome || "").trim(); if (!nome) falha("Indique o nome (aparece nas faturas).");
    const papel = d.papel === "admin" ? "admin" : "vendedor";
    const permissoes = {}; if (papel === "vendedor") PERMISSOES.forEach(([k]) => permissoes[k] = !!(d.permissoes || {})[k]);
    if (novo) {
      const u = (d.utilizador || "").trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,30}$/.test(u)) falha("Utilizador: 3 a 30 letras minúsculas, números, ponto, hífen ou _ (sem espaços).");
      if (E.utilizadores.some(x => x.utilizador === u)) falha(`O utilizador "${u}" já existe.`);
      if ((d.senha || "").length < 6) falha("A senha precisa de pelo menos 6 caracteres.");
      return { nome, papel, permissoes, utilizador: u };
    }
    if (d.senha && d.senha.length < 6) falha("A senha precisa de pelo menos 6 caracteres.");
    return { nome, papel, permissoes };
  },
  criarUtilizador(d) { this.exigir("admin"); const u = { ...this.limparUtilizador(d, true), id: "u" + (++E._seq.u), ativo: true }; E.utilizadores.push(u); return u; },
  atualizarUtilizador(d) {
    this.exigir("admin");
    const u = utilizador(d.id) || falha("Utilizador não encontrado.");
    const dados = this.limparUtilizador(d, false), ativo = d.ativo !== false;
    if (u.papel === "admin" && (dados.papel !== "admin" || !ativo) && E.utilizadores.filter(x => x.papel === "admin" && x.ativo).length <= 1) falha("Tem de existir pelo menos um administrador ativo.");
    Object.assign(u, dados, { ativo });
    if (u.id === E._eu) this.atualizarEu();
    return u;
  },
};

/* ============================================================ modo offline: cópia local (IndexedDB) e fila de envio
   - Cada vez que os dados chegam do servidor, fica uma cópia no aparelho ("estado", por utilizador).
   - Sem internet, vendas (FR/FT/PP) e clientes novos entram na "fila" e são enviados quando a ligação volta.
   - Cada registo leva uma referência única (ref_local): se a ligação cair a meio do envio, o servidor
     devolve o documento já criado em vez de o duplicar. */
const IDB = {
  _db: null,
  abrir() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB indisponível"));
    return this._db ||= new Promise((ok, erro) => {
      const r = indexedDB.open("grupo-kambas", 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("estado"); d.createObjectStore("fila", { keyPath: "id" }); };
      r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error);
    });
  },
  async pedido(loja, modo, fn) {
    const d = await this.abrir();
    return new Promise((ok, erro) => { const t = d.transaction(loja, modo); const r = fn(t.objectStore(loja)); t.oncomplete = () => ok(r && r.result); t.onerror = () => erro(t.error); t.onabort = () => erro(t.error); });
  },
  ler(loja, chave) { return this.pedido(loja, "readonly", s => s.get(chave)); },
  todos(loja) { return this.pedido(loja, "readonly", s => s.getAll()); },
  gravar(loja, valor, chave) { return this.pedido(loja, "readwrite", s => chave === undefined ? s.put(valor) : s.put(valor, chave)); },
  apagar(loja, chave) { return this.pedido(loja, "readwrite", s => s.delete(chave)); },
};
let base = null;          // último estado vindo do servidor
let fila = [];            // registos por enviar deste utilizador
let offline = false, guardadoEm = null, aEnviar = false;
const ULTIMO = "grupo-kambas-ultimo-utilizador";
const eRede = e => /Failed to fetch|NetworkError|network|Load failed|fetch failed|ERR_INTERNET|ERR_NETWORK|timeout/i.test(String(e && (e.message || e.details) || e || "")) || !navigator.onLine;
const novaRef = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const ehTemp = id => typeof id === "string" && id.startsWith("tc-");

async function guardarCopia() {
  try { guardadoEm = isoLocal(); await IDB.gravar("estado", { base, guardadoEm }, base.eu.id); localStorage.setItem(ULTIMO, base.eu.id); } catch (e) { /* sem armazenamento local: continua só online */ }
}
async function carregarCopia(uid) {
  try { const c = uid && await IDB.ler("estado", uid); if (c && c.base) { base = c.base; guardadoEm = c.guardadoEm; return true; } } catch (e) { /* sem cópia */ }
  return false;
}
async function carregarFila(uid) {
  try { fila = (await IDB.todos("fila")).filter(i => i.uid === uid).sort((a, b) => a.criado.localeCompare(b.criado) || a.id.localeCompare(b.id)); } catch (e) { fila = []; }
}
/* E = estado do servidor + o que está na fila (para o utilizador ver logo as vendas feitas offline) */
function montarE() {
  E = JSON.parse(JSON.stringify(base));
  E.faturas = E.faturas || []; E.movimentos = E.movimentos || []; E.utilizadores = E.utilizadores || [];
  E.operadores = E.operadores || []; E.movimentos_saldo = E.movimentos_saldo || [];
  for (const it of fila) {
    if (it.tipo === "cliente") { E.clientes.push({ ...it.dados, id: it.tmp, ativo: true, pendente: true }); continue; }
    const d = it.dados;
    const cli = (d.cliente_id && E.clientes.find(c => String(c.id) === String(d.cliente_id))) || { id: null, nome: "Consumidor final", nif: "", endereco: "", telefone: "" };
    const itens = d.itens.map((l, k) => ({ id: `${it.id}-${k}`, produto_id: l.produto_id, operador_id: l.operador_id || null, referencia: l.referencia || "", descricao: l.descricao, qtd: l.qtd, preco_unit: l.preco_unit, total: l.qtd * l.preco_unit }));
    const subtotal = itens.reduce((s, l) => s + l.total, 0), data = it.criado;
    let validade = null;
    if (d.tipo === "PP") { const v = new Date(data.slice(0, 10) + "T12:00:00"); v.setDate(v.getDate() + (E.config.validade_proforma || 15)); validade = isoLocal(v).slice(0, 10); }
    E.faturas.unshift({ id: it.id, pendente: true, erro: it.erro || null, tipo: d.tipo, numero: null, data, cliente_id: cli.id, cliente_nome: cli.nome, cliente_nif: cli.nif,
      cliente_endereco: cli.endereco, cliente_telefone: cli.telefone, vendedor_id: E.eu.id, vendedor_nome: E.eu.nome, forma_pagamento: d.forma_pagamento || null,
      subtotal, desconto: d.desconto || 0, total: subtotal - (d.desconto || 0), observacoes: d.observacoes || "", estado: "emitida", pago: d.tipo === "FR",
      pago_em: d.tipo === "FR" ? data : null, validade, itens });
    if (d.tipo !== "PP") itens.forEach(l => { const p = l.produto_id && E.produtos.find(x => x.id === l.produto_id); if (p && p.tipo === "produto") p.stock -= l.qtd; });
    if (d.tipo !== "PP") itens.forEach(l => { const o = l.operador_id && E.operadores.find(x => x.id === l.operador_id); if (o) o.saldo -= l.total; });
  }
}
/* guarda na fila (sem internet) — validações básicas no aparelho; as regras completas correm no servidor ao enviar */
async function enfileirar(nome, args) {
  const agora = isoLocal();
  let item;
  if (nome === "guardarCliente") {
    const d = { nome: (args[0].nome || "").trim(), nif: (args[0].nif || "").trim(), endereco: (args[0].endereco || "").trim(), telefone: (args[0].telefone || "").trim() };
    if (!d.nome) falha("Indique o nome do cliente.");
    const igual = d.nif && E.clientes.find(c => c.nif === d.nif);
    if (igual) falha(`Já existe um cliente com o NIF ${d.nif}: ${igual.nome}.`);
    d.ref_local = args[0].ref_local || novaRef("c");
    item = { id: novaRef("f"), uid: E.eu.id, tipo: "cliente", tmp: "tc-" + d.ref_local, dados: d, criado: agora };
  } else {
    const d = { ...args[0] };
    if (!d.itens || !d.itens.length) falha("Adicione pelo menos um produto ou serviço.");
    if (d.tipo === "FR" && !d.forma_pagamento) falha("Escolha a forma de pagamento.");
    if (d.itens.some(l => !(l.qtd > 0) || !(l.preco_unit > 0))) falha("Há itens sem quantidade ou preço.");
    if (d.tipo !== "PP") {
      const precisa = {}; d.itens.forEach(l => { const p = produto(l.produto_id); if (p && p.tipo === "produto") precisa[p.id] = (precisa[p.id] || 0) + l.qtd; });
      for (const [pid, q] of Object.entries(precisa)) { const p = produto(pid); if (q > p.stock) falha(`Stock insuficiente de ${p.nome}: pediu ${q}, há ${p.stock} (stock da última sincronização).`); }
      const sp = {}; d.itens.forEach(l => { if (l.operador_id) sp[l.operador_id] = (sp[l.operador_id] || 0) + l.qtd * l.preco_unit; });
      for (const [oid, v] of Object.entries(sp)) { const o = byId(E.operadores, oid); if (o && v > o.saldo) falha(`Saldo ${o.nome} insuficiente: pede ${v} Kz, há ${o.saldo} Kz (saldo da última sincronização).`); }
    }
    d.ref_local = d.ref_local || novaRef("v");
    d.data_local = new Date().toISOString();
    d.observacoes = `${d.observacoes || ""}\nRegistado sem internet em ${dataPt(agora)} ${horaPt(agora)}`.trim();
    item = { id: novaRef("f"), uid: E.eu.id, tipo: "doc", dados: d, criado: agora };
  }
  try { await IDB.gravar("fila", item); } catch (e) { falha("Este aparelho não deixa guardar dados offline (modo privado?). Ligue-se à internet para registar."); }
  fila.push(item);
  montarE(); marcarSync(offline ? "off" : "a");
  return item.tipo === "cliente" ? E.clientes.find(c => c.id === item.tmp) : E.faturas.find(f => f.id === item.id);
}
/* envia a fila pela ordem em que foi criada */
async function enviarFila() {
  if (DEMO || aEnviar || !fila.some(i => !i.erro) || !navigator.onLine) return;
  aEnviar = true; let enviados = 0, comErro = 0;
  try {
    for (const it of [...fila]) {
      if (it.erro) continue;
      marcarSync("enviar");
      try {
        if (it.tipo === "cliente") {
          const { data, error } = await sb.rpc("guardar_cliente", { d: it.dados, p_id: null });
          if (error) throw error;
          for (const o of fila) if (o.tipo === "doc" && o.dados.cliente_id === it.tmp) { o.dados.cliente_id = data.id; await IDB.gravar("fila", o); }
          if (venda.cliente_id === it.tmp) venda.cliente_id = String(data.id);
        } else {
          const d = { ...it.dados };
          if (ehTemp(d.cliente_id)) { const espera = fila.find(o => o.tmp === d.cliente_id); if (espera) throw new ErroNegocio(`Falta enviar primeiro o cliente ${espera.dados.nome}.`); d.cliente_id = null; }
          const { data, error } = await sb.rpc("registar_documento", { d });
          if (error) throw error;
          it.enviadoComo = docNum(data);
        }
        await IDB.apagar("fila", it.id); fila = fila.filter(x => x !== it); enviados++;
      } catch (e) {
        if (eRede(e)) { offline = true; break; }
        it.erro = mensagemErro(e); comErro++;
        try { await IDB.gravar("fila", it); } catch (er) { /* fica só em memória */ }
      }
    }
  } finally { aEnviar = false; }
  if (enviados || comErro) {
    try { await recarregar(); offline = false; } catch (e) { montarE(); }
    aplicarSync(); mostrarEstado();
    if (enviados) toast(`${enviados} registo${enviados === 1 ? "" : "s"} feito${enviados === 1 ? "" : "s"} sem internet ${enviados === 1 ? "foi enviado" : "foram enviados"}`);
    if (comErro) toast(`${comErro} registo${comErro === 1 ? "" : "s"} não ${comErro === 1 ? "foi aceite" : "foram aceites"} pelo servidor. Veja os pendentes.`);
  } else mostrarEstado();
}
function entrarOffline() { offline = true; mostrarEstado(); }
function mostrarEstado() {
  const bar = $("#offline-bar"); if (!bar || DEMO) return;
  const n = fila.length, erros = fila.filter(i => i.erro).length;
  if (offline) {
    bar.hidden = false; bar.className = "offline-bar";
    bar.innerHTML = `<span><b>Sem internet.</b> A mostrar os dados guardados${guardadoEm ? ` às ${horaPt(guardadoEm)} de ${dataPt(guardadoEm)}` : ""}. Vendas e clientes novos ficam guardados e são enviados quando a ligação voltar.</span>${n ? `<button class="btn sm" data-act="pendentes">${n} por enviar</button>` : ""}`;
  } else if (n) {
    bar.hidden = false; bar.className = "offline-bar " + (erros ? "erro" : "a");
    bar.innerHTML = `<span>${erros ? `<b>${erros} registo${erros === 1 ? "" : "s"} não ${erros === 1 ? "foi aceite" : "foram aceites"}.</b> Veja o motivo e decida.` : `A enviar ${n} registo${n === 1 ? "" : "s"} feito${n === 1 ? "" : "s"} sem internet…`}</span><button class="btn sm" data-act="pendentes">Ver pendentes</button>`;
  } else bar.hidden = true;
  marcarSync(offline ? "off" : n ? "a" : "ok");
}
function verPendentes() {
  abrir(`<div class="sheet"><div class="sheet-h"><h2>Por enviar</h2><button class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b">${fila.length ? fila.map(it => `<div class="pend ${it.erro ? "erro" : ""}">
        <div><b>${it.tipo === "cliente" ? `Cliente: ${esc(it.dados.nome)}` : `${TIPOS_DOC[it.dados.tipo]} · ${kz(it.dados.itens.reduce((s, l) => s + l.qtd * l.preco_unit, 0) - (it.dados.desconto || 0))}`}</b>
        <div class="cod">Feito em ${dataPt(it.criado)} ${horaPt(it.criado)}${it.erro ? "" : " · à espera de ligação"}</div>${it.erro ? `<div class="err" style="margin-top:6px">${esc(it.erro)}</div>` : ""}</div>
        ${it.erro ? `<div class="toolbar"><button class="btn sm" data-act="fila-tentar" data-id="${it.id}">Tentar outra vez</button><button class="btn sm danger" data-act="fila-descartar" data-id="${it.id}">Descartar</button></div>` : ""}</div>`).join("")
      : `<div class="empty">Nada por enviar. Está tudo sincronizado.</div>`}
      <p class="cod" style="margin:0">Os números oficiais (ex.: FR 0012) são dados pelo servidor no envio, para dois aparelhos nunca usarem o mesmo número.</p></div>
    <div class="sheet-f"><span class="sp"></span>${navigator.onLine && fila.length ? `<button class="btn pri" data-act="fila-enviar">Enviar agora</button>` : `<button class="btn pri" data-act="fechar">Fechar</button>`}</div></div>`);
}
async function descartarDaFila(id) {
  const it = fila.find(i => i.id === id); if (!it) return;
  if (it.tipo === "cliente") for (const o of fila) if (o.tipo === "doc" && o.dados.cliente_id === it.tmp) { o.dados.cliente_id = null; o.erro = null; try { await IDB.gravar("fila", o); } catch (e) { /* memória */ } }
  try { await IDB.apagar("fila", id); } catch (e) { /* memória */ }
  fila = fila.filter(i => i !== it); montarE(); mostrarEstado();
}
setInterval(() => { if (!DEMO && E && fila.length && navigator.onLine) enviarFila(); }, 30000);
function registarServiceWorker() {
  if (!("serviceWorker" in navigator) || eNativo() || navigator.userAgent.includes("Electron")) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;
  navigator.serviceWorker.register("sw.js").catch(() => { /* a página funciona na mesma, só sem abrir offline */ });
}

/* ============================================================ acesso aos dados */
const RPC = {
  registarDocumento: d => ["registar_documento", { d }],
  anularDocumento: (id, motivo) => ["anular_documento", { p_id: id, p_motivo: motivo || "" }],
  converterProforma: (id, tipo, forma) => ["converter_proforma", { p_id: id, p_tipo: tipo, p_forma: forma || null }],
  registarPagamento: (id, forma) => ["registar_pagamento", { p_id: id, p_forma: forma }],
  movimentoStock: d => ["movimento_stock", { d }],
  contagemStock: (itens, motivo) => ["contagem_stock", { p_itens: itens, p_motivo: motivo || "Contagem de stock" }],
  guardarProduto: (d, id) => ["guardar_produto", { d, p_id: id || null }],
  removerProduto: id => ["remover_produto", { p_id: id }],
  guardarCliente: (d, id) => ["guardar_cliente", { d, p_id: id || null }],
  removerCliente: id => ["remover_cliente", { p_id: id }],
  guardarConfig: d => ["guardar_config", { d }],
  carregarSaldo: d => ["carregar_saldo", { d }],
  ajustarSaldo: d => ["ajustar_saldo", { d }],
  guardarOperador: (d, id) => ["guardar_operador", { d, p_id: id || null }],
};
const FUNCAO_UTILIZADORES = { criarUtilizador: d => ({ acao: "criar", ...d }), atualizarUtilizador: d => ({ acao: "atualizar", ...d }) };
function mensagemErro(e) {
  const m = String(e && e.message || e || "");
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "Sem ligação à internet. Verifique a rede e tente outra vez.";
  if (/JWT|Sessão inválida/i.test(m)) return "A sessão terminou. Entre novamente.";
  return m;
}
async function chamarFuncao(corpo) {
  const { data, error } = await sb.functions.invoke("utilizadores", { body: corpo });
  if (error) {
    let msg = error.message;
    try { const j = await error.context.json(); if (j && j.erro) msg = j.erro; } catch (e) { /* resposta sem JSON */ }
    throw new ErroNegocio(mensagemErro(msg));
  }
  return data;
}
async function recarregar() {
  const { data, error } = await sb.rpc("estado");
  if (error) { const er = new ErroNegocio(mensagemErro(error)); er.rede = eRede(error); throw er; }
  base = data; base.faturas = base.faturas || []; base.movimentos = base.movimentos || []; base.utilizadores = base.utilizadores || [];
  offline = false;
  montarE();
  guardarCopia();
}
/* sem internet só se podem registar vendas e clientes novos; o resto precisa do servidor */
const SO_ONLINE = "Sem internet: esta operação precisa de ligação. Sem internet pode fazer vendas (FR, FT, pró-forma) e registar clientes novos.";
const podeOffline = (nome, args) => nome === "registarDocumento" || (nome === "guardarCliente" && !args[1]);
async function acao(nome, ...args) {
  if (DEMO) {
    const copia = JSON.stringify(E);
    try { const res = Local[nome](...args); guardarLocal(); return JSON.parse(JSON.stringify(res ?? null)); }
    catch (e) { E = JSON.parse(copia); throw e; }
  }
  // referência única em vendas e clientes novos: se a resposta se perder, o envio repetido não duplica
  if (podeOffline(nome, args)) args[0] = { ...args[0], ref_local: args[0].ref_local || novaRef(nome === "guardarCliente" ? "c" : "v") };
  if (nome === "registarDocumento" && ehTemp(args[0].cliente_id) || offline || !navigator.onLine) {
    if (!podeOffline(nome, args)) falha(SO_ONLINE);
    return enfileirar(nome, args);
  }
  let res;
  ocupado(true);
  try {
    if (FUNCAO_UTILIZADORES[nome]) res = await chamarFuncao(FUNCAO_UTILIZADORES[nome](...args));
    else {
      const [fn, params] = RPC[nome](...args);
      const { data, error } = await sb.rpc(fn, params);
      if (error) { const er = new ErroNegocio(mensagemErro(error)); er.rede = eRede(error); throw er; }
      res = data;
    }
  } catch (e) {
    ocupado(false);
    if (!(e.rede || eRede(e))) throw e;
    entrarOffline();
    if (!podeOffline(nome, args)) falha(SO_ONLINE);
    return enfileirar(nome, args);
  }
  marcarSync("a");
  try { await recarregar(); } catch (e) { if (e.rede) entrarOffline(); } finally { ocupado(false); }
  mostrarEstado();
  return res;
}

/* ============================================================ navegação (só mostra o que o utilizador pode usar) */
const VISTAS = [
  ["painel", "Início", "home", () => true],
  ["vender", "Vender", "cart", () => pode("vender")],
  ["faturas", "Documentos", "receipt", () => true],
  ["produtos", "Produtos", "tag", () => true],
  ["stock", "Stock", "box", () => pode("stock")],
  ["saldos", "Saldos", "wallet", () => pode("stock")],
  ["relatorios", "Relatórios", "chart", () => pode("relatorios")],
  ["clientes", "Clientes", "users", () => true],
  ["utilizadores", "Utilizadores", "user", () => pode("admin")],
  ["definicoes", "Definições", "cog", () => pode("admin")],
];
const TITULOS = { painel: "Início", vender: "Vender", faturas: "Documentos", produtos: "Produtos & Serviços", stock: "Gestão de Stock", saldos: "Saldos de recarga", relatorios: "Relatórios", clientes: "Clientes", utilizadores: "Utilizadores", definicoes: "Definições" };
let vista = "painel";
function navegar() {
  const h = location.hash.replace("#", "");
  const vis = VISTAS.filter(v => v[3]());
  vista = vis.some(v => v[0] === h) ? h : "painel";
  $("#rail-nav").innerHTML = vis.map(([id, nome, ic]) => `<a href="#${id}" ${id === vista ? 'aria-current="page"' : ""}>${icon(ic)}${nome}</a>`).join("");
  // telemóvel: Início, Documentos, [Vender ao centro], Stock ou Clientes, Mais
  const ids = ["painel", "faturas", "vender", pode("stock") ? "stock" : "clientes"].filter(id => vis.some(v => v[0] === id));
  const naBarra = ids.map(id => vis.find(v => v[0] === id));
  const noMais = vis.filter(v => !ids.includes(v[0]));
  $("#tabbar").style.gridTemplateColumns = `repeat(${naBarra.length + 1}, minmax(0, 1fr))`;
  $("#tabbar").innerHTML = naBarra.map(([id, nome, ic]) => id === "vender"
      ? `<a href="#vender" class="tab-vender" ${vista === "vender" ? 'aria-current="page"' : ""}><span class="tv">${icon("plus")}</span>Vender</a>`
      : `<a href="#${id}" ${id === vista ? 'aria-current="page"' : ""}>${icon(ic)}${nome}</a>`).join("")
    + `<button data-act="mais" class="${noMais.some(v => v[0] === vista) ? "on" : ""}" aria-label="Mais opções">${icon("menu")}Mais</button>`;
  $("#app").classList.toggle("compacta", vista === "vender");
  $("#page-title").textContent = vista === "painel" && !pode("ver_todas") ? "As minhas vendas" : TITULOS[vista];
  document.title = `${TITULOS[vista]} · Grupo Kambas`;
  const ini = ((E.eu.nome || "").match(/[\p{L}\d]+/gu) || ["?"]).map(s => s[0]).slice(0, 2).join("").toUpperCase();
  $("#user-btn").textContent = ini;
  $("#rail-user").innerHTML = `<button class="ru" data-act="conta"><span class="av">${esc(ini)}</span><span><b>${esc(E.eu.nome)}</b><small>${E.eu.papel === "admin" ? "Administrador" : "Vendedor"}${DEMO ? " · demonstração" : ""}</small></span></button>
    <button class="ru-sair" data-act="sair">${icon("logout")}Terminar sessão</button>`;
  render();
  window.scrollTo(0, 0);
}
function menuMais() {
  const vis = VISTAS.filter(v => v[3]()), ids = ["painel", "faturas", "vender", pode("stock") ? "stock" : "clientes"];
  const outras = vis.filter(v => !ids.includes(v[0]));
  abrir(`<div class="sheet"><div class="sheet-h"><h2>Mais</h2><button class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><nav class="mais-lista">${outras.map(([id, nome, ic]) => `<a href="#${id}" ${id === vista ? 'aria-current="page"' : ""}>${icon(ic)}<span>${nome}</span>${icon("right")}</a>`).join("")}
      <button data-act="conta">${icon("user")}<span>A minha conta<small>${esc(E.eu.nome)}</small></span>${icon("right")}</button></nav></div>
    <div class="sheet-f"><button class="btn danger" data-act="sair">${icon("logout")}Terminar sessão</button></div></div>`);
}
function render() {
  pendente = false;
  ({ painel: vPainel, vender: vVender, faturas: vFaturas, produtos: vProdutos, stock: vStock, saldos: vSaldos, relatorios: vRelatorios, clientes: vClientes, utilizadores: vUtilizadores, definicoes: vDefinicoes })[vista]();
}

/* ============================================================ painel */
const ini = { dias: 7 };
function saudacao() { const h = new Date().getHours(); return h < 12 ? "Bom dia" : h < 19 ? "Boa tarde" : "Boa noite"; }
function dataLonga() { const s = new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }); return s.charAt(0).toUpperCase() + s.slice(1); }
function quando(iso) {
  const d = diaDe(iso), h = hoje(), o = new Date(); o.setDate(o.getDate() - 1);
  return (d === h ? "hoje" : d === isoLocal(o).slice(0, 10) ? "ontem" : dataPt(iso).slice(0, 5)) + ", " + horaPt(iso);
}
/* lista de documentos em cartões: no telemóvel não sai do ecrã */
function listaDocs(lista) {
  if (!lista.length) return `<div class="empty">Ainda não há documentos.</div>`;
  return `<div class="dlist">${lista.map(f => { const [et, ec] = estadoDoc(f); return `<button class="drow ${f.estado === "anulada" ? "anulada" : ""}" data-act="ver-fatura" data-id="${f.id}">
    <span class="dtipo t-${f.tipo}">${f.tipo}</span>
    <span class="dmeio"><b>${esc(f.cliente_nome)}</b><small>${docNum(f)} · ${quando(f.data)}</small></span>
    <span class="dfim"><b class="num">${kz(f.total)}</b><span class="chip ${ec}">${et}</span></span></button>`; }).join("")}</div>`;
}
function vPainel() {
  const fs = emitidas(), h = hoje(), mes = h.slice(0, 7);
  const o = new Date(); o.setDate(o.getDate() - 1); const ontem = isoLocal(o).slice(0, 10);
  const soma = l => l.reduce((s, f) => s + f.total, 0);
  const deHoje = fs.filter(f => diaDe(f.data) === h), deOntem = fs.filter(f => diaDe(f.data) === ontem), doMes = fs.filter(f => f.data.startsWith(mes));
  const vHoje = soma(deHoje), vOntem = soma(deOntem);
  const variacao = vOntem ? Math.round((vHoje - vOntem) / vOntem * 100) : null;
  const porReceber = fs.filter(f => f.tipo === "FT" && !f.pago);
  const ppAbertas = docs().filter(f => f.tipo === "PP" && f.estado === "emitida");
  const alertas = pode("stock") ? E.produtos.filter(p => estadoStock(p) && estadoStock(p) !== "ok").sort((a, b) => a.stock - b.stock) : [];
  const nd = ini.dias;
  const dias = [...Array(nd)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - nd + 1 + i); return isoLocal(d).slice(0, 10); });
  const porDia = dias.map(d => soma(fs.filter(f => diaDe(f.data) === d)));
  const rank = {};
  doMes.forEach(f => f.itens.forEach(it => { const k = it.operador_id ? `Recargas ${operador(it.operador_id)?.nome || ""}`.trim() : it.descricao; rank[k] = (rank[k] || 0) + it.total; }));
  const saldoBaixo = pode("stock") ? (E.operadores || []).filter(o => opEstado(o) !== "ok") : [];
  const top = Object.entries(rank).sort((a, b) => b[1] - a[1]).slice(0, 5), maxTop = top.length ? top[0][1] : 1;
  const ultimos = [...docs()].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);
  const semStock = pode("stock") && E.produtos.filter(p => p.tipo === "produto").every(p => p.stock === 0);
  const nome = (E.eu.nome || "").split(/\s+/)[0];
  const meu = f => f.vendedor_id === E.eu.id || pode("ver_todas");

  const atalhos = [
    pode("vender") && `<button class="atalho" data-act="ir-proforma"><span class="ai">${icon("receipt")}</span><span>Pró-forma</span></button>`,
    `<button class="atalho" data-act="novo-cliente"><span class="ai">${icon("users")}</span><span>Novo cliente</span></button>`,
    pode("stock") && `<button class="atalho" data-act="mov" data-t="entrada"><span class="ai">${icon("box")}</span><span>Entrada de stock</span></button>`,
    pode("relatorios") ? `<a class="atalho" href="#relatorios"><span class="ai">${icon("chart")}</span><span>Relatório</span></a>` : `<a class="atalho" href="#faturas"><span class="ai">${icon("receipt")}</span><span>Documentos</span></a>`,
  ].filter(Boolean);

  const atencao = [
    ...porReceber.slice(0, 3).map(f => `<div class="aten"><span class="aic warn">${icon("receipt")}</span><span class="atx"><b>${docNum(f)} por pagar</b><small>${esc(f.cliente_nome)} · ${kz(f.total)}</small></span>
      <button class="btn sm" data-act="${meu(f) ? "pagar" : "ver-fatura"}" data-id="${f.id}">${meu(f) ? "Receber" : "Ver"}</button></div>`),
    alertas.length ? `<div class="aten"><span class="aic bad">${icon("box")}</span><span class="atx"><b>${alertas.length} produto${alertas.length === 1 ? "" : "s"} com stock baixo</b><small>${esc(alertas[0].nome)}: ${alertas[0].stock <= 0 ? "esgotado" : "só " + alertas[0].stock + " un."}</small></span>
      <a class="btn sm" href="#stock">Repor</a></div>` : "",
    ...saldoBaixo.slice(0, 3).map(o => `<div class="aten"><span class="aic ${opEstado(o)}">${opIcon(o)}</span><span class="atx"><b>Saldo ${esc(o.nome)} ${o.saldo <= 0 ? "esgotado" : "baixo"}</b><small>Restam ${kz(o.saldo)}</small></span>
      <button class="btn sm" data-act="carregar-saldo" data-id="${o.id}">Carregar</button></div>`),
    ppAbertas.length ? `<div class="aten"><span class="aic brand">${icon("receipt")}</span><span class="atx"><b>${ppAbertas.length} pró-forma${ppAbertas.length === 1 ? "" : "s"} em aberto</b><small>${kz(soma(ppAbertas))} orçados</small></span>
      <a class="btn sm" href="#faturas" data-act="ver-abertas">Ver</a></div>` : "",
  ].filter(Boolean);

  $("#main").innerHTML = `
    <section class="ini-topo">
      <div class="saud"><span>${dataLonga()}</span><h2>${saudacao()}${nome ? ", " + esc(nome) : ""}</h2></div>
      <div class="ini-acoes">
        ${pode("vender") ? `<button class="btn" data-act="ir-proforma">Nova pró-forma</button>` : ""}
        ${pode("stock") ? `<button class="btn" data-act="mov" data-t="entrada">Entrada de stock</button>` : ""}
        ${pode("vender") ? `<a class="btn pri" href="#vender">${icon("plus")}Nova venda</a>` : ""}
      </div>
    </section>
    <section class="kpis">
      <div class="kpi hero"><span class="lab">${pode("ver_todas") ? "Vendas de hoje" : "As minhas vendas de hoje"}</span><span class="val num">${fmt(vHoje)} <small>Kz</small></span>
        <span class="ft">${deHoje.length} documento${deHoje.length === 1 ? "" : "s"}${variacao === null ? "" : ` · <b class="${variacao >= 0 ? "sobe" : "desce"}">${variacao >= 0 ? "▲" : "▼"} ${Math.abs(variacao)}%</b> face a ontem`}</span>
        ${pode("vender") ? `<a class="btn pri big kpi-venda" href="#vender">${icon("plus")}Nova venda</a>` : ""}</div>
      <div class="kpi"><span class="lab">Este mês</span><span class="val num">${fmt(soma(doMes))} <small>Kz</small></span><span class="ft">${doMes.length} faturas · média ${kz(doMes.length ? soma(doMes) / doMes.length : 0)}</span></div>
      <div class="kpi"><span class="lab">Por receber</span><span class="val num" style="color:${porReceber.length ? "var(--warn)" : "inherit"}">${fmt(soma(porReceber))} <small>Kz</small></span><span class="ft">${porReceber.length} fatura${porReceber.length === 1 ? "" : "s"} por pagar</span></div>
      ${pode("stock") ? `<div class="kpi k4"><span class="lab">Stock baixo</span><span class="val num" style="color:${alertas.length ? "var(--bad)" : "var(--ok)"}">${alertas.length} <small>produto${alertas.length === 1 ? "" : "s"}</small></span><span class="ft">${alertas.filter(p => p.stock <= 0).length ? alertas.filter(p => p.stock <= 0).length + " esgotado(s)" : "nenhum esgotado"}</span></div>`
        : `<div class="kpi k4"><span class="lab">Pró-formas em aberto</span><span class="val num">${ppAbertas.length}</span><span class="ft">${kz(soma(ppAbertas))}</span></div>`}
    </section>
    <nav class="atalhos" aria-label="Atalhos">${atalhos.join("")}</nav>
    ${DEMO ? `<div class="note">Modo de demonstração: dados de exemplo, guardados só neste navegador. Toque no seu nome para <b>ver como vendedor</b> e experimentar as permissões.</div>` : ""}
    ${semStock ? `<div class="note warn">Ainda não há stock registado. Vá a <a href="#stock">Stock</a> e faça a <b>contagem inicial</b> para poder vender os produtos.</div>` : ""}
    <section class="dash">
      <div class="panel chart"><div class="panel-h"><h2>Vendas</h2><div class="seg" role="group" aria-label="Período do gráfico">${[[7, "7 dias"], [14, "14 dias"], [30, "30 dias"]].map(([v, t]) => `<button data-act="ini-dias" data-v="${v}" aria-pressed="${nd === v}">${t}</button>`).join("")}</div></div>${grafico(dias, porDia)}</div>
      <div class="panel"><div class="panel-h"><h2>Precisa de atenção</h2></div>
        ${atencao.length ? `<div class="atens">${atencao.join("")}</div>` : `<div class="empty ok-txt">${icon("check")}Tudo em dia. Nada por pagar${pode("stock") ? " nem stock baixo" : ""}.</div>`}</div>
    </section>
    <section class="dash">
      <div class="panel"><div class="panel-h"><h2>Últimos documentos</h2><a class="btn sm" href="#faturas">Ver todos</a></div>${listaDocs(ultimos)}</div>
      <div class="panel"><div class="panel-h"><h2>Mais vendidos</h2><span class="sub">este mês</span></div>
        <div class="hbars">${top.length ? top.map(([n, v]) => `<div class="hbar"><span class="n">${esc(n)}</span><span class="num strong">${kz(v)}</span><div class="track"><div class="fill" style="width:${(v / maxTop * 100).toFixed(1)}%"></div></div></div>`).join("") : `<div class="empty">Ainda sem vendas este mês.</div>`}</div></div>
    </section>`;
}
function larguraGrafico(max) { const m = document.getElementById("main"); return Math.round(Math.max(340, Math.min(max, (m ? m.clientWidth : max) - 40))); }
function grafico(dias, valores) {
  const W = larguraGrafico(640), H = 230, L = 46, B = 26, T = 18, R = 8;
  const max = Math.max(...valores, 1);
  const passo = [1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000].find(s => s * 4 >= max) || Math.ceil(max / 4);
  const topo = passo * 4, bw = (W - L - R) / dias.length;
  const y = v => T + (H - T - B) * (1 - v / topo);
  const k = v => v >= 1000 ? fmt(v / 1000) + "k" : fmt(v);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Vendas por dia nos últimos ${dias.length} dias">`;
  for (let i = 0; i <= 4; i++) { const v = passo * i; s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${k(v)}</text>`; }
  const hj = hoje();
  dias.forEach((d, i) => {
    const v = valores[i], x = L + i * bw + bw * .18, w = bw * .64;
    if (v > 0) s += `<rect class="bar ${d === hj ? "today" : ""}" x="${x}" y="${y(v)}" width="${w}" height="${y(0) - y(v)}" rx="3"/>`;
    if (d === hj && v > 0) s += `<text class="vlab" x="${x + w / 2}" y="${y(v) - 6}" text-anchor="middle">${k(v)}</text>`;
    const n = dias.length, mostra = n <= 7 || (n <= 14 ? i % 2 === 1 : (n - 1 - i) % 5 === 0) || d === hj;
    const rot = d === hj ? "Hoje" : n <= 7 ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][new Date(d + "T12:00").getDay()] : d.slice(8, 10) + "/" + d.slice(5, 7);
    if (mostra) s += `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${rot}</text>`;
  });
  return s + "</svg>";
}

/* ============================================================ documentos (FR / FT / PP) */
function tabelaFaturas(lista, curta = false) {
  if (!lista.length) return `<div class="empty">Nenhum documento encontrado.</div>`;
  const comVend = pode("ver_todas") && !curta;
  return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th>${comVend ? '<th class="hide-m">Vendedor</th>' : ""}<th class="r">Total</th><th>Estado</th></tr></thead><tbody>
    ${lista.map(f => { const [et, ec] = estadoDoc(f); return `<tr class="click ${f.estado === "anulada" ? "anulada" : ""}" data-act="ver-fatura" data-id="${f.id}">
      <td><span class="tdoc t-${f.tipo}">${f.tipo}</span> <span class="nf">${f.pendente ? "—" : nf(f.numero)}</span></td><td class="num">${dataPt(f.data)}<div class="muted">${horaPt(f.data)}</div></td>
      <td>${esc(f.cliente_nome)}</td>${comVend ? `<td class="hide-m muted">${esc(f.vendedor_nome)}</td>` : ""}
      <td class="r num strong val">${kz(f.total)}</td><td><span class="chip ${ec}">${et}</span></td></tr>`; }).join("")}
  </tbody></table></div>`;
}
const filtroF = { q: "", periodo: "tudo", estado: "todos", tipo: "todos" };
function vFaturas() {
  const n = E.config.numeracao;
  $("#main").innerHTML = `
    <div class="chips" id="ftipo">${[["todos", "Todos"], ["FR", "Faturas-Recibo"], ["FT", "Faturas"], ["PP", "Pró-formas"]].map(([v, t]) => `<button data-act="f-tipo" data-v="${v}" aria-pressed="${filtroF.tipo === v}">${t}</button>`).join("")}</div>
    <div class="toolbar">
      <label class="search">${icon("search")}<input id="fq" type="search" placeholder="Nº (ex.: FR 12), cliente ou vendedor" value="${esc(filtroF.q)}" aria-label="Procurar documentos"></label>
      <select class="f" id="fp" aria-label="Período">${[["hoje", "Hoje"], ["7", "Últimos 7 dias"], ["mes", "Este mês"], ["tudo", "Todas as datas"]].map(([v, t]) => `<option value="${v}" ${filtroF.periodo === v ? "selected" : ""}>${t}</option>`).join("")}</select>
      <select class="f" id="fe" aria-label="Estado">${[["todos", "Todos os estados"], ["pagar", "Por pagar"], ["aberto", "Pró-formas em aberto"], ["anulada", "Anulados"], ["convertida", "Convertidas"]].map(([v, t]) => `<option value="${v}" ${filtroF.estado === v ? "selected" : ""}>${t}</option>`).join("")}</select>
      ${pode("vender") ? `<a class="btn pri" href="#vender">${icon("plus")}Nova venda</a>` : ""}
    </div>
    <div class="panel"><div class="panel-h"><h2 id="f-res"></h2><span class="sub">Próximos: <b class="nf">FR ${nf(n.FR)}</b> · <b class="nf">FT ${nf(n.FT)}</b> · <b class="nf">PP ${nf(n.PP)}</b></span></div><div id="f-lista"></div></div>`;
  const upd = () => {
    filtroF.q = $("#fq").value; filtroF.periodo = $("#fp").value; filtroF.estado = $("#fe").value;
    const q = filtroF.q.trim().toLowerCase().replace(/\s+/g, " "), h = hoje(), d7 = Local.dia(6, "00:00").slice(0, 10);
    const l = [...docs()].sort((a, b) => b.data.localeCompare(a.data)).filter(f =>
      (filtroF.tipo === "todos" || f.tipo === filtroF.tipo) &&
      (!q || docNum(f).toLowerCase().includes(q) || String(f.numero) === q || f.cliente_nome.toLowerCase().includes(q) || (f.vendedor_nome || "").toLowerCase().includes(q)) &&
      (filtroF.estado === "todos" || (filtroF.estado === "pagar" ? f.tipo === "FT" && !f.pago && f.estado === "emitida" : filtroF.estado === "aberto" ? f.tipo === "PP" && f.estado === "emitida" : f.estado === filtroF.estado)) &&
      (filtroF.periodo === "tudo" || (filtroF.periodo === "hoje" ? diaDe(f.data) === h : filtroF.periodo === "mes" ? f.data.startsWith(h.slice(0, 7)) : diaDe(f.data) >= d7)));
    const tot = l.filter(f => f.tipo !== "PP" && f.estado === "emitida").reduce((s, f) => s + f.total, 0);
    $("#f-res").textContent = `${l.length} documento${l.length === 1 ? "" : "s"} · faturado ${kz(tot)}`;
    $("#f-lista").innerHTML = tabelaFaturas(l);
  };
  $("#fq").oninput = upd; $("#fp").onchange = upd; $("#fe").onchange = upd; upd();
  vFaturas.upd = upd;
}
function papelFatura(f) {
  const emp = E.config.empresa, formas = E.config.formas_pagamento;
  const linhas = [...f.itens]; while (linhas.length < 8) linhas.push(null);
  const titulo = TITULO_DOC[f.tipo];
  const carimbo = f.estado === "anulada" ? "ANULADA" : f.estado === "convertida" ? "CONVERTIDA" : "";
  const pagamento = f.tipo === "PP"
    ? `<div class="fp"><div class="lb">Validade</div><div>Válida até <b>${dataPt(f.validade || "")}</b></div><div class="nota-pp">Documento de orçamento. Não serve de fatura nem de recibo.</div></div>`
    : `<div class="fp"><div class="lb">Forma de pagamento</div>${formas.map(m => `<div class="ck"><i>${m === f.forma_pagamento ? "✓" : ""}</i>${esc(m)}</div>`).join("")}
        ${f.tipo === "FT" ? `<div class="estado-pag ${f.pago ? "pg" : ""}">${f.pago ? `Paga em ${dataPt(f.pago_em)}` : "Por pagar"}</div>` : ""}</div>`;
  return `<div class="paper"><div class="pp">
    <div class="tipo-faixa f-${carimbo ? "anulada" : f.tipo}"><b>${titulo}${carimbo ? ` · ${carimbo}` : ""}</b><span>${significadoDoc(f)}</span></div>
    <div class="hd">
      <div><img src="${LOGO_AZUL}" alt="Grupo Kambas"><div class="act">${esc(emp.actividade)}</div><div class="ct">${esc(emp.telefones)}<br>${esc(emp.email)}${emp.nif ? `<br>NIF ${esc(emp.nif)}` : ""}${emp.endereco ? `<br>${esc(emp.endereco)}` : ""}</div></div>
      <div class="ttl"><span class="w ${f.tipo !== "FT" ? "long" : ""} w-${f.tipo}">${titulo}</span><span class="n">Nº ${docNum(f)}</span>${carimbo ? `<span class="an">${carimbo}</span>` : ""}
        <div class="dt"><div class="lb">Data</div><div class="num">${dataPt(f.data)} &nbsp;${horaPt(f.data)}</div></div></div>
    </div>
    <div class="cli">
      <div><div class="lb">Cliente</div><div>${esc(f.cliente_nome)}</div></div>
      <div><div class="lb">NIF</div><div>${esc(f.cliente_nif)}</div></div>
      <div><div class="lb">Endereço</div><div>${esc(f.cliente_endereco)}</div></div>
      <div><div class="lb">Telefone</div><div>${esc(f.cliente_telefone)}</div></div>
    </div>
    <table><thead><tr><th style="width:11%">Qtd.</th><th>Descrição</th><th class="rt" style="width:22%">Preço unit.</th><th class="rt" style="width:22%">Total</th></tr></thead>
      <tbody>${linhas.map(it => it ? `<tr><td class="c num">${it.qtd}</td><td>${esc(it.descricao)}</td><td class="rt num">${kz(it.preco_unit)}</td><td class="rt num"><b>${kz(it.total)}</b></td></tr>` : `<tr><td></td><td></td><td></td><td></td></tr>`).join("")}</tbody></table>
    <div class="bt">${pagamento}
      <div class="tt"><div><span class="lb">Subtotal</span><span class="num">${kz(f.subtotal)}</span></div><div><span class="lb">Desconto</span><span class="num">${kz(f.desconto)}</span></div><div class="g"><span class="lb">${{ FR: "Total pago", FT: "Total a pagar", PP: "Total" }[f.tipo]}</span><b class="num">${kz(f.total)}</b></div></div>
    </div>
    <div class="obs"><div class="lb">Observações</div><div>${esc(f.observacoes)}</div></div>
    <div class="sig"><div><span class="vend">${esc(f.vendedor_nome)}</span>O vendedor / carimbo</div></div>
    <div class="ft"><b>${esc(emp.slogan)}</b><span class="num">${esc(emp.contas[0].banco)} &nbsp;${esc(emp.contas[0].iban)}</span></div>
  </div></div>`;
}
function verFatura(id, acabada = false) {
  const f = byId(E.faturas, id); if (!f) return;
  const meu = (f.vendedor_id === E.eu.id || pode("ver_todas")) && !f.pendente;
  const acoes = [];
  if (f.estado === "emitida" && f.tipo === "PP" && meu && pode("vender")) acoes.push(`<button class="btn pri" data-act="converter" data-id="${f.id}">Converter em fatura</button>`);
  if (f.estado === "emitida" && f.tipo === "FT" && !f.pago && meu) acoes.push(`<button class="btn pri" data-act="pagar" data-id="${f.id}">Registar pagamento</button>`);
  abrir(`<div class="sheet wide"><div class="sheet-h"><h2>${TIPOS_DOC[f.tipo]} ${docNum(f)}</h2><button class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b">${acabada ? cabecalhoEmitida(f, typeof acabada === "object" ? acabada : {}) : ""}${papelFatura(f)}
      ${f.pendente ? `<div class="note warn">${f.erro ? `O servidor não aceitou este documento: ${esc(f.erro)}` : "Feito sem internet. O número oficial é atribuído quando a ligação voltar; o PDF fica disponível depois disso."}</div>` : ""}</div>
    <div class="sheet-f">${f.estado === "emitida" && pode("anular") && !acabada && !f.pendente ? `<button class="btn danger" data-act="anular" data-id="${f.id}">Anular</button>` : ""}<span class="sp"></span>
      <button class="btn" data-act="copiar-fatura" data-id="${f.id}">Copiar resumo</button>
      ${f.pendente ? "" : `<button class="btn" data-act="pdf-fatura" data-id="${f.id}" data-espera="A gerar PDF…">${icon("down")}PDF</button><button class="btn" data-act="imprimir" data-id="${f.id}" data-espera="A preparar…">${icon("print")}Imprimir</button>`}
      ${acabada ? acoes.join("").replaceAll('class="btn pri"', 'class="btn"') : acoes.join("")}${acabada ? `<button class="btn pri" data-act="nova-venda">${icon("plus")}Nova venda</button>` : ""}</div></div>`);
}
function anular(id) {
  const f = byId(E.faturas, id);
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>Anular ${docNum(f)}?</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><p style="margin:0">O documento fica marcado como anulado (não é apagado)${f.tipo !== "PP" ? " e os produtos voltam ao stock" : ""}. Total: <b>${kz(f.total)}</b>.</p>
      <label class="field"><span>Motivo</span><input class="f" id="an-motivo" placeholder="Ex.: erro no preço, cliente desistiu"></label><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri" style="background:var(--bad);border-color:var(--bad)">Anular</button></div></form>`,
    async () => { await acao("anularDocumento", f.id, $("#an-motivo").value); toast(`${docNum(f)} anulada`); render(); verFatura(f.id); });
}
function escolherForma(id) {
  return `<div class="pay" id="${id}">${E.config.formas_pagamento.map((m, i) => `<button type="button" data-v="${esc(m)}" aria-pressed="false">${esc(m)}</button>`).join("")}</div>`;
}
function ligarEscolha(sel) {
  const box = $(sel);
  box.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); box.dispatchEvent(new Event("change")); });
  return () => box.querySelector("[aria-pressed=true]")?.dataset.v || "";
}
function converter(id) {
  const pp = byId(E.faturas, id);
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>Converter ${docNum(pp)}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><p style="margin:0">Cria um documento novo com os mesmos itens, cliente e desconto (${kz(pp.total)}). Os produtos saem do stock agora.</p>
      <div class="field"><span>Converter em</span><div class="seg" id="cv-tipo"><button type="button" data-v="FR" aria-pressed="true">Fatura-Recibo (pago agora)</button><button type="button" data-v="FT" aria-pressed="false">Fatura (a pagar)</button></div></div>
      <div class="field" id="cv-forma-f"><span>Forma de pagamento</span>${escolherForma("cv-forma")}</div><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">Converter</button></div></form>`,
    async () => {
      const tipo = tipoSel(), forma = formaSel();
      if (tipo === "FR" && !forma) falha("Escolha a forma de pagamento.");
      const novo = await acao("converterProforma", pp.id, tipo, tipo === "FR" ? forma : null);
      fechar(); render(); toast(`${docNum(novo)} emitida a partir da pró-forma`); verFatura(novo.id, true);
    });
  const tipoSel = ligarEscolha("#cv-tipo"), formaSel = ligarEscolha("#cv-forma");
  $("#cv-tipo").addEventListener("change", () => $("#cv-forma-f").hidden = tipoSel() !== "FR");
}
function pagar(id) {
  const f = byId(E.faturas, id);
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>Pagamento de ${docNum(f)}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><p style="margin:0">Cliente: <b>${esc(f.cliente_nome)}</b> · Valor: <b>${kz(f.total)}</b></p>
      <div class="field"><span>Forma de pagamento</span>${escolherForma("pg-forma")}</div><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">Confirmar pagamento</button></div></form>`,
    async () => { const forma = formaSel(); if (!forma) falha("Escolha a forma de pagamento."); await acao("registarPagamento", f.id, forma); fechar(); render(); toast(`${docNum(f)} paga`); verFatura(f.id); });
  const formaSel = ligarEscolha("#pg-forma");
}
function resumoFatura(f) {
  const emp = E.config.empresa;
  return [`*${emp.nome}* — ${TIPOS_DOC[f.tipo]} ${docNum(f)}`, `Data: ${dataPt(f.data)} ${horaPt(f.data)}`, `Cliente: ${f.cliente_nome}`, `Atendido por: ${f.vendedor_nome}`, "",
    ...f.itens.map(it => `${it.qtd} × ${it.descricao} — ${kz(it.total)}`), "",
    ...(f.desconto ? [`Subtotal: ${kz(f.subtotal)}`, `Desconto: ${kz(f.desconto)}`] : []), `*Total: ${kz(f.total)}*`,
    f.tipo === "PP" ? `Pró-forma válida até ${dataPt(f.validade || "")}` : f.tipo === "FT" && !f.pago ? "Por pagar" : `Pagamento: ${f.forma_pagamento || ""}`,
    ...((f.tipo !== "FR" && !f.pago) || f.forma_pagamento === "Transferência bancária" ? ["", ...emp.contas.slice(0, 3).map(c => `${c.banco}: ${c.iban}`), `Titular: ${emp.titular}`] : []),
    "", emp.slogan].join("\n");
}

/* ============================================================ vender */
const venda = { tipo: "FR", itens: [], cliente_id: "", forma: "", desconto: 0, descModo: "kz", recebido: 0, obs: "", q: "", sec: "Todas", cliQ: "", novoCli: null };
function maisVendidos() {
  const q = {}; emitidas().forEach(f => f.itens.forEach(it => { if (it.produto_id) q[it.produto_id] = (q[it.produto_id] || 0) + 1; }));
  return Object.entries(q).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id]) => Number(id));
}
function lerPref(k, def) { try { return localStorage.getItem("kambas-" + k) || def; } catch (e) { return def; } }
function gravarPref(k, v) { try { localStorage.setItem("kambas-" + k, v); } catch (e) { /* sem armazenamento */ } }
const NOME_SEC = s => s.replace(" Personalizados", "").replace(" Personalizadas", "");
function vVender() {
  const contagem = {}; E.produtos.forEach(p => contagem[p.seccao] = (contagem[p.seccao] || 0) + 1);
  const secs = ["Todas", "Mais vendidos", "Recargas", ...Object.keys(contagem)];
  venda.vista = venda.vista || lerPref("vista-catalogo", "grelha");
  $("#main").innerHTML = `
    <div class="pos">
      <section class="cat">
        <div class="toolbar"><label class="search big">${icon("search")}<input id="pq" type="search" placeholder="Procurar no catálogo" value="${esc(venda.q)}" aria-label="Procurar" autocomplete="off"></label>
          <div class="seg vista-cat" role="group" aria-label="Mostrar catálogo em">${[["grelha", "Grelha"], ["lista", "Lista"]].map(([v, t]) => `<button data-act="vista-cat" data-v="${v}" aria-pressed="${venda.vista === v}">${t}</button>`).join("")}</div>
          <button class="btn" data-act="avulso" aria-label="Item avulso (fora do catálogo)">${icon("plus")}<span><span class="so-pc">Item </span>avulso</span></button></div>
        <div class="chips" id="psec">${secs.map(s => `<button data-act="sec" data-v="${esc(s)}" aria-pressed="${s === venda.sec}">${s === "Mais vendidos" ? "★ " : ""}${esc(NOME_SEC(s))}${s === "Todas" ? ` <span class="cnt">${E.produtos.length}</span>` : s === "Recargas" ? ` <span class="cnt">${(E.operadores || []).length}</span>` : contagem[s] ? ` <span class="cnt">${contagem[s]}</span>` : ""}</button>`).join("")}</div>
        <div id="ptiles"></div>
      </section>
      <aside class="cart" id="cart" aria-label="Venda atual"></aside>
    </div>
    <button class="cartbar" id="cartbar" data-act="abrir-carrinho" hidden></button>`;
  $("#pq").oninput = e => { venda.q = e.target.value; tiles(); };
  $("#pq").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); const t = $("#ptiles .tile:not(.sem)"); if (t) { adicionar(t.dataset.id); toast(`${produto(t.dataset.id)?.nome || "Item"} adicionado`); e.target.select(); } } };
  tiles(); carrinho();
}
function listaTiles() {
  const q = venda.q.trim().toLowerCase();
  if (q) return E.produtos.filter(p => (p.nome + " " + p.descricao + " " + p.codigo + " " + p.seccao).toLowerCase().includes(q));
  if (venda.sec === "Mais vendidos") return maisVendidos().map(produto).filter(Boolean);
  return E.produtos.filter(p => venda.sec === "Todas" || p.seccao === venda.sec);
}
function tileHtml(p, qtd) {
  const st = estadoStock(p), sem = st === "bad" && venda.tipo !== "PP";
  const info = p.tipo === "produto"
    ? `<span class="ds ${sem ? "bad" : st === "warn" ? "warn" : ""}">${sem ? "Esgotado" : st === "warn" ? `Só ${p.stock} em stock` : `${p.stock} em stock`}</span>`
    : `<span class="ds">${esc(p.descricao || "Serviço")}</span>`;
  const acao = qtd
    ? `<span class="stepper"><button data-act="tqtd" data-id="${p.id}" data-d="-1" aria-label="Tirar um de ${esc(p.nome)}">${icon(qtd === 1 ? "trash" : "minus")}</button><b class="num" aria-live="polite">${qtd}</b><button data-act="tqtd" data-id="${p.id}" data-d="1" aria-label="Mais um de ${esc(p.nome)}">${icon("plus")}</button></span>`
    : sem ? "" : `<button class="add" data-act="add" data-id="${p.id}" aria-label="Adicionar ${esc(p.nome)}">${icon("plus")}</button>`;
  return `<div class="tile ${qtd ? "in" : ""} ${sem ? "sem" : ""}" data-act="add" data-id="${p.id}">
    <span class="nm">${esc(p.nome)}</span>
    <span class="sub"><b class="pr num ${p.modo === "consulta" ? "consulta" : ""}">${precoCurto(p)}</b>${info}</span>
    <span class="ta">${acao}</span></div>`;
}
function tiles() {
  const q = venda.q.trim();
  if (venda.sec === "Recargas" && !q) { $("#ptiles").innerHTML = `<h3 class="sec-h">Recargas · escolha o operador</h3>${opGrade(E.operadores || [])}`; return; }
  const l = venda.sec === "Recargas" ? E.produtos.filter(p => (p.nome + " " + p.descricao + " " + p.codigo + " " + p.seccao).toLowerCase().includes(q.toLowerCase())) : listaTiles();
  const opsQ = q ? (E.operadores || []).filter(o => (o.nome + " " + o.categoria + " recarga saldo").toLowerCase().includes(q.toLowerCase())) : [];
  const topoOps = opsQ.length ? `<h3 class="sec-h">Recargas</h3>${opGrade(opsQ)}` : "";
  const noCarrinho = {}; venda.itens.forEach(i => { if (i.produto_id) noCarrinho[i.produto_id] = (noCarrinho[i.produto_id] || 0) + i.qtd; });
  const lista = venda.vista === "lista" || matchMedia("(max-width: 900px)").matches;
  const cls = `tiles ${lista ? "lista" : ""}`;
  const grade = ps => `<div class="${cls}">${ps.map(p => tileHtml(p, noCarrinho[p.id])).join("")}</div>`;
  if (!l.length && topoOps) { $("#ptiles").innerHTML = topoOps; return; }
  if (!l.length) {
    $("#ptiles").innerHTML = `<div class="empty">${q ? `Nada encontrado para “${esc(q)}”. Use <b>Item avulso</b> para vender algo fora do catálogo.` : "Ainda sem vendas para mostrar os mais vendidos."}</div>`;
    return;
  }
  if (q || venda.sec !== "Todas") { $("#ptiles").innerHTML = topoOps + (q ? `<h3 class="sec-h">${l.length} resultado${l.length === 1 ? "" : "s"}</h3>` : "") + grade(l); return; }
  // "Todas": mais vendidos no topo e o catálogo agrupado por secção
  const mv = maisVendidos().map(produto).filter(Boolean).slice(0, 8);
  const grupos = {}; l.forEach(p => (grupos[p.seccao] = grupos[p.seccao] || []).push(p));
  $("#ptiles").innerHTML = (mv.length ? `<h3 class="sec-h">Mais vendidos</h3><div class="mvs">${mv.map(p => `<button class="mv ${noCarrinho[p.id] ? "in" : ""}" data-act="add" data-id="${p.id}"><b>${esc(p.nome)}</b><span class="num">${precoCurto(p)}</span>${noCarrinho[p.id] ? `<span class="badge">${noCarrinho[p.id]}</span>` : ""}</button>`).join("")}</div>` : "")
    + ((E.operadores || []).length ? `<h3 class="sec-h">Recargas <span>· ${(E.operadores || []).length}</span></h3>${opGrade(E.operadores)}` : "")
    + Object.entries(grupos).map(([s, ps]) => `<h3 class="sec-h">${esc(s)} <span>· ${ps.length}</span></h3>${grade(ps)}`).join("");
}
function totaisVenda() {
  const sub = venda.itens.reduce((s, i) => s + (i.qtd * (i.preco_unit || 0)), 0);
  const bruto = venda.descModo === "pct" ? Math.round(sub * Math.min(100, venda.desconto || 0) / 100) : (venda.desconto || 0);
  const desc = Math.min(Math.max(0, bruto), sub);
  return { sub, desc, tot: sub - desc };
}
function clienteSel() { return venda.cliente_id ? byId(E.clientes, venda.cliente_id) : null; }
function blocoCliente() {
  const c = clienteSel();
  if (c) return `<div class="cli-card"><span class="cav">${esc(((c.nome || "").match(/[\p{L}\d]+/gu) || ["?"]).map(x => x[0]).slice(0, 2).join("").toUpperCase())}</span><div style="min-width:0"><div class="strong">${esc(c.nome)}</div><div class="cod">${[c.nif && "NIF " + esc(c.nif), esc(c.telefone)].filter(Boolean).join(" · ") || "Sem NIF nem telefone"}</div></div>
    <button class="btn sm" data-act="cli-editar" data-id="${c.id}">Editar</button><button class="btn sm" data-act="cli-trocar">Trocar</button></div>`;
  if (venda.novoCli) {
    const n = venda.novoCli;
    return `<div class="cli-novo"><div class="eyebrow" style="font-size:10.5px">Novo cliente</div>
      <input class="f" id="nc-nome" placeholder="Nome *" value="${esc(n.nome)}" autocomplete="off">
      <div class="grid2" style="gap:8px"><input class="f" id="nc-nif" placeholder="NIF" value="${esc(n.nif)}" autocomplete="off"><input class="f" id="nc-tel" placeholder="Telefone" inputmode="tel" value="${esc(n.telefone)}" autocomplete="off"></div>
      <input class="f" id="nc-end" placeholder="Endereço" value="${esc(n.endereco)}" autocomplete="off">
      <div id="nc-err"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn sm" data-act="cli-cancelar">Cancelar</button><button class="btn sm pri" data-act="cli-guardar">Guardar e usar na venda</button></div></div>`;
  }
  return `<div class="cli-busca"><label class="search">${icon("search")}<input id="vcliq" type="search" placeholder="Nome, NIF ou telefone do cliente" value="${esc(venda.cliQ)}" autocomplete="off" aria-label="Procurar cliente"></label>
    <div id="vclires" class="cli-res"></div></div>`;
}
function resultadosCliente() {
  const box = $("#vclires"); if (!box) return;
  const q = venda.cliQ.trim().toLowerCase(), qd = q.replace(/\D/g, "");
  const l = q ? E.clientes.filter(c => c.nome.toLowerCase().includes(q) || (qd.length >= 3 && (c.nif + c.telefone).replace(/\D/g, "").includes(qd)) || c.nif.toLowerCase().includes(q)).slice(0, 5) : [];
  box.innerHTML = (q ? l.map(c => `<button data-act="cli-usar" data-id="${c.id}"><span class="strong">${esc(c.nome)}</span><span class="cod">${[c.nif && "NIF " + esc(c.nif), esc(c.telefone)].filter(Boolean).join(" · ")}</span></button>`).join("") : "")
    + `<button class="novo" data-act="cli-novo">${icon("plus")}${q ? `Registar “${esc(venda.cliQ.trim())}” como novo cliente` : "Registar novo cliente"}</button>`
    + (q ? "" : `<div class="cod" style="padding:4px 2px 0">Sem cliente, a fatura sai em nome de “Consumidor final”.</div>`);
}
function carrinho() {
  const { sub, desc, tot } = totaisVenda();
  const n = venda.itens.reduce((s, i) => s + i.qtd, 0);
  const aberto = $("#cart")?.classList.contains("open");
  const numerario = venda.tipo === "FR" && venda.forma === "Numerário", troco = venda.recebido - tot;
  const nomeTipo = { FR: "Fatura-Recibo", FT: "Fatura", PP: "Pró-forma" }[venda.tipo];
  venda.extras = venda.extras || { desc: false, obs: false };
  const verDesc = venda.extras.desc || venda.desconto, verObs = venda.extras.obs || venda.obs;
  $("#cart").innerHTML = `
    <div class="cart-h"><button class="icon-btn cart-close" data-act="fechar-carrinho" aria-label="Voltar ao catálogo">${icon("left")}</button>
      <h2>Nova ${nomeTipo}</h2>${venda.itens.length ? `<button class="btn sm ghost-bad" data-act="limpar-venda">Limpar</button>` : ""}</div>
    <div class="cart-b">
      <div class="field"><span>Documento</span>
        <div class="tipos" role="radiogroup" aria-label="Tipo de documento">${[["FR", "Fatura-Recibo", "Pago agora"], ["FT", "Fatura", "Paga depois"], ["PP", "Pró-forma", "Orçamento"]].map(([v, t, s]) => `<button class="tipo t-${v}" data-act="doc-tipo" data-v="${v}" role="radio" aria-checked="${venda.tipo === v}"><b>${t}</b><small>${s}</small></button>`).join("")}</div>
        <div class="cod tipo-ajuda">${{ FR: "Pago no acto: emite fatura e recibo no mesmo documento.", FT: "O cliente paga depois. Registe o pagamento quando receber.", PP: `Orçamento: não mexe no stock nem conta como venda. Válida ${E.config.validade_proforma || 15} dias.` }[venda.tipo]}</div></div>
      <div class="field"><span>Cliente</span>${blocoCliente()}</div>
      <div class="field"><span>${n ? `${n} ${n === 1 ? "item" : "itens"}` : "Itens"}</span>
      ${venda.itens.length ? `<div class="lines">${venda.itens.map((it, i) => {
        if (it.operador_id) { const o = operador(it.operador_id) || { nome: "?", categoria: "" }; return `<div class="line rec"><div class="nm"><span class="rec-t"><span class="opi sm">${opIcon(o)}</span>Recarga ${esc(o.nome)}</span>
          <div class="cod">${it.referencia ? esc(it.referencia) + " · " : ""}saldo ${esc(o.nome)}: ${kz(o.saldo)}</div></div>
          <div class="tot num">${kz(it.preco_unit * it.qtd)}</div>
          <div class="ctr"><button type="button" class="btn sm" data-act="recarga" data-id="${o.id}">${icon("plus")}Outra recarga</button><button class="icon-btn rm-btn" data-act="rm" data-i="${i}" aria-label="Remover recarga ${esc(o.nome)}">${icon("trash")}</button></div></div>`; }
        const p = produto(it.produto_id); const tier = p && p.tier_qtd && it.qtd >= p.tier_qtd && it.preco_unit === p.tier_preco;
        const proxTier = p && p.tier_qtd && it.qtd < p.tier_qtd && !it.manual ? p.tier_qtd - it.qtd : 0;
        return `<div class="line"><div class="nm">${esc(it.descricao)}<div class="cod">${p ? (p.tipo === "produto" ? `${p.codigo} · ${p.stock} em stock` : p.codigo + " · serviço") : "Item avulso"}</div></div>
          <div class="tot num">${kz(it.qtd * (it.preco_unit || 0))}</div>
          <div class="ctr"><span class="qty"><button data-act="qtd" data-i="${i}" data-d="-1" aria-label="Menos">${icon("minus")}</button><input id="q${i}" class="num" inputmode="numeric" value="${it.qtd}" data-i="${i}" aria-label="Quantidade"><button data-act="qtd" data-i="${i}" data-d="1" aria-label="Mais">${icon("plus")}</button></span>
            <label class="price-in">× <input id="pr${i}" class="num ${it.preco_unit ? "" : "need"}" inputmode="numeric" value="${it.preco_unit ? fmt(it.preco_unit) : ""}" placeholder="preço" data-i="${i}" aria-label="Preço unitário"> Kz</label>
            <button class="icon-btn rm-btn" data-act="rm" data-i="${i}" aria-label="Remover ${esc(it.descricao)}">${icon("trash")}</button></div>
          ${tier ? `<div class="hint">Preço por quantidade aplicado (${p.tier_qtd}+ un.)</div>` : ""}${proxTier && proxTier <= 5 ? `<div class="hint" style="color:var(--brand-deep)">Mais ${proxTier} un. e o preço baixa para ${kz(p.tier_preco)}</div>` : ""}${p && p.modo === "consulta" && !it.preco_unit ? `<div class="hint" style="color:var(--warn)">Por consulta: indique o preço combinado</div>` : ""}${p && p.modo === "a_partir" ? `<div class="hint" style="color:var(--ink-3)">Mínimo ${kz(p.preco)}, ajuste ao pedido</div>` : ""}</div>`;
      }).join("")}</div>` : `<div class="empty vazio-cart">${icon("cart")}<span>Toque no <b>+</b> de um produto ou serviço para o adicionar.</span></div>`}</div>
      <div class="extras">
        ${verDesc ? `<div class="extra"><span class="ex-l">Desconto <span class="seg mini">${[["kz", "Kz"], ["pct", "%"]].map(([v, t]) => `<button data-act="desc-modo" data-v="${v}" aria-pressed="${venda.descModo === v}">${t}</button>`).join("")}</span></span>
          <input id="vdesc" class="f num" inputmode="numeric" value="${venda.desconto ? fmt(venda.desconto) : ""}" placeholder="0" aria-label="Desconto">${desc ? `<span class="ex-v num">− ${kz(desc)}</span>` : ""}</div>` : `<button class="btn-extra" data-act="ver-extra" data-v="desc">${icon("plus")}Desconto</button>`}
        ${verObs ? `<label class="extra col"><span class="ex-l">Observação</span><textarea class="f" id="vobs" rows="2" placeholder="Ex.: entrega em 2 dias úteis, arte enviada por WhatsApp">${esc(venda.obs)}</textarea></label>` : `<button class="btn-extra" data-act="ver-extra" data-v="obs">${icon("plus")}Observação</button>`}
      </div>
      ${venda.tipo === "FR" ? `<div class="field"><span>Pagamento</span><div class="pay">${E.config.formas_pagamento.map(m => `<button data-act="forma" data-v="${esc(m)}" aria-pressed="${venda.forma === m}">${esc(m)}</button>`).join("")}</div>
        ${numerario ? `<div class="receb"><label for="vrec">Recebido</label><input id="vrec" class="f num" inputmode="numeric" value="${venda.recebido ? fmt(venda.recebido) : ""}" placeholder="0">
          ${venda.recebido ? `<span class="${troco < 0 ? "falta" : "troco"}">${troco < 0 ? "Falta" : "Troco"} <b class="num">${kz(Math.abs(troco))}</b></span>` : ""}</div>` : ""}</div>` : ""}
      <div id="v-err"></div>
    </div>
    <div class="cart-f">
      ${desc ? `<div class="sub-l"><span>Subtotal ${kz(sub)}</span><span>Desconto − ${kz(desc)}</span></div>` : ""}
      <div class="tot-l"><span>Total${n ? ` · ${n} ${n === 1 ? "item" : "itens"}` : ""}</span><b class="num">${kz(tot)}</b></div>
      <button class="btn big emitir-btn e-${venda.tipo}" data-act="emitir" ${venda.itens.length ? "" : "disabled"}>${icon("check")}Emitir ${nomeTipo} <span class="en">${venda.tipo} ${nf(E.config.numeracao[venda.tipo] || 1)}</span></button>
    </div>`;
  if (aberto) $("#cart").classList.add("open");
  const bar = $("#cartbar");
  if (bar) {
    bar.hidden = !venda.itens.length || aberto;
    bar.innerHTML = `<span class="cb-n num">${n}</span><span class="cb-t"><small>${n} ${n === 1 ? "item" : "itens"} · ${nomeTipo}</small><b class="num">${kz(tot)}</b></span><span class="cb-go">Continuar${icon("right")}</span>`;
    bar.setAttribute("aria-label", `Ver venda: ${n} ${n === 1 ? "item" : "itens"}, ${kz(tot)}`);
  }
  const cq = $("#vcliq");
  if (cq) { cq.oninput = e => { venda.cliQ = e.target.value; resultadosCliente(); }; resultadosCliente(); }
  if (venda.novoCli) ["nome", "nif", "tel", "end"].forEach(k => { $("#nc-" + k).oninput = e => venda.novoCli[{ tel: "telefone", end: "endereco" }[k] || k] = e.target.value; });
  if ($("#vobs")) $("#vobs").oninput = e => venda.obs = e.target.value;
  if ($("#vdesc")) $("#vdesc").onchange = e => { venda.desconto = inteiro(e.target.value) || 0; carrinho(); };
  if ($("#vrec")) $("#vrec").onchange = e => { venda.recebido = inteiro(e.target.value) || 0; carrinho(); };
  venda.itens.forEach((it, i) => {
    if (it.operador_id) return;
    $("#q" + i).onchange = e => mudarQtd(i, (inteiro(e.target.value) || 1) - it.qtd);
    $("#pr" + i).onchange = e => { it.preco_unit = inteiro(e.target.value) || 0; it.manual = true; carrinho(); };
  });
}
async function guardarClienteVenda() {
  const d = venda.novoCli;
  try {
    const c = await acao("guardarCliente", d);
    Object.assign(venda, { cliente_id: String(c.id), novoCli: null, cliQ: "" });
    carrinho(); toast(`${c.nome} registado e escolhido para a venda`);
  } catch (e) { $("#nc-err").innerHTML = `<div class="err">${esc(e.message)}</div>`; if (!(e instanceof ErroNegocio)) console.error(e); }
}
function itemAvulso() {
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>Item avulso</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><p class="note" style="margin:0">Para vender algo que não está no catálogo (ex.: um trabalho por medida). Não mexe no stock.</p>
      <label class="field"><span>Descrição</span><input class="f" id="av-d" placeholder="Ex.: Banner 3 × 1 m com ilhós" required></label>
      <div class="grid2"><label class="field"><span>Quantidade</span><input class="f num" id="av-q" inputmode="numeric" value="1"></label>
        <label class="field"><span>Preço unitário (Kz)</span><input class="f num" id="av-p" inputmode="numeric" placeholder="Ex.: 15000"></label></div><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">Adicionar à venda</button></div></form>`,
    async () => {
      const descricao = $("#av-d").value.trim(), qtd = inteiro($("#av-q").value), preco = inteiro($("#av-p").value);
      if (!descricao) falha("Escreva a descrição."); if (!(qtd > 0)) falha("Quantidade inválida."); if (!(preco > 0)) falha("Indique o preço em Kz.");
      venda.itens.push({ produto_id: null, descricao, qtd, preco_unit: preco, manual: true });
      fechar(); carrinho(); toast(`${descricao} adicionado`);
    });
  setTimeout(() => $("#av-d").focus(), 50);
}
function mudarQtd(i, d) {
  const it = venda.itens[i], p = produto(it.produto_id);
  let q = Math.max(1, it.qtd + d);
  if (p && p.tipo === "produto" && venda.tipo !== "PP" && q > p.stock) { q = Math.max(1, p.stock); toast(`Só há ${p.stock} em stock de ${p.nome}`); }
  it.qtd = q;
  if (p && !it.manual && p.modo === "fixo") it.preco_unit = precoPara(p, q);
  carrinho(); tiles();
}
function adicionar(id) {
  const p = produto(id); if (!p) return;
  const i = venda.itens.findIndex(x => x.produto_id === p.id);
  if (i >= 0) return mudarQtd(i, 1);
  if (p.tipo === "produto" && p.stock <= 0 && venda.tipo !== "PP") return toast("Produto esgotado");
  venda.itens.push({ produto_id: p.id, descricao: p.nome, qtd: 1, preco_unit: p.modo === "consulta" ? 0 : precoPara(p, 1), manual: false });
  carrinho(); tiles();
}
async function emitir() {
  if (venda.emitindo) return;   // dois toques nunca criam duas faturas
  const { desc, tot } = totaisVenda();
  const err = m => { $("#v-err").innerHTML = `<div class="err">${esc(m)}</div>`; $("#v-err").scrollIntoView({ block: "nearest" }); };
  if (venda.novoCli) return err("Termine de registar o novo cliente (ou cancele) antes de emitir.");
  if (venda.tipo === "FR" && !venda.forma) return err("Escolha a forma de pagamento.");
  let obs = venda.obs.trim();
  if (venda.tipo === "FR" && venda.forma === "Numerário" && venda.recebido) obs = `${obs}\nRecebido: ${kz(venda.recebido)} · ${venda.recebido >= tot ? "Troco: " + kz(venda.recebido - tot) : "Falta: " + kz(tot - venda.recebido)}`.trim();
  venda.emitindo = true;
  const info = { forma: venda.tipo === "FR" ? venda.forma : null, recebido: venda.recebido };
  const btn = $("[data-act=emitir]");
  if (btn) { btn.disabled = true; btn.classList.add("a-emitir"); btn.innerHTML = `<span class="spin" aria-hidden="true"></span>A emitir…<span class="bprog"><i></i></span>`; }
  ocupado(true);
  try {
    const f = await acao("registarDocumento", { tipo: venda.tipo, cliente_id: venda.cliente_id ? (ehTemp(venda.cliente_id) ? venda.cliente_id : Number(venda.cliente_id)) : null, forma_pagamento: venda.tipo === "FR" ? venda.forma : null, desconto: desc, observacoes: obs,
      itens: venda.itens.map(i => ({ produto_id: i.produto_id, operador_id: i.operador_id || null, referencia: i.referencia || "", descricao: i.descricao, qtd: i.qtd, preco_unit: i.preco_unit })) });
    Object.assign(venda, { tipo: "FR", itens: [], cliente_id: "", forma: "", desconto: 0, descModo: "kz", recebido: 0, obs: "", cliQ: "", novoCli: null, extras: { desc: false, obs: false } });
    venda.emitindo = false; ocupado(false);
    render(); verFatura(f.id, info);
  } catch (e) { venda.emitindo = false; ocupado(false); carrinho(); err(e.message); if (!(e instanceof ErroNegocio)) console.error(e); }
}
/* cabeçalho animado depois de emitir: número, total e troco */
function cabecalhoEmitida(f, info = {}) {
  const n = f.itens.reduce((s, i) => s + i.qtd, 0), pend = f.pendente;
  const troco = info.forma === "Numerário" && info.recebido >= f.total ? info.recebido - f.total : null;
  const lab = pend ? "Venda guardada neste aparelho" : `${TIPOS_DOC[f.tipo]} emitida`;
  const totLab = f.tipo === "FR" ? `Pago${f.forma_pagamento ? " · " + esc(f.forma_pagamento) : ""}` : f.tipo === "FT" ? "A pagar" : "Orçamento";
  return `<div class="emitida e-${pend ? "pend" : f.tipo}" role="status">
    <span class="em-circ">${pend ? icon("wallet") : `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="em-visto" d="M5 12.5l4.5 4.5L19 7.5"/></svg>`}</span>
    <span class="em-tx"><small>${lab}</small><b>${pend ? "Por enviar" : docNum(f)}</b><span>${esc(f.cliente_nome)} · ${n} ${n === 1 ? "item" : "itens"}</span></span>
    <span class="em-tot"><small>${totLab}</small><b class="num">${kz(f.total)}</b>${troco !== null ? `<span>Troco <b class="num">${kz(troco)}</b></span>` : ""}</span></div>
    ${pend ? `<p class="cod" style="margin:-4px 0 0">É enviada sozinha quando houver internet; o número oficial vem do servidor.</p>` : ""}`;
}

/* ============================================================ recargas e saldos */
const ICON_CAT = { "Telemóvel": "phone", "Televisão": "tv", "Energia": "bolt", "Água": "drop" };
const opIcon = o => icon(ICON_CAT[o.categoria] || "wallet");
const operador = id => (E.operadores || []).find(o => String(o.id) === String(id));
const opEstado = o => o.saldo <= 0 ? "bad" : o.saldo < (o.saldo_min || 0) ? "warn" : "ok";
const noCarrinhoOp = id => venda.itens.filter(i => String(i.operador_id) === String(id)).reduce((s, i) => s + i.qtd * i.preco_unit, 0);
function opCard(o) {
  const livre = o.saldo - (venda.tipo === "PP" ? 0 : noCarrinhoOp(o.id)), n = venda.itens.filter(i => String(i.operador_id) === String(o.id)).length;
  const st = livre <= 0 ? "bad" : livre < (o.saldo_min || 0) ? "warn" : "ok";
  return `<button class="opc s-${st}" data-act="recarga" data-id="${o.id}" aria-label="Vender recarga ${esc(o.nome)}, saldo ${kz(livre)}">
    <span class="opi">${opIcon(o)}</span><span class="opt"><b>${esc(o.nome)}</b><small>${esc(o.categoria)}</small></span>
    <span class="ops-s"><small>Saldo</small><b class="num">${kz(Math.max(0, livre))}</b></span>${n ? `<span class="badge">${n}</span>` : ""}</button>`;
}
const opGrade = ops => ops.length ? `<div class="ops">${ops.map(opCard).join("")}</div>` : `<div class="empty">Sem operadores de recarga.</div>`;
function formRecarga(id) {
  const o = operador(id); if (!o) return;
  const pp = venda.tipo === "PP", usado = pp ? 0 : noCarrinhoOp(o.id), livre = o.saldo - usado;
  const rapidos = ["Telemóvel"].includes(o.categoria) ? [500, 1000, 2000, 5000, 10000] : [2000, 5000, 10000, 20000, 50000];
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2 class="rc-h"><span class="opi">${opIcon(o)}</span>Recarga ${esc(o.nome)}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b">
      <div class="rc-saldo s-${livre <= 0 ? "bad" : livre < o.saldo_min ? "warn" : "ok"}"><span>Saldo ${esc(o.nome)} disponível</span><b class="num">${kz(livre)}</b>
        <small id="rc-fica">${pp ? "Pró-forma: o saldo só sai quando for convertida em fatura." : usado ? `Já há ${kz(usado)} desta operadora nesta venda.` : "Escolha o valor da recarga."}</small></div>
      <div class="field"><span>Valor da recarga (Kz)</span>
        <div class="rc-rapidos">${rapidos.map(v => `<button type="button" data-act="rc-valor" data-v="${v}" ${!pp && v > livre ? "disabled" : ""}>${fmt(v)}</button>`).join("")}</div>
        <input class="f num rc-in" id="rc-valor" inputmode="numeric" placeholder="Outro valor" autocomplete="off" required></div>
      <label class="field"><span>${esc(o.referencia)} <em class="opc-l">(opcional)</em></span><input class="f" id="rc-ref" inputmode="${o.categoria === "Telemóvel" ? "tel" : "text"}" maxlength="40" autocomplete="off" placeholder="${o.categoria === "Telemóvel" ? "Ex.: 923 456 789" : ""}"></label>
      <div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-espera="A adicionar…">${icon("plus")}Adicionar à venda</button></div></form>`,
    async () => {
      const v = inteiro($("#rc-valor").value);
      if (!(v > 0)) falha("Indique o valor da recarga em Kz.");
      if (!pp && v > livre) falha(`Saldo ${o.nome} insuficiente: há ${kz(livre)}.`);
      const referencia = $("#rc-ref").value.trim();
      venda.itens.push({ produto_id: null, operador_id: o.id, referencia, descricao: `Recarga ${o.nome}${referencia ? " — " + referencia : ""}`, qtd: 1, preco_unit: v, manual: true });
      fechar(); carrinho(); tiles(); toast(`Recarga ${o.nome} de ${kz(v)} adicionada`, "ok");
    });
  const atualizar = () => {
    const v = inteiro($("#rc-valor").value) || 0;
    document.querySelectorAll(".rc-rapidos button").forEach(b => b.setAttribute("aria-pressed", Number(b.dataset.v) === v));
    if (!pp && v) $("#rc-fica").innerHTML = v > livre ? `<strong style="color:var(--bad)">Falta saldo: há ${kz(livre)}.</strong>` : `Depois desta recarga fica <strong>${kz(livre - v)}</strong>.`;
  };
  $("#rc-valor").oninput = atualizar;
  setTimeout(() => $("#rc-valor").focus(), 50);
}

/* página Saldos (quem gere stock) */
const filtroS = { op: "todos" };
function resumoSaldos(desde) {
  const r = {}; (E.operadores || []).forEach(o => r[o.id] = { vendido: 0, custo: 0, n: 0, carregado: 0, pago: 0 });
  (E.movimentos_saldo || []).forEach(m => {
    const x = r[m.operador_id]; if (!x || m.data < desde) return;
    if (m.tipo === "venda") { x.vendido += -m.valor; x.custo += m.custo; x.n++; }
    else if (m.tipo === "anulacao") { x.vendido -= m.valor; x.custo -= m.custo; x.n--; }
    else if (m.tipo === "carga") { x.carregado += m.valor; x.pago += m.custo; }
  });
  Object.values(r).forEach(x => x.lucro = x.vendido - x.custo);
  return r;
}
function vSaldos() {
  const ops = E.operadores || [], mes = hoje().slice(0, 7) + "-01", r = resumoSaldos(mes);
  const tot = k => Object.values(r).reduce((s, x) => s + x[k], 0);
  const saldoTotal = ops.reduce((s, o) => s + o.saldo, 0), custoTotal = ops.reduce((s, o) => s + o.custo, 0);
  const movs = (E.movimentos_saldo || []).filter(m => filtroS.op === "todos" || String(m.operador_id) === filtroS.op)
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id).slice(0, 80);
  const TIPO_MOV = { carga: ["Carga", "ok"], venda: ["Venda", "brand"], anulacao: ["Anulação", "warn"], ajuste: ["Correção", ""] };
  $("#main").innerHTML = `
    <section class="kpis">
      <div class="kpi hero"><span class="lab">Saldo disponível</span><span class="val num">${fmt(saldoTotal)} <small>Kz</small></span><span class="ft">em ${ops.length} operador${ops.length === 1 ? "" : "es"} · custou ${kz(custoTotal)}</span></div>
      <div class="kpi"><span class="lab">Recargas vendidas este mês</span><span class="val num">${fmt(tot("vendido"))} <small>Kz</small></span><span class="ft">${tot("n")} recarga${tot("n") === 1 ? "" : "s"}</span></div>
      <div class="kpi"><span class="lab">Lucro das recargas este mês</span><span class="val num" style="color:var(--ok)">${fmt(tot("lucro"))} <small>Kz</small></span><span class="ft">${tot("vendido") ? ((tot("lucro") / tot("vendido")) * 100).toFixed(1).replace(".", ",") + "% do vendido" : "sem vendas"}</span></div>
      <div class="kpi"><span class="lab">Investido este mês</span><span class="val num">${fmt(tot("pago"))} <small>Kz</small></span><span class="ft">${kz(tot("carregado"))} de saldo recebido</span></div>
    </section>
    <div class="panel"><div class="panel-h"><h2>Operadores</h2><div class="toolbar"><button class="btn sm" data-act="novo-operador">${icon("plus")}Novo operador</button><button class="btn sm pri" data-act="carregar-saldo">${icon("in")}Carregar saldo</button></div></div>
      <div class="sgrid">${ops.map(o => { const x = r[o.id], st = opEstado(o); return `<div class="scard s-${st}">
        <div class="sc-top"><span class="opi">${opIcon(o)}</span><span class="opt"><b>${esc(o.nome)}</b><small>${esc(o.categoria)}</small></span><button class="icon-btn" data-act="editar-operador" data-id="${o.id}" aria-label="Editar ${esc(o.nome)}">${icon("adj")}</button></div>
        <div class="sc-saldo"><small>Saldo disponível</small><b class="num">${kz(o.saldo)}</b>${st !== "ok" ? `<span class="chip ${st}">${st === "bad" ? "Sem saldo" : "Saldo baixo"}</span>` : ""}</div>
        <div class="sc-mini"><span>Vendido no mês<b class="num">${kz(x.vendido)}</b></span><span>Lucro no mês<b class="num" style="color:var(--ok)">${kz(x.lucro)}</b></span></div>
        <div class="sc-acoes"><button class="btn sm" data-act="ajustar-saldo" data-id="${o.id}">Corrigir</button><button class="btn sm pri" data-act="carregar-saldo" data-id="${o.id}">${icon("plus")}Carregar</button></div></div>`; }).join("")}</div></div>
    <div class="panel"><div class="panel-h"><h2>Histórico de saldos</h2>
      <select class="f" id="s-op" aria-label="Operador" style="width:auto"><option value="todos">Todos os operadores</option>${ops.map(o => `<option value="${o.id}" ${filtroS.op === String(o.id) ? "selected" : ""}>${esc(o.nome)}</option>`).join("")}</select></div>
      ${movs.length ? `<div class="dlist">${movs.map(m => { const o = operador(m.operador_id) || { nome: "—", categoria: "" }, [tt, tc] = TIPO_MOV[m.tipo] || [m.tipo, ""]; return `<div class="drow est">
        <span class="opi sm">${opIcon(o)}</span>
        <span class="dmeio"><b>${esc(o.nome)} · <span class="chip ${tc}">${tt}</span></b><small>${dataPt(m.data)} ${horaPt(m.data)}${m.ref ? " · " + esc(m.ref) : ""}${m.motivo && m.motivo !== "Venda" ? " · " + esc(m.motivo) : ""}</small></span>
        <span class="dfim"><b class="num" style="color:${m.valor >= 0 ? "var(--ok)" : "var(--ink)"}">${m.valor >= 0 ? "+" : "−"} ${kz(Math.abs(m.valor))}</b><small class="num">saldo ${kz(m.saldo_final)}</small></span></div>`; }).join("")}</div>` : `<div class="empty">Ainda não há movimentos de saldo.</div>`}</div>`;
  $("#s-op").onchange = e => { filtroS.op = e.target.value; vSaldos(); };
}
function formCarga(id) {
  const ops = E.operadores || [], o0 = operador(id) || ops[0];
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>Carregar saldo</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><div class="field"><span>Operador</span><div class="seg wrap" id="cs-op">${ops.map(o => `<button type="button" data-v="${o.id}" aria-pressed="${o === o0}">${esc(o.nome)}</button>`).join("")}</div></div>
      <div class="grid2"><label class="field"><span>Saldo recebido (Kz)</span><input class="f num" id="cs-valor" inputmode="numeric" placeholder="Ex.: 10000" required></label>
        <label class="field"><span>Quanto pagou (Kz)</span><input class="f num" id="cs-pago" inputmode="numeric" placeholder="Igual ao saldo"></label></div>
      <div class="note" id="cs-prev">Se o operador lhe dá desconto (ex.: paga 9.500 e recebe 10.000), escreva o valor pago: a diferença é o seu lucro.</div>
      <label class="field"><span>Nota (opcional)</span><input class="f" id="cs-mot" placeholder="Ex.: comprado no agente da Mutamba"></label><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-espera="A carregar…">Carregar saldo</button></div></form>`,
    async () => {
      const opId = Number($("#cs-op [aria-pressed=true]").dataset.v);
      const o = await acao("carregarSaldo", { operador_id: opId, valor: inteiro($("#cs-valor").value), pago: $("#cs-pago").value.trim() ? inteiro($("#cs-pago").value) : "", motivo: $("#cs-mot").value });
      fechar(); render(); toast(`${o.nome}: saldo ${kz(o.saldo)}`, "ok");
    });
  ligarEscolha("#cs-op");
  const prev = () => {
    const v = inteiro($("#cs-valor").value) || 0, p = $("#cs-pago").value.trim() ? inteiro($("#cs-pago").value) || 0 : v;
    if (v && p) $("#cs-prev").innerHTML = p < v ? `Lucro previsto ao vender este saldo: <b style="color:var(--ok)">${kz(v - p)}</b> (${((v - p) / v * 100).toFixed(1).replace(".", ",")}%).` : p > v ? `<b style="color:var(--warn)">Pagou mais do que o saldo recebido: estas recargas dão prejuízo.</b>` : "Sem desconto: estas recargas não dão lucro.";
  };
  $("#cs-valor").oninput = prev; $("#cs-pago").oninput = prev;
  setTimeout(() => $("#cs-valor").focus(), 50);
}
function formAjusteSaldo(id) {
  const o = operador(id); if (!o) return;
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>Corrigir saldo ${esc(o.nome)}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><p class="note" style="margin:0">Use quando o saldo no telemóvel/agente não bate com o do sistema. O sistema mostra <b>${kz(o.saldo)}</b>.</p>
      <label class="field"><span>Saldo certo agora (Kz)</span><input class="f num" id="as-saldo" inputmode="numeric" value="${o.saldo}" required></label>
      <label class="field"><span>Motivo</span><input class="f" id="as-mot" placeholder="Ex.: recarga falhada devolvida"></label><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri" data-espera="A corrigir…">Corrigir saldo</button></div></form>`,
    async () => { const r = await acao("ajustarSaldo", { operador_id: o.id, saldo: inteiro($("#as-saldo").value), motivo: $("#as-mot").value }); fechar(); render(); toast(`${r.nome}: saldo ${kz(r.saldo)}`, "ok"); });
  setTimeout(() => $("#as-saldo").select(), 50);
}
function formOperador(id) {
  const o = id ? operador(id) : { nome: "", categoria: "Telemóvel", referencia: "Número de telefone", saldo_min: 2000 };
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>${id ? "Editar " + esc(o.nome) : "Novo operador de recarga"}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><label class="field"><span>Nome</span><input class="f" id="op-nome" value="${esc(o.nome)}" required placeholder="Ex.: Movicel"></label>
      <div class="grid2"><label class="field"><span>Tipo</span><select class="f" id="op-cat">${["Telemóvel", "Televisão", "Energia", "Água", "Outros"].map(c => `<option ${c === o.categoria ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        <label class="field"><span>Avisar abaixo de (Kz)</span><input class="f num" id="op-min" inputmode="numeric" value="${o.saldo_min}"></label></div>
      <label class="field"><span>O que pedir ao cliente</span><input class="f" id="op-ref" value="${esc(o.referencia)}" placeholder="Ex.: Número de telefone"></label><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">Guardar</button></div></form>`,
    async () => { await acao("guardarOperador", { nome: $("#op-nome").value, categoria: $("#op-cat").value, referencia: $("#op-ref").value, saldo_min: $("#op-min").value }, id || null); fechar(); render(); toast("Operador guardado", "ok"); });
  setTimeout(() => $("#op-nome").focus(), 50);
}

/* ============================================================ produtos */
const filtroP = { q: "", sec: "Todas", tipo: "todos" };
function vProdutos() {
  const secs = ["Todas", ...new Set(E.produtos.map(p => p.seccao))];
  $("#main").innerHTML = `
    <div class="toolbar">
      <label class="search">${icon("search")}<input id="xq" type="search" placeholder="Procurar por nome ou código" value="${esc(filtroP.q)}" aria-label="Procurar produtos"></label>
      <select class="f" id="xs" aria-label="Secção">${secs.map(s => `<option ${s === filtroP.sec ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
      <div class="seg" id="xt">${[["todos", "Todos"], ["produto", "Produtos"], ["servico", "Serviços"]].map(([v, t]) => `<button data-act="tipo-p" data-v="${v}" aria-pressed="${filtroP.tipo === v}">${t}</button>`).join("")}</div>
      ${pode("produtos") ? `<button class="btn pri" data-act="novo-produto">${icon("plus")}Registar produto</button>` : ""}
    </div>
    <div class="panel"><div class="panel-h"><h2 id="x-res"></h2><span class="sub">Preços em kwanzas (Kz).${pode("produtos") ? " Toque numa linha para editar." : ""}</span></div><div id="x-lista"></div></div>`;
  const upd = () => {
    filtroP.q = $("#xq").value; filtroP.sec = $("#xs").value;
    const q = filtroP.q.trim().toLowerCase();
    const l = E.produtos.filter(p => (filtroP.sec === "Todas" || p.seccao === filtroP.sec) && (filtroP.tipo === "todos" || p.tipo === filtroP.tipo) && (!q || (p.nome + " " + p.codigo + " " + p.descricao).toLowerCase().includes(q)));
    $("#x-res").textContent = `${l.length} ${l.length === 1 ? "item" : "itens"} no catálogo`;
    $("#x-lista").innerHTML = l.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th class="hide-m">Código</th><th>Nome</th><th class="hide-m">Secção</th><th class="hide-m">Tipo</th><th class="r">Preço</th><th class="r">Stock</th></tr></thead><tbody>
      ${l.map(p => `<tr ${pode("produtos") ? `class="click" data-act="editar-produto" data-id="${p.id}"` : ""}><td class="cod hide-m">${p.codigo}</td>
        <td><span class="strong">${esc(p.nome)}</span>${p.descricao ? `<div class="muted">${esc(p.descricao)}</div>` : ""}<div class="cod">${p.codigo} · ${p.tipo === "produto" ? "Produto" : "Serviço"}</div>${p.tier_qtd ? `<div class="muted" style="color:var(--ok)">${p.tier_qtd}+ un.: ${kz(p.tier_preco)}</div>` : ""}</td>
        <td class="hide-m muted">${esc(p.seccao)}</td>
        <td class="hide-m">${p.tipo === "produto" ? '<span class="chip brand">Produto</span>' : '<span class="chip">Serviço</span>'}</td>
        <td class="r num strong" style="white-space:nowrap">${precoCurto(p)}</td>
        <td class="r num">${p.tipo === "produto" ? `<span class="chip ${estadoStock(p)}">${p.stock}</span>` : '<span class="muted">—</span>'}</td></tr>`).join("")}
    </tbody></table></div>` : `<div class="empty">Nenhum item encontrado.</div>`;
  };
  $("#xq").oninput = upd; $("#xs").onchange = upd; upd();
  vProdutos.upd = upd;
}
function formProduto(id) {
  const p = id ? produto(id) : { nome: "", descricao: "", seccao: filtroP.sec !== "Todas" ? filtroP.sec : E.config.seccoes[0], tipo: "produto", modo: "fixo", preco: "", tier_qtd: "", tier_preco: "", stock: "", stock_min: 5 };
  const secs = [...new Set([...E.config.seccoes, ...E.produtos.map(x => x.seccao)])];
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>${id ? "Editar " + esc(p.codigo) : "Registar produto ou serviço"}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b">
      <label class="field"><span>Nome</span><input class="f" id="p-nome" value="${esc(p.nome)}" placeholder="Ex.: Caneca personalizada" required></label>
      <label class="field"><span>Descrição</span><input class="f" id="p-desc" value="${esc(p.descricao)}" placeholder="Ex.: Com o nosso material"></label>
      <div class="grid2">
        <label class="field"><span>Secção do catálogo</span><input class="f" id="p-sec" list="secs" value="${esc(p.seccao)}"><datalist id="secs">${secs.map(s => `<option value="${esc(s)}">`).join("")}</datalist></label>
        <div class="field"><span>Tipo</span><div class="seg" id="p-tipo">${[["produto", "Produto (com stock)"], ["servico", "Serviço"]].map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${p.tipo === v}">${t}</button>`).join("")}</div></div>
      </div>
      <div class="grid2">
        <div class="field"><span>Preço</span><div class="seg" id="p-modo">${[["fixo", "Fixo"], ["a_partir", "A partir de"], ["consulta", "Por consulta"]].map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${p.modo === v}">${t}</button>`).join("")}</div></div>
        <label class="field" id="p-preco-f"><span>Preço em Kz</span><input class="f num" id="p-preco" inputmode="numeric" value="${p.preco || ""}" placeholder="Ex.: 3999"></label>
      </div>
      <div class="grid2">
        <label class="field"><span>Preço por quantidade (opcional)</span><input class="f num" id="p-tq" inputmode="numeric" value="${p.tier_qtd || ""}" placeholder="A partir de quantas unidades"></label>
        <label class="field"><span>Preço unitário nessa quantidade</span><input class="f num" id="p-tp" inputmode="numeric" value="${p.tier_preco || ""}" placeholder="Ex.: 10999"></label>
      </div>
      <div class="grid2" id="p-stock-g">
        ${id ? `<div class="field"><span>Stock atual</span><div class="num" style="padding:9px 0;font-weight:700">${p.stock} un. <small style="font-weight:400;color:var(--ink-3)">(altere em Stock)</small></div></div>` : `<label class="field"><span>Stock inicial</span><input class="f num" id="p-stock" inputmode="numeric" value="" placeholder="0"></label>`}
        <label class="field"><span>Stock mínimo (alerta)</span><input class="f num" id="p-min" inputmode="numeric" value="${p.stock_min ?? ""}"></label>
      </div>
      <div id="frm-err"></div>
    </div>
    <div class="sheet-f">${id ? `<button type="button" class="btn danger" data-act="remover-produto" data-id="${id}">${icon("trash")}Remover</button>` : ""}<span class="sp"></span><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">${id ? "Guardar alterações" : "Registar"}</button></div></form>`,
    async () => {
      const g = s => $(s)?.value ?? "";
      const d = { nome: g("#p-nome"), descricao: g("#p-desc"), seccao: g("#p-sec"), tipo: $("#p-tipo [aria-pressed=true]").dataset.v, modo: $("#p-modo [aria-pressed=true]").dataset.v,
        preco: inteiro(g("#p-preco")) || 0, tier_qtd: inteiro(g("#p-tq")) || "", tier_preco: inteiro(g("#p-tp")) || "", stock: inteiro(g("#p-stock")) || 0, stock_min: inteiro(g("#p-min")) || 0 };
      const r = await acao("guardarProduto", d, id);
      fechar(); render(); toast(id ? "Alterações guardadas" : `${r.nome} registado (${r.codigo})`);
    });
  const sync = () => {
    const tipo = $("#p-tipo [aria-pressed=true]").dataset.v, modo = $("#p-modo [aria-pressed=true]").dataset.v;
    $("#p-stock-g").hidden = tipo !== "produto"; $("#p-preco-f").hidden = modo === "consulta";
  };
  ["#p-tipo", "#p-modo"].forEach(s => $(s).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $(s).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); sync(); }));
  sync(); setTimeout(() => $("#p-nome").focus(), 50);
}

/* ============================================================ stock */
function vStock() {
  const ps = E.produtos.filter(p => p.tipo === "produto");
  const valor = ps.reduce((s, p) => s + p.stock * p.preco, 0), un = ps.reduce((s, p) => s + p.stock, 0);
  const falta = ps.filter(p => p.stock <= 0).length, baixo = ps.filter(p => estadoStock(p) === "warn").length;
  const movs = [...E.movimentos].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id).slice(0, 40);
  const ord = [...ps].sort((a, b) => ({ bad: 0, warn: 1, ok: 2 })[estadoStock(a)] - ({ bad: 0, warn: 1, ok: 2 })[estadoStock(b)] || a.codigo.localeCompare(b.codigo));
  $("#main").innerHTML = `
    ${un === 0 ? `<div class="note warn">Ainda não há stock registado. Toque em <b>Contagem geral</b> e escreva a quantidade de cada produto que tem na loja.</div>` : ""}
    <section class="kpis">
      <div class="kpi hero"><span class="lab">Valor em stock</span><span class="val num">${fmt(valor)} <small>Kz</small></span><span class="ft">a preço de venda</span></div>
      <div class="kpi"><span class="lab">Unidades</span><span class="val num">${fmt(un)}</span><span class="ft">${ps.length} produtos com stock</span></div>
      <div class="kpi"><span class="lab">Stock baixo</span><span class="val num" style="color:var(--warn)">${baixo}</span><span class="ft">no mínimo ou abaixo</span></div>
      <div class="kpi"><span class="lab">Esgotados</span><span class="val num" style="color:var(--bad)">${falta}</span><span class="ft">não aparecem para venda</span></div>
    </section>
    <div class="panel"><div class="panel-h"><h2>Níveis de stock</h2><div class="toolbar"><button class="btn sm" data-act="contagem">${icon("adj")}Contagem geral</button><button class="btn sm pri" data-act="mov" data-t="entrada">${icon("in")}Dar entrada</button></div></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>Produto</th><th class="r">Stock</th><th class="r hide-m">Mínimo</th><th class="hide-m">Estado</th><th class="r">Ações</th></tr></thead><tbody>
      ${ord.map(p => `<tr><td><span class="strong">${esc(p.nome)}</span><div class="cod">${p.codigo} · ${kz(p.preco)}</div></td>
        <td class="r num"><span class="chip ${estadoStock(p)}">${p.stock}</span></td><td class="r num hide-m muted">${p.stock_min}</td>
        <td class="hide-m"><span class="chip ${estadoStock(p)}">${rotuloStock(p)}</span></td>
        <td class="r" style="white-space:nowrap"><button class="btn sm" data-act="mov" data-t="entrada" data-id="${p.id}" aria-label="Entrada de ${esc(p.nome)}">${icon("plus")}</button> <button class="btn sm" data-act="mov" data-t="ajuste" data-id="${p.id}" aria-label="Ajustar ${esc(p.nome)}">${icon("adj")}</button></td></tr>`).join("")}
      </tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h2>Movimentos recentes</h2><span class="sub">entradas, vendas e ajustes</span></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>Data</th><th>Produto</th><th>Movimento</th><th class="r">Qtd.</th><th class="r hide-m">Fica</th><th class="hide-m">Motivo</th></tr></thead><tbody>
      ${movs.length ? "" : `<tr><td colspan="6" class="empty">Sem movimentos ainda.</td></tr>`}${movs.map(m => { const p = produto(m.produto_id) || { nome: "(removido)" }; const c = { entrada: "ok", saida: "warn", ajuste: "brand" }[m.tipo];
        return `<tr><td class="num">${dataPt(m.data)}<div class="muted">${horaPt(m.data)}</div></td><td>${esc(p.nome)}</td><td><span class="chip ${c}">${{ entrada: "Entrada", saida: "Saída", ajuste: "Ajuste" }[m.tipo]}</span></td>
        <td class="r num strong">${m.tipo === "entrada" ? "+" : m.tipo === "saida" ? "−" : "="}${m.qtd}</td><td class="r num hide-m">${m.stock_final}</td><td class="hide-m muted">${esc(m.motivo)}${m.ref ? " · " + esc(m.ref) : ""}</td></tr>`; }).join("")}
      </tbody></table></div></div>`;
}
function formMov(tipo, id) {
  const ps = E.produtos.filter(p => p.tipo === "produto");
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>Movimento de stock</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b">
      <label class="field"><span>Produto</span><select class="f" id="m-p">${ps.map(p => `<option value="${p.id}" ${p.id === Number(id) ? "selected" : ""}>${esc(p.nome)} · ${p.stock} un.</option>`).join("")}</select></label>
      <div class="field"><span>Tipo</span><div class="seg" id="m-t">${[["entrada", "Entrada"], ["saida", "Saída"], ["ajuste", "Contagem (fica com)"]].map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${v === tipo}">${t}</button>`).join("")}</div></div>
      <div class="grid2"><label class="field"><span id="m-ql">Quantidade</span><input class="f num" id="m-q" inputmode="numeric" placeholder="0" required></label>
        <label class="field"><span>Motivo</span><input class="f" id="m-m" placeholder="Ex.: compra ao fornecedor"></label></div>
      <div class="note" id="m-prev"></div><div id="frm-err"></div>
    </div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">Registar movimento</button></div></form>`,
    async () => { const p = await acao("movimentoStock", { produto_id: Number($("#m-p").value), tipo: $("#m-t [aria-pressed=true]").dataset.v, qtd: inteiro($("#m-q").value), motivo: $("#m-m").value }); fechar(); render(); toast(`${p.nome}: ${p.stock} un. em stock`); });
  const prev = () => {
    const p = produto($("#m-p").value), t = $("#m-t [aria-pressed=true]").dataset.v, q = inteiro($("#m-q").value) || 0;
    $("#m-ql").textContent = t === "ajuste" ? "Quantidade contada" : "Quantidade";
    const fica = t === "entrada" ? p.stock + q : t === "saida" ? p.stock - q : q;
    $("#m-prev").innerHTML = `Agora: <b>${p.stock}</b> un. → depois: <b>${fica}</b> un.`;
  };
  $("#m-t").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $("#m-t").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); prev(); });
  $("#m-p").onchange = prev; $("#m-q").oninput = prev; prev(); setTimeout(() => $("#m-q").focus(), 50);
}

/* ============================================================ clientes */
function vClientes() {
  const stats = {}; emitidas().forEach(f => { if (f.cliente_id) { const s = stats[f.cliente_id] ||= { n: 0, v: 0, ult: "" }; s.n++; s.v += f.total; if (f.data > s.ult) s.ult = f.data; } });
  $("#main").innerHTML = `
    <div class="toolbar"><label class="search">${icon("search")}<input id="cq" type="search" placeholder="Procurar cliente, NIF ou telefone" aria-label="Procurar clientes"></label><button class="btn pri" data-act="novo-cliente">${icon("plus")}Novo cliente</button></div>
    <div class="panel"><div class="panel-h"><h2>${E.clientes.length} clientes</h2><span class="sub">Documentos sem cliente ficam como “Consumidor final”.</span></div><div id="c-lista"></div></div>`;
  const upd = () => {
    const q = $("#cq").value.trim().toLowerCase();
    const l = E.clientes.filter(c => !q || (c.nome + c.nif + c.telefone).toLowerCase().includes(q));
    $("#c-lista").innerHTML = l.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Nome</th><th class="hide-m">NIF</th><th>Telefone</th><th class="r">Faturas</th><th class="r">Total comprado</th></tr></thead><tbody>
      ${l.map(c => { const s = stats[c.id] || { n: 0, v: 0 }; return `<tr class="click" data-act="editar-cliente" data-id="${c.id}"><td><span class="strong">${esc(c.nome)}</span> ${c.exemplo ? '<span class="chip ex">exemplo</span>' : ""}<div class="muted">${esc(c.endereco)}</div></td><td class="hide-m num">${esc(c.nif) || '<span class="muted">—</span>'}</td><td class="num">${esc(c.telefone)}</td><td class="r num">${s.n}</td><td class="r num strong">${kz(s.v)}</td></tr>`; }).join("")}
    </tbody></table></div>` : `<div class="empty">Ainda não há clientes registados. Toque em “Novo cliente” para registar o primeiro.</div>`;
  };
  $("#cq").oninput = upd; upd();
}
function formCliente(id, depois) {
  const c = id ? byId(E.clientes, id) : { nome: "", nif: "", endereco: "", telefone: "" };
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>${id ? "Editar cliente" : "Novo cliente"}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><label class="field"><span>Nome</span><input class="f" id="c-nome" value="${esc(c.nome)}" required></label>
      <div class="grid2"><label class="field"><span>NIF</span><input class="f" id="c-nif" value="${esc(c.nif)}"></label><label class="field"><span>Telefone</span><input class="f" id="c-tel" inputmode="tel" value="${esc(c.telefone)}"></label></div>
      <label class="field"><span>Endereço</span><input class="f" id="c-end" value="${esc(c.endereco)}"></label><div id="frm-err"></div></div>
    <div class="sheet-f">${id && pode("admin") ? `<button type="button" class="btn danger" data-act="remover-cliente" data-id="${id}">${icon("trash")}Remover</button>` : ""}<span class="sp"></span><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">Guardar</button></div></form>`,
    async () => { const r = await acao("guardarCliente", { nome: $("#c-nome").value, nif: $("#c-nif").value, telefone: $("#c-tel").value, endereco: $("#c-end").value }, id); fechar(); if (depois) depois(r); else render(); toast("Cliente guardado"); });
  setTimeout(() => $("#c-nome").focus(), 50);
}

function formContagem() {
  const ps = E.produtos.filter(x => x.tipo === "produto").sort((a, b) => a.codigo.localeCompare(b.codigo));
  abrir(`<form class="sheet wide" id="frm"><div class="sheet-h"><h2>Contagem geral de stock</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b"><p class="note" style="margin:0">Escreva quantas unidades tem de cada produto. Só os valores alterados ficam registados (como contagem).</p>
      <label class="field"><span>Motivo</span><input class="f" id="ct-motivo" value="Contagem de stock"></label>
      <div class="contagem">${ps.map(p => `<label class="ct-row"><span><b>${esc(p.nome)}</b><small class="cod">${p.codigo} · agora ${p.stock}</small></span><input class="f num" inputmode="numeric" data-pid="${p.id}" value="${p.stock}" aria-label="Quantidade de ${esc(p.nome)}"></label>`).join("")}</div>
      <div id="frm-err"></div></div>
    <div class="sheet-f"><span class="sp"></span><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">Guardar contagem</button></div></form>`,
    async () => {
      const itens = [...document.querySelectorAll(".contagem input")].map(i => ({ produto_id: Number(i.dataset.pid), qtd: inteiro(i.value) }))
        .filter(it => it.qtd !== produto(it.produto_id).stock);
      if (itens.some(it => Number.isNaN(it.qtd) || it.qtd < 0)) falha("Há quantidades inválidas.");
      if (!itens.length) { fechar(); return toast("Nada mudou"); }
      const n = await acao("contagemStock", itens, $("#ct-motivo").value);
      fechar(); render(); toast(`${n} produto${n === 1 ? "" : "s"} atualizado${n === 1 ? "" : "s"}`);
    });
}


/* ============================================================ relatórios (diário, semanal, mensal, trimestral, semestral, anual) */
const TIPOS_REL = [["diario", "Diário"], ["semanal", "Semanal"], ["mensal", "Mensal"], ["trimestral", "Trimestral"], ["semestral", "Semestral"], ["anual", "Anual"]];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const dISO = d => isoLocal(d).slice(0, 10);
const dDe = s => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const somaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const somaMeses = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const dm = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
function periodoRel(tipo, ref) {
  let ini, fim, titulo;
  if (tipo === "diario") { ini = ref; fim = somaDias(ref, 1); titulo = `${dm(ref)}/${ref.getFullYear()}`; }
  else if (tipo === "semanal") { ini = somaDias(ref, -((ref.getDay() + 6) % 7)); fim = somaDias(ini, 7); const u = somaDias(fim, -1); titulo = `${dm(ini)} a ${dm(u)}/${u.getFullYear()}`; }
  else if (tipo === "mensal") { ini = new Date(ref.getFullYear(), ref.getMonth(), 1); fim = somaMeses(ini, 1); titulo = `${MESES[ini.getMonth()][0].toUpperCase() + MESES[ini.getMonth()].slice(1)} de ${ini.getFullYear()}`; }
  else if (tipo === "trimestral") { const q = Math.floor(ref.getMonth() / 3); ini = new Date(ref.getFullYear(), 3 * q, 1); fim = somaMeses(ini, 3); titulo = `${q + 1}.º trimestre de ${ini.getFullYear()}`; }
  else if (tipo === "semestral") { const s = Math.floor(ref.getMonth() / 6); ini = new Date(ref.getFullYear(), 6 * s, 1); fim = somaMeses(ini, 6); titulo = `${s + 1}.º semestre de ${ini.getFullYear()}`; }
  else { ini = new Date(ref.getFullYear(), 0, 1); fim = new Date(ref.getFullYear() + 1, 0, 1); titulo = String(ref.getFullYear()); }
  return { ini, fim, titulo };
}
function baldesRel(tipo, ini, fim) {
  const out = [];
  if (tipo === "diario") { for (let h = 7; h < 22; h++) out.push([pad(h) + "h", `${dISO(ini)}T${pad(h)}`, `${dISO(ini)}T${pad(h + 1)}`]); return out; }
  if (tipo === "semanal" || tipo === "mensal") { for (let d = ini; d < fim; d = somaDias(d, 1)) out.push([dm(d), dISO(d), dISO(somaDias(d, 1))]); return out; }
  for (let d = ini; d < fim; d = somaMeses(d, 1)) out.push([MESES[d.getMonth()].slice(0, 3), dISO(d), dISO(somaMeses(d, 1))]);
  return out;
}
function calcularRelatorio(tipo, ref) {
  const { ini, fim, titulo } = periodoRel(tipo, ref), ant = periodoRel(tipo, somaDias(ini, -1));
  const si = dISO(ini), sf = dISO(fim);
  const prods = {}; [...(E._removidos || []), ...E.produtos].forEach(p => prods[p.id] = p);
  const dentro = (f, a, b) => f.data >= a && f.data < b;
  const base = docs().filter(f => f.tipo !== "PP");
  const todas = base.filter(f => dentro(f, si, sf)), emit = todas.filter(f => f.estado === "emitida"), anul = todas.filter(f => f.estado === "anulada");
  const proformas = docs().filter(f => f.tipo === "PP" && dentro(f, si, sf));
  const soma = (l, k = "total") => l.reduce((s, x) => s + x[k], 0);
  const anterior = soma(base.filter(f => f.estado === "emitida" && dentro(f, dISO(ant.ini), dISO(ant.fim))));
  const faturacao = soma(emit);
  const itens = {}, secs = {}, pags = {}, clis = {}, vends = {}, recs = {}; let vp = 0, vs = 0, qt = 0;
  emit.forEach(f => {
    const fp = f.pago ? f.forma_pagamento : "Por pagar";
    const pg = pags[fp] ||= { forma: fp, n: 0, valor: 0 }; pg.n++; pg.valor += f.total;
    const vd = vends[f.vendedor_nome || "—"] ||= { nome: f.vendedor_nome || "—", n: 0, valor: 0 }; vd.n++; vd.valor += f.total;
    const cl = clis[f.cliente_nome] ||= { nome: f.cliente_nome, n: 0, valor: 0 }; cl.n++; cl.valor += f.total;
    f.itens.forEach(it => {
      if (it.operador_id) {
        const o = operador(it.operador_id), nome = o ? o.nome : it.descricao.replace(/^Recarga /, "").split(" — ")[0];
        const rc = recs[nome] ||= { nome, n: 0, valor: 0, custo: 0 }; rc.n += it.qtd; rc.valor += it.total; rc.custo += it.custo || 0;
        const l = itens["REC-" + nome] ||= { codigo: "", descricao: "Recargas " + nome, tipo: "recarga", qtd: 0, valor: 0 }; l.qtd += it.qtd; l.valor += it.total;
        const s = secs["Recargas"] ||= { seccao: "Recargas", qtd: 0, valor: 0 }; s.qtd += it.qtd; s.valor += it.total;
        qt += it.qtd; vs += it.total; return;
      }
      const p = prods[it.produto_id], k = p ? p.codigo : it.descricao;
      const l = itens[k] ||= { codigo: p ? p.codigo : "", descricao: p ? p.nome : it.descricao, tipo: p ? p.tipo : "servico", qtd: 0, valor: 0 };
      l.qtd += it.qtd; l.valor += it.total;
      const sn = p ? p.seccao : "Outros", s = secs[sn] ||= { seccao: sn, qtd: 0, valor: 0 }; s.qtd += it.qtd; s.valor += it.total;
      qt += it.qtd; if (p && p.tipo === "produto") vp += it.total; else vs += it.total;
    });
  });
  const evolucao = baldesRel(tipo, ini, fim).map(([rotulo, a, b]) => { const fs = emit.filter(f => f.data >= a && f.data < b); return { rotulo, valor: soma(fs), n: fs.length }; });
  const movs = [...E.movimentos].sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
  const stock = [];
  E.produtos.filter(p => p.tipo === "produto").forEach(p => {
    let inicial = 0, final = 0, entradas = 0, saidas = 0, teve = false;
    movs.forEach(m => {
      if (m.produto_id !== p.id) return;
      if (m.data < si) { inicial = final = m.stock_final; }
      else if (m.data < sf) { teve = true; final = m.stock_final; if (m.tipo === "entrada") entradas += m.qtd; else if (m.tipo === "saida") saidas += m.qtd; }
    });
    if (!teve && inicial === 0) return;
    stock.push({ codigo: p.codigo, nome: p.nome, inicial, entradas, saidas, ajustes: final - inicial - entradas + saidas, final, stock_min: p.stock_min, preco: p.preco, valor_final: final * p.preco });
  });
  stock.sort((a, b) => b.saidas - a.saidas || a.codigo.localeCompare(b.codigo));
  const ord = o => Object.values(o).sort((a, b) => b.valor - a.valor);
  return {
    tipo, nome: TIPOS_REL.find(t => t[0] === tipo)[1], titulo, inicio: si, fim: dISO(somaDias(fim, -1)), anterior_titulo: ant.titulo,
    resumo: { faturacao, n_faturas: emit.length, media: emit.length ? Math.round(faturacao / emit.length) : 0, subtotal: soma(emit, "subtotal"), descontos: soma(emit, "desconto"),
      anuladas_n: anul.length, anuladas_valor: soma(anul), itens_qtd: qt, produtos_valor: vp, servicos_valor: vs, anterior,
      por_receber: soma(emit.filter(f => f.tipo === "FT" && !f.pago)), recebido: soma(emit.filter(f => f.pago)),
      proformas_n: proformas.length, proformas_valor: soma(proformas.filter(f => f.estado !== "anulada")),
      variacao: anterior ? Math.round((faturacao - anterior) / anterior * 1000) / 10 : null },
    evolucao, pagamentos: ord(pags), seccoes: ord(secs), itens: Object.values(itens).sort((a, b) => b.valor - a.valor || a.descricao.localeCompare(b.descricao)),
    clientes: ord(clis).slice(0, 10), vendedores: ord(vends), stock,
    recargas: ord(recs).map(x => ({ ...x, lucro: x.valor - x.custo })),
    stock_resumo: { valor: soma(stock, "valor_final"), unidades: soma(stock, "final"), entradas: soma(stock, "entradas"), saidas: soma(stock, "saidas"), alertas: stock.filter(s => s.final <= s.stock_min).length },
    faturas: [...todas].sort((a, b) => a.numero - b.numero),
  };
}
function barras(rotulos, valores, aria) {
  const W = larguraGrafico(680), H = 230, L = 46, B = 26, T = 18, R = 8, n = rotulos.length;
  const max = Math.max(...valores, 1);
  const passo = [1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000, 2000000, 2500000, 5000000, 10000000].find(s => s * 4 >= max) || Math.ceil(max / 4);
  const topo = passo * 4, bw = (W - L - R) / n, y = v => T + (H - T - B) * (1 - v / topo);
  const k = v => v >= 1000000 ? fmt(v / 100000) / 10 + "M" : v >= 1000 ? fmt(v / 1000) + "k" : fmt(v);
  const cada = n > 16 ? Math.ceil(n / 10) : 1, maxI = valores.indexOf(Math.max(...valores));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">`;
  for (let i = 0; i <= 4; i++) { const v = passo * i; s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${k(v)}</text>`; }
  rotulos.forEach((r, i) => {
    const v = valores[i], x = L + i * bw + bw * .16, w = bw * .68;
    if (v > 0) s += `<rect class="bar ${i === maxI ? "today" : ""}" x="${x}" y="${y(v)}" width="${w}" height="${y(0) - y(v)}" rx="${Math.min(3, w / 3)}"><title>${esc(r)}: ${kz(v)}</title></rect>`;
    if (i === maxI && v > 0) s += `<text class="vlab" x="${x + w / 2}" y="${y(v) - 6}" text-anchor="middle">${k(v)}</text>`;
    if (i % cada === 0) s += `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${esc(r)}</text>`;
  });
  return s + "</svg>";
}
const rel = { tipo: "mensal", ref: null, aba: "faturacao" };
function vRelatorios() {
  if (!rel.ref) rel.ref = hoje();
  const R = calcularRelatorio(rel.tipo, dDe(rel.ref)), r = R.resumo;
  const tot = r.produtos_valor + r.servicos_valor || 1, sub = r.subtotal || 1;
  const varTxt = r.variacao === null ? `sem vendas em ${esc(R.anterior_titulo)}` : `<b style="color:${r.variacao >= 0 ? "#9FF0C8" : "#FFB4AA"}">${r.variacao >= 0 ? "▲ +" : "▼ −"}${String(Math.abs(r.variacao)).replace(".", ",")}%</b> face a ${esc(R.anterior_titulo)}`;
  const ehAtual = calcularPeriodoContem(R);
  const sr = R.stock_resumo;
  const abas = [["faturacao", "Faturação"], ["vendas", "Produtos vendidos"], ["stock", "Stock"], ["faturas", "Faturas"]];
  $("#main").innerHTML = `
    <div class="chips" id="rtipo">${TIPOS_REL.map(([v, t]) => `<button data-act="rel-tipo" data-v="${v}" aria-pressed="${rel.tipo === v}">${t}</button>`).join("")}</div>
    <div class="relnav">
      <button class="icon-btn" data-act="rel-mover" data-d="-1" aria-label="Período anterior"><svg class="i"><use href="#i-left"/></svg></button>
      <div class="relt"><span class="eyebrow">Relatório ${esc(R.nome.toLowerCase())}</span><h2>${esc(R.titulo)}</h2><span class="sub">${dataPt(R.inicio)} a ${dataPt(R.fim)}</span></div>
      <button class="icon-btn" data-act="rel-mover" data-d="1" aria-label="Período seguinte"><svg class="i"><use href="#i-right"/></svg></button>
      <div class="sp"></div>
      <input type="date" class="f" id="rdata" value="${rel.ref}" aria-label="Escolher data" style="width:auto">
      ${ehAtual ? "" : `<button class="btn sm" data-act="rel-hoje">Atual</button>`}
      <button class="btn pri" data-act="pdf-relatorio" data-espera="A gerar PDF…">${icon("down")}Guardar PDF</button>
    </div>
    <section class="kpis">
      <div class="kpi hero"><span class="lab">Faturação</span><span class="val num">${fmt(r.faturacao)} <small>Kz</small></span><span class="ft">${varTxt}</span></div>
      <div class="kpi"><span class="lab">Faturas emitidas</span><span class="val num">${r.n_faturas}</span><span class="ft">recebido ${kz(r.recebido)} · por receber ${kz(r.por_receber)}</span></div>
      <div class="kpi"><span class="lab">Itens vendidos</span><span class="val num">${fmt(r.itens_qtd)}</span><span class="ft">descontos ${kz(r.descontos)}</span></div>
      <div class="kpi"><span class="lab">Anuladas / pró-formas</span><span class="val num"><span style="color:${r.anuladas_n ? "var(--bad)" : "inherit"}">${r.anuladas_n}</span> <small>/</small> ${r.proformas_n}</span><span class="ft">anulado ${kz(r.anuladas_valor)} · orçado ${kz(r.proformas_valor)}</span></div>
    </section>
    <div class="seg" id="raba" style="align-self:flex-start">${abas.map(([v, t]) => `<button data-act="rel-aba" data-v="${v}" aria-pressed="${rel.aba === v}">${t}</button>`).join("")}</div>
    <div id="rcorpo"></div>`;
  const corpo = {
    faturacao: () => `
      <div class="panel chart"><div class="panel-h"><h2>Evolução da faturação</h2><span class="sub">${{ diario: "por hora", semanal: "por dia", mensal: "por dia" }[R.tipo] || "por mês"}, em Kz</span></div>${barras(R.evolucao.map(e => e.rotulo), R.evolucao.map(e => e.valor), "Faturação por " + (R.tipo === "diario" ? "hora" : ["semanal", "mensal"].includes(R.tipo) ? "dia" : "mês"))}</div>
      <section class="dash">
        <div class="panel"><div class="panel-h"><h2>Por forma de pagamento</h2></div>${R.pagamentos.length ? `<div class="hbars">${R.pagamentos.map(p => `<div class="hbar"><span class="n">${esc(p.forma)} <span class="muted" style="color:var(--ink-3)">· ${p.n}</span></span><span class="num strong">${kz(p.valor)}</span><div class="track"><div class="fill" style="width:${(p.valor / (r.faturacao || 1) * 100).toFixed(1)}%"></div></div></div>`).join("")}</div>` : `<div class="empty">Sem vendas neste período.</div>`}
          <div class="panel-h" style="margin:20px 0 6px"><h2>Produtos e serviços</h2></div>
          <div class="split"><div style="width:${(r.produtos_valor / tot * 100).toFixed(1)}%"></div><div style="flex:1"></div></div>
          <div class="legend"><span><i style="background:var(--brand-deep)"></i>Produtos ${kz(r.produtos_valor)}</span><span><i style="background:var(--brand);opacity:.45"></i>Serviços ${kz(r.servicos_valor)}</span></div></div>
        <div class="panel"><div class="panel-h"><h2>Por secção do catálogo</h2></div>${R.seccoes.length ? `<div class="hbars">${R.seccoes.map(s => `<div class="hbar"><span class="n">${esc(s.seccao)}</span><span class="num strong">${kz(s.valor)}</span><div class="track"><div class="fill" style="width:${(s.valor / R.seccoes[0].valor * 100).toFixed(1)}%"></div></div></div>`).join("")}</div>` : `<div class="empty">Sem vendas neste período.</div>`}</div>
      </section>
      ${R.recargas.length ? `<div class="panel"><div class="panel-h"><h2>Recargas</h2><span class="sub">lucro = valor vendido − custo do saldo</span></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Operador</th><th class="r">Recargas</th><th class="r">Vendido</th><th class="r">Lucro</th></tr></thead><tbody>${R.recargas.map(x => `<tr><td>${esc(x.nome)}</td><td class="r num">${x.n}</td><td class="r num">${kz(x.valor)}</td><td class="r num strong" style="color:var(--ok)">${kz(x.lucro)}</td></tr>`).join("")}</tbody><tfoot><tr><td class="strong">Total</td><td class="r num">${R.recargas.reduce((s, x) => s + x.n, 0)}</td><td class="r num strong">${kz(R.recargas.reduce((s, x) => s + x.valor, 0))}</td><td class="r num strong" style="color:var(--ok)">${kz(R.recargas.reduce((s, x) => s + x.lucro, 0))}</td></tr></tfoot></table></div></div>` : ""}
      ${R.vendedores.length > 1 || pode("ver_todas") ? `<div class="panel"><div class="panel-h"><h2>Por vendedor</h2></div>${R.vendedores.length ? `<div class="hbars">${R.vendedores.map(v => `<div class="hbar"><span class="n">${esc(v.nome)} <span style="color:var(--ink-3)">· ${v.n}</span></span><span class="num strong">${kz(v.valor)}</span><div class="track"><div class="fill" style="width:${(v.valor / (R.vendedores[0].valor || 1) * 100).toFixed(1)}%"></div></div></div>`).join("")}</div>` : `<div class="empty">Sem vendas neste período.</div>`}</div>` : ""}
      <div class="panel"><div class="panel-h"><h2>Principais clientes</h2></div>${R.clientes.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Cliente</th><th class="r">Faturas</th><th class="r">Valor</th></tr></thead><tbody>${R.clientes.map(c => `<tr><td>${esc(c.nome)}</td><td class="r num">${c.n}</td><td class="r num strong">${kz(c.valor)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Sem vendas neste período.</div>`}</div>`,
    vendas: () => `<div class="panel"><div class="panel-h"><h2>${R.itens.length} produtos e serviços vendidos</h2><span class="sub">valores antes de descontos</span></div>
      ${R.itens.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th class="hide-m">Código</th><th>Descrição</th><th class="hide-m">Tipo</th><th class="r">Qtd.</th><th class="r">Valor</th><th class="r hide-m">%</th></tr></thead><tbody>
        ${R.itens.map(it => `<tr><td class="cod hide-m">${esc(it.codigo)}</td><td><span class="strong">${esc(it.descricao)}</span><div class="cod">${it.codigo ? esc(it.codigo) + " · " : ""}${it.tipo === "produto" ? "Produto" : it.tipo === "recarga" ? "Recarga" : "Serviço"}</div></td><td class="hide-m">${it.tipo === "produto" ? '<span class="chip brand">Produto</span>' : it.tipo === "recarga" ? '<span class="chip ok">Recarga</span>' : '<span class="chip">Serviço</span>'}</td><td class="r num">${fmt(it.qtd)}</td><td class="r num strong">${kz(it.valor)}</td><td class="r num hide-m muted">${(it.valor / sub * 100).toFixed(1).replace(".", ",")}%</td></tr>`).join("")}
        <tr class="tot"><td class="hide-m"></td><td class="strong">Total</td><td class="hide-m"></td><td class="r num strong">${fmt(r.itens_qtd)}</td><td class="r num strong">${kz(r.subtotal)}</td><td class="r hide-m strong">100%</td></tr>
      </tbody></table></div>` : `<div class="empty">Sem vendas neste período.</div>`}</div>`,
    stock: () => `<section class="kpis">
        <div class="kpi"><span class="lab">Valor no fim</span><span class="val num">${fmt(sr.valor)} <small>Kz</small></span><span class="ft">a preço de venda</span></div>
        <div class="kpi"><span class="lab">Unidades no fim</span><span class="val num">${fmt(sr.unidades)}</span><span class="ft">${R.stock.length} produtos</span></div>
        <div class="kpi"><span class="lab">Entradas / saídas</span><span class="val num"><span style="color:var(--ok)">+${fmt(sr.entradas)}</span> <small>/</small> <span style="color:var(--warn)">−${fmt(sr.saidas)}</span></span><span class="ft">unidades no período</span></div>
        <div class="kpi"><span class="lab">No mínimo ou abaixo</span><span class="val num" style="color:var(--warn)">${sr.alertas}</span><span class="ft">no fim do período</span></div></section>
      <div class="panel"><div class="panel-h"><h2>Movimento do stock por produto</h2><span class="sub">do início ao fim do período</span></div>
      ${R.stock.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Produto</th><th class="r hide-m">Início</th><th class="r">Entradas</th><th class="r">Saídas</th><th class="r hide-m">Ajuste</th><th class="r">Fim</th><th class="r hide-m">Valor</th></tr></thead><tbody>
        ${R.stock.map(s => { const c = s.final <= 0 ? "bad" : s.final <= s.stock_min ? "warn" : "ok"; return `<tr><td><span class="strong">${esc(s.nome)}</span><div class="cod">${s.codigo} · mín. ${s.stock_min}</div></td><td class="r num hide-m">${s.inicial}</td><td class="r num" style="color:${s.entradas ? "var(--ok)" : "var(--ink-3)"}">${s.entradas ? "+" + s.entradas : 0}</td><td class="r num" style="color:${s.saidas ? "var(--warn)" : "var(--ink-3)"}">${s.saidas ? "−" + s.saidas : 0}</td><td class="r num hide-m muted">${s.ajustes > 0 ? "+" : ""}${s.ajustes}</td><td class="r num"><span class="chip ${c}">${s.final}</span></td><td class="r num hide-m">${kz(s.valor_final)}</td></tr>`; }).join("")}
      </tbody></table></div>` : `<div class="empty">Sem produtos em stock neste período.</div>`}</div>`,
    faturas: () => `<div class="panel"><div class="panel-h"><h2>${R.faturas.length} faturas · ${kz(r.faturacao)}</h2><span class="sub">anuladas e pró-formas não contam para a faturação</span></div>${tabelaFaturas([...R.faturas].reverse())}</div>`,
  };
  $("#rcorpo").innerHTML = corpo[rel.aba]();
  vRelatorios.atual = R;
  $("#rdata").onchange = e => { if (e.target.value) { rel.ref = e.target.value; vRelatorios(); } };
}
function calcularPeriodoContem(R) { const h = hoje(); return h >= R.inicio && h <= R.fim; }
function moverRel(d) {
  const { ini } = periodoRel(rel.tipo, dDe(rel.ref));
  const passos = { diario: () => somaDias(ini, d), semanal: () => somaDias(ini, 7 * d), mensal: () => somaMeses(ini, d), trimestral: () => somaMeses(ini, 3 * d), semestral: () => somaMeses(ini, 6 * d), anual: () => new Date(ini.getFullYear() + d, 0, 1) };
  rel.ref = dISO(passos[rel.tipo]()); vRelatorios();
}


/* ============================================================ utilizadores (só administrador) */
function vUtilizadores() {
  const us = [...E.utilizadores].sort((a, b) => (b.ativo - a.ativo) || a.nome.localeCompare(b.nome));
  $("#main").innerHTML = `
    <div class="toolbar"><div class="sp" style="flex:1"></div><button class="btn pri" data-act="novo-utilizador">${icon("plus")}Novo utilizador</button></div>
    <div class="panel"><div class="panel-h"><h2>${us.length} utilizador${us.length === 1 ? "" : "es"}</h2><span class="sub">O nome de cada utilizador aparece como vendedor nas faturas que emite.</span></div>
    <div class="tbl-wrap"><table class="t"><thead><tr><th>Nome</th><th>Papel</th><th class="hide-m">Pode também</th><th>Estado</th></tr></thead><tbody>
      ${us.map(u => `<tr class="click" data-act="editar-utilizador" data-id="${esc(u.id)}"><td><span class="strong">${esc(u.nome)}</span>${u.id === E.eu.id ? ' <span class="chip">você</span>' : ""}<div class="cod">entra como: ${esc(u.utilizador)}</div></td>
        <td>${u.papel === "admin" ? '<span class="chip brand">Administrador</span>' : '<span class="chip">Vendedor</span>'}</td>
        <td class="hide-m muted">${u.papel === "admin" ? "Acesso total" : PERMISSOES.filter(([k]) => (u.permissoes || {})[k]).map(([, t]) => t).join(" · ") || "Só vender"}</td>
        <td>${u.ativo ? '<span class="chip ok">Ativo</span>' : '<span class="chip bad">Desativado</span>'}</td></tr>`).join("")}
    </tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h2>Papéis</h2></div>
      <div class="papeis"><div><b>Vendedor</b><p>Vende: emite faturas-recibo, faturas e pró-formas, regista clientes e vê os seus próprios documentos. Não mexe em stock, preços, relatórios nem definições, a menos que lhe dê permissões extra.</p></div>
      <div><b>Administrador</b><p>Acesso total: tudo o que o vendedor faz, mais stock, produtos e preços, anulações, relatórios, utilizadores e definições.</p></div></div></div>`;
}
function formUtilizador(id) {
  const u = id ? utilizador(id) : { nome: "", utilizador: "", papel: "vendedor", permissoes: {}, ativo: true };
  abrir(`<form class="sheet" id="frm" autocomplete="off"><div class="sheet-h"><h2>${id ? "Editar utilizador" : "Novo utilizador"}</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b">
      <label class="field"><span>Nome (aparece nas faturas)</span><input class="f" id="u-nome" value="${esc(u.nome)}" placeholder="Ex.: Maria Domingos" required></label>
      <div class="grid2">
        <label class="field"><span>Utilizador (para entrar)</span><input class="f" id="u-user" value="${esc(u.utilizador)}" ${id ? "disabled" : ""} placeholder="Ex.: maria" autocapitalize="none" spellcheck="false"><small>Letras minúsculas e números, sem espaços.</small></label>
        ${campoSenha("u-senha", id ? "Nova senha (opcional)" : "Senha", "new-password", `placeholder="Mínimo 6 caracteres" ${id ? "" : "required"}`)}
      </div>
      <div class="field"><span>Papel</span><div class="seg" id="u-papel"><button type="button" data-v="vendedor" aria-pressed="${u.papel !== "admin"}">Vendedor</button><button type="button" data-v="admin" aria-pressed="${u.papel === "admin"}">Administrador (acesso total)</button></div></div>
      <div class="field" id="u-perm-f"><span>Permissões extra do vendedor</span>
        <div class="perms">${PERMISSOES.map(([k, t]) => `<label class="perm"><input type="checkbox" data-k="${k}" ${(u.permissoes || {})[k] ? "checked" : ""}><span>${t}</span></label>`).join("")}</div>
        <small>Sem nenhuma marcada, a pessoa só vende e vê as suas vendas.</small></div>
      ${id ? `<label class="perm"><input type="checkbox" id="u-ativo" ${u.ativo ? "checked" : ""}><span><b>Conta ativa</b> (desmarque para bloquear a entrada)</span></label>` : ""}
      <div id="frm-err"></div>
    </div>
    <div class="sheet-f"><span class="sp"></span><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">${id ? "Guardar" : "Criar utilizador"}</button></div></form>`,
    async () => {
      const papel = papelSel(), permissoes = {};
      document.querySelectorAll(".perms input").forEach(c => permissoes[c.dataset.k] = c.checked);
      const d = { nome: $("#u-nome").value, papel, permissoes, senha: $("#u-senha").value || undefined };
      const login = ($("#u-user").value || "").trim().toLowerCase();
      if (id) await acao("atualizarUtilizador", { ...d, id, ativo: $("#u-ativo").checked });
      else await acao("criarUtilizador", { ...d, utilizador: login });
      fechar(); if (DEMO && id === E.eu.id) navegar(); else render();
      toast(id ? "Utilizador atualizado" : `Utilizador criado. Entra com “${login}” e a senha que definiu.`);
    });
  const papelSel = ligarEscolha("#u-papel");
  const sync = () => $("#u-perm-f").hidden = papelSel() === "admin";
  $("#u-papel").addEventListener("change", sync); sync();
  setTimeout(() => $("#u-nome").focus(), 50);
}

/* ============================================================ definições (só administrador) */
function vDefinicoes() {
  const emp = E.config.empresa, n = E.config.numeracao;
  $("#main").innerHTML = `
    <div class="dash">
      <form class="panel" id="frm-emp" style="display:flex;flex-direction:column;gap:14px"><div class="panel-h" style="margin:0"><h2>Dados da empresa nos documentos</h2></div>
        <div class="grid2"><label class="field"><span>Nome</span><input class="f" id="e-nome" value="${esc(emp.nome)}"></label><label class="field"><span>NIF da empresa</span><input class="f" id="e-nif" value="${esc(emp.nif)}" placeholder="Por preencher"></label></div>
        <label class="field"><span>Actividade</span><input class="f" id="e-act" value="${esc(emp.actividade)}"></label>
        <label class="field"><span>Endereço</span><input class="f" id="e-end" value="${esc(emp.endereco || "")}" placeholder="Ex.: Luanda, Viana"></label>
        <div class="grid2"><label class="field"><span>Telefones</span><input class="f" id="e-tel" value="${esc(emp.telefones)}"></label><label class="field"><span>E-mail</span><input class="f" id="e-mail" value="${esc(emp.email)}"></label></div>
        <label class="field"><span>Slogan (rodapé)</span><input class="f" id="e-slo" value="${esc(emp.slogan)}"></label>
        <div id="emp-err"></div><div><button class="btn pri">Guardar dados</button></div></form>
      <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
        <form class="panel" id="frm-num" style="display:flex;flex-direction:column;gap:12px"><div class="panel-h" style="margin:0"><h2>Numeração dos documentos</h2></div>
          <div class="grid3"><label class="field"><span>Próxima FR</span><input class="f num" id="n-FR" inputmode="numeric" value="${n.FR}"></label>
            <label class="field"><span>Próxima FT</span><input class="f num" id="n-FT" inputmode="numeric" value="${n.FT}"></label>
            <label class="field"><span>Próxima PP</span><input class="f num" id="n-PP" inputmode="numeric" value="${n.PP}"></label></div>
          <small style="color:var(--ink-3)">Use para continuar a sequência do bloco em papel (ex.: se o bloco vai na 0057, ponha 58).</small>
          <label class="field"><span>Validade das pró-formas (dias)</span><input class="f num" id="n-val" inputmode="numeric" value="${E.config.validade_proforma || 15}"></label>
          <div id="num-err"></div><div><button class="btn pri">Guardar</button></div></form>
        <div class="panel"><div class="panel-h"><h2>Contas para pagamento</h2></div>
          <div class="alert-list">${emp.contas.map(c => `<div class="row"><span>${esc(c.banco)}</span><span class="num cod" style="font-size:13px">${esc(c.iban)}</span></div>`).join("")}</div>
          <p class="note" style="margin:12px 0 0">Titular: ${esc(emp.titular)}</p></div>
        <div class="panel"><div class="panel-h"><h2>Dados e sincronização</h2></div>
          <p style="margin:0 0 12px;color:var(--ink-2)">${DEMO ? "Modo de demonstração: os dados ficam só neste navegador." : "Os dados ficam no servidor e aparecem em todos os dispositivos (telemóveis, computadores e APK) logo que mudam."}</p>
          ${DEMO ? `<button class="btn danger" data-act="repor">Recomeçar a demonstração</button>` : ""}</div>
      </div>
    </div>`;
  $("#frm-emp").onsubmit = async e => { e.preventDefault(); try { await acao("guardarConfig", { empresa: { nome: $("#e-nome").value, nif: $("#e-nif").value, actividade: $("#e-act").value, endereco: $("#e-end").value, telefones: $("#e-tel").value, email: $("#e-mail").value, slogan: $("#e-slo").value } }); toast("Dados da empresa guardados"); } catch (er) { $("#emp-err").innerHTML = `<div class="err">${esc(er.message)}</div>`; } };
  $("#frm-num").onsubmit = async e => {
    e.preventDefault();
    try {
      const numeracao = {}; ["FR", "FT", "PP"].forEach(k => { const v = inteiro($("#n-" + k).value); if (v !== E.config.numeracao[k]) numeracao[k] = v; });
      await acao("guardarConfig", { numeracao, validade_proforma: inteiro($("#n-val").value) });
      toast("Numeração guardada"); render();
    } catch (er) { $("#num-err").innerHTML = `<div class="err">${esc(er.message)}</div>`; }
  };
}

/* ============================================================ a minha conta */
function conta() {
  const u = E.eu;
  const extras = u.papel === "admin" ? "Acesso total" : PERMISSOES.filter(([k]) => u.perm[k]).map(([, t]) => t).join(" · ") || "Só vender";
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>A minha conta</h2><button type="button" class="icon-btn" data-act="fechar" aria-label="Fechar">${icon("x")}</button></div>
    <div class="sheet-b">
      <div class="cli-card"><div><div class="strong">${esc(u.nome)}</div><div class="cod">${u.papel === "admin" ? "Administrador" : "Vendedor"} · entra como ${esc(u.utilizador)}</div><div class="cod">${esc(extras)}</div></div></div>
      ${pode("admin") ? `<div class="toolbar"><a class="btn" href="#utilizadores">${icon("user")}Utilizadores</a><a class="btn" href="#definicoes">${icon("cog")}Definições</a></div>` : ""}
      ${DEMO || eNativo() || navigator.userAgent.includes("Electron") ? "" : `<a class="btn" href="instalar.html" target="_blank" rel="noopener">${icon("down")}Instalar no Android, iPhone ou Windows</a>`}
      ${DEMO ? `<div class="field"><span>Ver a demonstração como</span><div class="seg" id="demo-u">${E.utilizadores.filter(x => x.ativo).map(x => `<button type="button" data-act="demo-ver" data-id="${esc(x.id)}" aria-pressed="${x.id === u.id}">${esc(x.nome)}</button>`).join("")}</div>
          <small style="color:var(--ink-3)">Mude para a vendedora para ver o sistema com permissões limitadas.</small></div>`
      : `<input type="text" name="username" autocomplete="username" value="${esc(u.utilizador)}" hidden>
        <div class="grid2">${campoSenha("s-nova", "Nova senha", "new-password", `placeholder="Mínimo 6 caracteres"`, "new-password")}${campoSenha("s-conf", "Repetir a nova senha", "new-password")}</div>`}
      <div id="frm-err"></div>
    </div>
    <div class="sheet-f"><button type="button" class="btn danger" data-act="sair">${icon("logout")}Terminar sessão</button><span class="sp"></span><button type="button" class="btn" data-act="fechar">Fechar</button>${DEMO ? "" : `<button class="btn pri">Guardar senha</button>`}</div></form>`,
    DEMO ? null : async () => {
      const a = $("#s-nova").value, b = $("#s-conf").value;
      if (a.length < 6) falha("A senha precisa de pelo menos 6 caracteres.");
      if (a !== b) falha("As duas senhas não são iguais.");
      const { error } = await sb.auth.updateUser({ password: a });
      if (error) falha(mensagemErro(error));
      await guardarCredencial(u.utilizador, a);
      fechar(); toast("Senha alterada");
    });
}

/* ============================================================ PDF (página web e APK) */
function eNativo() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
function carregarScript(src) { return new Promise((ok, erro) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => erro(new Error("Não foi possível carregar " + src)); document.head.appendChild(s); }); }
async function jsPDFPronto() {
  if (!(window.jspdf && window.jspdf.jsPDF)) await carregarScript("vendor/jspdf.umd.min.js");
  if (!window.jspdf.jsPDF.API.autoTable) await carregarScript("vendor/jspdf.plugin.autotable.min.js");
  return window.jspdf.jsPDF;
}
async function guardarPdf(doc, nome, imprimir = false) {
  if (eNativo()) {
    const { Filesystem, Share } = window.Capacitor.Plugins;
    const dados = doc.output("datauristring").split(",")[1];
    if (!imprimir) {
      // guarda uma cópia em Documentos/Grupo Kambas no telemóvel
      try {
        await Filesystem.writeFile({ path: "Grupo Kambas/" + nome, data: dados, directory: "DOCUMENTS", recursive: true });
        toast("PDF guardado", "ok", "Documentos › Grupo Kambas › " + nome);
      } catch (e) { /* sem acesso à pasta: fica só a partilha */ }
    }
    const r = await Filesystem.writeFile({ path: nome, data: dados, directory: "CACHE" });
    if (imprimir) fecharToast();
    await Share.share({ title: nome, files: [r.uri], dialogTitle: imprimir ? "Escolha a impressora ou a app de impressão" : "Enviar ou abrir o PDF" });
  } else if (window.claude && window.claude.use) {
    // demonstração dentro do Claude: o ficheiro passa pela permissão de descarregar da página
    const dl = await window.claude.use("downloads");
    if (!dl) { toast("Descarregar não está disponível aqui", "erro"); return; }
    try { await dl.save({ filename: nome, data: doc.output("blob") }); toast("PDF guardado", "ok", nome); }
    catch (e) { if (e && e.code !== "declined") toast("Não foi possível guardar o PDF", "erro"); else fecharToast(); }
  } else { doc.save(nome); toast("PDF descarregado", "ok", nome); }
}
/* Imprimir: no navegador e no Windows abre a janela de impressão só com o documento;
   na APK (o Android não imprime páginas), gera o PDF e abre a escolha de impressora/app. */
async function imprimirDoc(f) {
  if (eNativo() || (window.claude && window.claude.use)) { toast("A preparar para imprimir…", "prog"); return pdfFatura(f, true); }
  document.body.classList.add("a-imprimir");
  setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove("a-imprimir"), 500); }, 50);
}
const COR = { azul: [1, 146, 184], pet: [11, 106, 128], nev: [234, 245, 248], lin: [191, 214, 222], tin: [15, 46, 58], cin: [107, 135, 146], ver: [180, 35, 24], branco: [255, 255, 255] };
const kzPdf = n => fmt(n) + " Kz";
async function pdfFatura(f, imprimir = false) {
  const jsPDF = await jsPDFPronto();
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = 148, m = 12, dir = W - m, emp = E.config.empresa;
  const tc = c => doc.setTextColor(...c), fc = c => doc.setFillColor(...c), dc = c => doc.setDrawColor(...c);
  const rot = (x, y, t, c = COR.azul, s = 6.2, al = "left") => { doc.setFont("helvetica", "bold"); doc.setFontSize(s); doc.setCharSpace(0.3); tc(c); doc.text(String(t).toUpperCase(), x, y, { align: al }); doc.setCharSpace(0); };
  const txt = (x, y, t, s = 8, b = false, c = COR.tin, al = "left") => { doc.setFont("helvetica", b ? "bold" : "normal"); doc.setFontSize(s); tc(c); doc.text(String(t ?? ""), x, y, { align: al }); };
  const corta = (t, s, larg, b = false) => { t = String(t ?? ""); doc.setFont("helvetica", b ? "bold" : "normal"); doc.setFontSize(s); if (doc.getTextWidth(t) <= larg) return t; while (t && doc.getTextWidth(t + "...") > larg) t = t.slice(0, -1); return t + "..."; };
  doc.setProperties({ title: `${TIPOS_DOC[f.tipo]} ${docNum(f)} — ${emp.nome}` });
  doc.addImage(LOGO_AZUL, "PNG", m, 12, 27, 21);
  rot(m, 37.5, emp.actividade, COR.cin, 5.2);
  txt(m, 41.5, emp.telefones, 6.6); txt(m, 44.8, emp.email, 6.6);
  let ye = 48.1; if (emp.nif) { txt(m, ye, "NIF " + emp.nif, 6.6); ye += 3.3; } if (emp.endereco) txt(m, ye, emp.endereco, 6.6);
  const titulo = TITULO_DOC[f.tipo];
  const anulado = f.estado !== "emitida";
  fc(anulado ? COR.ver : COR_DOC[f.tipo]); doc.rect(0, 0, W, 8.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setCharSpace(0.6); tc(COR.branco);
  doc.text(titulo + (anulado ? (f.estado === "anulada" ? " · ANULADA" : " · CONVERTIDA") : ""), m, 5.6); doc.setCharSpace(0);
  txt(W - m, 5.6, significadoDoc(f), 6.6, false, COR.branco, "right");
  doc.setFont("helvetica", "bold"); doc.setFontSize(f.tipo === "FT" ? 17 : f.tipo === "PP" ? 12 : 13.5); const esp = f.tipo === "PP" ? 0.5 : 1;
  // o jsPDF não conta o espaçamento entre letras ao alinhar à direita: calcula-se à mão
  const larg = doc.getTextWidth(titulo) + esp * (titulo.length - 1);
  doc.setCharSpace(esp); tc(COR.pet); doc.text(titulo, dir - larg, 20); doc.setCharSpace(0);
  dc(COR.azul); doc.setLineWidth(0.5); doc.line(dir - Math.max(larg, 36), 22.5, dir, 22.5);
  txt(dir, 29, "Nº " + docNum(f), 10, true, COR.tin, "right");
  if (f.estado !== "emitida") txt(dir, 33.5, f.estado === "anulada" ? "ANULADA" : "CONVERTIDA", 8, true, COR.ver, "right");
  rot(dir - 52, 37.5, "Data"); txt(dir - 52, 42, `${dataPt(f.data)}  ${horaPt(f.data)}`, 8);
  dc(COR.lin); doc.setLineWidth(0.2); doc.line(dir - 52, 43.5, dir, 43.5);
  // cliente
  const y0 = 52; fc(COR.nev); doc.roundedRect(m, y0, W - 2 * m, 21, 2.5, 2.5, "F"); fc(COR.azul); doc.rect(m, y0, 1.3, 21, "F");
  const cx = m + 5, c2 = dir - 36;
  [[cx, y0 + 4.5, "Cliente", f.cliente_nome, c2 - cx - 5], [c2, y0 + 4.5, "NIF", f.cliente_nif, 32], [cx, y0 + 14.5, "Endereço", f.cliente_endereco, c2 - cx - 5], [c2, y0 + 14.5, "Telefone", f.cliente_telefone, 32]]
    .forEach(([x, y, r, v, l]) => { rot(x, y, r); txt(x, y + 4.3, corta(v, 8, l), 8); dc(COR.lin); doc.line(x, y + 5.5, x + l, y + 5.5); });
  // itens
  const col = [m, m + 13, dir - 50, dir - 24, dir], ty = y0 + 25;
  fc(COR.pet); doc.roundedRect(m, ty, W - 2 * m, 7, 1.5, 1.5, "F");
  rot(col[0] + 3, ty + 4.6, "Qtd.", COR.branco, 6); rot(col[1] + 2.5, ty + 4.6, "Descrição", COR.branco, 6);
  rot(col[3] - 2.5, ty + 4.6, "Preço unit.", COR.branco, 6, "right"); rot(col[4] - 2.5, ty + 4.6, "Total", COR.branco, 6, "right");
  const n = Math.max(8, f.itens.length), alt = n <= 10 ? 6.6 : Math.max(3.9, 66 / n), topo = ty + 7, fundo = topo + n * alt, ts = alt >= 6 ? 7.6 : 6.4;
  dc(COR.lin); doc.setLineWidth(0.2); doc.rect(m, topo, W - 2 * m, n * alt);
  col.slice(1, -1).forEach(x => doc.line(x, topo, x, fundo));
  for (let i = 0; i < n; i++) {
    const yl = topo + i * alt; if (i) doc.line(m, yl, dir, yl);
    const it = f.itens[i]; if (!it) continue;
    const yt = yl + alt / 2 + ts / 8;
    txt((col[0] + col[1]) / 2, yt, it.qtd, ts, false, COR.tin, "center");
    txt(col[1] + 2.5, yt, corta(it.descricao, ts, col[2] - col[1] - 5), ts);
    txt(col[3] - 2.5, yt, kzPdf(it.preco_unit), ts, false, COR.tin, "right");
    txt(col[4] - 2.5, yt, kzPdf(it.total), ts, true, COR.tin, "right");
  }
  // pagamento / validade + totais
  const by = fundo + 6;
  if (f.tipo === "PP") {
    rot(m, by, "Validade"); txt(m, by + 5, `Válida até ${dataPt(f.validade || "")}`, 8, true);
    txt(m, by + 9.5, "Orçamento: não serve de fatura nem de recibo.", 6.4, false, COR.cin);
  } else {
    rot(m, by, "Forma de pagamento");
    E.config.formas_pagamento.forEach((fp, i) => {
      const yy = by + 5 + i * 4.3; dc(COR.cin); fc(COR.branco); doc.rect(m, yy - 2.4, 3, 3, "FD");
      if (fp === f.forma_pagamento) { dc(COR.pet); doc.setLineWidth(0.45); doc.line(m + 0.6, yy - 0.9, m + 1.3, yy - 0.1); doc.line(m + 1.3, yy - 0.1, m + 2.6, yy - 2.1); doc.setLineWidth(0.2); }
      txt(m + 5, yy, fp, 7);
    });
    if (f.tipo === "FT") txt(m, by + 23, f.pago ? `Paga em ${dataPt(f.pago_em)}` : "POR PAGAR", 7.5, true, f.pago ? COR.pet : COR.ver);
  }
  const bx = dir - 58; fc(COR.nev); doc.roundedRect(bx, by - 3, 58, 22, 2, 2, "F");
  [["Subtotal", f.subtotal, false], ["Desconto", f.desconto, false], [{ FR: "Total pago", FT: "Total a pagar", PP: "Total" }[f.tipo], f.total, true]].forEach(([r, v, g], i) => {
    const yy = by + 2.5 + i * 6.5; rot(bx + 3.5, yy, r, g ? COR.tin : COR.cin, g ? 7 : 6.2); txt(dir - 3.5, yy, kzPdf(v), g ? 9.5 : 8, g, COR.tin, "right");
  });
  // observações
  const oy = by + 27; rot(m, oy, "Observações");
  const obs = String(f.observacoes || "").split("\n").slice(0, 2);
  for (let i = 0; i < 2; i++) { const yy = oy + 5 + i * 4.5; if (obs[i]) txt(m, yy - 1, corta(obs[i], 7, W - 2 * m), 7); dc(COR.lin); doc.line(m, yy, dir, yy); }
  // vendedor (assinatura)
  txt(m, 186, f.vendedor_nome, 8.5, true); dc(COR.lin); doc.line(m, 188, m + 60, 188); rot(m, 191, "O vendedor / carimbo", COR.cin, 5.4);
  // rodapé
  fc(COR.pet); doc.roundedRect(m, 195, W - 2 * m, 7, 1.5, 1.5, "F");
  rot(m + 4, 199.6, emp.slogan, COR.branco, 6.4); txt(dir - 4, 199.6, `${emp.contas[0].banco}  ${emp.contas[0].iban}`, 6, false, COR.branco, "right");
  await guardarPdf(doc, `${f.tipo}_${nf(f.numero)}_Grupo_Kambas.pdf`, imprimir);
}
async function pdfRelatorio(R) {
  const jsPDF = await jsPDFPronto();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, m = 15, larg = W - 2 * m, emp = E.config.empresa, r = R.resumo;
  const tc = c => doc.setTextColor(...c), fc = c => doc.setFillColor(...c), dc = c => doc.setDrawColor(...c);
  const txt = (x, y, t, s = 8.5, b = false, c = COR.tin, al = "left") => { doc.setFont("helvetica", b ? "bold" : "normal"); doc.setFontSize(s); tc(c); doc.text(String(t ?? ""), x, y, { align: al }); };
  const gerado = isoLocal(), decoradas = new Set();
  const cabecalho = () => {
    const pg = doc.internal.getCurrentPageInfo().pageNumber;
    if (decoradas.has(pg)) return; decoradas.add(pg);
    fc(COR.pet); doc.rect(0, 0, W, 4, "F");
    doc.addImage(LOGO_AZUL, "PNG", m, 9, 28, 22);
    txt(W - m, 16, `RELATÓRIO ${R.nome.toUpperCase()}`, 16, true, COR.pet, "right");
    txt(W - m, 22, R.titulo, 10.5, true, COR.tin, "right");
    txt(W - m, 27, `De ${dataPt(R.inicio)} a ${dataPt(R.fim)}  ·  Gerado em ${dataPt(gerado)} ${horaPt(gerado)} por ${E.eu.nome}`, 7.5, false, COR.cin, "right");
    dc(COR.azul); doc.setLineWidth(0.4); doc.line(m, 34, W - m, 34);
    txt(m, 288, `${emp.nome}  ·  ${emp.telefones}  ·  ${emp.email}`, 7, false, COR.cin); txt(W - m, 288, `Página ${pg}`, 7, false, COR.cin, "right");
  };
  let y = 40;
  const secao = t => { if (y > 255) { doc.addPage(); cabecalho(); y = 40; } txt(m, y + 4, t, 11.5, true, COR.pet); y += 8; };
  const tabela = (head, body, opts = {}) => {
    doc.autoTable({ startY: y, head: [head], body: body.length ? body : [[{ content: "Sem dados neste período", colSpan: head.length, styles: { textColor: COR.cin, halign: "center" } }]],
      foot: opts.foot ? [opts.foot] : undefined, margin: { left: m, right: m, top: 40, bottom: 18 }, theme: "plain",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 1.8, textColor: COR.tin, lineColor: COR.lin, lineWidth: { bottom: 0.15 } },
      headStyles: { fillColor: COR.pet, textColor: COR.branco, fontStyle: "bold", fontSize: 7 },
      footStyles: { fillColor: COR.nev, fontStyle: "bold", textColor: COR.tin },
      alternateRowStyles: { fillColor: [245, 250, 252] }, columnStyles: opts.cols || {}, didDrawPage: cabecalho,
      didParseCell: c => { const cs = (opts.cols || {})[c.column.index]; if (c.section !== "body" && cs && cs.halign) c.cell.styles.halign = cs.halign; } });
    y = doc.lastAutoTable.finalY + 6;
  };
  cabecalho();
  // resumo
  secao("Resumo da faturação");
  const variacao = r.variacao === null ? `sem vendas em ${R.anterior_titulo}` : `${r.variacao >= 0 ? "+" : ""}${String(r.variacao).replace(".", ",")}% face a ${R.anterior_titulo}`;
  const caixas = [["FATURAÇÃO", kzPdf(r.faturacao), variacao], ["FATURAS EMITIDAS", String(r.n_faturas), `valor médio ${kzPdf(r.media)}`],
    ["RECEBIDO / POR RECEBER", kzPdf(r.recebido), `por receber ${kzPdf(r.por_receber)}`], ["ANULADAS / PRÓ-FORMAS", `${r.anuladas_n} / ${r.proformas_n}`, `anulado ${kzPdf(r.anuladas_valor)}`]];
  const cw = larg / 4;
  caixas.forEach(([l, v, s], i) => {
    const x = m + i * cw; fc(i === 0 ? [213, 238, 245] : COR.nev); doc.rect(x, y, cw - 1.5, 23, "F");
    txt(x + 3, y + 5, l, 6.5, true, COR.azul); txt(x + 3, y + 12, v, 12, true);
    doc.setFontSize(6.4); doc.splitTextToSize(s, cw - 7).slice(0, 2).forEach((ln, k) => txt(x + 3, y + 17 + k * 2.8, ln, 6.4, false, COR.cin));
  });
  y += 28;
  const tot = r.produtos_valor + r.servicos_valor || 1;
  txt(m, y, `Produtos: ${kzPdf(r.produtos_valor)} (${Math.round(r.produtos_valor / tot * 100)}%)   ·   Serviços: ${kzPdf(r.servicos_valor)} (${Math.round(r.servicos_valor / tot * 100)}%)   ·   Descontos: ${kzPdf(r.descontos)}`, 8.5);
  y += 6;
  // gráfico de evolução
  secao("Evolução da faturação");
  const gh = 45, gx = m + 12, gw = larg - 14, vals = R.evolucao.map(e => e.valor), max = Math.max(...vals, 1), bw = gw / vals.length;
  dc(COR.lin); doc.setLineWidth(0.15);
  for (let i = 0; i <= 4; i++) { const yy = y + gh - gh * i / 4; doc.line(gx, yy, gx + gw, yy); txt(gx - 2, yy + 1, i ? fmt(max * i / 4 / 1000) + "k" : "0", 6, false, COR.cin, "right"); }
  R.evolucao.forEach((e, i) => {
    const h = e.valor / max * (gh - 2); if (h > 0) { fc(COR.azul); doc.rect(gx + i * bw + bw * 0.15, y + gh - h, bw * 0.7, h, "F"); }
    if (vals.length <= 16 || i % 3 === 0) txt(gx + i * bw + bw / 2, y + gh + 4, e.rotulo, 6, false, COR.cin, "center");
  });
  y += gh + 10;
  secao("Por forma de pagamento");
  tabela(["FORMA DE PAGAMENTO", "Nº", "VALOR"], R.pagamentos.map(p => [p.forma, p.n, kzPdf(p.valor)]), { cols: { 1: { halign: "right" }, 2: { halign: "right" } } });
  if (R.recargas.length) {
    secao("Recargas (lucro = valor vendido − custo do saldo)");
    tabela(["OPERADOR", "RECARGAS", "VENDIDO", "LUCRO"], R.recargas.map(x => [x.nome, x.n, kzPdf(x.valor), kzPdf(x.lucro)]),
      { cols: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } }, foot: ["Total", R.recargas.reduce((s, x) => s + x.n, 0), kzPdf(R.recargas.reduce((s, x) => s + x.valor, 0)), kzPdf(R.recargas.reduce((s, x) => s + x.lucro, 0))] });
  }
  if (R.vendedores.length) { secao("Por vendedor"); tabela(["VENDEDOR", "DOCUMENTOS", "VALOR"], R.vendedores.map(v => [v.nome, v.n, kzPdf(v.valor)]), { cols: { 1: { halign: "right" }, 2: { halign: "right" } } }); }
  secao("Por secção do catálogo");
  tabela(["SECÇÃO", "QTD.", "VALOR"], R.seccoes.map(s => [s.seccao, s.qtd, kzPdf(s.valor)]), { cols: { 1: { halign: "right" }, 2: { halign: "right" } } });
  secao("Vendas por produto e serviço");
  const sub = r.subtotal || 1;
  tabela(["CÓD.", "DESCRIÇÃO", "TIPO", "QTD.", "VALOR", "%"], R.itens.map(it => [it.codigo, it.descricao, it.tipo === "produto" ? "Produto" : it.tipo === "recarga" ? "Recarga" : "Serviço", it.qtd, kzPdf(it.valor), (it.valor / sub * 100).toFixed(1).replace(".", ",") + "%"]),
    { cols: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } }, foot: R.itens.length ? ["", "Total (antes de descontos)", "", r.itens_qtd, kzPdf(r.subtotal), "100%"] : null });
  if (R.stock.length) {
    secao("Stock de produtos");
    const sr = R.stock_resumo;
    txt(m, y, `No fim do período: ${fmt(sr.unidades)} unidades · valor ${kzPdf(sr.valor)} · entradas ${sr.entradas} · saídas ${sr.saidas} · ${sr.alertas} no mínimo ou abaixo`, 8.5); y += 4;
    tabela(["CÓD.", "PRODUTO", "INÍCIO", "ENTR.", "SAÍDAS", "AJUSTE", "FIM", "VALOR"], R.stock.map(s => [s.codigo, s.nome, s.inicial, s.entradas ? "+" + s.entradas : "0", s.saidas ? "-" + s.saidas : "0", s.ajustes > 0 ? "+" + s.ajustes : String(s.ajustes), s.final, kzPdf(s.valor_final)]),
      { cols: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right", fontStyle: "bold" }, 7: { halign: "right" } } });
  }
  if (R.clientes.length) { secao("Principais clientes"); tabela(["CLIENTE", "FATURAS", "VALOR"], R.clientes.map(c => [c.nome, c.n, kzPdf(c.valor)]), { cols: { 1: { halign: "right" }, 2: { halign: "right" } } }); }
  secao("Faturas do período");
  tabela(["Nº", "DATA", "CLIENTE", "VENDEDOR", "TOTAL", "ESTADO"], R.faturas.map(f => [docNum(f), `${dataPt(f.data)} ${horaPt(f.data)}`, f.cliente_nome, f.vendedor_nome, kzPdf(f.total), estadoDoc(f)[0]]),
    { cols: { 4: { halign: "right" } }, foot: R.faturas.length ? ["", "", "Faturação (emitidas)", "", kzPdf(r.faturacao), ""] : null });
  await guardarPdf(doc, `Relatorio_${R.nome}_${R.inicio}_Grupo_Kambas.pdf`);
}

/* ============================================================ folhas, confirmações, avisos */
function abrir(html, aoSubmeter) {
  $("#layer").innerHTML = `<div class="sheet-bg" data-act="fundo">${html}</div>`;
  const frm = $("#frm");
  if (frm && aoSubmeter) frm.onsubmit = async e => {
    e.preventDefault(); const b = frm.querySelector("button.pri"); if (b && b.disabled) return;
    const txt = b ? b.innerHTML : ""; if (b) { b.disabled = true; b.innerHTML = `<span class="spin" aria-hidden="true"></span>${esc(b.dataset.espera || "A guardar…")}`; }
    if (!DEMO) ocupado(true);
    try { await aoSubmeter(); } catch (er) { const el = $("#frm-err"); if (el) el.innerHTML = `<div class="err">${esc(mensagemErro(er))}</div>`; if (!(er instanceof ErroNegocio)) console.error(er); }
    finally { if (!DEMO) ocupado(false); if (b && b.isConnected) { b.disabled = false; b.innerHTML = txt; } }
  };
}
function fechar() { $("#layer").innerHTML = ""; if (pendente) aplicarSync(); }
function confirmar(titulo, texto, botao, fn) {
  abrir(`<form class="sheet" id="frm"><div class="sheet-h"><h2>${esc(titulo)}</h2></div><div class="sheet-b"><p style="margin:0">${texto}</p><div id="frm-err"></div></div>
    <div class="sheet-f"><button type="button" class="btn" data-act="fechar">Cancelar</button><button class="btn pri">${esc(botao)}</button></div></form>`, fn);
}
let tToast;
/* aviso: tipo "" (simples), "ok" (feito), "erro" ou "prog" (a decorrer, fica até ao próximo aviso) */
function toast(m, tipo = "", sub = "") {
  let t = $(".toast"); if (!t) { t = document.createElement("div"); t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.className = "toast" + (tipo ? " t-" + tipo : "");
  t.innerHTML = (tipo === "ok" ? `<span class="ti">${icon("check")}</span>` : tipo === "erro" ? `<span class="ti">!</span>` : tipo === "prog" ? `<span class="ti"><span class="spin"></span></span>` : "")
    + `<span class="tt"><b></b>${sub ? "<small></small>" : ""}</span>` + (tipo === "prog" ? `<span class="tbar"><i></i></span>` : "");
  t.querySelector("b").textContent = m; if (sub) t.querySelector("small").textContent = sub;
  t.hidden = false; clearTimeout(tToast);
  if (tipo !== "prog") tToast = setTimeout(() => t.hidden = true, tipo === "erro" ? 4500 : 2800);
}
function fecharToast() { const t = $(".toast"); if (t) t.hidden = true; }
/* linha fina no topo enquanto há trabalho a decorrer */
let nOcupado = 0;
function ocupado(on) { nOcupado = Math.max(0, nOcupado + (on ? 1 : -1)); document.body.classList.toggle("ocupado", nOcupado > 0); }
/* ecrã de arranque: barra de progresso com as etapas reais da entrada */
const Arranque = {
  passos: [["Ligação", 16], ["Conta", 40], ["Catálogo", 70], ["Vendas", 90]], inicio: Date.now(), feito: false,
  passo(i, texto) {
    if (!$("#arranque") || this.feito) return;
    $("#arr-txt").textContent = texto; this.pct(this.passos[i][1]);
    $("#arr-passos").innerHTML = this.passos.map(([n], k) => `<span class="${k < i ? "ok" : k === i ? "agora" : ""}">${k < i ? icon("check") : "<i></i>"}${n}</span>`).join("");
  },
  pct(v) { $("#arr-fill").style.width = v + "%"; $("#arr-pct").textContent = Math.round(v) + "%"; $("#arr-barra").setAttribute("aria-valuenow", Math.round(v)); },
  async fim() {
    const el = $("#arranque"); if (!el || this.feito) return; this.feito = true;
    this.pct(100); $("#arr-txt").textContent = "Pronto";
    $("#arr-passos").innerHTML = this.passos.map(([n]) => `<span class="ok">${icon("check")}${n}</span>`).join("");
    await new Promise(r => setTimeout(r, Math.max(250, 900 - (Date.now() - this.inicio))));   // não pisca nem atrasa
    el.classList.add("sai"); setTimeout(() => el.remove(), 450);
  },
};
async function comEspera(btn, fn) {
  if (btn.disabled) return;
  const txt = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${esc(btn.dataset.espera || "A preparar…")}`;
  ocupado(true);
  try { await fn(); } catch (e) { toast(mensagemErro(e), "erro"); console.error(e); }
  finally { ocupado(false); if (btn.isConnected) { btn.disabled = false; btn.innerHTML = txt; } }
}

const ACOES = {
  "fundo": (el, e) => { if (e.target === el) fechar(); },
  "fechar": () => fechar(),
  "ver-fatura": el => verFatura(el.dataset.id),
  "anular": el => anular(el.dataset.id),
  "converter": el => converter(el.dataset.id),
  "pagar": el => pagar(el.dataset.id),
  "imprimir": el => comEspera(el, () => imprimirDoc(byId(E.faturas, el.dataset.id))),
  "ver-senha": el => { const i = $("#" + el.dataset.alvo); const ver = i.type === "password"; i.type = ver ? "text" : "password"; el.setAttribute("aria-pressed", ver); el.setAttribute("aria-label", ver ? "Esconder senha" : "Mostrar senha"); el.innerHTML = icon(ver ? "olho-fechado" : "olho"); i.focus(); },
  "pdf-fatura": el => comEspera(el, async () => { const f = byId(E.faturas, el.dataset.id); toast(`A gerar o PDF da ${docNum(f)}…`, "prog"); await pdfFatura(f); }),
  "pdf-relatorio": el => comEspera(el, async () => { toast(`A gerar o relatório ${vRelatorios.atual.nome.toLowerCase()}…`, "prog"); await new Promise(r => setTimeout(r, 30)); await pdfRelatorio(vRelatorios.atual); }),
  "f-tipo": el => { filtroF.tipo = el.dataset.v; document.querySelectorAll("#ftipo button").forEach(b => b.setAttribute("aria-pressed", b === el)); vFaturas.upd(); },
  "doc-tipo": el => { venda.tipo = el.dataset.v; carrinho(); tiles(); },
  "sec": el => { venda.sec = el.dataset.v; document.querySelectorAll("#psec button").forEach(b => b.setAttribute("aria-pressed", b === el)); tiles(); },
  "add": el => adicionar(el.dataset.id),
  "qtd": el => mudarQtd(Number(el.dataset.i), Number(el.dataset.d)),
  "rm": el => { venda.itens.splice(Number(el.dataset.i), 1); carrinho(); tiles(); },
  "forma": el => { venda.forma = el.dataset.v; carrinho(); if (venda.forma === "Numerário") setTimeout(() => $("#vrec")?.focus(), 30); },
  "limpar-venda": () => { venda.itens = []; venda.desconto = 0; venda.extras = { desc: false, obs: false }; carrinho(); tiles(); },
  "tqtd": el => {
    const i = venda.itens.findIndex(x => String(x.produto_id) === String(el.dataset.id)); if (i < 0) return;
    if (Number(el.dataset.d) < 0 && venda.itens[i].qtd <= 1) { venda.itens.splice(i, 1); carrinho(); tiles(); } else mudarQtd(i, Number(el.dataset.d));
  },
  "vista-cat": el => { venda.vista = el.dataset.v; gravarPref("vista-catalogo", venda.vista); document.querySelectorAll(".vista-cat button").forEach(b => b.setAttribute("aria-pressed", b === el)); tiles(); },
  "ver-extra": el => { venda.extras = venda.extras || {}; venda.extras[el.dataset.v] = true; carrinho(); setTimeout(() => $(el.dataset.v === "desc" ? "#vdesc" : "#vobs")?.focus(), 30); },
  "ini-dias": el => { ini.dias = Number(el.dataset.v); vPainel(); },
  "ir-proforma": () => { venda.tipo = "PP"; if (location.hash === "#vender") render(); else location.hash = "#vender"; },
  "ver-abertas": () => { filtroF.estado = "aberto"; if (location.hash === "#faturas") render(); else location.hash = "#faturas"; },
  "mais": () => menuMais(),
  "recarga": el => formRecarga(el.dataset.id),
  "rc-valor": el => { $("#rc-valor").value = el.dataset.v; $("#rc-valor").dispatchEvent(new Event("input")); },
  "carregar-saldo": el => formCarga(el.dataset.id),
  "ajustar-saldo": el => formAjusteSaldo(el.dataset.id),
  "editar-operador": el => formOperador(el.dataset.id),
  "novo-operador": () => formOperador(null),
  "emitir": () => emitir(),
  "abrir-carrinho": () => { $("#cart").classList.add("open"); $("#cartbar").hidden = true; },
  "fechar-carrinho": () => { $("#cart").classList.remove("open"); carrinho(); },
  "cli-usar": el => { Object.assign(venda, { cliente_id: el.dataset.id, cliQ: "" }); carrinho(); },
  "cli-trocar": () => { venda.cliente_id = ""; carrinho(); setTimeout(() => $("#vcliq")?.focus(), 30); },
  "cli-editar": el => formCliente(Number(el.dataset.id), () => { fechar(); carrinho(); }),
  "cli-novo": () => { const q = venda.cliQ.trim(), num = q.replace(/[\s.-]/g, ""); venda.novoCli = /^\d{9}$/.test(num) ? { nome: "", nif: "", telefone: q, endereco: "" } : /^\d{9,}[A-Z]{0,2}\d*$/i.test(num) ? { nome: "", nif: q, telefone: "", endereco: "" } : { nome: q, nif: "", telefone: "", endereco: "" }; carrinho(); setTimeout(() => $(venda.novoCli.nome ? "#nc-nif" : "#nc-nome").focus(), 30); },
  "cli-cancelar": () => { venda.novoCli = null; carrinho(); },
  "cli-guardar": () => guardarClienteVenda(),
  "avulso": () => itemAvulso(),
  "desc-modo": el => { venda.descModo = el.dataset.v; carrinho(); },
  "nova-venda": () => { fechar(); if (location.hash === "#vender") render(); else location.hash = "#vender"; setTimeout(() => $("#pq")?.focus(), 50); },
  "copiar-fatura": async el => { const t = resumoFatura(byId(E.faturas, el.dataset.id)); try { await navigator.clipboard.writeText(t); toast("Resumo copiado"); } catch (e) { toast("Não foi possível copiar neste dispositivo"); } },
  "tipo-p": el => { filtroP.tipo = el.dataset.v; document.querySelectorAll("#xt button").forEach(b => b.setAttribute("aria-pressed", b === el)); vProdutos.upd(); },
  "novo-produto": () => formProduto(null),
  "editar-produto": el => formProduto(Number(el.dataset.id)),
  "remover-produto": el => { const p = produto(el.dataset.id); confirmar(`Remover ${p.nome}?`, "Deixa de aparecer no catálogo e nas vendas. Os documentos antigos continuam intactos.", "Remover", async () => { await acao("removerProduto", p.id); fechar(); render(); toast(`${p.nome} removido`); }); },
  "mov": el => formMov(el.dataset.t, el.dataset.id),
  "contagem": () => formContagem(),
  "rel-tipo": el => { rel.tipo = el.dataset.v; vRelatorios(); },
  "rel-aba": el => { rel.aba = el.dataset.v; vRelatorios(); },
  "rel-mover": el => moverRel(Number(el.dataset.d)),
  "rel-hoje": () => { rel.ref = hoje(); vRelatorios(); },
  "novo-cliente": () => formCliente(null),
  "editar-cliente": el => formCliente(Number(el.dataset.id)),
  "remover-cliente": el => { const c = byId(E.clientes, el.dataset.id); confirmar(`Remover ${c.nome}?`, "Os documentos já emitidos mantêm os dados do cliente.", "Remover", async () => { await acao("removerCliente", c.id); fechar(); render(); toast("Cliente removido"); }); },
  "novo-utilizador": () => formUtilizador(null),
  "editar-utilizador": el => formUtilizador(el.dataset.id),
  "conta": () => conta(),
  "demo-ver": el => { E._eu = el.dataset.id; Local.atualizarEu(); guardarLocal(); fechar(); Object.assign(venda, { tipo: "FR", itens: [], cliente_id: "", forma: "" }); navegar(); toast(`A ver como ${E.eu.nome}`); },
  "sair": () => fila.length
    ? confirmar("Há registos por enviar", `Tem <b>${fila.length}</b> registo${fila.length === 1 ? "" : "s"} feito${fila.length === 1 ? "" : "s"} sem internet que ainda não ${fila.length === 1 ? "chegou" : "chegaram"} ao servidor. Se terminar a sessão agora, perdem-se. Ligue-se à internet e espere pelo envio, ou confirme para descartar.`, "Terminar e descartar", terminarSessao)
    : confirmar("Terminar sessão?", `Vai sair da conta de <b>${esc(E.eu.nome)}</b>. Para voltar a entrar precisa do utilizador e da senha.`, "Terminar sessão", terminarSessao),
  "pendentes": () => verPendentes(),
  "fila-enviar": async () => { fechar(); await enviarFila(); },
  "fila-tentar": async el => { const it = fila.find(i => i.id === el.dataset.id); if (it) { it.erro = null; try { await IDB.gravar("fila", it); } catch (e) {} } fechar(); await enviarFila(); },
  "fila-descartar": el => confirmar("Descartar este registo?", "Fica apagado deste aparelho e não chega ao servidor.", "Descartar", async () => { await descartarDaFila(el.dataset.id); fechar(); render(); toast("Registo descartado"); }),
  "repor": () => confirmar("Recomeçar a demonstração?", "Apaga tudo o que foi registado neste navegador e volta aos dados de exemplo.", "Recomeçar", async () => { try { localStorage.removeItem(CHAVE); } catch (e) {} Local.novo(); guardarLocal(); fechar(); navegar(); toast("Demonstração reposta"); }),
};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const fn = ACOES[el.dataset.act]; if (!fn) return;
  if (el.tagName === "A") e.preventDefault();
  fn(el, e);
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#layer").innerHTML) fechar(); });
window.addEventListener("hashchange", () => { if (!E) return; $("#layer").innerHTML = ""; navegar(); });

/* ============================================================ sincronização em tempo real */
let pendente = false, tSync = null, canal = null;
function marcarSync(estado) {
  const el = $("#mode"); if (!el || DEMO) return;
  const n = fila.length;
  el.className = "mode " + ({ ok: "srv", a: "", enviar: "", off: "off" }[estado] || "");
  el.textContent = { ok: "Sincronizado", a: n ? `${n} por enviar` : "A sincronizar…", enviar: "A enviar…", off: n ? `Offline · ${n} por enviar` : "Offline" }[estado];
}
function aplicarSync() {
  const foco = document.activeElement;
  if ($("#layer").innerHTML || (foco && ["INPUT", "TEXTAREA", "SELECT"].includes(foco.tagName))) { pendente = true; return; }
  if (vista === "vender") { pendente = false; tiles(); carrinho(); } else render();
}
function agendarSync() {
  clearTimeout(tSync);
  tSync = setTimeout(async () => {
    try { marcarSync("a"); await recarregar(); mostrarEstado(); aplicarSync(); enviarFila(); }
    catch (e) { if (e.rede) { entrarOffline(); return; } if (/sessão/i.test(e.message)) location.reload(); }
  }, 400);
}
document.addEventListener("focusout", () => { if (pendente) setTimeout(() => { if (pendente) aplicarSync(); }, 250); });
function ligarTempoReal() {
  canal = sb.channel("kambas-dados")
    .on("postgres_changes", { event: "*", schema: "public" }, () => agendarSync())
    .subscribe(st => { if (st === "SUBSCRIBED") mostrarEstado(); /* se o tempo real falhar, os dados continuam a atualizar ao voltar à aplicação */ });
  window.addEventListener("online", () => { agendarSync(); setTimeout(enviarFila, 1500); });
  window.addEventListener("offline", () => entrarOffline());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) agendarSync(); });
}

/* ============================================================ entrar / configuração inicial */
const emailDe = u => u.includes("@") ? u.trim() : `${u.trim().toLowerCase()}@${DOMINIO_LOGIN}`;
function ecraAuth(html) { ocupado(false); Arranque.fim(); $("#app").hidden = true; const a = $("#auth"); a.hidden = false; a.innerHTML = `<div class="auth-box"><img class="auth-logo" src="${$(".rail .logo").src}" alt="Grupo Kambas">${html}</div><p class="auth-pe">Crescendo juntos sempre!</p>`; }
function ecraLogin(msg = "") {
  ecraAuth(`<form id="f-login" class="auth-card" autocomplete="on">
      <h1>Entrar</h1><p class="sub">Sistema de gestão do Grupo Kambas</p>
      <label class="field"><span>Utilizador</span><input class="f" id="l-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
      ${campoSenha("l-senha", "Senha", "current-password", "required", "password")}
      <div id="l-err">${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div>
      <button type="submit" class="btn pri big">Entrar</button>
      <p class="cod" style="text-align:center;margin:0">Esqueceu a senha? Peça ao administrador para a mudar.</p>
      ${eNativo() || navigator.userAgent.includes("Electron") ? "" : `<a class="cod" style="text-align:center" href="instalar.html" target="_blank" rel="noopener">Instalar no Android, iPhone ou Windows</a>`}</form>`);
  $("#f-login").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true; b.textContent = "A entrar…";
    const { error } = await sb.auth.signInWithPassword({ email: emailDe($("#l-user").value), password: $("#l-senha").value });
    if (error) {
      b.disabled = false; b.textContent = "Entrar";
      const m = /invalid login/i.test(error.message) ? "Utilizador ou senha errados." : /banned/i.test(error.message) ? "Esta conta foi desativada. Fale com o administrador." : mensagemErro(error);
      $("#l-err").innerHTML = `<div class="err">${esc(m)}</div>`; return;
    }
    await guardarCredencial($("#l-user").value.trim(), $("#l-senha").value);
    await entrarNaApp();
  };
  setTimeout(() => $("#l-user").focus(), 50);
}
function ecraConfigurar() {
  ecraAuth(`<form id="f-cfg" class="auth-card" autocomplete="off">
      <h1>Configuração inicial</h1><p class="sub">Crie a conta do administrador. Depois, é ele que cria as contas dos vendedores.</p>
      <label class="field"><span>Código de configuração</span><input class="f" id="c-cod" placeholder="KMB-XXXX-XXXX-XXXX" autocapitalize="characters" required></label>
      <label class="field"><span>O seu nome (aparece nas faturas)</span><input class="f" id="c-nome" required></label>
      <label class="field"><span>Utilizador (para entrar)</span><input class="f" id="c-user" placeholder="Ex.: yuri" autocapitalize="none" spellcheck="false" required></label>
      <div class="grid2">${campoSenha("c-s1", "Senha", "new-password", "required", "password")}${campoSenha("c-s2", "Repetir senha", "new-password", "required")}</div>
      <div id="c-err"></div><button type="submit" class="btn pri big">Criar administrador</button></form>`);
  $("#f-cfg").onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector("button"); const err = m => { $("#c-err").innerHTML = `<div class="err">${esc(m)}</div>`; b.disabled = false; b.textContent = "Criar administrador"; };
    if ($("#c-s1").value !== $("#c-s2").value) return err("As duas senhas não são iguais.");
    b.disabled = true; b.textContent = "A criar…";
    try {
      await chamarFuncao({ acao: "configurar", codigo: $("#c-cod").value, nome: $("#c-nome").value, utilizador: $("#c-user").value, senha: $("#c-s1").value });
      const { error } = await sb.auth.signInWithPassword({ email: emailDe($("#c-user").value), password: $("#c-s1").value });
      if (error) throw error;
      await guardarCredencial($("#c-user").value.trim().toLowerCase(), $("#c-s1").value);
      await entrarNaApp(); toast("Administrador criado. Bem-vindo!");
    } catch (er) { err(mensagemErro(er)); }
  };
}
async function mostrarEntrada(msg) {
  try { const { data } = await sb.rpc("precisa_configurar"); if (data === true) return ecraConfigurar(); } catch (e) { /* sem rede: mostra login */ }
  ecraLogin(msg);
}
async function entrarNaApp(uid) {
  uid = uid || (await sb.auth.getSession().catch(() => ({ data: {} }))).data?.session?.user?.id || localStorage.getItem(ULTIMO);
  await carregarFila(uid);
  Arranque.passo(2, "A carregar catálogo, preços e vendas…");
  ocupado(true);
  try { await recarregar(); }
  catch (e) {
    if (e.rede && await carregarCopia(uid)) { montarE(); entrarOffline(); }
    else if (e.rede) { $("#app").hidden = true; return ecraLogin("Sem internet e sem dados guardados neste aparelho. Ligue-se uma vez à internet para começar a usar o modo offline."); }
    else { await sb.auth.signOut(); return mostrarEntrada(/sessão|permission/i.test(e.message) ? "A sua conta não tem acesso ativo. Fale com o administrador." : e.message); }
  }
  ocupado(false);
  Arranque.passo(3, "A preparar as vendas…");
  $("#auth").hidden = true; $("#app").hidden = false;
  mostrarEstado();
  if (!canal) ligarTempoReal();
  navegar();
  Arranque.fim();
  enviarFila();
}

async function terminarSessao() {
  Object.assign(venda, { tipo: "FR", itens: [], cliente_id: "", forma: "", desconto: 0, recebido: 0, obs: "", cliQ: "", novoCli: null });
  fechar();
  if (DEMO) { E._sessao = false; guardarLocal(); history.replaceState(null, "", location.pathname + location.search); return ecraLoginDemo("Sessão terminada."); }
  try { if (canal) await sb.removeChannel(canal); await sb.auth.signOut(); } catch (e) { /* termina na mesma neste aparelho */ }
  try { localStorage.removeItem("grupo-kambas-sessao"); localStorage.removeItem(ULTIMO); } catch (e) { /* sem armazenamento */ }
  try { await IDB.apagar("estado", E.eu.id); for (const it of fila) await IDB.apagar("fila", it.id); } catch (e) { /* nada guardado */ }
  location.hash = ""; location.reload();
}
function ecraLoginDemo(msg = "") {
  ecraAuth(`<form id="f-login" class="auth-card" autocomplete="off">
      <h1>Entrar</h1><p class="sub">Demonstração: entre como <b>admin</b> (administrador) ou <b>maria</b> (vendedora), com qualquer senha.</p>
      <label class="field"><span>Utilizador</span><input class="f" id="l-user" autocapitalize="none" spellcheck="false" required></label>
      ${campoSenha("l-senha", "Senha", "current-password", "required", "password")}
      <div id="l-err">${msg ? `<div class="note">${esc(msg)}</div>` : ""}</div>
      <button type="submit" class="btn pri big">Entrar</button></form>`);
  $("#f-login").onsubmit = e => {
    e.preventDefault();
    const u = E.utilizadores.find(x => x.utilizador === $("#l-user").value.trim().toLowerCase());
    if (!u || !u.ativo) { $("#l-err").innerHTML = `<div class="err">Utilizador ou senha errados.</div>`; return; }
    E._eu = u.id; E._sessao = true; Local.atualizarEu(); guardarLocal();
    $("#auth").hidden = true; $("#app").hidden = false; navegar(); toast(`Bem-vindo, ${E.eu.nome}`);
  };
  setTimeout(() => $("#l-user").focus(), 50);
}

/* ============================================================ arranque */
(async function iniciar() {
  Arranque.passo(0, "A iniciar…");
  if (DEMO) {
    Arranque.passo(2, "A carregar catálogo e preços…");
    $("#mode").textContent = "Demonstração";
    try { const s = localStorage.getItem(CHAVE); if (s) E = JSON.parse(s); } catch (e) { E = null; }
    if (E && !E.operadores) { Local.semearOperadores(); guardarLocal(); }   // demonstração guardada antes das recargas
    if (!E || !E._seq || !E.utilizadores) { Local.novo(); guardarLocal(); }
    if (E._sessao === false) return ecraLoginDemo();
    Local.atualizarEu();
    Arranque.passo(3, "A preparar as vendas…");
    $("#app").hidden = false;
    navegar();
    Arranque.fim();
    return;
  }
  Arranque.passo(0, "A ligar ao servidor…");
  sb = window.supabase.createClient(SUPA.url, SUPA.chave, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "grupo-kambas-sessao" } });
  sb.auth.onAuthStateChange(ev => { if (ev === "SIGNED_OUT" && E) location.reload(); });
  registarServiceWorker();
  let session = null;
  try { session = (await sb.auth.getSession()).data.session; } catch (e) { /* sem rede para renovar a sessão */ }
  Arranque.passo(1, "A verificar a sua conta…");
  const ultimo = (() => { try { return localStorage.getItem(ULTIMO); } catch (e) { return null; } })();
  if (session) await entrarNaApp(session.user.id);
  else if (!navigator.onLine && ultimo) await entrarNaApp(ultimo);
  else await mostrarEntrada();
})();
