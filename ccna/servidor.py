"""Servidor local para testar a app no computador ou no telemóvel.

Uso:
    python servidor.py            # http://localhost:8000
    python servidor.py 8080       # outra porta

Para abrir no telemóvel, ligue-o à mesma rede Wi-Fi e use o endereço IP do
computador que aparece no ecrã (ex.: http://192.168.1.20:8000).
"""

import functools
import http.server
import socket
import sys
from pathlib import Path

import build

PASTA = Path(__file__).parent / "www"


def ip_local() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main() -> None:
    if build.main() != 0:
        sys.exit(1)
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(PASTA))
    with http.server.ThreadingHTTPServer(("0.0.0.0", porta), handler) as srv:
        print(f"\nApp disponível em:\n  http://localhost:{porta}\n  http://{ip_local()}:{porta}  (telemóvel na mesma rede)\n")
        print("Ctrl+C para parar.")
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor parado.")


if __name__ == "__main__":
    main()
