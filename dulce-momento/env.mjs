import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const envPath=path.join(path.dirname(fileURLToPath(import.meta.url)),'.env');

if(fs.existsSync(envPath)){
 const contents=fs.readFileSync(envPath,'utf8').replace(/^\uFEFF/,'');
 for(const line of contents.split(/\r?\n/)){
  const entry=line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if(!entry||Object.hasOwn(process.env,entry[1]))continue;
  let value=entry[2];
  if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
  else value=value.replace(/\s+#.*$/,'');
  process.env[entry[1]]=value.replace(/\\n/g,'\n');
 }
}
