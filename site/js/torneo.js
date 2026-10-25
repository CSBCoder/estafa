// ESTAFA · concurso bisemanal "¡Despega del fondo!": premios por escalones subidos × factor nacional.
// Usa D, M, MES, REF, REFN, fmtR, es y pct de estafa.js. Configuración en data/torneos.json (llega en D.torneos).
// Todo se recalcula en el navegador con los datos del día.
(function(){
const C=D.torneos,sec=document.getElementById('torneo');
if(!C){document.getElementById('tab-torneo').remove();document.querySelector('nav a[data-tab="torneo"]').remove();return}
const DUR=C.duracion_dias||14,FONDO=(C.fondo_percentil||60)/100,CC=C.moneda||'cc',NT=C.num_torneos||99;
const PRZ=C.premios_escalon||[3000,8000,15000,60000,0],F=C.factor||{};
const MIN=C.min_sh??3,MEJ=C.mejora_minima??2,MINR=C.min_sh_reactivacion??1,TOPE=C.tope_bloque||Infinity;
const AMP=F.amplificacion??3,FMIN=F.minimo??.5,FMAX=F.maximo??2;
const addD=(s,n)=>{const t=new Date(s+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
const dt=s=>new Date(s+'T12:00:00');
const nd=(a,b)=>Math.round((dt(b)-dt(a))/864e5)+1;   // días entre a y b, ambos incluidos
const rg=(a,b)=>fmtR(dt(a),dt(b));
const dm=s=>dt(s).getDate()+' '+MES[dt(s).getMonth()];
const erep=s=>REFN+Math.round((dt(s)-REF)/864e5);
const money=v=>es(Math.round(v))+' '+CC;
const fx=f=>'×'+es(f,2);
const sg=v=>(v>0?'+':'')+pct(v);
const LAST=D.days[D.days.length-1];                  // último día con datos (siempre a medias)

// Niveles: 0 sin SH, 1 P80–P100, 2 P60–P80, 3 P40–P60, 4 P20–P40, 5 P0–P20
const LV=['Sin SH','P80–P100','P60–P80','P40–P60','P20–P40','P0–P20'];
const THR=[null,null,.8,.6,.4,.2];
const lvl=f=>f==null?0:f<=.2?5:f<=.4?4:f<=.6?3:f<=.8?2:1;
const stepTxt=i=>`${LV[i]} → ${LV[i+1]}`;
const base=(a,b)=>PRZ.slice(a,Math.max(a,b)).reduce((s,v)=>s+v,0);

// SH por piloto entre dos días (incluidos)
function count(a,b){const c=new Map();M.forEach(m=>{const s=D.days[m.d];if(s>=a&&s<=b)c.set(m.p,(c.get(m.p)||0)+1)});return c}
const sum=c=>[...c.values()].reduce((s,v)=>s+v,0);
// Puestos desde arriba; los empatados se quedan con el mejor puesto
function rank(c){const act=[...c].filter(x=>x[1]>0).sort((x,y)=>y[1]-x[1]);const N=act.length,R=new Map();let r0=1;
 act.forEach(([p,v],i)=>{if(i&&v<act[i-1][1])r0=i+1;R.set(p,{v,r:r0,f:r0/N})});return{N,R,act}}
// SH mínimas para estar en el nivel L: las del último piloto que entra en ese percentil
function cut(rk,L){if(L<=1)return 1;const cp=Math.floor(THR[L]*rk.N);return cp?rk.act[cp-1][1]:null}

// Premio base de un piloto, con la regla anti-chollo
function prize(from,to,tot,prev){
 const need=Math.max(MIN,prev+MEJ);
 if(to<=from)return{b:0,need,why:to<from?'ha bajado de nivel':'aún no ha subido de nivel'};
 if(from===0&&to===1)return tot>=MINR?{b:PRZ[0],need}:{b:0,need,why:'sin SH'};
 if(tot>=need)return{b:base(from,to),need};
 if(from===0&&tot>=MINR)return{b:PRZ[0],need,why:`solo cobra la reactivación: para el resto necesita ${need} SH`};
 return{b:0,need,why:`necesita al menos ${need} SH para cobrar (regla anti-chollo)`};
}

// Referencia del factor nacional (semanas 6–7 por defecto)
const R0=F.referencia_desde||'2026-10-06',R1=F.referencia_hasta||'2026-10-19',RD=nd(R0,R1);
const refSH=sum(count(R0,R1))/RD*DUR;
const apiW=(a,b)=>Object.entries(D.api||{}).filter(([w])=>w>=a&&w<=b).map(([,v])=>v);   // [oro, SH, BH] por semana
const refAPI=apiW(R0,R1),refGold=refAPI.reduce((s,v)=>s+v[0],0)/RD*DUR,refGps=refAPI.length?refAPI.reduce((s,v)=>s+v[0],0)/refAPI.reduce((s,v)=>s+v[1],0):null;
const useGold=F.usar_oro!==false&&refAPI.length>0;

function factor(t){
 if(t.st==='proximo')return null;
 let sh,proj=false;
 if(t.st==='terminado')sh=sum(count(t.s,t.e));
 else{const fe=addD(LAST,-1);if(fe<t.s)return{f:1,none:true};sh=sum(count(t.s,fe))/nd(t.s,fe)*DUR;proj=true}
 const vs=sh/refSH-1;let vg=null,gold=null;
 const w=apiW(t.s,t.e);
 if(useGold&&w.length){
  if(t.st==='terminado'){gold=w.reduce((s,v)=>s+v[0],0);vg=gold/refGold-1}
  else{const gps=w.reduce((s,v)=>s+v[0],0)/w.reduce((s,v)=>s+v[1],0);vg=(1+vs)*gps/refGps-1;gold=refGold*(1+vg)}  // oro por SH de la API aplicado a las SH previstas
 }
 const v=vg==null?vs:(vs+vg)/2,raw=1+AMP*v;
 return{f:Math.round(Math.min(FMAX,Math.max(FMIN,raw))*100)/100,raw,sh,vs,vg,gold,v,proj};
}

function make(n,s){
 const e=addD(s,DUR-1),q0=addD(s,-DUR),q1=addD(s,-1),X=(C.torneos||{})[n]||{};
 const st=LAST<s?'proximo':LAST>e?'terminado':'curso';
 const qc=rank(count(q0,q1)),ins=new Set((X.inscritos||[]).map(Number));
 const tc=rank(count(s,e));
 const W=[];for(let a=s;a<=e;a=addD(a,7))W.push({a,b:addD(a,6)<e?addD(a,6):e});
 W.forEach(w=>w.c=count(w.a,w.b));
 // Cortes previstos al final: los de los días completos, estirados a toda la duración
 let fc=null,nf=0;const fe=addD(LAST,-1)<e?addD(LAST,-1):e;
 if(st==='curso'&&fe>=addD(s,1)){fc=rank(count(s,fe));nf=nd(s,fe)}
 const proj=L=>{if(!fc)return null;const c=cut(fc,L);return c==null?null:Math.max(c,Math.round(c/nf*DUR))};
 const FX=factor({st,s,e});
 const rows=[];
 D.names.forEach((name,p)=>{
  const q=qc.R.get(p);if(q&&q.f<=FONDO)return;   // fuera del fondo no participa; sin SH en la clasificación, sí
  if(ins.size&&!ins.has(D.ids[p]))return;
  const from=q?lvl(q.f):0,prev=q?q.v:0,r=tc.R.get(p),tot=r?r.v:0,to=r?lvl(r.f):0;
  const pz=st==='proximo'?{b:0,need:Math.max(MIN,prev+MEJ)}:prize(from,to,tot,prev);
  const tg=Math.max(from,to)>=4?null:Math.max(from,to)+1,tc0=tg?cut(tc,tg):null;   // siguiente escalón con premio
  const goal=tc0==null?null:Math.max(tc0,tg===1?MINR:pz.need);
  rows.push({p,name,q,r,from,to,tot,prev,wk:W.map(w=>w.c.get(p)||0),...pz,tg,goal,falta:goal==null?null:Math.max(0,goal-tot),gain:tg?base(from,tg)-pz.b:0})});
 // Premios con factor y, si se pasa del tope, recorte proporcional
 const f=FX?FX.f:1,tot0=rows.reduce((s,r)=>s+r.b*f,0),rec=tot0>TOPE?TOPE/tot0:1;
 rows.forEach(r=>r.pay=Math.round(r.b*f*rec));
 rows.sort((a,b)=>b.pay-a.pay||b.tot-a.tot||(a.q?a.q.v:0)-(b.q?b.q.v:0)||a.name.localeCompare(b.name));
 const done=st==='curso'?nd(s,LAST):st==='terminado'?DUR:0;
 return{n,s,e,q0,q1,X,st,qc,tc,W,rows,proj,FX,rec,paid:rows.reduce((s,r)=>s+r.pay,0),done};
}
// Todos los bloques ya empezados y el siguiente, hasta num_torneos
const T=[];for(let n=1;n<=NT;n++){const s=addD(C.inicio,(n-1)*DUR);T.push(make(n,s));if(s>LAST)break}
const ENDC=addD(C.inicio,NT*DUR-1);   // último día del concurso

// Bote final: lo que sobre, para el piloto del fondo del primer bloque con más SH en todo el concurso
function bote(){
 const spent=T.filter(t=>t.st!=='proximo').reduce((s,t)=>s+t.paid,0),left=(C.presupuesto_total||0)-spent;
 const c=count(C.inicio,ENDC),el=T[0].rows.map(r=>[r.p,c.get(r.p)||0]).sort((a,b)=>b[1]-a[1]);
 const lead=el.length&&el[0][1]?el.filter(x=>x[1]===el[0][1]):[];
 return{spent,left,lead,max:lead.length?lead[0][1]:0,closed:LAST>ENDC};
}

const STL={curso:'En curso',terminado:'Terminado',proximo:'Próximo'};
const ST={t:null,p:null,f:'all',all:false};
const $=id=>document.getElementById(id);
$('tsel').innerHTML=T.map(t=>`<button data-n="${t.n}" aria-pressed="false">Bloque ${t.n}<small>${rg(t.s,t.e)} · ${STL[t.st].toLowerCase()}</small></button>`).join('');
$('tlist').innerHTML=D.names.map(n=>`<option value="${n.replace(/"/g,'&quot;')}">`).join('');

function head(t){
 const left=nd(LAST,t.e)-1;
 const bar=t.st==='proximo'?`Empieza el martes ${dm(t.s)}: faltan ${nd(LAST,t.s)-1} días`:
  t.st==='curso'?`Día ${t.done} de ${DUR} · ${left>0?`quedan ${left} días`:'último día'}`:'Bloque cerrado';
 $('tnote').textContent=`${NT} bloques de ${DUR} días · ${rg(C.inicio,ENDC)}`;
 $('thead').innerHTML=`<div class="tstat"><span class="tbadge ${t.st}">${STL[t.st]}</span><b>Bloque ${t.n} de ${NT}</b><span>${rg(t.s,t.e)} · days ${es(erep(t.s))}–${es(erep(t.e))} · nivel de salida: ${rg(t.q0,t.q1)}</span>
  <div class="tprog"><div class="track"><div style="width:${t.done/DUR*100}%"></div></div><span>${bar}</span></div></div>`;
 // Factor nacional
 const X=t.FX;
 $('tfactor').innerHTML=!X?`<div class="tfx"><div class="lcd"><b>—</b><span>FACTOR NACIONAL</span></div><p>El factor se calcula cuando empiece el bloque: compara las SH${useGold?' y el oro':''} de España con la referencia de ${rg(R0,R1)} (${es(refSH)} SH en ${DUR} días).</p></div>`:
  X.none?`<div class="tfx"><div class="lcd"><b>×1,00</b><span>FACTOR NACIONAL</span></div><p>Todavía no hay ningún día completo en el bloque. El factor empezará a moverse mañana.</p></div>`:
  `<div class="tfx"><div class="lcd"><b>${fx(X.f)}</b><span>FACTOR NACIONAL${X.proj?' · PREVISTO':''}</span></div>
   <p>${X.proj?`Al ritmo de los días completos, España acabaría el bloque con <strong>≈ ${es(X.sh)} SH</strong>`:`España hizo <strong>${es(X.sh)} SH</strong> en el bloque`}, un <strong class="${X.vs>=0?'up':'down'}">${sg(X.vs)}</strong> frente a la referencia (${es(refSH)} SH, ${rg(R0,R1)}).
   ${X.vg!=null?`El oro total (BH + SH) ${X.proj?'va':'fue'} un <strong class="${X.vg>=0?'up':'down'}">${sg(X.vg)}</strong> (referencia ${es(refGold)}).`:''}</p>
   <p class="fml">Factor = 1 + ${AMP} × ${X.vg!=null?`media(${sg(X.vs)}, ${sg(X.vg)})`:sg(X.vs)} = ${es(X.raw,2)}${X.raw<FMIN||X.raw>FMAX?` → ${fx(X.f)} (el factor va de ${fx(FMIN)} a ${fx(FMAX)})`:''}. Todos los premios del bloque se multiplican por él: si España vuela más, todos cobran más.</p></div>`;
 const B=bote(),win=t.rows.filter(r=>r.pay>0),zero=t.rows.filter(r=>!r.q).length;
 const K=t.st==='proximo'?[
  ['gold',t.rows.length,'Pilotos clasificados (provisional)',`${t.rows.length-zero} del fondo + ${zero} sin SH`],
  ['',rg(t.q0,t.q1),'Nivel de salida','todavía en juego: la lista cambia cada día'],
  ['gold',money(B.left),'Presupuesto que queda',`de ${money(C.presupuesto_total||0)}`]
 ]:[
  ['',t.rows.length,'Pilotos que compiten',`${t.rows.length-zero} del fondo + ${zero} sin SH en ${rg(t.q0,t.q1)}`],
  ['gold',win.length,t.st==='terminado'?'Premiados':'Premiados si acabara hoy',`${win.filter(r=>r.to>=4).length} saltos al P20–P40`],
  ['gold',money(t.paid),t.st==='terminado'?'Premios del bloque':'Premios si acabara hoy',t.rec<1?`recortados al ${pct(t.rec,0)} por el tope de ${money(TOPE)}`:`tope por bloque: ${money(TOPE)}`],
  ['',money(B.left),B.closed?'Bote final':'Quedaría para el bote',`de ${money(C.presupuesto_total||0)} de presupuesto`]
 ];
 $('tkpis').innerHTML=K.map(([c,v,l,s])=>`<div class="kpi ${c}"><span class="l">${l}</span><span class="v">${v}</span><span class="s">${s}</span></div>`).join('');
 $('tnotes').innerHTML=(t.X.nota?`<p class="lede" style="margin:10px 0 0">${t.X.nota}</p>`:'')+
  ((t.X.inscritos||[]).length?`<p class="lede" style="margin:6px 0 0">Solo compiten los ${t.X.inscritos.length} pilotos inscritos que cumplen los requisitos.</p>`:'');
 // Escalones
 const pr=t.st==='proximo';
 $('tsteps').innerHTML=`<table><thead><tr><th>Escalón</th><th class="n">Premio base</th>${pr?'':`<th class="n">Con el factor</th><th class="n">SH para llegar${t.st==='curso'?' hoy':''}</th>${t.st==='curso'?'<th class="n">Previsto al final</th>':''}<th class="n">Lo consiguen</th>`}</tr></thead><tbody>`+
  PRZ.map((v,i)=>{const L=i+1,c=cut(t.tc,L),got=t.rows.filter(r=>r.from<=i&&r.to>=L&&r.b>0).length;
   return `<tr class="${v===Math.max(...PRZ)?'star':''}"><td>${v===Math.max(...PRZ)?'⭐ ':''}${stepTxt(i)}</td><td class="n">${v?money(v):'0 (no se premia)'}</td>${pr?'':`<td class="n">${v?money(v*t.FX.f):'—'}</td><td class="n">${c==null?'—':c+' SH'}</td>${t.st==='curso'?`<td class="n">${L<=1?'1 SH':t.proj(L)==null?'—':'≈ '+t.proj(L)+' SH'}</td>`:''}<td class="n">${v?got:'—'}</td>`}</tr>`}).join('')+`</tbody></table>`;
}

function card(){
 const t=ST.t,p=ST.p,el=$('tcard');
 if(p==null){el.innerHTML='';return}
 const name=D.names[p],row=t.rows.find(r=>r.p===p),q=t.qc.R.get(p),r=t.tc.R.get(p);
 const qtxt=q?`${q.v} SH en ${rg(t.q0,t.q1)} (P${Math.ceil(q.f*100)})`:`ninguna SH en ${rg(t.q0,t.q1)}`;
 if(!row){
  const why=q&&q.f<=FONDO?(t.st==='proximo'?`De momento no entra en el bloque ${t.n}: lleva ${q.v} SH en ${rg(t.q0,t.q1)} (P${Math.ceil(q.f*100)}), fuera del P${Math.round(FONDO*100)}–P100. La lista se cierra el ${dm(t.q1)}.`:
   `No compite en el bloque ${t.n}: ${qtxt}, fuera del P${Math.round(FONDO*100)}–P100.`):`Cumple los requisitos (${qtxt}), pero no está en la lista de inscritos.`;
  el.innerHTML=`<div class="tcard no"><h3>${name}</h3><p>${why}</p>
   ${r?`<p>En el bloque lleva <strong>${r.v} SH</strong> (puesto ${r.r} de ${t.tc.N}, P${Math.ceil(r.f*100)}).</p>`:''}</div>`;return}
 if(t.st==='proximo'){el.innerHTML=`<div class="tcard ok"><div class="big">Clasificado (provisional)</div><h3>${name}</h3>
  <p>Saldría del nivel <strong>${LV[row.from]}</strong>: ${qtxt}. La lista se cierra el ${dm(t.q1)}.</p>
  <p>Si se mantiene, para cobrar en el bloque ${t.n} tendrá que subir de nivel con al menos ${row.need} SH.</p></div>`;return}
 const left=t.st==='curso'?Math.max(1,nd(LAST,t.e)-1):0,fin=t.st==='terminado';
 const big=row.pay?`${fin?'Premio':'Premio si acabara hoy'}: ${money(row.pay)}`:fin?'Sin premio':'Sin premio por ahora';
 const ladder=row.b?`${row.from===0&&row.b===PRZ[0]&&row.to>1?stepTxt(0):PRZ.map((v,i)=>i>=row.from&&i<row.to?`${stepTxt(i)} (${es(v)})`:null).filter(Boolean).join(' + ')} = ${money(row.b)} × ${es(t.FX.f,2)}${t.rec<1?` × ${pct(t.rec,0)} (recorte)`:''} = <strong>${money(row.pay)}</strong>`:'';
 const tp=row.tg?t.proj(row.tg):null,gtxt=row.gain>0?` (+${money(row.gain*t.FX.f)})`:'';
 el.innerHTML=`<div class="tcard ${row.pay?'ok':'out'}"><div class="big">${big}</div><h3>${name}</h3>
  <p>Salida: <strong>${LV[row.from]}</strong> (${q?`${q.v} SH en ${rg(t.q0,t.q1)}, P${Math.ceil(q.f*100)}`:`ninguna SH en ${rg(t.q0,t.q1)}`}).<br>${fin?'Llegada':'Ahora'}: <strong>${LV[row.to]}</strong> con ${row.tot} SH en el bloque (${t.W.filter(w=>w.a<=LAST).map((w,i)=>`semana ${i+1}: ${row.wk[i]}`).join(', ')})${r?` · puesto ${r.r} de ${t.tc.N}`:''}.</p>
  ${ladder?`<p>${ladder}.</p>`:row.why?`<p>${row.why[0].toUpperCase()+row.why.slice(1)}.</p>`:''}
  ${!fin&&row.tg>row.to&&row.goal!=null?`<p>Siguiente escalón, <strong>${LV[row.tg]}</strong>${gtxt}: ${row.falta?`le ${row.falta>1?'faltan':'falta'} <strong>${row.falta} SH</strong> con el corte de hoy`:'ya tiene las SH del corte de hoy'}${tp?`; se espera que el corte acabe en ≈ ${tp} SH, unas <strong>${es(Math.max(0,Math.ceil((Math.max(tp,row.goal)-row.tot)/left)))} SH al día</strong> los ${left} días que quedan`:''}.</p>`:''}
  ${!fin&&!(row.why||'').includes('anti')?`<p class="lede" style="margin:4px 0 0">Para cobrar más allá de la reactivación hacen falta al menos ${row.need} SH en el bloque (${MIN} como mínimo y ${MEJ} más que en ${rg(t.q0,t.q1)}).</p>`:''}</div>`;
}

function table(){
 const t=ST.t,f=ST.f,pr=t.st==='proximo';
 let r=t.rows.filter(x=>f==='all'||(f==='in'?x.pay>0:f==='out'?!x.pay:x.tot===0));
 if(pr)r=[...r].sort((a,b)=>(b.q?b.q.v:0)-(a.q?a.q.v:0)||a.name.localeCompare(b.name));   // primero los que están más cerca de salirse
 const show=ST.all?r:r.slice(0,40);
 $('thead2').innerHTML=`<tr>${pr?'':'<th class="n">Puesto</th>'}<th>Piloto</th><th class="n">${pr?'SH (provisional)':'Salida'}</th>${pr?'<th>Nivel de salida</th>':
  t.W.map((w,i)=>`<th class="n" title="${rg(w.a,w.b)}">Sem. ${i+1}</th>`).join('')+`<th class="n">SH</th><th>Nivel</th><th class="n">Premio</th>${t.st==='curso'?'<th>Siguiente escalón</th>':''}`}</tr>`;
 $('tbody').innerHTML=show.map(x=>`<tr class="${x.tot||pr?'':'zero'}">${pr?'':`<td class="n">${x.r?x.r.r:'—'}</td>`}<td class="pl"><button data-p="${x.p}">${x.name}</button></td>
  <td class="n">${x.q?x.q.v:0} <span class="flat">${pr?'':LV[x.from]}</span></td>
  ${pr?`<td>${LV[x.from]}</td>`:x.wk.map(v=>`<td class="n">${v||'<span class="flat">·</span>'}</td>`).join('')+`<td class="n"><b>${x.tot}</b></td>
  <td><span class="lv l${x.to}">${LV[x.to]}</span>${x.to>x.from?' <span class="up">▲</span>':x.to<x.from?' <span class="down">▼</span>':''}</td>
  <td class="n">${x.pay?`<b class="gold">${es(x.pay)}</b>`:x.b===0&&x.to>x.from?'<span class="flat" title="'+x.why+'">0*</span>':'<span class="flat">—</span>'}</td>
  ${t.st==='curso'?`<td>${x.goal==null?(x.tg?'—':'<span class="flat">premio máximo</span>'):`${LV[x.tg]}: ${x.falta?`faltan ${x.falta}`:'ya llega'} <span class="flat">(+${es(x.gain*t.FX.f)})</span>`}</td>`:''}`}</tr>`).join('')||
  `<tr><td colspan="10" style="color:var(--muted)">Nadie en esta lista.</td></tr>`;
 const m=$('tmore');m.hidden=show.length>=r.length;m.textContent=`Ver los ${r.length} pilotos`;
}

function hall(){
 const B=bote();
 $('tpalm').innerHTML=`<table><thead><tr><th>Bloque</th><th>Fechas</th><th>Estado</th><th class="n">Compiten</th><th class="n">Premiados</th><th class="n">Factor</th><th class="n">Premios</th></tr></thead><tbody>`+
  T.map(t=>`<tr><td><b>${t.n}</b></td><td>${rg(t.s,t.e)}</td><td><span class="tbadge sm ${t.st}">${STL[t.st]}</span></td><td class="n">${t.rows.length}</td><td class="n">${t.st==='proximo'?'—':t.rows.filter(r=>r.pay).length}</td><td class="n">${t.FX&&!t.FX.none?fx(t.FX.f):'—'}</td><td class="n">${t.st==='proximo'?'—':money(t.paid)+(t.st==='curso'?' *':'')}</td></tr>`).join('')+
  `</tbody><tfoot><tr><td colspan="6">${B.closed?'Bote final':'Quedaría para el bote final'}</td><td class="n">${money(B.left)}</td></tr></tfoot></table>`;
 const fin=T.filter(t=>t.st==='terminado');
 $('twin').innerHTML=(T.some(t=>t.st==='curso')?'<p class="lede" style="margin:0 0 6px;font-size:12.5px">* Bloque en curso: importe si acabara hoy.</p>':'')+
  `<p><strong>Bote final:</strong> ${C.bote_final||''} ${B.lead.length?`${B.closed?'Lo gana':'Ahora va en cabeza'} <strong>${B.lead.map(x=>D.names[x[0]]).join(', ')}</strong> con ${B.max} SH.`:''}</p>`+
  (fin.length?[...fin].reverse().map(t=>`<p><strong>Bloque ${t.n}</strong> (${rg(t.s,t.e)}, ${fx(t.FX.f)}): ${t.rows.filter(r=>r.pay).map(r=>`${r.name} ${es(r.pay)}`).join(', ')||'nadie cobró'}.</p>`).join(''):
  '<p class="lede" style="margin:0">Todavía no ha terminado ningún bloque. Aquí saldrán los premiados de cada uno.</p>');
}

function rules(){
 const ex=[[2,3],[2,4],[1,4],[0,4]].map(([a,b])=>`de ${LV[a]} a ${LV[b]}: ${money(base(a,b))}`).join('; ');
 $('trules').innerHTML=`<ul>
  <li><strong>${NT} bloques de ${DUR} días</strong> (de martes a lunes, días del servidor de eRepublik), del ${dm(C.inicio)} al ${dm(ENDC)}.</li>
  <li><strong>Quién compite:</strong> los pilotos del <strong>P${Math.round(FONDO*100)}–P100</strong> en las dos semanas anteriores a cada bloque y los que no ganaron ninguna SH. No hay que apuntarse.</li>
  <li><strong>Niveles:</strong> por percentil de SH entre todos los pilotos españoles con SH en esas dos semanas (P0 es el que más gana). Los empatados se quedan con el mejor puesto.</li>
  <li><strong>Premio por escalones:</strong> se cobra cada escalón que se sube del nivel de salida al de llegada, y se suman. El gran premio es llegar al <strong>P20–P40</strong>; llegar al P0–P20 no da nada extra. Ejemplos: ${ex}.</li>
  <li><strong>Factor nacional:</strong> todos los premios del bloque se multiplican por 1 + ${AMP} × la variación de España frente a ${rg(R0,R1)}${useGold?' (media de la variación de SH y la del oro total)':''}, entre ${fx(FMIN)} y ${fx(FMAX)}.</li>
  <li><strong>Anti-chollo:</strong> para cobrar hay que tener al menos ${MIN} SH en el bloque y ${MEJ} más que en las dos semanas anteriores. La reactivación se cobra con ${MINR} SH.</li>
  <li><strong>Presupuesto:</strong> ${money(C.presupuesto_total||0)}, con un tope de ${money(TOPE)} por bloque; si se pasa, todos los premios se reducen en la misma proporción. Lo que sobre va al bote final.</li>
  <li>Los datos se actualizan cada día. Cada SH cuenta en el día en que empezó su batalla.</li></ul>`;
}

function setHash(){try{history.replaceState(null,'','#torneo/'+ST.t.n+(ST.p!=null?'/'+D.ids[ST.p]:''))}catch(e){}}
function pick(t,keepP){ST.t=t;ST.all=false;if(!keepP){ST.p=null;$('tq').value=''}
 document.querySelectorAll('#tsel button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.n===t.n));
 head(t);card();table()}
function choose(p){ST.p=p;$('tq').value=p==null?'':D.names[p];card();setHash()}

document.querySelectorAll('#tsel button').forEach(b=>b.addEventListener('click',()=>{pick(T[b.dataset.n-1],ST.p!=null);setHash()}));
$('tq').addEventListener('input',e=>{const v=e.target.value.trim().toLowerCase();if(!v){choose(null);return}
 const ex=D.names.findIndex(n=>n.toLowerCase()===v);if(ex>=0){choose(ex);return}
 const part=D.names.map((n,i)=>[n,i]).filter(([n])=>n.toLowerCase().includes(v));
 if(part.length===1)choose(part[0][1]);else{ST.p=null;$('tcard').innerHTML=v.length>1?`<p class="lede" style="margin:8px 0 0">${part.length?part.length+' pilotos coinciden: sigue escribiendo o elige uno de la lista.':'Ningún piloto con SH tiene ese nombre.'}</p>`:''}});
$('tbody').addEventListener('click',e=>{const b=e.target.closest('button[data-p]');if(!b)return;choose(+b.dataset.p);$('tfind').scrollIntoView({behavior:'smooth',block:'nearest'})});
document.querySelectorAll('#tchips .chip').forEach(b=>b.addEventListener('click',()=>{ST.f=b.dataset.f;ST.all=false;document.querySelectorAll('#tchips .chip').forEach(c=>c.setAttribute('aria-pressed',c===b));table()}));
$('tmore').addEventListener('click',()=>{ST.all=true;table()});

rules();hall();
const h=location.hash.match(/^#torneo\/(\d+)(?:\/(\d+))?/);
const def=T.find(t=>t.st==='curso')||[...T].reverse().find(t=>t.st==='terminado')||T[0];
pick(h&&T[h[1]-1]||def);
if(h&&h[2]){const p=D.ids.indexOf(+h[2]);if(p>=0)choose(p)}
})();
