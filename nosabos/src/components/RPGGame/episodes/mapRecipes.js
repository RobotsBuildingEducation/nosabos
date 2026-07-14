// Episode maps are config, not art: a layout recipe + a world-blueprint tile
// theme + station placements. Everything renders through the existing
// worldGen tile library and pixelArt sprites — zero LLM, <1ms to build.

import { WORLD_BLUEPRINTS, buildDynamicTileLibrary } from "../worldGen";
import { mulberry32, seededShuffle } from "../content/terms";

const TILE = {
  GROUND: 0,
  PATH: 1,
  WALL: 2,
  BARRIER: 3,
  OBSTACLE: 4,
  DECOR: 5,
  FURNITURE: 6,
  FOOTPRINT: 7,
};

export function getBlueprint(blueprintId) {
  return (
    WORLD_BLUEPRINTS.find((entry) => entry.id === blueprintId) ||
    WORLD_BLUEPRINTS[0]
  );
}

function makeGrid(width, height, fill = TILE.GROUND) {
  return new Array(width * height).fill(fill);
}

function setTile(map, width, x, y, value) {
  if (x < 0 || y < 0 || x >= width) return;
  const idx = y * width + x;
  if (idx >= 0 && idx < map.length) map[idx] = value;
}

const cellKey = (x, y) => `${x},${y}`;

function fillRect(map, width, x, y, rectWidth, rectHeight, value) {
  for (let dy = 0; dy < rectHeight; dy++) {
    for (let dx = 0; dx < rectWidth; dx++) {
      setTile(map, width, x + dx, y + dy, value);
    }
  }
}

function protectRect(set, x, y, rectWidth, rectHeight) {
  for (let dy = 0; dy < rectHeight; dy++) {
    for (let dx = 0; dx < rectWidth; dx++) {
      set.add(cellKey(x + dx, y + dy));
    }
  }
}

function borderTiles(map, width, height, value) {
  for (let x = 0; x < width; x++) {
    setTile(map, width, x, 0, value);
    setTile(map, width, x, height - 1, value);
  }
  for (let y = 0; y < height; y++) {
    setTile(map, width, 0, y, value);
    setTile(map, width, width - 1, y, value);
  }
}

// ─── Layouts ─────────────────────────────────────────────────────────────────
function layoutRoom(width, height, rng) {
  const map = makeGrid(width, height);
  const protectedCells = new Set();
  borderTiles(map, width, height, TILE.WALL);
  const doorX = Math.floor(width / 2);
  setTile(map, width, doorX, height - 1, TILE.PATH);

  // A broad inset rug anchors the room, while patterned side bays make the
  // corners read as authored activity nooks instead of leftover empty tiles.
  const midY = Math.floor(height / 2);
  const rugWidth = Math.min(11, width - 6);
  const rugHeight = Math.min(5, height - 7);
  const rugX = Math.floor((width - rugWidth) / 2);
  const rugY = Math.max(3, midY - Math.floor(rugHeight / 2));
  fillRect(map, width, rugX, rugY, rugWidth, rugHeight, TILE.PATH);
  fillRect(map, width, rugX + 1, rugY + 1, rugWidth - 2, rugHeight - 2, TILE.PATH);

  // Built-in-looking floor insets behind the left and right furniture groups.
  fillRect(map, width, 2, 2, 4, 2, TILE.GROUND);
  fillRect(map, width, width - 6, 2, 4, 2, TILE.GROUND);
  setTile(map, width, 3, 3, TILE.GROUND);
  setTile(map, width, width - 4, 3, TILE.GROUND);

  // Two-tile entrance lane remains open even with dense furniture placement.
  for (let y = rugY + rugHeight - 1; y < height - 1; y++) {
    setTile(map, width, doorX, y, TILE.PATH);
    setTile(map, width, doorX - 1, y, TILE.PATH);
  }
  protectRect(protectedCells, doorX - 1, rugY + 1, 2, height - rugY - 2);
  protectRect(protectedCells, rugX + 1, midY, rugWidth - 2, 1);

  // A few balanced floor marks break repetition without procedural noise.
  const detailY = 2 + Math.floor(rng() * 2);
  setTile(map, width, 7, detailY, TILE.DECOR);
  setTile(map, width, width - 8, detailY, TILE.DECOR);
  return {
    map,
    playerStart: { x: doorX, y: height - 2 },
    protectedCells,
  };
}

