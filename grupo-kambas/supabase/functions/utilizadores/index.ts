// Grupo Kambas — gestão de utilizadores (Supabase Edge Function).
// Criar contas precisa da chave de serviço, que nunca vai para o telemóvel;
// por isso estas operações passam por aqui.
//
// Ações (POST JSON):
//   { acao: "configurar", codigo, nome, utilizador, senha }  -> primeiro administrador (código de uso único)
//   { acao: "criar", nome, utilizador, senha, papel, permissoes }   -> só administradores
//   { acao: "atualizar", id, nome, papel, permissoes, ativo, senha? } -> só administradores
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DOMINIO = "utilizadores.grupokambas.local";
const EXTRAS = ["ver_todas", "anular", "produtos", "stock", "relatorios"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const resposta = (corpo: unknown, estado = 200) =>
  new Response(JSON.stringify(corpo), { status: estado, headers: { ...CORS, "Content-Type": "application/json" } });
const erro = (msg: string, estado = 400) => resposta({ erro: msg }, estado);

const admin = createClient(URL, SERVICO, { auth: { autoRefreshToken: false, persistSession: false } });

function limparUtilizador(u: unknown) {
  const v = String(u ?? "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(v)) throw new Error("Utilizador: 3 a 30 letras minúsculas, números, ponto, hífen ou _ (sem espaços).");
  return v;
}
function limparSenha(s: unknown) {
  const v = String(s ?? "");
  if (v.length < 6) throw new Error("A senha precisa de pelo menos 6 caracteres.");
  return v;
}
function limparNome(n: unknown) {
  const v = String(n ?? "").trim();
  if (!v) throw new Error("Indique o nome (aparece nas faturas).");
  return v.slice(0, 80);
}
function limparPermissoes(p: unknown) {
  const out: Record<string, boolean> = {};
  if (p && typeof p === "object") for (const k of EXTRAS) out[k] = Boolean((p as Record<string, unknown>)[k]);
  return out;
}

async function criarConta(nome: string, utilizador: string, senha: string, papel: string, permissoes: Record<string, boolean>) {
  const { data: existe } = await admin.from("perfis").select("id").eq("utilizador", utilizador).maybeSingle();
  if (existe) throw new Error(`O utilizador "${utilizador}" já existe.`);
  const { data, error } = await admin.auth.admin.createUser({
    email: `${utilizador}@${DOMINIO}`, password: senha, email_confirm: true, user_metadata: { nome },
  });
  if (error || !data.user) throw new Error(error?.message?.includes("already") ? `O utilizador "${utilizador}" já existe.` : `Não foi possível criar a conta: ${error?.message}`);
  const { error: e2 } = await admin.from("perfis").insert({ id: data.user.id, nome, utilizador, papel, permissoes });
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(`Não foi possível guardar o perfil: ${e2.message}`);
  }
  return data.user.id;
}

async function quemChama(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  if (!data.user) return null;
  const { data: perfil } = await admin.from("perfis").select("*").eq("id", data.user.id).eq("ativo", true).maybeSingle();
  return perfil;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return erro("Método não suportado.", 405);
  let d: Record<string, unknown>;
  try { d = await req.json(); } catch { return erro("Pedido inválido."); }

  try {
    if (d.acao === "configurar") {
      const { data: ok, error } = await admin.rpc("validar_codigo_configuracao", { p_codigo: String(d.codigo ?? "").trim().toUpperCase() });
      if (error) throw new Error(error.message);
      if (!ok) return erro("Código de configuração inválido, ou o sistema já tem administrador.", 403);
      const id = await criarConta(limparNome(d.nome), limparUtilizador(d.utilizador), limparSenha(d.senha), "admin", {});
      await admin.rpc("concluir_configuracao");
      return resposta({ ok: true, id });
    }

    const eu = await quemChama(req);
    if (!eu) return erro("Sessão inválida. Entre novamente.", 401);
    if (eu.papel !== "admin") return erro("Só o administrador pode gerir utilizadores.", 403);

    if (d.acao === "criar") {
      const papel = d.papel === "admin" ? "admin" : "vendedor";
      const id = await criarConta(limparNome(d.nome), limparUtilizador(d.utilizador), limparSenha(d.senha), papel,
        papel === "admin" ? {} : limparPermissoes(d.permissoes));
      return resposta({ ok: true, id });
    }

    if (d.acao === "atualizar") {
      const id = String(d.id ?? "");
      const { data: alvo } = await admin.from("perfis").select("*").eq("id", id).maybeSingle();
      if (!alvo) return erro("Utilizador não encontrado.", 404);
      const papel = d.papel === "admin" ? "admin" : "vendedor";
      const ativo = d.ativo !== false;
      if (alvo.papel === "admin" && (papel !== "admin" || !ativo)) {
        const { count } = await admin.from("perfis").select("id", { count: "exact", head: true }).eq("papel", "admin").eq("ativo", true);
        if ((count ?? 0) <= 1) return erro("Tem de existir pelo menos um administrador ativo.");
      }
      const mudar = { nome: limparNome(d.nome), papel, ativo, permissoes: papel === "admin" ? {} : limparPermissoes(d.permissoes) };
      const { error } = await admin.from("perfis").update(mudar).eq("id", id);
      if (error) throw new Error(error.message);
      const auth: Record<string, unknown> = { ban_duration: ativo ? "none" : "876000h" };
      if (d.senha) auth.password = limparSenha(d.senha);
      const { error: e2 } = await admin.auth.admin.updateUserById(id, auth);
      if (e2) throw new Error(e2.message);
      return resposta({ ok: true });
    }

    return erro("Ação desconhecida.");
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e));
  }
});
