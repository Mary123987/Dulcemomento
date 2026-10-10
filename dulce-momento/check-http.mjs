import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pages,SEO_ORIGIN,escapeHtml} from './dist/seo.js';
const results=[];
for(const p of pages){
 const res=await fetch(SEO_ORIGIN+p.path);const html=await res.text();
 assert.equal(res.status,200,p.path);
 assert.ok(html.includes('<title>'+escapeHtml(p.title)+'</title>'),p.path);
 assert.equal((html.match(/<h1>/g)||[]).length,1,p.path);
 assert.ok(html.includes('name="robots" content="'+(p.indexable?'index,follow':'noindex,follow')+'"'));
 results.push({path:p.path,status:res.status,initialHtml:true});
}
for(const path of ['/pagina-inexistente','/productos/keke-inexistente','/assets/no-existe.png'])assert.equal((await fetch(SEO_ORIGIN+path)).status,404);
for(const path of ['/catalogo/','/catalogo/index.html']){const r=await fetch(SEO_ORIGIN+path,{redirect:'manual'});assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/catalogo');}
const filtered=await (await fetch(SEO_ORIGIN+'/catalogo?ocasion=Cumplea%C3%B1os')).text();assert.ok(filtered.includes('rel="canonical" href="'+SEO_ORIGIN+'/catalogo"'));
for(const file of ['robots.txt','sitemap.xml'])assert.equal((await fetch(SEO_ORIGIN+'/'+file)).status,200);
fs.writeFileSync('../outputs/verificacion-http.json',JSON.stringify({routes:results,missingRoutes:404,normalization:308,queryCanonical:true},null,2));
console.log(`HTTP: ${pages.length} rutas con HTML inicial correcto; 404, redirecciones, canonical, robots y sitemap verificados.`);
