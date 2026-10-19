"""Gera o flyer com todos os serviços do Grupo Kambas (redes sociais 1080×1350 e lona 58×100 cm).

    python3 gerar_servicos.py   →  flyer-servicos.html  e  flyer-servicos-lona-58x100.html
Depois exportar com exportar.py (social / lona).
"""
import base64, pathlib
AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent

def uri(p):
    p = pathlib.Path(p); d = base64.b64encode(p.read_bytes()).decode()
    return ("data:image/svg+xml;base64," if p.suffix == ".svg" else "data:image/png;base64,") + d

LOGO = uri(RAIZ / "static" / "logo_branco.png")
def ic(path): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">{path}</svg>'

I = {
 "print": '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
 "shirt": '<path d="M8 3 3 6l2 5 2.5-1V21h9V10L19 11l2-5-5-3a4 4 0 0 1-8 0z"/>',
 "linha": '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 15l.8 1.8 1.7.7-1.7.7L19 20l-.8-1.8-1.7-.7 1.7-.7z"/>',
 "carimbo": '<path d="M5 21h14"/><path d="M6 17h12v-2.5a2 2 0 0 0-2-2h-2.5V9a1.5 1.5 0 1 0-3 0v3.5H8a2 2 0 0 0-2 2z"/><circle cx="12" cy="5" r="2.5"/>',
 "quadro": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-4 4 3 3-2 6 5"/>',
 "design": '<path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
 "sistema": '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 13V10M11 13V7M15 13V9"/>',
 "megafone": '<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13"/>',
 "aviao": '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
 "frigo": '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M9 5v2M9 13v3"/>',
 "camara": '<path d="M2 8l14 4-1.5 4.5L1 12.5z"/><path d="M16 12l4-1v6l-4-1"/><path d="M6 14.5V20H3"/>',
 "lapis": '<path d="M17 3l4 4L8 20H4v-4z"/><path d="M14 6l4 4"/>',
 "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 "tel": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
}
# (ícone, título, exemplos, cor)
SERVICOS = [
 ("print", "Gráfica & Impressão", "Roll up, banners, lonas, vinil, cartões de visita", "#0192B8"),
 ("shirt", "Vestuário & Brindes", "T-shirts, polos, bonés, garrafas, sacolas", "#E8562A"),
 ("linha", "Bordados", "Batas, coletes, bonés e emblemas", "#A8206F"),
 ("carimbo", "Carimbos & Crachás", "Carimbos, Pass PVC, crachás a laser", "#1D66C2"),
 ("quadro", "Quadros & Polaroid", "Quadros A6 a A0 em 24 h, fotos Polaroid", "#D99A00"),
 ("design", "Design gráfico", "Logótipos, flyers, identidade visual", "#7A3FD0"),
 ("sistema", "Sistemas & Websites", "Faturação, gestão de stock, websites", "#0B6A80"),
 ("megafone", "Tráfego pago", "Campanhas nas redes sociais", "#D42236"),
 ("aviao", "Importação & Câmbio", "China e EUA, dólares, conta VISA", "#1E8A5A"),
 ("frigo", "Electro&shy;domésticos", "Para a casa e para o escritório", "#3A7CA5"),
 ("camara", "CCTV & Segurança", "Câmaras, instalação e vigilância", "#2F4858"),
 ("lapis", "Papelaria", "Cartolina, couché, papel colante A4", "#C2410C"),
]
OPS = ["unitel.svg", "africell.svg", "zap.svg", "dstv.svg", "edel.svg", "epal.png"]
logos_ops = "".join(f'<span class="lg"><img src="{uri(AQUI / "logos" / f)}" alt=""></span>' for f in OPS)
cards = "".join(f'<div class="sv" style="--c:{c}"><span class="si">{ic(I[i])}</span><div><b>{t}</b><small>{d}</small></div></div>' for i, t, d, c in SERVICOS)

