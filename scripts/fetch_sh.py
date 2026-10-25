"""Descarga el CSV detallado de Sky Hero de España desde battle-stats.yurii.live.

Guarda el archivo en data/raw/latest.csv (no se versiona). Después hay que
ejecutar scripts/build.py para unirlo al histórico.

URL comprobada el 25 oct 2026: /api/sh-report/15/detailed/csv?timeRange=LAST_30D
devuelve una fila por medalla con las columnas que espera build.py.
"""
import pathlib
import sys
import time

import requests

COUNTRY_ID = 15  # España
TIME_RANGE = "LAST_30D"  # Bajar 30 días cada vez: se solapan y no quedan huecos
URL = f"https://battle-stats.yurii.live/api/sh-report/{COUNTRY_ID}/detailed/csv?timeRange={TIME_RANGE}"
HEADERS = {"User-Agent": "ESTAFA (eEspaña, dashboard de rol) - actualización diaria"}

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "raw" / "latest.csv"


def get(url, tries=3):
    """GET con reintentos espaciados, por si la web está caída un momento."""
    for i in range(tries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=120)
            r.raise_for_status()
            return r
        except requests.RequestException as e:
            if i == tries - 1:
                raise
            print(f"Fallo ({e}), reintento en {30 * (i + 1)} s", file=sys.stderr)
            time.sleep(30 * (i + 1))


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = get(URL).content.decode("utf-8-sig")
    first = text.splitlines()[0] if text else ""
    if not first.startswith("Citizen ID,Citizen Name,Battle ID"):
        print(f"Respuesta inesperada, primera línea: {first[:200]!r}", file=sys.stderr)
        return 1
    OUT.write_text(text, encoding="utf-8")
    print(f"Descargadas {len(text.splitlines()) - 1} filas en {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
