import * as THREE from "three";

// The paintings remain ordinary project assets. Each material gets its own
// texture tile so UV repetition never bleeds into a neighboring atlas cell.
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load the village painting: ${url}`));
    image.src = url;
  });
}

function tile(image, columns, rows, index, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  context.drawImage(image, index % columns * image.width / columns,
    Math.floor(index / columns) * image.height / rows,
    image.width / columns, image.height / rows, 0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export async function loadArtAssets() {
  const [materials, foliage, faces] = await Promise.all([
    loadImage("/images/gamer/painted-materials.png"),
    loadImage("/images/gamer/painted-foliage.png"),
    loadImage("/images/gamer/anime-faces.png"),
  ]);
  const textures = Array.from({ length: 8 }, (_, index) => tile(materials, 4, 2, index));
  const plants = Array.from({ length: 4 }, (_, index) => tile(foliage, 2, 2, index));
  const expressions = Array.from({ length: 4 }, (_, index) => tile(faces, 2, 2, index));
  const all = [...textures, ...plants, ...expressions];
  return {
    grass: textures[0], earth: textures[1], bark: textures[2], wood: textures[3],
    plaster: textures[4], roof: textures[5], canopy: textures[6], stone: textures[7],
    bough: plants[0], fern: plants[1], grassTuft: plants[2], flowers: plants[3],
    faces: expressions,
    dispose() { all.forEach((texture) => texture.dispose()); },
  };
}
