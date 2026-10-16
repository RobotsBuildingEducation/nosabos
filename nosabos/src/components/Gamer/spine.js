import * as THREE from "three";

// The coat, seams and straps share the same continuous skin. Attaching an
// entire torso to one chest pivot used to make the waist swing like a board.
export function createHumanSpine(root, body, { arms, head, lowerParts, neckParts, own, outline }) {
  const parts = [...body.children];
  const bones = ["pelvis", "lumbar", "chest", "neck"].map((name) => {
    const bone = new THREE.Bone();
    bone.name = name;
    return bone;
  });
  const heights = [1.39, 1.57, 2.08, 2.32];
  bones.forEach((bone, i) => {
    bone.position.y = heights[i] - (i ? heights[i - 1] : 0);
    (i ? bones[i - 1] : body).add(bone);
  });
  const [hips, lumbar, torso, neck] = bones;
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const shoulders = new Set(arms.map((arm) => arm.shoulder));
  for (const item of parts) {
    if (lowerParts.has(item)) hips.attach(item);
    else if (item === head || neckParts.has(item)) neck.attach(item);
    else if (shoulders.has(item)) torso.attach(item);
    else {
      // Bake each authored mesh into body coordinates before weighting it.
      item.updateMatrix();
      const geometry = own(item.geometry.clone().applyMatrix4(item.matrix));
      const positions = geometry.attributes.position;
      const indices = [];
      const weights = [];
      const levels = [1.48, 1.76, 2.1, 2.32];
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        let lower = 0;
        while (lower < 2 && y > levels[lower + 1]) lower++;
        const blend = THREE.MathUtils.clamp((y - levels[lower]) / (levels[lower + 1] - levels[lower]), 0, 1);
        indices.push(lower, lower + 1, 0, 0);
        weights.push(1 - blend, blend, 0, 0);
      }
      geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
      geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
      const skin = new THREE.SkinnedMesh(geometry, item.material);
      skin.name = item.name || "spine-skinned-garment";
      skin.castShadow = true;
      skin.receiveShadow = false;
      // The bind-pose bounds must not cull a leaning shoulder or scarf.
      skin.frustumCulled = false;
      body.add(skin);
      root.updateMatrixWorld(true);
      skin.bind(skeleton, skin.matrixWorld);
      if (item.children.length) {
        const edge = own(geometry.clone());
        const p = edge.attributes.position;
        const n = edge.attributes.normal;
        for (let i = 0; i < p.count; i++) {
          p.setXYZ(i, p.getX(i) + n.getX(i) * 0.006,
            p.getY(i) + n.getY(i) * 0.006, p.getZ(i) + n.getZ(i) * 0.006);
        }
        const shell = new THREE.SkinnedMesh(edge, outline);
        shell.frustumCulled = false;
        skin.add(shell);
        shell.bind(skeleton, skin.bindMatrix);
      }
      body.remove(item);
    }
  }
  arms.forEach((arm) => { arm.rest = arm.shoulder.position.clone(); });
  return { hips, lumbar, torso, neck, skeleton };
}
