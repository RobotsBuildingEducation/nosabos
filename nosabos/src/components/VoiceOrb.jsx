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
  // quintic interpolation — eliminates the grid artifacts
  f = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(
    mix(hash(i),           hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
    f.y
  );
}

float fbm(vec2 p){
  float v=0.0, a=0.5;
  // 6 octaves for smooth, detailed clouds
  for(int i=0;i<6;i++){
    v += a * noise(p);
    p = p * 2.2 + vec2(1.7, 9.2);
    a *= 0.42;
  }
  return v;
}

// secondary fbm at different frequency for layered detail
float fbm2(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){
    v += a * noise(p);
    p = p * 2.4 + vec2(5.3, 2.9);
    a *= 0.38;
  }
  return v;
}

void main(){
  vec2 uv = (v_uv - 0.5) * 2.0;
  float dist = length(uv);
  float mask = smoothstep(1.0, 0.84, dist);
  if(mask < 0.001) discard;

  float t = u_time;
  float energy = u_energy;
  float r = dist;

  float orbit1 = t * 0.60;
  float orbit2 = t * 0.46 + 3.14159;
  vec2 pole1 = vec2(cos(orbit1) * 0.42, sin(orbit1 * 1.2) * 0.36);
  vec2 pole2 = vec2(sin(orbit2 * 0.85) * 0.38, cos(orbit2) * 0.44);

  pole1 *= 1.0 + sin(t * 0.36) * 0.35;
  pole2 *= 1.0 + cos(t * 0.30) * 0.35;

  float d1 = length(uv - pole1);
  float d2 = length(uv - pole2);

  float inf1 = smoothstep(0.8, 0.05, d1);
  float inf2 = smoothstep(0.8, 0.05, d2);

  vec2 pull1 = (pole1 - uv) * inf1 * inf1 * 0.7;
  vec2 pull2 = (pole2 - uv) * inf2 * inf2 * 0.7;
  vec2 warp = pull1 + pull2;

  float blendF = inf1 / (inf1 + inf2 + 0.001);
  vec2 flowA = vec2(
    fbm(uv * 2.8 + pole1 * 1.5 + vec2(t*0.36, -t*0.28)),
    fbm(uv * 2.8 + pole1 * 1.5 + vec2(-t*0.32+3.3, t*0.40+1.7))
  );
  vec2 flowB = vec2(
    fbm(uv * 2.8 + pole2 * 1.5 + vec2(-t*0.40, t*0.30)),
    fbm(uv * 2.8 + pole2 * 1.5 + vec2(t*0.34+5.1, -t*0.38+2.3))
  );
  vec2 flow = mix(flowB, flowA, blendF);

  vec2 flow2 = vec2(
    fbm2(uv * 1.6 + flow * 0.5 + vec2(t*0.24)),
    fbm2(uv * 1.6 + flow * 0.5 + vec2(t*0.30 + 4.1))
  );

  vec2 dp = uv + warp + (flow + flow2 * 0.3) * 0.05;

  float wListen = smoothstep(0.0, 1.0, u_mode) * smoothstep(2.0, 1.0, u_mode);
  float wSpeak  = smoothstep(1.0, 2.0, u_mode);

  float ripple = sin(r * 8.0 - t * 3.5) * 0.09 * wListen * u_energy;
  vec2 dpListen = dp + normalize(uv + 0.001) * ripple;

  float spiralAngle = r * 6.0 * wSpeak * u_energy;
  float cs = cos(spiralAngle), sn = sin(spiralAngle);
  vec2 centered = dp;
  vec2 dpSpeak = vec2(centered.x * cs - centered.y * sn, centered.x * sn + centered.y * cs);

  vec2 dpFinal = mix(mix(dp, dpListen, wListen * u_energy), dpSpeak, wSpeak * u_energy);

  float n1 = smoothstep(0.22, 0.72, fbm(dpFinal * 2.2 + vec2(t*0.28, -t*0.20)));
  float n2 = smoothstep(0.22, 0.72, fbm(dpFinal * 2.5 - vec2(t*0.24, -t*0.32)));
  float n3 = smoothstep(0.25, 0.70, fbm(dpFinal * 1.9 + vec2(-t*0.20, t*0.26)));
  float nDetail = smoothstep(0.30, 0.65, fbm2(dpFinal * 3.6 + vec2(t*0.28, t*0.36)));

  vec3 colDeep  = vec3(0.03, 0.10, 0.32);
  vec3 colBlue  = vec3(0.20, 0.72, 0.99);
  vec3 colCyan  = vec3(0.10, 0.90, 0.75);
  vec3 colWhite = vec3(0.85, 0.92, 1.00);
  vec3 coreCol  = vec3(0.95, 0.94, 1.00);

  float massPresence = max(inf1, inf2);

  vec3 col = colDeep + vec3(0.02, 0.04, 0.08) * n1;

  vec3 cloud1 = mix(colDeep, colBlue, n1 * 0.8);
  cloud1 = mix(cloud1, colWhite, n3 * 0.35);
  cloud1 += (nDetail - 0.5) * 0.05;
  col = mix(col, cloud1, inf1);

  vec3 cloud2 = mix(colDeep, colCyan, n2 * 0.8);
  cloud2 = mix(cloud2, colWhite, n3 * 0.30);
  cloud2 += (nDetail - 0.5) * 0.05;
  col = mix(col, cloud2, inf2);

  float overlap = inf1 * inf2;
  col = mix(col, colWhite, overlap * (0.6 + n3 * 0.35));

  float glow1 = smoothstep(1.0, 0.3, d1) * (1.0 - inf1);
  float glow2 = smoothstep(1.0, 0.3, d2) * (1.0 - inf2);
  col += colBlue * glow1 * n1 * 0.15;
  col += colCyan * glow2 * n2 * 0.12;

  float tightCore = smoothstep(0.38, 0.0, r) * (0.4 + 0.6 * n1);
  col = mix(col, coreCol, tightCore * 0.78);

  float rim = pow(1.0 - r, 0.35) * 0.45;
  col += vec3(0.18, 0.45, 0.90) * rim * (1.0 + energy * 0.6);
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
