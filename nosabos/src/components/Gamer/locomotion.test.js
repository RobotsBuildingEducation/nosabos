import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { sampleHumanLocomotion, sampleHumanStride, strideDistance } from "./locomotion.js";
import { createCharacter } from "./characters.js";

test("the restrained cycle loops continuously with normalized rotations while easing to rest", () => {
  for (const run of [0, 0.25, 0.5, 0.75, 1]) {
    for (const weight of [0, 0.4, 1]) {
      for (let frame = 0; frame < 121; frame++) {
        const pose = sampleHumanLocomotion(frame / 120, run, weight, 0);
        assert.ok(pose.root.every(Number.isFinite));
        for (const rotation of Object.values(pose.rotations)) {
          assert.ok(Math.abs(Math.hypot(...rotation) - 1) < 0.00001);
        }
      }
      const first = sampleHumanLocomotion(0.000001, run, weight, 0);
      const last = sampleHumanLocomotion(0.999999, run, weight, 0);
      assert.ok(new THREE.Vector3(...first.root).distanceTo(new THREE.Vector3(...last.root)) < 0.0001);
      for (const joint of Object.keys(first.rotations)) {
        const a = new THREE.Quaternion(...first.rotations[joint]).normalize();
        const b = new THREE.Quaternion(...last.rotations[joint]).normalize();
        assert.ok(a.angleTo(b) < 0.0001, `${joint} snaps at the loop boundary`);
      }
    }
  }
});

test("the support foot matches travel distance and swing recovery clears the floor", () => {
  for (const run of [0, 0.5, 1]) {
    const first = sampleHumanStride(0.08, run);
    const next = sampleHumanStride(0.18, run);
    assert.ok(first.planted && next.planted);
    assert.ok(Math.abs(next.z + 0.1 * strideDistance(run) - first.z) < 0.00001);
    const stance = 0.62 + (0.4 - 0.62) * run;
    assert.ok(sampleHumanStride(stance + (1 - stance) * 0.35, run).lift > 0.07);
  }
});

test("rendered human rigs stay grounded and within restrained body and leg ranges", () => {
  const materials = [];
  for (const speed of [0.8, 2.3, 3.8]) {
    const actor = createCharacter((name, color) => {
      const mat = new THREE.MeshBasicMaterial({ name, color });
      materials.push(mat);
      return mat;
    });
    try {
      let contacts = 0;
      const heights = [];
      for (let frame = 0; frame < 300; frame++) {
        actor.animate(frame / 60, { dt: 1 / 60, speed, distance: speed / 60 });
        actor.root.updateMatrixWorld(true);
        let bottom = Infinity;
        for (const side of ["left", "right"]) {
          const ankle = actor.root.getObjectByName(`${side}-ankle`);
          for (const z of [-0.13, 0.32]) bottom = Math.min(bottom, ankle.localToWorld(new THREE.Vector3(0, -0.134, z)).y);
        }
        assert.ok(bottom > -0.0001, "a blended sole penetrates the ground");
        if (frame > 60 && bottom < 0.015) contacts++;
        if (frame > 60) heights.push(actor.getPoseSnapshot().lift);
        const chest = actor.root.getObjectByName("chest");
        const rotation = new THREE.Euler().setFromQuaternion(chest.getWorldQuaternion(new THREE.Quaternion()));
        assert.ok(Math.abs(rotation.y) < 0.036, "the chest must not whip from side to side");
        assert.ok(Math.abs(rotation.z) < 0.006, "the shoulders must stay level");
        assert.ok(Math.abs(rotation.x) < 0.1, "forward lean must stay modest");
        const hip = actor.root.getObjectByName("left-hip");
        const hipRotation = new THREE.Euler().setFromQuaternion(hip.getWorldQuaternion(new THREE.Quaternion()));
        assert.ok(hipRotation.x > -0.77, "the thigh must not reach a horizontal high-knee pose");
      }
      assert.ok(contacts > 130, "the stride should spend most of its time supported");
      assert.ok(Math.max(...heights) - Math.min(...heights) < 0.095, "pelvis bounce must not turn into a hopping cycle");
    } finally { actor.dispose(); }
  }
  materials.forEach((material) => material.dispose());
});
