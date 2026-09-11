#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GALLERY = path.join(ROOT, 'gallery-showme5wh.html');
const PLACARD = path.join(ROOT, 'placard.html');

async function getIndex(){
  try{
    const txt = await fs.readFile(PLACARD,'utf8');
    const m = txt.match(/const wardrobeFull = \[([\s\S]*?)\];/);
    const re = /\{\s*"file":\s*"([^"]+)",\s*"src":\s*"([^"]+)",\s*"cat":\s*"([^"]+)",\s*"label":\s*"([^"]+)"/g;
    const map=new Map();
    let g; while((g=re.exec(m[0]))){ map.set(g[1],{src:g[2],cat:g[3],label:g[4]}); }
    return map;
  }catch{return new Map();}
}

let selection = process.argv[2];
if(selection){
  try{ selection=JSON.parse(selection); }catch{ selection=selection.split(',').map(s=>s.trim()).filter(Boolean); }
} else {
  // try read from STDIN or localStorage dump not available
  console.error('Usage: node tools/sync-gallery.mjs \'["file1","file2\"]\'');
  process.exit(1);
}
if(!Array.isArray(selection)) selection=[selection];

const index = await getIndex();
const entries = selection.map(f=>{
  const meta=index.get(f);
  const cat=meta?.cat||'autre';
  const label=meta?.label||f.replace(/\.[^.]+$/,'').replace(/.*\//,'');
  // dedup like publish-server
  return {f, cat, label};
});
// dedup flat names like publish-server
const seen=new Set();
const out=[];
for(const e of entries){
  let base=path.basename(e.f);
  let dest=base;
  if(seen.has(dest)) dest=`${e.cat}__${base}`;
  let n=1; while(seen.has(dest)) dest=`${e.cat}__${n++}__${base}`;
  seen.add(dest);
  out.push({file:dest, label:e.label, cat:e.cat, src:`assets/showme5wh/${dest}`});
}

let html=await fs.readFile(GALLERY,'utf8');
const imagesArr = out.map(e=> `  {file:"${e.file.replace(/"/g,'\\"')}", label:"${e.label.replace(/"/g,'\\"')}", cat:"${e.cat}", src:"${e.src.replace(/"/g,'\\"')}"}`).join(',\n');
const newBlock = `const images = [\n${imagesArr}\n];`;
const re = /const images = \[[\s\S]*?\];/;
if(!re.test(html)){ console.error('gallery block not found'); process.exit(1); }
html=html.replace(re, newBlock);
await fs.writeFile(GALLERY, html,'utf8');
console.log(`gallery rewriten ${out.length} entries`);

