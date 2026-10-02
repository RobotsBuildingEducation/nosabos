import * as THREE from "three";
import { createTutorAtmosphereMotion } from "../utils/tutorAtmosphereMotion.js";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uLight;
uniform float uAspect;
uniform float uActivity;
uniform float uSpeechOffset;
uniform float uSpeechTravel;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
// Smooth 3D noise gives the field an evolving shape, rather than translating
// a fixed chain of alternating peaks. Time is sampled continuously, never reseeded.
float softNoise(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float bottom = mix(
    mix(hash(cell), hash(cell + vec3(1.0, 0.0, 0.0)), f.x),
    mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), f.x), f.y);
  float top = mix(
    mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), f.x),
    mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), f.x), f.y);
  return mix(bottom, top, f.z);
}
void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float speechResponse = 1.0 - exp(-uActivity * 3.0);
  // Signed movement follows voice dynamics, independently of the wave shape.
  float speechSwell = uSpeechOffset;
  float span = mix(2.4, 3.6, smoothstep(0.6, 1.5, uAspect));
  // Left-to-right advection and independent slow evolution: patches can merge,
  // stretch or recede as they travel, without a repeated high/low pattern.
  vec3 flow = vec3(uv.x * span - uTime * 0.16, uv.y * 3.0, uTime * 0.075);
  vec2 warp = vec2(
    softNoise(flow * 0.63 + vec3(4.7, 2.1, 8.3)),
    softNoise(flow * 0.57 + vec3(9.2, 6.8, 3.4))) - 0.5;
  vec3 shaped = flow + vec3(warp * vec2(1.35, 1.1), 0.0);
  float broad = softNoise(shaped + vec3(2.1, 5.7, 1.3));
  float detail = softNoise(shaped * 1.7 + vec3(7.4, 3.2, 6.9));
  float field = broad * 0.78 + detail * 0.22;
  float coolField = softNoise(vec3(uv.x * 2.0 - uTime * 0.12, uv.y * 2.5, uTime * 0.065) + vec3(warp, 0.0) + vec3(5.6, 9.4, 2.8));
  float warmField = softNoise(vec3(uv.x * 2.5 - uTime * 0.10, uv.y * 3.1, uTime * 0.09) + vec3(warp.yx, 0.0) + vec3(9.7, 4.2, 7.6));
  vec3 colorFlow = vec3(uv.x * 1.6 - uTime * 0.09, uv.y * 1.8, uTime * 0.10);
  float tone = softNoise(colorFlow + vec3(3.2, 7.1, 4.8));
  float hue = softNoise(colorFlow * 0.8 + vec3(8.6, 2.3, 6.1));

  // Three separate gradients retain their hues as they overlap: blue/mint
  // beneath a cooler accent and a violet/green accent, each with its own depth.
  vec3 deep = mix(vec3(0.075, 0.23, 0.56), vec3(0.24, 0.68, 0.50), uLight);
  vec3 bright = mix(vec3(0.17, 0.41, 0.82), vec3(0.39, 0.88, 0.68), uLight);
  vec3 coolAccent = mix(vec3(0.045, 0.51, 0.57), vec3(0.28, 0.75, 0.98), uLight);
  vec3 warmAccent = mix(vec3(0.34, 0.29, 0.72), vec3(0.48, 0.84, 0.36), uLight);
  float shade = smoothstep(0.20, 0.80, field * 0.55 + tone * 0.45);
  vec3 baseColor = mix(deep, bright, shade);
  vec3 coolColor = coolAccent * mix(mix(0.64, 0.94, uLight), 1.12, smoothstep(0.18, 0.82, coolField));
  vec3 warmColor = warmAccent * mix(mix(0.62, 0.94, uLight), 1.14, smoothstep(0.18, 0.82, warmField));

  // Shape the density in two dimensions so dark pockets and asymmetric lobes
  // can develop inside the wash, instead of every column sharing one gradient.
  float density = smoothstep(0.24, 0.72, field);
  float reach = clamp(0.18 + 0.35 * density + speechSwell, 0.09, 0.60);
  float feather = mix(0.17, 0.27, detail);
  float fade = 1.0 - smoothstep(max(0.0, reach - feather), reach, uv.y);
  // All density contours feather out before 60%, including loud speech.
  fade *= 1.0 - smoothstep(0.55, 0.60, uv.y);

  // A warped seam separates the color regions instead of mixing every hue
  // everywhere. Different moving fade contours make their layering visible.
  float seam = 0.38 + hue * 0.26;
  float across = uv.x + warp.x * 0.23 + (uv.y - 0.2) * (tone - 0.5) * 0.5;
  float coolMask = 1.0 - smoothstep(seam - 0.18, seam + 0.08, across);
  float warmMask = smoothstep(seam - 0.04, seam + 0.22, across);
  float coolReach = clamp(0.20 + smoothstep(0.20, 0.78, coolField) * 0.28 + speechSwell, 0.08, 0.60);
  float warmReach = clamp(0.21 + smoothstep(0.20, 0.78, warmField) * 0.28 + speechSwell, 0.08, 0.60);
  float coolFade = 1.0 - smoothstep(max(0.0, coolReach - 0.19), coolReach, uv.y);
  float warmFade = 1.0 - smoothstep(max(0.0, warmReach - 0.22), warmReach, uv.y);
  float baseWeight = fade * 0.40;
  float coolWeight = coolMask * coolFade * 0.80;
  float warmWeight = warmMask * warmFade * 0.80;

  // A separate, translucent wave travels right-to-left through all color
  // regions. Speech swells this layer; it does not shove or reverse the wash.
  vec3 speechFlow = vec3(uv.x * span * 0.85 + uSpeechTravel, uv.y * 2.7, uTime * 0.04);
  vec2 speechWarp = vec2(
    softNoise(speechFlow * 0.60 + vec3(3.8, 6.2, 9.1)),
    softNoise(speechFlow * 0.54 + vec3(7.3, 1.6, 5.4))) - 0.5;
  float speechField = softNoise(speechFlow + vec3(speechWarp * 1.1, 0.0) + vec3(6.1, 8.3, 2.7));
  // Ordinary playback is often only 0.2–0.4 on the shared envelope. Give those
  // levels a visible swell, following syllables rather than the slow turn fade.
  float speechReach = clamp(0.22 + smoothstep(0.20, 0.78, speechField) * 0.22
    + speechSwell, 0.08, 0.60);
  float speechFade = 1.0 - smoothstep(max(0.0, speechReach - 0.22), speechReach, uv.y);
  float speechWeight = speechFade * speechResponse * 0.90;
  vec3 speechColor = mix(coolAccent, warmAccent, smoothstep(0.22, 0.78, speechField))
    * mix(0.85, 1.12, speechField);
  float coverage = baseWeight + coolWeight + warmWeight + speechWeight;
  vec3 color = (baseColor * baseWeight + coolColor * coolWeight + warmColor * warmWeight
    + speechColor * speechWeight) / max(coverage, 0.0001);
  color *= mix(mix(0.88, 1.02, uLight), 1.10, tone);

  // Fine, stationary grain: texture without flickering pixels.
  float grain = hash(vec3(gl_FragCoord.xy, 7.0)) - 0.5;
  color += grain * mix(0.028, 0.018, uLight);
  float opacity = min(1.0, mix(0.63, 0.44, uLight) * min(coverage, 1.0) * (0.82 + tone * 0.18) * (1.0 + uActivity * 0.08));
  gl_FragColor = vec4(color, opacity);
}
`;

/** A low-resolution evolving color field driven by the tutor's smoothed playback level. */
export function createTutorAtmosphereScene(canvas, { isLightTheme = false, audioLevelRef = null, onUnavailable, onAvailable } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.debug.onShaderError = () => { throw new Error("Tutor atmosphere shader could not compile"); };
  let material;
  let geometry;
  try {
    material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uLight: { value: isLightTheme ? 1 : 0 }, uAspect: { value: 1 }, uActivity: { value: 0 }, uSpeechOffset: { value: 0 }, uSpeechTravel: { value: 0 } },
    });
    geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = null;
    let fadeTimer;
    let visible = false;
    let fading = false;
    let disposed = false;
    let contextMissing = false;
    let previousTime = null;
    let lastDraw = 0;
    let playbackLevelRef = audioLevelRef;
    const advanceMotion = createTutorAtmosphereMotion();

    const draw = () => { if (!contextMissing) renderer.render(scene, camera); };
    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      // Soft fields do not need full device resolution, especially on phones.
      const scale = Math.min(1, 900 / Math.max(width, height));
      renderer.setSize(Math.round(width * scale), Math.round(height * scale), false);
      material.uniforms.uAspect.value = width / height;
      draw();
    };
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
    };
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      // Keep a regular cadence on 60 Hz displays, retaining any timing remainder.
      const frameDuration = 1000 / 30;
      const elapsed = now - lastDraw;
      if (elapsed + 0.5 < frameDuration) return;
      if (previousTime !== null) {
        const dt = Math.min((now - previousTime) / 1000, 0.1);
        const target = visible ? THREE.MathUtils.clamp(playbackLevelRef?.current || 0, 0, 1) : 0;
        const motionState = advanceMotion(target, dt);
        material.uniforms.uActivity.value = motionState.activity;
        material.uniforms.uSpeechOffset.value = motionState.speechOffset;
        material.uniforms.uTime.value = motionState.time;
        material.uniforms.uSpeechTravel.value = motionState.speechTravel;
      }
      previousTime = now;
      lastDraw = now - (Math.max(0, elapsed - frameDuration) % frameDuration);
      draw();
    };
    const syncMotion = () => {
      stop();
      if (disposed || document.hidden || contextMissing) return;
      draw();
      if ((visible || fading) && !motion.matches) frame = requestAnimationFrame(animate);
    };
    const contextLost = () => {
      contextMissing = true;
      stop();
      onUnavailable?.();
    };
    const contextRestored = () => {
      contextMissing = false;
      resize();
      syncMotion();
      onAvailable?.();
    };
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncMotion);
    motion.addEventListener("change", syncMotion);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    resize();
    return {
      setAudioLevelRef(ref) { playbackLevelRef = ref; },
      setVisible(next) {
        if (visible === next) return;
        visible = next;
        clearTimeout(fadeTimer);
        fading = !next;
        syncMotion();
        if (!next) fadeTimer = setTimeout(() => { fading = false; syncMotion(); }, 1200);
      },
      setTheme(light) {
        material.uniforms.uLight.value = light ? 1 : 0;
        draw();
      },
      dispose() {
        disposed = true;
        stop();
        clearTimeout(fadeTimer);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", syncMotion);
        motion.removeEventListener("change", syncMotion);
        canvas.removeEventListener("webglcontextlost", contextLost);
        canvas.removeEventListener("webglcontextrestored", contextRestored);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      },
    };
  } catch (error) {
    geometry?.dispose();
    material?.dispose();
    renderer.dispose();
    throw error;
  }
}