function layoutPlaza(width, height, rng, blueprint) {
  const map = makeGrid(width, height);
  const protectedCells = new Set();
  borderTiles(map, width, height, TILE.BARRIER);
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);

  // A narrow promenade guides the eye without turning half of the map into a
  // flat cross. Neutral floor around it is intentional breathing room for
  // stalls, NPCs, and small prop stories.
  for (let x = 1; x < width - 1; x++) {
    setTile(map, width, x, midY, TILE.PATH);
  }
  for (let y = 1; y < height - 1; y++) {
    setTile(map, width, midX, y, TILE.PATH);
  }
  fillRect(map, width, midX - 1, midY - 1, 3, 3, TILE.PATH);
  setTile(map, width, midX - 1, midY - 1, TILE.DECOR);
  setTile(map, width, midX + 1, midY + 1, TILE.DECOR);

  // Two irregular, theme-sensitive pockets replace the repeated four-corner
  // stamp. Market produce, park flowers, and festival confetti become small
  // focal areas instead of a motif repeated under every prop.
  const upperPocket = { x: 3, y: blueprint?.id === "nature" ? 3 : 4 };
  const lowerPocket = { x: width - 5, y: height - 4 };
  const pockets = [
    { origin: upperPocket, offsets: [[0, 0], [1, 0], [0, 1]] },
    { origin: lowerPocket, offsets: [[0, 0], [1, 0], [1, -1]] },
  ];
  pockets.forEach(({ origin, offsets }, pocketIndex) => {
    offsets.forEach(([dx, dy]) => {
      setTile(map, width, origin.x + dx, origin.y + dy, TILE.DECOR);
    });
    if (blueprint?.id === "nature") {
      setTile(
        map,
        width,
        origin.x + (pocketIndex === 0 ? 1 : 0),
        origin.y,
        TILE.OBSTACLE,
      );
    }
  });

  protectRect(protectedCells, 1, midY, width - 2, 1);
  protectRect(protectedCells, midX, 1, 1, height - 2);

  // One seeded accent keeps repeat visits from being perfectly mirrored.
  const accentX = rng() < 0.5 ? 6 : width - 7;
  setTile(map, width, accentX, midY - 2, TILE.DECOR);
  return {
    map,
    playerStart: { x: midX, y: height - 2 },
    protectedCells,
  };
}

function layoutHall(width, height, rng) {
  const map = makeGrid(width, height);
  const protectedCells = new Set();
  borderTiles(map, width, height, TILE.WALL);
  const midX = Math.floor(width / 2);
  // A three-tile concourse, paired columns, and alternating side alcoves make
  // the long map read as architecture rather than an empty rectangle.
  fillRect(map, width, midX - 1, 1, 3, height - 2, TILE.PATH);
  for (let y = 3; y < height - 3; y += 4) {
    fillRect(map, width, 2, y - 1, 5, 3, TILE.GROUND);
    fillRect(map, width, width - 7, y - 1, 5, 3, TILE.GROUND);
    fillRect(map, width, 3, y, width - 6, 1, TILE.PATH);
    setTile(map, width, 6, y - 1, TILE.OBSTACLE);
    setTile(map, width, width - 7, y - 1, TILE.OBSTACLE);
    protectRect(protectedCells, 3, y, width - 6, 1);
  }
  fillRect(map, width, midX - 3, 1, 7, 3, TILE.PATH);
  fillRect(map, width, midX - 2, 2, 5, 1, TILE.PATH);
  setTile(map, width, midX, height - 1, TILE.PATH);
  protectRect(protectedCells, midX - 1, 1, 3, height - 1);

  const accentY = rng() < 0.5 ? 2 : height - 3;
  setTile(map, width, 2, accentY, TILE.DECOR);
  setTile(map, width, width - 3, accentY, TILE.DECOR);
  return {
    map,
    playerStart: { x: midX, y: height - 2 },
    protectedCells,
  };
}

const LAYOUTS = { room: layoutRoom, plaza: layoutPlaza, hall: layoutHall };

// ─── Placement ───────────────────────────────────────────────────────────────
function zoneCell(zone, width, height, slot, slotCount, rng) {
  const spread = (span, idx, count) =>
    Math.round(((idx + 1) / (count + 1)) * (span - 4)) + 2;
  if (zone === "top") return { x: spread(width, slot, slotCount), y: 2 };
  if (zone === "bottom") return { x: spread(width, slot, slotCount), y: height - 3 };
  if (zone === "left") return { x: 2, y: spread(height, slot, slotCount) };
  if (zone === "right") return { x: width - 3, y: spread(height, slot, slotCount) };
  return {
    x: Math.floor(width / 2) + Math.floor(rng() * 3) - 1,
    y: Math.floor(height / 2) + Math.floor(rng() * 3) - 1,
  };
}

