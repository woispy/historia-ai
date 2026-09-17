import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const TARGET = 'pontus-amisos';
const TARGET_TINY = 2.27e-13;
const TINY_EPS = 1e-10;
const TARGET_ANCHOR = [36.33, 41.29];
const CHECKPOINTS = [
  '837ec8dd2d878ceb227f609c3da481610b54d0db',
  'bdf166a4',
  '3021b2d1',
  '7d895c99',
  '5be399d4',
  '6b7424125eee4a1c72925b7a1780c68e695e9ba3',
];

function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
}
function fnBounds(source, name) {
  const m = new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)\\s*\\{`, 'm').exec(source);
  if (!m) return null;
  const open = source.indexOf('{', m.index);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return { open, end: i + 1, params: m[1].split(',').map((x) => x.trim()) };
    }
  }
  return null;
}
function replaceBody(source, fn, transform) {
  return source.slice(0, fn.open + 1) + transform(source.slice(fn.open + 1, fn.end - 1), fn.params) + source.slice(fn.end - 1);
}
function area(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  let s = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]; const b = ring[(i + 1) % ring.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
function stat(ring) {
  const signedArea = area(ring);
  return { vertices: Array.isArray(ring) ? ring.length : 0, signedArea, absArea: signedArea == null ? null : Math.abs(signedArea), tiny: signedArea != null && Math.abs(signedArea) <= TINY_EPS };
}

const PREFIX = `\nconst __A2_TARGET = '${TARGET}';\nconst __A2_ANCHOR = [${TARGET_ANCHOR[0]}, ${TARGET_ANCHOR[1]}];\nfunction __a2Area(r){if(!Array.isArray(r)||r.length<3)return null;let s=0;for(let i=0;i<r.length;i+=1){const a=r[i],b=r[(i+1)%r.length];s+=a[0]*b[1]-b[0]*a[1];}return s/2;}\nfunction __a2Stat(r){const signedArea=__a2Area(r);return {vertices:Array.isArray(r)?r.length:0,signedArea,absArea:signedArea==null?null:Math.abs(signedArea),tiny:signedArea!=null&&Math.abs(signedArea)<=${TINY_EPS}};}\nfunction __a2Emit(stage,payload){console.log('A2_STAGE|'+JSON.stringify({stage,...payload}));}\nfunction __a2Anchor(p){return Array.isArray(p)&&Math.hypot(p[0]-__A2_ANCHOR[0],p[1]-__A2_ANCHOR[1])<0.05;}\n`;

function instrumentV15(file) {
  let s = PREFIX + readFileSync(file, 'utf8');
  let f = fnBounds(s, 'powerCell');
  if (!f) throw new Error('missing V15 powerCell');
  s = replaceBody(s, f, (b, p) => {
    let x = `\nconst __a2Target = ${p[1]}?.[${p[0]}]?.provinceId === __A2_TARGET;\n${b}`;
    x = x.replace(/polygon\s*=\s*halfPlane\(polygon,([^;]+)\);/g, (m) => `${m}\nif(__a2Target)__a2Emit('A_POWER_CELL_ITERATION',{polygon:__a2Stat(polygon)});`);
    x = x.replace(/return polygon;/g, "if(__a2Target)__a2Emit('A_RAW_POWER_CELL',{polygon:__a2Stat(polygon)});return polygon;");
    return x;
  });
  f = fnBounds(s, 'clipCellToLand');
  if (!f) throw new Error('missing V15 clipCellToLand');
  s = replaceBody(s, f, (b, p) => {
    let x = `\nconst __a2Target = __a2Anchor(${p[1]});\n${b}`;
    x = x.replace(/const candidates\s*=\s*([^;]+);/, (m) => `${m}\nif(__a2Target)__a2Emit('B_PHYSICAL_CLIP_CANDIDATES',{candidateCount:candidates.length,candidates:candidates.map(__a2Stat)});`);
    x = x.replace(/const selected\s*=\s*([^;]+);/, (m) => `${m}\nif(__a2Target)__a2Emit('B_PHYSICAL_CLIP_SELECTED',{selected:__a2Stat(selected),candidateCount:candidates.length});`);
    return x;
  });
  f = fnBounds(s, 'normalizePhysicalBoundary');
  if (f) {
    s = replaceBody(s, f, (b, p) => `\nconst __a2Input=__a2Stat(${p[0]});if(__a2Input.tiny)__a2Emit('C_NORMALIZE_INPUT_TINY',{input:__a2Input});\n${b}`);
  }
  f = fnBounds(s, 'buildPartition');
  if (!f) throw new Error('missing V15 buildPartition');
  s = replaceBody(s, f, (b) => {
    let x = b;
    x = x.replace(/const rawPolygon\s*=\s*([^;]+);/, (m) => `${m}\nif(site?.provinceId===__A2_TARGET)__a2Emit('B_RAW_AFTER_LAND_CLIP',{rawPolygon:__a2Stat(rawPolygon)});`);
    x = x.replace(/const normalizedPolygon\s*=\s*([^;]+);/, (m) => `${m}\nif(site?.provinceId===__A2_TARGET)__a2Emit('C_NORMALIZED',{normalizedPolygon:__a2Stat(normalizedPolygon)});`);
    x = x.replace(/const polygon\s*=\s*([^;]+);/, (m) => `${m}\nif(site?.provinceId===__A2_TARGET)__a2Emit('C_SELECTED',{selected:__a2Stat(polygon),rawPolygon:__a2Stat(rawPolygon),normalizedPolygon:__a2Stat(normalizedPolygon)});`);
    return `\n${x}`;
  });
  writeFileSync(file, s, 'utf8');
}

function instrumentMain(file) {
  let s = PREFIX + readFileSync(file, 'utf8');
  const f = fnBounds(s, 'buildLandVoronoiCells');
  if (!f) throw new Error('missing main buildLandVoronoiCells');
  s = replaceBody(s, f, (b) => {
    let x = b;
    x = x.replace(/for\s*\(const\s+\[index,\s*site\]\s+of\s+politicalSites\.entries\(\)\)\s*\{/, (m) => `${m}\nconst __a2Target=site?.provinceId===__A2_TARGET;if(__a2Target)__a2Emit('A_LOOP_SITE',{site});`);
    x = x.replace(/const\s+cell\s*=\s*powerCell\(([^;]+)\);/, (m) => `${m}\nif(__a2Target)__a2Emit('A_RAW_POWER_CELL',{polygon:__a2Stat(cell)});`);
    x = x.replace(/const\s+clipped\s*=\s*clipLandByCell\(([^;]+)\);/, (m) => `${m}\nif(__a2Target)__a2Emit('B_PHYSICAL_CLIP_RESULT',{polygons:clipped.map(__a2Stat)});`);
    return x;
  });
  writeFileSync(file, s, 'utf8');
}
function parse(out){return out.split('\n').flatMap((line)=>{if(!line.startsWith('A2_STAGE|'))return [];try{return [JSON.parse(line.slice(9))];}catch{return [];}});}

const root=process.cwd();
const original=git(['rev-parse','HEAD']);
const tmp=mkdtempSync(resolve(tmpdir(),'historia-a2-stage-v3-'));
const results=[];
try {
  for (const checkpoint of CHECKPOINTS) {
    const wt=resolve(tmp,checkpoint.slice(0,8));
    try {
      git(['worktree','add','--detach',wt,checkpoint],root);
      run('node',['tools/asset-builder/cli/fetch-natural-earth-hydrography-10m.js'],wt);
      run('node',['tools/asset-builder/cli/build-anatolia-hydrography-10m.js'],wt);
      const v15=resolve(wt,'tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js');
      const main=resolve(wt,'tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js');
      let producer='none';
      if(existsSync(v15)){instrumentV15(v15);producer='V15';}
      else if(existsSync(main)){instrumentMain(main);producer='main';}
      else throw new Error('no Phase 2D geometry producer found');
      let status='success'; let out='';
      try{out=run('npm',['run','build:historical-gis:1300'],wt);}catch(e){status='build-failed';out=`${e.stdout??''}\n${e.stderr??''}`;}
      const stages=parse(out);const numeric=stages.filter((x)=>Number.isFinite(x?.absArea));
      const min=numeric.reduce((m,x)=>Math.min(m,x.absArea),Infinity);
      results.push({checkpoint,producer,status,stageCount:stages.length,minObservedAbsArea:Number.isFinite(min)?min:null,tinyHits:stages.filter((x)=>Number.isFinite(x?.absArea)&&Math.abs(x.absArea-TARGET_TINY)<=1e-15),thresholdHits:stages.filter((x)=>Number.isFinite(x?.absArea)&&x.absArea<=TINY_EPS),stages,outputTail:out.slice(-4000)});
    }catch(e){results.push({checkpoint,status:'harness-failed',error:e.message});}
    finally{try{git(['worktree','remove','--force',wt],root);}catch{}}
  }
} finally {try{git(['checkout','--detach',original],root);}catch{}try{git(['worktree','prune'],root);}catch{}rmSync(tmp,{recursive:true,force:true});}
const report={target:TARGET,targetAnchor:TARGET_ANCHOR,targetTinyArea:TARGET_TINY,tinyThreshold:TINY_EPS,harness:'immutable detached checkpoint worktree + pinned Natural Earth + producer V15/main instrumentation v3',checkpoints:results};
writeFileSync('a2-amisos-stage-replay-v3.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
