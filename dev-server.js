import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const files={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/physics.js':'physics.js','/particles.js':'particles.js'};
http.createServer(async(req,res)=>{
  const name=files[new URL(req.url,'http://localhost').pathname];
  if(req.method!=='GET'||!name){res.writeHead(404).end();return;}
  try{
    const data=await readFile(path.join(root,name));
    res.writeHead(200,{'Content-Type':name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end(data);
  }catch{res.writeHead(404).end();}
}).listen(4177,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4177/'));
