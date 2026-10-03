import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {pages,normalizePath} from './dist/seo.js';
const root=path.resolve('dist');
const routes=new Set(pages.map(p=>p.path));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return}
 let url,pathname;try{url=new URL(req.url,'http://127.0.0.1:4173');pathname=decodeURIComponent(url.pathname)}catch{res.writeHead(400);res.end('Solicitud inválida');return}
 const clean=normalizePath(pathname.replace(/\/index\.html$/,''));
 if(routes.has(clean)&&pathname!==clean){res.writeHead(308,{Location:clean+url.search});res.end();return}
 let status=200;
 let file=routes.has(clean)?path.join(root,clean,'index.html'):path.resolve(root,'.'+pathname);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){status=404;file=path.join(root,'404.html')}
 res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache',...(status===404?{'X-Robots-Tag':'noindex, follow'}:{})});
 if(req.method==='HEAD'){res.end();return}fs.createReadStream(file).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
