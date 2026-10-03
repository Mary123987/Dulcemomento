import fs from 'node:fs';
import {pages,SEO_ORIGIN,pageFor,seoHead,escapeHtml} from './dist/seo.js';
import {renderStatic} from './dist/app.js';
const shell=fs.readFileSync('shell.html','utf8').replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta name="description"[^>]*>/,'');
function documentFor(meta){return shell.replace('</head>',seoHead(meta)+'</head>').replace('<div id="app"></div>','<div id="app">'+renderStatic(meta.path)+'</div>')}
for(const meta of pages){const dir=meta.path==='/'?'dist':'dist'+meta.path;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/index.html',documentFor(meta))}
fs.writeFileSync('dist/404.html',documentFor(pageFor('/404')));
const publicPages=pages.filter(p=>p.indexable);
fs.writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+publicPages.map(p=>'  <url><loc>'+escapeHtml(SEO_ORIGIN+p.path)+'</loc></url>').join('\n')+'\n</urlset>\n');
fs.writeFileSync('dist/robots.txt','# Demostración local. No enviar este sitemap de localhost a buscadores.\n# Noindex se declara en el HTML de las páginas internas; no se bloquea su lectura.\nUser-agent: *\nAllow: /\nSitemap: '+SEO_ORIGIN+'/sitemap.xml\n');
console.log(`Generadas ${pages.length} páginas con contenido HTML y SEO, un estado 404 y un sitemap local de ${publicPages.length} URLs.`);
