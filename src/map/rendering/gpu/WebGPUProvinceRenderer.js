import { COMPUTE_CULL_SHADER, createProvinceMetaBufferData, INDIRECT_COMMAND_BYTES } from "./WebGPUProvincePipeline.js";

const USAGE = typeof GPUBufferUsage === "undefined" ? { STORAGE: 128, COPY_DST: 8, VERTEX: 32, INDEX: 16, INDIRECT: 256, UNIFORM: 64 } : GPUBufferUsage;

export async function createWebGPUProvinceRenderer(canvas, pack) {
  if (!navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter(); if (!adapter) return null;
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu"); if (!context) return null;
  const format = navigator.gpu.getPreferredCanvasFormat(); context.configure({ device, format, alphaMode: "premultiplied" });

  const vertices = device.createBuffer({ size: align4(pack.vertices.byteLength), usage: USAGE.VERTEX | USAGE.COPY_DST });
  const indices = device.createBuffer({ size: align4(pack.indices.byteLength), usage: USAGE.INDEX | USAGE.COPY_DST });
  const metadata = device.createBuffer({ size: align4(createProvinceMetaBufferData(pack).byteLength), usage: USAGE.STORAGE | USAGE.COPY_DST });
  const commands = device.createBuffer({ size: align4(pack.provinces.length * INDIRECT_COMMAND_BYTES), usage: USAGE.STORAGE | USAGE.INDIRECT | USAGE.COPY_DST });
  const camera = device.createBuffer({ size: 32, usage: USAGE.UNIFORM | USAGE.COPY_DST });
  device.queue.writeBuffer(vertices, 0, pack.vertices); device.queue.writeBuffer(indices, 0, pack.indices); device.queue.writeBuffer(metadata, 0, createProvinceMetaBufferData(pack));

  const shaderModule = device.createShaderModule({ code: COMPUTE_CULL_SHADER });
  const computePipeline = device.createComputePipeline({ layout: "auto", compute: { module: shaderModule, entryPoint: "main" } });
  const bindGroup = device.createBindGroup({ layout: computePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: metadata } }, { binding: 1, resource: { buffer: commands } }, { binding: 2, resource: { buffer: camera } }] });

  return {
    device, context, buffers: { vertices, indices, metadata, commands, camera },
    render({ centerX = 0, centerY = 0, halfWidth = 180, halfHeight = 90, zoom = 1 } = {}) {
      const cameraData = new Float32Array([centerX, centerY, halfWidth, halfHeight, zoom, 0, 0, 0]); device.queue.writeBuffer(camera, 0, cameraData);
      const encoder = device.createCommandEncoder(); const pass = encoder.beginComputePass(); pass.setPipeline(computePipeline); pass.setBindGroup(0, bindGroup); pass.dispatchWorkgroups(Math.ceil(pack.provinces.length / 64)); pass.end();
      // The compute-produced command buffer is ready for the render pass. The
      // final graphics pipeline is intentionally supplied by the MapEngine layer.
      device.queue.submit([encoder.finish()]);
    },
    destroy() { vertices.destroy(); indices.destroy(); metadata.destroy(); commands.destroy(); camera.destroy(); device.destroy(); },
  };
}

function align4(size) { return Math.max(4, (Number(size) + 3) & ~3); }
