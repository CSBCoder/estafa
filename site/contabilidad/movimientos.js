// ESTAFA · contabilidad del concurso "¡Despega del fondo!". Esta es la "base de datos": edítala aquí.
// tipo: donacion (+), premios (−), devolucion (+), gasto (−). El importe va siempre en positivo.
// fecha: "AAAA-MM-DD" o, si no se sabe el día, "AAAA-MM". torneo: número de bloque o null.
// Apunta los movimientos en orden: la página los muestra tal cual y va sumando el saldo.
window.CONTA = {
  moneda: "cc",
  tope_bloque: 400000,   // tope con el que se calculan los bloques desde el 3 (los bloques 1 y 2 tenían 600.000)
  movimientos: [
    {fecha: "2026-10",    tipo: "donacion",   quien: "Divo",        torneo: null, concepto: "Donación inicial", importe: 1000000, nota: ""},
    {fecha: "2026-10",    tipo: "donacion",   quien: "Calvosotelo", torneo: null, concepto: "Donación",         importe: 200000,  nota: ""},
    {fecha: "2026-10",    tipo: "donacion",   quien: "gatoflauta",  torneo: null, concepto: "Donación",         importe: 100000,  nota: ""},
    {fecha: "2026-11-03", tipo: "premios",    quien: "",            torneo: 1,    concepto: "Premios del bloque 1 (20 oct – 2 nov)", importe: 599989, nota: "Cifra calculada por la web (tope de 600.000)"},
    {fecha: "2026-11",    tipo: "devolucion", quien: "",            torneo: 1,    concepto: "Premios del bloque 1 no aceptados", importe: 202994, nota: "Total devuelto al final"},
    {fecha: "2026-11-14", tipo: "donacion",   quien: "Calvosotelo", torneo: null, concepto: "Donación",         importe: 100000,  nota: ""},
    {fecha: "2026-11-17", tipo: "premios",    quien: "",            torneo: 2,    concepto: "Premios del bloque 2 (3–16 nov)", importe: 599999, nota: "Cifra de la web (tope de 600.000). Pendiente de repartir: si alguien no lo acepta, apuntar la devolución"},
    {fecha: "2026-11",    tipo: "donacion",   quien: "AL Toni",     torneo: null, concepto: "Donación",         importe: 40000,   nota: "Falta el día exacto"}
  ]
};