function isWalkable(map, width, tileLibrary, x, y) {
  const value = map[y * width + x];
  const def = tileLibrary[value];
  return def ? !def.solid : false;
}

function collectWalkableCells(map, width, height, tileLibrary, exclude) {
  const cells = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!isWalkable(map, width, tileLibrary, x, y)) continue;
      if (exclude.has(`${x},${y}`)) continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

function collectReachableCells(
  map,
  width,
  height,
  tileLibrary,
  start,
  exclude,
) {
  const cells = [];
  const queue = [start];
  const visited = new Set([cellKey(start.x, start.y)]);
  while (queue.length) {
    const cell = queue.shift();
    if (
      isWalkable(map, width, tileLibrary, cell.x, cell.y) &&
      !exclude.has(cellKey(cell.x, cell.y))
    ) {
      cells.push(cell);
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cell.x + dx;
      const y = cell.y + dy;
      const key = cellKey(x, y);
      if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) continue;
      if (visited.has(key) || !isWalkable(map, width, tileLibrary, x, y)) continue;
      visited.add(key);
      queue.push({ x, y });
    }
  }
  return cells;
}

function distanceToZone(cell, zone, width, height) {
  if (zone === "top" || zone === "edge") return cell.y;
  if (zone === "bottom" || zone === "entrance") return height - 1 - cell.y;
  if (zone === "left") return cell.x;
  if (zone === "right") return width - 1 - cell.x;
  if (zone === "corner") {
    return Math.min(
      cell.x + cell.y,
      width - 1 - cell.x + cell.y,
      cell.x + height - 1 - cell.y,
      width - 1 - cell.x + height - 1 - cell.y,
    );
  }
  const cx = width / 2;
  const cy = height / 2;
  return Math.abs(cell.x - cx) + Math.abs(cell.y - cy);
}

const THEME_VIGNETTES = {
  home: [
    { anchor: "northWest", objects: [["bookshelf", 0, 0], ["lamp", 2, 1], ["plant", 3, 0]] },
    { anchor: "northEast", objects: [["tv", 0, 0], ["plant", -2, 0], ["lamp", -1, 2]] },
    { anchor: "southWest", objects: [["sofa", 0, 0], ["table", 2, 0], ["plant", 0, -2]] },
  ],
  market: [
    { anchor: "northWest", objects: [["fridge", 0, 0], ["shelf", 2, 0], ["stove", 3, 0]] },
    { anchor: "northEast", objects: [["freezer", 0, 0], ["plant", -2, 0]] },
    { anchor: "southWest", objects: [["table", 0, 0], ["plant", 2, 0]] },
    { anchor: "southEast", objects: [["table", 0, 0], ["plant", -2, 0], ["sign", 0, -2]] },
  ],
  library: [
    { anchor: "northWest", objects: [["bookshelf", 0, 0], ["bookshelf", 2, 0], ["plant", 4, 0]] },
    { anchor: "northEast", objects: [["bookshelf", 0, 0], ["lamp", -2, 1], ["desk", 0, 2]] },
    { anchor: "southWest", objects: [["table", 0, 0], ["lamp", 2, 0], ["plant", 0, -2]] },
  ],
  transit: [
    { anchor: "northWest", objects: [["counter", 0, 0], ["register", 2, 0], ["sign", 4, 0]] },
    { anchor: "west", objects: [["bench", 0, 0], ["bench", 0, 2], ["suitcaseStack", 2, 1]] },
    { anchor: "east", objects: [["bench", 0, 0], ["gate", 0, -2], ["sign", -2, 1]] },
  ],
  nature: [
    { anchor: "northWest", objects: [["tree", 0, 0], ["tree", 2, 1], ["plant", 0, 2]] },
    { anchor: "northEast", objects: [["tree", 0, 0], ["tree", -2, 1], ["plant", 0, 2]] },
    { anchor: "southWest", objects: [["bench", 0, 0], ["plant", 2, 0], ["sign", 0, -2]] },
  ],
  civic: [
    { anchor: "northWest", objects: [["bookshelf", 0, 0], ["desk", 2, 1], ["plant", 4, 0]] },
    { anchor: "northEast", objects: [["sign", 0, 0], ["lamp", -2, 1], ["desk", 0, 2]] },
    { anchor: "southWest", objects: [["bench", 0, 0], ["plant", 2, 0], ["lamp", 0, -2]] },
  ],
  lab: [
    { anchor: "northWest", objects: [["freezer", 0, 0], ["shelf", 2, 0], ["fridge", 4, 0]] },
    { anchor: "northEast", objects: [["desk", 0, 0], ["lamp", -2, 1], ["shelf", 0, 2]] },
    { anchor: "southWest", objects: [["table", 0, 0], ["plant", 2, 0], ["sign", 0, -2]] },
  ],
  festival: [
    { anchor: "northWest", objects: [["speaker", 0, 0], ["balloons", 2, 0], ["plant", 0, 2]] },
    { anchor: "northEast", objects: [["speaker", 0, 0], ["balloons", -2, 0], ["sign", 0, 2]] },
    { anchor: "southWest", objects: [["table", 0, 0], ["balloons", 2, 0], ["bench", 0, -2]] },
  ],
};

