// ESTAFA · lógica del dashboard. Los datos llegan en window.ESTAFA_DATA (site/data/sh.js, generado por scripts/build.py)
const D=window.ESTAFA_DATA;
const GOLD=10,GOAL=20000;
const DAY=864e5,REF=new Date('2026-10-22T12:00:00'),REFN=6911,TUE0=new Date('2026-09-22T12:00:00');
const es=(n,d=0)=>n.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:'always'});
const pct=(x,d=1)=>es(x*100,d)+' %';
const k=n=>n>=1e6?es(n/1e6,1)+' M':es(n/1000,1)+' k';
const med=a=>{if(!a.length)return 0;a=[...a].sort((x,y)=>x-y);const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2};
const quant=(a,q)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(q*(a.length-1)+.5))]};
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DN=['dom','lun','mar','mié','jue','vie','sáb'],DF=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const CN={'Spain':'España','Republic of Moldova':'Moldavia','Saudi Arabia':'Arabia Saudí','United Arab Emirates':'Emiratos','Czech Republic':'Rep. Checa','Philippines':'Filipinas','Cyprus':'Chipre','Japan':'Japón','France':'Francia','Italy':'Italia','Turkey':'Turquía','Romania':'Rumanía','Ukraine':'Ucrania','Croatia':'Croacia','Egypt':'Egipto','Brazil':'Brasil','Germany':'Alemania','Greece':'Grecia','Hungary':'Hungría','Thailand':'Tailandia','South Africa':'Sudáfrica','New Zealand':'Nueva Zelanda','Pakistan':'Pakistán','Finland':'Finlandia','Armenia':'Armenia','Canada':'Canadá','Peru':'Perú','South Korea':'Corea del Sur','Mexico':'México','Sweden':'Suecia','Belarus':'Bielorrusia','United Kingdom':'Reino Unido','Serbia':'Serbia','Portugal':'Portugal','Poland':'Polonia','Russia':'Rusia','Estonia':'Estonia','North Macedonia':'Macedonia del Norte','Netherlands':'Países Bajos','Belgium':'Bélgica','Switzerland':'Suiza','Indonesia':'Indonesia','Argentina':'Argentina','Venezuela':'Venezuela','Nigeria':'Nigeria','Australia':'Australia','Cuba':'Cuba','Dictatorship':'Dictadura'};
const cn=c=>CN[c]||c;
const SP=D.countries.indexOf('Spain');

