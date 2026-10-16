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

function tile(image, columns, rows, index, size = 512, cleanCutout = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  context.drawImage(image, index % columns * image.width / columns,
    Math.floor(index / columns) * image.height / rows,
    image.width / columns, image.height / rows, 0, 0, size, size);
  if (cleanCutout) {
    const imgData = context.getImageData(0, 0, size, size);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      if (!a) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // Strip any residual pale paper fringe on cutout edges while keeping white petals.
      if (r > 242 && g > 242 && b > 242 && (max - min) < 10) {
        d[i + 3] = 0;
      }
    }
    context.putImageData(imgData, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

// Author crisp Tales-of-Symphonia style cel-shaded anime facial features onto
// each character's skin field so eyes are large, luminous, and seamlessly matched
// to neck/ear skin tones without muddy tinting on the sclera.
function paintSymphoniaFace(baseImage, index, config) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (baseImage) {
    ctx.drawImage(baseImage, (index % 2) * baseImage.width / 2,
      Math.floor(index / 2) * baseImage.height / 2,
      baseImage.width / 2, baseImage.height / 2, 0, 0, size, size);
  }
  // Uniform skin base matching the character's 3D skin material.
  ctx.fillStyle = config.skin;
  ctx.fillRect(0, 0, size, size);

  // Soft warm forehead/cheek ambient gradation
  const cheekGlow = ctx.createRadialGradient(size * 0.5, size * 0.56, size * 0.05, size * 0.5, size * 0.54, size * 0.42);
  cheekGlow.addColorStop(0, config.skinWarm);
  cheekGlow.addColorStop(1, `${config.skin}00`);
  ctx.fillStyle = cheekGlow;
  ctx.fillRect(0, 0, size, size);

  // Anime cheek blush ovals + subtle blush slash lines
  for (const side of [-1, 1]) {
    const cx = size * (0.5 + side * 0.215);
    const cy = size * 0.595;
    const blush = ctx.createRadialGradient(cx, cy, 4, cx, cy, size * 0.078);
    blush.addColorStop(0, config.blush);
    blush.addColorStop(1, `${config.skin}00`);
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.082, size * 0.046, side * -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Classic JRPG anime blush hash marks
    ctx.strokeStyle = config.blushLine;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(cx + k * 14 - 4, cy + 6);
      ctx.lineTo(cx + k * 14 + 4, cy - 5);
      ctx.stroke();
    }
  }

  // Draw large, expressive Tales-of-Symphonia style anime eyes
  const eyeY = size * (config.eyeY || 0.495);
  const eyeSpan = size * (config.eyeSpan || 0.178);
  const eyeW = size * (config.eyeW || 0.098);
  const eyeH = size * (config.eyeH || 0.096);

  for (const side of [-1, 1]) {
    const ex = size * 0.5 + side * eyeSpan;
    ctx.save();
    ctx.translate(ex, eyeY);
    ctx.scale(side, 1);

    // 1. Sclera (crisp warm ivory white)
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.92, eyeH * 0.1);
    ctx.bezierCurveTo(-eyeW * 0.85, -eyeH * 0.95, eyeW * 0.78, -eyeH * 0.98, eyeW * 0.98, -eyeH * 0.08);
    ctx.bezierCurveTo(eyeW * 0.84, eyeH * 0.86, -eyeW * 0.68, eyeH * 0.88, -eyeW * 0.92, eyeH * 0.1);
    ctx.closePath();
    ctx.fillStyle = "#fffaf2";
    ctx.fill();

    // Soft upper sclera shadow under eyelashes
    ctx.save();
    ctx.clip();
    const scleraShadow = ctx.createLinearGradient(0, -eyeH, 0, eyeH * 0.15);
    scleraShadow.addColorStop(0, "rgba(110, 95, 125, 0.28)");
    scleraShadow.addColorStop(1, "rgba(110, 95, 125, 0)");
    ctx.fillStyle = scleraShadow;
    ctx.fillRect(-eyeW, -eyeH, eyeW * 2, eyeH * 1.2);

    // 2. Large vertical-oval Anime Iris
    const irisX = -eyeW * 0.04;
    const irisY = eyeH * 0.02;
    const irisRX = eyeW * 0.64;
    const irisRY = eyeH * 0.82;

    // Outer dark iris ring
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, irisRX, irisRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = config.irisDark;
    ctx.fill();

    // Main iris gradient (deep top -> vibrant mid -> glowing lower crescent)
    const irisGrad = ctx.createLinearGradient(irisX, irisY - irisRY, irisX, irisY + irisRY);
    irisGrad.addColorStop(0, config.irisDark);
    irisGrad.addColorStop(0.42, config.irisMid);
    irisGrad.addColorStop(0.82, config.irisLight);
    irisGrad.addColorStop(1, config.irisGlow);
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, irisRX * 0.89, irisRY * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Luminous lower iris crescent arc
    ctx.beginPath();
    ctx.ellipse(irisX, irisY + irisRY * 0.18, irisRX * 0.72, irisRY * 0.56, 0, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.strokeStyle = config.irisGlow;
    ctx.lineWidth = irisRX * 0.18;
    ctx.lineCap = "round";
    ctx.stroke();

    // Deep pupil
    ctx.beginPath();
    ctx.ellipse(irisX, irisY - irisRY * 0.03, irisRX * 0.38, irisRY * 0.44, 0, 0, Math.PI * 2);
    ctx.fillStyle = config.pupil || "#181d28";
    ctx.fill();

    // Upper-inside crisp anime specular highlight + secondary lower sparkle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(irisX - side * irisRX * 0.34, irisY - irisRY * 0.36, irisRX * 0.28, irisRY * 0.24, -0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(irisX + side * irisRX * 0.32, irisY + irisRY * 0.34, irisRX * 0.15, irisRY * 0.13, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Bold, sculpted upper eyelash arch (Tales of Symphonia signature ink linework)
    ctx.fillStyle = config.lashColor || "#1e1821";
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.98, eyeH * 0.14);
    ctx.bezierCurveTo(-eyeW * 0.88, -eyeH * 1.12, eyeW * 0.78, -eyeH * 1.14, eyeW * 1.12, -eyeH * 0.18);
    if (config.feminine) {
      // Winged outer lash tip
      ctx.lineTo(eyeW * 1.24, -eyeH * 0.34);
      ctx.bezierCurveTo(eyeW * 1.06, -eyeH * 0.02, eyeW * 0.98, eyeH * 0.08, eyeW * 0.92, eyeH * 0.02);
    } else {
      ctx.lineTo(eyeW * 1.16, -eyeH * 0.02);
    }
    ctx.bezierCurveTo(eyeW * 0.68, -eyeH * 0.82, -eyeW * 0.76, -eyeH * 0.8, -eyeW * 0.92, eyeH * 0.16);
    ctx.closePath();
    ctx.fill();

    // Subtle lower lash line
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.55, eyeH * 0.68);
    ctx.quadraticCurveTo(eyeW * 0.08, eyeH * 0.88, eyeW * 0.76, eyeH * 0.52);
    ctx.strokeStyle = config.lashColor || "#2a2026";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.stroke();

    // Double-eyelid crease line above the eye
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.68, -eyeH * 0.82);
    ctx.quadraticCurveTo(eyeW * 0.05, -eyeH * 1.24, eyeW * 0.82, -eyeH * 0.76);
    ctx.strokeStyle = config.creaseColor || "rgba(92, 58, 44, 0.55)";
    ctx.lineWidth = 3.4;
    ctx.stroke();

    // 4. Expressive Eyebrow
    const browTilt = config.browTilt || 0;
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.85, -eyeH * (1.38 - browTilt));
    ctx.quadraticCurveTo(eyeW * 0.05, -eyeH * (1.72 + browTilt * 0.4), eyeW * 1.02, -eyeH * (1.32 + browTilt));
    ctx.quadraticCurveTo(eyeW * 0.05, -eyeH * (1.52 + browTilt * 0.4), -eyeW * 0.85, -eyeH * (1.24 - browTilt));
    ctx.closePath();
    ctx.fillStyle = config.browColor;
    ctx.fill();

    ctx.restore();
  }

  // 5. Delicate Tales-of-Symphonia button nose (tiny warm shadow + pinpoint highlight)
  const noseY = size * 0.625;
  ctx.fillStyle = config.noseShadow || "rgba(145, 88, 64, 0.58)";
  ctx.beginPath();
  ctx.moveTo(size * 0.494, noseY - 12);
  ctx.quadraticCurveTo(size * 0.484, noseY + 4, size * 0.502, noseY + 9);
  ctx.quadraticCurveTo(size * 0.512, noseY + 4, size * 0.501, noseY - 12);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 248, 236, 0.55)";
  ctx.beginPath();
  ctx.arc(size * 0.507, noseY - 2, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Clean, expressive anime mouth
  const mouthY = size * 0.742;
  const mouthW = size * (config.mouthW || 0.062);
  const smile = config.smile ?? 10;

  // Soft lower lip shadow
  ctx.fillStyle = config.noseShadow || "rgba(150, 92, 68, 0.36)";
  ctx.beginPath();
  ctx.ellipse(size * 0.5, mouthY + smile * 0.65 + 14, mouthW * 0.36, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (config.openSmile) {
    // Cheerful open anime smile (for Yachiru)
    ctx.beginPath();
    ctx.moveTo(size * 0.5 - mouthW, mouthY - 4);
    ctx.quadraticCurveTo(size * 0.5, mouthY + 6, size * 0.5 + mouthW, mouthY - 4);
    ctx.quadraticCurveTo(size * 0.5, mouthY + 44, size * 0.5 - mouthW, mouthY - 4);
    ctx.closePath();
    ctx.fillStyle = "#b8525c";
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#e9888e";
    ctx.beginPath();
    ctx.arc(size * 0.5, mouthY + 26, mouthW * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#4d2729";
    ctx.lineWidth = 4.2;
    ctx.stroke();
  } else {
    // Classic two-segment anime smile with subtle center break
    ctx.strokeStyle = config.mouthColor || "#5c3128";
    ctx.lineWidth = 4.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(size * 0.5 - mouthW, mouthY - smile * 0.35);
    ctx.quadraticCurveTo(size * 0.5 - mouthW * 0.45, mouthY + smile * 0.65, size * 0.5 - 3, mouthY + smile * 0.52);
    ctx.moveTo(size * 0.5 + 3, mouthY + smile * 0.52);
    ctx.quadraticCurveTo(size * 0.5 + mouthW * 0.45, mouthY + smile * 0.65, size * 0.5 + mouthW, mouthY - smile * 0.35);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
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
  const plants = Array.from({ length: 4 }, (_, index) => tile(foliage, 2, 2, index, 512, true));

  const faceConfigs = [
    // 0: Explorer (Lloyd-inspired protagonist: warm brown-crimson/amber-teal heroic eyes)
    {
      skin: "#eec295",
      skinWarm: "rgba(247, 182, 138, 0.35)",
      blush: "rgba(235, 128, 108, 0.26)",
      blushLine: "rgba(218, 106, 92, 0.32)",
      irisDark: "#2d1d1c",
      irisMid: "#8c3b2b",
      irisLight: "#d96b38",
      irisGlow: "#ffbe6b",
      browColor: "#4b2e24",
      browTilt: 0.14,
      eyeW: 0.098,
      eyeH: 0.096,
      smile: 9,
      feminine: false,
    },
    // 1: Yoruichi (Warm bronze skin, luminous golden-amber eyes, crisp white sclera)
    {
      skin: "#ba896c",
      skinWarm: "rgba(210, 135, 98, 0.35)",
      blush: "rgba(205, 95, 82, 0.25)",
      blushLine: "rgba(182, 74, 66, 0.3)",
      irisDark: "#422714",
      irisMid: "#b5741e",
      irisLight: "#e8a838",
      irisGlow: "#ffe680",
      browColor: "#3d224c",
      lashColor: "#1d1226",
      noseShadow: "rgba(105, 58, 42, 0.62)",
      mouthColor: "#4a221c",
      browTilt: 0.16,
      eyeW: 0.1,
      eyeH: 0.095,
      smile: 11,
      feminine: true,
    },
    // 2: Yachiru (Cheerful big sparkling violet-berry eyes, open smile)
    {
      skin: "#eec295",
      skinWarm: "rgba(248, 188, 148, 0.38)",
      blush: "rgba(242, 124, 136, 0.34)",
      blushLine: "rgba(226, 102, 118, 0.38)",
      irisDark: "#361844",
      irisMid: "#88357c",
      irisLight: "#d264b6",
      irisGlow: "#ffb5e8",
      browColor: "#295a9c",
      browTilt: -0.05,
      eyeW: 0.106,
      eyeH: 0.108,
      mouthW: 0.058,
      openSmile: true,
      feminine: true,
    },
    // 3: Hana (Colette-inspired village botanist: gentle emerald-jade eyes)
    {
      skin: "#eec295",
      skinWarm: "rgba(247, 184, 142, 0.35)",
      blush: "rgba(238, 132, 118, 0.28)",
      blushLine: "rgba(220, 110, 98, 0.32)",
      irisDark: "#1c3b30",
      irisMid: "#367c5b",
      irisLight: "#6bbd88",
      irisGlow: "#b8f2be",
      browColor: "#8c6836",
      browTilt: -0.04,
      eyeW: 0.102,
      eyeH: 0.1,
      smile: 12,
      feminine: true,
    },
    // 4: Milo (Calm azure-sapphire anime eyes, silver-slate brows)
    {
      skin: "#eec295",
      skinWarm: "rgba(245, 182, 140, 0.32)",
      blush: "rgba(230, 130, 114, 0.22)",
      blushLine: "rgba(210, 108, 95, 0.28)",
      irisDark: "#1a2f4c",
      irisMid: "#336799",
      irisLight: "#5ca4d6",
      irisGlow: "#a8e4ff",
      browColor: "#6d7882",
      browTilt: 0.06,
      eyeW: 0.096,
      eyeH: 0.094,
      smile: 8,
      feminine: false,
    },
  ];
  const expressions = faceConfigs.map((cfg, i) => paintSymphoniaFace(faces, i % 4, cfg));

  const signCanvas = document.createElement("canvas");
  signCanvas.width = 768;
  signCanvas.height = 288;
  const sign = signCanvas.getContext("2d");
  sign.fillStyle = "#ead9ab";
  sign.fillRect(0, 0, 768, 288);
  sign.strokeStyle = "#9b8053";
  sign.lineWidth = 5;
  sign.strokeRect(18, 18, 732, 252);
  sign.fillStyle = "#355238";
  sign.textAlign = "center";
  sign.font = "bold 58px Georgia, serif";
  sign.fillText("ASTERFALL", 356, 138);
  sign.font = "22px Georgia, serif";
  sign.fillText("THE VERDANT COAST", 356, 190);
  sign.beginPath();
  sign.moveTo(655, 114); sign.lineTo(693, 143); sign.lineTo(655, 172);
  sign.moveTo(690, 143); sign.lineTo(613, 143);
  sign.lineWidth = 7; sign.lineCap = "round"; sign.strokeStyle = "#355238"; sign.stroke();
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  signTexture.anisotropy = 8;
  const all = [...textures, ...plants, ...expressions, signTexture];
  return {
    grass: textures[0], earth: textures[1], bark: textures[2], wood: textures[3],
    plaster: textures[4], roof: textures[5], canopy: textures[6], stone: textures[7],
    bough: plants[0], fern: plants[1], grassTuft: plants[2], flowers: plants[3],
    faces: expressions,
    sign: signTexture,
    dispose() { all.forEach((texture) => texture.dispose()); },
  };
}
