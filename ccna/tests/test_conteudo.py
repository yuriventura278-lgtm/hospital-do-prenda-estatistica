"""Testes do conteúdo e dos laboratórios. Correr com: python -m unittest discover tests"""

import shutil
import subprocess
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from conteudo import curso  # noqa: E402
from conteudo.validar import validar  # noqa: E402


class TestConteudo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c = curso()

    def test_sem_erros_de_validacao(self):
        self.assertEqual(validar(self.c), [])

    def test_cobre_os_seis_dominios_do_exame(self):
        self.assertEqual(sum(d["peso"] for d in self.c["guia"]["dominios"]), 100)
        ids = {m["id"] for m in self.c["modulos"]}
        for d in self.c["guia"]["dominios"]:
            self.assertTrue(set(d["modulos"]) <= ids, d["nome"])

    def test_prova_tem_perguntas_suficientes(self):
        for m in self.c["modulos"]:
            total = sum(len(l["quiz"]) for l in m["licoes"]) + len(m["prova_extra"])
            self.assertGreaterEqual(total, 3, m["id"])

    def test_numeracao_dos_modulos(self):
        self.assertEqual([m["numero"] for m in self.c["modulos"]], list(range(0, len(self.c["modulos"]))))

    def test_programa_por_cursos(self):
        cursos = {c["id"] for c in self.c["cursos"]}
        self.assertTrue(all(m["curso"] in cursos for m in self.c["modulos"]))
        self.assertTrue(all(m["ficha"] for m in self.c["modulos"]))

    def test_ha_casos_reais_e_cenarios(self):
        self.assertGreaterEqual(len(self.c["casos"]), 10)
        self.assertTrue(all(l["cenario"] for l in self.c["labs"]))

    def test_todas_as_licoes_tem_video_aula_completa(self):
        for m in self.c["modulos"]:
            for l in m["licoes"]:
                cenas = l["video"]["cenas"]
                self.assertEqual(cenas[0]["tipo"], "abertura", l["id"])
                self.assertEqual(cenas[-1]["tipo"], "fecho", l["id"])
                cobertos = {c["bloco"] for c in cenas}
                self.assertTrue(set(range(len(l["blocos"]))) <= cobertos, l["id"])

    def test_termos_estagio_e_apresentacao(self):
        for m in self.c["modulos"]:
            self.assertTrue(m["estagio"], m["id"])
            self.assertTrue(m["apresentacao"]["video"]["cenas"], m["id"])
            for l in m["licoes"]:
                self.assertGreaterEqual(len(l["termos"]), 3, l["id"])
                self.assertEqual(l["exercicios"]["obrigatorios"], 10)
        self.assertGreaterEqual(len(self.c["glossario"]), 350)
        self.assertGreaterEqual(len(self.c["protocolos"]), 60)

    def test_pronuncia(self):
        from conteudo.narracao import falar
        self.assertEqual(falar("O router 192.168.1.1/24"), "O ráuter 192 ponto 168 ponto 1 ponto 1 barra 24")
        self.assertEqual(falar("Use TCP e DHCP"), "Use T C P e D H C P")
        self.assertEqual(falar("no shutdown", comando=True), "nôu chât dáun")
        self.assertEqual(falar("100 Mbit/s"), "100 megabits por segundo")
        self.assertIn("guígabit 0 barra 0", falar("interface g0/0", comando=True))

    def test_modulo_zero_comeca_pela_informatica(self):
        titulos = [l["titulo"] for m in self.c["modulos"] if m["curso"] == "A" for l in m["licoes"]]
        self.assertEqual(titulos[0], "O que é a informática")
        self.assertIn("Como surgiram os computadores", titulos)
        self.assertIn("Porque os computadores precisam de comunicar", titulos)


@unittest.skipUnless(shutil.which("node"), "Node.js não instalado")
class TestLaboratorios(unittest.TestCase):
    def test_dicas_resolvem_todos_os_labs(self):
        subprocess.run([sys.executable, str(RAIZ / "build.py")], check=True, capture_output=True)
        r = subprocess.run(["node", str(RAIZ / "tests" / "resolver_labs.cjs")], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_exercicios_gerados(self):
        r = subprocess.run(["node", str(RAIZ / "tests" / "exercicios.cjs")], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_atividades_do_simulador(self):
        r = subprocess.run(["node", str(RAIZ / "tests" / "simulador_motor.cjs")], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
