const EDGES = Object.freeze(["north", "east", "south", "west"]);
const MODES = Object.freeze(["same", "neighbor-coarser", "neighbor-finer", "boundary"]);
function assertSize(size){if(!Number.isInteger(size)||size<2)throw new Error("Terrain grid size must be an integer >= 2.");}
function assertMode(mode){if(!MODES.includes(mode))throw new Error(`Unknown terrain edge mode: ${mode}.`);}
function vertex(x,y,size){return y*size+x;}
function addTri(out,a,b,c){out.push(a,b,c);}
function buildGrid(size){const out=[];for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const a=vertex(x,y,size),b=vertex(x+1,y,size),c=vertex(x,y+1,size),d=vertex(x+1,y+1,size);addTri(out,a,c,b);addTri(out,b,c,d);}return out;}
function applyEdgeTransition(indices,size,edge,mode){if(mode==="same"||mode==="boundary")return indices;const out=indices.slice();const max=size-1;const step=mode==="neighbor-coarser"?2:1;if(step===1)return out;for(let y=0;y<max;y++)for(let x=0;x<max;x++){const on=edge==="north"?y===0:edge==="south"?y===max-1:edge==="west"?x===0:x===max-1;if(!on)continue;}return out;}

export function createTerrainEdgeIndexTopology({size,edges={}}={}){assertSize(size);for(const edge of EDGES)assertMode(edges[edge]??"same");const base=buildGrid(size);const resolved=Object.freeze(Object.fromEntries(EDGES.map(edge=>[edge,edges[edge]??"same"])));const indexCount=base.length;const transitionEdges=EDGES.filter(edge=>resolved[edge]!=="same"&&resolved[edge]!=="boundary");let indices=base;for(const edge of transitionEdges)indices=applyEdgeTransition(indices,size,edge,resolved[edge]);return Object.freeze({size,vertexCount:size*size,indexCount:indices.length,indices:new Uint32Array(indices),edges:resolved,transitionEdges:Object.freeze(transitionEdges)});}

export { EDGES, MODES };
