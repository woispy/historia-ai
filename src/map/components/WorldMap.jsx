import { useCallback, useMemo, useState } from "react";
import { useWorldMap } from "../hooks";
import {
  ProvinceLayer,
  HistoricalPoliticalRegionLayer,
  CityLayer,
  PhysicalGeographyLayer,
  RegionalHydrographyLayer,
  WorldPhysicalLayer,
  CartographyLayer,
} from "./layers";
import { CameraProvider, CameraViewport, useCamera, useCameraController } from "../camera";
import { RenderRoot, RenderLayer, SvgRenderer } from "../rendering";

const HISTORICAL_1300_DATE = "1300-01-01";

function WorldMap({
  runtime,
  selectedProvinceId,
  onProvinceClick,
  onCityClick,
  selectedCityId: controlledSelectedCityId = null,
  settings = {},
}) {
  const { provinces, cities } = useWorldMap(runtime);
  const camera = useCamera();
  const cameraState = camera.camera;
  const [internalSelectedCityId, setInternalSelectedCityId] = useState(null);
  const selectedCityId = controlledSelectedCityId ?? internalSelectedCityId;
  const isHistoricalPoliticalMap = runtime?.scenario?.startDate === HISTORICAL_1300_DATE;

  const cameraInput = useCameraController({
    zoom: camera.zoom,
    move: camera.move,
    smooth: settings.smoothCamera !== false,
  });

  const cityClick = useCallback((cityId) => {
    setInternalSelectedCityId(cityId);
    onCityClick?.(cityId);
  }, [onCityClick]);

  const world = useMemo(
    () => <WorldPhysicalLayer zoom={cameraState.zoom} />,
    [cameraState.zoom],
  );

  const politicalRegions = useMemo(
    () => (
      <HistoricalPoliticalRegionLayer
        date={runtime?.scenario?.startDate ?? "1300-01-01"}
        provinces={provinces}
      />
    ),
    [runtime?.scenario?.startDate, provinces],
  );

  const provincesLayer = useMemo(
    () => (
      <ProvinceLayer
        provinces={provinces}
        selectedProvinceId={selectedProvinceId}
        onProvinceClick={onProvinceClick}
        mapStyle={settings.mapStyle ?? "detailed"}
        mapShadows={settings.mapShadows !== false}
        zoom={cameraState.zoom}
        camera={cameraState}
        renderFill={!isHistoricalPoliticalMap}
      />
    ),
    [
      provinces,
      selectedProvinceId,
      onProvinceClick,
      settings.mapStyle,
      settings.mapShadows,
      cameraState,
      isHistoricalPoliticalMap,
    ],
  );

  const cartography = useMemo(
    () => <CartographyLayer zoom={cameraState.zoom} />,
    [cameraState.zoom],
  );
  const detail = useMemo(
    () => <PhysicalGeographyLayer phase="detail" zoom={cameraState.zoom} camera={cameraState} />,
    [cameraState],
  );
  const hydrography = useMemo(
    () => <RegionalHydrographyLayer zoom={cameraState.zoom} camera={cameraState} />,
    [cameraState],
  );
  const citiesLayer = useMemo(
    () => (
      <CityLayer
        cities={cities}
        zoom={cameraState.zoom}
        camera={cameraState}
        selectedCityId={selectedCityId}
        onCityClick={cityClick}
      />
    ),
    [cities, cameraState, selectedCityId, cityClick],
  );
  const layers = useMemo(
    () => (
      <RenderLayer>
        {world}
        {provincesLayer}
        {politicalRegions}
        {cartography}
        {detail}
        {hydrography}
        {citiesLayer}
      </RenderLayer>
    ),
    [world, provincesLayer, politicalRegions, cartography, detail, hydrography, citiesLayer],
  );

  return (
    <CameraProvider value={camera}>
      <CameraViewport cameraInput={cameraInput}>
        <RenderRoot>
          <SvgRenderer camera={cameraState}>{layers}</SvgRenderer>
        </RenderRoot>
      </CameraViewport>
    </CameraProvider>
  );
}

export default WorldMap;
