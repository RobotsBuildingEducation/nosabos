import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createCharacter } from "./characters.js";

function character(variant = "explorer") {
  const materials = [];
  const actor = createCharacter((name, color) => {
    const material = new THREE.MeshBasicMaterial({ color, name });
    materials.push(material);
    return material;
  }, variant);
  const dispose = actor.dispose;
  actor.dispose = () => { dispose(); materials.forEach((material) => material.dispose()); };
  return actor;
}

function vertexInPelvis(actor, mesh, index) {
  actor.root.updateMatrixWorld(true);
  mesh.skeleton.update();
  const vertex = mesh.getVertexPosition(index, new THREE.Vector3());
  mesh.localToWorld(vertex);
  return actor.root.getObjectByName("pelvis").worldToLocal(vertex);
}

test("the coat flexes above an anchored waist and its bind pose preserves the authored silhouette", () => {
  const actor = character();
  try {
    const coat = actor.root.getObjectByName("coat-body");
    assert.ok(coat.isSkinnedMesh);
    const p = coat.geometry.attributes.position;
    const waist = [];
    const shoulder = [];
    for (let i = 0; i < p.count; i++) {
      const actual = vertexInPelvis(actor, coat, i);
      const expected = new THREE.Vector3(p.getX(i), p.getY(i) - 1.39, p.getZ(i));
      assert.ok(actual.distanceTo(expected) < 0.00001, "binding must not move or scale the original coat");
      if (p.getY(i) < 1.49) waist.push({ index: i, rest: actual });
      if (p.getY(i) > 2.1 && p.getY(i) < 2.2) shoulder.push({ index: i, rest: actual });
    }
    for (let frame = 0; frame < 90; frame++) {
      actor.animate(frame / 60, { dt: 1 / 60, distance: 3.8 / 60, speed: 3.8 });
    }
    waist.forEach(({ index, rest }) => {
      assert.ok(vertexInPelvis(actor, coat, index).distanceTo(rest) < 0.00001,
        "the waist must stay attached to the pelvis instead of hinging with the chest");
    });
    const travel = shoulder.map(({ index, rest }) => vertexInPelvis(actor, coat, index).distanceTo(rest));
    assert.ok(Math.max(...travel) > 0.01, "the upper back must flex independently of the pelvis");
    assert.ok(Math.max(...travel) < 0.08, "spine flex should preserve a restrained running silhouette");
    assert.equal(actor.root.getObjectByName("left-shoulder").parent.name, "chest");
    assert.equal(actor.root.getObjectByName("left-hip").parent.name, "pelvis");
  } finally { actor.dispose(); }
});

test("all cast rigs animate, pause, and settle without invalid skin weights or detached geometry", () => {
  for (const variant of ["explorer", "milo", "hana", "yoruichi", "yachiru", "jiraiya", "sheilfer", "neko"]) {
    const actor = character(variant);
    try {
      for (let frame = 0; frame < 140; frame++) {
        const speed = frame < 100 ? 5.7 : 0;
        actor.animate(frame / 60, { dt: 1 / 60, speed, distance: speed / 60, turnRate: 0.4 });
        actor.root.updateMatrixWorld(true);
        actor.root.traverse((item) => {
          assert.ok(item.matrixWorld.elements.every(Number.isFinite), `${variant} has an invalid transform`);
        });
      }
      actor.root.traverse((item) => {
        if (!item.isSkinnedMesh) return;
        const weights = item.geometry.attributes.skinWeight;
        for (let i = 0; i < weights.count; i++) {
          assert.ok(Math.abs(weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i) - 1) < 0.000001);
        }
      });
      assert.ok(actor.getPoseSnapshot().blend < 0.0001);
      const before = actor.getPoseSnapshot();
      actor.animate(10, { dt: 0, speed: 5.7, distance: 1 });
      assert.deepEqual(actor.getPoseSnapshot(), before, "opening a panel must freeze the complete pose");
    } finally { actor.dispose(); }
  }
});
