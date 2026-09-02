export const MAP_RENDER_PASSES=Object.freeze([
{id:0,name:"background-ocean",domain:"water",mask:"physical"},
{id:1,name:"physical-land",domain:"physical",mask:"physical"},
{id:2,name:"terrain",domain:"terrain",mask:"physical",geometry:"terrain-tile-lod",streaming:"spatial-tile"},
{id:3,name:"political-province",domain:"political",mask:"physical"},
{id:4,name:"province-borders",domain:"political-border",mask:"physical"},
{id:5,name:"rivers",domain:"water",mask:"physical"},
{id:6,name:"lakes",domain:"water",mask:"physical"},
{id:7,name:"coastline",domain:"physical-border",mask:"physical"},
{id:8,name:"fog",domain:"gameplay",mask:"physical"},
{id:9,name:"cities",domain:"gameplay",mask:"physical"},
{id:10,name:"labels",domain:"cartographic",mask:"physical"},
]);
