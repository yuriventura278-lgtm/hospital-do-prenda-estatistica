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
    def setUp(self):
        self.c = curso()

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
            self.assertGreaterEqual(total, 15, m["id"])

    def test_numeracao_dos_modulos(self):
        self.assertEqual([m["numero"] for m in self.c["modulos"]], list(range(1, len(self.c["modulos"]) + 1)))


@unittest.skipUnless(shutil.which("node"), "Node.js não instalado")
class TestLaboratorios(unittest.TestCase):
    def test_dicas_resolvem_todos_os_labs(self):
        subprocess.run([sys.executable, str(RAIZ / "build.py")], check=True, capture_output=True)
        r = subprocess.run(["node", str(RAIZ / "tests" / "resolver_labs.cjs")], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
