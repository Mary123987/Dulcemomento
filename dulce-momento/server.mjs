import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pages,normalizePath} from './dist/seo.js';
import {handleAdminApi} from './admin-api.mjs';
const root=path.resolve('dist');
const routes=new Set(pages.map(p=>p.path));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
export function createServer(){
 return http.createServer((req,res)=>{
 let url,pathname;try{url=new URL(req.url,'http://127.0.0.1:4173');pathname=decodeURIComponent(url.pathname)}catch{res.writeHead(400);res.end('Solicitud inválida');return}
 if(pathname.startsWith('/api/')){void handleAdminApi(req,res,url);return}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return}
 const clean=normalizePath(pathname.replace(/\/index\.html$/,''));
 if(routes.has(clean)&&pathname!==clean){res.writeHead(308,{Location:clean+url.search});res.end();return}
 let status=200;
 let file=routes.has(clean)?path.join(root,clean,'index.html'):path.resolve(root,'.'+pathname);
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){status=404;file=path.join(root,'404.html')}
 res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache',...(status===404?{'X-Robots-Tag':'noindex, follow'}:{})});
 if(req.method==='HEAD'){res.end();return}fs.createReadStream(file).pipe(res);
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4173);
 const host=process.env.HOST||'127.0.0.1';
 createServer().listen(port,host,()=>console.log(`Local: http://${host}:${port}`));
}
