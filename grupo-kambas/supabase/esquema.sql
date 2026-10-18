-- Grupo Kambas — base de dados Supabase (Postgres)
-- Tabelas, regras de acesso (RLS) e operações de negócio.
-- As escritas passam todas por funções (RPC) que validam permissões e
-- mantêm o stock e a numeração certos, mesmo com vários dispositivos.

-- ================================================================ tabelas
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  utilizador text not null unique,
  papel text not null default 'vendedor' check (papel in ('admin', 'vendedor')),
  permissoes jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.config (
  chave text primary key,
  valor jsonb not null
);

create table if not exists public.produtos (
  id bigint generated always as identity primary key,
  codigo text unique not null,
  nome text not null,
  descricao text not null default '',
  seccao text not null,
  tipo text not null check (tipo in ('produto', 'servico')),
  preco integer not null default 0 check (preco >= 0),
  modo text not null default 'fixo' check (modo in ('fixo', 'a_partir', 'consulta')),
  tier_qtd integer,
  tier_preco integer,
  stock integer not null default 0,
  stock_min integer not null default 0,
  ativo boolean not null default true
);

create table if not exists public.clientes (
  id bigint generated always as identity primary key,
  nome text not null,
  nif text not null default '',
  endereco text not null default '',
  telefone text not null default '',
  ativo boolean not null default true,
  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);

-- FR = Fatura-Recibo (paga no acto), FT = Fatura (a pagar), PP = Fatura Pró-forma
create table if not exists public.documentos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('FR', 'FT', 'PP')),
  numero integer not null,
  data timestamptz not null default now(),
  cliente_id bigint references public.clientes(id) on delete set null,
  cliente_nome text not null default 'Consumidor final',
  cliente_nif text not null default '',
  cliente_endereco text not null default '',
  cliente_telefone text not null default '',
  vendedor_id uuid references public.perfis(id) on delete set null,
  vendedor_nome text not null default '',
  forma_pagamento text,
  subtotal integer not null,
  desconto integer not null default 0,
  total integer not null,
  observacoes text not null default '',
  estado text not null default 'emitida' check (estado in ('emitida', 'anulada', 'convertida')),
  pago boolean not null default false,
  pago_em timestamptz,
  validade date,
  origem_id bigint references public.documentos(id) on delete set null,
  unique (tipo, numero)
);
create index if not exists documentos_data_idx on public.documentos (data);
create index if not exists documentos_vendedor_idx on public.documentos (vendedor_id);

create table if not exists public.documento_itens (
  id bigint generated always as identity primary key,
  documento_id bigint not null references public.documentos(id) on delete cascade,
  produto_id bigint references public.produtos(id) on delete set null,
  descricao text not null,
  qtd integer not null check (qtd > 0),
  preco_unit integer not null check (preco_unit > 0),
  total integer not null
);
create index if not exists documento_itens_doc_idx on public.documento_itens (documento_id);

create table if not exists public.movimentos (
  id bigint generated always as identity primary key,
  data timestamptz not null default now(),
  produto_id bigint not null references public.produtos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  qtd integer not null,
  stock_final integer not null,
  motivo text not null default '',
  ref text not null default '',
  utilizador_id uuid references public.perfis(id) on delete set null
);
create index if not exists movimentos_produto_idx on public.movimentos (produto_id, data);

-- ================================================================ permissões
-- Papéis: admin (tudo) e vendedor (vende, emite pró-formas, regista clientes).
-- Extras que o admin pode dar a um vendedor:
--   ver_todas (ver documentos de todos), anular, produtos, stock, relatorios
create or replace function public.ativo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and ativo)
$$;

create or replace function public.tem_permissao(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select papel = 'admin' or (p = 'vender') or coalesce((permissoes ->> p)::boolean, false)
    from perfis where id = auth.uid() and ativo
  ), false) and (p <> 'admin' or exists (select 1 from perfis where id = auth.uid() and ativo and papel = 'admin'))
$$;

