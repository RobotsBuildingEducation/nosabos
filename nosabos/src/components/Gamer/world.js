import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createCharacter } from "./characters.js";
import { loadArtAssets } from "./artAssets.js";
import { VILLAGE_CAST } from "./cast.js";
import { angleDelta } from "./motion.js";
import { createVillager, updateVillagers } from "./villagers.js";
import {
  BERRIES, HOUSES, LANDMARKS, SPAWN, isWalkable, nearestInteraction,
  riverCenter, terrainHeight,
} from "./gameData.js";

const TAU = Math.PI * 2;
const DEFAULT_CAMERA = { yaw: -0.19, pitch: 0.36, distance: 12.8 };

function seededRandom(seed = 4729) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function makeGroundTexture(random) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  const px = (value) => ((value + 48) / 96) * canvas.width;
  ctx.fillStyle = "#729b50";
  ctx.fillRect(0, 0, 1536, 1536);
  // Soft, overlapping washes keep the ground painterly, with no tile grid.
  for (let i = 0; i < 1600; i++) {
    const x = random() * 1536;
    const y = random() * 1536;
    const radius = 15 + random() * 65;
    const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
    wash.addColorStop(0, ["#a6bc6866", "#33794444", "#c4d58444"][i % 3]);
    wash.addColorStop(1, "#729b5000");
    ctx.fillStyle = wash;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function path(draw, width) {
    ctx.beginPath();
    draw();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#bac583";
    ctx.lineWidth = width + 22;
    ctx.stroke();
    ctx.strokeStyle = "#ddd1a0";
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.strokeStyle = "#e4d9ae";
    ctx.lineWidth = width * 0.68;
    ctx.stroke();
  }
  path(() => {
    ctx.moveTo(px(1), px(33));
    ctx.bezierCurveTo(px(2), px(15), px(-3), px(10), px(0), px(-2));
    ctx.bezierCurveTo(px(2), px(-12), px(-2), px(-19), px(1), px(-32));
  }, 51);
  path(() => {
    ctx.moveTo(px(-13), px(8));
    ctx.bezierCurveTo(px(-9), px(7), px(-7), px(-2), px(0), px(-2));
    ctx.bezierCurveTo(px(6), px(-2), px(8), px(-3), px(23), px(-3));
  }, 40);
  path(() => {
    ctx.moveTo(px(-8), px(-4));
    ctx.quadraticCurveTo(px(-3), px(-2), px(0), px(-2));
  }, 42);
  ctx.beginPath();
  ctx.ellipse(px(-0.5), px(-2), 89, 78, 0, 0, TAU);
  ctx.fillStyle = "#ded3a7";
  ctx.fill();
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = i % 2 ? "#f2edcb18" : "#476e3620";
    ctx.fillRect(random() * 1536, random() * 1536, 1 + random() * 3, 1 + random() * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function buildVillage(scene, material, random, art) {
  const staticWorld = new THREE.Group();
  const geometries = new Set();
  const obstacles = HOUSES.map((house) => ({ ...house }));
  const cameraTrees = [];
  const box = new THREE.BoxGeometry(1, 1, 1);
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
  const cone = new THREE.ConeGeometry(1, 1, 9);
  [box, sphere, cylinder, cone].forEach((geometry) => geometries.add(geometry));
  const wood = material("wood", "#6c5940");
  const darkWood = material("dark-wood", "#514835");
  const lightWood = material("light-wood", "#b69a67");
  const stone = material("stone", "#b6b7a0");
  const stoneLight = material("stone-light", "#d3cdb1");
  const plaster = material("plaster", "#f0dfb3");
  const roofRed = material("roof-red", "#b95e45");
  const roofRedLight = material("roof-red-light", "#cf7a51");
  const roofBlue = material("roof-blue", "#547b80");
  const roofBlueLight = material("roof-blue-light", "#749498");
  const glass = material("glass", "#507e7d");
  const trim = material("trim", "#f9e9ba");
  const leafMats = ["#416e46", "#54874a", "#6b9b50", "#8bad5d"].map((color, i) => material(`foliage-${i}`, color));
  leafMats.forEach((mat, index) => {
    mat.map = art.canopy;
    mat.color.set(["#8baf79", "#aac78b", "#bed19a", "#c4d69b"][index]);
  });
  const boughMat = material("painted-leaf-bough", "#e4f0bd");
  boughMat.map = art.bough;
  boughMat.alphaTest = 0.4;
  boughMat.side = THREE.DoubleSide;
  boughMat.alphaToCoverage = true;
  const boughGeo = new THREE.PlaneGeometry(1, 1, 2, 2);
  geometries.add(boughGeo);
  const bark = material("painted-bark", "#e7ddc7");
  bark.map = art.bark;

  function mesh(parent, geo, mat, position, scale, rotation) {
    const item = new THREE.Mesh(geo, mat);
    item.position.set(...position);
    if (scale) item.scale.set(...scale);
    if (rotation) item.rotation.set(...rotation);
    parent.add(item);
    return item;
  }
  function beam(parent, from, to, radius, mat = wood) {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const item = mesh(parent, cylinder, mat, start.clone().add(end).multiplyScalar(0.5).toArray(), [radius, start.distanceTo(end), radius]);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return item;
  }
  function pot(parent, x, y, z, size = 0.4) {
    mesh(parent, cylinder, roofRed, [x, y + size * 0.4, z], [size * 0.65, size * 0.8, size * 0.65]);
    mesh(parent, cylinder, roofRedLight, [x, y + size * 0.83, z], [size * 0.76, size * 0.14, size * 0.76]);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * TAU;
      const head = [x + Math.cos(angle) * size * 0.4, y + size * (1.3 + random() * 0.4), z + Math.sin(angle) * size * 0.4];
      beam(parent, [x, y + size * 0.8, z], head, 0.018, leafMats[0]);
      mesh(parent, sphere, material(i % 2 ? "flower-pink" : "flower-gold", i % 2 ? "#e9a997" : "#f4d17b"), head, [size * 0.18, size * 0.12, size * 0.18]);
    }
  }

  for (const house of HOUSES) {
    const group = new THREE.Group();
    const { width: w, depth: d, height: h } = house;
    group.position.set(house.x, 0, house.z);
    group.rotation.y = house.rotation;
    staticWorld.add(group);
    mesh(group, box, stone, [0, 0.18, 0], [w + 0.25, 0.36, d + 0.2]);
    mesh(group, box, plaster, [0, h / 2 + 0.25, 0], [w, h, d]);
    for (const x of [-w / 2 + 0.1, 0, w / 2 - 0.1]) {
      mesh(group, box, wood, [x, h / 2 + 0.2, d / 2 + 0.035], [0.17, h, 0.16]);
      mesh(group, box, wood, [x, h / 2 + 0.2, -d / 2 - 0.035], [0.17, h, 0.16]);
    }
    for (const y of [0.45, h * 0.58, h + 0.2]) {
      mesh(group, box, wood, [0, y, d / 2 + 0.045], [w, 0.16, 0.15]);
      for (const x of [-w / 2, w / 2]) mesh(group, box, wood, [x, y, 0], [0.15, 0.16, d]);
    }
    const peak = w * 0.42;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, peak);
    shape.closePath();
    const gable = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geometries.add(gable);
    mesh(group, gable, plaster, [0, h + 0.2, -d / 2]);
    for (const z of [-d / 2 - 0.03, d / 2 + 0.03]) {
      beam(group, [-w / 2, h + 0.2, z], [0, h + peak + 0.2, z], 0.075);
      beam(group, [0, h + peak + 0.2, z], [w / 2, h + 0.2, z], 0.075);
      beam(group, [0, h + 0.2, z], [0, h + peak, z], 0.075);
    }
    const roof = house.roof === "blue" ? roofBlue : roofRed;
    const roofLight = house.roof === "blue" ? roofBlueLight : roofRedLight;
    const roofAngle = Math.atan2(peak, w / 2);
    const slope = Math.hypot(w / 2 + 0.5, peak + 0.35);
    for (const side of [-1, 1]) {
      mesh(group, box, roof, [side * (w / 4 + 0.1), h + peak / 2 + 0.35, 0], [slope, 0.22, d + 1.1], [0, 0, side * -roofAngle]);
      // Painted shingles carry the fine detail; thin eaves retain a clean shape.
      for (let row = 0; row < 2; row++) {
        const t = row ? 1 : 0.05;
        const x = side * t * (w / 2 + 0.5);
        const y = h + peak + 0.5 - t * (peak + 0.35);
        mesh(group, box, row % 2 ? roof : roofLight, [x, y, 0], [0.095, 0.095, d + 1.18], [0, 0, side * -roofAngle]);
      }
    }
    mesh(group, cylinder, roofLight, [0, h + peak + 0.48, 0], [0.14, d + 1.2, 0.14], [Math.PI / 2, 0, 0]);
    mesh(group, box, stone, [-w * 0.28, h + peak * 0.74, -d * 0.22], [0.6, 2, 0.65]);
    mesh(group, box, stoneLight, [-w * 0.28, h + peak * 0.74 + 1, -d * 0.22], [0.78, 0.18, 0.8]);
    // Door, doorstep, windows and flower boxes all face the village paths.
    mesh(group, box, darkWood, [0, 1.42, d / 2 + 0.105], [1.15, 2.4, 0.15]);
    mesh(group, box, lightWood, [0, 1.38, d / 2 + 0.2], [0.94, 2.23, 0.04]);
    for (let i = -1; i <= 1; i++) mesh(group, box, wood, [i * 0.25, 1.37, d / 2 + 0.225], [0.025, 2.2, 0.02]);
    mesh(group, sphere, material("brass", "#dab773"), [0.3, 1.3, d / 2 + 0.26], [0.055, 0.055, 0.04]);
    mesh(group, box, stoneLight, [0, 0.15, d / 2 + 0.55], [1.7, 0.3, 0.95]);
    for (const x of [-w * 0.3, w * 0.3]) {
      mesh(group, box, wood, [x, 1.85, d / 2 + 0.095], [1.25, 1.4, 0.13]);
      mesh(group, box, glass, [x, 1.87, d / 2 + 0.17], [1, 1.15, 0.045]);
      mesh(group, box, trim, [x, 1.87, d / 2 + 0.205], [0.055, 1.17, 0.035]);
      mesh(group, box, trim, [x, 1.87, d / 2 + 0.205], [1.05, 0.06, 0.035]);
      for (const side of [-1, 1]) mesh(group, box, house.roof === "blue" ? roofBlue : leafMats[0], [x + side * 0.76, 1.84, d / 2 + 0.08], [0.28, 1.35, 0.1], [0, side * 0.25, 0]);
      mesh(group, box, wood, [x, 1.13, d / 2 + 0.32], [1.4, 0.25, 0.5]);
      for (let i = 0; i < 5; i++) {
        mesh(group, sphere, leafMats[1], [x - 0.5 + i * 0.25, 1.34, d / 2 + 0.32], [0.21, 0.18, 0.24]);
        mesh(group, sphere, material("window-flowers", "#edb1a6"), [x - 0.5 + i * 0.25, 1.48, d / 2 + 0.4], [0.1, 0.09, 0.1]);
      }
    }
    // Circular attic window.
    mesh(group, cylinder, wood, [0, h + peak * 0.45, d / 2 + 0.07], [0.42, 0.12, 0.42], [Math.PI / 2, 0, 0]);
    mesh(group, cylinder, glass, [0, h + peak * 0.45, d / 2 + 0.145], [0.31, 0.025, 0.31], [Math.PI / 2, 0, 0]);
    mesh(group, box, trim, [0, h + peak * 0.45, d / 2 + 0.17], [0.04, 0.65, 0.025]);
    pot(group, -0.97, 0, d / 2 + 0.65, 0.55);
    // Creeping ivy softens the building's hard silhouette.
    for (let i = 0; i < 8; i++) {
      mesh(group, boughGeo, boughMat, [-w / 2 + 0.16 + Math.sin(i * 0.9) * 0.15, 0.5 + i * 0.41, d / 2 + 0.15],
        [0.7 + random() * 0.3, 0.8, 1], [0, 0, Math.sin(i) * 0.25]);
    }
    if (house.z > 0) {
      // A small canvas awning and produce crates beside the cottage.
      mesh(group, box, trim, [1.5, 2.35, d / 2 + 1], [2.7, 0.12, 1.8], [0.12, 0, 0]);
      for (const x of [0.25, 2.7]) beam(group, [x, 0, d / 2 + 1.7], [x, 2.5, d / 2 + 1.7], 0.055);
      mesh(group, box, lightWood, [1.5, 0.57, d / 2 + 1], [2.6, 1.05, 0.8]);
      for (let i = 0; i < 9; i++) mesh(group, sphere, i % 2 ? roofRed : material("produce", "#d6b64f"), [0.55 + (i % 5) * 0.4, 1.16, d / 2 + 0.9 + Math.floor(i / 5) * 0.3], [0.16, 0.15, 0.15]);
      obstacles.push({ x: house.x + 1.5, z: house.z + d / 2 + 1, width: 2.6, depth: 0.85 });
    }
  }

  function tree(x, z, size = 1) {
    const y = terrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(size);
    group.rotation.y = random() * TAU;
    staticWorld.add(group);
    // Separate collision proxies survive mesh batching and keep the orbit
    // camera out of the dense canopy without fading the whole forest.
    cameraTrees.push(new THREE.Sphere(new THREE.Vector3(x, y + 5.7 * size, z), 3.1 * size));
    const trunkGeo = new THREE.LatheGeometry([
      new THREE.Vector2(0.65, 0), new THREE.Vector2(0.49, 0.5),
      new THREE.Vector2(0.37, 1.5), new THREE.Vector2(0.31, 2.7),
      new THREE.Vector2(0.24, 3.7), new THREE.Vector2(0.13, 5.2),
    ], 18);
    geometries.add(trunkGeo);
    const trunk = mesh(group, trunkGeo, bark, [0, 0, 0], [1, 1, 1]);
    trunk.rotation.z = (random() - 0.5) * 0.08;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      beam(group, [0, 0.55, 0], [Math.cos(a) * 1.05, 0.05, Math.sin(a) * 1.05], 0.16, bark);
      beam(group, [0, 2.7, 0], [Math.cos(a) * 1.7, 4.7, Math.sin(a) * 1.7], 0.14, bark);
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      const upper = i > 4;
      mesh(group, sphere, leafMats[i % 4], [Math.cos(a) * (upper ? 0.9 : 1.8), upper ? 6.3 : 4.9 + random() * 0.7, Math.sin(a) * 1.7],
        [1.9 + random() * 0.5, 1.3 + random() * 0.5, 1.9 + random() * 0.5]);
    }
    // Layered leaf cards break the spherical masses into a painted, feathered
    // canopy. They are fixed in 3D and keep their depth as the camera orbits.
    for (let i = 0; i < 30; i++) {
      const a = i / 10 * TAU + random() * 0.4;
      const ring = Math.floor(i / 10);
      const r = ring === 2 ? 1.1 : 2.5;
      mesh(group, boughGeo, boughMat, [Math.sin(a) * r, 4.45 + ring * 0.79 + random() * 0.3, Math.cos(a) * r],
        [2.5 + random() * 0.5, 2 + random() * 0.4, 1], [ring === 2 ? -0.55 : 0.15, a, (random() - 0.5) * 0.25]);
    }
    if (Math.abs(x) < 24 && Math.abs(z) < 25) obstacles.push({ x, z, radius: size * 0.48 });
  }
  // Composed foreground trees frame the entrance; a forest closes the horizon.
  [[-8, 13, 1.3], [9, 14, 1.25], [-16, -2, 1.35], [21, 7, 1.2], [-17, -15, 1.1], [9, -19, 1.1], [-7, -23, 1.3], [22, -16, 1.25], [-17, 16, 1.1]].forEach(([x, z, s]) => tree(x, z, s));
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const r = 29 + random() * 13;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x - riverCenter(z)) > 4) tree(x, z, 0.8 + random() * 0.65);
  }

  // Low rope fences guide the eye without obstructing the main paths.
  function fence(points) {
    points.forEach(([x, z], i) => {
      mesh(staticWorld, cylinder, wood, [x, 0.57, z], [0.085, 1.14, 0.085]);
      mesh(staticWorld, sphere, lightWood, [x, 1.15, z], [0.115, 0.08, 0.115]);
      if (i) {
        const [lastX, lastZ] = points[i - 1];
        const mid = [(lastX + x) / 2, 0.72, (lastZ + z) / 2];
        beam(staticWorld, [lastX, 0.95, lastZ], mid, 0.026, lightWood);
        beam(staticWorld, mid, [x, 0.95, z], 0.026, lightWood);
        beam(staticWorld, [lastX, 0.55, lastZ], [x, 0.55, z], 0.025, lightWood);
        obstacles.push({ x: (lastX + x) / 2, z: (lastZ + z) / 2,
          width: Math.hypot(x - lastX, z - lastZ), depth: 0.06,
          rotation: Math.atan2(lastZ - z, x - lastX) });
      }
    });
  }
  fence([[-4.4, 18], [-4.8, 15], [-5.1, 12], [-4.5, 9]]);
  fence([[4, 16], [4.7, 13], [5.3, 10], [6.2, 7.5]]);
  fence([[-10.5, -2.7], [-8.5, -1.8], [-6.5, -1.3]]);

  // A stone well, with a winch, hanging bucket and tiled canopy.
  const well = new THREE.Group();
  well.position.set(-2, 0, -4.5);
  staticWorld.add(well);
  const ringGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.8, 12, 1, true);
  geometries.add(ringGeo);
  mesh(well, ringGeo, stone, [0, 0.45, 0]);
  const lipGeo = new THREE.TorusGeometry(0.91, 0.14, 5, 12);
  geometries.add(lipGeo);
  mesh(well, lipGeo, stoneLight, [0, 0.91, 0], null, [Math.PI / 2, 0, 0]);
  mesh(well, cylinder, glass, [0, 0.18, 0], [0.85, 0.05, 0.85]);
  for (const x of [-1.03, 1.03]) beam(well, [x, 0, 0], [x, 2.7, 0], 0.09);
  beam(well, [-1.15, 1.95, 0], [1.15, 1.95, 0], 0.1);
  beam(well, [0.2, 1.95, 0], [0.2, 0.5, 0], 0.018, lightWood);
  mesh(well, cylinder, wood, [0.2, 0.61, 0], [0.2, 0.3, 0.2]);
  for (const side of [-1, 1]) mesh(well, box, roofBlue, [side * 0.66, 2.67, 0], [1.6, 0.15, 2.25], [0, 0, side * -0.38]);
  obstacles.push({ id: "well", x: -2, z: -4.5, radius: 1.1 });

  // Village sign and a bench on the riverbank.
  const signGroup = new THREE.Group();
  signGroup.position.set(2.5, 0, 1.3);
  staticWorld.add(signGroup);
  beam(signGroup, [2.8, 0, 9], [2.8, 1.85, 9], 0.085);
  mesh(signGroup, box, wood, [2.8, 1.6, 9], [1.35, 0.62, 0.13]);
  mesh(signGroup, box, trim, [2.8, 1.6, 9.075], [1.19, 0.46, 0.02]);
  mesh(signGroup, box, leafMats[0], [2.8, 1.6, 9.092], [0.68, 0.055, 0.01]);
  pot(signGroup, 3.28, 0, 9.1, 0.42);
  obstacles.push({ id: "sign", x: 5.3, z: 10.3, radius: 0.35 });
  mesh(staticWorld, box, lightWood, [8.1, 0.53, 0.4], [2.1, 0.16, 0.7]);
  mesh(staticWorld, box, wood, [8.1, 1.02, 0.08], [2.1, 0.52, 0.12]);
  for (const x of [7.3, 8.9]) for (const z of [0.15, 0.65]) beam(staticWorld, [x, 0, z], [x, 0.55, z], 0.075);
  obstacles.push({ x: 8.1, z: 0.4, width: 2.1, depth: 0.7 });

  // The walkable bridge spans both banks, with raised wooden rails.
  for (let i = 0; i < 25; i++) {
    const x = 8.6 + i * 0.38;
    const arch = Math.sin((i / 24) * Math.PI) * 0.22;
    mesh(staticWorld, box, i % 3 ? lightWood : wood, [x, 0.09 + arch, -3], [0.36, 0.16, 2.3]);
  }
  for (const z of [-4.2, -1.8]) {
    for (let i = 0; i < 6; i++) {
      const x = 8.5 + i * 1.9;
      mesh(staticWorld, box, wood, [x, 0.65, z], [0.14, 1.3, 0.14]);
      if (i) beam(staticWorld, [x - 1.9, 1.13, z], [x, 1.13, z], 0.055);
    }
  }

  // Small stones, fern clusters, and a hand-built campsite in the far grove.
  for (let i = 0; i < 80; i++) {
    const z = -27 + random() * 53;
    const side = i % 2 ? -1 : 1;
    const x = riverCenter(z) + side * (2.65 + random() * 0.6);
    const s = 0.18 + random() * 0.4;
    mesh(staticWorld, sphere, i % 2 ? stone : stoneLight, [x, s * 0.23, z], [s, s * 0.6, s * 0.8]);
  }
  for (let i = 0; i < 35; i++) {
    const x = -20 + random() * 42;
    const z = -23 + random() * 42;
    if (Math.abs(x) < 5 || Math.abs(x - riverCenter(z)) < 3 || !isWalkable(x, z, obstacles)) continue;
    for (let j = 0; j < 7; j++) {
      const a = j / 7 * TAU;
      const leaf = mesh(staticWorld, sphere, leafMats[j % 2], [x + Math.sin(a) * 0.27, 0.3, z + Math.cos(a) * 0.27], [0.1, 0.5, 0.11]);
      leaf.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7);
    }
  }

  // Static meshes are merged by material: a village's worth of detail can be
  // drawn in a few dozen calls, rather than thousands of individual objects.
  staticWorld.updateMatrixWorld(true);
  const batches = new Map();
  staticWorld.traverse((object) => {
    if (!object.isMesh) return;
    const geo = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geo.applyMatrix4(object.matrixWorld);
    if (!batches.has(object.material)) batches.set(object.material, []);
    batches.get(object.material).push(geo);
  });
  for (const [mat, parts] of batches) {
    const geometry = mergeGeometries(parts, false);
    const combined = new THREE.Mesh(geometry, mat);
    combined.castShadow = true;
    combined.receiveShadow = true;
    scene.add(combined);
    geometries.add(geometry);
    parts.forEach((part) => part.dispose());
  }
  return { obstacles, geometries, cameraTrees };
}

