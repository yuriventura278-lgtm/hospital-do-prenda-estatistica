"""Exporta os flyers do Grupo Kambas.

    python3 exportar.py social flyer-recargas.html GrupoKambas-Recargas
    python3 exportar.py lona   flyer-recargas-lona-58x100.html GrupoKambas-Recargas-Lona-58x100cm

social: PNG 2160×2700 e PDF (RGB) para WhatsApp/redes sociais.
lona:   PDF vetorial CMYK (FOGRA39, tinta máx. 300%), 62×104 cm = 58×100 cm + 2 cm de sangria por lado,
        e TIFF CMYK 150 dpi de reserva. Precisa de: playwright, Pillow, ghostscript (gs).
"""
import pathlib, subprocess, sys, tempfile
from PIL import Image, ImageCms
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).resolve().parent
ICC = AQUI / "icc" / "FOGRA39-TAC300.icc"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"


def abrir(p, html, w, h, escala):
    b = p.chromium.launch(executable_path=CHROME) if pathlib.Path(CHROME).exists() else p.chromium.launch()
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=escala)
    pg.goto(pathlib.Path(html).resolve().as_uri()); pg.wait_for_load_state("networkidle")
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(800)
    return pg


def social(html, nome):
    with sync_playwright() as p:
        pg = abrir(p, html, 1080, 1350, 2)
        pg.screenshot(path=f"{nome}.png")
        pg.pdf(path=f"{nome}.pdf", width="1080px", height="1350px", print_background=True, page_ranges="1")
    print("feito:", f"{nome}.png", f"{nome}.pdf")


def lona(html, nome, larg_mm=620, alt_mm=1040, dpi=150):
    w, h = 1240, 2080                       # 2 px por mm no desenho
    px = round(larg_mm / 25.4 * dpi)
    with tempfile.TemporaryDirectory() as t, sync_playwright() as p:
        pg = abrir(p, html, w, h, px / w)
        pg.screenshot(path=f"{t}/rgb.png")
        pg.pdf(path=f"{t}/rgb.pdf", width=f"{larg_mm}mm", height=f"{alt_mm}mm", print_background=True,
               scale=larg_mm / (w * 25.4 / 96), page_ranges="1")
        subprocess.run(["gs", "-q", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/prepress",
                        "-dCompatibilityLevel=1.6", "-sColorConversionStrategy=CMYK", "-sProcessColorModel=DeviceCMYK",
                        f"-sOutputICCProfile={ICC}", "-dRenderIntent=0", "-dAutoRotatePages=/None",
                        f"-sOutputFile={nome}-CMYK.pdf", f"{t}/rgb.pdf"], check=True)
        im = Image.open(f"{t}/rgb.png").convert("RGB")
        cmyk = ImageCms.getOpenProfile(str(ICC))
        tr = ImageCms.buildTransform(ImageCms.createProfile("sRGB"), cmyk, "RGB", "CMYK", renderingIntent=ImageCms.Intent.PERCEPTUAL)
        ImageCms.applyTransform(im, tr).save(f"{nome}-CMYK-{dpi}dpi.tif", compression="tiff_lzw", dpi=(dpi, dpi), icc_profile=cmyk.tobytes())
        im.resize((im.width // 4, im.height // 4), Image.LANCZOS).save(f"{nome}-previsualizacao.jpg", quality=88)
    print("feito:", f"{nome}-CMYK.pdf", f"{nome}-CMYK-{dpi}dpi.tif", f"{nome}-previsualizacao.jpg")


if __name__ == "__main__":
    modo, html, nome = sys.argv[1:4]
    {"social": social, "lona": lona}[modo](html, nome)
