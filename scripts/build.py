"""Une los CSV nuevos al histórico y genera site/data/sh.js para el dashboard.

Uso:
    python scripts/build.py                      # usa data/raw/*.csv si existen
    python scripts/build.py ruta/a/otro.csv ...  # añade CSV concretos

- Histórico maestro: data/sh_detailed_master.csv (sí se versiona).
- Clave única de una medalla: Citizen ID + Battle ID + Round + Side.
- La hora de Madrid se calcula desde "Battle Time (PST)", que es hora del
  servidor de eRepublik (America/Los_Angeles).
- Si existen, también mete en sh.js la configuración de los torneos
  (data/torneos.json) y las BH/CH semanales (data/players_weekly.csv,
  que descarga scripts/fetch_players.py).
"""
import json
import pathlib
import sys
from datetime import datetime, timezone

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
MASTER = ROOT / "data" / "sh_detailed_master.csv"
RAW_DIR = ROOT / "data" / "raw"
TORNEOS = ROOT / "data" / "torneos.json"
PLAYERS = ROOT / "data" / "players_weekly.csv"
OUT_JS = ROOT / "site" / "data" / "sh.js"
KEY = ["Citizen ID", "Battle ID", "Round", "Side"]
COLS = ["Citizen ID", "Citizen Name", "Battle ID", "Round", "Side", "Damage",
        "Battle Time (PST)", "Invader Country", "Defender Country"]


def load_all(extra):
    frames = []
    if MASTER.exists():
        frames.append(pd.read_csv(MASTER))
    files = [pathlib.Path(p) for p in extra] or sorted(RAW_DIR.glob("*.csv"))
    for f in files:
        df = pd.read_csv(f)
        missing = set(COLS) - set(df.columns)
        if missing:
            raise SystemExit(f"{f} no tiene las columnas esperadas: {missing}")
        frames.append(df[COLS])
        print(f"+ {f.name}: {len(df)} filas")
    if not frames:
        raise SystemExit("No hay datos: ni histórico ni CSV nuevos.")
    d = pd.concat(frames, ignore_index=True)
    before = len(frames[0]) if MASTER.exists() else 0
    # Si una medalla aparece varias veces nos quedamos con la última versión
    d = d.drop_duplicates(KEY, keep="last").reset_index(drop=True)
    print(f"Histórico: {before} -> {len(d)} medallas ({len(d) - before:+d})")
    return d


def pack(d):
    d = d.copy()
    d["dstr"] = d["Battle Time (PST)"].str[:10]
    d["ts"] = pd.to_datetime(d["Battle Time (PST)"])
    d["hm"] = (d["ts"].dt.tz_localize("America/Los_Angeles", ambiguous="NaT", nonexistent="shift_forward")
               .dt.tz_convert("Europe/Madrid").dt.hour.fillna(0).astype(int))
    last = d.sort_values("ts").groupby("Citizen ID")["Citizen Name"].last()
    ids = sorted(d["Citizen ID"].unique())
    pi = {c: i for i, c in enumerate(ids)}
    cs = sorted(set(d["Invader Country"]) | set(d["Defender Country"]))
    ci = {c: i for i, c in enumerate(cs)}
    days = sorted(d["dstr"].unique())
    di = {x: i for i, x in enumerate(days)}
    R = []
    for r in d.itertuples(index=False):
        # 9 campos por medalla: piloto, batalla, ronda, atacante(1/0), daño, día, invasor, defensor, hora Madrid
        R += [pi[r[0]], int(r[2]), int(r[3]), 1 if r[4] == "ATTACKER" else 0, int(r[5]),
              di[r.dstr], ci[r[7]], ci[r[8]], int(r.hm)]
    return {
        "updated": datetime.now(timezone.utc).isoformat(timespec="minutes"),
        "names": [last[c] for c in ids],
        "ids": [int(c) for c in ids],
        "countries": cs,
        "days": days,
        "R": R,
    }


def pack_bh(data):
    """BH y CH por semana: {martes: [piloto, BH, CH, piloto, BH, CH...]}, solo pilotos con SH en el histórico."""
    if not PLAYERS.exists():
        return {}
    p = pd.read_csv(PLAYERS)
    pi = {c: i for i, c in enumerate(data["ids"])}
    out = {}
    for wk, g in p[(p["BH"] > 0) | (p["CH"] > 0)].groupby("Week Start"):
        out[wk] = [v for r in g.itertuples(index=False) if r[1] in pi for v in (pi[r[1]], int(r.BH), int(r.CH))]
    return out


def pack_api_weeks():
    """Totales de España por semana según la API: {martes: [oro, SH, BH]}. Sirve para el factor nacional con oro."""
    if not PLAYERS.exists():
        return {}
    g = pd.read_csv(PLAYERS).groupby("Week Start")[["Gold", "SH", "BH"]].sum()
    return {wk: [int(r.Gold), int(r.SH), int(r.BH)] for wk, r in g.iterrows()}


def main():
    d = load_all(sys.argv[1:])
    d[COLS].to_csv(MASTER, index=False)
    data = pack(d)
    data["bh"] = pack_bh(data)
    data["api"] = pack_api_weeks()
    if TORNEOS.exists():
        data["torneos"] = json.loads(TORNEOS.read_text(encoding="utf-8"))
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text("window.ESTAFA_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
                      encoding="utf-8")
    print(f"Generado {OUT_JS} ({len(data['R']) // 9} medallas, {data['days'][0]} -> {data['days'][-1]})")


if __name__ == "__main__":
    main()