CORPO = f'''<div class="f"><div class="dots"></div><div class="ring r1"></div><div class="ring r2"></div>
<div class="top"><img src="{LOGO}" alt="Grupo Kambas"><span class="pill">{ic(I["bolt"])}Tudo num só lugar</span></div>
<div class="eyebrow">Gráfica · Brindes · Digital · Recargas</div>
<h1>Os nossos<em>serviços</em></h1>
<p class="sub">Da impressão ao sistema de faturação: <b>soluções completas</b> para si e para a sua empresa.</p>
<div class="grade">{cards}</div>
<div class="rec"><div class="rt"><span class="si">{ic(I["bolt"])}</span><div><b>Recargas electrónicas</b><small>Saldo, TV, luz e água — na hora</small></div></div><div class="lgs">{logos_ops}</div></div>
<div class="pe"><div class="cta"><span class="ci">{ic(I["tel"])}</span><div><small>Ligue ou WhatsApp</small><b>951 332 741</b><b>949 512 673</b></div></div>
<div class="soc">Facebook <b>Grupo Kambas</b><br>TikTok <b>@grupo.kambas</b><div class="sl">Crescendo juntos sempre!</div></div></div>
</div>'''

def pagina(titulo, W, H, pad, k, extra_page=""):
    """k = escala dos tamanhos (1 = redes sociais)."""
    z = lambda v: f"{round(v * k, 1)}px"
    css = f'''{extra_page}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{W}px;height:{H}px}}
body{{font-family:"Source Sans 3",sans-serif;color:#fff;background:#072A35;overflow:hidden}}
.f{{position:relative;width:{W}px;height:{H}px;overflow:hidden;padding:{pad[0]}px {pad[1]}px 0;
 background:radial-gradient(80% 45% at 100% 0%,#1AA6C9 0%,transparent 62%),radial-gradient(70% 40% at 0% 70%,#0F7F9C 0%,transparent 70%),linear-gradient(170deg,#072A35 0%,#0A3D4C 45%,#0B5466 100%)}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.08) {z(1.4)},transparent {z(1.7)});background-size:{z(28)} {z(28)};-webkit-mask-image:linear-gradient(180deg,#000 0%,transparent 40%)}}
.ring{{position:absolute;border-radius:50%;border:{z(2)} solid rgba(159,228,245,.17)}}
.r1{{width:{z(760)};height:{z(760)};right:{z(-320)};top:{z(-300)}}} .r2{{width:{z(520)};height:{z(520)};right:{z(-200)};top:{z(-170)};border-color:rgba(159,228,245,.11)}}
.top{{position:relative;display:flex;align-items:center;justify-content:space-between}}
.top img{{width:{z(136)}}}
.pill{{display:flex;align-items:center;gap:{z(10)};padding:{z(12)} {z(22)};border-radius:99px;background:rgba(255,255,255,.12);border:{z(1.5)} solid rgba(255,255,255,.25);font:800 {z(20)} Archivo;letter-spacing:.08em;text-transform:uppercase}}
.pill svg{{width:{z(22)};height:{z(22)};color:#FFD34D;fill:#FFD34D}}
.eyebrow{{position:relative;margin-top:{z(30)};font:800 {z(21)} Archivo;letter-spacing:.24em;text-transform:uppercase;color:#8FD3E6}}
h1{{position:relative;font:900 {z(112)}/0.88 Archivo;font-stretch:76%;letter-spacing:-.02em;margin-top:{z(12)}}}
h1 em{{font-style:normal;margin-left:.22em;background:linear-gradient(90deg,#5FD3F5,#9FE4F5 60%,#5BD69A);-webkit-background-clip:text;color:transparent}}
.sub{{position:relative;margin-top:{z(14)};font-size:{z(27)};line-height:1.3;color:#D4ECF2;max-width:{z(900)}}}
.sub b{{color:#fff}}
.grade{{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:{z(12)};margin-top:{z(26)}}}
.sv{{display:flex;align-items:center;gap:{z(12)};padding:{z(14)} {z(14)};border-radius:{z(20)};background:#F4FAFC;color:#0F2E3A;box-shadow:0 {z(12)} {z(28)} rgba(2,20,26,.3);min-height:{z(104)}}}
.si{{width:{z(52)};height:{z(52)};flex:none;border-radius:{z(16)};display:grid;place-items:center;background:var(--c,#0B6A80);color:#fff}}
.si svg{{width:{z(28)};height:{z(28)}}}
.sv b{{display:block;font:800 {z(22)}/1.05 Archivo;font-stretch:88%;color:#0F2E3A;hyphens:manual}}
.sv small{{display:block;margin-top:{z(4)};font-size:{z(16.5)};line-height:1.2;font-weight:600;color:#4E6B76}}
.rec{{position:relative;margin-top:{z(16)};display:flex;align-items:center;gap:{z(18)};padding:{z(14)} {z(16)};border-radius:{z(22)};background:rgba(255,255,255,.1);border:{z(1.5)} solid rgba(255,255,255,.22)}}
.rt{{display:flex;align-items:center;gap:{z(12)};flex:none}}
.rt .si{{background:linear-gradient(140deg,#F5B700,#FFD34D);color:#0F2E3A}}
.rt b{{display:block;font:800 {z(23)}/1.05 Archivo;font-stretch:88%}}
.rt small{{display:block;margin-top:{z(3)};font-size:{z(16.5)};color:#C9E6EE;font-weight:600}}
.lgs{{flex:1;display:grid;grid-template-columns:repeat(6,1fr);gap:{z(8)}}}
.lg{{height:{z(58)};border-radius:{z(12)};background:#fff;display:flex;align-items:center;justify-content:center;padding:{z(6)}}}
.lg img{{max-width:100%;max-height:100%;display:block}}
.pe{{position:absolute;left:0;right:0;bottom:0;padding:{pad[2]}px {pad[1]}px {pad[3]}px;background:#fff;color:#0F2E3A;display:flex;align-items:center;justify-content:space-between;gap:{z(20)}}}
.pe:before{{content:"";position:absolute;left:0;right:0;top:{z(-36)};height:{z(36)};background:#fff;clip-path:polygon(0 100%,100% 0,100% 100%)}}
.cta{{display:flex;align-items:center;gap:{z(18)}}}
.ci{{width:{z(70)};height:{z(70)};flex:none;border-radius:{z(22)};background:linear-gradient(140deg,#0B6A80,#0192B8);display:grid;place-items:center;color:#fff}}
.ci svg{{width:{z(34)};height:{z(34)}}}
.cta small{{display:block;white-space:nowrap;font:800 {z(17)} Archivo;letter-spacing:.18em;text-transform:uppercase;color:#0B6A80}}
.cta b{{display:block;white-space:nowrap;font:900 {z(42)}/1.04 Archivo;font-stretch:85%}}
.soc{{text-align:right;white-space:nowrap;font-size:{z(20)};font-weight:700;color:#4E6B76;line-height:1.5}}
.soc b{{color:#0F2E3A}}
.soc .sl{{margin-top:{z(6)};font:800 {z(15)} Archivo;letter-spacing:.2em;text-transform:uppercase;color:#0192B8}}
'''
    return f'''<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>{titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Source+Sans+3:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>{css}</style></head><body>{CORPO}</body></html>'''

