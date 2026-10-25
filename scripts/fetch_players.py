"""Descarga los totales semanales por jugador (oro, BH, SH, CH) de España.

Usa la misma petición que la página de país de battle-stats.yurii.live:
    /api/countries/15/players?page=0&size=200&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

Es la única vía para tener las Battle Hero (BH) y Campaign Hero (CH).
Guarda una fila por jugador y semana (martes a lunes) en data/players_weekly.csv.
Solo vuelve a pedir las semanas que faltan o que aún pueden cambiar
(la semana en curso y la anterior), así que cada día son 1 o 2 peticiones.

Ojo: la API corta los días de forma algo distinta al CSV de SH (en una semana
salen ~1 % más de SH). Para las SH manda el CSV; de aquí solo se usan BH y CH.
"""
import csv
import pathlib
import sys
import time
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fetch_sh import COUNTRY_ID, get

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "players_weekly.csv"
API = f"https://battle-stats.yurii.live/api/countries/{COUNTRY_ID}/players"
COLS = ["Week Start", "Citizen ID", "Citizen Name", "Gold", "Medals", "BH", "SH", "CH", "Battles"]
FIRST_TUESDAY = date(2026, 9, 1)  # primera semana completa del histórico
PAUSE = 3  # segundos entre peticiones, para no cargar la web de driversti


def week_rows(start: date):
    end = start + timedelta(days=6)
    rows, page = [], 0
    while True:
        url = f"{API}?page={page}&size=200&sort=GOLD&order=DESC&startDate={start}&endDate={end}"
        j = get(url).json()
        for p in j["content"]:
            rows.append({"Week Start": start.isoformat(), "Citizen ID": p["citizenId"],
                         "Citizen Name": p["citizenName"], "Gold": p["totalGold"],
                         "Medals": p["totalMedals"], "BH": p["bhMedals"], "SH": p["shMedals"],
                         "CH": p["chMedals"], "Battles": p["battlesParticipated"]})
        page += 1
        if page >= j["totalPages"]:
            return rows
        time.sleep(PAUSE)


def main() -> int:
    today = datetime.now(ZoneInfo("America/Los_Angeles")).date()  # día del servidor de eRepublik
    old = []
    if OUT.exists():
        with OUT.open(encoding="utf-8") as f:
            old = list(csv.DictReader(f))
    have = {r["Week Start"] for r in old}
    weeks, w = [], FIRST_TUESDAY
    while w <= today:
        # Se vuelve a pedir si falta o si terminó hace menos de 3 días
        if w.isoformat() not in have or w + timedelta(days=6) >= today - timedelta(days=3):
            weeks.append(w)
        w += timedelta(days=7)
    if not weeks:
        print("Nada que descargar")
        return 0
    fresh = {}
    for i, w in enumerate(weeks):
        if i:
            time.sleep(PAUSE)
        fresh[w.isoformat()] = week_rows(w)
        print(f"Semana {w}: {len(fresh[w.isoformat()])} jugadores")
    rows = [r for r in old if r["Week Start"] not in fresh] + [r for v in fresh.values() for r in v]
    rows.sort(key=lambda r: (r["Week Start"], -int(r["Gold"])))
    with OUT.open("w", encoding="utf-8", newline="") as f:
        wr = csv.DictWriter(f, COLS)
        wr.writeheader()
        wr.writerows(rows)
    print(f"Guardadas {len(rows)} filas en {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
