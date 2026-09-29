import fs from "node:fs";
import path from "node:path";

const skipDirs=new Set([".git",".github","node_modules","scripts"]);
function walk(dir="."){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const rel=path.posix.join(dir==="."?"":dir,entry.name);
    if(entry.isDirectory()){
      if(skipDirs.has(entry.name)) continue;
      out.push(...walk(rel));
    }else if(entry.isFile()) out.push(rel);
  }
  return out;
}
const all=walk(), existing=new Set(all), html=all.filter(x=>x.endsWith(".html"));
const errors=[], titles=new Map(), canonicals=new Map();

function targetFor(href){
  const clean=href.split("#")[0].split("?")[0];
  if(!clean||clean==="/") return "index.html";
  let t=clean.replace(/^\//,"");
  if(t.endsWith("/")) t+="index.html";
  else if(!path.posix.extname(t)) t+="/index.html";
  return t;
}

for(const file of html){
  const text=fs.readFileSync(file,"utf8");
  if(file!=="404.html"){
    const title=text.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const canonical=text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]||text.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
    if(!title) errors.push(`${file}: missing title`);
    else {if(!titles.has(title))titles.set(title,[]);titles.get(title).push(file)}
    if(!canonical) errors.push(`${file}: missing canonical`);
    else {if(!canonicals.has(canonical))canonicals.set(canonical,[]);canonicals.get(canonical).push(file)}
    const desc=text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]||text.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1];
    if(!desc) errors.push(`${file}: missing meta description`);
  }
  for(const match of text.matchAll(/href=["']([^"']+)["']/gi)){
    const href=match[1];
    if(!href.startsWith("/")||href.startsWith("//")) continue;
    const target=targetFor(href);
    if(!existing.has(target)) errors.push(`${file}: broken internal link ${href} -> ${target}`);
  }
  for(const match of text.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)){
    try{JSON.parse(match[1])}catch(e){errors.push(`${file}: invalid JSON-LD (${e.message})`)}
  }
}

for(const [title,files] of titles) if(files.length>1) errors.push(`duplicate title "${title}" in ${files.join(", ")}`);
for(const [url,files] of canonicals) if(files.length>1) errors.push(`duplicate canonical "${url}" in ${files.join(", ")}`);

const sitemap=fs.readFileSync("sitemap.xml","utf8");
const sitemapUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const expected=html.filter(x=>x!=="404.html").map(file=>"https://glassesdb.com"+(file==="index.html"?"/":"/"+file.replace(/index\.html$/,""))).sort();
const actual=[...new Set(sitemapUrls)].sort();
for(const u of expected) if(!actual.includes(u)) errors.push(`sitemap missing ${u}`);
for(const u of actual) if(!expected.includes(u)) errors.push(`sitemap points to missing/non-HTML route ${u}`);
if(actual.length!==sitemapUrls.length) errors.push("sitemap contains duplicate URLs");

if(errors.length){
  console.error(`Site audit failed with ${errors.length} issue(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Site audit passed: ${html.length} HTML files and ${actual.length} sitemap URLs checked.`);
