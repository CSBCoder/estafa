# ESTAFA · Estadísticas del Frente Aéreo

Dashboard del farmeo de Sky Hero en eEspaña (eRepublik), con el torneo bisemanal **¡Despega del fondo!**. Web estática en `site/`, con los datos actualizados automáticamente cada día por GitHub Actions.

## Cómo funciona

```
battle-stats.yurii.live  ──(cada día, GitHub Actions)──>  scripts/fetch_sh.py       CSV de SH (una fila por medalla)
                                                          scripts/fetch_players.py  BH y CH por jugador y semana
                                                                   │
                                                          scripts/build.py  ──>  data/*.csv (histórico)
                                                                             └─>  site/data/sh.js (datos de la web)
                                                                   │
                                                          Netlify publica site/ en https://estafa.netlify.app/
```

La web no tiene servidor: todo (percentiles, torneos, fichas de piloto) se calcula en el navegador con `site/data/sh.js`.

## Dónde está publicado

- **Web:** https://estafa.netlify.app/ — Netlify está conectado al repositorio de GitHub y publica la carpeta `site/` (lo dice `netlify.toml`) cada vez que cambia algo en el repositorio.
- **Repositorio:** https://github.com/CSBCoder/estafa — guarda el código y los datos, y su robot (GitHub Actions) descarga los datos cada día. Tiene que ser público para que el robot sea gratis.

Para cambiar algo (por ejemplo `data/torneos.json`), lo más fácil es editarlo en la web de GitHub con el lápiz del archivo: el robot regenera los datos y Netlify publica el cambio en un par de minutos.

### Actualización diaria

El archivo `.github/workflows/update.yml` lo lanza **una vez al día a las 9:23 UTC** (madrugada en el servidor de eRepublik, ya con el día anterior cerrado). Para cambiar la hora, edita la línea `cron`:
- `23 9 * * *` → cada día a las 9:23 UTC
- `23 */12 * * *` → cada 12 horas
- `23 9 * * 2` → solo los martes

Cada ejecución hace 1 petición del CSV de SH y 1 o 2 de la página de país. Si cambias algo en `scripts/` o `data/`, el robot regenera `site/data/sh.js` sin descargar datos. Cada vez que el robot guarda, Netlify vuelve a publicar la web.

Nota: GitHub pausa las tareas programadas de un repositorio público si pasa 60 días sin actividad. Si un día deja de actualizarse, entra en **Actions** y pulsa **Enable workflow**.

## La web: tres pestañas

- **Torneo**: el concurso ¡Despega del fondo!, con factor nacional, premios en vivo y ficha de cada piloto.
- **Estadísticas globales**: resumen, semanas, día/hora, percentiles, coste de la SH, ranking y extranjero, con el selector de semana.
- **Pilotos (histórico)**: registro de pilotos con varias semanas (SH, percentil, BH, CH…) y SH de cada piloto por semana.

## El concurso

Se configura en `data/torneos.json`, sin tocar código:

| Campo | Qué es |
|---|---|
| `inicio`, `duracion_dias`, `num_torneos` | Primer martes, 14 días por bloque y número de bloques (2 = 4 semanas). |
| `fondo_percentil` | 60: compiten los del P60–P100 (y los que no ganaron SH) en las dos semanas anteriores a cada bloque. |
| `premios_escalon` | Premio por escalón subido: sin SH → P80–P100, → P60–P80, → P40–P60, → P20–P40, → P0–P20. Ahora `[6000, 16000, 30000, 60000, 0]`. |
| `min_sh`, `mejora_minima`, `min_sh_reactivacion` | Regla anti-chollo: 3 SH y 2 más que en el bloque anterior; la reactivación, con 1 SH. |
| `factor` | Referencia (6–19 oct), ×3, mínimo 0,5, máximo 2 y `usar_oro` (media de la variación de SH y de oro total). |
| `presupuesto_total`, `tope_bloque` | 1.200.000 y 600.000 cc. Si un bloque se pasa del tope, se recorta todo en proporción. Lo que sobra va al bote final. |
| `torneos` | Opcional, por número de bloque: `nota` e `inscritos` (lista de Citizen ID; vacía = compiten todos los que cumplen). |

En la web cada piloto busca su nombre y ve su nivel de salida, su nivel actual, el premio que cobraría si el bloque acabara hoy y cuántas SH le faltan para el siguiente escalón. La dirección cambia (por ejemplo `.../#torneo/1/1561071`), así que se puede pasar el enlace de una ficha por Discord o el foro.

## Probar en tu ordenador

```bash
pip install -r requirements.txt
python scripts/fetch_sh.py        # descarga los últimos 30 días de SH
python scripts/fetch_players.py   # descarga BH y CH semanales
python scripts/build.py           # une al histórico y genera site/data/sh.js
```
Después abre `site/index.html` con doble clic.

Para añadir un CSV descargado a mano: `python scripts/build.py ruta/al/archivo.csv`

## Antes de publicar

- Avisa a driversti (autor de battle-stats, t.me/driversti) de que ESTAFA consultará su API una vez al día, y dale las gracias en el foro. La web ya le cita en el pie de página.

Todo el contexto del proyecto, para seguir trabajando con Claude Code, está en `CLAUDE.md`.
