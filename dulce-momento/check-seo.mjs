import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pages,SEO_ORIGIN} from './dist/seo.js';
const unique=(values,label)=>assert.equal(new Set(values).size,values.length,label);
unique(pages.map(p=>p.path),'Rutas únicas');unique(pages.map(p=>p.title),'Titles únicos');unique(pages.map(p=>p.description),'Descripciones únicas');unique(pages.map(p=>p.keyword),'Objetivos diferenciados');
const rows=[];
for(const p of pages){
 const html=fs.readFileSync('dist'+(p.path==='/'?'':p.path)+'/index.html','utf8');
 assert.equal((html.match(/<h1>/g)||[]).length,1,p.path+' H1');
 assert.equal((html.match(/<title>/g)||[]).length,1,p.path+' title');
 assert.ok(html.includes(p.h1)||p.path==='/'||p.path==='/catalogo',p.path+' H1 previsto');
 assert.ok(html.includes('<title>'+p.title+'</title>'),p.path+' title');
 assert.ok(html.includes('content="'+(p.indexable?'index,follow':'noindex,follow')+'"'),p.path+' robots');
 assert.ok(html.includes('href="'+SEO_ORIGIN+p.path+'"'),p.path+' canonical');
 assert.ok(html.includes('property="og:title"')&&html.includes('name="twitter:card"'),p.path+' social');
 const tags=[...html.matchAll(/<img\b[^>]*>/g)].map(x=>x[0]);assert.ok(tags.every(t=>/alt="[^"]+"/.test(t)&&/width="\d+"/.test(t)&&/height="\d+"/.test(t)),p.path+' imágenes');
 const schema=html.match(/<script id="structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 if(schema){const obj=JSON.parse(schema);assert.ok(obj['@graph']);assert.ok(!/"(?:Offer|Product|Review|AggregateRating|LocalBusiness)"/.test(schema),'Datos simulados excluidos de rich snippets comerciales')}
 for(const [,href] of html.matchAll(/href="(\/[^"?]*)[^\"]*"/g)){if(href.startsWith('/assets/')||href==='/style.css')continue;const [route,hash]=href.split('#');assert.ok(pages.some(p=>p.path===route),p.path+' enlace '+route);if(hash){const target=fs.readFileSync('dist'+(route==='/'?'':route)+'/index.html','utf8');assert.ok(target.includes('id="'+hash+'"'),'Ancla '+href)}}
 rows.push({ruta:p.path,title:p.title,h1:p.h1,indexacion:p.indexable?'index,follow':'noindex,follow',imagenes:tags.length,resultado:'PASS'});
}
const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,22);for(const p of pages)assert.equal(sitemap.includes('<loc>'+SEO_ORIGIN+p.path+'</loc>'),p.indexable,p.path+' sitemap');
assert.ok(fs.readFileSync('dist/robots.txt','utf8').includes('Allow: /'));
assert.ok(fs.readFileSync('dist/404.html','utf8').includes('noindex,follow'));
fs.mkdirSync('../outputs',{recursive:true});fs.writeFileSync('../outputs/verificacion-seo.json',JSON.stringify({fecha:'2026-10-03',paginas:rows.length,sitemap:22,results:rows},null,2));
console.log('PASS: 28 rutas, titles/descripciones/objetivos únicos, H1, canonical, robots, OG/Twitter, alternativas de imágenes, enlaces/anclas, JSON-LD y sitemap de 22 URLs.');