// Filas: una por medalla
const M=[];for(let i=0;i<D.R.length;i+=9){const r=D.R.slice(i,i+9);M.push({p:r[0],b:r[1],r:r[2],a:r[3],dmg:r[4],d:r[5],inv:r[6],def:r[7],h:r[8]})}
M.forEach(m=>{m.sp=m.inv===SP||m.def===SP;m.side=m.a?m.inv:m.def});
const DAYS=D.days.map((s,i)=>{const date=new Date(s+'T12:00:00');return{i,s,date,n:REFN+Math.round((date-REF)/DAY),w:Math.floor((date-TUE0)/(7*DAY)),partial:i===0||i===D.days.length-1}});
const fmtR=(a,b)=>a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${MES[b.getMonth()]}`:`${a.getDate()} ${MES[a.getMonth()]} – ${b.getDate()} ${MES[b.getMonth()]}`;
const WEEKS=[];DAYS.forEach(d=>{let w=WEEKS.find(x=>x.w===d.w);if(!w)WEEKS.push(w={w:d.w,days:[]});w.days.push(d)});
WEEKS.forEach(w=>{const st=new Date(TUE0.getTime()+w.w*7*DAY),en=new Date(st.getTime()+6*DAY);w.start=st;w.end=en;w.complete=w.days.length===7&&!w.days.some(d=>d.partial);w.label=fmtR(st,en)});
const FULLW=WEEKS.filter(w=>w.complete);FULLW.forEach((w,i)=>w.num=i+1);
const isoL=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
if(D.updated){const u=new Date(D.updated);document.getElementById('ib-upd').textContent=`Actualizado el ${u.getDate()} ${MES[u.getMonth()]} a las ${String(u.getHours()).padStart(2,'0')}:${String(u.getMinutes()).padStart(2,'0')}`}

// Rangos por SH/semana
const TIERS=[{k:'Top 5 %',hi:.05},{k:'5–10 %',hi:.10},{k:'10–25 %',hi:.25},{k:'25–50 %',hi:.50},{k:'50 % inferior',hi:1}];


function compute(daySet){
 const rows=M.filter(m=>daySet.has(m.d));const nd=daySet.size,wf=nd/7;
 const by=new Map();
 rows.forEach(m=>{let p=by.get(m.p);if(!p)by.set(m.p,p={id:m.p,name:D.names[m.p],total:0,dm:[],f:0,fdm:[],fc:{},mn:Infinity,mx:0,u:0});
  p.total++;p.dm.push(m.dmg);p.mn=Math.min(p.mn,m.dmg);p.mx=Math.max(p.mx,m.dmg);if(m.dmg<10000){p.u++;p.uG=(p.uG||0)}if(m.dmg>100000){p.o=(p.o||0)+1;p.oD=(p.oD||0)+m.dmg}
  if(!m.sp){p.f++;p.fdm.push(m.dmg);p.fc[m.side]=(p.fc[m.side]||0)+1}});
 const P=[...by.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
 const tot=rows.length;let acc=0;
 P.forEach((p,i)=>{p.pos=i+1;p.gold=p.total*GOLD;p.med=med(p.dm);p.avg=p.dm.reduce((s,v)=>s+v,0)/p.total;acc+=p.total;p.share=p.total/tot;p.cum=acc/tot;
  p.fm=med(p.fdm);const fc=Object.entries(p.fc).sort((a,b)=>b[1]-a[1])[0];p.fcn=fc?D.countries[fc[0]]:null;p.rate=p.total/wf});
 P.forEach(p=>{const r0=P.findIndex(q=>q.total===p.total);p.tier=TIERS.findIndex(t=>(r0+1)/P.length<=t.hi+1e-9)});
 const dmg=rows.map(m=>m.dmg);
 const rk=new Map();rows.forEach(m=>{const key=m.b+'-'+m.r;const s=rk.get(key)||new Set();s.add(m.a);rk.set(key,s)});
 const both=rows.filter(m=>rk.get(m.b+'-'+m.r).size===2).length;
 const sorted=P.map(p=>p.total).sort((a,b)=>a-b);
 const gini=P.length?2*sorted.reduce((s,v,i)=>s+(i+1)*v,0)/(P.length*tot)-(P.length+1)/P.length:0;
 const days=[...daySet].sort((a,b)=>a-b).map(i=>{const r=rows.filter(m=>m.d===i);return{...DAYS[i],s:r.filter(m=>m.sp).length,f:r.filter(m=>!m.sp).length,t:r.length}});
 const full=days.filter(d=>!d.partial);
 const H=new Array(31).fill(0);dmg.forEach(v=>H[v>=150000?30:Math.floor(v/5000)]++);
 const CAT=[0,0,0,0,0];dmg.forEach(v=>CAT[v<1e4?0:v<3e4?1:v<7e4?2:v<15e4?3:4]++);
 const fr=rows.filter(m=>!m.sp);const CC={};fr.forEach(m=>CC[m.side]=(CC[m.side]||0)+1);
 const srt=[...rows].sort((a,b)=>a.dmg-b.dmg);
 const TS=TIERS.map((t,i)=>{const g=P.filter(p=>p.tier===i);const m=g.reduce((s,p)=>s+p.total,0);return{...t,i,g,n:g.length,m,lo:g.length?g[g.length-1].total:0,top:g.length?g[0].total:0,gold:m*GOLD,w:m?g.reduce((s,p)=>s+p.avg*p.total,0)/m:0,md:med(g.flatMap(p=>p.dm))}});
 let c=0;TS.forEach(t=>{c+=t.m;t.cum=tot?c/tot:0});
 return{rows,nd,wf,P,tot,gold:tot*GOLD,days,full,perDay:full.length?full.reduce((s,d)=>s+d.t,0)/full.length:tot/nd,
  gmed:med(dmg),Q:{p10:quant(dmg,.1),p25:quant(dmg,.25),p50:med(dmg),p75:quant(dmg,.75),p90:quant(dmg,.9)},H,CAT,
  foreign:fr.length,CC:Object.entries(CC).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([c,v])=>[D.countries[c],v]),
  both,gini,top5:P.slice(0,5).reduce((s,p)=>s+p.total,0)/tot,cheap:srt.slice(0,10),dear:srt.slice(-10).reverse(),
  big:dmg.filter(v=>v>1e6).length,bigShare:dmg.filter(v=>v>1e6).reduce((s,v)=>s+v,0)/dmg.reduce((s,v)=>s+v,0),TS};
}
const ALL=compute(new Set(DAYS.map(d=>d.i)));
WEEKS.forEach(w=>w.S=compute(new Set(w.days.map(d=>d.i))));

/* ---------- Semana a semana (fijo) ---------- */
(function(){
 const W=WEEKS;const last=FULLW[FULLW.length-1],prev=FULLW[FULLW.length-2];
 const chg=last.S.tot/prev.S.tot-1;
 document.getElementById('wklede').innerHTML=`${FULLW.length} semanas completas, de martes a lunes. La última (${last.label}) cerró con <strong>${es(last.S.tot)} SH</strong> y ${es(last.S.gold)} oro, un <strong class="${chg>=0?'up':'down'}">${chg>=0?'+':''}${pct(chg)}</strong> frente a la anterior. Las semanas incompletas del principio y el final aparecen rayadas y no cuentan para las comparaciones.`;
 // gráfico
 const svg=document.getElementById('wkchart');const L=44,R=630,T=26,B=212,n=W.length,bw=(R-L)/n;
 const max=Math.ceil(Math.max(...W.map(w=>w.S.tot))/500)*500;const y=v=>B-v/max*(B-T);
 let h=`<defs><pattern id="hatchw" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#bbb" stroke-width="2"/></pattern></defs>`;
 for(let v=0;v<=max;v+=500)h+=`<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece8dd"/><text x="${L-6}" y="${y(v)+3}" fill="var(--muted)" font-size="10" text-anchor="end">${es(v)}</text>`;
 let pw=null;
 W.forEach((w,i)=>{const x=L+i*bw+bw*.2,ww=bw*.6,S=w.S;
  h+=`<rect x="${x}" y="${y(S.tot-S.foreign)}" width="${ww}" height="${B-y(S.tot-S.foreign)}" fill="${w.complete?'var(--gold)':'url(#hatchw)'}" stroke="${w.complete?'none':'#bbb'}"><title>${w.label}: ${S.tot} SH</title></rect>`;
  h+=`<rect x="${x}" y="${y(S.tot)}" width="${ww}" height="${y(S.tot-S.foreign)-y(S.tot)}" fill="var(--steel)" opacity="${w.complete?1:.45}"/>`;
  h+=`<text x="${x+ww/2}" y="${y(S.tot)-6}" fill="var(--fg)" font-size="11" font-weight="bold" text-anchor="middle">${es(S.tot)}</text>`;
  if(w.complete&&pw){const c=S.tot/pw.S.tot-1;h+=`<text x="${x-bw*.2}" y="${y(Math.max(S.tot,pw.S.tot))-20}" fill="${c>=0?'#3f8a20':'#c8372d'}" font-size="11" font-weight="bold" text-anchor="middle">${c>=0?'▲ +':'▼ '}${pct(c)}</text>`}
  if(w.complete)pw=w;
  h+=`<text x="${x+ww/2}" y="${B+15}" fill="var(--fg)" font-size="10.5" text-anchor="middle" font-weight="bold">${w.complete?'Semana '+w.num:'Parcial'}</text><text x="${x+ww/2}" y="${B+28}" fill="var(--muted)" font-size="10" text-anchor="middle">${w.complete?w.label:w.days.length+(w.days.length>1?' días':' día')}</text>`});
 h+=`<g font-size="10.5"><rect x="${L}" y="4" width="10" height="10" fill="var(--gold)"/><text x="${L+14}" y="13" fill="var(--muted)">Batallas de España</text><rect x="${L+130}" y="4" width="10" height="10" fill="var(--steel)"/><text x="${L+144}" y="13" fill="var(--muted)">Extranjero</text></g>`;
 svg.innerHTML=h;
 // tabla
 const prevSet=new Set();let pS=null;const rowsH=[];
 FULLW.forEach(w=>{const S=w.S;const ids=new Set(S.P.map(p=>p.id));const nuevos=pS?[...ids].filter(i=>!pS.has(i)).length:null;
  const d=pS?S.tot/w.prevTot-1:null;rowsH.push({w,S,nuevos,d});pS=ids;});
 FULLW.forEach((w,i)=>{if(i)w.prevTot=FULLW[i-1].S.tot});
 const dc=(v,p=true)=>v==null?'<span class="flat">—</span>':`<span class="delta ${v>0?'up':v<0?'down':'flat'}">${v>0?'▲ +':v<0?'▼ ':''}${p?pct(v):es(v)}</span>`;
 let ps=null;
 document.getElementById('wktable').innerHTML=`<table><thead><tr><th>Semana</th><th>Días eRep</th><th class="n">SH</th><th class="n">Oro</th><th class="n">vs anterior</th><th class="n">SH / día</th><th class="n">Pilotos</th><th class="n">Nuevos</th><th class="n">Coste típico</th><th class="n">Top 5</th><th class="n">Extranjero</th><th class="n">Dos bandas</th></tr></thead><tbody>`+
  FULLW.map((w,i)=>{const S=w.S,P0=i?FULLW[i-1].S:null;const ids=new Set(S.P.map(p=>p.id));const nu=P0?S.P.filter(p=>!P0.P.some(q=>q.id===p.id)).length:null;
   return `<tr><td><b>Semana ${w.num}</b> <span style="color:var(--muted)">${w.label}</span></td><td>${es(w.days[0].n)}–${es(w.days[6].n)}</td><td class="n"><b>${es(S.tot)}</b></td><td class="n">${es(S.gold)}</td><td class="n">${dc(P0?S.tot/P0.tot-1:null)}</td><td class="n">${es(S.tot/7)}</td><td class="n">${S.P.length} ${P0?dc(S.P.length-P0.P.length,false):''}</td><td class="n">${nu==null?'—':nu}</td><td class="n">${k(S.gmed)}</td><td class="n">${pct(S.top5)}</td><td class="n">${pct(S.foreign/S.tot)}</td><td class="n">${pct(S.both/S.tot)}</td></tr>`}).join('')+
  `</tbody><tfoot><tr><td>Media semanal</td><td></td><td class="n">${es(FULLW.reduce((s,w)=>s+w.S.tot,0)/FULLW.length)}</td><td class="n">${es(FULLW.reduce((s,w)=>s+w.S.gold,0)/FULLW.length)}</td><td></td><td class="n">${es(FULLW.reduce((s,w)=>s+w.S.tot,0)/FULLW.length/7)}</td><td class="n">${es(FULLW.reduce((s,w)=>s+w.S.P.length,0)/FULLW.length)}</td><td></td><td class="n">${k(ALL.gmed)}</td><td class="n">${pct(FULLW.reduce((s,w)=>s+w.S.top5,0)/FULLW.length)}</td><td class="n">${pct(FULLW.reduce((s,w)=>s+w.S.foreign,0)/FULLW.reduce((s,w)=>s+w.S.tot,0))}</td><td class="n">${pct(FULLW.reduce((s,w)=>s+w.S.both,0)/FULLW.reduce((s,w)=>s+w.S.tot,0))}</td></tr></tfoot></table>`;
 // pilotos x semana
 const ids=[...new Set(FULLW.flatMap(w=>w.S.P.map(p=>p.id)))];
 const PW=ids.map(id=>{const c=FULLW.map(w=>{const p=w.S.P.find(q=>q.id===id);return p?p.total:0});return{id,name:D.names[id],c,tot:c.reduce((s,v)=>s+v,0),d:c[c.length-1]-c[c.length-2]}});
 const lastIds=new Set(last.S.P.map(p=>p.id)),prevIds=new Set(prev.S.P.map(p=>p.id));
 const ups=[...PW].sort((a,b)=>b.d-a.d).slice(0,5),downs=[...PW].sort((a,b)=>a.d-b.d).slice(0,5);
 const altas=PW.filter(p=>lastIds.has(p.id)&&!prevIds.has(p.id)).sort((a,b)=>b.c[b.c.length-1]-a.c[a.c.length-1]);
 const bajas=PW.filter(p=>!lastIds.has(p.id)&&prevIds.has(p.id)).sort((a,b)=>b.c[b.c.length-2]-a.c[a.c.length-2]);
 document.getElementById('movtitle').textContent=`Movimientos: semana ${last.num} frente a semana ${prev.num}`;
 const li=(arr,f)=>arr.slice(0,5).map(p=>`<li>${p.name}<span>${f(p)}</span></li>`).join('')||'<li>Ninguno</li>';
 document.getElementById('movers').innerHTML=
  `<div class="mov"><h4 class="up">▲ Mayores subidas</h4><ol>${li(ups,p=>'+'+p.d)}</ol></div>`+
  `<div class="mov"><h4 class="down">▼ Mayores bajadas</h4><ol>${li(downs,p=>p.d)}</ol></div>`+
  `<div class="mov"><h4>Altas (${altas.length})</h4><ol>${li(altas,p=>p.c[p.c.length-1]+' SH')}</ol></div>`+
  `<div class="mov"><h4>Bajas (${bajas.length})</h4><ol>${li(bajas,p=>p.c[p.c.length-2]+' SH antes')}</ol></div>`;
 let ws='tot',wq='',wall=false;
 function wr(){let r=PW.filter(p=>p.name.toLowerCase().includes(wq));r.sort(ws==='tot'?(a,b)=>b.tot-a.tot:ws==='up'?(a,b)=>b.d-a.d:(a,b)=>a.d-b.d);
  const show=wall||wq?r:r.slice(0,20);
  document.getElementById('wkpilots').innerHTML=`<table><thead><tr><th>Piloto</th>${FULLW.map(w=>`<th class="n" title="${w.label}">Sem. ${w.num}</th>`).join('')}<th class="n">Δ última</th><th class="n">Total</th></tr></thead><tbody>`+
   show.map(p=>{const mx=Math.max(...p.c);return `<tr><td class="pl">${p.name}</td>${p.c.map(v=>`<td class="n ${v===mx&&v>0?'hl':''}">${v||'<span class="flat">·</span>'}</td>`).join('')}<td class="n">${dc(p.d,false)}</td><td class="n"><b>${p.tot}</b></td></tr>`}).join('')+`</tbody></table>`;
  const m=document.getElementById('wmore');m.hidden=show.length>=r.length;m.textContent=`Ver los ${r.length} pilotos`}
 document.getElementById('wq').addEventListener('input',e=>{wq=e.target.value.toLowerCase().trim();wr()});
 document.querySelectorAll('#wsort .chip').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#wsort .chip').forEach(c=>c.setAttribute('aria-pressed',c===b));ws=b.dataset.s;wr()}));
 document.getElementById('wmore').addEventListener('click',()=>{wall=true;wr()});
 wr();
})();

