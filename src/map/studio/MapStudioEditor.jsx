import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fitGeoreferencer, ringSignedArea } from "./MapGeoreferencer.js";
import { autoCalibrate } from "./ControlPointAutomation.js";
import { drawReferenceLayer, referenceLayerStyle } from "./ReferenceLayerRenderer.js";

const VIEW_PADDING = 40;

/**
 * Historia AI — Map Studio Editor
 *
 * Digitization editor for the editorial reconstruction workflow.
 */
export default function MapStudioEditor({ template, mapConfig, coverage = null, referenceLayer = null, onChange = () => {} }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageReadyUrl, setImageReadyUrl] = useState(null);
  const [document_, setDocument_] = useState(template);
  const [activeProvinceId, setActiveProvinceId] = useState(template?.provinces?.[0]?.provinceId ?? null);

  const georeferencer = useMemo(() => {
    if (mapConfig?.imageWidth && mapConfig?.extent) {
      try {
        const calibration = autoCalibrate({
          imageWidth: mapConfig.imageWidth,
          imageHeight: mapConfig.imageHeight,
          extent: mapConfig.extent,
          cityAnchors: mapConfig.cityAnchors ?? [],
          includeMidpoints: mapConfig.includeMidpoints ?? false,
        });
        if (calibration.ready) return calibration.georeferencer;
        return null;
      } catch {
        return null;
      }
    }
    if (!mapConfig?.controlPoints?.length) return null;
    try {
      return fitGeoreferencer(mapConfig.controlPoints);
    } catch {
      return null;
    }
  }, [mapConfig]);

  // Intentional prop-to-editor-document synchronization: template is an external
  // source-of-truth replacement, not derived rendering state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDocument_(template); }, [template]);

  useEffect(() => {
    const imageUrl = mapConfig?.imageUrl;
    if (!imageUrl) {
      imageRef.current = null;
      setImageReadyUrl(null);
      return undefined;
    }
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setImageReadyUrl(imageUrl);
    };
    image.onerror = () => {
      if (imageRef.current === image) imageRef.current = null;
      setImageReadyUrl((current) => current === imageUrl ? null : current);
    };
    image.src = imageUrl;
    return () => {
      if (imageRef.current === image) imageRef.current = null;
    };
  }, [mapConfig?.imageUrl]);

  const imageReady = Boolean(mapConfig?.imageUrl && imageReadyUrl === mapConfig.imageUrl);

  const viewExtent = useMemo(() => {
    const bbox = coverage?.bbox;
    if (Array.isArray(bbox) && bbox.length === 4) return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3] };
    const lons = (mapConfig?.controlPoints ?? []).map((point) => Number(point.geo[0]));
    const lats = (mapConfig?.controlPoints ?? []).map((point) => Number(point.geo[1]));
    return { minX: Math.min(...lons), minY: Math.min(...lats), maxX: Math.max(...lons), maxY: Math.max(...lats) };
  }, [coverage, mapConfig]);

  const activeRing = useMemo(() => {
    const province = document_?.provinces?.find((entry) => entry.provinceId === activeProvinceId);
    return province?.ring ?? [];
  }, [document_, activeProvinceId]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b1620";
    ctx.fillRect(0, 0, width, height);

    const spanX = viewExtent.maxX - viewExtent.minX || 1;
    const spanY = viewExtent.maxY - viewExtent.minY || 1;
    const scale = Math.min((width - VIEW_PADDING * 2) / spanX, (height - VIEW_PADDING * 2) / spanY);
    const offsetX = (width - spanX * scale) / 2;
    const offsetY = (height - spanY * scale) / 2;
    const toCanvasX = (lon) => offsetX + (lon - viewExtent.minX) * scale;
    const toCanvasY = (lat) => height - (offsetY + (lat - viewExtent.minY) * scale);
    const geoToCanvas = (lon, lat) => [toCanvasX(lon), toCanvasY(lat)];

    const image = imageRef.current;
    if (image && georeferencer) {
      const corners = [[0, 0], [image.width, 0], [image.width, image.height], [0, image.height]]
        .map(([px, py]) => georeferencer.toGeo(px, py))
        .map(([lon, lat]) => geoToCanvas(lon, lat));
      const [p0, p1, p3] = [corners[0], corners[1], corners[3]];
      const m11 = (p1[0] - p0[0]) / image.width;
      const m12 = (p1[1] - p0[1]) / image.width;
      const m21 = (p3[0] - p0[0]) / image.height;
      const m22 = (p3[1] - p0[1]) / image.height;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.transform(m11, m12, m21, m22, p0[0], p0[1]);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    }

    if (referenceLayer) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      drawReferenceLayer(ctx, referenceLayer, viewExtent, geoToCanvas, referenceLayerStyle);
      ctx.restore();
    }

    for (const province of document_?.provinces ?? []) {
      if (!province.ring?.length) continue;
      ctx.beginPath();
      province.ring.forEach(([lon, lat], index) => {
        const [cx, cy] = geoToCanvas(lon, lat);
        if (index === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.strokeStyle = province.provinceId === activeProvinceId ? "#f5c542" : "#7fa8c9";
      ctx.lineWidth = province.provinceId === activeProvinceId ? 2.5 : 1.5;
      ctx.stroke();
      if (province.ring.length > 2) {
        ctx.fillStyle = province.provinceId === activeProvinceId ? "rgba(245,197,66,0.15)" : "rgba(127,168,201,0.08)";
        ctx.fill();
      }
      for (const [lon, lat] of province.ring) {
        const [cx, cy] = geoToCanvas(lon, lat);
        ctx.fillStyle = province.provinceId === activeProvinceId ? "#f5c542" : "#7fa8c9";
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const point of mapConfig?.controlPoints ?? []) {
      const [cx, cy] = geoToCanvas(Number(point.geo[0]), Number(point.geo[1]));
      ctx.strokeStyle = "#e05d5d";
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 5, cy + 5);
      ctx.moveTo(cx + 5, cy - 5); ctx.lineTo(cx - 5, cy + 5);
      ctx.stroke();
    }

    canvas.__view = { scale, offsetX, offsetY, toCanvasX, toCanvasY, geoToCanvas };
  }, [document_, activeProvinceId, viewExtent, georeferencer, mapConfig, referenceLayer]);

  useEffect(() => { draw(); }, [draw, imageReady]);

  const handleCanvasClick = useCallback((event) => {
    const canvas = canvasRef.current;
    const view = canvas?.__view;
    if (!canvas || !view || !georeferencer || !activeProvinceId) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const cx = (event.clientX - rect.left) * dpr;
    const cy = (event.clientY - rect.top) * dpr;
    const lonValue = viewExtent.minX + (cx - view.offsetX) / view.scale;
    const latValue = viewExtent.minY + (canvas.height - cy - view.offsetY) / view.scale;
    const nextDocument = {
      ...document_,
      provinces: document_.provinces.map((province) => (
        province.provinceId === activeProvinceId ? { ...province, ring: [...(province.ring ?? []), [lonValue, latValue]] } : province
      )),
    };
    setDocument_(nextDocument);
    onChange(nextDocument);
  }, [document_, activeProvinceId, georeferencer, onChange, viewExtent]);

  const undoLastVertex = useCallback(() => {
    if (!activeProvinceId) return;
    const nextDocument = {
      ...document_,
      provinces: document_.provinces.map((province) => (
        province.provinceId === activeProvinceId ? { ...province, ring: (province.ring ?? []).slice(0, -1) } : province
      )),
    };
    setDocument_(nextDocument);
    onChange(nextDocument);
  }, [document_, activeProvinceId, onChange]);

  const closeRing = useCallback(() => {
    if (!activeProvinceId) return;
    const nextDocument = {
      ...document_,
      provinces: document_.provinces.map((province) => {
        if (province.provinceId !== activeProvinceId) return province;
        const ring = province.ring ?? [];
        if (ring.length < 3) return province;
        const first = ring[0];
        const last = ring.at(-1);
        if (first[0] === last[0] && first[1] === last[1]) return province;
        return { ...province, ring: [...ring, [first[0], first[1]]] };
      }),
    };
    setDocument_(nextDocument);
    onChange(nextDocument);
  }, [document_, activeProvinceId, onChange]);

  const exportDocument = useCallback(() => {
    const blob = new Blob([JSON.stringify(document_, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${document_?.sourceId ?? "source-document"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [document_]);

  const area = activeRing.length >= 3 ? ringSignedArea(activeRing) : 0;
  const areaStatus = activeRing.length < 3 ? "need >= 3 points" : area > 0 ? "ccw" : area < 0 ? "cw" : "zero";

  return (
    <div style={{ display: "flex", gap: 12, fontFamily: "monospace", color: "#dce8f2" }}>
      <div>
        <canvas ref={canvasRef} width={760} height={560} onClick={handleCanvasClick} style={{ border: "1px solid #34506a", cursor: georeferencer ? "crosshair" : "not-allowed", background: "#0b1620" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="button" onClick={undoLastVertex}>Undo vertex</button>
          <button type="button" onClick={closeRing}>Close ring</button>
          <button type="button" onClick={exportDocument}>Export source document</button>
        </div>
        {!georeferencer && <p style={{ color: "#e05d5d" }}>Georeferencer unavailable: mapConfig needs &gt;= 3 non-collinear control points.</p>}
      </div>
      <div style={{ minWidth: 280, maxHeight: 560, overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 6px" }}>Provinces</h3>
        {(document_?.provinces ?? []).map((province) => (
          <div key={province.provinceId} onClick={() => setActiveProvinceId(province.provinceId)} style={{ padding: "4px 6px", marginBottom: 2, cursor: "pointer", background: province.provinceId === activeProvinceId ? "#34506a" : "transparent", border: province.provinceId === activeProvinceId ? "1px solid #f5c542" : "1px solid transparent" }}>
            {province.provinceId} — {province.ring?.length ?? 0} pts
          </div>
        ))}
        <h3 style={{ margin: "12px 0 6px" }}>Active ring</h3>
        <div>points: {activeRing.length}</div>
        <div>winding: {areaStatus}</div>
        {georeferencer && <div>georef RMS: {georeferencer.rmsResidual.toFixed(5)}° ({georeferencer.controlPointCount} control points)</div>}
        <p style={{ color: "#7fa8c9", fontSize: 12 }}>
          Click on the map to add boundary vertices for the selected province.
          Export produces the exact source document the proof-group pipeline consumes.
        </p>
      </div>
    </div>
  );
}
