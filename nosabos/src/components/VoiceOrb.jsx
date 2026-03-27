import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_energy;
uniform float u_mode;

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<3;i++){ v+=a*noise(p); p=p*2.6+vec2(1.7,9.2); a*=0.38; }
  return v;
}

void main(){
  vec2 uv = (v_uv - 0.5) * 2.0;
  float dist = length(uv);
  float mask = smoothstep(1.0, 0.84, dist);
  if(mask < 0.001) discard;

  float t = u_time;
  float energy = u_energy;
  float angle = atan(uv.y, uv.x);
  float r = dist;

  vec2 flow = vec2(
    fbm(uv * 2.8 + vec2(t*0.36, t*0.26)),
    fbm(uv * 2.8 + vec2(t*0.29+3.3, t*0.34+1.7))
  );
  vec2 dp = uv + flow * 0.05;

  float wListen = smoothstep(0.0, 1.0, u_mode) * smoothstep(2.0, 1.0, u_mode);
  float wSpeak  = smoothstep(1.0, 2.0, u_mode);

  // Listening: radial pulse strong enough to read clearly
  float ripple = sin(r * 8.0 - t * 3.5) * 0.09 * wListen * u_energy;
  vec2 dpListen = dp + normalize(uv + 0.001) * ripple;

  // Speaking: slow spiral warp — visible swirl without chaos
  float twist = r * 1.4 * wSpeak * u_energy;
  float cs = cos(twist), sn = sin(twist);
  vec2 dpSpeak = vec2(dp.x * cs - dp.y * sn, dp.x * sn + dp.y * cs);

  vec2 dpFinal = mix(mix(dp, dpListen, wListen * u_energy), dpSpeak, wSpeak * u_energy);

  float n1 = smoothstep(0.33, 0.65, fbm(dpFinal * 2.2 + vec2(t*0.32)));
  float n2 = smoothstep(0.33, 0.65, fbm(dpFinal * 2.8 - vec2(t*0.40, t*0.22)));
  float n3 = smoothstep(0.33, 0.65, fbm(dpFinal * 1.9 + vec2(t*0.18, t*0.44)));

  vec3 colA = vec3(0.00, 0.99, 0.95);
  vec3 colB = vec3(0.00, 0.00, 0.95);
  vec3 colC = vec3(0.00, 0.99, 0.00);
  vec3 colD = vec3(0.00, 0.70, 1.00);
  vec3 coreCol = vec3(0.40, 0.88, 1.00);

  vec3 col = colB;
  col = mix(col, colA, n1 * 0.70);
  col = mix(col, colC, n2 * 0.40);
  col = mix(col, colD, n3 * 0.99);

  float tightCore = smoothstep(0.38, 0.0, r) * (0.4 + 0.6*n1);
  col = mix(col, coreCol, tightCore * 0.75);

  float rim = pow(1.0 - r, 0.35) * 0.45;
  col += vec3(0.0, 0.60, 1.0) * rim * (1.0 + energy * 0.6);
  col *= mask;
  float breathe = sin(t * 0.9) * 0.03 + 0.97;
  col *= 0.9 + breathe * 0.1;

  gl_FragColor = vec4(col, mask);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

/**
 * VoiceOrb
 *
 * Props:
 *   state  — "idle" | "listening" | "speaking"  (default: "idle")
 *   size   — canvas display size in px           (default: 300)
 */
export default function VoiceOrb({ state = "idle", size = 75 }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    energy: 0,
    mode: 0,
    targetEnergy: 0,
    targetMode: 0,
  });

  // Sync prop → target uniforms
  useEffect(() => {
    const sr = stateRef.current;
    if (state === "idle") {
      sr.targetEnergy = 0;
      sr.targetMode = 0;
    }
    if (state === "listening") {
      sr.targetEnergy = 1;
      sr.targetMode = 1;
    }
    if (state === "speaking") {
      sr.targetEnergy = 1;
      sr.targetMode = 2;
    }
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const PX = size * DPR;
    canvas.width = PX;
    canvas.height = PX;

    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uEnergy = gl.getUniformLocation(prog, "u_energy");
    const uMode = gl.getUniformLocation(prog, "u_mode");

    let raf,
      then = 0;
    function frame(now) {
      now *= 0.001;
      const dt = Math.min(now - then, 0.05);
      then = now;
      const sr = stateRef.current;
      sr.energy += (sr.targetEnergy - sr.energy) * Math.min(dt * 2.5, 1);
      sr.mode += (sr.targetMode - sr.mode) * Math.min(dt * 3.0, 1);

      gl.viewport(0, 0, PX, PX);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, now);
      gl.uniform1f(uEnergy, sr.energy);
      gl.uniform1f(uMode, sr.mode);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}
