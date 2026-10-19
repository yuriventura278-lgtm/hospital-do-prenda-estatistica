"""Um flyer por serviço do Grupo Kambas (redes sociais 1080×1350 e lona 58×100 cm).

    python3 gerar_por_servico.py            → por-servico/<serviço>.html e por-servico/<serviço>-lona.html
    python3 gerar_por_servico.py exportar   → também PNG (redes sociais) e PDF CMYK (lona)

Preços: tirados do sistema (Supabase) em 19/10/2026. Para atualizar, mude a lista SERV abaixo.
"""
import pathlib, sys
from gerar_servicos import I, ic, LOGO

AQUI = pathlib.Path(__file__).resolve().parent
OUT = AQUI / "por-servico"; OUT.mkdir(exist_ok=True)
kz = lambda v: f"{v:,}".replace(",", ".") + " Kz"
def desde(v): return f"<i>desde</i> {kz(v)}"
G = lambda t: ("grupo", t)   # título de grupo dentro da lista

# slug, ícone, cor, categoria, título (pode ter <br>), frase, destaque, linhas [(nome, nota, preço)] ou ("lista", [..])
SERV = [
 ("grafica", "print", "#0192B8", "Comunicação visual", "Gráfica &<br>Impressão", "Dê visibilidade à sua marca com impressão de qualidade profissional.", "Qualidade profissional", [
   ("Roll up 200 × 80 cm", "Com estrutura", kz(26999)), ("Lona 1 × 1 m", "", kz(4999)), ("Vinil 1 × 1 m", "", kz(4999)),
   ("Cartão de visita — 50 un.", "", kz(6999)), ("Cartão de visita — 100 un.", "", kz(10999)), ("Impressão de capa dura", "", kz(6999)),
   ("Agendas personalizadas", "", kz(5999)), ("Banners publicitários", "Impressão conforme a medida", "Sob medida")]),
 ("vestuario-brindes", "shirt", "#E8562A", "Personalização", "Vestuário<br>& Brindes", "Roupa e brindes com a sua marca — para equipas, eventos e ofertas.", "Com o seu logótipo", [
   ("T-shirt BUK Nova", "", kz(2999)), ("T-shirt BUK Max", "", kz(3799)), ("T-shirt BUK Max Walk original", "", kz(6599)),
   ("Lacoste (polo)", "", kz(6999)), ("Boné personalizado", "", kz(2999)), ("Chaves personalizadas", "", kz(3999)),
   ("Esferográfica personalizada", "", kz(2999)), ("Coletes multiuso / multibolso", "Com ou sem refletor", desde(12999)),
   ("Garrafa térmica personalizada", "Com o seu material: 3.999 Kz", kz(8999)), ("Carteira personalizada", "Com o seu material: 3.999 Kz", kz(5999)),
   ("Sacolas com o seu logótipo", "A5, A4 e A3 — 50 ou 100 un.", desde(8999))]),
 ("bordados", "linha", "#A8206F", "Bordado profissional", "Bordados", "Bordado resistente e elegante em vestuário, coletes, bonés e emblemas.", "Com o seu material ou o nosso", [
   ("T-shirt BUK Max original bordada", "Com o nosso material", kz(9999)), ("T-shirt bordada", "Com o seu material", kz(5999)),
   ("Batas bordadas", "Com o seu material", kz(5999)), ("Lacoste (polo) bordada", "Mais de 10 un.: 10.999 Kz", kz(11999)),
   ("Boné / chapéu bordado", "Mais de 10 un.: 6.999 Kz", kz(8999)), ("Colete multibolso c/ refletor", "Com o seu material: 10.999 Kz", kz(29999)),
   ("Colete sem refletor bordado", "Com o seu material: 9.999 Kz", kz(27999)), ("Emblemas já criados", "Para qualquer peça", kz(3999)),
   ("Criação de emblema", "", kz(5999)), ("Camisola bordada", "Conforme o modelo", "Sob consulta")]),
 ("carimbos-crachas", "carimbo", "#1D66C2", "Identificação", "Carimbos<br>& Crachás", "Carimbos, cartões e crachás para a sua empresa ou instituição.", "Feitos à medida", [
   ("Carimbo de bolso", "", kz(13999)), ("Carimbo automático", "Vários tamanhos", desde(10299)), ("Borracha para carimbo", "Substituição de placa", kz(5999)),
   ("Pass PVC", "Cartão de identificação", kz(1999)), ("Crachá personalizado a laser", "Mais de 1 un.: 4.599 Kz cada", kz(5999))]),
 ("quadros-polaroid", "quadro", "#D99A00", "Recordações", "Quadros<br>& Polaroid", "Transforme as suas fotos em quadros e recordações para guardar ou oferecer.", "Quadros em 24 horas", [
   G("Quadros digitais personalizados"), ("Quadro A6", "", kz(2999)), ("Quadro A5", "", kz(4999)), ("Quadro A4", "", kz(5999)), ("Quadro A3", "", kz(8999)),
   ("Quadro A2", "", kz(15999)), ("Quadro A1", "", kz(25999)), ("Quadro A0", "", kz(59999)),
   G("Foto Polaroid (conjunto completo)"), ("5 fotos", "", kz(1299)), ("10 fotos", "", kz(1999)), ("20 fotos", "", kz(4999)), ("50 fotos", "", kz(9999))]),
 ("design", "design", "#7A3FD0", "Criação", "Design<br>gráfico", "Uma imagem profissional que faz os clientes lembrarem-se de si.", "Entrega rápida", [
   ("Criação de flyer", "Para redes sociais ou impressão", kz(4999)), ("Criação de logótipo", "", desde(4999)),
   ("Identidade visual", "Manual de marca completo", kz(10999)),
   ("lista", ["Cartões de visita, roll ups e lonas", "Publicações para redes sociais", "Ficheiros prontos para a gráfica"])]),
 ("sistemas-websites", "sistema", "#0B6A80", "Tecnologia", "Sistemas<br>& Websites", "O seu negócio organizado: faturas, stock e vendas no telemóvel e no computador.", "Funciona sem internet", [
   ("Sistema de faturação", "Para estabelecimentos comerciais", desde(39999)), ("Sistema de gestão de stock", "Para empresas", desde(40999)),
   ("Criação de website", "", desde(39999)),
   ("lista", ["Faturas-recibo, faturas e pró-formas", "Stock, clientes e relatórios em PDF", "Android, iPhone, Windows e online", "Vários vendedores, tudo sincronizado"])]),
 ("trafego-pago", "megafone", "#D42236", "Marketing digital", "Tráfego<br>pago", "Leve o seu negócio a mais clientes com campanhas nas redes sociais.", "Mais clientes", [
   ("1 dia", "Campanha nas redes sociais", kz(2999)), ("3 dias", "", kz(7999)), ("4 dias", "", kz(9999)), ("5 dias", "", kz(11999)),
   ("1 semana", "", kz(15999)), ("1 mês", "O mais completo", kz(40999))]),
 ("importacao-cambio", "aviao", "#1E8A5A", "Negócios", "Importação<br>& Câmbio", "Compre na China e nos EUA, troque dólares e aprenda a importar.", "Acompanhamento", [
   ("Importação de produtos", "China e Estados Unidos", "Sob consulta"), ("Venda de dólares", "Câmbio do dia", "Câmbio do dia"),
   ("Abertura de conta VISA", "", kz(19999)), ("Formação: conta VISA", "", kz(29999)), ("Formação para importação", "", kz(29999))]),
 ("electrodomesticos", "frigo", "#3A7CA5", "Casa & escritório", "Electro&shy;domésticos", "Electrodomésticos para a sua casa e para o seu escritório.", "Pagamento fácil", [
   ("lista", ["Para a casa e para o escritório", "Peça o preço por WhatsApp", "Pagamento por transferência, TPA ou numerário", "Fatura-recibo oficial"])]),
 ("cctv-seguranca", "camara", "#2F4858", "Segurança", "CCTV &<br>Segurança", "Proteja a sua casa ou o seu negócio com câmaras de vigilância.", "Mais tranquilidade", [
   ("lista", ["Câmaras de vigilância (CCTV)", "Para casas, lojas e escritórios", "Peça o seu orçamento por WhatsApp", "Fatura-recibo oficial"])]),
 ("papelaria", "lapis", "#C2410C", "Escola & escritório", "Papelaria", "Papéis e material de papelaria para a escola e para o escritório.", "Preço por folha", [
   ("Cartolina dura A4", "Por folha", kz(599)), ("Cartolina normal A4", "Por folha", kz(499)), ("Papel couché A4", "Por folha", kz(499)),
   ("Papel colante A4", "Por folha", kz(1999)), ("lista", ["Mais material de papelaria: peça o preço por WhatsApp"])]),
]

