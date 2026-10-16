import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Preserve articulated pivots while batching their rigid details by material.
export function batchRigidParts(root, outline, dynamicParts, own) {
  const parents = [];
  root.traverse((node) => { if (!node.isMesh) parents.push(node); });
  for (const parent of parents) {
    const parts = parent.children.filter((node) => node.isMesh && !node.isSkinnedMesh
      && !dynamicParts.has(node) && node.children.every((child) => child.isMesh && child.material === outline));
    if (parts.length < 2) continue;
    const batches = new Map();
    const append = (mesh, matrix) => {
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geometry.applyMatrix4(matrix);
      if (!geometry.attributes.uv) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
      if (!batches.has(mesh.material)) batches.set(mesh.material, []);
      batches.get(mesh.material).push(geometry);
    };
    for (const part of parts) {
      part.updateMatrix();
      append(part, part.matrix);
      for (const edge of part.children) {
        edge.updateMatrix();
        append(edge, new THREE.Matrix4().multiplyMatrices(part.matrix, edge.matrix));
      }
      parent.remove(part);
    }
    for (const [material, geometries] of batches) {
      const mesh = new THREE.Mesh(own(mergeGeometries(geometries, false)), material);
      mesh.castShadow = material !== outline;
      mesh.name = `rig-batch-${material.name || material.id}`;
      parent.add(mesh);
      geometries.forEach((geometry) => geometry.dispose());
    }
  }
}
