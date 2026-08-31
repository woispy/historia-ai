const EDGES = Object.freeze(["north", "east", "south", "west"]);
const MODES = Object.freeze(["same", "neighbor-coarser", "neighbor-finer", "boundary"]);
function assertSize(size){if(!Number.isInteger(size)||size<3||size%2===0)throw new Error("Terrain grid size must be an odd integer >= 3 for 2:1 edge stitching.");}
function assertMode(mode){if(!MODES.includes(mode))throw new Error(`Unknown terrain edge mode: ${mode}.`);}
function v(x,y,n){return y*n+x;}
function tri(out,a,b,c){out.push(a,b,c);}
function baseGrid(n){const out=[];for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const a=v(x,y,n),b=v(x+1,y,n),c=v(x,y+1,n),d=v(x+1,y+1,n);tri(out,a,c,b);tri(out,b,c,d);}return out;}
function stitchNorth(out,n){const last=n-1;for(let x=0;x<last;x+=2){const b0=v(x,0,n),b1=v(x+1,0,n),b2=v(x+2,0,n),i0=v(x,1,n),i1=v(x+1,1,n),i2=v(x+2,1,n);tri(out,b0,i0,b2);tri(out,b2,i0,i2);tri(out,b2,i2,b1);tri(out,b1,i2,i1);}}
function stitchSouth(out,n){const last=n-1;for(let x=0;x<last;x+=2){const b0=v(x,last,n),b1=v(x+1,last,n),b2=v(x+2,last,n),i0=v(x,last-1,n),i1=v(x+1,last-1,n),i2=v(x+2,last-1,n);tri(out,b0,b2,i0);tri(out,b2,i2,i0);tri(out,b2,b1,i2);tri(out,b1,i1,i2);}}
function stitchWest(out,n){const last=n-1;for(let y=0;y<last;y+=2){const b0=v(0,y,n),b1=v(0,y+1,n),b2=v(0,y+2,n),i0=v(1,y,n),i1=v(1,y+1,n),i2=v(1,y+2,n);tri(out,b0,b2,i0);tri(out,b2,i2,i0);tri(out,b2,b1,i2);tri(out,b1,i1,i2);}}
function stitchEast(out,n){const last=n-1;for(let y=0;y<last;y+=2){const b0=v(last,y,n),b1=v(last,y+1,n),b2=v(last,y+2,n),i0=v(last-1,y,n),i1=v(last-1,y+1,n),i2=v(last-1,y+2,n);tri(out,b0,i0,b2);tri(out,b2,i0,i2);tri(out,b2,i2,b1);tri(out,b1,i2,i1);}}
function stitched(n,edges){const out=baseGrid(n);for(const edge of EDGES){if(edges[edge]==="same"||edges[edge]==="boundary")continue;if(edge==="north")stitchNorth(out,n);else if(edge==="south")stitchSouth(out,n);else if(edge==="west")stitchWest(out,n);else stitchEast(out,n);}return out;}
export function createTerrainEdgeIndexTopology({size,edges={}}={}){assertSize(size);for(const edge of EDGES)assertMode(edges[edge]??"same");const resolved=Object.freeze(Object.fromEntries(EDGES.map(edge=>[edge,edges[edge]??"same"])));const indices=stitched(size,resolved);const transitionEdges=EDGES.filter(edge=>resolved[edge]!=="same"&&resolved[edge]!=="boundary");return Object.freeze({size,vertexCount:size*size,indexCount:indices.length,indices:new Uint32Array(indices),edges:resolved,transitionEdges:Object.freeze(transitionEdges)});}
export { EDGES, MODES };
