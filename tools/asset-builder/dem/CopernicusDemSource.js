import fs from "node:fs";
import path from "node:path";
import { decodeCopernicusGeoTiff } from "./GeoTiffDecoder.js";

export const COPERNICUS_GLO30_BUCKET = "https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com";
export const COPERNICUS_GLO30_TILE_LIST_URL = `${COPERNICUS_GLO30_BUCKET}/tileList.txt`;

export class CopernicusDemSource {
  constructor({ cacheDir = path.resolve(".cache/historia/copernicus-glo30"), tileListUrl = COPERNICUS_GLO30_TILE_LIST_URL } = {}) { this.cacheDir=cacheDir; this.tileListUrl=tileListUrl; this.tileIndex=null; this.loaded=new Map(); }
  async initialize(){fs.mkdirSync(this.cacheDir,{recursive:true});const indexPath=path.join(this.cacheDir,"tileList.txt");let text;if(fs.existsSync(indexPath))text=fs.readFileSync(indexPath,"utf8");else{text=await downloadText(this.tileListUrl);fs.writeFileSync(indexPath,text);}this.tileIndex=new Set(parseTileList(text));if(!this.tileIndex.size)throw new Error("Copernicus GLO-30 tileList.txt contained no DEM tiles.");return this;}
  hasTile(lat,lon){if(!this.tileIndex)throw new Error("CopernicusDemSource.initialize() must be called first.");return this.tileIndex.has(copernicusTileKey(lat,lon));}
  async readTile(lat,lon){if(!this.tileIndex)await this.initialize();const key=copernicusTileKey(lat,lon);if(this.loaded.has(key))return this.loaded.get(key);if(!this.tileIndex.has(key))return null;const fileName=`${key}.tif`,localPath=path.join(this.cacheDir,fileName);let bytes;if(fs.existsSync(localPath))bytes=fs.readFileSync(localPath);else{const url=`${COPERNICUS_GLO30_BUCKET}/${key}/${fileName}`;const response=await fetch(url);if(!response.ok)throw new Error(`Copernicus DEM request failed for ${key}: ${response.status} ${response.statusText}`);bytes=new Uint8Array(await response.arrayBuffer());if(!bytes.length)throw new Error(`Empty Copernicus DEM response for ${key}.`);fs.writeFileSync(localPath,bytes);}const raster=decodeCopernicusGeoTiff(bytes),entry={key,raster};this.loaded.set(key,entry);return entry;}
}
export function copernicusTileKey(lat,lon){const north=Math.floor(Number(lat)),east=Math.floor(Number(lon)),ns=north>=0?`N${pad2(north)}`:`S${pad2(Math.abs(north))}`,ew=east>=0?`E${pad3(east)}`:`W${pad3(Math.abs(east))}`;return`Copernicus_DSM_COG_10_${ns}_00_${ew}_00_DEM`;}
export function parseTileList(text){const result=[];for(const line of String(text).split(/\r?\n/)){const match=line.match(/(Copernicus_DSM_COG_10_[NS]\d{2}_00_[EW]\d{3}_00_DEM)\//);if(match)result.push(match[1]);}return result;}
export function sampleCopernicusRaster(entry,lon,lat){if(!entry?.raster)return null;const{width,height,data,nodata,georeference}=entry.raster,px=(Number(lon)-georeference.originX)/georeference.scaleX,py=(georeference.originY-Number(lat))/georeference.scaleY;if(px<0||py<0||px>width-1||py>height-1)return null;const x0=Math.floor(px),y0=Math.floor(py),x1=Math.min(width-1,x0+1),y1=Math.min(height-1,y0+1),fx=px-x0,fy=py-y0,values=[data[y0*width+x0],data[y0*width+x1],data[y1*width+x0],data[y1*width+x1]],valid=values.filter((value)=>Number.isFinite(value)&&(nodata===null||Math.abs(value-nodata)>1e-6));if(!valid.length)return null;const a=validValue(values[0],valid[0]),b=validValue(values[1],valid[0]),c=validValue(values[2],valid[0]),d=validValue(values[3],valid[0]);return a*(1-fx)*(1-fy)+b*fx*(1-fy)+c*(1-fx)*fy+d*fx*fy;}
function validValue(value,fallback){return Number.isFinite(value)&&value>-9000?value:fallback;}
async function downloadText(url){const response=await fetch(url);if(!response.ok)throw new Error(`Copernicus request failed: ${response.status} ${response.statusText}`);return response.text();}
function pad2(value){return String(value).padStart(2,"0");} function pad3(value){return String(value).padStart(3,"0");}
