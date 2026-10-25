# ESTAFA · Estadísticas del Frente Aéreo

Dashboard de rol para la comunidad española de **eRepublik** (eEspaña). Analiza el farmeo de medallas **Sky Hero (SH)** de los pilotos españoles: oro generado, evolución semanal, reparto por percentiles, coste en daño de cada SH, horas baratas, pilotos en guerras ajenas y el torneo bisemanal **¡Despega del fondo!** para los pilotos con menos SH.

El dueño del proyecto es Josemi, jugador español de eRepublik. No es programador profesional: explícale los cambios en castellano y en lenguaje sencillo. Todo el texto visible del dashboard va en **castellano de España**.

## Estructura

```
site/                 Web estática (es lo que se publica en GitHub Pages)
  index.html          Maquetación
  css/estafa.css      Estilos (imitan la web de eRepublik)
  js/estafa.js        Lógica y gráficos del dashboard (JS puro, SVG a mano, sin librerías)
  js/torneo.js        Pestaña Torneo (se carga después de estafa.js y usa sus globales D, M, MES, fmtR, es…)
  js/tabs.js          Cambio de pestañas según el hash
  data/sh.js          GENERADO por scripts/build.py -> window.ESTAFA_DATA
data/
  sh_detailed_master.csv   Histórico de todas las SH (fuente de verdad, se versiona)
  players_weekly.csv       Oro/BH/SH/CH por jugador y semana (de fetch_players.py, se versiona)
  torneos.json             Configuración de los torneos (la edita Josemi)
  raw/                     Descargas temporales (ignorado por git)
scripts/
  fetch_sh.py         Descarga el CSV detallado de SH de España
  fetch_players.py    Descarga BH/CH semanales (solo las semanas que faltan o pueden cambiar)
  build.py            Une CSV nuevos al histórico y genera site/data/sh.js (con bh y torneos)
.github/workflows/update.yml   Descarga + build + commit, una vez al día (9:23 UTC); Netlify publica
netlify.toml          Netlify publica solo site/
.claude/launch.json   Servidor local (python -m http.server 8765) para la vista previa
docs/                 Artículo de presentación y tabla del concurso en BBCode phpBB
```

**Publicado** el 25 oct 2026: repositorio público https://github.com/CSBCoder/estafa, web pública **https://estafa.netlify.app/** (Netlify conectado al repositorio, publica `site/` según netlify.toml y se redespliega con cada commit del robot). GitHub Pages está **apagado** (25 oct 2026) y el workflow ya no publica: solo descarga y guarda datos. Josemi prefiere Netlify para que no se vea su usuario de GitHub en la dirección. El robot sube datos cada día, así que antes de cambiar algo en local hay que hacer `git pull`. Los commits usan el correo noreply de GitHub (configurado solo en este repositorio) para no publicar el correo personal.

