const EPS=1e-12;
const EDGES=Object.freeze(["north","east","south","west"]);
function finite(v){return Number.isFinite(v);}
function edgeTouch(a,b){
  const vertical=Math.abs(a.maxX-b.minX)<=EPS||Math.abs(b.maxX-a.minX)<=EPS;
  const horizontal=Math.abs(a.maxY-b.minY)<=EPS||Math.abs(b.maxY-a.minY)<=EPS;
  return {
    vertical:vertical&&Math.max(a.minY,b.minY)<Math.min(a.maxY,b.maxY)-EPS,
    horizontal:horizontal&&Math.max(a.minX,b.minX)<Math.min(a.maxX,b.maxX)-EPS,
  };
}
function relation(a,b){if(a.lod===b.lod)return "same";return a.lod>b.lod?"neighbor-coarser":"neighbor-finer";}
function add(result,i,edge,j,mode,overlap){
  const ref=Object.freeze({tileIndex:j,mode,overlapStart:overlap[0],overlapEnd:overlap[1]});
  result.segments[edge].push(ref);
  if(result.neighbors[edge]===null)result.neighbors[edge]=ref;
}
function overlapRange(a0,a1,b0,b1){return [Math.max(a0,b0),Math.min(a1,b1)];}
export function deriveTerrainTileAdjacency(tiles=[]){
  if(!Array.isArray(tiles))throw new Error("Terrain adjacency requires an array of tiles.");
  for(const t of tiles){
    if(!t||!Number.isInteger(t.lod)||!Number.isInteger(t.x)||!Number.isInteger(t.y)||!t.bounds||![t.bounds.minX,t.bounds.minY,t.bounds.maxX,t.bounds.maxY].every(finite))throw new Error("Invalid terrain tile for adjacency.");
    if(t.bounds.minX>=t.bounds.maxX||t.bounds.minY>=t.bounds.maxY)throw new Error("Invalid terrain tile bounds for adjacency.");
  }
  const result=new Map(tiles.map((t,i)=>[i,{
    neighbors:{north:null,east:null,south:null,west:null},
    segments:{north:[],east:[],south:[],west:[]},
  }]));
  for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++){
    const a=tiles[i],b=tiles[j],touch=edgeTouch(a.bounds,b.bounds);
    if(touch.vertical){
      const range=overlapRange(a.bounds.minY,a.bounds.maxY,b.bounds.minY,b.bounds.maxY);
      if(Math.abs(a.bounds.maxX-b.bounds.minX)<=EPS){add(result.get(i),i,"east",j,relation(a,b),range);add(result.get(j),j,"west",i,relation(b,a),range);}
      else if(Math.abs(b.bounds.maxX-a.bounds.minX)<=EPS){add(result.get(j),j,"east",i,relation(b,a),range);add(result.get(i),i,"west",j,relation(a,b),range);}
    }
    if(touch.horizontal){
      const range=overlapRange(a.bounds.minX,a.bounds.maxX,b.bounds.minX,b.bounds.maxX);
      if(Math.abs(a.bounds.maxY-b.bounds.minY)<=EPS){add(result.get(i),i,"north",j,relation(a,b),range);add(result.get(j),j,"south",i,relation(b,a),range);}
      else if(Math.abs(b.bounds.maxY-a.bounds.minY)<=EPS){add(result.get(j),j,"north",i,relation(b,a),range);add(result.get(i),i,"south",j,relation(a,b),range);}
    }
  }
  return Object.freeze(tiles.map((tile,i)=>{
    const r=result.get(i);
    return Object.freeze({
      tile,
      neighbors:Object.freeze(r.neighbors),
      edgeSegments:Object.freeze(Object.fromEntries(EDGES.map(edge=>[edge,Object.freeze(r.segments[edge])]))),
    });
  }));
}
export function assertTerrainAdjacencyBalance(adjacency){
  if(!Array.isArray(adjacency))throw new Error("Terrain adjacency balance requires derived adjacency.");
  for(const item of adjacency){
    if(!item?.neighbors||!item?.edgeSegments)throw new Error("Terrain adjacency is missing edge segment data.");
    for(const edge of EDGES){
      for(const n of item.edgeSegments[edge]){
        if(!adjacency[n.tileIndex])throw new Error(`Terrain adjacency references missing tile on ${edge}.`);
        const a=item.tile.lod,b=adjacency[n.tileIndex].tile.lod;
        if(Math.abs(a-b)>1)throw new Error(`Terrain adjacency violates 2:1 LOD balance on ${edge}.`);
        if(n.overlapStart>=n.overlapEnd)throw new Error(`Terrain adjacency contains an empty edge overlap on ${edge}.`);
      }
    }
  }
  return true;
}
export function toTerrainDrawPlanAdjacency(adjacencyItem,adjacency){
  if(!adjacencyItem?.tile||!adjacencyItem.neighbors||!adjacencyItem.edgeSegments||!Array.isArray(adjacency))throw new Error("Terrain draw-plan adjacency requires derived adjacency and item.");
  assertTerrainAdjacencyBalance(adjacency);
  const out={};
  for(const edge of EDGES){
    const refs=adjacencyItem.edgeSegments[edge];
    if(!Array.isArray(refs))throw new Error(`Terrain draw-plan adjacency is missing segments on ${edge}.`);
    out[edge]=refs.length===0?null:Object.freeze(refs.map(ref=>{
      const target=adjacency[ref.tileIndex]?.tile;
      if(!target)throw new Error(`Terrain draw-plan adjacency references missing tile on ${edge}.`);
      return Object.freeze({id:target.id??`${target.lod}/${target.x}/${target.y}`,lod:target.lod,resident:target.resident!==false,overlapStart:ref.overlapStart,overlapEnd:ref.overlapEnd,mode:ref.mode});
    }));
  }
  return Object.freeze(out);
}
