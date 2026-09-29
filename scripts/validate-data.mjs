import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("assets/data.js","utf8");
const context={window:{}};
vm.runInNewContext(source,context,{filename:"assets/data.js"});
const rows=context.window.GLASSES_DATA;
if(!Array.isArray(rows)) throw new Error("GLASSES_DATA must be an array.");

const required=["id","brand","model","type","display","camera","audio","ai","weight","compatibility","best","status","source","verified","summary"];
const types=new Set(["AI glasses","Audio glasses","HUD glasses","Display glasses","AR glasses"]);
const statuses=new Set(["Current","Coming soon","Preorder","Legacy"]);
const ids=new Set(), errors=[];

for(const [index,x] of rows.entries()){
  const label=x?.id||`row ${index+1}`;
  for(const key of required){
    if(x?.[key]===undefined||x?.[key]===null||x?.[key]==="") errors.push(`${label}: missing ${key}`);
  }
  if(x?.id&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.id)) errors.push(`${label}: invalid id format`);
  if(ids.has(x?.id)) errors.push(`${label}: duplicate id`); else ids.add(x?.id);
  if(x?.type&&!types.has(x.type)) errors.push(`${label}: invalid type "${x.type}"`);
  if(x?.status&&!statuses.has(x.status)) errors.push(`${label}: invalid status "${x.status}"`);
  if(x?.best&&!Array.isArray(x.best)) errors.push(`${label}: best must be an array`);
  if(x?.source&&!/^https:\/\//.test(x.source)) errors.push(`${label}: source must use https`);
  if(x?.verified&&!/^\d{4}-\d{2}$/.test(x.verified)) errors.push(`${label}: verified must be YYYY-MM`);
  if(x?.summary&&x.summary.length<40) errors.push(`${label}: summary is too short`);
}

const models=new Map();
for(const x of rows){
  const key=`${x.brand}::${x.model}`.toLowerCase();
  if(models.has(key)) errors.push(`${x.id}: duplicate brand/model with ${models.get(key)}`);
  else models.set(key,x.id);
}

if(errors.length){
  console.error(`Data validation failed with ${errors.length} issue(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Data validation passed: ${rows.length} models, ${new Set(rows.map(x=>x.brand)).size} brands.`);
