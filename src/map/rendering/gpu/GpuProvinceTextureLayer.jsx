import { useEffect, useRef } from "react";

function GpuProvinceTextureLayer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    return undefined;
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}

export default GpuProvinceTextureLayer;
