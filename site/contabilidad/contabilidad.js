// ESTAFA · página de contabilidad. Lee window.CONTA de movimientos.js.
(function(){
const C=window.CONTA,CC=C.moneda||'cc',$=id=>document.getElementById(id);
const es=v=>Math.round(v).toLocaleString('es-ES');
const money=v=>es(v)+' '+CC;
const SIG={donacion:1,devolucion:1,premios:-1,gasto:-1};
const TIP={donacion:'Donación',devolucion:'Devolución',premios:'Premios',gasto:'Gasto'};
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fmtF=f=>{const [y,m,d]=f.split('-');return (d?+d+' ':'')+MES[m-1]+' '+y};
const mv=C.movimientos;   // en el orden en que están apuntados (las fechas sin día no se pueden ordenar bien)
const tot=t=>mv.filter(m=>m.tipo===t).reduce((s,m)=>s+m.importe,0);
const don=tot('donacion'),pre=tot('premios'),dev=tot('devolucion'),gas=tot('gasto');
const saldo=don+dev-pre-gas,T=C.tope_bloque,nb=T?saldo/T:null;
const K=[['',money(don),'Donado',`${new Set(mv.filter(m=>m.tipo==='donacion').map(m=>m.quien)).size} donantes`],
 ['',money(pre-dev),'Gastado en premios',`${money(pre)} pagados − ${money(dev)} devueltos`],
 ['gold',money(saldo),'Saldo',gas?`incluye ${money(gas)} de otros gastos`:'lo que queda en la caja'],
 [nb<1?'alert':'',T?nb.toLocaleString('es-ES',{maximumFractionDigits:1})+' bloques':'—','Da para',T?`con el tope de ${money(T)} por bloque`:'']];
$('kpis').innerHTML=K.map(([c,v,l,s])=>`<div class="kpi ${c}"><span class="l">${l}</span><span class="v">${v}</span><span class="s">${s}</span></div>`).join('');
// Movimientos con saldo acumulado
let acc=0;
$('mov').innerHTML=`<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Quién</th><th>Concepto</th><th class="n">Importe</th><th class="n">Saldo</th><th>Nota</th></tr></thead><tbody>`+
 mv.map(m=>{const v=SIG[m.tipo]*m.importe;acc+=v;return `<tr><td>${fmtF(m.fecha)}</td><td>${TIP[m.tipo]||m.tipo}</td><td>${m.quien||'—'}</td><td>${m.concepto}</td><td class="n ${v>0?'up':'down'}">${v>0?'+':'−'}${es(m.importe)}</td><td class="n"><b>${es(acc)}</b></td><td style="white-space:normal;color:var(--muted);font-size:12px">${m.nota||''}</td></tr>`}).join('')+`</tbody></table>`;
// Por donante
const dn=new Map();mv.filter(m=>m.tipo==='donacion').forEach(m=>dn.set(m.quien,(dn.get(m.quien)||0)+m.importe));
$('don').innerHTML=`<table><thead><tr><th>Donante</th><th class="n">Total</th><th class="n">%</th></tr></thead><tbody>`+
 [...dn].sort((a,b)=>b[1]-a[1]).map(([q,v])=>`<tr><td><b>${q}</b></td><td class="n">${money(v)}</td><td class="n">${(v/don*100).toLocaleString('es-ES',{maximumFractionDigits:1})} %</td></tr>`).join('')+`</tbody></table>`;
// Por bloque
const bl=new Map();mv.filter(m=>m.torneo).forEach(m=>{const b=bl.get(m.torneo)||{p:0,d:0};if(m.tipo==='premios')b.p+=m.importe;if(m.tipo==='devolucion')b.d+=m.importe;bl.set(m.torneo,b)});
$('blq').innerHTML=`<table><thead><tr><th>Bloque</th><th class="n">Premios</th><th class="n">Devuelto</th><th class="n">Coste real</th></tr></thead><tbody>`+
 [...bl].sort((a,b)=>a[0]-b[0]).map(([n,b])=>`<tr><td><b>${n}</b></td><td class="n">${money(b.p)}</td><td class="n">${b.d?money(b.d):'—'}</td><td class="n"><b>${money(b.p-b.d)}</b></td></tr>`).join('')+`</tbody></table>`;
})();
