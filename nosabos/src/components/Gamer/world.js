import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createCharacter } from "./characters.js";
import { createPaintedSky } from "./atmosphere.js";
import { loadArtAssets } from "./artAssets.js";
import { VILLAGE_CAST } from "./cast.js";
import { angleDelta } from "./motion.js";
import { createVillager, updateVillagers } from "./villagers.js";
import {
  BERRIES, HOUSES, LANDMARKS, SPAWN, isWalkable, nearestInteraction,
  riverCenter, terrainHeight,
} from "./gameData.js";

const TAU = Math.PI * 2;
const DEFAULT_CAMERA = { yaw: -0.24, pitch: 0.39, distance: 13.6 };

function seededRandom(seed = 4729) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Exact cubic Bezier evaluator for the main south avenue: (0,-2) -> (-3,10) -> (2,15) -> (1,33).
function southRoadPoint(u) {
  const m = 1 - u;
  const x = 3 * m * m * u * -3 + 3 * m * u * u * 2 + u * u * u * 1;
  const z = m * m * m * -2 + 3 * m * m * u * 10 + 3 * m * u * u * 15 + u * u * u * 33;
  const dx = 3 * m * m * -3 + 6 * m * u * 5 + 3 * u * u * -1;
  const dz = 3 * m * m * 12 + 6 * m * u * 5 + 3 * u * u * 18;
  const len = Math.hypot(dx, dz) || 1;
  return { x, z, tx: dx / len, tz: dz / len, nx: dz / len, nz: -dx / len, angle: Math.atan2(dx, dz) };
}

// Geometric road & plaza check so grass tufts never sprout on cobblestones or dirt roads.
function isRoadOrPlaza(x, z, margin = 0) {
  // Central cobblestone square and wishing well court
  if (Math.hypot((x + 0.5) * 0.92, (z + 2.0) * 1.05) < 5.75 + margin) return true;
  // Main south road along exact Bezier curve
  if (z >= -2.5 - margin && z <= 33.5 + margin) {
    const u = Math.max(0, Math.min(1, (z + 2) / 35));
    const pt = southRoadPoint(u);
    if (Math.hypot(x - pt.x, z - pt.z) < 2.35 + margin) return true;
  }
  // North village road (z: -33 to -2)
  if (z > -33.5 - margin && z < -1.5 + margin) {
    const roadCenterX = Math.sin(z * 0.14) * 0.75;
    if (Math.abs(x - roadCenterX) < 2.25 + margin) return true;
  }
  // East road to bridge and across river (x: -1 to 23, z around -2.6)
  if (x > -1.5 - margin && x < 23.5 + margin) {
    const roadCenterZ = x < 6 ? -2.0 - (x / 6) * 0.8 : -2.85;
    if (Math.abs(z - roadCenterZ) < 1.85 + margin) return true;
  }
  // West path toward northwest cottage (-12, 4.2)
  if (x > -13.8 - margin && x < 0.5 + margin) {
    const t = Math.max(0, Math.min(1, -x / 13));
    const roadCenterZ = -2.0 + t * 9.5;
    if (Math.abs(z - roadCenterZ) < 1.75 + margin) return true;
  }
  // Southwest path toward southwest cottage (-8.5, -7.5)
  if (x > -9.2 - margin && x < 0.5 + margin) {
    const t = Math.max(0, Math.min(1, -x / 8.5));
    const roadCenterZ = -2.0 - t * 2.4;
    if (Math.abs(z - roadCenterZ) < 1.75 + margin) return true;
  }
  // Cottage front door aprons
  for (const house of HOUSES) {
    if (Math.hypot(x - house.x, z - house.z) < Math.max(house.width, house.depth) * 0.68 + margin) return true;
  }
  return false;
}

