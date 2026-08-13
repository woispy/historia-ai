import { useCallback, useMemo, useState } from "react";
import { useWorldMap } from "../hooks";
import { getAnatoliaCityMapMetadata } from "../data/AnatoliaCityAtlas";
import { ProvinceLayer, CityLayer, PhysicalGeographyLayer, WorldPhysicalLayer, CartographyLayer } from "./layers";
import { CameraProvider, CameraViewport, useCamera, useCameraController } from "../camera";
import { RenderRoot, RenderLayer, SvgRenderer } from "../rendering";
import ProvinceTextureLayer from "../rendering/gpu/ProvinceTextureLayer";
const focusZoom=(m)=>m?.tier==="capital"?3.6:m?.tier==="major"?3:2.55;
function WorldMap({runtime,selectedProvinceId,onProvinceClick,onCityClick,settings={}}){
 const {provinces,cities}=useWorldMap(runtime),camera=useCamera(),[textureReady,setTextureReady]=useState(false);
 const cameraInput=useCameraController({zoom:camera.zoom,move:camera.move,smooth:settings.smoothCamera!==false});
 const ready=useCallback((value)=>setTextureReady(Boolean(value)),[]);
 const cityClick=useCallback((cityId,cityMap)=>{const m=cityMap??getAnatoliaCityMapMetadata(cityId);if(m){camera.focus(m.x,m.y,{type:"city",id:cityId});camera.setZoom(focusZoom(m));}onCityClick?.(cityId);},[camera,onCityClick]);
 const world=useMemo(()=> <WorldPhysicalLayer/>,[]);
 const base=useMemo(()=> <PhysicalGeographyLayer phase="base" zoom={camera.zoom}/>,[camera.zoom]);
 const provincesLayer=useMemo(()=> <ProvinceLayer provinces={provinces} selectedProvinceId={selectedProvinceId} onProvinceClick={onProvinceClick} mapStyle={settings.mapStyle??"detailed"} mapShadows={settings.mapShadows!==false} zoom={camera.zoom} renderFill={!textureReady}/>,[provinces,selectedProvinceId,onProvinceClick,settings.mapStyle,settings.mapShadows,camera.zoom,textureReady]);
 const cartography=useMemo(()=> <CartographyLayer zoom={camera.zoom}/>,[camera.zoom]);
 const water=useMemo(()=> <PhysicalGeographyLayer phase="water" zoom={camera.zoom}/>,[camera.zoom]);
 const detail=useMemo(()=> <PhysicalGeographyLayer phase="detail" zoom={camera.zoom}/>,[camera.zoom]);
 const citiesLayer=useMemo(()=> <CityLayer cities={cities} zoom={camera.zoom} onCityClick={cityClick}/>,[cities,camera.zoom,cityClick]);
 const layers=useMemo(()=> <RenderLayer>{world}{base}{provincesLayer}{cartography}{water}{detail}{citiesLayer}</RenderLayer>,[world,base,provincesLayer,cartography,water,detail,citiesLayer]);
 return <CameraProvider value={camera}><CameraViewport cameraInput={cameraInput}><RenderRoot><ProvinceTextureLayer provinces={provinces} camera={camera.camera} mapStyle={settings.mapStyle??"detailed"} onReady={ready}/><SvgRenderer camera={camera.camera}>{layers}</SvgRenderer></RenderRoot></CameraViewport></CameraProvider>;
}
export default WorldMap;