create or replace function public.exigir(p text) returns public.perfis
language plpgsql stable security definer set search_path = public as $$
declare v perfis;
begin
  select * into v from perfis where id = auth.uid() and ativo;
  if not found then
    raise exception 'Sessão inválida. Entre novamente.';
  end if;
  if not tem_permissao(p) then
    raise exception 'Não tem permissão para esta operação. Peça ao administrador.';
  end if;
  return v;
end $$;

alter table public.perfis enable row level security;
alter table public.config enable row level security;
alter table public.produtos enable row level security;
alter table public.clientes enable row level security;
alter table public.documentos enable row level security;
alter table public.documento_itens enable row level security;
alter table public.movimentos enable row level security;

drop policy if exists ler on public.perfis;
create policy ler on public.perfis for select to authenticated using (id = auth.uid() or tem_permissao('admin'));
drop policy if exists ler on public.config;
create policy ler on public.config for select to authenticated using (ativo());
drop policy if exists ler on public.produtos;
create policy ler on public.produtos for select to authenticated using (ativo());
drop policy if exists ler on public.clientes;
create policy ler on public.clientes for select to authenticated using (ativo());
drop policy if exists ler on public.documentos;
create policy ler on public.documentos for select to authenticated
  using (vendedor_id = auth.uid() or tem_permissao('ver_todas') or tem_permissao('relatorios'));
drop policy if exists ler on public.documento_itens;
create policy ler on public.documento_itens for select to authenticated
  using (exists (select 1 from documentos d where d.id = documento_id));
drop policy if exists ler on public.movimentos;
create policy ler on public.movimentos for select to authenticated
  using (tem_permissao('stock') or tem_permissao('relatorios'));
-- Sem políticas de escrita: só as funções abaixo (security definer) escrevem.

-- ================================================================ utilitários internos
create or replace function public._erro(msg text) returns void language plpgsql as $$
begin raise exception '%', msg; end $$;

create or replace function public._ref(p_tipo text, p_numero integer) returns text
language sql immutable as $$ select p_tipo || ' ' || lpad(p_numero::text, 4, '0') $$;

create or replace function public._mover(p_produto bigint, p_tipo text, p_qtd integer, p_motivo text, p_ref text default '')
returns integer language plpgsql security definer set search_path = public as $$
declare v_novo integer;
begin
  update produtos set stock = case p_tipo when 'entrada' then stock + p_qtd when 'saida' then stock - p_qtd else p_qtd end
   where id = p_produto returning stock into v_novo;
  insert into movimentos (produto_id, tipo, qtd, stock_final, motivo, ref, utilizador_id)
  values (p_produto, p_tipo, p_qtd, v_novo, p_motivo, coalesce(p_ref, ''), auth.uid());
  return v_novo;
end $$;

-- (não usar o nome _config: o Postgres reserva-o para o tipo array da tabela config)
create or replace function public.cfg_valor(p_chave text) returns jsonb
language sql stable security definer set search_path = public as $$ select valor from config where chave = p_chave $$;

-- security invoker: quem chama só vê os itens dos documentos que já pode ver (RLS)
create or replace function public._doc_json(p_id bigint) returns jsonb
language sql stable security invoker set search_path = public as $$
  select to_jsonb(d) - 'data' - 'pago_em'
         || jsonb_build_object(
              'data', to_char(d.data at time zone 'Africa/Luanda', 'YYYY-MM-DD"T"HH24:MI:SS'),
              'pago_em', to_char(d.pago_em at time zone 'Africa/Luanda', 'YYYY-MM-DD"T"HH24:MI:SS'),
              'itens', coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from documento_itens i where i.documento_id = d.id), '[]'::jsonb))
  from documentos d where d.id = p_id
$$;

