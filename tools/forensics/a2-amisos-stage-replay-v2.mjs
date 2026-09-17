import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const TARGET="pontus-amisos", TARGET_TINY=2.27e-13, TINY_EPS=1e-10;
const TARGET_ANCHOR=[36.33,41.29];
const CHECKPOINTS=["837ec8dd2d878ceb227f609c3da481610b54d0db","bdf166a4","3021b2d1","7d895c99","5be399d4","6b7424125eee4a1c72925b7a1780c68e695e9ba3"];
function git(args,cwd=process.cwd()){return execFileSync("git",args,{cwd,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
function run(cmd,args,cwd){return execFileSync(cmd,args,{cwd,encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:32*1024*1024});}
const INSTR=`
const __A2_TARGET="${TARGET}";
const __A2_ANCHOR=[${TARGET_ANCHOR[0]},${TARGET_ANCHOR[1]}];
function __a2Area(r){if(!Array.isArray(r)||r.length<3)return null;let s=0;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];s+=a[0]*b[1]-b[0]*a[1];}return s/2;}
function __a2Stat(r){const signedArea=__a2Area(r);return{vertices:Array.isArray(r)?r.length:0,signedArea,absArea:signedArea==null?null:Math.abs(signedArea),tiny:signedArea!=null&&Math.abs(signedArea)<=${TINY_EPS}};}
function __a2Stage(stage,payload){console.log("A2_STAGE|"+JSON.stringify({stage,...payload}));}
function __a2TargetAnchor(p){return Array.isArray(p)&&Math.hypot(p[0]-__A2_ANCHOR[0],p[1]-__A2_ANCHOR[1])<0.05;}
`;
function fnBounds(source,name){const m=new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)\\s*\\{`,`m`).exec(source);if(!m)return null;const open=source.indexOf("{",m.index);let d=0;for(let i=open;i<source.length;i++){if(source[i]==="{")d++;else if(source[i]==="}"&&!--d)return{open,end:i+1,params:m[1].split(",").map(x=>x.trim())};}return null;}
function bodyReplace(source,fn,transform){return source.slice(0,fn.open+1)+transform(source.slice(fn.open+1,fn.end-1),fn.params)+source.slice(fn.end-1);}
function instrument(worktree){
 const file=resolve(worktree,"tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");let s=INSTR+"\\n"+readFileSync(file,"utf8");
 let f=fnBounds(s,"powerCell");if(!f)throw Error("missing powerCell");s=bodyReplace(s,f,(b,p)=>{let x=`\\n const __a2Target=${p[1]}?.[${p[0]}]?.provinceId===__A2_TARGET;\\n${b}`;x=x.replace(/polygon=halfPlane\\(polygon,([^;]+)\\);/g,m=>m+`if(__a2Target)__a2Stage("A_POWER_CELL_ITERATION",{polygon:__a2Stat(polygon)});`);x=x.replace(/return polygon;/g,`if(__a2Target)__a2Stage("A_RAW_POWER_CELL",{polygon:__a2Stat(polygon)});return polygon;`);x=x.replace(/return\\s*\\[\\];/g,`if(__a2Target)__a2Stage("A_RAW_POWER_CELL_EMPTY",{polygon:__a2Stat(polygon)});return [];`);return x;});
 f=fnBounds(s,"clipCellToLand");if(!f)throw Error("missing clipCellToLand");s=bodyReplace(s,f,(b,p)=>{let x=`\\n const __a2Target=__a2TargetAnchor(${p[1]});\\n${b}`;x=x.replace(/const candidates=([^;]+);/,m=>m+`if(__a2Target)__a2Stage("B_PHYSICAL_CLIP_CANDIDATES",{candidateCount:candidates.length,candidates:candidates.map(__a2Stat)});`);x=x.replace(/const selected=([^;]+);/,m=>m+`if(__a2Target)__a2Stage("B_PHYSICAL_CLIP_SELECTED",{selected:__a2Stat(selected),candidateCount:candidates.length});`);return x;});
 f=fnBounds(s,"normalizePhysicalBoundary");if(!f)throw Error("missing normalizePhysicalBoundary");s=bodyReplace(s,f,(b,p)=>`\\n const __a2Input=__a2Stat(${p[0]});if(__a2Input.tiny)__a2Stage("C_NORMALIZE_INPUT_TINY",{input:__a2Input});\\n${b}`);
 f=fnBounds(s,"buildPartition");if(!f)throw Error("missing buildPartition");s=bodyReplace(s,f,(b,p)=>{let x=`\\n const __a2Sites=${p[0]};\\n${b}`;x=x.replace(/const rawPolygon=([^;]+);/,m=>m+`if(site.provinceId===__A2_TARGET)__a2Stage("B_RAW_AFTER_LAND_CLIP",{rawPolygon:__a2Stat(rawPolygon)});`);x=x.replace(/const normalizedPolygon=([^;]+);/,m=>m+`if(site.provinceId===__A2_TARGET)__a2Stage("C_NORMALIZED",{normalizedPolygon:__a2Stat(normalizedPolygon)});`);x=x.replace(/const polygon=([^;]+);/,m=>m+`if(site.provinceId===__A2_TARGET)__a2Stage("C_SELECTED",{selected:__a2Stat(polygon),rawPolygon:__a2Stat(rawPolygon),normalizedPolygon:__a2Stat(normalizedPolygon)});`);return x;});
 writeFileSync(file,s,"utf8");
}
function parse(out){return out.split("\\n").flatMap(line=>{if(!line.startsWith("A2_STAGE|"))return[];try{return[JSON.parse(line.slice(9))];}catch{return[];}});}
const root=process.cwd(),original=git(["rev-parse","HEAD"]),tmp=mkdtempSync(resolve(tmpdir(),"historia-a2-stage-v2-")),results=[];
try{for(const checkpoint of CHECKPOINTS){const wt=resolve(tmp,checkpoint.slice(0,8));try{git(["worktree","add","--detach",wt,checkpoint],root);run("node",["tools/asset-builder/cli/fetch-natural-earth-hydrography-10m.js"],wt);run("node",["tools/asset-builder/cli/build-anatolia-hydrography-10m.js"],wt);instrument(wt);let status="success",out="";try{out=run("npm",["run","build:historical-gis:1300"],wt);}catch(e){status="build-failed";out=`${e.stdout??""}\\n${e.stderr??""}`;}const stages=parse(out),num=stages.filter(x=>Number.isFinite(x.absArea)),min=num.reduce((m,x)=>Math.min(m,x.absArea),Infinity);results.push({checkpoint,status,stageCount:stages.length,minObservedAbsArea:Number.isFinite(min)?min:null,tinyHits:stages.filter(x=>Number.isFinite(x.absArea)&&Math.abs(x.absArea-TARGET_TINY)<=1e-15),thresholdHits:stages.filter(x=>Number.isFinite(x.absArea)&&x.absArea<=TINY_EPS),stages,outputTail:out.slice(-4000)});}catch(e){results.push({checkpoint,status:"harness-failed",error:e.message});}finally{try{git(["worktree","remove","--force",wt],root);}catch{}}}}finally{try{git(["checkout","--detach",original],root);}catch{}try{git(["worktree","prune"],root);}catch{}rmSync(tmp,{recursive:true,force:true});}
const report={target:TARGET,targetAnchor:TARGET_ANCHOR,targetTinyArea:TARGET_TINY,tinyThreshold:TINY_EPS,harness:"immutable detached checkpoint worktree + pinned Natural Earth + direct V15 producer instrumentation v2",checkpoints:results};writeFileSync("a2-amisos-stage-replay.json",JSON.stringify(report,null,2)+"\\n");console.log("A2_AMISOS_STAGE_REPLAY_V2");console.log(JSON.stringify(report,null,2));
