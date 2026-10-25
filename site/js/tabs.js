// ESTAFA · pestañas Torneo / Estadísticas globales / Pilotos (histórico).
// La pestaña sale del enlace (#torneo/1/123, #estadisticas, #coste…): se muestra la que contiene ese elemento.
(function(){
const panels=[...document.querySelectorAll('.tabpanel')],links=[...document.querySelectorAll('nav a[data-tab]')],nav=document.querySelector('nav');
function show(scroll){
 const el=document.getElementById(location.hash.slice(1).split('/')[0]);
 const p=(el&&el.closest('.tabpanel'))||panels[0];
 panels.forEach(x=>x.hidden=x!==p);
 links.forEach(a=>a.dataset.tab===p.dataset.tab?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
 if(!scroll||!el)return;
 // Al cambiar de pestaña se vuelve al menú; si el enlace es a una sección, se baja hasta ella
 if(el===p||el.id==='torneo'){if(window.scrollY>nav.offsetTop)nav.scrollIntoView()}else el.scrollIntoView();
}
window.addEventListener('hashchange',()=>show(true));
show(/^#torneo\/\d+\/\d+/.test(location.hash)||location.hash.length>1);
})();
