import { isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint, isLakeInteriorPoint, nearestLakeBoundaryPoint, resolvePhysicalGeometryBoundaryPoint } from "./physical-land-authority.mjs";
const EPS = 1e-8;
const SAMPLES = 1024;
const MAX_DISTANCE = 0.75;
const isPhysical = (p) => isPhysicalLandPoint(p) || isFinalPhysicalGeometryBoundaryPoint(p);
const distance = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
const inside = (p, poly) => {
  if (!poly) return true;
  let hit = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[i], b=poly[j];
    if ((a[1]>p[1]) !== (b[1]>p[1]) && p[0] < ((b[0]-a[0])*(p[1]-a[1]))/((b[1]-a[1])||EPS)+a[0]) hit=!hit;
  }
  return hit;
};
const pathPhysical = (path) => {
  for (let i=0;i<path.length-1;i++) {
    const a=path[i], b=path[i+1];
    if (!isPhysical(a)||!isPhysical(b)) return false;
    const n=Math.max(16,Math.ceil(distance(a,b)/0.0025));
    for (let k=1;k<n;k++) { const t=k/n; const p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]; if(!isPhysical(p)) return false; }
  }
  return true;
};
const resolve = (p) => {
  if (isPhysical(p) && !isLakeInteriorPoint(p)) return [...p];
  if (isLakeInteriorPoint(p)) { const shore=nearestLakeBoundaryPoint(p); return shore.point && shore.distance<=MAX_DISTANCE ? [...shore.point] : null; }
  const point=resolvePhysicalGeometryBoundaryPoint(p);
  return point && isPhysical(point) ? [...point] : null;
};
const edge = (a,b,source) => {
  const path=[];
  for(let i=0;i<=SAMPLES;i++){
    const t=i/SAMPLES;
    const raw=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    const p=resolve(raw);
    if(!p || !inside(p,source)) return null;
    if(!path.length || distance(path[path.length-1],p)>EPS) path.push(p);
  }
  return pathPhysical(path)?path:null;
};
const area = (poly) => Math.abs(poly.reduce((s,p,i)=>{const n=poly[(i+1)%poly.length];return s+p[0]*n[1]-n[0]*p[1];},0))/2;
export function repairPhysicalPolygon(polygon, options={}) {
  if(!Array.isArray(polygon)||polygon.length<3) throw new Error("Physical polygon repair requires a polygon with at least three vertices.");
  const source=options.containmentPolygon??null;
  const originalArea=area(polygon);
  if(polygon.every(isPhysical)&&polygon.every((p,i)=>pathPhysical([p,polygon[(i+1)%polygon.length]])&&inside(p,source))) return polygon;
  const out=[];
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i], b=polygon[(i+1)%polygon.length];
    const route=edge(a,b,source);
    if(!route) throw new Error(`Physical edge recovery failed (${a.join(",")} → ${b.join(",")}).`);
    for(const p of route) if(!out.length||distance(out[out.length-1],p)>EPS) out.push(p);
  }
  if(out.length>1&&distance(out[0],out[out.length-1])<=EPS) out.pop();
  if(out.length<3||!out.every(isPhysical)||!pathPhysical([...out,out[0]])) throw new Error("Physical polygon repair produced a non-physical boundary path.");
  if(area(out)<originalArea*0.05) throw new Error("Physical polygon repair collapsed more than 95% of the source area.");
  if(source&&!out.every((p)=>inside(p,source))) throw new Error("Physical polygon repair escaped the source partition cell.");
  return out;
}