/* ---------- Gráfico día de la semana (fijo, todo el registro) ---------- */
(function(){const full=ALL.full;const order=[2,3,4,5,6,0,1];
 const WK=order.map(w=>{const g=full.filter(d=>d.date.getDay()===w);return{w,n:g.length,avg:g.reduce((s,d)=>s+d.t,0)/g.length}});
 const svg=document.getElementById('weekday');const L=36,R=392,T=14,B=196,max=Math.ceil(Math.max(...WK.map(w=>w.avg))/100)*100+50,bw=(R-L)/7;const y=v=>B-v/max*(B-T);let h='';
 for(let v=0;v<=max;v+=100)h+=`<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece8dd"/><text x="${L-6}" y="${y(v)+3}" fill="var(--muted)" font-size="10" text-anchor="end">${v}</text>`;
 const top=Math.max(...WK.map(w=>w.avg)),bot=Math.min(...WK.map(w=>w.avg));
 WK.forEach((w,i)=>{const x=L+i*bw+bw*.18,ww=bw*.64;const c=w.avg===top?'var(--gold)':w.avg===bot?'var(--red)':'var(--steel)';
  h+=`<rect x="${x}" y="${y(w.avg)}" width="${ww}" height="${B-y(w.avg)}" fill="${c}" fill-opacity="${c==='var(--steel)'?.6:1}"/><text x="${x+ww/2}" y="${y(w.avg)-5}" fill="var(--fg)" font-size="10.5" text-anchor="middle">${es(w.avg)}</text>`;
  h+=`<text x="${x+ww/2}" y="${B+15}" fill="var(--muted)" font-size="10.5" text-anchor="middle">${DN[w.w]}</text><text x="${x+ww/2}" y="${B+28}" fill="var(--muted)" font-size="9" text-anchor="middle">${w.n} días</text>`});
 svg.innerHTML=h;
 window.WKD={top:WK.find(w=>w.avg===top),bot:WK.find(w=>w.avg===bot)};
})();

/* ---------- Periodo seleccionado ---------- */
const OPTS=[{key:'all',title:'Todo',sub:fmtR(DAYS[0].date,DAYS[DAYS.length-1].date),S:ALL,days:DAYS,week:null},
 ...WEEKS.filter(w=>w.complete).map(w=>({key:'s'+w.num,title:'Semana '+w.num,sub:w.label,S:w.S,days:w.days,week:w}))];
document.getElementById('weeks').innerHTML=OPTS.map(o=>`<button data-k="${o.key}" aria-pressed="false">${o.title}<small>${o.sub}</small></button>`).join('');
let CUR=null;