-- ================================================================ documentos (FR / FT / PP)
create or replace function public.registar_documento(d jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_eu perfis := exigir('vender');
  v_tipo text := coalesce(nullif(d ->> 'tipo', ''), 'FR');
  v_forma text := nullif(d ->> 'forma_pagamento', '');
  v_it jsonb; v_p produtos; v_qtd integer; v_preco integer; v_descr text;
  v_precisa jsonb := '{}'::jsonb; v_linhas jsonb := '[]'::jsonb;
  v_sub integer := 0; v_desconto integer; v_cli clientes;
  v_num integer; v_num_cfg jsonb; v_id bigint; v_k text; v_v jsonb; v_ref text;
begin
  if v_tipo not in ('FR', 'FT', 'PP') then perform _erro('Tipo de documento inválido.'); end if;
  if jsonb_typeof(d -> 'itens') is distinct from 'array' or jsonb_array_length(d -> 'itens') = 0 then
    perform _erro('Adicione pelo menos um produto ou serviço.');
  end if;
  if v_forma is not null and not (cfg_valor('formas_pagamento') ? v_forma) then perform _erro('Forma de pagamento inválida.'); end if;
  if v_tipo = 'FR' and v_forma is null then perform _erro('Escolha a forma de pagamento.'); end if;

  for v_it in select * from jsonb_array_elements(d -> 'itens') loop
    v_p := null;
    if nullif(v_it ->> 'produto_id', '') is not null then
      select * into v_p from produtos where id = (v_it ->> 'produto_id')::bigint and ativo for update;
      if not found then perform _erro('Produto não encontrado.'); end if;
    end if;
    begin
      v_qtd := (v_it ->> 'qtd')::integer; v_preco := (v_it ->> 'preco_unit')::integer;
    exception when others then perform _erro('Quantidade e preço têm de ser números inteiros.');
    end;
    v_descr := trim(coalesce(nullif(v_it ->> 'descricao', ''), v_p.nome, ''));
    if v_descr = '' then perform _erro('Item sem descrição.'); end if;
    if v_qtd is null or v_qtd <= 0 then perform _erro(format('Quantidade inválida em ''%s''.', v_descr)); end if;
    if v_preco is null or v_preco <= 0 then perform _erro(format('Indique o preço de ''%s''.', v_descr)); end if;
    if v_p.id is not null and v_p.modo = 'a_partir' and v_preco < v_p.preco then
      perform _erro(format('''%s'' custa a partir de %s Kz.', v_p.nome, v_p.preco));
    end if;
    if v_p.id is not null and v_p.tipo = 'produto' then
      v_precisa := jsonb_set(v_precisa, array[v_p.id::text], to_jsonb(coalesce((v_precisa ->> v_p.id::text)::integer, 0) + v_qtd));
    end if;
    v_linhas := v_linhas || jsonb_build_object('produto_id', v_p.id, 'descricao', v_descr, 'qtd', v_qtd, 'preco_unit', v_preco, 'total', v_qtd * v_preco);
    v_sub := v_sub + v_qtd * v_preco;
  end loop;

  if v_tipo <> 'PP' then
    for v_k, v_v in select * from jsonb_each(v_precisa) loop
      select * into v_p from produtos where id = v_k::bigint;
      if (v_v #>> '{}')::integer > v_p.stock then
        perform _erro(format('Stock insuficiente de %s: pediu %s, há %s.', v_p.nome, v_v #>> '{}', v_p.stock));
      end if;
    end loop;
  end if;

  begin
    v_desconto := coalesce(nullif(d ->> 'desconto', '')::integer, 0);
  exception when others then perform _erro('Desconto inválido.');
  end;
  if v_desconto < 0 or v_desconto > v_sub then perform _erro('O desconto tem de estar entre 0 e o subtotal.'); end if;

  if nullif(d ->> 'cliente_id', '') is not null then
    select * into v_cli from clientes where id = (d ->> 'cliente_id')::bigint;
    if not found then perform _erro('Cliente não encontrado.'); end if;
  end if;

  select valor into v_num_cfg from config where chave = 'numeracao' for update;
  select greatest(coalesce((v_num_cfg ->> v_tipo)::integer, 1), coalesce(max(numero), 0) + 1) into v_num
    from documentos where tipo = v_tipo;
  update config set valor = jsonb_set(valor, array[v_tipo], to_jsonb(v_num + 1)) where chave = 'numeracao';

  insert into documentos (tipo, numero, cliente_id, cliente_nome, cliente_nif, cliente_endereco, cliente_telefone,
                          vendedor_id, vendedor_nome, forma_pagamento, subtotal, desconto, total, observacoes,
                          pago, pago_em, validade, origem_id)
  values (v_tipo, v_num, v_cli.id, coalesce(v_cli.nome, 'Consumidor final'), coalesce(v_cli.nif, ''),
          coalesce(v_cli.endereco, ''), coalesce(v_cli.telefone, ''), v_eu.id, v_eu.nome, v_forma,
          v_sub, v_desconto, v_sub - v_desconto, trim(coalesce(d ->> 'observacoes', '')),
          v_tipo = 'FR', case when v_tipo = 'FR' then now() end,
          case when v_tipo = 'PP' then current_date + coalesce((cfg_valor('validade_proforma') #>> '{}')::integer, 15) end,
          nullif(d ->> 'origem_id', '')::bigint)
  returning id into v_id;

  insert into documento_itens (documento_id, produto_id, descricao, qtd, preco_unit, total)
  select v_id, nullif(l ->> 'produto_id', '')::bigint, l ->> 'descricao', (l ->> 'qtd')::integer,
         (l ->> 'preco_unit')::integer, (l ->> 'total')::integer
  from jsonb_array_elements(v_linhas) l;

  if v_tipo <> 'PP' then
    v_ref := _ref(v_tipo, v_num);
    for v_it in select * from jsonb_array_elements(v_linhas) loop
      if v_precisa ? (v_it ->> 'produto_id') then
        perform _mover((v_it ->> 'produto_id')::bigint, 'saida', (v_it ->> 'qtd')::integer, 'Venda', v_ref);
      end if;
    end loop;
  end if;
  return _doc_json(v_id);
end $$;

create or replace function public._pode_ver(p_doc documentos) returns boolean
language sql stable security definer set search_path = public as $$
  select p_doc.vendedor_id = auth.uid() or tem_permissao('ver_todas')
$$;

create or replace function public.anular_documento(p_id bigint, p_motivo text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_d documentos; v_it record; v_nota text;
begin
  perform exigir('anular');
  select * into v_d from documentos where id = p_id for update;
  if not found then perform _erro('Documento não encontrado.'); end if;
  if v_d.estado <> 'emitida' then perform _erro('Este documento já não está ativo (anulado ou convertido).'); end if;
  if v_d.tipo <> 'PP' then
    for v_it in select i.produto_id, i.qtd from documento_itens i join produtos p on p.id = i.produto_id
                 where i.documento_id = p_id and p.tipo = 'produto' loop
      perform _mover(v_it.produto_id, 'entrada', v_it.qtd, 'Documento anulado', _ref(v_d.tipo, v_d.numero));
    end loop;
  end if;
  v_nota := case when trim(coalesce(p_motivo, '')) <> '' then 'ANULADA: ' || trim(p_motivo) else 'ANULADA' end;
  update documentos set estado = 'anulada', observacoes = trim(both E'\n' from observacoes || E'\n' || v_nota) where id = p_id;
  return _doc_json(p_id);
end $$;

create or replace function public.converter_proforma(p_id bigint, p_tipo text, p_forma text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_d documentos; v_novo jsonb;
begin
  perform exigir('vender');
  select * into v_d from documentos where id = p_id for update;
  if not found or v_d.tipo <> 'PP' then perform _erro('Pró-forma não encontrada.'); end if;
  if not _pode_ver(v_d) then perform _erro('Não tem permissão para esta pró-forma.'); end if;
  if v_d.estado <> 'emitida' then perform _erro('Esta pró-forma já foi convertida ou anulada.'); end if;
  if p_tipo not in ('FR', 'FT') then perform _erro('Escolha Fatura-Recibo ou Fatura.'); end if;
  v_novo := registar_documento(jsonb_build_object(
    'tipo', p_tipo, 'forma_pagamento', p_forma, 'cliente_id', v_d.cliente_id, 'desconto', v_d.desconto,
    'origem_id', v_d.id,
    'observacoes', trim(both E'\n' from v_d.observacoes || E'\nReferente à pró-forma ' || _ref('PP', v_d.numero)),
    'itens', (select jsonb_agg(jsonb_build_object('produto_id', produto_id, 'descricao', descricao, 'qtd', qtd, 'preco_unit', preco_unit) order by id)
              from documento_itens where documento_id = p_id)));
  update documentos set estado = 'convertida',
         observacoes = trim(both E'\n' from observacoes || E'\nConvertida em ' || _ref(p_tipo, (v_novo ->> 'numero')::integer))
   where id = p_id;
  return v_novo;
end $$;

create or replace function public.registar_pagamento(p_id bigint, p_forma text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_d documentos;
begin
  perform exigir('vender');
  select * into v_d from documentos where id = p_id for update;
  if not found or v_d.tipo <> 'FT' then perform _erro('Fatura não encontrada.'); end if;
  if not _pode_ver(v_d) then perform _erro('Não tem permissão para esta fatura.'); end if;
  if v_d.estado <> 'emitida' then perform _erro('Fatura anulada.'); end if;
  if v_d.pago then perform _erro('Esta fatura já está paga.'); end if;
  if p_forma is null or not (cfg_valor('formas_pagamento') ? p_forma) then perform _erro('Escolha a forma de pagamento.'); end if;
  update documentos set pago = true, pago_em = now(), forma_pagamento = p_forma where id = p_id;
  return _doc_json(p_id);
end $$;

-- ================================================================ stock e produtos
create or replace function public.movimento_stock(d jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_p produtos; v_tipo text := d ->> 'tipo'; v_qtd integer; v_motivo text;
begin
  perform exigir('stock');
  select * into v_p from produtos where id = (d ->> 'produto_id')::bigint and ativo for update;
  if not found then perform _erro('Escolha o produto.'); end if;
  if v_p.tipo <> 'produto' then perform _erro('Serviços não têm stock.'); end if;
  if v_tipo not in ('entrada', 'saida', 'ajuste') then perform _erro('Escolha entrada, saída ou contagem.'); end if;
  begin v_qtd := (d ->> 'qtd')::integer; exception when others then v_qtd := null; end;
  if v_qtd is null then perform _erro('Indique uma quantidade válida.'); end if;
  if v_qtd < 0 or (v_qtd = 0 and v_tipo <> 'ajuste') then perform _erro('A quantidade tem de ser maior que zero.'); end if;
  if v_tipo = 'saida' and v_qtd > v_p.stock then perform _erro(format('Só há %s em stock de %s.', v_p.stock, v_p.nome)); end if;
  v_motivo := coalesce(nullif(trim(d ->> 'motivo'), ''),
                       case v_tipo when 'entrada' then 'Compra / reposição' when 'saida' then 'Saída manual' else 'Contagem de stock' end);
  perform _mover(v_p.id, v_tipo, v_qtd, v_motivo);
  select * into v_p from produtos where id = v_p.id;
  return to_jsonb(v_p);
end $$;

create or replace function public.contagem_stock(p_itens jsonb, p_motivo text default 'Contagem de stock') returns integer
language plpgsql security definer set search_path = public as $$
declare v_it jsonb; v_n integer := 0; v_p produtos; v_qtd integer;
begin
  perform exigir('stock');
  for v_it in select * from jsonb_array_elements(p_itens) loop
    select * into v_p from produtos where id = (v_it ->> 'produto_id')::bigint and ativo and tipo = 'produto' for update;
    if not found then continue; end if;
    v_qtd := (v_it ->> 'qtd')::integer;
    if v_qtd is null or v_qtd < 0 then perform _erro(format('Quantidade inválida em %s.', v_p.nome)); end if;
    if v_qtd <> v_p.stock then
      perform _mover(v_p.id, 'ajuste', v_qtd, coalesce(nullif(trim(p_motivo), ''), 'Contagem de stock'));
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end $$;

create or replace function public.guardar_produto(d jsonb, p_id bigint default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_nome text := trim(coalesce(d ->> 'nome', ''));
  v_tipo text := coalesce(nullif(d ->> 'tipo', ''), 'produto');
  v_modo text := coalesce(nullif(d ->> 'modo', ''), 'fixo');
  v_seccao text := coalesce(nullif(trim(d ->> 'seccao'), ''), 'Outros');
  v_preco integer; v_min integer; v_tq integer; v_tp integer; v_ini integer;
  v_atual produtos; v_cod text; v_pref text; v_n integer := 1; v_id bigint;
begin
  perform exigir('produtos');
  if v_nome = '' then perform _erro('Indique o nome do produto ou serviço.'); end if;
  if v_tipo not in ('produto', 'servico') then perform _erro('Tipo inválido.'); end if;
  if v_modo not in ('fixo', 'a_partir', 'consulta') then perform _erro('Modo de preço inválido.'); end if;
  begin
    v_preco := coalesce(nullif(d ->> 'preco', '')::integer, 0);
    v_min := coalesce(nullif(d ->> 'stock_min', '')::integer, 0);
    v_tq := nullif(d ->> 'tier_qtd', '')::integer;
    v_tp := nullif(d ->> 'tier_preco', '')::integer;
    v_ini := coalesce(nullif(d ->> 'stock', '')::integer, 0);
  exception when others then perform _erro('Preços e quantidades têm de ser números inteiros (Kz).');
  end;
  if v_preco < 0 or v_min < 0 or v_ini < 0 then perform _erro('Valores não podem ser negativos.'); end if;
  if v_modo <> 'consulta' and v_preco = 0 then perform _erro('Indique o preço em Kz (ou escolha ''por consulta'').'); end if;
  if (v_tq is null) <> (v_tp is null) then perform _erro('Para preço por quantidade, indique a quantidade mínima e o preço.'); end if;
  if v_tipo = 'servico' then v_min := 0; v_ini := 0; end if;

  if p_id is not null then
    select * into v_atual from produtos where id = p_id for update;
    if not found then perform _erro('Produto não encontrado.'); end if;
    if v_atual.tipo = 'produto' and v_tipo = 'servico' and v_atual.stock > 0 then
      perform _erro('Este produto ainda tem stock. Faça uma contagem para 0 antes de o mudar para serviço.');
    end if;
    update produtos set nome = v_nome, descricao = trim(coalesce(d ->> 'descricao', '')), seccao = v_seccao, tipo = v_tipo,
           preco = v_preco, modo = v_modo, tier_qtd = v_tq, tier_preco = v_tp, stock_min = v_min where id = p_id;
    v_id := p_id;
  else
    v_pref := coalesce((select e ->> 0 from jsonb_array_elements(cfg_valor('seccoes_cod')) e where e ->> 1 = v_seccao), 'GK');
    while exists (select 1 from produtos where codigo = v_pref || lpad(v_n::text, 2, '0')) loop v_n := v_n + 1; end loop;
    v_cod := v_pref || lpad(v_n::text, 2, '0');
    insert into produtos (codigo, nome, descricao, seccao, tipo, preco, modo, tier_qtd, tier_preco, stock_min)
    values (v_cod, v_nome, trim(coalesce(d ->> 'descricao', '')), v_seccao, v_tipo, v_preco, v_modo, v_tq, v_tp, v_min)
    returning id into v_id;
    if v_ini > 0 then perform _mover(v_id, 'entrada', v_ini, 'Stock inicial'); end if;
  end if;
  return (select to_jsonb(p) from produtos p where id = v_id);
end $$;

create or replace function public.remover_produto(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform exigir('produtos');
  update produtos set ativo = false where id = p_id;
end $$;

-- ================================================================ clientes
create or replace function public.guardar_cliente(d jsonb, p_id bigint default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_eu perfis := exigir('vender');
  v_nome text := trim(coalesce(d ->> 'nome', ''));
  v_nif text := trim(coalesce(d ->> 'nif', ''));
  v_igual text; v_id bigint;
begin
  if v_nome = '' then perform _erro('Indique o nome do cliente.'); end if;
  if v_nif <> '' then
    select nome into v_igual from clientes where ativo and nif = v_nif and id is distinct from p_id limit 1;
    if v_igual is not null then perform _erro(format('Já existe um cliente com o NIF %s: %s.', v_nif, v_igual)); end if;
  end if;
  if p_id is not null then
    update clientes set nome = v_nome, nif = v_nif, endereco = trim(coalesce(d ->> 'endereco', '')),
           telefone = trim(coalesce(d ->> 'telefone', '')) where id = p_id and ativo returning id into v_id;
    if v_id is null then perform _erro('Cliente não encontrado.'); end if;
  else
    insert into clientes (nome, nif, endereco, telefone, criado_por)
    values (v_nome, v_nif, trim(coalesce(d ->> 'endereco', '')), trim(coalesce(d ->> 'telefone', '')), v_eu.id)
    returning id into v_id;
  end if;
  return (select to_jsonb(c) from clientes c where id = v_id);
end $$;

create or replace function public.remover_cliente(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform exigir('admin');
  update clientes set ativo = false where id = p_id;
end $$;

-- ================================================================ configuração
create or replace function public.guardarcfg_valor(d jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_k text; v_n integer; v_maior integer;
begin
  perform exigir('admin');
  if d ? 'empresa' then
    update config set valor = valor || (d -> 'empresa') where chave = 'empresa';
  end if;
  if d ? 'numeracao' then
    for v_k in select jsonb_object_keys(d -> 'numeracao') loop
      if v_k not in ('FR', 'FT', 'PP') then continue; end if;
      v_n := (d -> 'numeracao' ->> v_k)::integer;
      select coalesce(max(numero), 0) into v_maior from documentos where tipo = v_k;
      if v_n is null or v_n <= v_maior then
        perform _erro(format('O próximo número de %s tem de ser maior que %s.', v_k, lpad(v_maior::text, 4, '0')));
      end if;
      update config set valor = jsonb_set(valor, array[v_k], to_jsonb(v_n)) where chave = 'numeracao';
    end loop;
  end if;
  if d ? 'validade_proforma' then
    v_n := (d ->> 'validade_proforma')::integer;
    if v_n is null or v_n < 1 or v_n > 365 then perform _erro('Validade da pró-forma entre 1 e 365 dias.'); end if;
    insert into config values ('validade_proforma', to_jsonb(v_n)) on conflict (chave) do update set valor = excluded.valor;
  end if;
  return (select jsonb_object_agg(chave, valor) from config);
end $$;

-- ================================================================ leitura: tudo o que este utilizador pode ver
create or replace function public.estado() returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare v_eu perfis; v_perm jsonb;
begin
  select * into v_eu from perfis where id = auth.uid() and ativo;
  if not found then raise exception 'Sessão inválida. Entre novamente.'; end if;
  select jsonb_object_agg(k, tem_permissao(k)) into v_perm
    from unnest(array['vender', 'ver_todas', 'anular', 'produtos', 'stock', 'relatorios', 'admin']) k;
  return jsonb_build_object(
    'eu', jsonb_build_object('id', v_eu.id, 'nome', v_eu.nome, 'utilizador', v_eu.utilizador, 'papel', v_eu.papel, 'perm', v_perm),
    'config', (select jsonb_object_agg(chave, valor) from config),
    'produtos', coalesce((select jsonb_agg(to_jsonb(p) order by p.codigo) from produtos p where p.ativo), '[]'::jsonb),
    'clientes', coalesce((select jsonb_agg(to_jsonb(c) - 'criado_em' order by c.nome) from clientes c where c.ativo), '[]'::jsonb),
    'faturas', coalesce((select jsonb_agg(_doc_json(d.id) order by d.data desc) from documentos d), '[]'::jsonb),
    'movimentos', coalesce((select jsonb_agg(to_jsonb(m) - 'data' || jsonb_build_object(
                     'data', to_char(m.data at time zone 'Africa/Luanda', 'YYYY-MM-DD"T"HH24:MI:SS')) order by m.data desc, m.id desc)
                   from movimentos m), '[]'::jsonb),
    'utilizadores', coalesce((select jsonb_agg(to_jsonb(u) order by u.nome) from perfis u), '[]'::jsonb)
  );
end $$;

-- Para o ecrã de entrada: diz se ainda falta criar o primeiro administrador.
create or replace function public.precisa_configurar() returns boolean
language sql stable security definer set search_path = public as $$ select not exists (select 1 from perfis) $$;

-- ================================================================ acessos às funções
revoke execute on function public._erro(text), public._mover(bigint, text, integer, text, text), public.cfg_valor(text),
  public._pode_ver(documentos), public.exigir(text) from public, anon, authenticated;
revoke execute on function public._doc_json(bigint) from public, anon;
grant execute on function public._doc_json(bigint) to authenticated;
revoke execute on function public.registar_documento(jsonb), public.anular_documento(bigint, text),
  public.converter_proforma(bigint, text, text), public.registar_pagamento(bigint, text), public.movimento_stock(jsonb),
  public.contagem_stock(jsonb, text), public.guardar_produto(jsonb, bigint), public.remover_produto(bigint),
  public.guardar_cliente(jsonb, bigint), public.remover_cliente(bigint), public.guardarcfg_valor(jsonb), public.estado()
  from public, anon;
grant execute on function public.registar_documento(jsonb), public.anular_documento(bigint, text),
  public.converter_proforma(bigint, text, text), public.registar_pagamento(bigint, text), public.movimento_stock(jsonb),
  public.contagem_stock(jsonb, text), public.guardar_produto(jsonb, bigint), public.remover_produto(bigint),
  public.guardar_cliente(jsonb, bigint), public.remover_cliente(bigint), public.guardarcfg_valor(jsonb), public.estado()
  to authenticated;
grant execute on function public.precisa_configurar() to anon, authenticated;

-- ================================================================ sincronização em tempo real
do $$
declare t text;
begin
  foreach t in array array['produtos', 'clientes', 'documentos', 'movimentos', 'config', 'perfis'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ================================================================ endurecer
alter function public._erro(text) set search_path = public;
alter function public._ref(text, integer) set search_path = public;
revoke execute on function public.ativo(), public.tem_permissao(text) from public, anon;
grant execute on function public.ativo(), public.tem_permissao(text) to authenticated;

-- ================================================================ configuração inicial (primeiro administrador)
-- O código de uso único fica só como impressão digital (sha256) numa tabela fora da API.
-- Para gerar um novo:  insert into privado.segredos values ('codigo_configuracao', encode(sha256(convert_to('KMB-....', 'UTF8')), 'hex'));
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
create table if not exists privado.segredos (chave text primary key, valor text not null);

create or replace function public.validar_codigo_configuracao(p_codigo text) returns boolean
language sql stable security definer set search_path = public, privado as $$
  select not exists (select 1 from public.perfis)
     and exists (select 1 from privado.segredos where chave = 'codigo_configuracao'
                 and valor = encode(sha256(convert_to(coalesce(p_codigo, ''), 'UTF8')), 'hex'))
$$;
create or replace function public.concluir_configuracao() returns void
language sql security definer set search_path = public, privado as $$
  delete from privado.segredos where chave = 'codigo_configuracao'
$$;
revoke execute on function public.validar_codigo_configuracao(text), public.concluir_configuracao() from public, anon, authenticated;
grant execute on function public.validar_codigo_configuracao(text), public.concluir_configuracao() to service_role;
