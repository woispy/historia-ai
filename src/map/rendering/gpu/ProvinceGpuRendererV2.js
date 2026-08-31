/** WebGL2 compatibility renderer for the indexed GPU province pack. */
export function createIndexedProvinceRenderer(canvas) {
  const gl = canvas?.getContext?.("webgl2", { alpha: true, antialias: true, depth: false, stencil: false });
  if (!gl) throw new Error("Historia AI indexed province renderer requires WebGL2");
  const vertexShader = compile(gl, gl.VERTEX_SHADER, `#version 300 es
layout(location=0) in vec2 a_position; layout(location=1) in uint a_province;
uniform vec2 u_camera; uniform vec2 u_halfExtent; flat out uint v_province;
void main(){ vec2 p=(a_position-u_camera)/u_halfExtent; gl_Position=vec4(p.x,-p.y,0.0,1.0); v_province=a_province; }`);
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float; precision highp int; flat in uint v_province; uniform uint u_selected; uniform vec4 u_selectedColor; out vec4 outColor;
void main(){ outColor = v_province==u_selected ? u_selectedColor : vec4(0.42,0.45,0.35,1.0); }`);
  const pickFragmentShader = compile(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp int; flat in uint v_province; layout(location=0) out uint outId;
void main(){ outId=v_province; }`);
  const program = link(gl, vertexShader, fragmentShader); const pickProgram = link(gl, vertexShader, pickFragmentShader);
  gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader); gl.deleteShader(pickFragmentShader);
  const vao = gl.createVertexArray(); const position = gl.createBuffer(); const province = gl.createBuffer(); const index = gl.createBuffer();
  if (!vao || !position || !province || !index) throw new Error("Unable to allocate indexed province buffers");
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, position); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, province); gl.enableVertexAttribArray(1); gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index); gl.bindVertexArray(null);
  const locations = (p) => ({ camera: gl.getUniformLocation(p, "u_camera"), halfExtent: gl.getUniformLocation(p, "u_halfExtent"), selected: gl.getUniformLocation(p, "u_selected"), selectedColor: gl.getUniformLocation(p, "u_selectedColor") });
  const visualLocations = locations(program); const pickLocations = locations(pickProgram);
  let pack = null; let visibleRanges = [];
  const setCamera = (p, loc, camera, zoom) => { gl.useProgram(p); gl.uniform2f(loc.camera, Number(camera.x) || 0, Number(camera.y) || 0); gl.uniform2f(loc.halfExtent, 180 / Math.max(zoom, 0.0001), 90 / Math.max(zoom, 0.0001)); };
  const drawRanges = () => { let calls=0; for (const range of visibleRanges) { const first=Number(range.firstIndex)||0; const count=Number(range.indexCount)||0; if (count>0 && count%3===0 && first>=0 && first+count<=pack.indices.length) { gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_INT,first*4); calls+=1; } } return calls; };
  return {
    upload(nextPack) { if (!nextPack?.vertices || !nextPack?.indices || !nextPack?.provinces) throw new Error("Invalid indexed province pack"); pack=nextPack; gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER,position); gl.bufferData(gl.ARRAY_BUFFER,pack.vertices,gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER,province); gl.bufferData(gl.ARRAY_BUFFER,buildProvinceVertexIndices(pack),gl.STATIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,pack.indices,gl.STATIC_DRAW); gl.bindVertexArray(null); },
    setVisibleRanges(ranges) { visibleRanges=Array.isArray(ranges)?ranges:[]; },
    render({camera={x:0,y:0},zoom=1,selectedProvinceIndex=0xffffffff}={}) { if(!pack)return 0; gl.viewport(0,0,canvas.width,canvas.height); gl.bindVertexArray(vao); setCamera(program,visualLocations,camera,zoom); gl.uniform1ui(visualLocations.selected,Number(selectedProvinceIndex)>>>0); gl.uniform4f(visualLocations.selectedColor,0.84,0.69,0.30,1); const calls=drawRanges(); gl.bindVertexArray(null); return calls; },
    renderPicking({camera={x:0,y:0},zoom=1}={}) { if(!pack)return 0; gl.bindVertexArray(vao); setCamera(pickProgram,pickLocations,camera,zoom); const calls=drawRanges(); gl.bindVertexArray(null); return calls; },
    dispose(){gl.deleteBuffer(position);gl.deleteBuffer(province);gl.deleteBuffer(index);gl.deleteVertexArray(vao);gl.deleteProgram(program);gl.deleteProgram(pickProgram);}, gl,
  };
}
function buildProvinceVertexIndices(pack){const out=new Uint32Array(pack.indices.length);for(let i=0;i<pack.indices.length;i+=1)out[i]=findProvinceForIndex(pack.provinces,i);return out;}
function findProvinceForIndex(provinces,index){for(const province of provinces)for(const range of province.lodRanges??[])if(index>=range.firstIndex&&index<range.firstIndex+range.indexCount)return province.provinceIndex;return 0xffffffff;}
function compile(gl,type,source){const shader=gl.createShader(type);if(!shader)throw new Error("GPU shader allocation failed");gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(shader)||"shader compile failed";gl.deleteShader(shader);throw new Error(log);}return shader;}
function link(gl,vertex,fragment){const program=gl.createProgram();if(!program)throw new Error("GPU program allocation failed");gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const log=gl.getProgramInfoLog(program)||"program link failed";gl.deleteProgram(program);throw new Error(log);}return program;}
