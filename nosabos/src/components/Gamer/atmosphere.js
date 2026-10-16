import * as THREE from "three";

export function createPaintedSky() {
  const geometry = new THREE.SphereGeometry(110, 36, 24);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `varying vec3 vDirection;
      void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying vec3 vDirection;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x),
          f.y
        );
      }
      float fbm(vec2 p) {
        return noise(p) * 0.55 + noise(p * 2.07) * 0.28 + noise(p * 4.23) * 0.17;
      }
      void main() {
        vec3 d = normalize(vDirection);
        float elevation = max(0.0, d.y);
        // Vibrant Tales-of-Symphonia sky gradient: warm sunlit horizon into crisp cerulean zenith.
        vec3 horizonColor = vec3(0.76, 0.90, 0.94);
        vec3 midSky = vec3(0.32, 0.67, 0.88);
        vec3 zenithSky = vec3(0.11, 0.42, 0.76);
        vec3 sky = mix(horizonColor, midSky, smoothstep(0.0, 0.32, elevation));
        sky = mix(sky, zenithSky, pow(smoothstep(0.18, 0.95, elevation), 0.85));

        // Billowing two-tone cel-shaded cumulus clouds.
        vec2 p = d.xz / (elevation + 0.22) * 3.1;
        float cloud = fbm(p);
        float cloudDetail = fbm(p * 2.4 + vec2(1.7, -0.8));
        float cloudShape = cloud * 0.78 + cloudDetail * 0.22;
        float horizonFade = smoothstep(0.04, 0.22, elevation);
        float cloudShadowMask = smoothstep(0.50, 0.58, cloudShape) * horizonFade;
        float cloudLitMask = smoothstep(0.56, 0.66, cloudShape + d.y * 0.04) * horizonFade;
        float cloudHighlightMask = smoothstep(0.66, 0.74, cloudShape) * horizonFade;

        vec3 cloudShade = vec3(0.74, 0.83, 0.91);
        vec3 cloudLit = vec3(0.97, 0.97, 0.93);
        vec3 cloudBright = vec3(1.0, 0.99, 0.96);
        sky = mix(sky, cloudShade, cloudShadowMask * 0.85);
        sky = mix(sky, cloudLit, cloudLitMask * 0.92);
        sky = mix(sky, cloudBright, cloudHighlightMask * 0.65);

        // Distant painted mountain range silhouettes along the valley horizon.
        float azimuth = atan(d.x, d.z);
        float farPeak = 0.045
          + 0.038 * sin(azimuth * 3.0 + 0.5)
          + 0.024 * cos(azimuth * 7.0 - 1.1)
          + 0.015 * sin(azimuth * 13.0 + 2.3);
        float nearPeak = 0.028
          + 0.025 * sin(azimuth * 4.0 - 0.8)
          + 0.018 * cos(azimuth * 9.0 + 1.4);
        float farMask = (1.0 - smoothstep(farPeak - 0.006, farPeak + 0.006, elevation)) * step(0.0, d.y + 0.02);
        float nearMask = (1.0 - smoothstep(nearPeak - 0.005, nearPeak + 0.005, elevation)) * step(0.0, d.y + 0.02);
        vec3 farMountain = mix(vec3(0.54, 0.72, 0.82), vec3(0.68, 0.83, 0.89), clamp(elevation / max(farPeak, 0.01), 0.0, 1.0));
        vec3 nearMountain = mix(vec3(0.39, 0.59, 0.66), vec3(0.52, 0.71, 0.75), clamp(elevation / max(nearPeak, 0.01), 0.0, 1.0));
        sky = mix(sky, farMountain, farMask * 0.72);
        sky = mix(sky, nearMountain, nearMask * 0.68);

        // Warm sun glow in the upper sky.
        vec3 sunDir = normalize(vec3(-16.0, 27.0, 12.0));
        float sunDot = max(0.0, dot(d, sunDir));
        sky += vec3(0.16, 0.13, 0.06) * pow(sunDot, 28.0);
        gl_FragColor = vec4(sky, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -10;
  return sky;
}