function buildMeadow(scene, material, obstacles, random, art) {
  const dummy = new THREE.Object3D();
  const geometries = [];
  const grassGeo = new THREE.BufferGeometry();
  grassGeo.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, -0.5, 1, 0, 0.5, 0, 0, 0.5, 1, 0,
    0, 0, -0.5, 0, 0, 0.5, 0, 1, -0.5, 0, 1, -0.5, 0, 0, 0.5, 0, 1, 0.5,
  ], 3));
  grassGeo.setAttribute("uv", new THREE.Float32BufferAttribute([
    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
  ], 2));
  grassGeo.computeVertexNormals();
  const grassMat = material("grass", "#ffffff");
  grassMat.map = art.grassTuft;
  grassMat.alphaTest = 0.4;
  grassMat.alphaToCoverage = true;
  grassMat.side = THREE.DoubleSide;
  const wind = { value: 0 };
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = wind;
    shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed.x += sin(uWindTime * 1.5 + instanceMatrix[3].x * 0.4 + instanceMatrix[3].z * 0.3) * position.y * 0.19;",
    );
  };
  const grassPositions = [];
  for (let i = 0; i < 15000; i++) {
    const x = -28 + random() * 56;
    const z = -30 + random() * 57;
    const pathX = Math.sin(z * 0.15) * 1.4;
    if (Math.abs(x - pathX) < 2.3 || Math.hypot(x + 0.5, z + 2) < 5.5 ||
      (z > -4.6 && z < -1.4 && x > -10) ||
      (x < -5 && x > -15 && z > 4 && z < 9) || !isWalkable(x, z, obstacles)) continue;
    grassPositions.push([x, z]);
    if (grassPositions.length === 2200) break;
  }
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, grassPositions.length);
  grassPositions.forEach(([x, z], i) => {
    dummy.position.set(x, terrainHeight(x, z), z);
    dummy.rotation.set(0, random() * TAU, 0);
    dummy.scale.setScalar(0.38 + random() * 0.52);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(i, new THREE.Color().setHSL(0.21 + random() * 0.03, 0.12, 0.78 + random() * 0.15));
  });
  scene.add(grass);
  geometries.push(grassGeo);
  const flowerGeo = new THREE.SphereGeometry(1, 5, 3);
  geometries.push(flowerGeo);
  const flowers = new THREE.InstancedMesh(flowerGeo, material("meadow-flowers", "#fff3c2"), 420);
  for (let i = 0; i < 420; i++) {
    const [x, z] = grassPositions[Math.floor(random() * grassPositions.length)];
    dummy.position.set(x, terrainHeight(x, z) + 0.26 + random() * 0.16, z);
    dummy.rotation.set(0, random() * TAU, 0);
    dummy.scale.set(0.075, 0.045, 0.075);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, new THREE.Color(["#fff2c0", "#e8c4a8", "#eee8c9", "#c2bee1"][i % 4]));
  }
  scene.add(flowers);
  for (const [key, texture, number, size] of [["fern-cards", art.fern, 100, 1.3], ["flower-cards", art.flowers, 100, 0.62]]) {
    const mat = material(key, "#f7f4d7");
    mat.map = texture;
    mat.side = THREE.DoubleSide;
    mat.alphaTest = 0.35;
    mat.alphaToCoverage = true;
    const plants = new THREE.InstancedMesh(grassGeo, mat, number);
    for (let i = 0; i < number; i++) {
      const [x, z] = grassPositions[Math.floor(random() * grassPositions.length)];
      const scale = size * (0.65 + random() * 0.5);
      dummy.position.set(x, terrainHeight(x, z), z);
      dummy.rotation.set(0, random() * TAU, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      plants.setMatrixAt(i, dummy.matrix);
    }
    plants.receiveShadow = true;
    scene.add(plants);
  }
  return { geometries, wind };
}

