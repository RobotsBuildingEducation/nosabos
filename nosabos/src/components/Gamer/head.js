import * as THREE from "three";

// A rounded Tales-of-Symphonia style anime head: full soft cheeks, a cute
// rounded chin, subtle 3/4 cheek fullness, and spherized front normals so
// cel-shading bands never slice harsh shadow wedges across the eyes or nose.
export function createHeadGeometry() {
  const rings = [
    [-0.255, 0.032, 0.042, 0.028],
    [-0.238, 0.115, 0.112, 0.025],
    [-0.195, 0.178, 0.158, 0.016],
    [-0.135, 0.226, 0.188, 0.008],
    [-0.055, 0.248, 0.202, 0.002],
    [0.035, 0.252, 0.205, -0.003],
    [0.125, 0.244, 0.198, -0.008],
    [0.205, 0.214, 0.176, -0.012],
    [0.265, 0.148, 0.125, -0.014],
    [0.298, 0.068, 0.058, -0.015],
    [0.312, 0.001, 0.001, -0.015],
  ];
  const positions = [], uv = [], indices = [];
  const segments = 64;
  rings.forEach(([y, width, depth, center], row) => {
    // Soft cheek puff around the lower-mid face gives the classic 3/4 anime contour.
    const cheekBand = Math.exp(-(((y + 0.085) / 0.095) ** 2));
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments - 0.5) * Math.PI * 2;
      const sinA = Math.sin(angle);
      const facing = Math.cos(angle);
      const cheekPuff = facing > 0 ? Math.sin(Math.abs(angle) * 1.85) ** 2 * cheekBand * 0.016 : 0;
      const x = sinA * (width + cheekPuff);
      // Smoothly rounded front facial plane with full rear cranium volume.
      let z = center + Math.sign(facing) * Math.abs(facing) ** (facing > 0 ? 0.74 : 0.95) * (depth + cheekPuff * 0.6);
      if (facing > 0) {
        // Subtle cute button nose tip in profile without sharp normal spikes.
        z += 0.016 * Math.exp(-((x / 0.036) ** 2) - (((y + 0.068) / 0.048) ** 2));
      }
      positions.push(x, y, z);
      // Keep the painted eyes and mouth well inside the front facial plane so they
      // never wrap around the temples when viewed from three-quarters.
      const uFront = 0.5 + x / 0.425;
      uv.push(
        facing > 0.12 ? THREE.MathUtils.clamp(uFront, 0.01, 0.99) : x < 0 ? 0.01 : 0.99,
        THREE.MathUtils.clamp((y + 0.255) / 0.525, 0.01, 0.99),
      );
      if (row && i < segments) {
        const n = row * (segments + 1) + i;
        indices.push(n, n - segments - 1, n + 1, n + 1, n - segments - 1, n - segments);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Spherize front-face normals (classic cel-shaded anime technique) so toon
  // light bands wrap smoothly around the head instead of splitting the nose/cheeks.
  const posAttr = geometry.attributes.position;
  const normAttr = geometry.attributes.normal;
  const vPos = new THREE.Vector3();
  const vNorm = new THREE.Vector3();
  const proxyNorm = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    vPos.fromBufferAttribute(posAttr, i);
    if (vPos.z > -0.02) {
      vNorm.fromBufferAttribute(normAttr, i);
      const blend = THREE.MathUtils.smoothstep(vPos.z, -0.02, 0.12);
      proxyNorm.set(vPos.x * 1.65, (vPos.y - 0.02) * 1.15 + 0.18, 0.92).normalize();
      vNorm.lerp(proxyNorm, blend * 0.86).normalize();
      normAttr.setXYZ(i, vNorm.x, vNorm.y, vNorm.z);
    }
  }
  normAttr.needsUpdate = true;
  return geometry;
}
