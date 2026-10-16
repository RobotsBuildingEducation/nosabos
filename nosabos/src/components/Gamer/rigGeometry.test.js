import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { batchRigidParts } from "./rigGeometry.js";

test("rig batching preserves posed bounds, outlines and independently animated cloth", () => {
  const root = new THREE.Group();
  root.scale.setScalar(0.87);
  const pivot = new THREE.Group();
  pivot.position.set(0.2, 2.6, 0);
  pivot.scale.set(1.4, 1.18, 1.48);
  pivot.rotation.set(0.1, 0.3, -0.05);
  root.add(pivot);
  const material = new THREE.MeshBasicMaterial();
  const outline = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
  const geometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
  const owned = new Set([geometry]);
  for (let i = 0; i < 6; i++) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(i * 0.15, i * 0.04, i * -0.07);
    part.rotation.y = i * 0.25;
    const shell = new THREE.Mesh(geometry, outline);
    shell.scale.set(1.016, 1.012, 1.016);
    part.add(shell);
    pivot.add(part);
  }
  const scarf = new THREE.Mesh(geometry, material);
  scarf.position.set(-0.4, -0.3, -0.1);
  pivot.add(scarf);
  const before = new THREE.Box3().setFromObject(root, true);
  batchRigidParts(root, outline, new Set([scarf]), (geo) => { owned.add(geo); return geo; });
  const after = new THREE.Box3().setFromObject(root, true);
  assert.ok(before.min.distanceTo(after.min) < 0.000001);
  assert.ok(before.max.distanceTo(after.max) < 0.000001);
  assert.equal(pivot.children.length, 3, "six rigid parts and their outlines should become two draws plus the scarf");
  assert.equal(scarf.parent, pivot, "the animated scarf must remain independent");
  assert.equal(pivot.children.filter((mesh) => mesh.material === outline).length, 1);
  owned.forEach((geo) => geo.dispose());
  material.dispose(); outline.dispose();
});