function makeWater() {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= 180; i++) {
    const z = -48 + i / 180 * 96;
    const center = riverCenter(z);
    positions.push(center - 2.28, -0.07, z, center + 2.28, -0.07, z);
    if (i < 180) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 vWorld; void main() { vWorld = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float time;
      varying vec3 vWorld;
      void main() {
        float center = 13.5 + sin(vWorld.z * 0.13) * 1.6;
        float edge = abs(vWorld.x - center) / 2.28;
        vec3 color = mix(vec3(0.21, 0.58, 0.62), vec3(0.49, 0.76, 0.68), pow(edge, 2.0));
        float wave = sin(vWorld.z * 12.0 + time * 1.5 + sin(vWorld.x * 6.0 + time) * 0.7);
        float streak = smoothstep(0.97, 1.0, wave) * smoothstep(0.1, 0.9, sin(vWorld.x * 10.0 + vWorld.z * 0.5));
        color = mix(color, vec3(0.85, 0.94, 0.81), streak * 0.6);
        color += smoothstep(0.91, 0.98, edge) * 0.18;
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

export async function createGamerWorld(host, { onReady, onUpdate, onInteract, onError }) {
  const art = await loadArtAssets();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute("aria-label", "Asterfall village. Use WASD or arrow keys to explore, drag to turn the camera, and E to interact.");
  renderer.domElement.setAttribute("tabindex", "0");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#bad4d0");
  scene.fog = new THREE.Fog("#bad4d0", 32, 78);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.15, 130);
  const random = seededRandom();
  const materials = new Map();
  const gradient = new THREE.DataTexture(new Uint8Array([88, 165, 240]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  const material = (key, color) => {
    if (!materials.has(key)) {
      const mat = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
      const texture = {
        wood: art.wood, "dark-wood": art.wood, "light-wood": art.wood,
        plaster: art.plaster, "roof-red": art.roof, "roof-red-light": art.roof,
        "roof-blue": art.roof, "roof-blue-light": art.roof,
        stone: art.stone, "stone-light": art.stone,
      }[key];
      if (texture) {
        mat.map = texture;
        mat.color.set(key.includes("blue") ? "#7798ab" : key === "dark-wood" ? "#83786b" : "#f4eedb");
      }
      materials.set(key, mat);
    }
    return materials.get(key);
  };
  scene.add(new THREE.HemisphereLight("#e4edf4", "#a89b92", 1.25));
  const sun = new THREE.DirectionalLight("#ffefd1", 2.1);
  sun.position.set(-16, 27, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -27;
  sun.shadow.camera.right = sun.shadow.camera.top = 27;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 85;
  sun.shadow.normalBias = 0.06;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 3;
  sun.target.position.set(0, 0, -3);
  scene.add(sun, sun.target);

  const groundGeometry = new THREE.PlaneGeometry(96, 96, 192, 192);
  groundGeometry.rotateX(-Math.PI / 2);
  const vertices = groundGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    const bank = Math.abs(x - riverCenter(z));
    const y = bank < 2.3 ? -0.45 : terrainHeight(x, z);
    vertices.setY(i, y);
  }
  groundGeometry.computeVertexNormals();
  const groundTexture = makeGroundTexture(random);
  const groundMaterial = material("ground", "#ffffff");
  groundMaterial.map = groundTexture;
  groundMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.paintedMeadow = { value: art.grass };
    shader.uniforms.paintedEarth = { value: art.earth };
    shader.uniforms.paintedPaving = { value: art.stone };
    shader.vertexShader = `varying vec2 vGroundWorld;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>", "#include <begin_vertex>\nvGroundWorld = (modelMatrix * vec4(position, 1.0)).xz;",
    );
    shader.fragmentShader = `varying vec2 vGroundWorld; uniform sampler2D paintedMeadow; uniform sampler2D paintedEarth; uniform sampler2D paintedPaving;\n${shader.fragmentShader}`.replace(
      "#include <map_fragment>", `#include <map_fragment>
        float pathMix = smoothstep(-0.08, 0.015, diffuseColor.r - diffuseColor.g);
        vec3 meadow = texture2D(paintedMeadow, vGroundWorld / 5.5).rgb;
        vec3 earth = texture2D(paintedEarth, vGroundWorld / 4.0).rgb;
        vec3 paving = texture2D(paintedPaving, vGroundWorld / 4.5).rgb;
        float squareMix = 1.0 - smoothstep(3.6, 5.2, length((vGroundWorld - vec2(-0.5, -2.0)) * vec2(1.0, 1.15)));
        diffuseColor.rgb = mix(mix(meadow, earth, pathMix), paving, squareMix * pathMix);
      `,
    );
  };
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  scene.add(ground);
  const water = makeWater();
  scene.add(water);
  const { obstacles, geometries, cameraTrees } = buildVillage(scene, material, random, art);
  const sceneryObstacles = [...obstacles];
  const liveLandmarks = LANDMARKS.map((item) => ({ ...item }));
  const meadow = buildMeadow(scene, material, obstacles, random, art);
  const player = createCharacter(material, "explorer", art);
  player.root.position.set(SPAWN.x, 0, SPAWN.z);
  scene.add(player.root);
  const npcItems = liveLandmarks.filter((item) => item.kind === "npc");
  const npcs = npcItems.map((item) => {
    const character = createCharacter(material, item.id, art);
    character.root.position.set(item.x, 0, item.z);
    character.root.rotation.y = item.id === "hana" ? 0.15 : -0.4;
    scene.add(character.root);
    obstacles.push({ id: item.id, x: item.x, z: item.z, radius: 0.42 });
    return character;
  });
  const cast = VILLAGE_CAST.map((item) => {
    const character = createCharacter(material, item.id, art);
    character.root.position.set(item.x, terrainHeight(item.x, item.z), item.z);
    character.root.rotation.y = item.rotation;
    scene.add(character.root);
    obstacles.push({ id: item.id, x: item.x, z: item.z, radius: item.id === "jiraiya" ? 0.6 : 0.42 });
    return character;
  });
  const villagers = [...npcItems.map((item) => ({ ...item, rotation: item.id === "hana" ? 0.15 : -0.4 })), ...VILLAGE_CAST].map(createVillager);
  const villagerModels = [...npcs, ...cast];
  const villagerColliders = villagers.map((actor) => obstacles.find((obstacle) => obstacle.id === actor.id));
  const hana = liveLandmarks.find((item) => item.id === "hana");
  // A little blue companion follows with its own springy gait.
  const companion = new THREE.Group();
  const companionGeometry = new THREE.SphereGeometry(1, 16, 10);
  const companionBody = new THREE.Mesh(companionGeometry, material("companion", "#a3c6be"));
  companionBody.castShadow = true;
  companionBody.receiveShadow = true;
  companionBody.scale.set(0.36, 0.32, 0.37);
  companion.add(companionBody);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(companionGeometry, material("companion", "#a3c6be"));
    ear.position.set(side * 0.23, 0.28, -0.04);
    ear.scale.set(0.09, 0.23, 0.12);
    ear.rotation.z = side * -0.5;
    companion.add(ear);
    const eye = new THREE.Mesh(companionGeometry, material("character-ink", "#2d3334"));
    eye.position.set(side * 0.12, 0.035, 0.33);
    eye.scale.set(0.025, 0.042, 0.015);
    companion.add(eye);
  }
  companion.position.set(SPAWN.x + 1, 0.4, SPAWN.z + 0.5);
  scene.add(companion);
  companion.visible = false;
  // Soft contact shadows anchor moving models even outside the sun's cascade.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowCtx = shadowCanvas.getContext("2d");
  const radial = shadowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  radial.addColorStop(0, "#243b3670");
  radial.addColorStop(1, "#243b3600");
  shadowCtx.fillStyle = radial;
  shadowCtx.fillRect(0, 0, 64, 64);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadowGeo = new THREE.PlaneGeometry(1.45, 1.2);
  const playerShadow = new THREE.Mesh(shadowGeo, shadowMaterial);
  playerShadow.rotation.x = -Math.PI / 2;
  scene.add(playerShadow);

  const berryGeo = new THREE.SphereGeometry(0.11, 9, 7);
  const leafGeo = new THREE.SphereGeometry(1, 7, 5);
  const ringGeo = new THREE.TorusGeometry(0.47, 0.016, 4, 32);
  const berryMat = material("sunberries", "#efba54");
  const berryGroups = BERRIES.map((item) => {
    const group = new THREE.Group();
    group.position.set(item.x, 0, item.z);
    scene.add(group);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const leaf = new THREE.Mesh(leafGeo, material("berry-leaf", "#547b48"));
      leaf.position.set(Math.sin(a) * 0.25, 0.28, Math.cos(a) * 0.25);
      leaf.scale.set(0.17, 0.38, 0.13);
      leaf.rotation.z = -Math.sin(a) * 0.65;
      group.add(leaf);
      const berry = new THREE.Mesh(berryGeo, berryMat);
      berry.position.set(Math.sin(a) * 0.28, 0.5 + (i % 3) * 0.1, Math.cos(a) * 0.28);
      berry.castShadow = true;
      group.add(berry);
    }
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: "#ffe3a2", transparent: true, opacity: 0.7, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);
    return { id: item.id, group, ring };
  });
  const moteGeometry = new THREE.BufferGeometry();
  const motePositions = new Float32Array(70 * 3);
  for (let i = 0; i < 70; i++) {
    motePositions[i * 3] = random() * 44 - 22;
    motePositions[i * 3 + 1] = 0.6 + random() * 6;
    motePositions[i * 3 + 2] = random() * 46 - 24;
  }
  moteGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  const moteMaterial = new THREE.PointsMaterial({ color: "#fff1bc", size: 0.06, transparent: true, opacity: 0.7, depthWrite: false });
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  scene.add(motes);

  const keys = new Set();
  let collected = [];
  let paused = false;
  let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let quality = "high";
  let destination = null;
  let touchInput = { x: 0, y: 0 };
  let sprint = false;
  let disposed = false;
  let frame = 0;
  let lastTime = performance.now();
  let elapsed = 0;
  let lastPublish = 0;
  let pointer = null;
  let lastTarget = null;
  const orbit = { ...DEFAULT_CAMERA };
  const follow = new THREE.Vector3(SPAWN.x, 1.25, SPAWN.z);
  const desiredCamera = new THREE.Vector3();
  const followTarget = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const cameraHit = new THREE.Vector3();
  const cameraBuildings = HOUSES.map((house) => new THREE.Box3(
    new THREE.Vector3(house.x - house.width / 2 - 0.5, 0, house.z - house.depth / 2 - 0.5),
    new THREE.Vector3(house.x + house.width / 2 + 0.5, house.height + house.width * 0.42, house.z + house.depth / 2 + 0.5),
  ));
  const move = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  const desiredVelocity = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const cursor = new THREE.Vector2();
  const clickRing = new THREE.Mesh(
    new THREE.RingGeometry(0.23, 0.29, 32),
    new THREE.MeshBasicMaterial({ color: "#fff3c4", transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }),
  );
  clickRing.rotation.x = -Math.PI / 2;
  clickRing.visible = false;
  scene.add(clickRing);
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  function project(item) {
    projected.set(item.x, item.markerHeight || (item.kind === "npc" ? 2.8 : 1.15), item.z).project(camera);
    return { x: (projected.x * 0.5 + 0.5) * 100, y: (-projected.y * 0.5 + 0.5) * 100, visible: projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 0.93 && Math.abs(projected.y) < 0.86 };
  }
  function interact() {
    if (paused) return;
    const nearest = nearestInteraction(player.root.position, collected, obstacles, liveLandmarks);
    if (nearest) {
      destination = null;
      velocity.set(0, 0, 0);
      onInteract(nearest);
    }
  }
  function clearInput() {
    keys.clear();
    touchInput = { x: 0, y: 0 };
    sprint = false;
    destination = null;
    pointer = null;
    velocity.set(0, 0, 0);
  }
  function keyDown(event) {
    if (event.target instanceof HTMLElement && event.target.closest("input, select, textarea, [role='dialog']")) return;
    if (event.code === "Space" && event.target instanceof HTMLElement && event.target.closest("button, a")) return;
    const handled = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyE", "KeyC", "ShiftLeft", "ShiftRight"];
    if (!handled.includes(event.code) || paused) return;
    event.preventDefault();
    keys.add(event.code);
    if (!event.repeat && (event.code === "KeyE" || event.code === "Space")) interact();
    if (event.code === "KeyC") Object.assign(orbit, DEFAULT_CAMERA);
    if (event.code.startsWith("Arrow") || ["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) destination = null;
  }
  function keyUp(event) { keys.delete(event.code); }
  function pointerDown(event) {
    if (paused || (event.button !== 0 && event.button !== 2)) return;
    renderer.domElement.focus({ preventScroll: true });
    renderer.domElement.setPointerCapture(event.pointerId);
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, dragged: false };
  }
  function pointerMove(event) {
    if (!pointer || pointer.id !== event.pointerId || paused) return;
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 5) pointer.dragged = true;
    if (pointer.dragged) {
      orbit.yaw -= (event.clientX - pointer.x) * 0.006;
      orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + (event.clientY - pointer.y) * 0.004, 0.2, 1.05);
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }
  function pointerUp(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const wasDrag = pointer.dragged;
    pointer = null;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    if (wasDrag || paused) return;
    const bounds = host.getBoundingClientRect();
    cursor.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(cursor, camera);
    const hit = raycaster.intersectObject(ground)[0];
    if (hit && isWalkable(hit.point.x, hit.point.z, obstacles)) {
      destination = { x: hit.point.x, z: hit.point.z };
      clickRing.position.set(destination.x, terrainHeight(destination.x, destination.z) + 0.04, destination.z);
    }
  }
  function wheel(event) {
    if (paused) return;
    event.preventDefault();
    orbit.distance = THREE.MathUtils.clamp(orbit.distance + event.deltaY * 0.009, 5, 20);
  }
  function contextMenu(event) { event.preventDefault(); }
  function contextLost(event) {
    event.preventDefault();
    clearInput();
    onError("The 3D view was interrupted. Reload the village to continue.");
  }
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearInput);
  document.addEventListener("visibilitychange", clearInput);
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", clearInput);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("contextmenu", contextMenu);
  canvas.addEventListener("webglcontextlost", contextLost);

  function animate(now) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.04);
    lastTime = now;
    if (document.hidden) return;
    if (!paused) elapsed += dt;
    const position = player.root.position;
    move.set(0, 0, 0);
    let isSprinting = false;
    const previousX = position.x;
    const previousZ = position.z;
    const previousHeading = player.root.rotation.y;
    if (!paused) {
      let horizontal = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")) + touchInput.x;
      let vertical = Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp")) + touchInput.y;
      if (horizontal || vertical) {
        destination = null;
        move.set(horizontal * Math.cos(orbit.yaw) + vertical * Math.sin(orbit.yaw), 0,
          -horizontal * Math.sin(orbit.yaw) + vertical * Math.cos(orbit.yaw));
      } else if (destination) {
        move.set(destination.x - position.x, 0, destination.z - position.z);
        if (move.length() < 0.18) { destination = null; move.set(0, 0, 0); }
      }
      const magnitude = Math.min(1, move.length());
      isSprinting = sprint || keys.has("ShiftLeft") || keys.has("ShiftRight");
      const approach = destination ? Math.min(1, Math.hypot(destination.x - position.x, destination.z - position.z) / 0.65) : 1;
      desiredVelocity.copy(move).normalize().multiplyScalar((isSprinting ? 3.8 : 2.3) * magnitude * approach);
      velocity.lerp(desiredVelocity, 1 - Math.exp(-dt * (magnitude ? 8 : 15)));
      if (velocity.lengthSq() < 0.0004) velocity.set(0, 0, 0);
      move.copy(velocity).multiplyScalar(dt);
      if (isWalkable(position.x + move.x, position.z, obstacles)) position.x += move.x;
      else velocity.x = 0;
      if (isWalkable(position.x, position.z + move.z, obstacles)) position.z += move.z;
      else velocity.z = 0;
      if (Math.hypot(position.x - previousX, position.z - previousZ) > 0.0001) {
        const angle = Math.atan2(position.x - previousX, position.z - previousZ);
        player.root.rotation.y += angleDelta(player.root.rotation.y, angle) * (1 - Math.exp(-dt * 11));
      } else if (magnitude) {
        destination = null;
      }
      position.y = terrainHeight(position.x, position.z);
      if (Math.abs(position.z + 3) < 1.15 && position.x > 8.5 && position.x < 18) position.y = 0.19 + Math.sin((position.x - 8.6) / 9.12 * Math.PI) * 0.22;
    }
    const distance = Math.hypot(position.x - previousX, position.z - previousZ);
    const speed = distance / Math.max(dt, 0.0001);
    const moving = speed > 0.03;
    player.animate(elapsed, { dt: paused ? 0 : dt, distance, speed,
      turnRate: angleDelta(previousHeading, player.root.rotation.y) / Math.max(dt, 0.0001), reducedMotion });
    updateVillagers(villagers, dt, elapsed, position, sceneryObstacles, paused);
    villagers.forEach((actor, i) => {
      const model = villagerModels[i];
      model.root.position.set(actor.x, actor.y, actor.z);
      model.root.rotation.y = actor.heading;
      model.animate(elapsed + i * 2.3, { dt: paused ? 0 : dt, distance: actor.distance,
        speed: actor.distance / Math.max(dt, 0.0001), turnRate: actor.turnRate,
        lookYaw: actor.lookYaw, greeting: actor.greeting, reducedMotion });
      villagerColliders[i].x = actor.x;
      villagerColliders[i].z = actor.z;
      const landmark = liveLandmarks.find((item) => item.id === actor.id);
      if (landmark) { landmark.x = actor.x; landmark.z = actor.z; }
    });
    const followDistance = companion.position.distanceTo(position);
    if (!paused && followDistance > 1.1) {
      const dx = position.x - companion.position.x;
      const dz = position.z - companion.position.z;
      const blend = 1 - Math.exp(-dt * 3);
      const nextX = companion.position.x + dx * blend;
      const nextZ = companion.position.z + dz * blend;
      if (isWalkable(nextX, nextZ, obstacles) || followDistance > 5) {
        companion.position.x = nextX;
        companion.position.z = nextZ;
      }
      companion.rotation.y = Math.atan2(dx, dz);
    }
    companion.position.y = position.y + 0.36 + (reducedMotion ? 0 : Math.abs(Math.sin(elapsed * (moving ? 7 : 2))) * (moving ? 0.18 : 0.035));
    playerShadow.position.set(position.x, position.y + 0.025, position.z);
    followTarget.set(position.x, position.y + 1.25, position.z);
    follow.lerp(followTarget, reducedMotion ? 1 : 1 - Math.exp(-dt * 5));
    desiredCamera.set(
      follow.x + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance,
      follow.y + Math.sin(orbit.pitch) * orbit.distance,
      follow.z + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance,
    );
    // Pull the orbit camera forward when scenery would obscure the hero.
    cameraDirection.copy(desiredCamera).sub(follow).normalize();
    raycaster.set(follow, cameraDirection);
    let safeDistance = orbit.distance;
    for (const bounds of cameraBuildings) {
      const hit = raycaster.ray.intersectBox(bounds, cameraHit);
      if (hit) safeDistance = Math.min(safeDistance, Math.max(2, follow.distanceTo(hit) - 0.4));
    }
    for (const canopy of cameraTrees) {
      const hit = raycaster.ray.intersectSphere(canopy, cameraHit);
      if (hit) safeDistance = Math.min(safeDistance, Math.max(2.3, follow.distanceTo(hit) - 0.7));
    }
    if (safeDistance < orbit.distance) desiredCamera.copy(follow).addScaledVector(raycaster.ray.direction, safeDistance);
    camera.position.copy(desiredCamera);
    camera.lookAt(follow);
    water.material.uniforms.time.value = elapsed;
    meadow.wind.value = reducedMotion ? 0 : elapsed;
    motes.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.035) * 0.08;
    berryGroups.forEach(({ ring, group }, i) => {
      ring.scale.setScalar(1 + Math.sin(elapsed * 2 + i) * 0.08);
      ring.material.opacity = 0.55 + Math.sin(elapsed * 2 + i) * 0.2;
      group.visible = !collected.includes(BERRIES[i].id);
    });
    clickRing.visible = !!destination;
    if (destination) clickRing.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.12);
    if (now - lastPublish > 80) {
      lastPublish = now;
      const target = nearestInteraction(position, collected, obstacles, liveLandmarks);
      lastTarget = target;
      onUpdate({
        x: position.x, z: position.z, heading: player.root.rotation.y, yaw: orbit.yaw,
        moving, sprinting: isSprinting && moving, target,
        marker: target ? project(target) : project(hana),
        hanaDistance: Math.hypot(position.x - hana.x, position.z - hana.z),
        hana: { x: hana.x, z: hana.z },
        motion: { speed, ...player.getPoseSnapshot() },
        villagers: villagers.map((actor, i) => ({ id: actor.id, x: actor.x, z: actor.z, mode: actor.mode, visits: actor.visits, ...villagerModels[i].getPoseSnapshot() })),
        castMarkers: VILLAGE_CAST.map((item, i) => {
          const actor = villagers[npcs.length + i];
          return { ...item, ...project({ ...item, x: actor.x, z: actor.z, kind: "npc" }) };
        }),
      });
    }
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(animate);
  onReady();
  return {
    interact,
    setPaused(value) { paused = value; clearInput(); },
    setCollected(value) { collected = value; },
    setTouchInput(x, y) { touchInput = { x, y }; destination = null; },
    setSprint(value) { sprint = value; },
    resetCamera() { Object.assign(orbit, DEFAULT_CAMERA); },
    setReducedMotion(value) { reducedMotion = value; },
    setQuality(value) {
      quality = value;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "high" ? 1.75 : 1));
      renderer.shadowMap.enabled = quality === "high";
      scene.traverse((object) => {
        if (object.material) {
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          mats.forEach((mat) => { mat.needsUpdate = true; });
        }
      });
      resize();
    },
    getSnapshot() {
      return { x: player.root.position.x, z: player.root.position.z, target: lastTarget?.id || null, collected: [...collected], drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearInput);
      document.removeEventListener("visibilitychange", clearInput);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", clearInput);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("contextmenu", contextMenu);
      canvas.removeEventListener("webglcontextlost", contextLost);
      player.dispose();
      npcs.forEach((npc) => npc.dispose());
      cast.forEach((npc) => npc.dispose());
      const allGeometries = new Set([...geometries, ...meadow.geometries, groundGeometry, companionGeometry, shadowGeo, berryGeo, leafGeo, ringGeo, moteGeometry, water.geometry, clickRing.geometry]);
      allGeometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());
      berryGroups.forEach(({ ring }) => ring.material.dispose());
      [water.material, shadowMaterial, moteMaterial, clickRing.material].forEach((mat) => mat.dispose());
      [gradient, groundTexture, shadowTexture].forEach((texture) => texture.dispose());
      art.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
