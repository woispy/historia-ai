const EDGES=Object.freeze(["north","east","south","west"]);
const ADJACENT=Object.freeze([["north","east"],["east","south"],["south","west"],["west","north"]]);
export function resolveTerrainCornerTopologyPolicy(edges={}){const corners=[];for(const [a,b] of ADJACENT){const am=edges[a]??"same",bm=edges[b]??"same";const activeA=am!=="same"&&am!=="boundary",activeB=bm!=="same"&&bm!=="boundary";if(activeA&&activeB)corners.push(Object.freeze({corner:`${a}-${b}`,supported:false,mode:am===bm?am:"mixed"}));}return Object.freeze({corners:Object.freeze(corners),supported:corners.length===0,unsupportedCorners:Object.freeze(corners.map(c=>c.corner))});}
export { EDGES };