def linhas_html(linhas):
    h = []
    for l in linhas:
        if l[0] == "grupo": h.append(f'<div class="gr">{l[1]}</div>')
        elif l[0] == "lista": h.append('<ul class="ls">' + "".join(f'<li>{ic(I["check"])}{x}</li>' for x in l[1]) + "</ul>")
        else:
            n, d, p = l
            h.append(f'<div class="ln"><div><b>{n}</b>{f"<small>{d}</small>" if d else ""}</div><span class="pr">{p}</span></div>')
    return "".join(h)

I["check"] = '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
I["recibo"] = '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'
I["chat"] = '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>'
I["estrela"] = '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'

def pagina(s, lona):
    slug, ico, cor, cat, tit, frase, dest, linhas = s
    n = sum(1 for l in linhas if l[0] not in ("grupo", "lista")) + sum(len(l[1]) * 0.8 for l in linhas if l[0] == "lista") + 0.7 * sum(1 for l in linhas if l[0] == "grupo")
    k = 1.42 if lona else 1.0
    W, H = (1240, 2080) if lona else (1080, 1350)
    pad = (110, 110) if lona else (60, 70)
    z = lambda v: f"{round(v * k, 1)}px"
    zl = lambda v: f"calc({round(v * k, 2)}px * var(--d))"
    css = f'''{"@page{size:620mm 1040mm;margin:0}" if lona else ""}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{W}px;height:{H}px}}
body{{font-family:"Source Sans 3",sans-serif;color:#fff;background:#072A35;overflow:hidden}}
.f{{position:relative;width:{W}px;height:{H}px;overflow:hidden;padding:{pad[0]}px {pad[1]}px {z(lona and 270 or 196)};--c:{cor};--d:1;display:flex;flex-direction:column;
 background:radial-gradient(75% 40% at 100% 0%,color-mix(in srgb,var(--c) 70%,#1AA6C9) 0%,transparent 62%),radial-gradient(70% 40% at 0% 75%,#0F7F9C 0%,transparent 70%),linear-gradient(170deg,#072A35 0%,#0A3D4C 45%,#0B5466 100%)}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.08) {z(1.4)},transparent {z(1.7)});background-size:{z(28)} {z(28)};-webkit-mask-image:linear-gradient(180deg,#000 0%,transparent 40%)}}
.ring{{position:absolute;border-radius:50%;border:{z(2)} solid rgba(255,255,255,.12)}}
.r1{{width:{z(760)};height:{z(760)};right:{z(-320)};top:{z(-300)}}} .r2{{width:{z(520)};height:{z(520)};right:{z(-200)};top:{z(-170)}}}
.top{{position:relative;display:flex;align-items:center;justify-content:space-between}}
.top img{{width:{z(130)}}}
.pill{{display:flex;align-items:center;gap:{z(10)};padding:{z(11)} {z(20)};border-radius:99px;background:rgba(255,255,255,.12);border:{z(1.5)} solid rgba(255,255,255,.25);font:800 {z(19)} Archivo;letter-spacing:.1em;text-transform:uppercase}}
.pill svg{{width:{z(22)};height:{z(22)};color:#FFD34D}}
.hero{{position:relative;display:flex;align-items:center;gap:{z(26)};margin-top:{z(lona and 54 or 34)}}}
.ico{{width:{z(118)};height:{z(118)};flex:none;border-radius:{z(34)};display:grid;place-items:center;background:var(--c);color:#fff;box-shadow:0 {z(16)} {z(36)} rgba(0,0,0,.35),inset 0 0 0 {z(2)} rgba(255,255,255,.25)}}
.ico svg{{width:{z(64)};height:{z(64)}}}
.eyebrow{{font:800 {z(19)} Archivo;letter-spacing:.24em;text-transform:uppercase;color:#9FE4F5}}
h1{{font:900 {z(86)}/0.9 Archivo;font-stretch:78%;letter-spacing:-.015em;margin-top:{z(8)};hyphens:manual}}
.sub{{position:relative;margin-top:{z(20)};font-size:{z(26)};line-height:1.3;color:#D4ECF2;max-width:{z(900)}}}
.card{{position:relative;margin-top:{z(26)};background:#fff;color:#0F2E3A;border-radius:{z(26)};padding:{zl(10)} {z(26)} {zl(12)};box-shadow:0 {z(20)} {z(44)} rgba(2,20,26,.35);border-top:{z(8)} solid var(--c)}}
.ln{{display:flex;align-items:center;justify-content:space-between;gap:{z(16)};padding:{zl(11)} 0;border-bottom:{z(1.5)} dashed #D6E6EC}}
.ln:last-child{{border-bottom:0}}
.ln b{{display:block;font:800 {zl(23)}/1.12 "Source Sans 3"}}
.ln small{{display:block;font-size:{zl(16.5)};font-weight:600;color:#6B8792;margin-top:{z(1)}}}
.pr{{flex:none;font:900 {zl(29)} Archivo;font-stretch:85%;color:var(--c);white-space:nowrap;text-align:right}}
.pr i{{font:700 {zl(15)} "Source Sans 3";font-style:normal;color:#6B8792;margin-right:{z(4)}}}
.gr{{margin-top:{zl(12)};padding:{zl(8)} {z(12)};border-radius:{z(10)};background:color-mix(in srgb,var(--c) 12%,#fff);color:color-mix(in srgb,var(--c) 75%,#000);font:800 {zl(17)} Archivo;letter-spacing:.12em;text-transform:uppercase}}
.ls{{list-style:none;padding:{zl(10)} 0 {zl(4)};display:flex;flex-direction:column;gap:{zl(10)}}}
.ls li{{display:flex;align-items:center;gap:{z(12)};font-size:{zl(24)};font-weight:700}}
.ls svg{{width:{zl(30)};height:{zl(30)};flex:none;padding:{z(5)};border-radius:50%;background:var(--c);color:#fff;stroke-width:3}}
.chips{{position:relative;display:flex;gap:{z(12)};margin-top:auto;padding-top:{z(22)}}}
.chips span{{flex:1;display:flex;align-items:center;gap:{z(10)};padding:{z(12)} {z(14)};border-radius:{z(16)};background:rgba(255,255,255,.1);border:{z(1.5)} solid rgba(255,255,255,.2);font-size:{z(18)};font-weight:700;line-height:1.15}}
.chips svg{{width:{z(28)};height:{z(28)};flex:none;color:#9FE4F5}}
.pe{{position:absolute;left:0;right:0;bottom:0;padding:{z(22)} {pad[1]}px {"110px" if lona else z(26)};background:#fff;color:#0F2E3A;display:flex;align-items:center;justify-content:space-between;gap:{z(20)}}}
.pe:before{{content:"";position:absolute;left:0;right:0;top:{z(-36)};height:{z(36)};background:#fff;clip-path:polygon(0 100%,100% 0,100% 100%)}}
.cta{{display:flex;align-items:center;gap:{z(18)}}}
.ci{{width:{z(70)};height:{z(70)};flex:none;border-radius:{z(22)};background:linear-gradient(140deg,#0B6A80,#0192B8);display:grid;place-items:center;color:#fff}}
.ci svg{{width:{z(34)};height:{z(34)}}}
.cta small{{display:block;white-space:nowrap;font:800 {z(17)} Archivo;letter-spacing:.18em;text-transform:uppercase;color:#0B6A80}}
.cta b{{display:block;white-space:nowrap;font:900 {z(54)}/1.04 Archivo;font-stretch:85%}}
.soc{{text-align:right;white-space:nowrap;font-size:{z(20)};font-weight:700;color:#4E6B76;line-height:1.5}}
.soc b{{color:#0F2E3A}}
.soc .sl{{margin-top:{z(6)};font:800 {z(15)} Archivo;letter-spacing:.2em;text-transform:uppercase;color:#0192B8}}
'''
    corpo = f'''<div class="f"><div class="dots"></div><div class="ring r1"></div><div class="ring r2"></div>
<div class="top"><img src="{LOGO}" alt="Grupo Kambas"><span class="pill">{ic(I["estrela"])}{dest}</span></div>
<div class="hero"><span class="ico">{ic(I[ico])}</span><div><div class="eyebrow">{cat}</div><h1>{tit}</h1></div></div>
<p class="sub">{frase}</p>
<div class="card">{linhas_html(linhas)}</div>
<div class="chips"><span>{ic(I["recibo"])}Fatura-recibo oficial</span><span>{ic(I["chat"])}Encomendas por WhatsApp</span><span>{ic(I["check"])}Transferência, TPA ou numerário</span></div>
<div class="pe"><div class="cta"><span class="ci">{ic(I["tel"])}</span><div><small>Ligue ou WhatsApp</small><b>951 332 741</b></div></div>
<div class="soc">Facebook <b>Grupo Kambas</b><br>TikTok <b>@grupo.kambas</b><div class="sl">Crescendo juntos sempre!</div></div></div>
</div>'''
    return f'''<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>{tit.replace("<br>", " ").replace("&shy;", "")} — Grupo Kambas</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Source+Sans+3:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>{css}</style></head><body>{corpo}
<script>
/* ajusta o tamanho das linhas da tabela ao espaço livre (maior tamanho que cabe) */
document.fonts.ready.then(() => {{
  const f = document.querySelector(".f"), card = document.querySelector(".card"), chips = document.querySelector(".chips");
  const folga = {round(34 * k)};
  const cabe = () => chips.getBoundingClientRect().top - card.getBoundingClientRect().bottom >= folga;
  let lo = 0.5, hi = 2.3;
  for (let i = 0; i < 16; i++) {{ const m = (lo + hi) / 2; f.style.setProperty("--d", m); if (cabe()) lo = m; else hi = m; }}
  f.style.setProperty("--d", lo); document.body.dataset.pronto = "1";
}});
</script></body></html>'''

if __name__ == "__main__":
    for s in SERV:
        (OUT / f"{s[0]}.html").write_text(pagina(s, False))
        (OUT / f"{s[0]}-lona.html").write_text(pagina(s, True))
    print(len(SERV), "serviços gerados em", OUT)
    if sys.argv[1:] == ["exportar"]:
        import os
        from exportar import social, lona
        os.chdir(OUT)
        for s in SERV:
            social(f"{s[0]}.html", f"GrupoKambas-{s[0]}")
            lona(f"{s[0]}-lona.html", f"GrupoKambas-{s[0]}-Lona-58x100cm", tif=False)
