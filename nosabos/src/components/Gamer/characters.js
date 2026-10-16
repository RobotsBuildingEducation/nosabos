import * as THREE from "three";
import { advanceMotion, createMotionState } from "./motion.js";
import { createHumanSpine } from "./spine.js";
import { createHeadGeometry } from "./head.js";
import { batchRigidParts } from "./rigGeometry.js";

// Tales-of-Symphonia inspired 3D anime cel-shaded character models:
// compact heroic proportions, full rounded anime heads, voluminous layered
// hair locks, cuffed JRPG boots and gauntlets, and crisp ink outlines.
export function createCharacter(material, variant = "explorer", art = null) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const geometries = new Set();
  const outline = new THREE.MeshBasicMaterial({ color: "#261f29", side: THREE.BackSide });
  const sphere = own(new THREE.SphereGeometry(1, 24, 18));
  const rig = { legs: [], arms: [], head: null, hips: null, torso: null, tail: null, staff: null };
  const cloth = [];
  const motionState = createMotionState();
  let lastPose = null;
  const hairTails = [];
  const neckParts = new Set();
  let sword = null;
  const isAnimal = ["jiraiya", "sheilfer", "neko"].includes(variant);
  const female = ["yoruichi", "yachiru", "hana"].includes(variant);
  const purple = variant === "yoruichi";
  const blue = variant === "yachiru";
  const botanist = variant === "hana";
  const silver = variant === "milo";
  const skinColor = purple ? "#ba896c" : "#eec295";
  const skin = material(`skin-${variant}`, skinColor);
  const ink = material("anime-ink", "#242936");
  const ivory = material("anime-ivory", "#fff4dc");
  const leather = material("anime-leather", "#523632");
  const bootRed = material(`boot-main-${variant}`, variant === "explorer" ? "#a83232" : purple ? "#3d304e" : "#523632");
  const gold = material("anime-gold", "#dfb45a");
  const hairColor = purple ? "#583568" : blue ? "#2f74c6" : botanist ? "#deb870" : silver ? "#cfd8dc" : "#5e3b2e";
  const hair = material(`sculpted-hair-${variant}`, hairColor);
  const hairLight = material(`hair-highlight-${variant}`, purple ? "#8a5a96" : blue ? "#68b0eb" : botanist ? "#f6dfa4" : silver ? "#f2efe4" : "#926046");
  const coat = material(`tailored-coat-${variant}`, purple ? "#3d304e" : blue ? "#e06c9b" : botanist ? "#527a66" : silver ? "#4e707c" : "#c43836");
  const coatLight = material(`tailored-coat-light-${variant}`, purple ? "#6c527e" : blue ? "#f4a4ba" : botanist ? "#85a686" : silver ? "#84a4aa" : "#e66550");
  const trousers = material(`trousers-${variant}`, purple ? "#322b44" : silver ? "#3a4854" : "#3b4354");

  function own(geometry) { geometries.add(geometry); return geometry; }

  // Inflate outline shells along vertex normals so off-origin profile rings and
  // hair locks receive a crisp, uniform cel-shaded ink silhouette.
  function makeOutlineGeometry(geometry, thickness = 0.0085) {
    if (geometry === sphere) return sphere;
    const clone = own(geometry.clone());
    if (!clone.attributes.normal) clone.computeVertexNormals();
    const pos = clone.attributes.position;
    const norm = clone.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + norm.getX(i) * thickness,
        pos.getY(i) + norm.getY(i) * thickness,
        pos.getZ(i) + norm.getZ(i) * thickness,
      );
    }
    return clone;
  }

  function part(parent, geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], edge = true, edgeThickness = 0.0085) {
    const item = new THREE.Mesh(geometry, mat);
    item.position.set(...position);
    item.scale.set(...scale);
    item.castShadow = true;
    // Cel bands shade the face and clothes cleanly without shadow-map striping.
    item.receiveShadow = false;
    parent.add(item);
    if (edge) {
      const shellGeo = geometry === sphere ? sphere : makeOutlineGeometry(geometry, edgeThickness);
      const shell = new THREE.Mesh(shellGeo, outline);
      if (geometry === sphere) shell.scale.set(1.032, 1.028, 1.032);
      item.add(shell);
    }
    return item;
  }
  function ellipsoid(parent, mat, position, scale, edge = true) { return part(parent, sphere, mat, position, scale, edge); }
  function profile(parent, rings, mat, segments = 22, edge = true, edgeThickness = 0.0085) {
    if (rings[rings.length - 1][0] < rings[0][0]) rings = [...rings].reverse();
    const positions = [];
    const uvs = [];
    const indices = [];
    rings.forEach(([y, rx, rz, cx = 0, cz = 0], row) => {
      for (let i = 0; i <= segments; i++) {
        const angle = i / segments * Math.PI * 2;
        positions.push(cx + Math.sin(angle) * rx, y, cz + Math.cos(angle) * rz);
        uvs.push(i / segments, row / (rings.length - 1));
        if (row && i < segments) {
          const n = row * (segments + 1) + i;
          indices.push(n, n - segments - 1, n + 1, n + 1, n - segments - 1, n - segments);
        }
      }
    });
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return part(parent, geometry, mat, [0, 0, 0], [1, 1, 1], edge, edgeThickness);
  }
  function curveLine(parent, points, radius, mat, edge = false) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return part(parent, own(new THREE.TubeGeometry(curve, 20, radius, 7, false)), mat, [0, 0, 0], [1, 1, 1], edge, 0.005);
  }
  function coatPanel(parent, side) {
    const positions = [];
    const indices = [];
    const columns = 6;
    const rows = 8;
    const layerSize = (columns + 1) * (rows + 1);
    for (let layer = 0; layer < 2; layer++) {
      for (let row = 0; row <= rows; row++) {
        const hem = row / rows;
        for (let col = 0; col <= columns; col++) {
          const u = col / columns;
          positions.push(side * (0.016 + u * 0.255) * (1 + hem * 0.22), -hem * 0.45,
            -0.145 - hem * 0.06 - Math.sin(u * Math.PI) * 0.03 + layer * 0.014);
          if (row && col < columns) {
            const n = layer * layerSize + row * (columns + 1) + col;
            const quad = [n, n + 1, n - columns - 1, n + 1, n - columns, n - columns - 1];
            if ((side < 0) !== (layer === 0)) quad.reverse();
            indices.push(...quad);
          }
        }
      }
    }
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return part(parent, geometry, coat);
  }

  // Sculpted anime hair lock with an arched, voluminous cross-section and
  // flush cel-highlight crest (no detached floating spaghetti tubes).
  function hairRibbon(parent, points, width, mat = hair, highlight = false, thicknessRatio = 0.54) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const positions = [];
    const uvs = [];
    const indices = [];
    const radialSegments = 8;
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const center = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const ref = Math.abs(tangent.z) > 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
      const across = new THREE.Vector3().crossVectors(tangent, ref).normalize();
      const normalDir = new THREE.Vector3().crossVectors(across, tangent).normalize();
      const taper = Math.sin(Math.PI * (0.1 + t * 0.9)) ** 0.78 * (1 - t * 0.62);
      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        const ridge = Math.sin(angle) > 0 ? 1 + 0.22 * Math.sin(angle) ** 2 : 0.72;
        const vertex = center.clone()
          .addScaledVector(across, Math.cos(angle) * width * taper)
          .addScaledVector(normalDir, Math.sin(angle) * width * taper * thicknessRatio * ridge);
        positions.push(vertex.x, vertex.y, vertex.z);
        uvs.push(j / radialSegments, t);
        if (i && j < radialSegments) {
          const stride = radialSegments + 1;
          const n = i * stride + j;
          indices.push(n, n + 1, n - stride, n + 1, n - stride + 1, n - stride);
        }
      }
    }
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const ribbon = part(parent, geometry, mat, [0, 0, 0], [1, 1, 1], true, 0.0065);
    if (highlight) {
      // Flush cel-shaded highlight sheen along the upper-middle of the lock
      const sheenPoints = [0.22, 0.38, 0.55, 0.7].map((t) => {
        const p = curve.getPoint(t);
        const tangent = curve.getTangent(t);
        const ref = Math.abs(tangent.z) > 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
        const across = new THREE.Vector3().crossVectors(tangent, ref).normalize();
        const normalDir = new THREE.Vector3().crossVectors(across, tangent).normalize();
        const taper = Math.sin(Math.PI * (0.1 + t * 0.9)) ** 0.78 * (1 - t * 0.62);
        p.addScaledVector(normalDir, width * taper * thicknessRatio * 0.92);
        return p.toArray();
      });
      curveLine(parent, sheenPoints, width * 0.16, hairLight, false);
    }
    return ribbon;
  }

  function makeHuman() {
    // Sturdy, heroic Tales-of-Symphonia JRPG torso and jacket silhouette.
    profile(body, [
      [1.31, 0.275, 0.175],
      [1.47, 0.245, 0.162],
      [1.68, 0.232, 0.155],
      [1.89, female ? 0.275 : 0.305, 0.188],
      [2.11, female ? 0.325 : 0.365, 0.172],
      [2.19, 0.285, 0.145],
      [2.26, 0.125, 0.108],
    ], coat).name = "coat-body";

    // Compact, sturdy anime neck
    profile(body, [[2.18, 0.108, 0.098], [2.36, 0.102, 0.094]], skin);

    // Popped anime jacket collar + white inner tunic trim (like Lloyd Irving's red tunic)
    profile(body, [[2.17, 0.168, 0.145], [2.29, 0.188, 0.158]], variant === "explorer" ? coat : coatLight);
    profile(body, [[2.20, 0.148, 0.132], [2.31, 0.162, 0.142]], ivory, 20, false);

    // Tailored front seams, lapels, and gold buttons
    for (const side of [-1, 1]) {
      curveLine(body, [[side * 0.125, 1.38, 0.172], [side * 0.12, 1.7, 0.163], [side * 0.19, 2.08, 0.168], [side * 0.11, 2.21, 0.12]], 0.011, variant === "explorer" ? ivory : gold);
    }
    // Chunky JRPG double belt & buckle
    profile(body, [[1.39, 0.268, 0.18], [1.485, 0.258, 0.174]], leather);
    part(body, own(new THREE.BoxGeometry(0.115, 0.095, 0.032)), gold, [0, 1.44, 0.186]);
    for (let y = 1.58; y < 2.12; y += 0.135) {
      ellipsoid(body, gold, [0, y, 0.184], [0.022, 0.022, 0.012], false);
      if (variant === "explorer") {
        for (const side of [-1, 1]) ellipsoid(body, gold, [side * 0.11, y, 0.176], [0.018, 0.018, 0.01], false);
      }
    }

    if (purple) {
      profile(body, [[1.48, 0.242, 0.165], [1.71, 0.23, 0.154]], skin);
      profile(body, [[1.71, 0.248, 0.17], [1.84, 0.28, 0.185], [1.99, 0.27, 0.172]], material("yoruichi-orange", "#d69b51"));
      curveLine(body, [[-0.29, 2.14, 0.12], [0, 1.82, 0.195], [0.29, 2.14, 0.12]], 0.024, coat);
    } else if (!female) {
      // Tailored split coat tails, shoulder straps, and sheathed sword
      for (const side of [-1, 1]) {
        const tail = new THREE.Group();
        tail.position.set(0, 1.43, 0);
        body.add(tail);
        const panel = coatPanel(tail, side);
        cloth.push({ group: tail, mesh: panel, rest: panel.geometry.attributes.position.array.slice(), side, kind: "coat" });
        curveLine(body, [[side * 0.27, 2.13, 0.105], [-side * 0.135, 1.48, 0.185]], 0.028, leather);
      }
      sword = new THREE.Group();
      sword.position.set(-0.31, 1.49, -0.13);
      body.add(sword);
      curveLine(sword, [[0, 0.03, 0], [-0.15, -0.99, -0.02]], 0.046, variant === "explorer" ? bootRed : leather, true);
      curveLine(sword, [[0.02, 0.13, 0], [0.04, 0.35, 0]], 0.039, leather, true);
      curveLine(sword, [[-0.11, 0.14, 0], [0.15, 0.14, 0]], 0.028, gold, true);
    }
    if (blue || botanist) {
      const skirtMat = blue ? material("yachiru-skirt", "#4658a4") : coat;
      const skirt = profile(body, [[0.9, 0.42, 0.295], [1.05, 0.38, 0.265], [1.3, 0.295, 0.215], [1.43, 0.26, 0.19]], skirtMat, 24);
      skirt.geometry.computeVertexNormals();
      cloth.push({ group: skirt, kind: "skirt", rest: skirt.geometry.attributes.position.array.slice() });
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        curveLine(body, [[Math.sin(a) * 0.265, 1.4, Math.cos(a) * 0.192], [Math.sin(a) * 0.37, 1.05, Math.cos(a) * 0.27], [Math.sin(a) * 0.415, 0.91, Math.cos(a) * 0.295]], 0.006, blue ? coatLight : ivory);
      }
    }

    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.name = side < 0 ? "left-hip" : "right-hip";
      leg.position.set(side * 0.145, 1.39, 0);
      body.add(leg);
      const legMat = blue || botanist ? skin : trousers;
      // Fuller JRPG trousers/thighs
      profile(leg, [[0, 0.155, 0.155], [-0.18, 0.175, 0.165], [-0.46, 0.135, 0.138], [-0.65, 0.108, 0.112]], legMat);
      const knee = new THREE.Group();
      knee.name = side < 0 ? "left-knee" : "right-knee";
      knee.position.y = -0.64;
      leg.add(knee);
      ellipsoid(knee, legMat, [0, 0, 0], [0.105, 0.095, 0.108]);
      profile(knee, [[0.025, 0.104, 0.108], [-0.15, 0.102, 0.104], [-0.44, 0.092, 0.096], [-0.6, 0.088, 0.094]], legMat);
      // Iconic chunky Tales-of-Symphonia cuffed boots with double straps
      profile(knee, [[-0.61, 0.112, 0.126], [-0.42, 0.128, 0.135], [-0.22, 0.142, 0.148]], bootRed);
      // Folded boot cuff & trim
      profile(knee, [[-0.27, 0.148, 0.154], [-0.19, 0.152, 0.158]], variant === "explorer" ? coatLight : purple ? gold : ivory);
      profile(knee, [[-0.39, 0.134, 0.142], [-0.34, 0.136, 0.144]], leather);
      profile(knee, [[-0.51, 0.122, 0.134], [-0.46, 0.124, 0.136]], gold);

      const ankle = new THREE.Group();
      ankle.name = side < 0 ? "left-ankle" : "right-ankle";
      ankle.position.y = -0.61;
      knee.add(ankle);
      // Sculpted rounded JRPG boot vamp and thick sole (keeps bottom at y = -0.134)
      ellipsoid(ankle, bootRed, [0, -0.052, 0.095], [0.138, 0.082, 0.24]);
      ellipsoid(ankle, bootRed, [0, -0.035, 0.155], [0.132, 0.072, 0.145]);
      ellipsoid(ankle, ink, [0, -0.118, 0.095], [0.142, 0.016, 0.238], false);
      curveLine(ankle, [[-0.095, -0.02, 0.165], [0, -0.005, 0.22], [0.095, -0.02, 0.165]], 0.009, gold);
      const fold = material(`fabric-fold-${variant}`, purple ? "#51405c" : "#56616a");
      curveLine(leg, [[-0.07, -0.5, 0.09], [0.02, -0.55, 0.11], [0.065, -0.57, 0.08]], 0.009, fold);
      rig.legs.push({ hip: leg, knee, ankle, side });

      const arm = new THREE.Group();
      arm.name = side < 0 ? "left-shoulder" : "right-shoulder";
      arm.position.set(side * 0.325, 2.14, 0);
      arm.rotation.z = side * 0.08;
      body.add(arm);
      profile(arm, [[0.08, 0.04, 0.045], [0.02, 0.108, 0.115], [-0.11, 0.125, 0.118], [-0.3, 0.102, 0.1], [-0.46, 0.088, 0.09]], purple ? skin : coat);
      const elbow = new THREE.Group();
      elbow.name = side < 0 ? "left-elbow" : "right-elbow";
      elbow.position.y = -0.43;
      arm.add(elbow);
      ellipsoid(elbow, purple ? skin : coat, [0, 0, 0], [0.086, 0.08, 0.088]);
      profile(elbow, [[0.02, 0.086, 0.088], [-0.14, 0.094, 0.09], [-0.4, 0.074, 0.078]], purple || !female ? coat : skin);
      // Flared JRPG gauntlet / sleeve cuff
      profile(elbow, [[-0.22, 0.108, 0.11], [-0.39, 0.096, 0.1]], variant === "explorer" ? bootRed : purple ? leather : ivory);
      profile(elbow, [[-0.21, 0.114, 0.116], [-0.26, 0.112, 0.114]], variant === "explorer" ? ivory : gold);

      const wrist = new THREE.Group();
      wrist.position.y = -0.41;
      elbow.add(wrist);
      const handMat = variant === "explorer" ? bootRed : skin;
      ellipsoid(wrist, handMat, [0, -0.045, 0.025], [0.068, 0.095, 0.072]);
      ellipsoid(wrist, handMat, [-side * 0.052, -0.025, 0.062], [0.034, 0.052, 0.036]);
      if (!female) {
        ellipsoid(elbow, gold, [0, -0.3, 0.102], [0.022, 0.022, 0.01], false);
      }
      rig.arms.push({ shoulder: arm, elbow, wrist, side });
      wrist.scale.set(1.22, 1.12, 1.2);
    }

    // Full, round Tales-of-Symphonia anime head seated snugly on the collar
    const head = new THREE.Group();
    head.name = "anime-head";
    head.position.set(0, 2.58, 0.015);
    head.scale.set(1.58, 1.32, 1.56);
    body.add(head);
    rig.head = head;

    let faceMat = skin;
    if (art) {
      faceMat = material(`painted-face-${variant}`, "#ffffff");
      faceMat.map = art.faces[purple ? 1 : blue ? 2 : botanist ? 3 : silver ? 4 : 0];
    }
    part(head, own(createHeadGeometry()), faceMat, [0, 0, 0], [1, 1, 1], true, 0.0065).name = "sculpted-face";

    for (const side of [-1, 1]) {
      ellipsoid(head, skin, [side * 0.244, -0.048, -0.005], [0.044, 0.072, 0.048]);
      curveLine(head, [[side * 0.26, -0.022, 0.022], [side * 0.268, -0.048, 0.03], [side * 0.252, -0.078, 0.028]], 0.005, material(`ear-shadow-${variant}`, purple ? "#8c5c50" : "#c18a70"));
    }

    // Voluminous anime hair cranium base & nape cap
    const cap = profile(head, [
      [0.035, 0.258, 0.218, 0, -0.024],
      [0.155, 0.274, 0.232, 0, -0.022],
      [0.265, 0.232, 0.198, 0, -0.02],
      [0.34, 0.115, 0.105, 0, -0.014],
      [0.365, 0.02, 0.02, 0, -0.01],
    ], hair, 28);
    cap.scale.z = 1.03;
    const napeGeo = own(new THREE.SphereGeometry(1, 24, 14, Math.PI * 0.92, Math.PI * 1.16, 0.52, 1.95));
    part(head, napeGeo, hair, [0, 0.01, -0.016], [0.264, 0.305, 0.228]);

    // 1. Thick, sculpted anime bangs framing the brow and temples
    const bangCount = 11;
    for (let i = 0; i < bangCount; i++) {
      const u = (i / (bangCount - 1)) * 2 - 1; // -1 to +1
      const x = u * 0.225;
      const sweep = purple || silver ? -0.045 : variant === "explorer" ? (u > -0.15 ? 0.032 : -0.028) : 0.015 * Math.sin(i);
      const endX = x + sweep;
      const isOuter = Math.abs(u) > 0.68;
      const isCenter = Math.abs(u) < 0.28;
      const tipY = isOuter ? -0.055 - Math.abs(u) * 0.04 : isCenter ? 0.045 + (i % 2) * 0.022 : 0.075 + (i % 3) * 0.018;
      const lockWidth = isOuter ? 0.078 : isCenter ? 0.074 : 0.068;
      hairRibbon(
        head,
        [
          [x * 0.42, 0.345, -0.01],
          [x * 0.85, 0.275, 0.155],
          [endX * 0.96, 0.155 + Math.abs(u) * 0.035, 0.222],
          [endX, tipY, isOuter ? 0.185 : 0.215],
        ],
        lockWidth,
        hair,
        i % 3 === 1,
      );
    }

    // 2. Full cheek-framing side locks (in front of and behind ears)
    for (const side of [-1, 1]) {
      hairRibbon(
        head,
        [
          [side * 0.17, 0.25, 0.05],
          [side * 0.252, 0.09, 0.095],
          [side * 0.242, -0.08, 0.088],
          [side * 0.205, -0.23, 0.065],
        ],
        0.076,
        hair,
        true,
      );
      hairRibbon(
        head,
        [
          [side * 0.2, 0.22, -0.03],
          [side * 0.268, 0.04, -0.015],
          [side * 0.248, -0.16, -0.025],
          [side * 0.21, -0.27, -0.05],
        ],
        0.074,
        hair,
        false,
      );
    }

    // 3. Variant-specific crown spikes, ponytails, twin buns, and scarves
    if (purple || botanist) {
      // Crown volume locks
      for (const side of [-1, 1]) {
        hairRibbon(head, [[0, 0.34, -0.02], [side * 0.14, 0.31, -0.11], [side * 0.22, 0.16, -0.21], [side * 0.18, -0.04, -0.23]], 0.078, hair, true);
      }
      const tail = new THREE.Group();
      tail.position.set(purple ? 0.05 : 0, 0.14, -0.19);
      head.add(tail);
      for (let i = 0; i < 7; i++) {
        const x = (i - 3) * 0.054;
        hairRibbon(tail, [[x * 0.3, 0.08, 0], [x * 1.1, -0.16, -0.15], [x * 1.35, -0.62, -0.2], [x * 0.85 - 0.05, -1.02 + (i % 3) * 0.07, -0.24]], 0.082, hair, i % 2 === 0);
      }
      ellipsoid(tail, gold, [0, 0.02, -0.03], [0.125, 0.06, 0.085]);
      if (botanist) {
        // Hana's botanical flower & leaf hair ornament
        ellipsoid(head, material("hana-flower", "#fff2c2"), [-0.21, 0.16, 0.11], [0.055, 0.055, 0.03]);
        ellipsoid(head, gold, [-0.21, 0.16, 0.13], [0.024, 0.024, 0.018]);
      }
      hairTails.push(tail);
    } else if (blue) {
      // Yachiru's big round anime twin buns, ribbons, and twin tails
      for (const side of [-1, 1]) {
        ellipsoid(head, hair, [side * 0.245, 0.265, -0.04], [0.135, 0.138, 0.128]);
        curveLine(head, [[side * 0.16, 0.3, 0.02], [side * 0.24, 0.37, -0.03], [side * 0.32, 0.28, -0.07]], 0.01, hairLight);
        const twin = new THREE.Group();
        twin.position.set(side * 0.22, 0.18, -0.13);
        head.add(twin);
        hairRibbon(twin, [[0, 0, 0], [side * 0.07, -0.22, -0.05], [side * 0.05, -0.5, -0.02]], 0.082, hair, true);
        hairTails.push(twin);
      }
      const bow = material("pink-hair-ribbon", "#f08eb8");
      for (const side of [-1, 1]) ellipsoid(head, bow, [side * 0.265, 0.15, 0.035], [0.098, 0.045, 0.04]);
    } else {
      // Lloyd-inspired layered spiky anime hero hair (Explorer & Milo)
      for (let i = 0; i < 9; i++) {
        const a = (i / 8) * Math.PI;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        hairRibbon(
          head,
          [
            [cosA * 0.05, 0.31, -0.03],
            [cosA * 0.18, 0.32 + sinA * 0.04, -0.12 - sinA * 0.04],
            [cosA * 0.27, 0.19 + (i % 2) * 0.04, -0.22 - sinA * 0.04],
            [cosA * 0.29, 0.01 + (i % 3) * 0.03, -0.26],
          ],
          0.078,
          hair,
          i % 2 === 0,
        );
      }
      // Heroic upward/swept crown spikes (Lloyd Irving signature silhouette)
      const spikes = [
        [[0.02, 0.3, 0.02], [-0.08, 0.39, -0.01], [-0.21, 0.43, -0.04], [-0.31, 0.4, -0.06]],
        [[-0.03, 0.31, 0.01], [0.09, 0.38, -0.02], [0.22, 0.41, -0.05], [0.3, 0.37, -0.07]],
        [[0, 0.31, -0.03], [-0.04, 0.4, -0.09], [-0.12, 0.44, -0.16], [-0.18, 0.39, -0.22]],
        [[0.03, 0.28, -0.08], [0.14, 0.33, -0.16], [0.25, 0.31, -0.24], [0.31, 0.24, -0.28]],
        [[-0.03, 0.28, -0.08], [-0.15, 0.33, -0.16], [-0.26, 0.3, -0.24], [-0.32, 0.22, -0.28]],
      ];
      spikes.forEach((pts, idx) => hairRibbon(head, pts, 0.074, hair, idx < 3));

      // Wrapped neck muffler + twin flowing scarf tails (like Lloyd's white/red scarf)
      const scarfMat = variant === "explorer" ? ivory : coatLight;
      profile(body, [[2.22, 0.168, 0.15], [2.33, 0.158, 0.142]], scarfMat);
      for (const [idx, side] of [-1, 1].entries()) {
        const scarf = new THREE.Group();
        scarf.position.set(side * 0.065, 2.26, -0.135);
        body.add(scarf);
        neckParts.add(scarf);
        const len = idx === 0 ? 0.72 : 0.58;
        const ribbon = hairRibbon(
          scarf,
          [
            [0, 0, 0],
            [side * 0.05, -len * 0.28, -0.08],
            [side * 0.08, -len * 0.68, -0.16],
            [side * 0.12, -len, -0.22],
          ],
          0.095,
          scarfMat,
          false,
          0.32,
        );
        cloth.push({ group: scarf, mesh: ribbon, kind: "scarf", side, rest: ribbon.geometry.attributes.position.array.slice() });
      }
    }
    if (purple) {
      curveLine(head, [[-0.23, 0.13, 0.08], [0, 0.19, 0.205], [0.23, 0.13, 0.08]], 0.015, gold);
      ellipsoid(head, gold, [0, 0.18, 0.215], [0.028, 0.046, 0.015]);
    }
    root.scale.setScalar(blue ? 0.76 : 0.87);
  }

  function makeAnimal() {
    const frog = variant === "jiraiya";
    const cat = variant === "neko";
    const fur = material(`fur-${variant}`, frog ? "#6c8c4e" : cat ? "#d49658" : "#b8b6ca");
    const pale = material(`pale-${variant}`, frog ? "#c9c798" : cat ? "#fff2d4" : "#f4e9de");
    const dark = material(`markings-${variant}`, frog ? "#445c3a" : cat ? "#7e503c" : "#6d6882");
    const animalCloth = material(`animal-cloth-${variant}`, frog ? "#724e5a" : cat ? "#5c8c8a" : "#686a8c");
    ellipsoid(body, fur, [0, 0.77, 0], [frog ? 0.56 : 0.41, 0.61, 0.32]);
    ellipsoid(body, pale, [0, 0.77, 0.17], [0.34, 0.41, 0.21]);
    const head = new THREE.Group();
    head.position.y = frog ? 1.38 : 1.5;
    body.add(head);
    rig.head = head;
    ellipsoid(head, fur, [0, 0, 0], [frog ? 0.58 : 0.42, frog ? 0.3 : 0.37, 0.32]);
    if (frog) {
      for (const side of [-1, 1]) {
        ellipsoid(head, fur, [side * 0.34, 0.21, -0.01], [0.185, 0.205, 0.165]);
        ellipsoid(head, material("toad-eye-gold", "#dabf6e"), [side * 0.34, 0.22, 0.14], [0.096, 0.115, 0.028]);
        ellipsoid(head, ink, [side * 0.34, 0.22, 0.166], [0.024, 0.074, 0.012], false);
        ellipsoid(head, ivory, [side * 0.33, 0.25, 0.172], [0.016, 0.02, 0.008], false);
        curveLine(head, [[side * 0.48, 0.29, 0.08], [side * 0.33, 0.35, 0.1], [side * 0.2, 0.29, 0.12]], 0.026, dark);
        ellipsoid(head, pale, [side * 0.36, -0.1, 0.19], [0.14, 0.075, 0.055], false);
        for (let i = 0; i < 7; i++) ellipsoid(head, dark, [side * (0.18 + i % 3 * 0.09), 0.03 - i / 7 * 0.16, 0.26 - i % 3 * 0.025], [0.022, 0.017, 0.012], false);
      }
      curveLine(head, [[-0.39, -0.06, 0.24], [-0.22, -0.12, 0.3], [0.22, -0.12, 0.3], [0.39, -0.06, 0.24]], 0.01, dark);
      profile(body, [[0.35, 0.55, 0.33], [0.6, 0.59, 0.345], [0.9, 0.54, 0.335], [1.15, 0.43, 0.265]], animalCloth);
      for (const side of [-1, 1]) curveLine(body, [[side * 0.32, 1.23, 0.04], [side * 0.48, 0.95, 0.24], [side * 0.45, 0.52, 0.28]], 0.055, ivory);
      const staff = curveLine(body, [[0.65, 0.06, 0.15], [0.66, 1.37, 0.13], [0.59, 1.52, 0.14]], 0.038, leather, true);
      rig.staff = new THREE.Group();
      rig.staff.position.set(0.65, 1.15, 0.13);
      body.add(rig.staff);
      root.updateMatrixWorld(true);
      rig.staff.attach(staff);
    } else {
      for (const side of [-1, 1]) {
        if (cat) {
          const ear = part(head, own(new THREE.ConeGeometry(0.18, 0.37, 4)), fur, [side * 0.27, 0.34, -0.025]);
          ear.rotation.z = side * -0.18;
          part(head, own(new THREE.ConeGeometry(0.1, 0.23, 3)), material("cat-ear-pink", "#daa28e"), [side * 0.27, 0.35, 0.075], [1, 1, 0.25], false);
        } else {
          ellipsoid(head, fur, [side * 0.3, 0.31, -0.01], [0.145, 0.15, 0.085]);
          ellipsoid(head, material("hamster-ear", "#d29eae"), [side * 0.3, 0.32, 0.06], [0.088, 0.092, 0.02], false);
        }
        ellipsoid(head, pale, [side * 0.22, -0.12, 0.185], [0.21, 0.165, 0.145]);
        ellipsoid(head, ivory, [side * 0.15, 0.03, 0.27], [0.092, 0.12, 0.034], false);
        ellipsoid(head, cat ? material("cat-iris", "#5a8e76") : ink, [side * 0.15, 0.025, 0.3], [0.052, 0.088, 0.014], false);
        ellipsoid(head, ink, [side * 0.15, 0.025, 0.312], [0.024, 0.07, 0.01], false);
        ellipsoid(head, ivory, [side * 0.15 - 0.018, 0.068, 0.318], [0.018, 0.024, 0.008], false);
        curveLine(head, [[side * 0.22, 0.14, 0.25], [side * 0.14, 0.155, 0.28], [side * 0.08, 0.12, 0.265]], 0.013, dark);
        if (cat) {
          for (let i = 0; i < 3; i++) curveLine(head, [[side * 0.27, -0.085 - i * 0.04, 0.27], [side * 0.46, -0.05 - i * 0.06, 0.24]], 0.006, ivory);
          curveLine(head, [[side * 0.04, 0.32, 0.15], [side * 0.08, 0.2, 0.26]], 0.016, dark);
        }
      }
      ellipsoid(head, material("animal-nose", "#c48e8a"), [0, -0.08, 0.35], [0.048, 0.032, 0.022]);
      curveLine(head, [[-0.07, -0.16, 0.31], [0, -0.18, 0.33], [0.07, -0.16, 0.31]], 0.01, dark);
      for (const side of [-1, 1]) curveLine(body, [[side * 0.24, 1.13, 0.11], [side * 0.31, 0.91, 0.27], [side * 0.28, 0.5, 0.23]], 0.058, animalCloth);
      profile(body, [[1.17, 0.24, 0.2], [1.26, 0.26, 0.21]], cat ? material("neko-scarf", "#cc6b66") : material("sheilfer-scarf", "#729ab0"));
      for (let y = 0.6; y < 1.1; y += 0.18) ellipsoid(body, gold, [0, y, 0.365], [0.026, 0.026, 0.015], false);
      if (cat) {
        const tail = curveLine(body, [[0, 0.5, -0.22], [0.36, 0.45, -0.4], [0.64, 0.78, -0.36], [0.5, 1.06, -0.28]], 0.072, fur, true);
        rig.tail = new THREE.Group();
        rig.tail.position.set(0, 0.5, -0.22);
        body.add(rig.tail);
        root.updateMatrixWorld(true);
        rig.tail.attach(tail);
      }
    }
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * (frog ? 0.43 : 0.22), 0.53, 0);
      body.add(hip);
      ellipsoid(hip, fur, [0, -0.1, -0.005], [frog ? 0.18 : 0.115, 0.19, 0.14]);
      const knee = new THREE.Group();
      knee.position.y = -0.23;
      hip.add(knee);
      ellipsoid(knee, fur, [0, -0.08, 0], [0.1, 0.14, 0.11]);
      const ankle = new THREE.Group();
      ankle.position.y = -0.21;
      knee.add(ankle);
      ellipsoid(ankle, pale, [0, 0, 0.12], [frog ? 0.23 : 0.14, 0.09, 0.22]);
      rig.legs.push({ hip, knee, ankle, side });
      const arm = new THREE.Group();
      arm.position.set(side * (frog ? 0.5 : 0.36), 1.03, 0);
      body.add(arm);
      ellipsoid(arm, fur, [side * 0.025, -0.1, 0], [0.1, 0.15, 0.1]);
      const elbow = new THREE.Group();
      elbow.position.set(side * 0.025, -0.21, 0);
      arm.add(elbow);
      ellipsoid(elbow, fur, [0, -0.06, 0.01], [0.075, 0.11, 0.08]);
      const wrist = new THREE.Group();
      wrist.position.y = -0.17;
      elbow.add(wrist);
      ellipsoid(wrist, pale, [side * 0.015, 0, 0.06], [0.09, 0.095, 0.1]);
      rig.arms.push({ shoulder: arm, elbow, wrist, side });
    }
    if (frog) root.scale.setScalar(1.15);
  }

  if (isAnimal) makeAnimal(); else makeHuman();

  const hipHeight = isAnimal ? 0.53 : 1.39;
  const lowerParts = new Set([...rig.legs.map((leg) => leg.hip),
    ...cloth.filter((item) => item.kind !== "scarf").map((item) => item.group), rig.tail, rig.staff, sword]);
  if (!isAnimal) {
    Object.assign(rig, createHumanSpine(root, body, { arms: rig.arms, head: rig.head, lowerParts, neckParts, own, outline }));
  } else {
    const originalParts = [...body.children];
    rig.hips = new THREE.Group();
    rig.hips.position.y = hipHeight;
    rig.hips.name = "pelvis";
    body.add(rig.hips);
    root.updateMatrixWorld(true);
    originalParts.forEach((item) => rig.hips.attach(item));
    rig.torso = new THREE.Group();
    rig.torso.position.y = 0.95 - hipHeight;
    rig.torso.name = "chest";
    rig.hips.add(rig.torso);
    root.updateMatrixWorld(true);
    [...rig.hips.children].forEach((item) => { if (item !== rig.torso && !lowerParts.has(item)) rig.torso.attach(item); });
  }

  batchRigidParts(root, outline, new Set(cloth.flatMap((item) => [item.group, item.mesh]).filter(Boolean)), own);

  return {
    root,
    animate(time, motion) {
      const pose = advanceMotion(motionState, { ...motion, time, scale: root.scale.x, animal: isAnimal });
      if (!pose) return;
      lastPose = pose;
      if (isAnimal) {
        body.position.set(pose.sway, pose.bodyY, 0);
        rig.hips.rotation.set(0, pose.hipsYaw, pose.hipsRoll);
        rig.torso.rotation.set(pose.lean, pose.torsoYaw, 0);
        rig.torso.position.y = 0.95 - hipHeight + pose.idle * 0.004;
        rig.head.rotation.set(-pose.lean * 0.4 + pose.idle * 0.012, pose.look + pose.idle * 0.025, pose.idle * 0.008);
      } else {
        body.position.fromArray(pose.human.root);
        for (const joint of ["hips", "lumbar", "torso", "neck", "head"]) rig[joint].quaternion.fromArray(pose.human.rotations[joint]);
        rig.head.rotation.y += pose.look;
      }
      rig.legs.forEach((leg, i) => {
        if (isAnimal) {
          leg.hip.rotation.x = pose.legs[i].hip;
          leg.knee.rotation.x = pose.legs[i].knee;
          leg.ankle.rotation.x = pose.legs[i].ankle;
        } else {
          const side = i === 0 ? "left" : "right";
          leg.hip.quaternion.fromArray(pose.human.rotations[`${side}Hip`]);
          leg.knee.quaternion.fromArray(pose.human.rotations[`${side}Knee`]);
          leg.ankle.quaternion.fromArray(pose.human.rotations[`${side}Ankle`]);
        }
      });
      rig.arms.forEach(({ shoulder, elbow, wrist, side, rest }, i) => {
        if (isAnimal) {
          const swing = -side * Math.cos(pose.phase * Math.PI * 2) * 0.23 * pose.weight;
          shoulder.rotation.set(swing + pose.idle * side * 0.015, -pose.torsoYaw * 0.2, side * 0.08);
          elbow.rotation.set(-(0.12 + Math.max(0, -swing) * 0.38) * Math.max(0.35, pose.weight), 0, 0);
          wrist.rotation.set(-swing * 0.12, 0, Math.sin(pose.phase * Math.PI * 2 - 0.4) * pose.weight * 0.025);
        } else {
          const label = i === 0 ? "left" : "right";
          shoulder.quaternion.fromArray(pose.human.rotations[`${label}Shoulder`]);
          elbow.quaternion.fromArray(pose.human.rotations[`${label}Elbow`]);
          wrist.quaternion.fromArray(pose.human.rotations[`${label}Wrist`]);
          shoulder.position.copy(rest);
          shoulder.position.x += pose.human.shoulders[i][0];
          shoulder.position.y += pose.human.shoulders[i][1];
          shoulder.position.z += pose.human.shoulders[i][2];
        }
        const waveSide = variant === "jiraiya" ? -1 : 1;
        if (side === waveSide && pose.greeting > 0.005) {
          const greeting = pose.greeting * (1 - pose.weight);
          shoulder.rotation.z += side * greeting * 1.8;
          shoulder.rotation.x -= greeting * 0.3;
          elbow.rotation.x -= greeting * 0.7;
          elbow.rotation.z += side * greeting * 0.8;
          wrist.rotation.z += Math.sin(time * 8) * greeting * 0.2;
        }
      });
      hairTails.forEach((tail, index) => {
        tail.rotation.x = pose.secondary * 1.45 + Math.sin(time * 2.4 + index) * 0.025 + Math.sin(pose.phase * Math.PI * 4) * pose.weight * 0.06;
        tail.rotation.z = -rig.hips.rotation.z * 0.8;
      });
      cloth.forEach((item) => {
        if (item.kind === "coat" || item.kind === "scarf") {
          const position = item.mesh.geometry.attributes.position;
          const cycle = pose.phase * Math.PI * 2;
          const isScarf = item.kind === "scarf";
          for (let i = 0; i < position.count; i++) {
            const x = item.rest[i * 3];
            const y = item.rest[i * 3 + 1];
            const z = item.rest[i * 3 + 2];
            const span = isScarf ? 0.65 : 0.45;
            const hem = Math.min(1, Math.max(0, -y / span)) ** 1.55;
            const wave = Math.sin(cycle * (isScarf ? 2 : 1) - hem * 2.2 + (item.side || 0) * 0.7) * pose.weight;
            const streamLift = isScarf ? (0.08 + pose.run * 0.24) * pose.weight : pose.run * pose.weight * 0.025;
            const streamBack = isScarf ? (0.12 + pose.run * 0.32 + pose.secondary * 1.1) * pose.weight : (pose.secondary * 0.55 + pose.run * pose.weight * 0.065);
            position.setXYZ(
              i,
              x + hem * (wave * (isScarf ? 0.032 : 0.01) - motionState.turn * 0.012),
              y + hem * (streamLift + Math.abs(wave) * (isScarf ? 0.035 : 0.008)),
              z - hem * (streamBack + wave * (isScarf ? 0.045 : 0.014)),
            );
          }
          position.needsUpdate = true;
          item.mesh.geometry.computeVertexNormals();
        } else {
          const position = item.group.geometry.attributes.position;
          for (let i = 0; i < position.count; i++) {
            const x = item.rest[i * 3];
            const y = item.rest[i * 3 + 1];
            const z = item.rest[i * 3 + 2];
            const hem = Math.max(0, (1.43 - y) / 0.52);
            position.setXYZ(i, x * (1 + hem * pose.weight * 0.03), y,
              z + hem * pose.weight * (Math.sin(pose.phase * Math.PI * 2 + x * 4) * 0.03 - pose.run * 0.045));
          }
          position.needsUpdate = true;
        }
      });
      if (sword) sword.rotation.x = -pose.secondary * 0.14 - Math.sin(pose.phase * Math.PI * 2) * pose.weight * 0.05;
      if (rig.tail) rig.tail.rotation.set(pose.secondary * 0.25, Math.sin(time * 2.2) * 0.18 - pose.hipsYaw, -pose.hipsRoll);
      if (rig.staff) {
        rig.staff.rotation.x = Math.sin(pose.phase * Math.PI * 2 + 0.6) * pose.weight * 0.075;
        rig.staff.position.y = 1.15 - hipHeight - pose.bodyY * 0.6;
      }
    },
    getPoseSnapshot() {
      return { phase: motionState.phase, blend: motionState.weight, run: motionState.run,
        knees: rig.legs.map((leg) => leg.knee.rotation.x), elbows: rig.arms.map((arm) => arm.elbow.rotation.x),
        lift: lastPose?.bodyY || 0,
        animation: isAnimal ? "grounded-stride" : "contact-driven-locomotion",
        spine: rig.lumbar ? [rig.hips.rotation.y, rig.lumbar.rotation.y, rig.torso.rotation.y] : null };
    },
    dispose() { geometries.forEach((geometry) => geometry.dispose()); rig.skeleton?.dispose(); outline.dispose(); },
  };
}
