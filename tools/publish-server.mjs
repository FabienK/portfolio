#!/usr/bin/env node
// publish-server.mjs — micro-serveur local pour placard.html
// POST http://127.0.0.1:8765/publish {selection: ["perspectives_print/01-...", "4w1h_..."]}
// → copie vers assets/showme5wh (plat + renommage cat__ si collision), réécrit gallery-showme5wh.html, git push
import http from 'node:http';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(ROOT, 'assets', 'wardrobe-full'); // symlink → "../Image generator " (trailing space)
const DST = path.join(ROOT, 'assets', 'showme5wh');
const GALLERY = path.join(ROOT, 'gallery-showme5wh.html');
const PLACARD = path.join(ROOT, 'placard.html');
const PORT = 8765;

function log(...a){ console.log('[publish]', ...a); }

async function resolveWardrobeIndex(){
  // Parse wardrobeFull from placard.html to get src/cat/label for each file (to resolve typst/comfy nuances)
  try{
    const txt = await fs.readFile(PLACARD, 'utf8');
    const m = txt.match(/const wardrobeFull = \[([\s\S]*?)\];/);
    if(!m) return new Map();
    // quick parse: extract objects with file/src/cat/label
    const re = /\{\s*"file":\s*"([^"]+)",\s*"src":\s*"([^"]+)",\s*"cat":\s*"([^"]+)",\s*"label":\s*"([^"]+)"/g;
    const map = new Map();
    let g;
    while((g=re.exec(m[0]))){
      map.set(g[1], {src:g[2], cat:g[3], label:g[4]});
    }
    return map;
  }catch(e){ return new Map(); }
}

async function copyWithDedup(selection, index){
  await fs.mkdir(DST, {recursive:true});
  // clean DST: remove old files not in new dest set? We keep simple: copy over, but also remove orphans
  const seen = new Set();
  const out = []; // {destName, original, destPath, srcPath}
  for(const f of selection){
    const meta = index.get(f);
    const cat = (meta && meta.cat) || 'autre';
    const label = (meta && meta.label) || f.replace(/\.[^.]+$/,'');
    let base = path.basename(f);
    let destName = base;
    if(seen.has(destName)) destName = `${cat}__${base}`;
    let n=1;
    while(seen.has(destName)) destName = `${cat}__${n++}__${base}`;
    seen.add(destName);
    // resolve src: try wardrobe src, then constructed paths
    let srcCandidates = [];
    if(meta && meta.src) srcCandidates.push(path.join(ROOT, meta.src));
    srcCandidates.push(path.join(SRC_ROOT, f));
    // for comfy 4w1h etc fallback comfy-output
    srcCandidates.push(path.join(ROOT, 'assets', 'comfy-output', path.basename(f)));
    srcCandidates.push(path.join(ROOT, 'assets', 'wardrobe-full', 'Image-generator', 'ComfyUI', 'output', path.basename(f)));
    // for typst/styles: also try typst folder
    srcCandidates.push(path.join(SRC_ROOT, 'typst', 'Images-styles', path.basename(f)));
    let found = null;
    for(const c of srcCandidates){
      try{ await fs.access(c); found=c; break; }catch{}
    }
    if(!found){
      log('WARN src not found for', f, 'tried', srcCandidates[0]);
      continue;
    }
    const destPath = path.join(DST, destName);
    await fs.copyFile(found, destPath);
    out.push({original:f, destName, destPath, srcPath:found, cat, label});
  }
  // optionally remove orphans in DST not in out (to keep 24 clean)
  try{
    const existing = await fs.readdir(DST);
    for(const file of existing){
      if(file.startsWith('.')) continue;
      if(!out.some(o=>o.destName===file)){
        // keep fog? showme5wh only contains images, safe to unlink orphans
        // uncomment to auto-clean:
        // await fs.unlink(path.join(DST,file));
      }
    }
  }catch{}
  return out;
}

async function rewriteGallery(entries){
  let html = await fs.readFile(GALLERY, 'utf8');
  const imagesArr = entries.map(e=> `  {file:"${e.destName.replace(/"/g,'\\"')}", label:"${e.label.replace(/"/g,'\\"')}", cat:"${e.cat}", src:"assets/showme5wh/${e.destName.replace(/"/g,'\\"')}"}`).join(',\n');
  const newBlock = `const images = [\n${imagesArr}\n];`;
  // replace const images = [ ... ];
  const re = /const images = \[[\s\S]*?\];/;
  if(!re.test(html)) throw new Error('gallery: const images block not found');
  html = html.replace(re, newBlock);
  await fs.writeFile(GALLERY, html, 'utf8');
  log('gallery rewritten', entries.length);
}

async function handlePublish(selection){
  if(!Array.isArray(selection) || !selection.length) throw new Error('selection vide');
  const index = await resolveWardrobeIndex();
  const entries = await copyWithDedup(selection, index);
  await rewriteGallery(entries);
  // git — avec rebase auto pour éviter non-fast-forward
  try{
    execSync('git add assets/showme5wh gallery-showme5wh.html', {cwd:ROOT, stdio:'pipe'});
    let diff=''; try{ diff=execSync('git diff --cached --name-only', {cwd:ROOT}).toString(); }catch{}
    if(diff.trim()){
      execSync(`git commit -m "wardrobe: publie tenue (${entries.length})"`, {cwd:ROOT, stdio:'pipe'});
      try{
        execSync('git push', {cwd:ROOT, stdio:'pipe'});
        log('git push ok', diff.trim().split('\n').length, 'files');
      }catch(pushErr){
        log('push rejeté, tentative pull --rebase', pushErr.stderr?.toString());
        try{
          execSync('git pull --rebase', {cwd:ROOT, stdio:'pipe'});
          execSync('git push', {cwd:ROOT, stdio:'pipe'});
          log('git push ok après rebase');
        }catch(e2){
          log('git error après rebase', e2.message, e2.stdout?.toString(), e2.stderr?.toString());
          throw new Error('git push échoué après rebase: ' + (e2.stderr?.toString()||e2.message) + ' — fais git pull --rebase manuellement');
        }
      }
    } else log('rien à committer');
  }catch(e){
    log('git error', e.message, e.stdout?.toString(), e.stderr?.toString());
    throw new Error('git push échoué: ' + (e.stderr?.toString()||e.message));
  }
  return {published: entries.length, renamed: entries.filter(e=> path.basename(e.original)!==e.destName).length, files: entries.map(e=>e.destName)};
}

const server = http.createServer(async (req,res)=>{
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method==='OPTIONS'){ res.writeHead(204); res.end(); return; }
  if(req.url==='/health' && req.method==='GET'){
    res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true, root:ROOT})); return;
  }
  if(req.url==='/publish' && req.method==='POST'){
    let body='';
    req.on('data', c=> body+=c);
    req.on('end', async ()=>{
      try{
        const data=JSON.parse(body||'{}');
        const sel=data.selection||data;
        const result=await handlePublish(sel);
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true, ...result}));
      }catch(e){
        log('publish error', e);
        res.writeHead(500,{'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:false, error:e.message}));
      }
    });
    return;
  }
  res.writeHead(404,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'not found'}));
});

server.listen(PORT, '127.0.0.1', ()=>{
  log(`écoute http://127.0.0.1:${PORT}  (root=${ROOT})`);
  log('Ouvre placard.html en file:// puis clique Publier → 1-click');
});