function getVignetteAnchor(anchor, width, height) {
  const midY = Math.floor(height / 2);
  const positions = {
    northWest: { x: 2, y: 2 },
    northEast: { x: width - 3, y: 2 },
    southWest: { x: 2, y: height - 3 },
    southEast: { x: width - 3, y: height - 3 },
    west: { x: 2, y: midY - 1 },
    east: { x: width - 3, y: midY - 1 },
  };
  return positions[anchor] || { x: Math.floor(width / 2), y: midY };
}

function nearestOpenCell({
  map,
  width,
  height,
  tileLibrary,
  occupied,
  protectedCells,
  target,
  maxRadius = 3,
  alignment = "any",
}) {
  let best = null;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const distance = Math.abs(x - target.x) + Math.abs(y - target.y);
      if (distance > maxRadius) continue;
      if (!isWalkable(map, width, tileLibrary, x, y)) continue;
      if (occupied.has(cellKey(x, y)) || protectedCells.has(cellKey(x, y))) continue;
      const alignmentPenalty =
        alignment === "horizontal"
          ? Math.abs(y - target.y) * 4
          : alignment === "vertical"
            ? Math.abs(x - target.x) * 4
            : 0;
      const score = distance + alignmentPenalty;
      if (!best || score < best.score) best = { x, y, distance, score };
    }
  }
  return best;
}

function placeBlueprintObjects({
  map,
  width,
  height,
  tileLibrary,
  blueprint,
  occupied,
  protectedCells,
  rng,
}) {
  const objects = [];
  const placeObject = (type, target, maxRadius = 3, alignment = "any") => {
    const cell = nearestOpenCell({
      map,
      width,
      height,
      tileLibrary,
      occupied,
      protectedCells,
      target,
      maxRadius,
      alignment,
    });
    if (!cell) return false;
    occupied.add(cellKey(cell.x, cell.y));
    setTile(map, width, cell.x, cell.y, TILE.FOOTPRINT);
    objects.push({
      id: `decor-${objects.length}-${type}`,
      type,
      tx: cell.x,
      ty: cell.y,
      decorative: true,
    });
    return true;
  };

  // Hand-composed object groups give each blueprint recognizable little
  // stories: a reading nook, a kitchen run, paired waiting benches, a grove.
  for (const vignette of THEME_VIGNETTES[blueprint.id] || []) {
    const anchor = getVignetteAnchor(vignette.anchor, width, height);
    const alignment =
      vignette.anchor.startsWith("north") || vignette.anchor.startsWith("south")
        ? "horizontal"
        : "vertical";
    for (const [type, dx, dy] of vignette.objects) {
      placeObject(type, { x: anchor.x + dx, y: anchor.y + dy }, 2, alignment);
    }
  }

  // Fill remaining breathing-room pockets from the blueprint palette. The
  // Target density is deliberately capped: detail reads best when authored
  // clusters are separated by a few calm, walkable floor tiles.
  const targetCount =
    blueprint.id === "market"
      ? 10
      : Math.max(9, Math.min(11, Math.floor((width * height) / 23)));
  const specs = seededShuffle(blueprint.suggestedObjects || [], rng);
  for (const spec of specs) {
    if (objects.length >= targetCount) break;
    const candidates = collectWalkableCells(
      map,
      width,
      height,
      tileLibrary,
      occupied,
    )
      .filter((cell) => {
        return !protectedCells.has(cellKey(cell.x, cell.y));
      })
      .sort((a, b) => {
        const zoneDelta =
          distanceToZone(a, spec.zone, width, height) -
          distanceToZone(b, spec.zone, width, height);
        return zoneDelta;
      });
    const cell = candidates[0];
    if (!cell) continue;
    placeObject(spec.type, cell, 0);
  }
  return objects;
}

