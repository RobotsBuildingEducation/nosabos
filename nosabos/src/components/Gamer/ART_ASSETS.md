# Painted art assets

Generated with the built-in `image_gen` tool for the `/gamer` art study. The PNG
outputs were copied intact into the project. Atlas cells are sampled into canvas
textures at runtime; foliage retains the generated transparency.

- `public/images/gamer/painted-materials.png`: eight painted material tiles for
  meadow, earth, bark, wood, plaster, clay shingles, canopy, and paving.
- `public/images/gamer/painted-foliage.png`: transparent bough, fern, grass, and
  flower cutouts used on layered, fixed 3D vegetation cards.
- `public/images/gamer/anime-faces.png`: four facial-feature tiles UV-mapped
  directly onto continuous sculpted 3D heads.

The village sign is drawn with Canvas at runtime in `artAssets.js`. Sky, clouds,
water, head geometry and additional architectural details are authored in code;
the original PNG paintings remain unchanged.

Character design references are the existing `src/sprites/NPC_sprites.png` and
`src/sprites/tutor/main_character_tutor_transparent.webp`. These source files were
inspected and remain unchanged. Their colors, species, hair, and clothing informed
the authored mesh models; the original pixel sprites are also shown in the cast
strip. The user's Tales of Symphonia screenshots informed the art direction.

## Material atlas prompt

Use case: stylized-concept. Asset type: production hand-painted texture atlas for a real-time 3D early-2000s Japanese cel-shaded anime JRPG forest village, in the visual language of Tales of Symphonia. Create one wide 2:1 image, precisely EIGHT equally sized square texture tiles in a strict 4-column by 2-row grid, touching edges, no margins, NO labels, NO text, NO frames. Each panel is a flat orthographic seamless material swatch filling its square, no perspective, no objects on top. Row 1 left to right: (1) lush emerald spring meadow grass, painted delicate blades and clover, dappled olive-green variation, (2) warm golden ochre packed-earth footpath with fine sandy brushwork and occasional little pebbles, (3) vertical old chestnut tree bark, sinuous organic grooves, moss at the lower edges, (4) warm weathered timber planks with subtle knots and thin dark joints. Row 2 left to right: (5) warm ivory lime plaster, subtle mottling and painted age, (6) rich red-brown overlapping small clay roof shingles, finely hand-painted edges and highlights, (7) dense textured vivid green leafy canopy painted in several cel-shaded green values with individual small tapered leaves visible, (8) irregular beige gray mossy village flagstones in old hand-laid arrangement. Authentic hand-painted game textures with controlled fine detail, warm sunlit colors, brushwork, clean color groups, no photorealism, no plastic, no low-poly art, no voxel style, no baked cast shadows or directional scene lighting.

## Transparent foliage prompt

Use case: stylized-concept. Asset type: transparent foliage cutout texture atlas for real 3D vegetation cards in a Japanese anime cel-shaded fantasy JRPG like Tales of Symphonia. Create a square image with FOUR separate natural botanical cutouts, one in each quadrant, generous transparent gutters separating them. Top left: a broad roughly oval hanging bough of dense small pointed emerald and chartreuse leaves, branching delicate brown twigs, feathery irregular leaf silhouette, hanging leaves and visible individual leaf shapes, suitable for draping onto a tree canopy. Top right: a spray of elegant forest fern fronds fanning out from a shared low center, slender pointed leaves, moss and spring-green tones. Bottom left: a dense naturally tapered tuft of fine long meadow grass blades, multiple curling sharp tips, rich saturated greens and lighter yellow-green painted edges, all stems meet at bottom center. Bottom right: a small airy cluster of white tiny wildflowers, slim green stems, a few gentle leaves, plants rooted at bottom center. Style: finely hand-painted early 2000s Japanese console RPG foliage, readable painted anime leaf detail, 3 shades of green, soft brush texture, no black outlines around individual leaves. Every cutout fully contained within its own quadrant. Actual transparent background through all gaps between leaves. No ground, no scene, no pots, no characters, no text, no frame.

## Anime facial-feature prompt

Use case: stylized-concept. Asset type: facial-feature diffuse texture atlas to be UV-mapped onto actual 3D anime heads in a cel-shaded Japanese JRPG inspired by Tales of Symphonia. One square image, strict 2x2 grid, FOUR equal square tiles filling the image, no margins, no labels. Every tile is COMPLETELY FILLED with the SAME flat warm light peach skin color #efc69f from edge to edge. Paint ONLY facial features on this flat skin field; NO head outline, NO hair, NO ears, NO neck, NO background objects, NO framing. Top-left: young adult male adventurer, narrower teal anime eyes, angular upper lashes, calm expression, fine brows. Top-right: young adult woman with rich amber anime eyes, bold elegant upper lashes, warm confident expression and slight smile, softly dark eyebrows. Bottom-left: cheerful teenage girl with violet-magenta anime eyes and delicate bright eyebrows, friendly smile. Bottom-right: kind young adult woman, soft green anime eyes, fine brown eyebrows, tranquil smile. All four faces drawn front-on, perfectly symmetrical eye positions in the same locations, the eyes at 47 percent down the square, eyebrows at 36 percent, tiny subtle nose indication at 66 percent, small fine mouth at 80 percent. Fine 2000s Japanese anime linework, tapered almond eye shapes, layered detailed irises with restrained glints, subtle peach blush, clean cel-shaded features with one soft face-shadow tone. Natural anime eye proportions, not chibi, not kawaii baby faces, not Disney, not Roblox. Texture-map asset, not portraits, not heads; do not draw hair or a face perimeter. Skin field remains flat and uniform around every tile's edges.