# redes sociais: 1080×1350
SOCIAL = pagina("Serviços Grupo Kambas", 1080, 1350, (60, 70, 22, 26), 1.0)
# nas redes sociais há mais altura livre: cartões e logótipos maiores
SOCIAL = SOCIAL.replace("</style>", """.grade{gap:14px;margin-top:30px}.sv{min-height:128px;padding:16px}.si{width:58px;height:58px}.si svg{width:31px;height:31px}
.sv b{font-size:24px}.sv small{font-size:18px}.rec{margin-top:18px;padding:16px 18px}.lg{height:72px}.rt b{font-size:25px}.rt small{font-size:18px}</style>""")
(AQUI / "flyer-servicos.html").write_text(SOCIAL)
# lona: 1240×2080 (2 px/mm) = 58×100 cm + 2 cm de sangria; zona segura a 50 mm (100 px) da borda
LONA = pagina("Serviços Grupo Kambas — lona 58×100 cm", 1240, 2080, (110, 110, 50, 110), 1.42, "@page{size:620mm 1040mm;margin:0}")
LONA = LONA.replace("h1 em{font-style:normal;margin-left:.22em;", "h1 em{font-style:normal;display:block;")
(AQUI / "flyer-servicos-lona-58x100.html").write_text(LONA)
print("ok")