Para probar en local: `pip install -r requirements.txt`, `python scripts/build.py` y abrir `site/index.html` en el navegador (funciona con file://).

## Fuente de datos

Web **battle-stats.yurii.live**, creada por **driversti** (Telegram t.me/driversti, perfil eRepublik 4690052). Es una app React y no tiene usuario ni contraseña.

- CSV de SH por país, visto en el botón "Descargar CSV" de /sh-report:
  `https://battle-stats.yurii.live/api/sh-report/15/summary/csv?timeRange=LAST_30D`
  `15` es el ID de España. `timeRange` vale LAST_7D, LAST_30D…
- El **detallado** (una fila por medalla), que es lo que usa ESTAFA: `/api/sh-report/15/detailed/csv?timeRange=LAST_30D`. **Confirmado** el 25 oct 2026.
- También acepta `startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` en lugar de `timeRange` (lo usa la propia web).
- El export devuelve siempre una ventana móvil de 30 días como máximo. Por eso hay que guardar el histórico propio y unir sin duplicados.
- JSON de jugadores de un país (encontrado en el bundle JS de la web, 25 oct 2026):
  `/api/countries/15/players?page=0&size=200&sort=GOLD&order=DESC&startDate=…&endDate=…`
  Devuelve `content[]` con citizenId, citizenName, totalGold, totalMedals, **bhMedals, shMedals, chMedals**, battlesParticipated, efficiency, winRate, y `totalPages`. Con size=200 basta una página (~190 españoles por semana). Es la única vía para **BH y CH**. Corta los días de forma algo distinta al CSV (semana 13–19 oct: 1.834 SH frente a 1.817), así que para SH manda el CSV.
- Otros: `/api/countries/15?startDate=…` (totales del país), `/api/sh-report/15/summary|detailed` (JSON), `/api/countries/15/players/{id}/divisions`.
- Oro por medalla según la web: D1=2, D2=3, D3=4, D4=5, **Aire=10**. Los Funky Balloon Booster pueden multiplicarlo (por eso totalGold a veces no es SH×10 exacto).
- Antes de automatizar en serio, Josemi debe avisar o pedir permiso a driversti. Consultas espaciadas (cada 6–12 h), con User-Agent identificable.

### Formato del CSV detallado
`Citizen ID,Citizen Name,Battle ID,Round,Side,Damage,Battle Time (PST),Invader Country,Defender Country`
- Una fila = una SH ganada por un español (Side = ATTACKER o DEFENDER).
- **Damage** = daño con el que se ganó esa SH. Solo están las rondas ganadas: el daño de las rondas perdidas no aparece.
- **Battle Time (PST)** es la hora de inicio de la batalla, en hora del servidor de eRepublik (America/Los_Angeles). Es la misma para todas las rondas de una batalla.
- Clave única: Citizen ID + Battle ID + Round + Side. Al unir archivos que se solapan, las filas coinciden exactamente.

## Decisiones y definiciones (respetarlas)

- **1 SH = 10 de oro.** Confirmado con la web de battle-stats (medallas aéreas = 10 oro).
- **Días** = día del servidor de eRepublik (fecha de Battle Time PST). Day 6.911 = 22 oct 2026.
- **Semanas de martes a lunes.** Las semanas incompletas no cuentan en las comparativas y se dibujan rayadas. El primer y el último día del histórico se marcan como parciales.
- **Percentiles desde arriba**: P1 es el piloto con más SH. Grupos: Top 5 %, 5–10 %, 10–25 %, 25–50 %, 50 % inferior. Los empatados van al grupo mejor (rango mínimo). Josemi **no quiere rangos con nombre** (As, Veterano…).
- **Fondo P60–P100**: pilotos con rango/N > 0,6 en las semanas elegidas, más los pilotos del histórico sin ninguna SH en esas semanas.
- **Coste de una SH**: se usa la **mediana** del daño, no la media. Unas pocas rondas de millones de daño disparan la media ("efecto Divo").
- Categorías de coste: regalada (menos de 10 k), barata (10–30 k), normal (30–70 k), cara (70–150 k), carísima (más de 150 k).
- **Vista por hora**: hora de Madrid, y **solo rondas 1 y 2**, porque solo hay hora de inicio de batalla. Es una aproximación y así se avisa en la página.
- "Extranjero" = SH en batallas donde España no es ni invasor ni defensor.
- "Dos bandas" = rondas en las que españoles ganaron la SH de ambos lados.
- Josemi pidió quitar: las Órdenes del Estado Mayor, el Informe de inteligencia y el botón de copiar para el foro (no se copiaba bien).

## Pestañas (site/js/tabs.js)

- Tres pestañas: **Torneo** (`#torneo`), **Estadísticas globales** (`#estadisticas`, con subnavegación a #resumen, #semanas…) y **Pilotos (histórico)** (`#pilotos`: Registro y "SH de cada piloto por semana").
- La pestaña visible sale del hash: se muestra el `.tabpanel` que contiene el elemento con ese id (`#torneo/1/123` → torneo).

## Concurso bisemanal (site/js/torneo.js + data/torneos.json)

Normas acordadas con Josemi el 25 oct 2026:
- Bloques de 14 días (martes a lunes), `num_torneos` = 2 (4 semanas), desde el 20 oct 2026. Cada bloque se compara con los 14 días anteriores.
- **Compiten** los del fondo del periodo anterior (rango/N > 0,6) y los pilotos del histórico sin SH en él. Si hay `inscritos`, solo esos Citizen ID.
- **Niveles** por percentil desde arriba entre todos los pilotos con SH del periodo (empates al mejor puesto): Sin SH, P80–P100, P60–P80, P40–P60, P20–P40, P0–P20.
- **Premio por escalones** subidos del nivel de salida al de llegada, sumados: 6.000 (reactivarse), 16.000, 30.000, **60.000 (P40–P60 → P20–P40, el premio estrella)** y 0 (llegar al P0–P20 no da nada extra).
- **Anti-chollo**: para cobrar, al menos 3 SH en el bloque y 2 más que en el bloque anterior (interpretación nuestra de "2 más que tu media anterior", en bloques de 2 semanas). La reactivación sola se cobra con 1 SH; si no cumple el resto, cobra solo la reactivación.
- **Factor nacional** = 1 + 3 × variación de España frente a la referencia de las semanas 6–7 (3.538 SH, 65.203 de oro según la API), entre ×0,5 y ×2, redondeado a 2 decimales. Con `usar_oro`, la variación es la media de la de SH (CSV) y la del oro total BH+SH (API). En un bloque en curso se usa el ritmo de los días completos; el oro previsto = SH previstas × oro por SH de la API.
- **Presupuesto** 1,2 M cc, tope de 600.000 por bloque con recorte proporcional. Lo que sobra va al **bote final**: piloto elegible en el bloque 1 con más SH en todo el concurso.
- "SH para llegar" a un nivel = SH del último piloto que entra (posición floor(umbral·N)); "previsto al final" = el de los días completos × 14 / días completos.

## El dashboard (site/js/estafa.js)

- Arriba: barra de info, menú de pestañas, banner "ESTAFA" (objetivo de rol de 20.000 de oro por semana).
- **Registro de pilotos** (pestaña Pilotos): tiene su propio selector de varias semanas, columna por semana, total, percentil, grupo, Fondo P60–P100 (Sí/No), oro y daño mediano, con filtros y búsqueda.
- Selector global "Parte de la semana" (Todo o una semana completa; por defecto, la última completa). Recalcula las secciones siguientes: Resumen con flechas frente a la semana anterior, Semana a semana (fijo), Medallas en el tiempo (por día o por hora), Percentiles, Coste SH, Ranking (SH más baratas y más caras, listas de menos de 10 k y más de 100 k, pilotos más baratos y más caros) y Extranjero.
- Estilo eRepublik: tema claro único, Arial, pestañas azules con brillo, cajas beige, banner metálico con texto verde lima (Russo One) y LCD (Orbitron).

## Contexto de rol (eEspaña)

- **Mari Toli**: la mejora del farmeo se cuenta desde la **semana 6** (6 oct). Antes (semanas 1–5) la media era de 1.646 SH/semana; después (6–7), 1.769 (+7,4 %).
- Semana 7 (13–19 oct): récord de 1.817 SH y 18.170 de oro.
- Concurso "¡Despega del fondo!": pueden participar los pilotos del P60–P100 en las semanas 6–7 (55 con 6 SH o menos, más 36 sin SH). Ganan si entran en el P0–P40 de la semana del concurso (hacían falta unas 12–14 SH/semana). Premio: panes Q1 de una donación privada. Presupuesto y semana del concurso, por decidir.
- Artículo para el foro en docs/ (BBCode phpBB, imágenes como URL_IMAGEN_n con descripción).

## Pendiente / ideas

1. Avisar a driversti de que ESTAFA consulta su API una vez al día.
2. BH y CH ya se descargan, salen en el Registro y entran en el factor nacional (oro total). Falta, si Josemi quiere, una sección BH propia.
3. Inscripción real en torneos: hoy es automática. Opciones sin servidor: formulario (Google Forms / GitHub Issues) y Josemi copia los ID a `inscritos`.
4. Si el JS crece, seguir dividiendo en archivos como torneo.js. No meter frameworks salvo que Josemi lo pida.