function makeGroundTexture(random) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  const px = (value) => ((value + 48) / 96) * canvas.width;
  // Vibrant Tales-of-Symphonia sunlit meadow green base
  ctx.fillStyle = "#6ca048";
  ctx.fillRect(0, 0, 1536, 1536);

  // Lush overlapping painterly washes: warm chartreuse sunlit patches & cool emerald forest shade
  for (let i = 0; i < 1800; i++) {
    const x = random() * 1536;
    const y = random() * 1536;
    const radius = 18 + random() * 72;
    const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
    wash.addColorStop(0, ["#9ec45866", "#3a783b4a", "#bde06c48", "#50893f44"][i % 4]);
    wash.addColorStop(1, "#6ca04800");
    ctx.fillStyle = wash;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // Soft ground-contact shade under cottages and trees
  for (const house of HOUSES) {
    const hx = px(house.x);
    const hz = px(house.z);
    const r = ((house.width + house.depth) * 0.55 / 96) * canvas.width;
    const ao = ctx.createRadialGradient(hx, hz, r * 0.2, hx, hz, r * 1.35);
    ao.addColorStop(0, "#31582d68");
    ao.addColorStop(1, "#31582d00");
    ctx.fillStyle = ao;
    ctx.beginPath();
    ctx.arc(hx, hz, r * 1.35, 0, TAU);
    ctx.fill();
  }

  // Sandy riverbank shallows along the river channel
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 96; i++) {
    const z = -48 + i;
    const x = riverCenter(z);
    if (i === 0) ctx.moveTo(px(x), px(z));
    else ctx.lineTo(px(x), px(z));
  }
  ctx.lineCap = "round";
  ctx.strokeStyle = "#8ca863";
  ctx.lineWidth = 104;
  ctx.stroke();
  ctx.strokeStyle = "#c9be8e";
  ctx.lineWidth = 84;
  ctx.stroke();
  ctx.restore();

  function path(draw, width) {
    ctx.beginPath();
    draw();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Grass-to-earth transition verge
    ctx.strokeStyle = "#9ab064";
    ctx.lineWidth = width + 26;
    ctx.stroke();
    // Warm compacted earth border
    ctx.strokeStyle = "#bfa876";
    ctx.lineWidth = width + 10;
    ctx.stroke();
    // Main sunlit sandy-ochre roadbed
    ctx.strokeStyle = "#dfd09e";
    ctx.lineWidth = width;
    ctx.stroke();
    // Subtle wagon/footpath rut lines
    ctx.strokeStyle = "#cfb982";
    ctx.lineWidth = width * 0.72;
    ctx.stroke();
    // Bright sunlit center crown
    ctx.strokeStyle = "#ece0b4";
    ctx.lineWidth = width * 0.44;
    ctx.stroke();
  }

  path(() => {
    ctx.moveTo(px(1), px(33));
    ctx.bezierCurveTo(px(2), px(15), px(-3), px(10), px(0), px(-2));
    ctx.bezierCurveTo(px(2), px(-12), px(-2), px(-19), px(1), px(-32));
  }, 52);
  path(() => {
    ctx.moveTo(px(-13), px(8));
    ctx.bezierCurveTo(px(-9), px(7), px(-7), px(-2), px(0), px(-2));
    ctx.bezierCurveTo(px(6), px(-2), px(8), px(-3), px(23), px(-3));
  }, 42);
  path(() => {
    ctx.moveTo(px(-8), px(-4));
    ctx.quadraticCurveTo(px(-3), px(-2), px(0), px(-2));
  }, 44);

  // Hand-painted cobblestone village square at (-0.5, -2)
  const sqX = px(-0.5);
  const sqY = px(-2);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(sqX, sqY, 92, 81, 0, 0, TAU);
  ctx.fillStyle = "#b5a47d";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sqX, sqY, 85, 74, 0, 0, TAU);
  ctx.fillStyle = "#e3d6ad";
  ctx.fill();

  // Concentric cobblestone rings & radial paver joints in the town square
  ctx.strokeStyle = "#b8a78288";
  ctx.lineWidth = 2.2;
  for (const r of [22, 40, 58, 74]) {
    ctx.beginPath();
    ctx.ellipse(sqX, sqY, r * 1.12, r, 0, 0, TAU);
    ctx.stroke();
    const stones = Math.round(r * 0.48);
    for (let s = 0; s < stones; s++) {
      const a = (s / stones) * TAU + (r % 3) * 0.2;
      ctx.beginPath();
      ctx.moveTo(sqX + Math.cos(a) * (r - 8) * 1.12, sqY + Math.sin(a) * (r - 8));
      ctx.lineTo(sqX + Math.cos(a) * (r + 8) * 1.12, sqY + Math.sin(a) * (r + 8));
      ctx.stroke();
    }
  }
  // Ornate center sunburst medallion in the village square
  ctx.beginPath();
  ctx.arc(sqX, sqY, 18, 0, TAU);
  ctx.fillStyle = "#d2be92";
  ctx.fill();
  ctx.strokeStyle = "#9d8b66";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Fine painterly grain and tiny clover/pebble flecks
  for (let i = 0; i < 24000; i++) {
    ctx.fillStyle = i % 3 === 0 ? "#f6f0cf20" : i % 3 === 1 ? "#3e6b2c22" : "#8fc2521e";
    ctx.fillRect(random() * 1536, random() * 1536, 1 + random() * 3, 1 + random() * 2.5);
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
  const torus = new THREE.TorusGeometry(1, 0.24, 6, 14);
  [box, sphere, cylinder, cone, torus].forEach((geometry) => geometries.add(geometry));

  const wood = material("wood", "#6b543b");
  const darkWood = material("dark-wood", "#4a3d2c");
  const lightWood = material("light-wood", "#bc9b66");
  const ropeMat = material("rope-hemp", "#d4b982");
  const stone = material("stone", "#b4b39e");
  const stoneLight = material("stone-light", "#d6cfB4");
  const mossStone = material("stone-moss", "#899c72");
  const plaster = material("plaster", "#f5e6be");
  const roofRed = material("roof-red", "#bf5b3f");
  const roofRedLight = material("roof-red-light", "#d87752");
  const roofBlue = material("roof-blue", "#4b7682");
  const roofBlueLight = material("roof-blue-light", "#6d96a1");
  const glass = material("glass", "#6fa8b0");
  const warmWindow = material("warm-window", "#ffe49e");
  const trim = material("trim", "#fbf0c8");
  const lanternMetal = material("lantern-metal", "#3b4444");
  const lanternGlass = material("lantern-glass", "#ffe29a");
  const brass = material("brass", "#e0bc6e");

  // Lush 4-tier Tales-of-Symphonia foliage palette: deep teal-emerald shadow to sunlit chartreuse crown
  const leafMats = ["#3b6836", "#54873d", "#74a545", "#96bf50"].map((color, i) => material(`foliage-${i}`, color));
  leafMats.forEach((mat, index) => {
    mat.map = art.canopy;
    mat.color.set(["#84ab6c", "#9ec47c", "#b8da8a", "#d2ea98"][index]);
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
        #ifdef USE_MAP
          vec4 foliage = texture2D(map, vMapUv * vec2(2.0, 1.5));
          diffuseColor.rgb *= mix(vec3(0.36, 0.54, 0.16), foliage.rgb, 0.42);
        #endif
      `);
    };
  });
  const boughMat = material("painted-leaf-bough", "#eef5c4");
  boughMat.map = art.bough;
  boughMat.alphaTest = 0.42;
  boughMat.side = THREE.DoubleSide;
  boughMat.alphaToCoverage = true;
  const boughGeo = new THREE.PlaneGeometry(1, 1, 2, 2);
  geometries.add(boughGeo);
  const bark = material("painted-bark", "#dfd2ba");
  bark.map = art.bark;

  // Sculpted, billowing cloud-like foliage dome geometry
  const crownGeo = new THREE.SphereGeometry(1, 20, 14);
  const crownPoints = crownGeo.attributes.position;
  for (let i = 0; i < crownPoints.count; i++) {
    const x = crownPoints.getX(i), y = crownPoints.getY(i), z = crownPoints.getZ(i);
    const puff = 1
      + Math.sin(x * 5.2 + z * 4.1) * 0.08
      + Math.cos(y * 6.0 - x * 4.5) * 0.06
      + (y > 0 ? 0.05 : -0.04);
    crownPoints.setXYZ(i, x * puff, y * puff, z * puff);
  }
  crownGeo.computeVertexNormals();
  geometries.add(crownGeo);

  function mesh(parent, geo, mat, position, scale, rotation, castShadow = true) {
    const item = new THREE.Mesh(geo, mat);
    item.position.set(...position);
    if (scale) item.scale.set(...scale);
    if (rotation) item.rotation.set(...rotation);
    item.castShadow = castShadow;
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
  function branch(parent, from, to, base, tip) {
    const geometry = new THREE.CylinderGeometry(tip, base, 1, 9);
    geometries.add(geometry);
    const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
    const item = mesh(parent, geometry, bark, start.clone().add(end).multiplyScalar(0.5).toArray(), [1, start.distanceTo(end), 1]);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return item;
  }
  function curvedLimb(parent, points, radii) {
    for (let i = 0; i < points.length - 1; i++) {
      branch(parent, points[i], points[i + 1], radii[i], radii[i + 1]);
    }
  }
  function pot(parent, x, y, z, size = 0.42) {
    mesh(parent, cylinder, roofRed, [x, y + size * 0.4, z], [size * 0.65, size * 0.8, size * 0.65]);
    mesh(parent, cylinder, roofRedLight, [x, y + size * 0.83, z], [size * 0.78, size * 0.15, size * 0.78]);
    mesh(parent, sphere, leafMats[1], [x, y + size * 0.96, z], [size * 0.62, size * 0.34, size * 0.62]);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * TAU;
      const head = [x + Math.cos(angle) * size * 0.38, y + size * (1.22 + (i % 2) * 0.16), z + Math.sin(angle) * size * 0.38];
      beam(parent, [x, y + size * 0.82, z], head, 0.018, leafMats[0]);
      mesh(parent, sphere, material(i % 2 ? "flower-pink" : "flower-gold", i % 2 ? "#f29c94" : "#f9d66c"), head, [size * 0.2, size * 0.14, size * 0.2]);
    }
  }
  function barrel(parent, x, y, z, scale = 1) {
    mesh(parent, cylinder, lightWood, [x, y + 0.42 * scale, z], [0.32 * scale, 0.84 * scale, 0.32 * scale]);
    mesh(parent, sphere, lightWood, [x, y + 0.42 * scale, z], [0.35 * scale, 0.42 * scale, 0.35 * scale]);
    for (const ringY of [0.18, 0.42, 0.66]) {
      mesh(parent, cylinder, lanternMetal, [x, y + ringY * scale, z], [0.355 * scale, 0.045 * scale, 0.355 * scale]);
    }
  }
  function bush(parent, x, z, size = 1, withFlowers = false) {
    const y = terrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    staticWorld.add(group);
    mesh(group, crownGeo, leafMats[0], [0, 0.28 * size, 0], [0.68 * size, 0.42 * size, 0.64 * size]);
    mesh(group, crownGeo, leafMats[1], [0.24 * size, 0.36 * size, 0.12 * size], [0.52 * size, 0.38 * size, 0.5 * size]);
    mesh(group, crownGeo, leafMats[2], [-0.2 * size, 0.38 * size, -0.1 * size], [0.5 * size, 0.36 * size, 0.48 * size]);
    mesh(group, crownGeo, leafMats[3], [0.02 * size, 0.52 * size, 0.04 * size], [0.44 * size, 0.3 * size, 0.42 * size]);
    if (withFlowers) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.4;
        mesh(group, sphere, material(i % 2 ? "flower-pink" : "flower-gold", i % 2 ? "#f29c94" : "#f9d66c"),
          [Math.cos(a) * 0.38 * size, (0.46 + (i % 2) * 0.1) * size, Math.sin(a) * 0.36 * size],
          [0.09 * size, 0.07 * size, 0.09 * size], null, false);
      }
    }
  }

  // Handcrafted Tales-of-Symphonia Half-Timbered Cottages
  for (const house of HOUSES) {
    const group = new THREE.Group();
    const { width: w, depth: d, height: h } = house;
    group.position.set(house.x, 0, house.z);
    group.rotation.y = house.rotation;
    staticWorld.add(group);

    // Dressed stone foundation plinth & quoins
    mesh(group, box, stone, [0, 0.22, 0], [w + 0.3, 0.44, d + 0.26]);
    mesh(group, box, stoneLight, [0, 0.45, 0], [w + 0.36, 0.08, d + 0.32]);
    for (let i = 0; i < Math.ceil(w / 0.55); i++) {
      const x = -w / 2 + 0.25 + i * 0.55;
      for (const zSide of [-1, 1]) {
        mesh(group, box, (i + (zSide > 0 ? 1 : 0)) % 2 ? stone : stoneLight,
          [x, 0.22, zSide * (d / 2 + 0.06)], [0.5, 0.36, 0.24]);
      }
    }
    // Corner stone quoins on lower wall
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        for (let q = 0; q < 4; q++) {
          mesh(group, box, q % 2 ? stoneLight : stone,
            [sx * (w / 2 + 0.03), 0.62 + q * 0.28, sz * (d / 2 + 0.03)],
            [q % 2 ? 0.28 : 0.2, 0.22, q % 2 ? 0.2 : 0.28]);
        }
      }
    }

    // Main lower plaster walls & overhanging upper story jetty
    const jettyY = h * 0.6;
    mesh(group, box, plaster, [0, jettyY * 0.5 + 0.22, 0], [w, jettyY, d]);
    mesh(group, box, plaster, [0, jettyY + (h - jettyY) * 0.5 + 0.22, 0], [w + 0.22, h - jettyY, d + 0.22]);

    // Carved wooden corbel brackets supporting the upper-story jetty overhang
    for (let i = 0; i < 5; i++) {
      const cx = (-w * 0.44) + (i / 4) * (w * 0.88);
      for (const zSide of [-1, 1]) {
        mesh(group, box, darkWood, [cx, jettyY + 0.14, zSide * (d / 2 + 0.08)], [0.16, 0.26, 0.24]);
        mesh(group, box, wood, [cx, jettyY - 0.04, zSide * (d / 2 + 0.04)], [0.13, 0.18, 0.16]);
      }
    }

    // Vertical & horizontal half-timber framing beams
    for (const x of [-w / 2 + 0.08, -w * 0.18, w * 0.18, w / 2 - 0.08]) {
      mesh(group, box, wood, [x, h / 2 + 0.22, d / 2 + 0.08], [0.16, h, 0.18]);
      mesh(group, box, wood, [x, h / 2 + 0.22, -d / 2 - 0.08], [0.16, h, 0.18]);
    }
    for (const y of [0.48, jettyY + 0.22, h + 0.22]) {
      const overhang = y > jettyY ? 0.26 : 0.08;
      mesh(group, box, darkWood, [0, y, d / 2 + overhang * 0.5], [w + overhang, 0.17, 0.18]);
      mesh(group, box, darkWood, [0, y, -d / 2 - overhang * 0.5], [w + overhang, 0.17, 0.18]);
      for (const side of [-1, 1]) {
        mesh(group, box, darkWood, [side * (w / 2 + overhang * 0.5), y, 0], [0.18, 0.17, d + overhang]);
      }
    }
    // Diagonal timber cross-braces on front, back, and sides
    for (const side of [-1, 1]) {
      beam(group, [side * (w * 0.22), jettyY + 0.26, d / 2 + 0.14], [side * (w * 0.47), h + 0.18, d / 2 + 0.14], 0.068, wood);
      beam(group, [side * (w * 0.22), jettyY + 0.26, -d / 2 - 0.14], [side * (w * 0.47), h + 0.18, -d / 2 - 0.14], 0.068, wood);
      for (const z of [-d / 2 + 0.1, 0, d / 2 - 0.1]) {
        mesh(group, box, wood, [side * (w / 2 + 0.08), h / 2 + 0.22, z], [0.16, h, 0.16]);
      }
      beam(group, [side * (w / 2 + 0.12), 0.52, -d * 0.42], [side * (w / 2 + 0.12), jettyY + 0.18, -d * 0.14], 0.068, wood);
      beam(group, [side * (w / 2 + 0.12), 0.52, d * 0.42], [side * (w / 2 + 0.12), jettyY + 0.18, d * 0.14], 0.068, wood);
      // Warm side mullioned windows
      mesh(group, box, darkWood, [side * (w / 2 + 0.12), 1.98, 0], [0.16, 1.38, 1.34]);
      mesh(group, box, glass, [side * (w / 2 + 0.2), 1.98, 0], [0.03, 1.12, 1.08]);
      mesh(group, box, warmWindow, [side * (w / 2 + 0.19), 1.98, 0], [0.02, 0.96, 0.92]);
      mesh(group, box, trim, [side * (w / 2 + 0.22), 1.98, 0], [0.03, 1.14, 0.055]);
      mesh(group, box, trim, [side * (w / 2 + 0.22), 1.98, 0], [0.03, 0.06, 1.1]);
      mesh(group, box, wood, [side * (w / 2 + 0.24), 1.26, 0], [0.24, 0.12, 1.48]);
    }

    // Gable wall & king-post truss framing
    const peak = w * 0.44;
    const shape = new THREE.Shape();
    shape.moveTo(-(w + 0.22) / 2, 0);
    shape.lineTo((w + 0.22) / 2, 0);
    shape.lineTo(0, peak);
    shape.closePath();
    const gable = new THREE.ExtrudeGeometry(shape, { depth: d + 0.22, bevelEnabled: false });
    geometries.add(gable);
    mesh(group, gable, plaster, [0, h + 0.22, -(d + 0.22) / 2]);
    for (const z of [-d / 2 - 0.14, d / 2 + 0.14]) {
      beam(group, [-w / 2 - 0.1, h + 0.22, z], [0, h + peak + 0.22, z], 0.085, darkWood);
      beam(group, [0, h + peak + 0.22, z], [w / 2 + 0.1, h + 0.22, z], 0.085, darkWood);
      beam(group, [0, h + 0.22, z], [0, h + peak + 0.18, z], 0.085, wood);
      beam(group, [-w * 0.24, h + 0.22, z], [0, h + peak * 0.62 + 0.22, z], 0.065, wood);
      beam(group, [w * 0.24, h + 0.22, z], [0, h + peak * 0.62 + 0.22, z], 0.065, wood);
    }

    // Layered roof slopes, exposed rafter tails, tile courses, ridge crest, & finials
    const roof = house.roof === "blue" ? roofBlue : roofRed;
    const roofLight = house.roof === "blue" ? roofBlueLight : roofRedLight;
    const roofAngle = Math.atan2(peak, w / 2);
    const slope = Math.hypot(w / 2 + 0.68, peak + 0.42);
    for (const side of [-1, 1]) {
      mesh(group, box, roof, [side * (w / 4 + 0.14), h + peak / 2 + 0.36, 0], [slope, 0.24, d + 1.32], [0, 0, side * -roofAngle]);
      // Carved wooden bargeboards at front and back gable overhangs
      for (const zEnd of [-d / 2 - 0.62, d / 2 + 0.62]) {
        mesh(group, box, darkWood, [side * (w / 4 + 0.14), h + peak / 2 + 0.32, zEnd], [slope + 0.08, 0.28, 0.12], [0, 0, side * -roofAngle]);
      }
      // Exposed wooden rafter tails under eaves
      for (let r = 0; r < 7; r++) {
        const rz = -d * 0.45 + (r / 6) * (d * 0.9);
        mesh(group, box, wood, [side * (w / 2 + 0.42), h + 0.12, rz], [0.45, 0.1, 0.1], [0, 0, side * -roofAngle]);
      }
      // Overlapping barrel tile courses
      for (let row = 0; row < 10; row++) {
        const t = 0.05 + (row / 9) * 0.95;
        const x = side * t * (w / 2 + 0.62);
        const y = h + peak + 0.54 - t * (peak + 0.4);
        mesh(group, box, row % 2 ? roof : roofLight, [x, y, 0], [0.09, 0.08, d + 1.38], [0, 0, side * -roofAngle]);
      }
    }
    // Roof ridge beam & turned wooden gable finials
    mesh(group, cylinder, roofLight, [0, h + peak + 0.54, 0], [0.16, d + 1.44, 0.16], [Math.PI / 2, 0, 0]);
    for (const zEnd of [-d / 2 - 0.66, d / 2 + 0.66]) {
      mesh(group, cylinder, darkWood, [0, h + peak + 0.72, zEnd], [0.07, 0.55, 0.07]);
      mesh(group, cone, lightWood, [0, h + peak + 1.04, zEnd], [0.14, 0.28, 0.14]);
    }

    // Charming gabled dormer window on the front roof slope
    const dormerX = w * 0.22;
    const dormerY = h + peak * 0.46;
    const dormerZ = d * 0.22;
    mesh(group, box, plaster, [dormerX, dormerY, dormerZ], [1.05, 0.95, 1.15]);
    mesh(group, box, darkWood, [dormerX, dormerY, dormerZ + 0.58], [1.12, 0.98, 0.08]);
    mesh(group, box, warmWindow, [dormerX, dormerY, dormerZ + 0.63], [0.68, 0.62, 0.04]);
    mesh(group, box, trim, [dormerX, dormerY, dormerZ + 0.66], [0.05, 0.65, 0.03]);
    mesh(group, box, trim, [dormerX, dormerY, dormerZ + 0.66], [0.7, 0.05, 0.03]);
    for (const s of [-1, 1]) {
      mesh(group, box, roofLight, [dormerX + s * 0.34, dormerY + 0.56, dormerZ + 0.08], [0.78, 0.12, 1.36], [0, 0, s * -0.52]);
    }

    // Coursed stone chimney with dual terracotta chimney pots
    const chimX = -w * 0.28, chimY = h + peak * 0.76, chimZ = -d * 0.22;
    mesh(group, box, stone, [chimX, chimY, chimZ], [0.68, 2.15, 0.72]);
    mesh(group, box, stoneLight, [chimX, chimY + 1.08, chimZ], [0.84, 0.18, 0.88]);
    for (const cxOff of [-0.16, 0.16]) {
      mesh(group, cylinder, roofRed, [chimX + cxOff, chimY + 1.32, chimZ], [0.12, 0.36, 0.12]);
    }

    // Covered timber entry porch over front door
    const porchY = 2.68;
    for (const side of [-1, 1]) {
      mesh(group, box, roof, [side * 0.58, porchY + 0.18, d / 2 + 0.52], [1.28, 0.14, 1.06], [0, 0, side * -0.36]);
      mesh(group, box, darkWood, [side * 0.86, 1.38, d / 2 + 0.22], [0.16, 2.52, 0.22]);
      beam(group, [side * 0.84, 1.75, d / 2 + 0.18], [side * 0.84, porchY - 0.05, d / 2 + 0.88], 0.065, wood);
      beam(group, [side * 0.84, porchY - 0.05, d / 2 + 0.12], [side * 0.84, porchY - 0.05, d / 2 + 0.92], 0.07, darkWood);
    }
    mesh(group, cylinder, roofLight, [0, porchY + 0.42, d / 2 + 0.52], [0.1, 1.12, 0.1], [Math.PI / 2, 0, 0]);

    // Front door, stepped stone threshold, shuttered windows, and flower boxes
    mesh(group, box, darkWood, [0, 1.42, d / 2 + 0.12], [1.2, 2.42, 0.16]);
    mesh(group, box, lightWood, [0, 1.38, d / 2 + 0.21], [0.96, 2.24, 0.05]);
    for (let i = -1; i <= 1; i++) mesh(group, box, wood, [i * 0.25, 1.37, d / 2 + 0.24], [0.03, 2.2, 0.025]);
    mesh(group, sphere, brass, [0.32, 1.3, d / 2 + 0.27], [0.06, 0.06, 0.045]);
    mesh(group, box, stone, [0, 0.16, d / 2 + 0.48], [1.85, 0.32, 0.85]);
    mesh(group, box, stoneLight, [0, 0.07, d / 2 + 0.72], [2.1, 0.14, 0.55]);

    for (const x of [-w * 0.31, w * 0.31]) {
      mesh(group, box, darkWood, [x, 1.85, d / 2 + 0.11], [1.28, 1.42, 0.14]);
      mesh(group, box, glass, [x, 1.87, d / 2 + 0.18], [1.02, 1.16, 0.045]);
      mesh(group, box, warmWindow, [x, 1.87, d / 2 + 0.17], [0.88, 1.0, 0.035]);
      mesh(group, box, trim, [x, 1.87, d / 2 + 0.215], [0.055, 1.18, 0.035]);
      mesh(group, box, trim, [x, 1.87, d / 2 + 0.215], [1.06, 0.06, 0.035]);
      for (const side of [-1, 1]) {
        const shutterMat = house.roof === "blue" ? roofBlue : leafMats[0];
        mesh(group, box, shutterMat, [x + side * 0.78, 1.84, d / 2 + 0.1], [0.28, 1.36, 0.1], [0, side * 0.24, 0]);
        for (let slat = 0; slat < 6; slat++) {
          mesh(group, box, wood, [x + side * 0.78, 1.35 + slat * 0.2, d / 2 + 0.16], [0.26, 0.035, 0.025]);
        }
      }
      mesh(group, box, wood, [x, 1.13, d / 2 + 0.33], [1.44, 0.26, 0.52]);
      for (let i = 0; i < 5; i++) {
        mesh(group, sphere, leafMats[1], [x - 0.5 + i * 0.25, 1.35, d / 2 + 0.33], [0.22, 0.19, 0.25]);
        mesh(group, sphere, material(i % 2 ? "window-flowers" : "flower-gold", i % 2 ? "#f29c94" : "#f9d66c"),
          [x - 0.5 + i * 0.25, 1.49, d / 2 + 0.41], [0.11, 0.095, 0.11]);
      }
    }

    // Circular attic rose window
    mesh(group, cylinder, darkWood, [0, h + peak * 0.46, d / 2 + 0.18], [0.46, 0.14, 0.46], [Math.PI / 2, 0, 0]);
    mesh(group, cylinder, warmWindow, [0, h + peak * 0.46, d / 2 + 0.25], [0.34, 0.03, 0.34], [Math.PI / 2, 0, 0]);
    mesh(group, box, trim, [0, h + peak * 0.46, d / 2 + 0.28], [0.045, 0.68, 0.03]);
    mesh(group, box, trim, [0, h + peak * 0.46, d / 2 + 0.28], [0.68, 0.045, 0.03]);

    // Potted flowers & oak water barrel tucked against the cottage walls
    pot(group, -1.12, 0, d / 2 + 0.58, 0.56);
    barrel(group, w / 2 - 0.45, 0, d / 2 + 0.38, 0.72);

    // Bracketed wrought-iron lantern & door strap hinges
    beam(group, [1.02, 2.72, d / 2 + 0.1], [1.02, 2.72, d / 2 + 0.62], 0.026, lanternMetal);
    beam(group, [1.02, 2.72, d / 2 + 0.56], [1.02, 2.5, d / 2 + 0.56], 0.018, lanternMetal);
    mesh(group, box, lanternGlass, [1.02, 2.32, d / 2 + 0.56], [0.22, 0.34, 0.22]);
    for (const y of [2.13, 2.51]) mesh(group, box, lanternMetal, [1.02, y, d / 2 + 0.56], [0.3, 0.055, 0.3]);
    for (const dx of [-0.11, 0.11]) for (const dz of [-0.11, 0.11]) {
      beam(group, [1.02 + dx, 2.14, d / 2 + 0.56 + dz], [1.02 + dx, 2.49, d / 2 + 0.56 + dz], 0.014, lanternMetal);
    }
    for (const y of [0.65, 2.05]) mesh(group, box, lanternMetal, [-0.34, y, d / 2 + 0.25], [0.3, 0.06, 0.02]);

    // Climbing ivy along the stone & timber corner
    for (let i = 0; i < 8; i++) {
      mesh(group, boughGeo, boughMat, [-w / 2 + 0.16 + Math.sin(i * 0.9) * 0.15, 0.5 + i * 0.41, d / 2 + 0.18],
        [0.7 + random() * 0.3, 0.8, 1], [0, 0, Math.sin(i) * 0.25], false);
    }

    if (house.z > 0) {
      // Striped market awning & produce stand beside the northwest cottage
      mesh(group, box, trim, [1.5, 2.38, d / 2 + 1], [2.75, 0.13, 1.85], [0.14, 0, 0]);
      for (let stripe = -2; stripe <= 2; stripe++) {
        mesh(group, box, roofRed, [1.5 + stripe * 0.5, 2.42, d / 2 + 1], [0.24, 0.08, 1.88], [0.14, 0, 0]);
      }
      for (const x of [0.25, 2.7]) beam(group, [x, 0, d / 2 + 1.7], [x, 2.5, d / 2 + 1.7], 0.06, darkWood);
      mesh(group, box, lightWood, [1.5, 0.57, d / 2 + 1], [2.6, 1.05, 0.8]);
      for (let i = 0; i < 9; i++) {
        mesh(group, sphere, i % 2 ? roofRed : material("produce", "#e0be4e"),
          [0.55 + (i % 5) * 0.4, 1.18, d / 2 + 0.9 + Math.floor(i / 5) * 0.3], [0.16, 0.15, 0.15]);
      }
      obstacles.push({ x: house.x + 1.5, z: house.z + d / 2 + 1, width: 2.6, depth: 0.85 });
    }
  }

  // Lush Tales-of-Symphonia Trees: gnarled root buttresses, curving boughs & billowing cel-shaded crowns
  function tree(x, z, size = 1) {
    const y = terrainHeight(x, z);
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(size);
    group.rotation.y = random() * TAU;
    staticWorld.add(group);
    cameraTrees.push(new THREE.Sphere(new THREE.Vector3(x, y + 5.7 * size, z), 3.1 * size));

    const trunkGeo = new THREE.LatheGeometry([
      new THREE.Vector2(0.74, -0.08),
      new THREE.Vector2(0.56, 0.45),
      new THREE.Vector2(0.42, 1.45),
      new THREE.Vector2(0.35, 2.65),
      new THREE.Vector2(0.28, 3.75),
      new THREE.Vector2(0.16, 5.15),
    ], 18);
    geometries.add(trunkGeo);
    const trunk = mesh(group, trunkGeo, bark, [0, 0, 0], [1, 1, 1]);
    trunk.rotation.z = (random() - 0.5) * 0.08;

    // 5 organic curved root buttresses gripping the earth + curving upper boughs
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + (random() - 0.5) * 0.22;
      const ca = Math.cos(a), sa = Math.sin(a);
      curvedLimb(group, [
        [ca * 0.28, 1.05, sa * 0.28],
        [ca * 0.72, 0.42, sa * 0.72],
        [ca * 1.28, -0.04, sa * 1.28],
      ], [0.24, 0.16, 0.06]);
      // Mossy stone nestled between roots
      if (i % 2 === 0) {
        const ra = a + 0.32;
        mesh(group, sphere, mossStone, [Math.cos(ra) * 0.78, 0.08, Math.sin(ra) * 0.78], [0.26, 0.16, 0.22]);
      }
      // Curving primary boughs ascending into the canopy
      const ba = a + 0.28;
      const bca = Math.cos(ba), bsa = Math.sin(ba);
      curvedLimb(group, [
        [bca * 0.18, 2.85, bsa * 0.18],
        [bca * 0.95, 3.85, bsa * 0.95],
        [bca * 1.78, 4.78, bsa * 1.78],
      ], [0.22, 0.15, 0.07]);
    }

    // 3 billowing tiers of cel-shaded foliage domes (cast cohesive canopy shadows!)
    for (let tier = 0; tier < 3; tier++) {
      const count = 8 - tier * 2;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + tier * 0.65;
        const radius = 1.82 - tier * 0.56;
        const matIndex = Math.min(3, tier + ((i % 2) ? 1 : 0));
        mesh(group, crownGeo, leafMats[matIndex],
          [Math.cos(a) * radius, 4.78 + tier * 0.88 + random() * 0.18, Math.sin(a) * radius],
          [1.62 - tier * 0.24, 1.04 - tier * 0.1, 1.52 - tier * 0.2],
          [0, a, 0],
          true);
      }
    }
    // Central sunlit crown apex dome
    mesh(group, crownGeo, leafMats[3], [0, 6.72, 0], [1.45, 0.96, 1.42], null, true);

    // Feathered outer leaf cards soften the silhouette without casting ring-speckle shadows
    for (let i = 0; i < 44; i++) {
      const ring = Math.floor(i / 15);
      const a = (i / 15) * TAU + ring * 0.35;
      const r = 2.35 - ring * 0.65;
      mesh(group, boughGeo, boughMat,
        [Math.sin(a) * r, 4.55 + ring * 0.92 + random() * 0.2, Math.cos(a) * r],
        [2.05 - ring * 0.2 + random() * 0.22, 1.82 - ring * 0.15, 1],
        [0.28, a, (random() - 0.5) * 0.24],
        false);
    }
    if (Math.abs(x) < 24 && Math.abs(z) < 25) obstacles.push({ x, z, radius: size * 0.48 });
  }

  // Composed foreground trees frame the village; dense forest ring closes the valley horizon
  [[-8, 13, 1.3], [9, 14, 1.25], [-16, -2, 1.35], [21, 7, 1.2], [-17, -15, 1.1], [9, -19, 1.1], [-7, -23, 1.3], [22, -16, 1.25], [-17, 16, 1.1]].forEach(([x, z, s]) => tree(x, z, s));
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const r = 29 + random() * 13;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x - riverCenter(z)) > 4) tree(x, z, 0.8 + random() * 0.65);
  }

  // Sculpted bushes & flowering hedgerows around cottages, trees, and fence posts
  [
    [-5.8, -5.2, 0.95, true], [-11.4, -6.2, 1.05, false], [-14.8, 2.8, 0.9, true],
    [-9.4, 6.6, 0.85, true], [-1.8, -14.2, 0.95, true], [5.8, -14.8, 1.0, false],
    [-5.2, 18.2, 0.9, true], [4.8, 16.4, 0.95, true], [-7.4, 11.8, 0.85, false],
    [8.2, 12.8, 0.9, true], [20.2, 5.4, 1.0, false], [21.2, -14.4, 0.95, true],
  ].forEach(([bx, bz, bs, flowers]) => bush(staticWorld, bx, bz, bs, flowers));

  // Tales-of-Symphonia Post-and-Rope Fences with rope-wrapped timber posts & smooth catenary sag
  function fence(points) {
    points.forEach(([x, z], i) => {
      const y = terrainHeight(x, z);
      mesh(staticWorld, cylinder, wood, [x, y + 0.58, z], [0.105, 1.16, 0.105]);
      mesh(staticWorld, cylinder, darkWood, [x, y + 0.12, z], [0.125, 0.24, 0.125]);
      mesh(staticWorld, cone, lightWood, [x, y + 1.22, z], [0.13, 0.14, 0.13]);
      // Coiled hemp rope lashing around the post top
      for (const bandY of [0.92, 0.97, 1.02, 0.54, 0.59]) {
        mesh(staticWorld, torus, ropeMat, [x, y + bandY, z], [0.105, 0.105, 0.11], [Math.PI / 2, 0, 0]);
      }
      if (i) {
        const [lastX, lastZ] = points[i - 1];
        const lastY = terrainHeight(lastX, lastZ);
        const segs = 4;
        for (let s = 0; s < segs; s++) {
          const t0 = s / segs, t1 = (s + 1) / segs;
          const x0 = lastX + (x - lastX) * t0, z0 = lastZ + (z - lastZ) * t0;
          const x1 = lastX + (x - lastX) * t1, z1 = lastZ + (z - lastZ) * t1;
          const sag0 = Math.sin(t0 * Math.PI) * 0.16;
          const sag1 = Math.sin(t1 * Math.PI) * 0.16;
          const yBase0 = lastY + (y - lastY) * t0;
          const yBase1 = lastY + (y - lastY) * t1;
          beam(staticWorld, [x0, yBase0 + 0.97 - sag0, z0], [x1, yBase1 + 0.97 - sag1, z1], 0.032, ropeMat);
          beam(staticWorld, [x0, yBase0 + 0.56 - sag0 * 0.65, z0], [x1, yBase1 + 0.56 - sag1 * 0.65, z1], 0.028, ropeMat);
        }
        obstacles.push({
          x: (lastX + x) / 2,
          z: (lastZ + z) / 2,
          width: Math.hypot(x - lastX, z - lastZ),
          depth: 0.06,
          rotation: Math.atan2(lastZ - z, x - lastX),
        });
      }
    });
  }
  fence([[-4.4, 18], [-4.8, 15], [-5.1, 12], [-4.5, 9]]);
  fence([[4, 16], [4.7, 13], [5.3, 10], [6.2, 7.5]]);
  fence([[-10.5, -2.7], [-8.5, -1.8], [-6.5, -1.3]]);

  // Centerpiece Wishing Well Pavilion with stone base, carved timber frame, windlass, & tiled roof
  const well = new THREE.Group();
  well.position.set(-2, 0, -4.5);
  staticWorld.add(well);
  // Stepped circular cobblestone base apron
  mesh(well, cylinder, stoneLight, [0, 0.04, 0], [1.42, 0.08, 1.42]);
  mesh(well, cylinder, stone, [0, 0.09, 0], [1.2, 0.1, 1.2]);
  const ringGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.82, 14, 1, true);
  geometries.add(ringGeo);
  mesh(well, ringGeo, stone, [0, 0.48, 0]);
  for (let course = 0; course < 3; course++) {
    for (let i = 0; i < 12; i++) {
      const a = ((i + (course % 2) * 0.5) / 12) * TAU;
      const mat = (i + course) % 5 === 0 ? mossStone : (i + course) % 2 ? stoneLight : stone;
      mesh(well, box, mat,
        [Math.sin(a) * 0.96, 0.21 + course * 0.27, Math.cos(a) * 0.96], [0.48, 0.245, 0.24], [0, a, 0]);
    }
  }
  const lipGeo = new THREE.TorusGeometry(0.92, 0.15, 6, 16);
  geometries.add(lipGeo);
  mesh(well, lipGeo, stoneLight, [0, 0.94, 0], null, [Math.PI / 2, 0, 0]);
  mesh(well, cylinder, glass, [0, 0.24, 0], [0.85, 0.05, 0.85]);
  // Heavy timber support columns, stone plinth blocks, and diagonal knee braces
  for (const x of [-1.04, 1.04]) {
    mesh(well, box, stoneLight, [x, 0.2, 0], [0.28, 0.4, 0.28]);
    beam(well, [x, 0.2, 0], [x, 2.72, 0], 0.095, darkWood);
    beam(well, [x, 2.1, 0], [x * 0.55, 2.58, 0], 0.06, wood);
  }
  beam(well, [-1.18, 2.58, 0], [1.18, 2.58, 0], 0.09, darkWood);
  // Windlass spindle, rope coil, iron crank, & hanging oak bucket
  beam(well, [-1.04, 1.88, 0], [1.04, 1.88, 0], 0.075, wood);
  for (let c = -3; c <= 3; c++) {
    mesh(well, torus, ropeMat, [0.18 + c * 0.035, 1.88, 0], [0.095, 0.095, 0.12], [0, Math.PI / 2, 0]);
  }
  beam(well, [1.08, 1.88, 0], [1.08, 1.62, 0.22], 0.024, lanternMetal);
  beam(well, [1.08, 1.62, 0.22], [1.22, 1.62, 0.22], 0.024, lightWood);
  beam(well, [0.18, 1.88, 0], [0.18, 0.62, 0], 0.022, ropeMat);
  mesh(well, cylinder, wood, [0.18, 0.58, 0], [0.21, 0.32, 0.21]);
  mesh(well, cylinder, lanternMetal, [0.18, 0.66, 0], [0.22, 0.04, 0.22]);
  mesh(well, cylinder, lanternMetal, [0.18, 0.48, 0], [0.215, 0.04, 0.215]);
  // Pitched tiled canopy roof over well
  for (const side of [-1, 1]) {
    mesh(well, box, roofBlue, [side * 0.68, 2.74, 0], [1.66, 0.16, 2.35], [0, 0, side * -0.4]);
    for (let row = 0; row < 4; row++) {
      const t = 0.15 + (row / 3) * 0.8;
      mesh(well, box, row % 2 ? roofBlue : roofBlueLight,
        [side * t * 1.25, 3.08 - t * 0.52, 0], [0.08, 0.06, 2.4], [0, 0, side * -0.4]);
    }
  }
  mesh(well, cylinder, roofBlueLight, [0, 3.08, 0], [0.11, 2.42, 0.11], [Math.PI / 2, 0, 0]);
  obstacles.push({ id: "well", x: -2, z: -4.5, radius: 1.1 });

  // Dressed stone curb blocks & flush cobblestone edging around the town square and main roads
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * TAU;
    const x = -0.5 + Math.cos(a) * 5.15;
    const z = -2 + Math.sin(a) * 4.4;
    if (Math.abs(x) < 2.35 || Math.abs(z + 2.8) < 1.55 || (x < -3 && z > -1.2)) continue;
    mesh(staticWorld, box, i % 2 ? stone : stoneLight,
      [x, 0.055, z], [0.42, 0.11, 0.26], [0, -a + Math.PI / 2, 0]);
  }
  // Continuous dressed stone road curbs hugging the outer edges of the south entrance avenue
  for (let s = 0; s < 26; s++) {
    const u = 0.19 + (s / 25) * 0.42;
    const pt = southRoadPoint(u);
    for (const side of [-1, 1]) {
      const cx = pt.x + pt.nx * side * 2.18;
      const cz = pt.z + pt.nz * side * 2.18;
      mesh(staticWorld, box, (s + (side > 0 ? 1 : 0)) % 2 ? stoneLight : stone,
        [cx, terrainHeight(cx, cz) + 0.04, cz],
        [0.24, 0.08, 0.56], [0, pt.angle, 0]);
    }
  }

  // Ornate Village Signpost with pitched roof cap, hanging lantern, and flowerbed
  const signGroup = new THREE.Group();
  signGroup.position.set(2.5, 0, 1.3);
  staticWorld.add(signGroup);
  mesh(signGroup, box, stone, [2.8, 0.14, 9], [0.44, 0.28, 0.44]);
  beam(signGroup, [2.8, 0.14, 9], [2.8, 2.08, 9], 0.095, darkWood);
  mesh(signGroup, box, wood, [2.8, 1.6, 9], [1.42, 0.68, 0.14]);
  mesh(signGroup, box, trim, [2.8, 1.6, 9.078], [1.22, 0.48, 0.02]);
  for (const side of [-1, 1]) {
    mesh(signGroup, box, roofRed, [2.8 + side * 0.42, 2.02, 9], [0.92, 0.09, 0.36], [0, 0, side * -0.25]);
  }
  const signMaterial = material("village-lettering", "#ffffff");
  signMaterial.map = art.sign;
  const signGeometry = new THREE.PlaneGeometry(1.19, 0.46);
  geometries.add(signGeometry);
  mesh(signGroup, signGeometry, signMaterial, [2.8, 1.6, 9.094]);
  pot(signGroup, 3.32, 0, 9.1, 0.44);
  obstacles.push({ id: "sign", x: 5.3, z: 10.3, radius: 0.35 });

  // Scenic Riverbank Bench with stone armrests
  mesh(staticWorld, box, lightWood, [8.1, 0.53, 0.4], [2.1, 0.16, 0.7]);
  mesh(staticWorld, box, wood, [8.1, 1.02, 0.08], [2.1, 0.52, 0.12]);
  for (const x of [7.15, 9.05]) {
    mesh(staticWorld, box, stone, [x, 0.36, 0.4], [0.22, 0.72, 0.76]);
  }
  obstacles.push({ x: 8.1, z: 0.4, width: 2.1, depth: 0.7 });

  // Stone-&-Timber Arched Bridge with stone abutments, arch ribs, sturdy rails, & corner lanterns
  for (const [bx, bzSide] of [[8.45, -1], [8.45, 1], [17.95, -1], [17.95, 1]]) {
    const bz = -3 + bzSide * 1.28;
    mesh(staticWorld, box, stone, [bx, 0.42, bz], [0.68, 0.95, 0.52]);
    mesh(staticWorld, box, stoneLight, [bx, 0.94, bz], [0.76, 0.14, 0.58]);
    mesh(staticWorld, box, lanternMetal, [bx, 1.08, bz], [0.26, 0.14, 0.26]);
    mesh(staticWorld, box, lanternGlass, [bx, 1.28, bz], [0.2, 0.28, 0.2]);
    mesh(staticWorld, cone, lanternMetal, [bx, 1.48, bz], [0.22, 0.16, 0.22]);
  }
  for (let i = 0; i < 25; i++) {
    const x = 8.6 + i * 0.38;
    const arch = Math.sin((i / 24) * Math.PI) * 0.22;
    mesh(staticWorld, box, i % 3 ? lightWood : wood, [x, 0.09 + arch, -3], [0.36, 0.16, 2.38]);
    // Supporting timber arch beams beneath deck edges
    if (i < 24) {
      const nextX = 8.6 + (i + 1) * 0.38;
      const nextArch = Math.sin(((i + 1) / 24) * Math.PI) * 0.22;
      for (const zBeam of [-4.05, -1.95]) {
        beam(staticWorld, [x, arch - 0.04, zBeam], [nextX, nextArch - 0.04, zBeam], 0.08, darkWood);
      }
    }
  }
  for (const z of [-4.2, -1.8]) {
    for (let i = 0; i < 6; i++) {
      const x = 8.5 + i * 1.9;
      const arch = Math.sin((i / 5) * Math.PI) * 0.22;
      mesh(staticWorld, box, darkWood, [x, 0.68 + arch, z], [0.16, 1.32, 0.16]);
      mesh(staticWorld, box, lightWood, [x, 1.36 + arch, z], [0.2, 0.08, 0.2]);
      if (i) {
        const prevX = x - 1.9;
        const prevArch = Math.sin(((i - 1) / 5) * Math.PI) * 0.22;
        beam(staticWorld, [prevX, 1.18 + prevArch, z], [x, 1.18 + arch, z], 0.06, lightWood);
        beam(staticWorld, [prevX, 0.74 + prevArch, z], [x, 0.74 + arch, z], 0.05, wood);
      }
    }
  }

  // Waterfront Wooden Pier & Moored Rowboat (Homage to Tales of Symphonia Harbor)
  const pierZ = 8.8;
  const pierBankX = riverCenter(pierZ) - 2.25;
  const pierGroup = new THREE.Group();
  pierGroup.position.set(pierBankX, 0, pierZ);
  staticWorld.add(pierGroup);
  for (let i = 0; i < 8; i++) {
    const px = -0.5 + i * 0.34;
    mesh(pierGroup, box, i % 2 ? lightWood : wood, [px, 0.14, 0], [0.3, 0.11, 1.85]);
  }
  for (const pz of [-0.78, 0.78]) {
    beam(pierGroup, [-0.6, 0.06, pz], [1.95, 0.06, pz], 0.075, darkWood);
    for (const px of [-0.45, 0.65, 1.8]) {
      mesh(pierGroup, cylinder, darkWood, [px, -0.1, pz], [0.11, 0.95, 0.11]);
      mesh(pierGroup, cylinder, lightWood, [px, 0.4, pz], [0.125, 0.08, 0.125]);
      for (const ry of [0.26, 0.31]) {
        mesh(pierGroup, torus, ropeMat, [px, ry, pz], [0.11, 0.11, 0.12], [Math.PI / 2, 0, 0]);
      }
    }
  }
  // Moored wooden rowboat floating in the turquoise river beside the pier
  const boat = new THREE.Group();
  boat.position.set(2.35, -0.02, 0.25);
  boat.rotation.y = 0.18;
  pierGroup.add(boat);
  const hullGeo = new THREE.SphereGeometry(1, 16, 10, 0, TAU, Math.PI * 0.48, Math.PI * 0.52);
  geometries.add(hullGeo);
  mesh(boat, hullGeo, wood, [0, 0.22, 0], [0.58, 0.34, 1.38]);
  mesh(boat, torus, lightWood, [0, 0.21, 0], [0.56, 1.34, 0.35], [Math.PI / 2, 0, 0]);
  for (const bz of [-0.52, 0, 0.52]) {
    mesh(boat, box, lightWood, [0, 0.16, bz], [0.88 - Math.abs(bz) * 0.32, 0.06, 0.22]);
  }
  // Wooden oars resting across the gunwales & mooring line tied to the pier bollard
  beam(boat, [-0.28, 0.24, -0.45], [-0.48, 0.18, 0.65], 0.025, lightWood);
  beam(boat, [0.28, 0.24, -0.45], [0.48, 0.18, 0.65], 0.025, lightWood);
  beam(pierGroup, [1.8, 0.3, 0.78], [2.15, 0.18, 0.95], 0.024, ropeMat);

  // Riverbank boulders, mossy stones, and fern clusters
  for (let i = 0; i < 85; i++) {
    const z = -27 + random() * 53;
    if (Math.abs(z - pierZ) < 1.6 || Math.abs(z + 3) < 1.8) continue;
    const side = i % 2 ? -1 : 1;
    const x = riverCenter(z) + side * (2.55 + random() * 0.65);
    const s = 0.2 + random() * 0.42;
    const rockMat = i % 4 === 0 ? mossStone : i % 2 ? stone : stoneLight;
    mesh(staticWorld, sphere, rockMat, [x, s * 0.22, z], [s * 1.1, s * 0.62, s * 0.85], [0, random() * TAU, 0]);
  }
  for (let i = 0; i < 35; i++) {
    const x = -20 + random() * 42;
    const z = -23 + random() * 42;
    if (isRoadOrPlaza(x, z, 1.0) || Math.abs(x - riverCenter(z)) < 3 || !isWalkable(x, z, obstacles)) continue;
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * TAU;
      const leaf = mesh(staticWorld, sphere, leafMats[j % 2], [x + Math.sin(a) * 0.27, 0.3, z + Math.cos(a) * 0.27], [0.1, 0.5, 0.11]);
      leaf.rotation.set(Math.cos(a) * 0.7, 0, -Math.sin(a) * 0.7);
    }
  }

  // Merge static village meshes by material + shadow state for fast rendering
  staticWorld.updateMatrixWorld(true);
  const batches = new Map();
  staticWorld.traverse((object) => {
    if (!object.isMesh) return;
    const geo = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geo.applyMatrix4(object.matrixWorld);
    const key = `${object.material.id}-${object.castShadow}`;
    if (!batches.has(key)) batches.set(key, { mat: object.material, castsShadow: object.castShadow, parts: [] });
    batches.get(key).parts.push(geo);
  });
  for (const { mat, castsShadow, parts } of batches.values()) {
    const geometry = mergeGeometries(parts, false);
    const combined = new THREE.Mesh(geometry, mat);
    combined.castShadow = castsShadow;
    combined.receiveShadow = true;
    scene.add(combined);
    geometries.add(geometry);
    parts.forEach((part) => part.dispose());
  }
  return { obstacles, geometries, cameraTrees };
}

function buildMeadow(scene, material, obstacles, random, art, groundTexture) {
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
  grassMat.alphaTest = 0.42;
  grassMat.alphaToCoverage = true;
  grassMat.side = THREE.DoubleSide;
  const wind = { value: 0 };
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = wind;
    shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed.x += sin(uWindTime * 1.5 + instanceMatrix[3].x * 0.4 + instanceMatrix[3].z * 0.3) * position.y * 0.16;",
    );
  };
  const grassPositions = [];
  const groundCanvas = groundTexture.image;
  const pathPixels = groundCanvas.getContext("2d").getImageData(0, 0, groundCanvas.width, groundCanvas.height).data;
  const onPathPixel = (x, z) => {
    const px = Math.max(0, Math.min(groundCanvas.width - 1, Math.floor(((x + 48) / 96) * groundCanvas.width)));
    const py = Math.max(0, Math.min(groundCanvas.height - 1, Math.floor(((z + 48) / 96) * groundCanvas.height)));
    const offset = (py * groundCanvas.width + px) * 4;
    // Detect any warm ochre/sand/stone pixel where red approaches or exceeds green
    return pathPixels[offset] > pathPixels[offset + 1] - 8;
  };
  const onPath = (x, z, pad = 0) => isRoadOrPlaza(x, z, pad) || onPathPixel(x, z);

  for (let i = 0; i < 16000; i++) {
    const x = -28 + random() * 56;
    const z = -30 + random() * 57;
    if (onPath(x, z, 0.85) || Math.abs(x - riverCenter(z)) < 2.95 || !isWalkable(x, z, obstacles)) continue;
    const border = onPath(x, z, 1.55);
    const patch = Math.sin(x * 0.48 + Math.sin(z * 0.32)) * Math.cos(z * 0.39 - x * 0.12);
    if (!border && patch < -0.14 && random() < 0.86) continue;
    grassPositions.push([x, z, border]);
    if (grassPositions.length === 1900) break;
  }
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, grassPositions.length);
  grassPositions.forEach(([x, z, border], i) => {
    dummy.position.set(x, terrainHeight(x, z), z);
    dummy.rotation.set(0, random() * TAU, 0);
    dummy.scale.setScalar((border ? 0.34 : 0.28) + random() * 0.28);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    // Warm sunlit cel-shaded meadow greens instead of pale gray-white
    grass.setColorAt(i, new THREE.Color().setHSL(0.24 + random() * 0.04, 0.42, 0.66 + random() * 0.14));
  });
  scene.add(grass);
  grass.receiveShadow = true;
  geometries.push(grassGeo);

  const flowerGeo = new THREE.SphereGeometry(1, 6, 4);
  geometries.push(flowerGeo);
  const flowers = new THREE.InstancedMesh(flowerGeo, material("meadow-flowers", "#fff3c2"), 160);
  for (let i = 0; i < 160; i++) {
    const [x, z] = grassPositions[Math.floor(random() * grassPositions.length)];
    dummy.position.set(x, terrainHeight(x, z) + 0.22 + random() * 0.14, z);
    dummy.rotation.set(0, random() * TAU, 0);
    dummy.scale.set(0.08, 0.05, 0.08);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, new THREE.Color(["#ffe88a", "#f4a698", "#fff5d6", "#a8d0f0"][i % 4]));
  }
  scene.add(flowers);

  for (const [key, texture, number, size] of [["fern-cards", art.fern, 90, 0.88], ["flower-cards", art.flowers, 140, 0.58]]) {
    const mat = material(key, "#e8f2c2");
    mat.map = texture;
    mat.side = THREE.DoubleSide;
    mat.alphaTest = 0.38;
    mat.alphaToCoverage = true;
    const plants = new THREE.InstancedMesh(grassGeo, mat, number);
    for (let i = 0; i < number; i++) {
      const [x, z] = grassPositions[Math.floor(random() * grassPositions.length)];
      const scale = size * (0.62 + random() * 0.42);
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
    const z = -48 + (i / 180) * 96;
    const center = riverCenter(z);
    positions.push(center - 2.38, -0.06, z, center + 2.38, -0.06, z);
    if (i < 180) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { time: { value: 0 } }]),
    vertexShader: `varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vWorld = position;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float time;
      varying vec3 vWorld;
      #include <fog_pars_fragment>
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
      void main() {
        float center = 13.5 + sin(vWorld.z * 0.13) * 1.6;
        float edge = clamp(abs(vWorld.x - center) / 2.38, 0.0, 1.0);
        vec2 flow = vWorld.xz + vec2(sin(vWorld.z * 0.75 + time * 0.45) * 0.14, time * 0.28);
        float pools = noise(flow * 1.6) * 0.65 + noise(flow * 4.2) * 0.35;

        // Luminous Tales-of-Symphonia crystal turquoise & cerulean river palette
        vec3 deepChannel = mix(vec3(0.04, 0.44, 0.64), vec3(0.08, 0.58, 0.72), pools);
        vec3 shallowTurquoise = vec3(0.22, 0.76, 0.68);
        vec3 color = mix(deepChannel, shallowTurquoise, pow(edge, 2.1));

        // Crisp cel-shaded water caustics
        float caustic = abs(sin(flow.x * 8.5 + sin(flow.y * 5.5)) + sin(flow.y * 7.5 + sin(flow.x * 4.8)));
        float causticBand = 1.0 - smoothstep(0.06, 0.18, caustic);
        color += vec3(0.16, 0.28, 0.24) * causticBand * (0.35 + edge * 0.45);

        // Bright anime surface ripple streaks
        float wave = sin(flow.y * 16.0 + sin(flow.x * 6.5) * 0.75);
        float streak = smoothstep(0.955, 0.995, wave) * smoothstep(0.54, 0.76, noise(flow * vec2(8.0, 2.0)));
        color = mix(color, vec3(0.88, 0.98, 0.96), streak * 0.78);

        // Crisp white-aqua shoreline foam ribbon
        float shoreWave = edge + sin(vWorld.z * 7.5 + time * 1.6) * 0.012;
        float shoreFoam = smoothstep(0.91, 0.96, shoreWave);
        color = mix(color, vec3(0.86, 0.97, 0.92), shoreFoam * 0.82);

        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
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
  renderer.toneMappingExposure = 1.06;
  renderer.domElement.setAttribute("aria-label", "Asterfall village. Use WASD or arrow keys to explore, drag to turn the camera, and E to interact.");
  renderer.domElement.setAttribute("tabindex", "0");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#bce4f0");
  scene.fog = new THREE.Fog("#bce4f0", 38, 76);
  const sky = createPaintedSky();
  scene.add(sky);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.15, 130);
  const random = seededRandom();
  const materials = new Map();
  const gradient = new THREE.DataTexture(new Uint8Array([122, 178, 226, 255]), 4, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  const material = (key, color) => {
    if (!materials.has(key)) {
      const mat = new THREE.MeshToonMaterial({ color, gradientMap: gradient, name: key });
      const texture = {
        wood: art.wood, "dark-wood": art.wood, "light-wood": art.wood,
        plaster: art.plaster, "roof-red": art.roof, "roof-red-light": art.roof,
        "roof-blue": art.roof, "roof-blue-light": art.roof,
        stone: art.stone, "stone-light": art.stone,
      }[key];
      if (texture) {
        mat.map = texture;
        mat.color.set(key.includes("blue") ? "#7a9eb2" : key === "dark-wood" ? "#7e7162" : "#f7f0dc");
        if (key.includes("blue")) mat.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
            #ifdef USE_MAP
              vec3 tile = texture2D(map, vMapUv).rgb;
              float value = dot(tile, vec3(0.299, 0.587, 0.114));
              diffuseColor.rgb *= value * 1.82;
            #endif
          `);
        };
      }
      materials.set(key, mat);
    }
    return materials.get(key);
  };
  scene.add(new THREE.HemisphereLight("#e4f4ff", "#a8b682", 1.58));
  const sun = new THREE.DirectionalLight("#fff2d2", 1.92);
  sun.position.set(-16, 27, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -27;
  sun.shadow.camera.right = sun.shadow.camera.top = 27;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 85;
  sun.shadow.normalBias = 0.06;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 2.5;
  sun.target.position.set(0, 0, -3);
  scene.add(sun, sun.target);

  const groundGeometry = new THREE.PlaneGeometry(96, 96, 192, 192);
  groundGeometry.rotateX(-Math.PI / 2);
  const vertices = groundGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    const bank = Math.abs(x - riverCenter(z));
    const baseH = terrainHeight(x, z);
    const bankBlend = THREE.MathUtils.smoothstep(bank, 1.85, 2.55);
    const y = THREE.MathUtils.lerp(-0.48, baseH, bankBlend);
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
        vec3 meadow = mix(diffuseColor.rgb, texture2D(paintedMeadow, vGroundWorld / 3.8).rgb, 0.22);
        vec3 earth = mix(diffuseColor.rgb, texture2D(paintedEarth, vGroundWorld / 4.0).rgb, 0.48);
        vec3 paving = texture2D(paintedPaving, vGroundWorld / 4.2).rgb;
        float squareMix = 1.0 - smoothstep(3.8, 5.4, length((vGroundWorld - vec2(-0.5, -2.0)) * vec2(0.95, 1.12)));
        diffuseColor.rgb = mix(mix(meadow, earth, pathMix), mix(diffuseColor.rgb, paving * 1.08, 0.62), squareMix * pathMix * 0.88);
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
  const meadow = buildMeadow(scene, material, obstacles, random, art, groundTexture);
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
      let alignment = 1;
      if (magnitude) {
        const heading = Math.atan2(move.x, move.z);
        player.root.rotation.y += angleDelta(player.root.rotation.y, heading) * (1 - Math.exp(-dt * 12));
        // Plant and turn before accelerating into a reversal. Otherwise the
        // first steps slide backwards while the character is still facing us.
        alignment = Math.max(0, Math.cos(angleDelta(player.root.rotation.y, heading)));
      }
      desiredVelocity.copy(move).normalize().multiplyScalar((isSprinting ? 3.8 : 2.3) * magnitude * approach * alignment);
      velocity.lerp(desiredVelocity, 1 - Math.exp(-dt * (magnitude ? 8 : 15)));
      if (velocity.lengthSq() < 0.0004) velocity.set(0, 0, 0);
      move.copy(velocity).multiplyScalar(dt);
      if (isWalkable(position.x + move.x, position.z, obstacles)) position.x += move.x;
      else velocity.x = 0;
      if (isWalkable(position.x, position.z + move.z, obstacles)) position.z += move.z;
      else velocity.z = 0;
      if (magnitude && alignment > 0.95 && Math.hypot(position.x - previousX, position.z - previousZ) <= 0.0001) {
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
    sky.position.copy(camera.position);
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
      const allGeometries = new Set([...geometries, ...meadow.geometries, groundGeometry, companionGeometry, shadowGeo, berryGeo, leafGeo, ringGeo, moteGeometry, water.geometry, sky.geometry, clickRing.geometry]);
      allGeometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());
      berryGroups.forEach(({ ring }) => ring.material.dispose());
      [water.material, sky.material, shadowMaterial, moteMaterial, clickRing.material].forEach((mat) => mat.dispose());
      [gradient, groundTexture, shadowTexture].forEach((texture) => texture.dispose());
      art.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