/**
 * Build a playable world from an episode manifest.
 * Returns { mapWidth, mapHeight, map, tileLibrary, stations, npcSpots,
 *           itemSpawnCells, playerStart, blueprint }.
 */
export function buildEpisodeWorld(manifest, seed = 1) {
  const rng = mulberry32(seed);
  const width = manifest.map?.width || 20;
  const height = manifest.map?.height || 14;
  const blueprint = getBlueprint(manifest.map?.blueprint);
  const tileLibrary = buildDynamicTileLibrary({ tileTheme: blueprint.tileTheme });
  // Solid prop footprint that visually reuses the room's ground material.
  // This prevents every object from sitting on the same loud furniture/accent
  // tile while retaining collision and pathfinding behavior.
  tileLibrary[TILE.FOOTPRINT] = {
    ...tileLibrary[TILE.GROUND],
    name: "prop footprint",
    solid: true,
  };

  const layoutFn = LAYOUTS[manifest.map?.layout] || layoutPlaza;
  const { map, playerStart, protectedCells = new Set() } = layoutFn(
    width,
    height,
    rng,
    blueprint,
  );

  const occupied = new Set([`${playerStart.x},${playerStart.y}`]);

  const stationSpecs = manifest.map?.stations || [];
  const zoneCounts = {};
  stationSpecs.forEach((spec) => {
    zoneCounts[spec.zone] = (zoneCounts[spec.zone] || 0) + 1;
  });
  const zoneSlots = {};
  const stations = stationSpecs.map((spec) => {
    const slot = zoneSlots[spec.zone] || 0;
    zoneSlots[spec.zone] = slot + 1;
    const target = zoneCell(
      spec.zone,
      width,
      height,
      slot,
      zoneCounts[spec.zone],
      rng,
    );
    const cell = nearestOpenCell({
      map,
      width,
      height,
      tileLibrary,
      occupied,
      protectedCells,
      target,
      maxRadius: 5,
    }) || target;
    occupied.add(cellKey(cell.x, cell.y));
    setTile(map, width, cell.x, cell.y, TILE.FOOTPRINT);
    return { id: spec.id, type: spec.type, tx: cell.x, ty: cell.y };
  });

  const stationObjects = stations.map((station) => ({
    id: `station-${station.id}`,
    type: station.type,
    tx: station.tx,
    ty: station.ty,
    stationId: station.id,
  }));
  const decorativeObjects = placeBlueprintObjects({
    map,
    width,
    height,
    tileLibrary,
    blueprint,
    occupied,
    protectedCells,
    rng,
  });

  // Only use cells reachable from the entrance. Dense decoration can never
  // strand an NPC or quest item behind a furniture vignette.
  const walkable = collectReachableCells(
    map,
    width,
    height,
    tileLibrary,
    playerStart,
    occupied,
  );
  const shuffled = seededShuffle(walkable, rng);

  const npcCount = (manifest.cast || []).length;
  const npcSpots = [];
  for (const cell of shuffled) {
    if (npcSpots.length >= npcCount) break;
    const nearStart =
      Math.abs(cell.x - playerStart.x) + Math.abs(cell.y - playerStart.y) < 3;
    const tooClose = npcSpots.some(
      (spot) => Math.abs(spot.tx - cell.x) + Math.abs(spot.ty - cell.y) < 4,
    );
    if (nearStart || tooClose) continue;
    npcSpots.push({ tx: cell.x, ty: cell.y });
    occupied.add(`${cell.x},${cell.y}`);
  }
  // fallback fill if spacing was too strict
  for (const cell of shuffled) {
    if (npcSpots.length >= npcCount) break;
    const key = `${cell.x},${cell.y}`;
    if (occupied.has(key)) continue;
    npcSpots.push({ tx: cell.x, ty: cell.y });
    occupied.add(key);
  }

  const itemSpawnCells = shuffled
    .filter((cell) => !occupied.has(`${cell.x},${cell.y}`))
    .filter(
      (cell) =>
        Math.abs(cell.x - playerStart.x) + Math.abs(cell.y - playerStart.y) > 2,
    )
    .slice(0, 24);

  return {
    mapWidth: width,
    mapHeight: height,
    map,
    tileLibrary,
    stations,
    objects: [...stationObjects, ...decorativeObjects],
    npcSpots,
    itemSpawnCells,
    playerStart,
    blueprint,
  };
}

export { TILE };
