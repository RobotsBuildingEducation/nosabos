import { useEffect, useRef } from "react";

import { useThemeStore } from "../useThemeStore";

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
uniform float u_theme;

#define NUM_OCTAVES 4

// ---------- basic noise ----------
float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  float res = mix(
    mix(rand(ip),            rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
    u.y
  );
  return res * res;
}

float fbm(vec2 x) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < NUM_OCTAVES; ++i) {
    v += a * vnoise(x);
    x = rot * x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

// ---------- classic Perlin 3D (cnoise) ----------
vec4 permute(vec4 x) { return mod((x * 34.0 + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.z); vec4 iz1 = vec4(Pi1.z);
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(vec4(0.0), gx0) - 0.5);
  gy0 -= sz0 * (step(vec4(0.0), gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(vec4(0.0), gx1) - 0.5);
  gy1 -= sz1 * (step(vec4(0.0), gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x); vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z); vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x); vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z); vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

// ---------- linear burn blend ----------
vec3 linearBurn(vec3 base, vec3 blend, float opacity) {
  return max(base + blend - vec3(1.0), vec3(0.0)) * opacity + base * (1.0 - opacity);
}

void main(){
  vec2 p = (v_uv - 0.5) * 2.0;
  float r = length(p);
  float mask = smoothstep(1.0, 0.84, r);
  if (mask < 0.001) discard;

  // ---------- apply listen/speak distortions to the sample position ----------
  float wListen = smoothstep(0.0, 1.0, u_mode) * smoothstep(2.0, 1.0, u_mode);
  float wSpeak  = smoothstep(1.0, 2.0, u_mode);

  vec2 dp = p;

  // listening ripple
  float ripple1 = sin(r * 12.0 - u_time * 4.0) * 0.18;
  float ripple2 = sin(r * 20.0 - u_time * 6.5 + 1.2) * 0.08;
  float rippleNoise = vnoise(p * 5.0 + u_time * 0.8) * 0.06;
  float ripple = (ripple1 + ripple2 + rippleNoise) * wListen * u_energy;
  dp += normalize(p + 0.001) * ripple;

  // speaking spiral
  float spiralAngle = r * 6.0 * wSpeak * u_energy;
  float cs = cos(spiralAngle);
  float sn_s = sin(spiralAngle);
  dp = vec2(dp.x * cs - dp.y * sn_s, dp.x * sn_s + dp.y * cs);

  // ---------- watercolor pipeline ----------
  float t = u_time * 0.85;

  // map our -1..1 dp into the ShaderOrb st space (-0.5..0.5), radius 0.37
  vec2 adjusted_st = dp * 0.5;
  float radius = 0.37;
  float scaleFactor = 1.0 / (2.0 * radius);
  vec2 uv = adjusted_st * scaleFactor + 0.5;
  uv.y = 1.0 - uv.y;

  float noiseScale   = 1.25;
  float windSpeed    = 0.12;
  float warpPower    = 0.35;
  float verticalOffset = 0.09;
  float waveSpread   = 1.0;
  float layer1Amp    = 1.5;
  float layer2Amp    = 1.4;
  float layer3Amp    = 1.3;
  float fbmStrength  = 1.2;
  float fbmPowerDamping = 0.55;
  float blurRadius   = 1.5; // already *1.5 from source

  verticalOffset += 1.0 - waveSpread;

  // cnoise domain warp
  float nX = cnoise(vec3(uv + vec2(0.0, 74.8572), t * 0.3));
  float nY = cnoise(vec3(uv + vec2(203.91282, 10.0), t * 0.3));
  uv += vec2(nX * 2.0, nY) * warpPower;
  uv.y -= verticalOffset;

  // fbm-based secondary warp
  vec2 st_fbm = uv * noiseScale;
  vec2 q = vec2(
    fbm(st_fbm * 0.5 + windSpeed * t),
    fbm(st_fbm * 0.5 + windSpeed * t)
  );
  vec2 rr = vec2(
    fbm(st_fbm + q + vec2(0.3, 9.2) + 0.15  * t),
    fbm(st_fbm + q + vec2(8.3, 0.8) + 0.126 * t)
  );
  float f = fbm(st_fbm + rr - q);
  float fullFbm = (f + 0.6 * f * f + 0.7 * f + 0.5) * 0.5;
  fullFbm = pow(fullFbm, fbmPowerDamping) * fbmStrength;

  // three wave layers
  vec2 snUvA = (uv + vec2((fullFbm - 0.5) * 1.2) + vec2(0.0, 0.025));
  float snA_v = vnoise(snUvA * 2.0 + vec2(0.0, t * 0.5)) * 2.0 * layer1Amp;
  float sn2A = smoothstep(snA_v - 1.2 * blurRadius, snA_v + 1.2 * blurRadius,
                          (snUvA.y - 0.5 * waveSpread) * 5.0 + 0.5);

  vec2 snUvB = (uv + vec2((fullFbm - 0.5) * 0.85) + vec2(0.0, 0.025));
  float snB_v = vnoise(snUvB * 4.0 + vec2(293.0, t)) * 2.0 * layer2Amp;
  float sn2B = smoothstep(snB_v - 0.9 * blurRadius, snB_v + 0.9 * blurRadius,
                          (snUvB.y - 0.6 * waveSpread) * 5.0 + 0.5);

  vec2 snUvC = (uv + vec2((fullFbm - 0.5) * 1.1));
  float snC_v = vnoise(snUvC * 6.0 + vec2(153.0, t * 1.2)) * 2.0 * layer3Amp;
  float sn2C = smoothstep(snC_v - 0.7 * blurRadius, snC_v + 0.7 * blurRadius,
                          (snUvC.y - 0.9 * waveSpread) * 6.0 + 0.5);

  sn2A = pow(sn2A, 0.8);
  sn2B = pow(sn2B, 0.9);

  // ---------- existing color palette, mapped into the 4-slot scheme ----------
  vec3 darkDeep  = vec3(0.03, 0.10, 0.70);
  vec3 darkBlue  = vec3(0.20, 0.72, 0.99);
  vec3 darkCyan  = vec3(0.95, 0.94, 1.00);
  vec3 darkCore  = vec3(0.95, 0.94, 1.00);

  vec3 lightDeep = vec3(0.93, 0.82, 0.88);
  vec3 lightBlue = vec3(0.96, 0.56, 0.72);
  vec3 lightCyan = vec3(0.96, 0.56, 0.72);
  vec3 lightCore = vec3(0.95, 0.94, 1.00);

  vec3 cMain = mix(darkBlue, lightBlue, u_theme); // primary
  vec3 cLow  = mix(darkDeep, lightDeep, u_theme); // shadow
  vec3 cMid  = mix(darkCyan, lightCyan, u_theme); // secondary
  vec3 cHigh = mix(darkCore, lightCore, u_theme); // highlight

  vec3 col;
  col = linearBurn(cMain, cLow, 1.0 - sn2A);
  col = linearBurn(col, mix(cMain, cMid, 1.0 - sn2B), sn2A);
  col = mix(col, mix(cMain, cHigh, 1.0 - sn2C), sn2A * sn2B);

  col *= mask;
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
 *   state    — "idle" | "listening" | "speaking"  (default: "idle")
 *   theme    — "dark" | "light"                   (default: app theme)
 *   size     — canvas display size in px          (default: 75)
 *   centered — whether the canvas auto-centers itself (default: true)
 */
export default function VoiceOrb({
  state = "idle",
  theme,
  size = 75,
  centered = true,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const resolvedTheme = theme || (themeMode === "light" ? "light" : "dark");
  const canvasRef = useRef(null);
  const stateRef = useRef({
    energy: 0,
    mode: 0,
    targetEnergy: 0,
    targetMode: 0,
  });
  const themeRef = useRef(resolvedTheme);

  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

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
    const uTheme = gl.getUniformLocation(prog, "u_theme");

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
      gl.uniform1f(uTheme, themeRef.current === "light" ? 1.0 : 0.0);
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
        margin: centered ? "0 auto" : 0,
      }}
    />
  );
}
