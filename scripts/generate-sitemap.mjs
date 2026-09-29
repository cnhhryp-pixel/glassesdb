import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const ROOT=process.cwd();
const SKIP=new Set(["404.html"]);
const skipDirs=new Set([".git",".github","node_modules","scripts","assets"]);

function walk(dir="."){
  const result=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const rel=path.posix.join(dir==="."?"":dir,entry.name);
    if(entry.isDirectory()){
      if(skipDirs.has(entry.name)) continue;
      result.push(...walk(rel));
    }else if(entry.isFile()&&entry.name.endsWith(".html")&&!SKIP.has(rel)){
      result.push(rel);
    }
  }
  return result;
}

function routeFor(file){
  if(file==="index.html") return "/";
  if(file.endsWith("/index.html")) return "/"+file.slice(0,-"index.html".length);
  return "/"+file;
}

function lastModified(file){
  try{
    const value=execFileSync("git",["log","-1","--format=%cs","--",file],{encoding:"utf8"}).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(value)?value:new Date().toISOString().slice(0,10);
  }catch{
    return new Date().toISOString().slice(0,10);
  }
}

const files=walk().sort((a,b)=>routeFor(a).localeCompare(routeFor(b)));
const urls=files.map(file=>({loc:`https://glassesdb.com${routeFor(file)}`,lastmod:lastModified(file)}));
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(x=>`  <url><loc>${x.loc}</loc><lastmod>${x.lastmod}</lastmod></url>`).join("\n")+'\n</urlset>\n';
fs.writeFileSync(path.join(ROOT,"sitemap.xml"),xml);
console.log(`Generated sitemap.xml with ${urls.length} URLs.`);
