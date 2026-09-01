import { MapRendererContract } from "../MapRendererContract.js";

const VERTEX = `#version 300 es
precision highp float;
in vec2 aPosition;
uniform vec2 uCameraCenter;
uniform float uZoom;
uniform float uPitch;
uniform float uYaw;
void main(){
 vec2 p=aPosition-uCameraCenter; float y=radians(uYaw); float pch=radians(uPitch);
 vec2 r=vec2(p.x*cos(y)-p.y*sin(y),p.x*sin(y)+p.y*cos(y)); r.y*=max(0.65,cos(pch));
 vec2 view=vec2(360.0,180.0)/max(uZoom,0.001); gl_Position=vec4(r/(view*0.5),0.0,1.0);
}`;
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec4 uColor; uniform vec4 uSelected; uniform vec4 uHovered;
uniform float uSelectedId; uniform float uHoveredId; uniform float uProvinceId;
out vec4 outColor;
void main(){ vec4 c=uColor; if(abs(uProvinceId-uSelectedId)<0.5)c=mix(c,uSelected,0.68); else if(abs(uProvinceId-uHoveredId)<0.5)c=mix(c,uHovered,0.42); outColor=c; }`;
const PICK_FRAGMENT = `#version 300 es
precision highp float;
uniform float uProvinceId; out vec4 outColor;
vec4 encode(float id){ float r=mod(id,256.0); float g=mod(floor(id/256.0),256.0); float b=mod(floor(id/65536.0),256.0); return vec4(r,g,b,255.0)/255.0; }
void main(){outColor=encode(uProvinceId);}`;

export class BinaryMapRenderer extends MapRendererContract {
  constructor(canvas){ super(); this.canvas=canvas; this.state=null; this.camera={x:0,y:0,zoom:1,pitch:24,yaw:0}; this.selected=0; this.hovered=0; this.frame=0; this.frameRequest=0; this.pickPixel=new Uint8Array(4); this.disposed=false; }
  initialize({assetSource}){
    if(this.disposed)throw new Error("Cannot initialize disposed renderer");
    if(!assetSource) return false;
    const gl=this.canvas.getContext("webgl2",{alpha:false,antialias:true,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:"high-performance"}); if(!gl)return false;
    const program=link(gl,VERTEX,FRAGMENT), pickProgram=link(gl,VERTEX,PICK_FRAGMENT);
    const vao=gl.createVertexArray(), buffer=gl.createBuffer(), fbo=makePickFbo(gl); if(!vao||!buffer)throw new Error("GPU geometry allocation failed");
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,assetSource.geometry,gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,"aPosition"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,8,0);
    const pickLoc=gl.getAttribLocation(pickProgram,"aPosition"); gl.enableVertexAttribArray(pickLoc); gl.vertexAttribPointer(pickLoc,2,gl.FLOAT,false,8,0); gl.bindVertexArray(null); gl.bindBuffer(gl.ARRAY_BUFFER,null);
    this.state={gl,program,pickProgram,vao,buffer,fbo,assetSource,uniforms:uniforms(gl,program),pickUniforms:uniforms(gl,pickProgram)}; return true;
  }
  setCamera(c){this.camera={...this.camera,...c};}
  setSelectedProvinceId(id){this.selected=this.state?.assetSource.indexOf(id) ?? 0;}
  setHoveredRasterId(id){this.hovered=Number(id)>>>0;}
  lookupRasterId(id){return this.state?.assetSource.indexOf(id) + 1 || 0;}
  resize(w,h){const dpr=Math.min(globalThis.devicePixelRatio||1,2);const W=Math.max(1,Math.round(Number(w)*dpr)),H=Math.max(1,Math.round(Number(h)*dpr));if(this.canvas.width!==W||this.canvas.height!==H){this.canvas.width=W;this.canvas.height=H;}}
  render(){if(this.disposed||!this.state)return;const {gl}=this.state;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0.04,0.08,0.11,1);gl.clear(gl.COLOR_BUFFER_BIT);draw(this.state,this.camera,this.selected,this.hovered);this.frame+=1;}
  start(){if(this.disposed||this.frameRequest)return;const loop=()=>{if(this.disposed){this.frameRequest=0;return;}this.render();this.frameRequest=requestAnimationFrame(loop);};this.frameRequest=requestAnimationFrame(loop);}
  stop(){if(this.frameRequest)cancelAnimationFrame(this.frameRequest);this.frameRequest=0;}
  pick(x,y){if(this.disposed||!this.state)return null;const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return null;const lx=(Number(x)-r.left)/r.width,ly=(Number(y)-r.top)/r.height;if(lx<0||lx>1||ly<0||ly>1)return null;const uv=screenToWorld(lx,ly,this.camera);if(!uv)return null;const {gl,fbo,pickProgram,pickUniforms,vao,assetSource}=this.state;gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,1,1);gl.useProgram(pickProgram);gl.bindVertexArray(vao);gl.uniform2f(pickUniforms.cameraCenter,this.camera.x||0,this.camera.y||0);gl.uniform1f(pickUniforms.zoom,this.camera.zoom||1);gl.uniform1f(pickUniforms.pitch,this.camera.pitch||24);gl.uniform1f(pickUniforms.yaw,this.camera.yaw||0);for(let i=0;i<assetSource.tileCount;i+=1){const t=assetSource.tileRecord(i);gl.uniform1f(pickUniforms.provinceId,t[2]+1);gl.drawArrays(gl.TRIANGLE_FAN,t[0],t[1]);}gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,this.pickPixel);gl.bindVertexArray(null);gl.bindFramebuffer(gl.FRAMEBUFFER,null);const id=this.pickPixel[0]|(this.pickPixel[1]<<8)|(this.pickPixel[2]<<16);return id>0?assetSource.getProvinceId(id-1)??null:null;}
  dispose(){if(this.disposed)return;this.disposed=true;this.stop();const s=this.state;this.state=null;if(!s)return;const gl=s.gl;gl.deleteVertexArray(s.vao);gl.deleteBuffer(s.buffer);gl.deleteFramebuffer(s.fbo);gl.deleteProgram(s.program);gl.deleteProgram(s.pickProgram);}
}
function link(gl,v,f){const p=gl.createProgram(),vs=shader(gl,gl.VERTEX_SHADER,v),fs=shader(gl,gl.FRAGMENT_SHADER,f);if(!p||!vs||!fs)throw new Error("GPU program allocation failed");gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const e=gl.getProgramInfoLog(p)||"GPU program linking failed";gl.deleteProgram(p);throw new Error(e);}return p;}
function shader(gl,t,s){const x=gl.createShader(t);if(!x)throw new Error("GPU shader allocation failed");gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(x)||"GPU shader compilation failed";gl.deleteShader(x);throw new Error(e);}return x;}
function uniforms(gl,p){return{cameraCenter:gl.getUniformLocation(p,"uCameraCenter"),zoom:gl.getUniformLocation(p,"uZoom"),pitch:gl.getUniformLocation(p,"uPitch"),yaw:gl.getUniformLocation(p,"uYaw"),color:gl.getUniformLocation(p,"uColor"),selected:gl.getUniformLocation(p,"uSelected"),hovered:gl.getUniformLocation(p,"uHovered"),selectedId:gl.getUniformLocation(p,"uSelectedId"),hoveredId:gl.getUniformLocation(p,"uHoveredId"),provinceId:gl.getUniformLocation(p,"uProvinceId")};}
function makePickFbo(gl){const f=gl.createFramebuffer(),t=gl.createTexture();if(!f||!t)throw new Error("Picking target allocation failed");gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,1,1);gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("Picking framebuffer incomplete");gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,null);return f;}
function draw(s,c,selected,hovered){const gl=s.gl;gl.useProgram(s.program);gl.bindVertexArray(s.vao);gl.uniform2f(s.uniforms.cameraCenter,c.x||0,c.y||0);gl.uniform1f(s.uniforms.zoom,c.zoom||1);gl.uniform1f(s.uniforms.pitch,c.pitch||24);gl.uniform1f(s.uniforms.yaw,c.yaw||0);gl.uniform4f(s.uniforms.selected,0.95,0.78,0.18,1);gl.uniform4f(s.uniforms.hovered,1,1,1,1);gl.uniform1f(s.uniforms.selectedId,selected);gl.uniform1f(s.uniforms.hoveredId,hovered);for(let i=0;i<s.assetSource.tileCount;i+=1){const t=s.assetSource.tileRecord(i);const p=s.assetSource.getProvinceId(t[2]);const h=hashColor(p);gl.uniform4f(s.uniforms.color,h[0],h[1],h[2],1);gl.uniform1f(s.uniforms.provinceId,t[2]+1);gl.drawArrays(gl.TRIANGLE_FAN,t[0],t[1]);}gl.bindVertexArray(null);}
function hashColor(id){let x=(Number(id)>>>0)*2654435761>>>0;return[((x&255)/255)*0.65+0.2,(((x>>>8)&255)/255)*0.65+0.2,(((x>>>16)&255)/255)*0.65+0.2];}
function screenToWorld(x,y,c){const z=Math.max(0.001,c.zoom||1),p=(c.pitch||24)*Math.PI/180,yaw=(c.yaw||0)*Math.PI/180,cp=Math.max(0.65,Math.cos(p)),rx=(x*2-1)*180/z,ry=((1-y*2)*90/z)/cp;return{x:rx*Math.cos(yaw)+ry*Math.sin(yaw)+(c.x||0),y:-rx*Math.sin(yaw)+ry*Math.cos(yaw)+(c.y||0)};}
export default BinaryMapRenderer;
