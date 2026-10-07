"""Testes dos PDFs das aulas (pdf_aulas.py). Correr com: python -m unittest tests.test_pdf"""

import html
import re
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

import pdf_aulas  # noqa: E402
from conteudo import curso  # noqa: E402


def paginas(dados: bytes) -> int:
    return len(re.findall(rb"/Type\s*/Page[^s]", dados))


class TestPdf(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c = curso()
        cls.tmp = tempfile.TemporaryDirectory()
        cls.saida = Path(cls.tmp.name)
        cls.mod = next(m for m in cls.c["modulos"] if m["id"] == "itn7")
        cls.indice = pdf_aulas.gerar_pdfs(cls.c, cls.saida, modulos=[cls.mod["id"]], processos=1)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_pdf_da_aula(self):
        for l in self.mod["licoes"]:
            f = self.saida / self.mod["id"] / f"{l['id']}.pdf"
            dados = f.read_bytes()
            self.assertTrue(dados.startswith(b"%PDF"), f)
            self.assertGreaterEqual(paginas(dados), 3, f)
            self.assertEqual(paginas(dados), self.indice["licoes"][l["id"]]["paginas"])

    def test_versao_para_imprimir_e_pdf_do_modulo(self):
        l = self.mod["licoes"][0]
        imp = (self.saida / "imprimir" / self.mod["id"] / f"{l['id']}.pdf").read_bytes()
        self.assertTrue(imp.startswith(b"%PDF"))
        # letra maior: a versão para imprimir tem mais páginas
        self.assertGreater(paginas(imp), self.indice["licoes"][l["id"]]["paginas"])
        mod = self.saida / f"{self.mod['id']}.pdf"
        self.assertTrue(mod.exists())
        self.assertGreater(paginas(mod.read_bytes()), sum(self.indice["licoes"][x["id"]]["paginas"] for x in self.mod["licoes"]))

    def test_indice_para_a_app(self):
        l = self.mod["licoes"][0]
        e = self.indice["licoes"][l["id"]]
        self.assertEqual(e["arquivo"], f"pdf/{self.mod['id']}/{l['id']}.pdf")
        self.assertEqual(e["imprimir"], f"pdf/imprimir/{self.mod['id']}/{l['id']}.pdf")
        self.assertEqual(self.indice["modulos"][self.mod["id"]]["arquivo"], f"pdf/{self.mod['id']}.pdf")

    def test_dez_exercicios_por_aula(self):
        ex = pdf_aulas.gerar_exercicios(self.c)
        for m in self.c["modulos"]:
            for l in m["licoes"]:
                self.assertEqual(len(ex[l["id"]]), l["exercicios"]["obrigatorios"], l["id"])
        self.assertEqual(ex, pdf_aulas.gerar_exercicios(self.c), "a semente fixa deve dar sempre os mesmos exercícios")

    def test_conversor_html_nao_perde_texto(self):
        pdf_aulas.registar_fontes()
        est = pdf_aulas.Estilos(pdf_aulas.COR)

        def so_texto(x):
            return re.sub(r"\s+", "", html.unescape(re.sub(r"<[^>]+>", "", x)))

        for m in self.c["modulos"]:
            for l in m["licoes"]:
                for b in l["blocos"]:
                    if "html" not in b:
                        continue
                    partes = []
                    for it in pdf_aulas.html_itens(b["html"], est):
                        if it[0] in ("p", "li"):
                            partes.append(it[1])
                        elif it[0] == "pre":
                            partes.append(pdf_aulas.esc(it[1]))
                        elif it[0] == "tabela":
                            partes += [c for linha in it[1] for c in linha]
                    self.assertEqual(so_texto("".join(partes)), so_texto(b["html"]), f"{l['id']}: {b['html'][:80]}")


if __name__ == "__main__":
    unittest.main()