function render(o){
 CUR=o;const S=o.S,P=S.P,tot=S.tot,totGold=S.gold;
 const prevW=o.week?FULLW[FULLW.indexOf(o.week)-1]:null,PS=prevW?prevW.S:null;
 document.querySelectorAll('#weeks button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===o.key));
 const d0=o.days[0],d1=o.days[o.days.length-1];
 document.getElementById('ib-days').textContent=`Days ${es(d0.n)} – ${es(d1.n)}`;
 document.getElementById('ib-dates').textContent=fmtR(d0.date,d1.date)+' 2026';
 // Banner
 document.getElementById('bgold').textContent=es(totGold);
 document.getElementById('blcd').textContent=`${o.days.length} · ${es(tot)} · ${P.length}`;
 const wkGold=totGold/S.wf;
 document.getElementById('bproglbl').firstChild.textContent=o.week?'Objetivo semanal':'Media semanal';
 document.getElementById('bprog').textContent=`${es(wkGold)} / ${es(GOAL)} oro`;
 document.getElementById('bbar').style.width=Math.min(100,wkGold/GOAL*100)+'%';
 // KPIs
 const dl=(cur,prev,mode)=>{if(prev==null)return'';const v=mode==='pp'?cur-prev:cur/prev-1;if(!isFinite(v))return'';const cls=Math.abs(v)<.0005?'flat':v>0?'up':'down';
  return ` <span class="delta ${cls}">${v>0?'▲':v<0?'▼':''} ${mode==='pp'?(v>0?'+':'')+es(v*100,1)+' pp':(v>0?'+':'')+pct(v)}</span>`};
 document.getElementById('kpinote').textContent=prevW?`1 SH = 10 oro · flechas: frente a la semana ${prevW.num}`:'1 SH = 10 oro';
 document.getElementById('kpis').innerHTML=[
  ['gold',es(totGold),'Oro generado',es(tot)+' medallas × 10'+dl(tot,PS&&PS.tot)],
  ['gold',es(S.perDay*GOLD),'Oro al día',(o.week?'media de la semana':'media de '+S.full.length+' días completos')+dl(S.perDay,PS&&PS.perDay)],
  ['',P.length,'Pilotos con SH','media de '+es(totGold/P.length)+' oro por piloto'+dl(P.length,PS&&PS.P.length)],
  ['alert',pct(S.top5),'Oro del top 5','top 10: '+pct(P[9].cum)+dl(S.top5,PS&&PS.top5,'pp')],
  ['alert',es(S.gini,2),'Índice de Gini','0 = reparto igual · 1 = uno lo gana todo'],
  ['',k(S.gmed),'Coste de la SH típica','mediana del daño'+dl(S.gmed,PS&&PS.gmed)],
  ['',pct(S.foreign/tot),'Ganadas en el extranjero',es(S.foreign)+' SH en guerras ajenas'+dl(S.foreign/tot,PS&&PS.foreign/PS.tot,'pp')],
  ['',pct(S.both/tot,0),'Rondas a dos bandas','SH en rondas con ambos bandos españoles'+dl(S.both/tot,PS&&PS.both/PS.tot,'pp')],
 ].map(([c,v,l,s])=>`<div class="kpi ${c}"><span class="l">${l}</span><span class="v">${v}</span><span class="s">${s}</span></div>`).join('');

 // Diario
 (function(){const svg=document.getElementById('daily');const days=S.days;const L=40,R=630,T=14,B=236,n=days.length,bw=(R-L)/n;
  const max=Math.ceil(Math.max(...days.map(d=>d.t))/100)*100+20;const y=v=>B-v/max*(B-T);
  let h=`<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#bbb" stroke-width="2"/></pattern></defs>`;
  for(let v=0;v<max;v+=100)h+=`<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece8dd"/><text x="${L-6}" y="${y(v)+3}" fill="var(--muted)" font-size="10" text-anchor="end">${v}</text>`;
  days.forEach((d,i)=>{if(i&&d.date.getDay()===2&&n>7)h+=`<line x1="${L+i*bw}" x2="${L+i*bw}" y1="${T}" y2="${B+30}" stroke="var(--feedline)" stroke-dasharray="2 3"/>`});
  h+=`<line x1="${L}" x2="${R}" y1="${y(S.perDay)}" y2="${y(S.perDay)}" stroke="var(--fg)" stroke-dasharray="3 4" opacity=".5"/><text x="${R}" y="${y(S.perDay)-5}" fill="var(--fg)" font-size="10" text-anchor="end">media ${es(S.perDay)}</text>`;
  const small=n>16;
  days.forEach((d,i)=>{const x=L+i*bw+bw*.15,w=bw*.7;
   h+=`<rect x="${x}" y="${y(d.s)}" width="${w}" height="${B-y(d.s)}" fill="${d.partial?'url(#hatch)':'var(--gold)'}" stroke="${d.partial?'#bbb':'none'}"><title>${d.s} SH en batallas de España</title></rect>`;
   h+=`<rect x="${x}" y="${y(d.t)}" width="${w}" height="${y(d.s)-y(d.t)}" fill="var(--steel)" opacity="${d.partial?.45:1}"><title>${d.f} SH en el extranjero</title></rect>`;
   if(!small)h+=`<text x="${x+w/2}" y="${y(d.t)-4}" fill="var(--fg)" font-size="9.5" text-anchor="middle">${d.t}</text>`;
   h+=`<text x="${x+w/2}" y="${B+13}" fill="var(--muted)" font-size="${small?8.5:9.5}" text-anchor="middle">${d.date.getDate()}</text><text x="${x+w/2}" y="${B+25}" fill="var(--muted)" font-size="${small?7.5:9}" text-anchor="middle">${small?DN[d.date.getDay()][0]:DN[d.date.getDay()]}</text>`});
  h+=`<text x="${L}" y="${B+40}" fill="var(--muted)" font-size="10">${o.week?fmtR(d0.date,d1.date):'sep – oct 2026 · líneas punteadas: inicio de semana (martes)'}</text>`;
  svg.innerHTML=h})();

 // Por hora (rondas 1-2, hora de Madrid)
 (function(){const rr=S.rows.filter(m=>m.r<=2);const HS=[...Array(24)].map((_,h)=>{const g=rr.filter(m=>m.h===h).map(m=>m.dmg);return{h,n:g.length,md:g.length?med(g):null}});
  const vals=HS.filter(x=>x.n>=5);const all=med(rr.map(m=>m.dmg));
  const svg=document.getElementById('hourly');const L=44,R=630,T=24,B=240,bw=(R-L)/24;const mx=Math.max(...vals.map(x=>x.md),60000);const max=Math.ceil(mx/10000)*10000;const y=v=>B-v/max*(B-T);let h='';
  for(let v=0;v<=max;v+=10000)h+=`<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece8dd"/><text x="${L-6}" y="${y(v)+3}" fill="var(--muted)" font-size="10" text-anchor="end">${v/1000}k</text>`;
  const lo=Math.min(...vals.map(x=>x.md)),hi=Math.max(...vals.map(x=>x.md));
  const col=v=>{const t=(v-lo)/Math.max(1,hi-lo);const c=[[63,155,47],[140,196,60],[74,159,199],[224,144,26],[200,55,45]];const i=Math.min(4,Math.floor(t*5));return`rgb(${c[i].join(',')})`};
  HS.forEach(x=>{const xx=L+x.h*bw+bw*.12,w=bw*.76;
   if(x.md!=null&&x.n>=5){h+=`<rect x="${xx}" y="${y(x.md)}" width="${w}" height="${B-y(x.md)}" fill="${col(x.md)}" rx="1"><title>${x.h}:00–${x.h}:59 · SH típica ${k(x.md)} · ${x.n} SH</title></rect><text x="${xx+w/2}" y="${y(x.md)-4}" fill="var(--muted)" font-size="8.5" text-anchor="middle">${x.n}</text>`}
   else h+=`<text x="${xx+w/2}" y="${B-4}" fill="var(--muted)" font-size="8.5" text-anchor="middle">${x.n||'·'}</text>`;
   h+=`<text x="${xx+w/2}" y="${B+14}" fill="var(--muted)" font-size="9.5" text-anchor="middle">${x.h}</text>`});
  h+=`<line x1="${L}" x2="${R}" y1="${y(all)}" y2="${y(all)}" stroke="var(--fg)" stroke-dasharray="3 4" opacity=".55"/><text x="${L+4}" y="${T-8}" fill="var(--fg)" font-size="10">- - - mediana del periodo: ${k(all)}</text>`;
  h+=`<text x="${(L+R)/2}" y="${B+32}" fill="var(--muted)" font-size="10.5" text-anchor="middle">Hora de Madrid (inicio de la batalla, rondas 1 y 2)</text>`;
  svg.innerHTML=h;
  const srt=[...vals].sort((a,b)=>a.md-b.md);const fh=x=>`${x.h}:00`;
  const blocks=[[0,6,'Madrugada (0–6 h)'],[6,12,'Mañana (6–12 h)'],[12,18,'Tarde (12–18 h)'],[18,24,'Noche (18–24 h)']].map(([a,b,l])=>{const g=rr.filter(m=>m.h>=a&&m.h<b).map(m=>m.dmg);return{l,n:g.length,md:g.length?med(g):0}});
  const bb=[...blocks].sort((a,b)=>a.md-b.md);
  document.getElementById('hournote').innerHTML=`<div class="intel" style="grid-template-columns:1fr">
   <div class="card"><span class="tag green">Horas más baratas</span><p>${srt.slice(0,3).map(x=>`<strong>${fh(x)}</strong> (${k(x.md)})`).join(', ')}.</p></div>
   <div class="card"><span class="tag red">Horas más caras</span><p>${srt.slice(-3).reverse().map(x=>`<strong>${fh(x)}</strong> (${k(x.md)})`).join(', ')}.</p></div>
   <div class="card"><span class="tag blue">Por franjas</span><p>${bb.map(b=>`${b.l}: <strong>${k(b.md)}</strong> <span style="color:var(--muted)">(${b.n} SH)</span>`).join('<br>')}</p></div></div>`;
 })();
 const full=S.full;const best=full.reduce((a,b)=>a.t>b.t?a:b,full[0]),worst=full.reduce((a,b)=>a.t<b.t?a:b,full[0]);
 const fmtD=d=>DN[d.date.getDay()]+' '+d.date.getDate()+' '+MES[d.date.getMonth()];
 const W=window.WKD;
 document.getElementById('rhythmnote').innerHTML=`<div class="intel" style="grid-template-columns:1fr">
  <div class="card"><span class="tag blue">Días de la semana</span><p>Con todo el registro, el mejor día es el <strong>${DF[W.top.w]}</strong> (${es(W.top.avg)} SH de media) y el peor el <strong>${DF[W.bot.w]}</strong> (${es(W.bot.avg)}). La diferencia es del ${pct(W.top.avg/W.bot.avg-1,0)}, con 4 o 5 días de muestra por barra: empieza a ser una tendencia, aunque aún conviene confirmarla.</p></div>
  <div class="card"><span class="tag red">Récords del periodo</span><p>Mejor día: <strong>${fmtD(best)}</strong> con ${best.t} SH (${es(best.t*GOLD)} oro). Peor: <strong>${fmtD(worst)}</strong> con ${worst.t}.</p></div>
  <div class="card"><span class="tag gold">Ritmo</span><p>Media de <strong>${es(S.perDay)} SH al día</strong>${PS?`, frente a ${es(PS.perDay)} la semana anterior`:''}. ${o.week?'':'La media semanal es de '+es(FULLW.reduce((s,w)=>s+w.S.tot,0)/FULLW.length)+' SH.'}</p></div></div>`;

 // Rangos
 const TS=S.TS;const rng=t=>!t.n?'sin pilotos':(t.lo===t.top?t.lo:t.lo+'–'+t.top)+' SH';
 const maxPct=Math.max(...TS.flatMap(t=>[t.n/P.length,t.m/tot]));
 document.getElementById('tiers').innerHTML=TS.map(t=>`<div class="tier t${t.i}"><div class="lbl"><b>${t.k}</b><span>${rng(t)} · ${t.n} pilotos · ${es(t.gold)} oro</span></div>
<div class="rows"><div class="row"><div class="p" style="width:${t.n/P.length/maxPct*100}%"></div><span>${pct(t.n/P.length)}</span></div>
<div class="row"><div class="m" style="width:${t.m/tot/maxPct*100}%"></div><span>${pct(t.m/tot)}</span></div></div></div>`).join('');
 document.getElementById('tiertable').innerHTML=`<table><thead><tr><th>Grupo</th><th class="n">Pilotos</th><th class="n">% pilotos</th><th class="n">Medallas</th><th class="n">Oro</th><th class="n">% del oro</th><th class="n">% acumulado</th><th class="n">Oro / piloto</th><th class="n">Daño mediano</th></tr></thead><tbody>`+
  TS.map(t=>`<tr class="t${t.i}"><td><span class="sw"></span>${t.k} <span style="color:var(--muted);font-size:11px">${rng(t)}</span></td><td class="n">${t.n}</td><td class="n">${pct(t.n/P.length)}</td><td class="n">${es(t.m)}</td><td class="n">${es(t.gold)}</td><td class="n">${pct(t.m/tot)}</td><td class="n cum" style="--w:${t.cum*100}%"><span>${pct(t.cum)}</span></td><td class="n">${t.n?es(t.gold/t.n):'—'}</td><td class="n">${t.n?k(t.md):'—'}</td></tr>`).join('')+
  `</tbody><tfoot><tr><td>Total</td><td class="n">${P.length}</td><td class="n">100 %</td><td class="n">${es(tot)}</td><td class="n">${es(totGold)}</td><td class="n">100 %</td><td class="n"></td><td class="n">${es(totGold/P.length)}</td><td class="n">${k(S.gmed)}</td></tr></tfoot></table>`;
 const top2=TS[0].n+TS[1].n,top2m=TS[0].m+TS[1].m,low=TS[4].g,lowM=low.reduce((s,p)=>s+p.total,0);
 document.getElementById('tiernote').innerHTML=`<strong>Lectura del E.M.:</strong> el 10 % de pilotos con más SH (${top2} pilotos) genera ${es(top2m*GOLD)} oro, el ${pct(top2m/tot)} del total. La mitad inferior (${low.length} pilotos) suma ${es(lowM*GOLD)} oro, el ${pct(lowM/tot)}.`;
 // Curva
 (function(){const svg=document.getElementById('curve');const L=40,R=388,T=12,B=262,N=P.length;
  const x=n=>L+(n/N)*(R-L),y=v=>B-v*(B-T);let h='';
  [0,.25,.5,.75,1].forEach(v=>{h+=`<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece8dd"/><text x="${L-6}" y="${y(v)+3}" fill="var(--muted)" font-size="10" text-anchor="end">${v*100}%</text>`});
  [0,.25,.5,.75,1].forEach(f=>{const n=Math.round(N*f);h+=`<text x="${x(n)}" y="${B+16}" fill="var(--muted)" font-size="10" text-anchor="middle">${n}</text>`});
  h+=`<text x="${(L+R)/2}" y="${B+32}" fill="var(--muted)" font-size="10.5" text-anchor="middle">Nº de pilotos (ordenados por medallas)</text>`;
  h+=`<line x1="${x(0)}" y1="${y(0)}" x2="${x(N)}" y2="${y(1)}" stroke="var(--steel)" stroke-dasharray="4 4" opacity=".7"/>`;
  const pts=[[0,0],...P.map((p,i)=>[i+1,p.cum])];const path=pts.map(([n,v])=>x(n).toFixed(1)+' '+y(v).toFixed(1)).join(' L');
  h+=`<path d="M${path} L${x(N)} ${y(0)} Z" fill="var(--gold-soft)"/><path d="M${path}" fill="none" stroke="var(--gold)" stroke-width="2"/>`;
  const marks=[[top2,'top 10 %'],[top2+TS[2].n,'top 25 %'],[top2+TS[2].n+TS[3].n,'top 50 %']].filter(([n])=>n>0&&n<=N);
  marks.forEach(([n,l])=>{const v=P[n-1].cum;h+=`<circle cx="${x(n)}" cy="${y(v)}" r="4" fill="#fff" stroke="var(--gold)" stroke-width="2"/><text x="${x(n)+8}" y="${y(v)+15}" fill="var(--fg)" font-size="10.5">${l}: ${pct(v,0)}</text>`});
  svg.innerHTML=h})();
 // Daño por rango
 (function(){const svg=document.getElementById('dmg');const L=112,R=360,T=10,B=262,max=120000;const rh=(B-T)/TS.length;
  const x=v=>L+Math.min(v,max)/max*(R-L);let h='';
  [0,40000,80000,120000].forEach(v=>{h+=`<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${B}" stroke="#ece8dd"/><text x="${x(v)}" y="${B+16}" fill="var(--muted)" font-size="10" text-anchor="middle">${v/1000}k</text>`});
  TS.forEach((t,i)=>{const y0=T+i*rh+6;h+=`<text x="${L-8}" y="${y0+15}" fill="var(--fg)" font-size="10.5" text-anchor="end">${t.k}</text>`;
   if(!t.n){h+=`<text x="${L+4}" y="${y0+15}" fill="var(--muted)" font-size="10">sin pilotos</text>`;return}
   const over=t.w>max;
   h+=`<rect x="${L}" y="${y0}" width="${x(t.w)-L}" height="13" fill="var(--gold)"/><text x="${over?x(t.w)-5:x(t.w)+5}" y="${y0+10}" fill="${over?'#fff':'var(--fg)'}" font-size="10" text-anchor="${over?'end':'start'}">${k(t.w)}${over?' →':''}</text>`;
   h+=`<rect x="${L}" y="${y0+16}" width="${x(t.md)-L}" height="9" fill="var(--steel)" fill-opacity=".6"/><text x="${x(t.md)+5}" y="${y0+24}" fill="var(--muted)" font-size="9.5">${k(t.md)}</text>`});
  h+=`<text x="${L}" y="${B+34}" fill="var(--muted)" font-size="10">La media se dispara por unas pocas rondas gigantes.</text>`;
  svg.setAttribute('viewBox','0 0 400 302');svg.innerHTML=h})();
 // Top 20
 const maxT=P[0].total;
 document.getElementById('bars').innerHTML=P.slice(0,20).map(p=>`<div class="bar t${p.tier}"><span class="rk">${p.pos}</span><span class="nm" title="${p.name}">${p.name}</span>
<div class="track2" style="width:${p.total/maxT*100}%" title="${p.total} SH"></div><span class="t">${es(p.gold)} <small>oro</small></span></div>`).join('');

 // Coste
 const Q=S.Q,H=S.H,CAT=S.CAT;
 const CATS=[{k:'Regaladas',r:'menos de 10 k',c:'c0'},{k:'Baratas',r:'10 – 30 k',c:'c1'},{k:'Normales',r:'30 – 70 k',c:'c2'},{k:'Caras',r:'70 – 150 k',c:'c3'},{k:'Carísimas',r:'más de 150 k',c:'c4'}];
 const CC=['#3f9b2f','#8cc43c','#4a9fc7','#e0901a','#c8372d'];const catOf=v=>v<1e4?0:v<3e4?1:v<7e4?2:v<15e4?3:4;
 document.getElementById('costlede').innerHTML=`Cuántas SH se ganaron con cada nivel de daño, en tramos de 5 k. La mitad de las medallas cuesta entre <strong>${k(Q.p25)}</strong> y <strong>${k(Q.p75)}</strong>, y la SH típica sale por <strong>${k(Q.p50)}</strong>${PS?` (la semana anterior, ${k(PS.Q.p50)})`:''}.`;
 (function(){const svg=document.getElementById('hist');const L=40,R=650,T=34,B=238,n=H.length,bw=(R-L)/n;
  const step=o.week?25:100;const max=Math.ceil(Math.max(...H)/step)*step;const y=v=>B-v/max*(B-T);let h='';
  for(let v=0;v<=max;v+=step)h+=`<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#ece8dd"/><text x="${L-6}" y="${y(v)+3}" fill="var(--muted)" font-size="10" text-anchor="end">${v}</text>`;
  H.forEach((v,i)=>{const lo=i*5000,over=i===n-1;const x=L+i*bw+1;const c=over?CC[4]:CC[catOf(lo)];
   h+=`<rect x="${x}" y="${y(v)}" width="${bw-2}" height="${B-y(v)}" fill="${c}"><title>${over?'Más de 150 k':k(lo)+' – '+k(lo+5000)}: ${v} SH</title></rect>`;
   if(over)h+=`<text x="${x+bw/2}" y="${y(v)-4}" fill="var(--fg)" font-size="10" text-anchor="middle">${v}</text>`});
  for(let i=0;i<n-1;i+=5)h+=`<text x="${L+i*bw}" y="${B+14}" fill="var(--muted)" font-size="10" text-anchor="middle">${i*5}k</text>`;
  h+=`<text x="${L+(n-1)*bw+bw/2}" y="${B+14}" fill="var(--muted)" font-size="10" text-anchor="middle">150k+</text><text x="${(L+R)/2}" y="${B+32}" fill="var(--muted)" font-size="10.5" text-anchor="middle">Daño con el que se ganó la SH</text>`;
  const xv=v=>L+Math.min(v,150000)/5000*bw;
  [['P10',Q.p10],['P25',Q.p25],['Mediana',Q.p50],['P75',Q.p75],['P90',Q.p90]].forEach(([l,v],i)=>{const xx=xv(v),yy=i%2?T-6:T-20,m=l==='Mediana';
   h+=`<line x1="${xx}" x2="${xx}" y1="${yy+4}" y2="${B}" stroke="${m?'var(--fg)':'var(--muted)'}" stroke-dasharray="${m?'':'3 3'}" stroke-width="${m?1.5:1}"/><text x="${xx}" y="${yy}" fill="var(--fg)" font-size="10" text-anchor="middle" font-weight="${m?'bold':'normal'}">${l} ${k(v)}</text>`});
  const pk=H[0]+H[1];h+=`<text x="${L+bw}" y="${Math.min(y(pk)-18,B-30)}" fill="#3f7f20" font-size="10" font-weight="bold" text-anchor="middle">Regaladas</text><text x="${L+bw}" y="${Math.min(y(pk)-6,B-18)}" fill="#3f7f20" font-size="10" text-anchor="middle">${pk} SH</text>`;
  svg.innerHTML=h})();
 document.getElementById('catstrip').innerHTML=CAT.map((v,i)=>`<div class="${CATS[i].c}" style="width:${v/tot*100}%" title="${CATS[i].k}: ${v} SH">${v/tot>.06?pct(v/tot,0):''}</div>`).join('');
 document.getElementById('catlegend').innerHTML=CAT.map((v,i)=>`<div><i class="${CATS[i].c}"></i><span><b>${CATS[i].k}</b> <span style="color:var(--muted)">${CATS[i].r}</span><br><b>${es(v)}</b> SH · ${pct(v/tot)}</span></div>`).join('');
 const hunter=[...P].sort((a,b)=>b.u-a.u)[0];
 document.getElementById('costnote').innerHTML=`<strong>Lectura del E.M.:</strong> la curva tiene forma de campana entre 20 k y 100 k, con una cola larga hacia las rondas caras. A la izquierda hay ${CAT[0]} SH ganadas con menos de 10 k${hunter&&hunter.u?`, y <strong>${hunter.u} son de ${hunter.name}</strong>`:''}: esas rondas existen y casi nadie más las caza. Solo el ${pct(CAT[4]/tot,1)} de las medallas pasa de 150 k.`;

 // Rankings
 const rkT=(rows,cls)=>`<table><thead><tr><th class="n">#</th><th>Piloto</th><th class="n">Daño</th><th>Batalla</th><th>Día</th></tr></thead><tbody>`+
  rows.map((m,i)=>`<tr><td class="n">${i+1}</td><td class="pl">${D.names[m.p]}</td><td class="n ${cls}">${es(m.dmg)}</td><td><a href="https://www.erepublik.com/en/military/battlefield/${m.b}" target="_blank" rel="noopener">${cn(D.countries[m.inv])} vs ${cn(D.countries[m.def])}</a> <span style="color:var(--muted);font-size:11.5px">R${m.r} · ${m.a?'atq.':'def.'}</span></td><td>${DAYS[m.d].date.getDate()} ${MES[DAYS[m.d].date.getMonth()]}</td></tr>`).join('')+`</tbody></table>`;
 document.getElementById('cheap').innerHTML=rkT(S.cheap,'dmg-cheap');
 document.getElementById('dear').innerHTML=rkT(S.dear,'dmg-dear');
 // Listas <10k y >100k
 const LOW=P.filter(p=>p.u>0).sort((a,b)=>b.u-a.u||a.mn-b.mn),HIGH=P.filter(p=>p.o>0).sort((a,b)=>b.o-a.o||b.mx-a.mx);
 const lowN=LOW.reduce((s,p)=>s+p.u,0),highN=HIGH.reduce((s,p)=>s+p.o,0);
 document.getElementById('lowlede').innerHTML=`<strong>${lowN} SH</strong> (${pct(lowN/tot)} del total, ${es(lowN*GOLD)} oro) entre ${LOW.length} pilotos.`;
 document.getElementById('highlede').innerHTML=`<strong>${highN} SH</strong> (${pct(highN/tot)} del total, ${es(highN*GOLD)} oro) entre ${HIGH.length} pilotos.`;
 const LIST={low:false,high:false};
 const drawL=()=>{const lr=LIST.low?LOW:LOW.slice(0,15),hr=LIST.high?HIGH:HIGH.slice(0,15);
  document.getElementById('lowlist').innerHTML=`<table><thead><tr><th class="n">#</th><th>Piloto</th><th class="n">SH &lt;10 k</th><th class="n">% de sus SH</th><th class="n">Más barata</th><th class="n">Oro</th></tr></thead><tbody>`+
   (lr.map((p,i)=>`<tr><td class="n">${i+1}</td><td class="pl">${p.name}</td><td class="n dmg-cheap">${p.u}</td><td class="n">${pct(p.u/p.total,0)}</td><td class="n">${es(p.mn)}</td><td class="n">${es(p.u*GOLD)}</td></tr>`).join('')||'<tr><td colspan="6" style="color:var(--muted)">Nadie esta semana.</td></tr>')+`</tbody></table>`;
  document.getElementById('highlist').innerHTML=`<table><thead><tr><th class="n">#</th><th>Piloto</th><th class="n">SH &gt;100 k</th><th class="n">% de sus SH</th><th class="n">Mayor SH</th><th class="n">Daño medio</th></tr></thead><tbody>`+
   (hr.map((p,i)=>`<tr><td class="n">${i+1}</td><td class="pl">${p.name}</td><td class="n dmg-dear">${p.o}</td><td class="n">${pct(p.o/p.total,0)}</td><td class="n">${k(p.mx)}</td><td class="n">${k(p.oD/p.o)}</td></tr>`).join('')||'<tr><td colspan="6" style="color:var(--muted)">Nadie esta semana.</td></tr>')+`</tbody></table>`;
  const lm=document.getElementById('lowmore'),hm=document.getElementById('highmore');
  lm.hidden=LIST.low||LOW.length<=15;lm.textContent=`Ver los ${LOW.length} pilotos`;hm.hidden=LIST.high||HIGH.length<=15;hm.textContent=`Ver los ${HIGH.length} pilotos`};
 document.getElementById('lowmore').onclick=()=>{LIST.low=true;drawL()};document.getElementById('highmore').onclick=()=>{LIST.high=true;drawL()};
 drawL();
 const minSH=o.week?10:40;const elig=P.filter(p=>p.total>=minSH);
 document.getElementById('effnote').textContent=`Menor daño mediano por SH, mínimo ${minSH} medallas.`;
 document.getElementById('dearnote').textContent=`Mayor daño mediano por SH, mínimo ${minSH} medallas.`;
 const prT=(rows,cls)=>`<table><thead><tr><th class="n">#</th><th>Piloto</th><th class="n">SH</th><th class="n">Daño mediano</th><th class="n">SH más barata</th></tr></thead><tbody>`+
  rows.map((p,i)=>`<tr><td class="n">${i+1}</td><td class="pl">${p.name}</td><td class="n">${p.total}</td><td class="n ${cls}">${k(p.med)}</td><td class="n">${es(p.mn)}</td></tr>`).join('')+`</tbody></table>`;
 const eff=[...elig].sort((a,b)=>a.med-b.med);
 document.getElementById('effp').innerHTML=prT(eff.slice(0,10),'dmg-cheap');
 document.getElementById('dearp').innerHTML=prT([...elig].sort((a,b)=>b.med-a.med).slice(0,10),'dmg-dear');


 // Extranjero
 const LG=P.filter(p=>p.f>0).sort((a,b)=>b.f-a.f);const top5f=LG.slice(0,5).reduce((s,p)=>s+p.f,0);
 document.getElementById('legionlede').innerHTML=`Medallas ganadas en batallas donde España no es ni atacante ni defensora: <strong>${es(S.foreign)} SH</strong> (${pct(S.foreign/tot)} del total, ${es(S.foreign*GOLD)} oro), repartidas entre ${LG.length} pilotos.`;
 document.getElementById('legion').innerHTML=`<table><thead><tr><th>Piloto</th><th class="n">SH fuera</th><th class="n">% de sus SH</th><th class="n">Daño mediano</th><th>Bando favorito</th></tr></thead><tbody>`+
  LG.slice(0,12).map(p=>`<tr><td class="pl">${p.name}</td><td class="n">${p.f}</td><td class="n">${pct(p.f/p.total,0)}</td><td class="n ${p.fm>4*S.gmed?'warn':''}">${k(p.fm)}</td><td>${cn(p.fcn)}</td></tr>`).join('')+`</tbody></table>`;
 (function(){const svg=document.getElementById('countries');const C=S.CC;const L=130,R=360,T=6,rh=29;const max=Math.max(...C.map(c=>c[1]));
  const x=v=>L+v/max*(R-L);let h='';
  C.forEach(([c,v],i)=>{const y0=T+i*rh;h+=`<text x="${L-8}" y="${y0+14}" fill="var(--fg)" font-size="10.5" text-anchor="end">${cn(c)}</text><rect x="${L}" y="${y0+4}" width="${x(v)-L}" height="14" fill="var(--steel)" rx="2"/><text x="${x(v)+5}" y="${y0+15}" fill="var(--fg)" font-size="10">${v}</text>`});
  svg.setAttribute('viewBox',`0 0 400 ${T+C.length*rh+4}`);svg.innerHTML=h})();
 const lf=LG[0];
 document.getElementById('legionnote').innerHTML=lf?`<strong>Lectura del E.M.:</strong> los 5 primeros legionarios ganan el ${pct(top5f/S.foreign,0)} de las SH extranjeras. <strong>${lf.name}</strong> lidera: ${pct(lf.f/lf.total,0)} de sus medallas son fuera, con una SH típica de ${k(lf.fm)}.`:'';

}
document.querySelectorAll('#weeks button').forEach(b=>b.addEventListener('click',()=>{render(OPTS.find(o=>o.key===b.dataset.k))}));
/* ---------- Registro de pilotos con varias semanas ---------- */
const RG={weeks:new Set(FULLW.slice(-2).map(w=>w.num)),f:'all',q:'',k:'r',dir:1,all:false,zeros:true,rows:[],ws:[]};
const WKC=FULLW.map(w=>{const ds=new Set(w.days.map(d=>d.i));const c=new Map(),dm=new Map();
 M.forEach(m=>{if(ds.has(m.d)){c.set(m.p,(c.get(m.p)||0)+1);if(!dm.has(m.p))dm.set(m.p,[]);dm.get(m.p).push(m.dmg)}});
 const bh=new Map(),ch=new Map(),B=(D.bh||{})[isoL(w.start)]||[];for(let i=0;i<B.length;i+=3){bh.set(B[i],B[i+1]);ch.set(B[i],B[i+2])}
 return{c,dm,bh,ch,hasB:B.length>0}});
const wkLabel=ws=>{if(!ws.length)return'';const nums=ws.map(w=>w.num);const consec=nums.every((n,i)=>!i||n===nums[i-1]+1);
 const sem=ws.length===1?'semana '+nums[0]:consec?'semanas '+nums[0]+'–'+nums[nums.length-1]:'semanas '+nums.join(', ');
 return sem+(consec?' ('+fmtR(ws[0].start,ws[ws.length-1].end)+')':'')};
function regData(){
 const ws=FULLW.filter(w=>RG.weeks.has(w.num));RG.ws=ws;
 const idx=ws.map(w=>FULLW.indexOf(w));
 const rows=D.names.map((name,id)=>{const wk=idx.map(i=>WKC[i].c.get(id)||0);const total=wk.reduce((s,v)=>s+v,0);
  const dm=idx.flatMap(i=>WKC[i].dm.get(id)||[]);
  const bh=idx.reduce((s,i)=>s+(WKC[i].bh.get(id)||0),0),ch=idx.reduce((s,i)=>s+(WKC[i].ch.get(id)||0),0);
  return{id,name,wk,total,med:med(dm),gold:total*GOLD,bh,ch}});
 RG.hasB=idx.some(i=>WKC[i].hasB);
 const act=rows.filter(r=>r.total>0).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));const N=act.length;
 act.forEach((r,i)=>{const r0=act.findIndex(q=>q.total===r.total)+1;r.r=r0;r.pctl=Math.ceil(r0/N*100);r.fondo=r0/N>0.6;
  r.grp=TIERS[TIERS.findIndex(t=>r0/N<=t.hi+1e-9)].k});
 rows.filter(r=>r.total===0).forEach(r=>{r.r=N+1;r.pctl=null;r.fondo=true;r.grp='Sin SH'});
 RG.rows=rows;RG.N=N;return rows;
}
function regFiltered(){
 let r=RG.rows.filter(p=>(RG.zeros||p.total>0)&&(RG.f==='all'||(RG.f==='fondo'?p.fondo:!p.fondo))&&p.name.toLowerCase().includes(RG.q));
 const k=RG.k,dir=RG.dir;
 r.sort((a,b)=>{let x=a[k],y=b[k];if(k==='name')return x.localeCompare(y)*dir;if(x==null)x=999;if(y==null)y=999;return (x-y)*dir||b.total-a.total||a.name.localeCompare(b.name)});
 return r;
}
function renderRegWeeks(){
 document.getElementById('regweeks').innerHTML=FULLW.map(w=>`<label><input type="checkbox" id="rw${w.num}" value="${w.num}" ${RG.weeks.has(w.num)?'checked':''}> Sem. ${w.num} <small>${w.label}</small></label>`).join('');
 document.querySelectorAll('#regweeks input').forEach(c=>c.addEventListener('change',()=>{
  if(c.checked)RG.weeks.add(+c.value);else if(RG.weeks.size>1)RG.weeks.delete(+c.value);else c.checked=true;
  RG.all=false;regData();renderReg()}));
}
function renderReg(){
 const ws=RG.ws,act=RG.rows.filter(r=>r.total>0),fondoAct=act.filter(r=>r.fondo),zeros=RG.rows.filter(r=>r.total===0);
 const cut=fondoAct.length?Math.max(...fondoAct.map(r=>r.total)):0;
 document.getElementById('regsum').innerHTML=`<strong>${wkLabel(ws)}</strong>: ${act.length} pilotos con SH. El fondo (P60–P100) lo forman <strong>${fondoAct.length} pilotos con ${cut} SH o menos</strong>, más <strong>${zeros.length}</strong> pilotos del registro sin ninguna SH en estas semanas.`;
 const multi=ws.length>1;
 const th=(k,l,n)=>`<th${n?' class="n"':''}><button data-k="${k}" ${RG.k===k?'data-active':''}>${l}</button></th>`;
 document.getElementById('reghead').innerHTML=`<tr>${th('r','#',1)}${th('name','Piloto')}${multi?ws.map((w,i)=>`<th class="n" title="${w.label}">Sem. ${w.num}</th>`).join(''):''}${th('total','SH',1)}${th('pctl','Percentil',1)}<th>Grupo</th>${th('fondoN','Fondo P60–P100')}${th('gold','Oro',1)}${th('med','Daño mediano',1)}${RG.hasB?th('bh','BH',1)+th('ch','CH',1):''}</tr>`;
 document.querySelectorAll('#reghead button').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.k;if(RG.k===k)RG.dir*=-1;else{RG.k=k;RG.dir=(k==='name'||k==='r'||k==='pctl'||k==='fondoN')?1:-1}renderReg()}));
 RG.rows.forEach(r=>r.fondoN=r.fondo?0:1);
 const r=regFiltered();const show=RG.all||RG.q?r:r.slice(0,30);
 document.getElementById('tb').innerHTML=show.map(p=>`<tr class="${p.total?'':'zero'}"><td class="n">${p.total?p.r:'—'}</td><td class="pl">${p.name}</td>${multi?p.wk.map(v=>`<td class="n">${v||'<span class="flat">·</span>'}</td>`).join(''):''}<td class="n"><b>${p.total}</b></td><td class="n">${p.pctl==null?'—':`<span class="pc">P${p.pctl}</span>`}</td><td>${p.grp}</td><td>${p.fondo?'<span class="pill-f">Sí</span>':'<span class="pill-n">No</span>'}</td><td class="n">${es(p.gold)}</td><td class="n">${p.total?k(p.med):'—'}</td>${RG.hasB?`<td class="n">${p.bh||'<span class="flat">·</span>'}</td><td class="n">${p.ch||'<span class="flat">·</span>'}</td>`:''}</tr>`).join('')||`<tr><td colspan="12" style="color:var(--muted)">Ningún piloto coincide con la búsqueda.</td></tr>`;
 const m=document.getElementById('more');m.hidden=show.length>=r.length;m.textContent=`Ver los ${r.length} pilotos`;
}
document.getElementById('q').addEventListener('input',e=>{RG.q=e.target.value.toLowerCase().trim();renderReg()});
document.querySelectorAll('#chips .chip').forEach(b=>b.addEventListener('click',()=>{RG.f=b.dataset.f;RG.all=false;document.querySelectorAll('#chips .chip').forEach(c=>c.setAttribute('aria-pressed',c===b));renderReg()}));
document.getElementById('zeros').addEventListener('change',e=>{RG.zeros=e.target.checked;renderReg()});
document.getElementById('more').addEventListener('click',()=>{RG.all=true;renderReg()});
document.getElementById('rw2').addEventListener('click',()=>{RG.weeks=new Set(FULLW.slice(-2).map(w=>w.num));RG.all=false;renderRegWeeks();regData();renderReg()});
document.getElementById('rwall').addEventListener('click',()=>{RG.weeks=new Set(FULLW.map(w=>w.num));RG.all=false;renderRegWeeks();regData();renderReg()});
renderRegWeeks();regData();renderReg();

const VIEW={v:'day'};
function setView(v){VIEW.v=v;document.getElementById('dayview').hidden=v!=='day';document.getElementById('hourview').hidden=v!=='hour';
 document.getElementById('vday').setAttribute('aria-pressed',v==='day');document.getElementById('vhour').setAttribute('aria-pressed',v==='hour')}
document.getElementById('vday').addEventListener('click',()=>setView('day'));
document.getElementById('vhour').addEventListener('click',()=>setView('hour'));
render(OPTS[OPTS.length-1]);
