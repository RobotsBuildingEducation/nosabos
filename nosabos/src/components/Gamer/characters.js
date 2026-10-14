import * as THREE from "three";
import { advanceMotion, createMotionState } from "./motion.js";
import { createHumanSpine } from "./spine.js";

// Silhouette is authored before shading: tapered anatomy, a small jaw, tailored
// clothing and swept hair ribbons, rather than a stack of toy primitives.
export function createCharacter(material, variant = "explorer", art = null) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const geometries = new Set();
  const outline = new THREE.MeshBasicMaterial({ color: "#303440", side: THREE.BackSide });
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
  const skinColor = purple ? "#b88665" : "#efc69f";
  const skin = material(`skin-${variant}`, skinColor);
  const ink = material("anime-ink", "#28303c");
  const ivory = material("anime-ivory", "#fff0d0");
  const leather = material("anime-leather", "#553b37");
  const gold = material("anime-gold", "#d3a958");
  const hairColor = purple ? "#553663" : blue ? "#3272bd" : botanist ? "#dab575" : silver ? "#ced6d8" : "#634238";
  const hair = material(`sculpted-hair-${variant}`, hairColor);
  const hairLight = material(`hair-highlight-${variant}`, purple ? "#85578b" : blue ? "#64a8e0" : botanist ? "#f3d8a0" : silver ? "#f0ebdc" : "#95644b");
  const coat = material(`tailored-coat-${variant}`, purple ? "#3d304e" : blue ? "#dc6b99" : botanist ? "#597c69" : silver ? "#54747e" : "#b83e3d");
  const coatLight = material(`tailored-coat-light-${variant}`, purple ? "#685078" : blue ? "#f09fb4" : botanist ? "#87a285" : silver ? "#84a0a5" : "#de6853");
  const trousers = material(`trousers-${variant}`, purple ? "#353047" : "#384550");

  function own(geometry) { geometries.add(geometry); return geometry; }
  function part(parent, geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], edge = true) {
    const item = new THREE.Mesh(geometry, mat);
    item.position.set(...position);
    item.scale.set(...scale);
    item.castShadow = item.receiveShadow = true;
    parent.add(item);
    if (edge) {
      const shell = new THREE.Mesh(geometry, outline);
      shell.scale.set(1.016, 1.012, 1.016);
      item.add(shell);
    }
    return item;
  }
  function ellipsoid(parent, mat, position, scale, edge = true) { return part(parent, sphere, mat, position, scale, edge); }
  function profile(parent, rings, mat, segments = 20) {
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
    return part(parent, geometry, mat);
  }
  function curveLine(parent, points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return part(parent, own(new THREE.TubeGeometry(curve, 20, radius, 6, false)), mat, [0, 0, 0], [1, 1, 1], false);
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
          positions.push(side * (0.018 + u * 0.23) * (1 + hem * 0.16), -hem * 0.43,
            -0.13 - hem * 0.055 - Math.sin(u * Math.PI) * 0.025 + layer * 0.012);
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
  function hairRibbon(parent, points, width, mat = hair, highlight = false) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const center = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const across = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize();
      const thickness = new THREE.Vector3().crossVectors(across, tangent).normalize();
      const taper = Math.sin(Math.PI * (0.12 + t * 0.88)) * (1 - t * 0.75);
      for (let j = 0; j < 5; j++) {
        const angle = j / 4 * Math.PI * 2;
        const vertex = center.clone().addScaledVector(across, Math.cos(angle) * width * taper).addScaledVector(thickness, Math.sin(angle) * width * taper * 0.45);
        positions.push(vertex.x, vertex.y, vertex.z);
        uvs.push(j / 4, t);
        if (i && j < 4) {
          const n = i * 5 + j;
          indices.push(n, n + 1, n - 5, n + 1, n - 4, n - 5);
        }
      }
    }
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const ribbon = part(parent, geometry, mat);
    if (highlight) {
      const line = Array.from({ length: 15 }, (_, i) => {
        const p = curve.getPoint(i / 16);
        p.z += width * 0.32;
        return p.toArray();
      });
      curveLine(parent, line, 0.005, hairLight);
    }
    return ribbon;
  }

  function makeHuman() {
    // Six-head proportions: long legs, slim waist, real shoulder slope.
    profile(body, [[1.32, 0.25, 0.15], [1.48, 0.225, 0.145], [1.68, 0.21, 0.135],
      [1.88, female ? 0.255 : 0.275, 0.17], [2.11, female ? 0.31 : 0.345, 0.15],
      [2.19, 0.27, 0.125], [2.26, 0.105, 0.09]], coat).name = "coat-body";
    profile(body, [[2.19, 0.095, 0.085], [2.4, 0.09, 0.08]], skin);
    // A narrow coat front and seams describe the body instead of bulky plates.
    for (const side of [-1, 1]) {
      curveLine(body, [[side * 0.12, 1.4, 0.151], [side * 0.115, 1.7, 0.143], [side * 0.18, 2.08, 0.149], [side * 0.1, 2.2, 0.1]], 0.009, gold);
    }
    profile(body, [[1.42, 0.242, 0.158], [1.49, 0.236, 0.153]], leather);
    part(body, own(new THREE.BoxGeometry(0.095, 0.08, 0.025)), gold, [0, 1.455, 0.17]);
    for (let y = 1.6; y < 2.13; y += 0.13) ellipsoid(body, gold, [0, y, 0.172], [0.018, 0.018, 0.009], false);
    if (purple) {
      profile(body, [[1.48, 0.225, 0.15], [1.71, 0.21, 0.139]], skin);
      profile(body, [[1.71, 0.23, 0.155], [1.83, 0.26, 0.17], [1.98, 0.25, 0.158]], material("yoruichi-orange", "#d69b51"));
      curveLine(body, [[-0.28, 2.14, 0.11], [0, 1.82, 0.18], [0.28, 2.14, 0.11]], 0.021, coat);
    } else if (!female) {
      // Tailored split coat tails, slim crossed straps, a sword scabbard.
      for (const side of [-1, 1]) {
        const tail = new THREE.Group();
        tail.position.set(0, 1.43, 0);
        body.add(tail);
        const panel = coatPanel(tail, side);
        cloth.push({ group: tail, mesh: panel, rest: panel.geometry.attributes.position.array.slice(), side, kind: "coat" });
        curveLine(body, [[side * 0.26, 2.13, 0.09], [-side * 0.13, 1.49, 0.17]], 0.028, leather);
      }
      sword = new THREE.Group();
      sword.position.set(-0.31, 1.49, -0.13);
      body.add(sword);
      curveLine(sword, [[0, 0.03, 0], [-0.15, -0.99, -0.02]], 0.043, leather);
      curveLine(sword, [[0.02, 0.13, 0], [0.04, 0.34, 0]], 0.037, leather);
      curveLine(sword, [[-0.1, 0.14, 0], [0.14, 0.14, 0]], 0.025, gold);
    }
    if (blue || botanist) {
      const skirtMat = blue ? material("yachiru-skirt", "#4758a0") : coat;
      const skirt = profile(body, [[0.91, 0.39, 0.265], [1.04, 0.35, 0.24], [1.3, 0.27, 0.19], [1.43, 0.24, 0.17]], skirtMat, 24);
      skirt.geometry.computeVertexNormals();
      cloth.push({ group: skirt, kind: "skirt", rest: skirt.geometry.attributes.position.array.slice() });
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        curveLine(body, [[Math.sin(a) * 0.245, 1.4, Math.cos(a) * 0.174], [Math.sin(a) * 0.345, 1.05, Math.cos(a) * 0.245], [Math.sin(a) * 0.385, 0.92, Math.cos(a) * 0.265]], 0.005, blue ? coatLight : ivory);
      }
    }
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.name = side < 0 ? "left-hip" : "right-hip";
      leg.position.set(side * 0.145, 1.39, 0);
      body.add(leg);
      const legMat = blue || botanist ? skin : trousers;
      profile(leg, [[0, 0.135, 0.13], [-0.18, 0.145, 0.13], [-0.48, 0.105, 0.105], [-0.65, 0.087, 0.095]], legMat);
      const knee = new THREE.Group();
      knee.name = side < 0 ? "left-knee" : "right-knee";
      knee.position.y = -0.64;
      leg.add(knee);
      ellipsoid(knee, legMat, [0, 0, 0], [0.09, 0.085, 0.095]);
      profile(knee, [[0.025, 0.087, 0.095], [-0.14, 0.087, 0.09], [-0.45, 0.075, 0.08], [-0.6, 0.07, 0.08]], legMat);
      profile(knee, [[-0.61, 0.092, 0.11], [-0.44, 0.105, 0.11], [-0.26, 0.115, 0.12]], purple ? coatLight : leather);
      profile(knee, [[-0.36, 0.113, 0.12], [-0.31, 0.116, 0.124]], gold);
      const ankle = new THREE.Group();
      ankle.name = side < 0 ? "left-ankle" : "right-ankle";
      ankle.position.y = -0.61;
      knee.add(ankle);
      ellipsoid(ankle, leather, [0, -0.06, 0.09], [0.105, 0.075, 0.23]);
      ellipsoid(ankle, ink, [0, -0.12, 0.095], [0.106, 0.014, 0.225], false);
      const fold = material(`fabric-fold-${variant}`, purple ? "#51405c" : "#56616a");
      curveLine(leg, [[-0.07, -0.5, 0.08], [0.02, -0.55, 0.1], [0.065, -0.57, 0.07]], 0.008, fold);
      rig.legs.push({ hip: leg, knee, ankle, side });
      const arm = new THREE.Group();
      arm.name = side < 0 ? "left-shoulder" : "right-shoulder";
      arm.position.set(side * 0.315, 2.14, 0);
      arm.rotation.z = side * 0.08;
      body.add(arm);
      profile(arm, [[0.08, 0.025, 0.03], [0.025, 0.09, 0.1], [-0.1, 0.115, 0.105], [-0.3, 0.087, 0.085], [-0.46, 0.073, 0.075]], purple ? skin : coat);
      const elbow = new THREE.Group();
      elbow.name = side < 0 ? "left-elbow" : "right-elbow";
      elbow.position.y = -0.43;
      arm.add(elbow);
      ellipsoid(elbow, purple ? skin : coat, [0, 0, 0], [0.074, 0.07, 0.075]);
      profile(elbow, [[0.02, 0.074, 0.075], [-0.13, 0.081, 0.075], [-0.4, 0.048, 0.052]], purple ? coat : skin);
      profile(elbow, [[-0.26, 0.078, 0.08], [-0.36, 0.068, 0.07]], purple ? gold : ivory);
      const wrist = new THREE.Group();
      wrist.position.y = -0.41;
      elbow.add(wrist);
      ellipsoid(wrist, skin, [0, -0.04, 0.025], [0.053, 0.09, 0.056]);
      ellipsoid(wrist, skin, [-side * 0.045, -0.02, 0.056], [0.027, 0.047, 0.028]);
      rig.arms.push({ shoulder: arm, elbow, wrist, side });
    }
    const head = new THREE.Group();
    head.position.y = 2.65;
    body.add(head);
    rig.head = head;
    profile(head, [[-0.265, 0.035, 0.045, 0, 0.04], [-0.23, 0.115, 0.11, 0, 0.03],
      [-0.13, 0.192, 0.16, 0, 0.005], [0, 0.22, 0.18], [0.13, 0.225, 0.18],
      [0.235, 0.17, 0.14], [0.28, 0.035, 0.04]], skin, 32);
    for (const side of [-1, 1]) ellipsoid(head, skin, [side * 0.214, -0.04, 0], [0.035, 0.065, 0.04]);
    if (art) {
      const faceMat = material(`painted-face-${variant}`, purple ? "#c39579" : "#ffffff");
      faceMat.map = art.faces[purple ? 1 : blue ? 2 : botanist ? 3 : 0];
      const faceGeo = own(new THREE.PlaneGeometry(1, 1, 16, 16));
      const p = faceGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) + 0.5;
        const v = p.getY(i) + 0.5;
        const width = 0.105 + Math.sin(v * Math.PI * 0.72) * 0.112;
        const x = (u * 2 - 1) * width;
        const y = -0.246 + v * 0.465;
        const z = Math.sqrt(Math.max(0, 1 - (x / (width * 1.14)) ** 2)) * (0.12 + Math.sin(v * Math.PI) * 0.065) + 0.009;
        p.setXYZ(i, x, y, z);
      }
      faceGeo.computeVertexNormals();
      part(head, faceGeo, faceMat, [0, 0, 0], [1, 1, 1], false);
    }
    // A fitted crown is hidden under overlapping, curved locks.
    const cap = profile(head, [[-0.01, 0.224, 0.18, 0, -0.035], [0.14, 0.242, 0.195, 0, -0.023],
      [0.26, 0.194, 0.162, 0, -0.023], [0.32, 0.07, 0.075, 0, -0.015]], hair, 28);
    cap.scale.z = 1.015;
    for (let i = 0; i < 9; i++) {
      const x = -0.215 + i * 0.053;
      const endX = x - (purple || silver ? 0.07 : 0.025);
      const fringe = i < 2 || i > 6 ? -0.015 : 0.07 + (i % 3) * 0.025;
      hairRibbon(head, [[x * 0.5 + 0.06, 0.3, 0.035], [x, 0.22, 0.16], [endX, 0.14 + Math.abs(x) * 0.1, 0.195], [endX - 0.025, fringe, 0.18]], 0.058, hair, i % 3 === 0);
    }
    for (const side of [-1, 1]) {
      hairRibbon(head, [[side * 0.19, 0.2, 0.02], [side * 0.236, 0.05, 0.045], [side * 0.21, -0.19, 0.02], [side * 0.18, -0.26, -0.02]], 0.065, hair, true);
    }
    if (purple || botanist) {
      const tail = new THREE.Group();
      tail.position.set(purple ? 0.08 : 0, 0.13, -0.18);
      head.add(tail);
      for (let i = 0; i < 7; i++) {
        const x = (i - 3) * 0.052;
        hairRibbon(tail, [[x * 0.3, 0.08, 0], [x, -0.17, -0.14], [x * 1.3, -0.65, -0.19], [x * 0.8 - 0.08, -1.04 + (i % 3) * 0.08, -0.24]], 0.075, hair, i % 2 === 0);
      }
      ellipsoid(tail, gold, [0, 0, -0.03], [0.12, 0.055, 0.08]);
      hairTails.push(tail);
    } else if (blue) {
      for (const side of [-1, 1]) {
        ellipsoid(head, hair, [side * 0.235, 0.26, -0.045], [0.12, 0.125, 0.115]);
        curveLine(head, [[side * 0.15, 0.29, 0.02], [side * 0.23, 0.36, -0.03], [side * 0.31, 0.27, -0.07]], 0.009, hairLight);
        hairRibbon(head, [[side * 0.21, 0.2, -0.13], [side * 0.28, -0.04, -0.17], [side * 0.27, -0.3, -0.14]], 0.07, hair, true);
      }
      const bow = material("pink-hair-ribbon", "#e895bd");
      for (const side of [-1, 1]) ellipsoid(head, bow, [side * 0.27, 0.14, 0.03], [0.095, 0.04, 0.035]);
    } else {
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI;
        hairRibbon(head, [[0.05, 0.24, -0.015], [Math.cos(a) * 0.12, 0.29, -0.1], [Math.cos(a) * 0.22, 0.18, -0.2], [Math.cos(a) * 0.23, 0.015, -0.23]], 0.065, hair, i % 2 === 0);
      }
      hairRibbon(head, [[0.06, 0.25, -0.015], [-0.06, 0.33, -0.025], [-0.18, 0.38, -0.025], [-0.27, 0.36, -0.015]], 0.065, hair, true);
      profile(body, [[2.22, 0.14, 0.12], [2.3, 0.13, 0.11]], coatLight);
      const scarf = new THREE.Group();
      scarf.position.set(-0.08, 2.25, -0.13);
      body.add(scarf);
      neckParts.add(scarf);
      const ribbon = hairRibbon(scarf, [[0, 0, 0], [-0.09, -0.2, -0.05], [0, -0.49, -0.11], [-0.1, -0.65, -0.13]], 0.1, coatLight);
      cloth.push({ group: scarf, mesh: ribbon, kind: "scarf", rest: ribbon.geometry.attributes.position.array.slice() });
    }
    if (purple) {
      curveLine(head, [[-0.22, 0.13, 0.073], [0, 0.19, 0.19], [0.22, 0.13, 0.073]], 0.014, gold);
      ellipsoid(head, gold, [0, 0.18, 0.2], [0.027, 0.045, 0.014]);
    }
    root.scale.setScalar(blue ? 0.76 : 0.87);
  }

  function makeAnimal() {
    const frog = variant === "jiraiya";
    const cat = variant === "neko";
    const fur = material(`fur-${variant}`, frog ? "#708b52" : cat ? "#ce955d" : "#b9b7c9");
    const pale = material(`pale-${variant}`, frog ? "#c3c194" : cat ? "#fff1d1" : "#f1e6da");
    const dark = material(`markings-${variant}`, frog ? "#485f3e" : cat ? "#80533f" : "#706b83");
    const cloth = material(`animal-cloth-${variant}`, frog ? "#6e505a" : cat ? "#638c8a" : "#6b6c8b");
    ellipsoid(body, fur, [0, 0.77, 0], [frog ? 0.56 : 0.4, 0.61, 0.31]);
    ellipsoid(body, pale, [0, 0.77, 0.17], [0.33, 0.4, 0.2]);
    const head = new THREE.Group();
    head.position.y = frog ? 1.38 : 1.5;
    body.add(head);
    rig.head = head;
    ellipsoid(head, fur, [0, 0, 0], [frog ? 0.57 : 0.4, frog ? 0.29 : 0.36, 0.3]);
    if (frog) {
      for (const side of [-1, 1]) {
        ellipsoid(head, fur, [side * 0.34, 0.21, -0.01], [0.18, 0.2, 0.16]);
        ellipsoid(head, material("toad-eye-gold", "#d2b66a"), [side * 0.34, 0.22, 0.135], [0.092, 0.11, 0.025]);
        ellipsoid(head, ink, [side * 0.34, 0.22, 0.16], [0.02, 0.07, 0.01], false);
        curveLine(head, [[side * 0.48, 0.29, 0.08], [side * 0.33, 0.35, 0.1], [side * 0.2, 0.29, 0.12]], 0.025, dark);
        ellipsoid(head, pale, [side * 0.36, -0.1, 0.19], [0.14, 0.075, 0.055], false);
        for (let i = 0; i < 7; i++) ellipsoid(head, dark, [side * (0.18 + i % 3 * 0.09), 0.03 - i / 7 * 0.16, 0.255 - i % 3 * 0.025], [0.022, 0.017, 0.012], false);
      }
      curveLine(head, [[-0.39, -0.06, 0.23], [-0.22, -0.12, 0.29], [0.22, -0.12, 0.29], [0.39, -0.06, 0.23]], 0.009, dark);
      profile(body, [[0.35, 0.55, 0.33], [0.6, 0.59, 0.345], [0.9, 0.54, 0.335], [1.15, 0.43, 0.265]], cloth);
      for (const side of [-1, 1]) curveLine(body, [[side * 0.32, 1.23, 0.04], [side * 0.48, 0.95, 0.24], [side * 0.45, 0.52, 0.28]], 0.055, ivory);
      const staff = curveLine(body, [[0.65, 0.06, 0.15], [0.66, 1.37, 0.13], [0.59, 1.52, 0.14]], 0.036, leather);
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
          part(head, own(new THREE.ConeGeometry(0.1, 0.23, 3)), material("cat-ear-pink", "#d4a08c"), [side * 0.27, 0.35, 0.075], [1, 1, 0.25], false);
        } else {
          ellipsoid(head, fur, [side * 0.3, 0.31, -0.01], [0.14, 0.145, 0.08]);
          ellipsoid(head, material("hamster-ear", "#cc9caa"), [side * 0.3, 0.32, 0.06], [0.085, 0.09, 0.018], false);
        }
        ellipsoid(head, pale, [side * 0.22, -0.12, 0.18], [0.2, 0.16, 0.14]);
        ellipsoid(head, ivory, [side * 0.15, 0.03, 0.255], [0.087, 0.115, 0.031], false);
        ellipsoid(head, cat ? material("cat-iris", "#719482") : ink, [side * 0.15, 0.025, 0.285], [0.045, 0.08, 0.012], false);
        ellipsoid(head, ink, [side * 0.15, 0.025, 0.298], [0.018, 0.065, 0.008], false);
        ellipsoid(head, ivory, [side * 0.15 - 0.017, 0.067, 0.302], [0.013, 0.019, 0.006], false);
        curveLine(head, [[side * 0.22, 0.14, 0.235], [side * 0.14, 0.15, 0.265], [side * 0.08, 0.12, 0.25]], 0.012, dark);
        if (cat) {
          for (let i = 0; i < 3; i++) curveLine(head, [[side * 0.27, -0.085 - i * 0.04, 0.26], [side * 0.46, -0.05 - i * 0.06, 0.23]], 0.006, ivory);
          curveLine(head, [[side * 0.04, 0.32, 0.14], [side * 0.08, 0.2, 0.25]], 0.016, dark);
        }
      }
      ellipsoid(head, material("animal-nose", "#bc8e8a"), [0, -0.08, 0.337], [0.045, 0.03, 0.02]);
      curveLine(head, [[-0.07, -0.16, 0.3], [0, -0.18, 0.32], [0.07, -0.16, 0.3]], 0.009, dark);
      for (const side of [-1, 1]) curveLine(body, [[side * 0.24, 1.13, 0.11], [side * 0.31, 0.91, 0.27], [side * 0.28, 0.5, 0.23]], 0.058, cloth);
      profile(body, [[1.17, 0.24, 0.2], [1.26, 0.26, 0.21]], cat ? material("neko-scarf", "#c66d69") : material("sheilfer-scarf", "#769aab"));
      for (let y = 0.6; y < 1.1; y += 0.18) ellipsoid(body, gold, [0, y, 0.36], [0.025, 0.025, 0.015], false);
      if (cat) {
        const tail = curveLine(body, [[0, 0.5, -0.22], [0.36, 0.45, -0.4], [0.64, 0.78, -0.36], [0.5, 1.06, -0.28]], 0.07, fur);
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
    // The animal villagers retain their shorter, two-part body rig.
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
        tail.rotation.x = pose.secondary + Math.sin(time * 2.1 + index) * 0.018;
        tail.rotation.z = -rig.hips.rotation.z * 0.7;
      });
      cloth.forEach((item) => {
        if (item.kind === "coat" || item.kind === "scarf") {
          const position = item.mesh.geometry.attributes.position;
          const cycle = pose.phase * Math.PI * 2;
          for (let i = 0; i < position.count; i++) {
            const x = item.rest[i * 3];
            const y = item.rest[i * 3 + 1];
            const z = item.rest[i * 3 + 2];
            const hem = Math.min(1, Math.max(0, -y / (item.kind === "coat" ? 0.43 : 0.65))) ** 2;
            const flutter = Math.sin(cycle - 0.65 + (item.side || 0) * 0.8) * pose.weight;
            position.setXYZ(i, x + hem * (flutter * 0.006 - motionState.turn * 0.003),
              y + hem * pose.run * pose.weight * 0.008,
              z - hem * (pose.secondary * 0.4 + pose.run * pose.weight * 0.035 + flutter * 0.008));
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
            position.setXYZ(i, x * (1 + hem * pose.weight * 0.025), y,
              z + hem * pose.weight * (Math.sin(pose.phase * Math.PI * 2 + x * 4) * 0.025 - pose.run * 0.035));
          }
          position.needsUpdate = true;
        }
      });
      if (sword) sword.rotation.x = -pose.secondary * 0.08;
      if (rig.tail) rig.tail.rotation.set(pose.secondary * 0.2, Math.sin(time * 2) * 0.16 - pose.hipsYaw, -pose.hipsRoll);
      if (rig.staff) {
        rig.staff.rotation.x = Math.sin(pose.phase * Math.PI * 2 + 0.6) * pose.weight * 0.075;
        rig.staff.position.y = 1.15 - hipHeight - pose.bodyY * 0.6;
      }
    },
    getPoseSnapshot() {
      return { phase: motionState.phase, blend: motionState.weight, run: motionState.run,
        knees: rig.legs.map((leg) => leg.knee.rotation.x), elbows: rig.arms.map((arm) => arm.elbow.rotation.x),
        lift: lastPose?.bodyY || 0,
        animation: isAnimal ? "grounded-stride" : "restrained-locomotion",
        spine: rig.lumbar ? [rig.hips.rotation.y, rig.lumbar.rotation.y, rig.torso.rotation.y] : null };
    },
    dispose() { geometries.forEach((geometry) => geometry.dispose()); rig.skeleton?.dispose(); outline.dispose(); },
  };
}
