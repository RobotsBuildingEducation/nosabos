# Customize Companion — Plan

Turn the current "Name your companion" rename modal into a richer **Customize
companion** modal that lets the user pick which animal their daily-goal pet is
(**Dog, Cat, Frog, Hamster**) in addition to naming it. Every pet type keeps the
exact same health-state system that drives the current dog.

**Rendering approach: all pets are procedurally drawn on `<canvas>`, just like
the dog today.** The sprite sheets in [`src/sprites`](nosabos/src/sprites) are
**visual reference only** — we hand-author pixel-art draw code for cat, frog, and
hamster to match their look. No PNG is imported or rendered at runtime.

Status: **planning / not started**. Created 2026-06-21.

---

## 1. Goals

1. **Pet selection** — user can choose Dog / Cat / Frog / Hamster.
2. **Procedurally generated like the dog** — cat/frog/hamster get their own
   canvas draw code (palettes + anatomy + per-stage faces/decorations + dead
   pose), matching the style of the existing dog. The `*_sprites.png` files are
   reference art used while authoring, not loaded at runtime.
3. **Same health states for every pet** — the 6-stage model
   (`happy → healthy → unhappy → stressed → unhealthy → dead`) drives all pets
   identically. This is automatic: `getPetStage()` already produces the stage;
   each pet only supplies how to *draw itself* for that stage.
4. **Rename the modal** — title becomes **"Customize companion"** (localized),
   containing both the name input and the pet-type picker.

---

## 2. Current architecture (what exists today)

### 2.1 Two near-duplicate pet panels
The pet-rendering + health-stage code is **duplicated** across two components:

| File | Role | Has edit modal? | Used by |
| --- | --- | --- | --- |
| [`DailyGoalPetPanel.jsx`](nosabos/src/components/DailyGoalPetPanel.jsx) (1011 lines) | original, **display-only** | no | `DailyGoalModal.jsx`; celebration view in `App.jsx` (~8438) |
| [`PlatePetPanel.jsx`](nosabos/src/components/PlatePetPanel.jsx) (1250 lines) | "standalone copy" + adds the rename modal | **yes** (`onRenamePet`, pencil) | `DailyPlateHome.jsx` (~360) |

`PlatePetPanel.jsx:4` notes the copy is *"kept independent of the modal's
component file on purpose."* Both files contain their own copies of:
`DOG`/`SICK_DOG`/`DEAD_DOG` palettes, `getPetStage()`, `drawDecoration()`,
`drawFaceExpression()`, `drawDeadDog()`, `drawAliveDog()`, `drawDogCharacter()`,
and a `DogCanvas` component.

> **Only `PlatePetPanel` (via `DailyPlateHome`) currently has the editable
> modal.** The type picker UI lives there, but **all** panels must be able to
> *draw* the chosen pet type.

### 2.2 How the dog is drawn (the template for the new pets)
- Internal canvas size `T = TILE(16) × SCALE(3) = 48px`, displayed at 96/144px,
  `imageRendering: pixelated`. Idle animation loops 6 frames (`(frame+1) % 6`
  every 180ms).
- `getPetStage(health, copy, isLightTheme)` → stage object: `key`, `palette`,
  `colorScheme`, `label`, `background`, wave colors, `face`, `decoration`,
  `motion`, `showTongue`. **Single source of health-state truth.** Only
  `palette` is dog-specific; everything else is pet-agnostic.
- `drawAliveDog(ctx, frame, stage)` (~110 lines): computes motion offsets
  (`xShift`, `stride`, `bob`, `tailWag` from `phase`), then `px()`-paints the
  dog's shadow, tail, body, belly, head, ears, eyes, nose, paws using
  `stage.palette`, and finally calls the **shared** `drawFaceExpression()` and
  `drawDecoration()` anchored at `(cx, headY)`.
- `drawDeadDog(ctx)` is a **separate bespoke pose** (lying down, X-eyes, halo);
  `drawDogCharacter` routes to it when `stage.key === "dead"`.

### 2.3 What's already reusable vs. what's pet-specific

| Reusable as-is (pet-agnostic) | Pet-specific (must author per pet) |
| --- | --- |
| `px()` paint helper | Body/head/ear/limb **anatomy** (the bulk of `drawAliveDog`) |
| `getPetStage()` (except its `palette` field) | **Palettes**: normal / sick / dead color sets |
| `drawDecoration()` (sweat, heart, cloud, sparkles, halo…) | Bespoke **dead pose** (`drawDead<Pet>`) |
| `drawFaceExpression()` (happy/healthy/unhappy/stressed/unhealthy) | Per-pet **face anchor** + small overrides (frog eyes-on-top, cat whiskers, hamster cheeks) |
| Motion math (`phase`, `xShift`, `stride`, `bob`) | `tailWag` is dog-tail-specific (frog/hamster have no/tiny tail) |

### 2.4 The reference sprites (NOT rendered)
[`cat_sprites.png`](nosabos/src/sprites/cat_sprites.png),
[`frog_sprites.png`](nosabos/src/sprites/frog_sprites.png),
[`hamster_sprites.png`](nosabos/src/sprites/hamster_sprites.png) — each 256×256,
a row of 4 expressions — define the **target look** (silhouette, proportions,
palette, expression vocabulary) we reproduce in pixel art:
- **Cat:** triangular ears, slim body, tail, small nose/whiskers; warm
  cream/orange fur.
- **Frog:** wide squat body, **bulging eyes on top of the head**, no ears, big
  mouth, webbed feet, no tail; green palette.
- **Hamster:** round chubby body, tiny round ears, cheek pouches, stubby limbs,
  tiny tail; gray/white fur with pink accents.

### 2.5 Persistence
Pet state lives on `user` and syncs to Firestore: `dailyGoalPetHealth` (number),
`dailyGoalPetName` (string). Rename flow: `handleRenamePet` at
[`App.jsx:5506`](nosabos/src/App.jsx:5506) → optimistic
`patchUser({ dailyGoalPetName })` → `setDoc(..., { merge: true })`. Hydration
maps Firestore → local state at [`App.jsx:5938`](nosabos/src/App.jsx:5938).
Fields are read defensively (`user?.dailyGoalPetName || ""`); no central
default-user object.

---

## 3. Key constraints / findings

1. **All pets procedural** → no image imports, no frame-slicing, no smooth
   scaling, no dead-state filter hacks. Everything reuses the existing canvas +
   animation pipeline.
2. **The work is character authoring.** Each of cat/frog/hamster needs a
   `drawAlive<Pet>` (~80–120 lines of `px()` calls), a `drawDead<Pet>` pose, and
   normal/sick/dead palettes — tuned by eye against the reference PNGs. This is
   the bulk of the effort and the main risk.
3. **Health states come for free.** `getPetStage()` is pet-agnostic; each pet
   only changes *how it paints itself* for a given stage. No changes to health
   math, decay, XP, or daily-goal logic.
4. **Faces/decorations are shared but anchored.** Reuse `drawFaceExpression` /
   `drawDecoration`, passing a per-pet head anchor; expect small per-pet
   overrides (frog's eyes sit on top of the head, etc.).
5. **Logic is duplicated in two panels** → put the new pet engine in one shared
   module so it isn't copy-pasted (see §4.2).
6. **Verification is build/lint only** here — the preview harness can't spawn a
   dev server; the user runs their own Vite on `:5173`. Validate via
   `npm run lint` + `npm run build` in `nosabos/` and let the user QA visually.

---

## 4. Design decisions & recommendations

### 4.1 Rendering — procedural for all four pets
Keep the dog's exact pipeline. Add per-pet draw functions selected by
`petType`. The canvas, animation loop, stage system, and styling all stay.

### 4.2 Code organization — **one shared pet module** (recommended)
Create `src/components/petCharacters.js` (pure functions/data — honors the
"components kept independent" note since it's not a component) exporting:

- `PET_TYPES = ["dog","cat","frog","hamster"]` + per-pet metadata (label key).
- `PET_PALETTES[petType] = { normal, sick, dead }` color sets.
- Shared `getPetStage()`, `drawFaceExpression()`, `drawDecoration()`, and the
  motion helper — **moved here once** to delete the current duplication.
- `drawAlive<Pet>` + `drawDead<Pet>` for each of the four pets.
- `drawPetCharacter(ctx, frame, stage, petType)` — resolves
  `PET_PALETTES[petType][stage.paletteRole]` and dispatches to the right
  alive/dead drawer.
- `normalizePetType(value)` → defaults to `"dog"`.

**Refactor note:** generalize `getPetStage` to return a `paletteRole`
(`"normal" | "sick" | "dead"`) instead of a hard-coded dog `palette`; the draw
layer resolves the actual colors per pet. Both panels then render via
`drawPetCharacter` and a thin local `PetCanvas` (kept in each file, independent
as today).

> Alternative (not recommended): duplicate all new pet code into both panel
> files — triples the maintenance of the new draw code.

### 4.3 Data model — new field `dailyGoalPetType`
`dailyGoalPetType: "dog" | "cat" | "frog" | "hamster"`, default `"dog"`.
Persist + hydrate + sync **exactly like `dailyGoalPetName`** (§6).

### 4.4 Modal UX
"Customize companion" modal = existing **name input** + new **pet-type picker**
(4 tappable tiles, each rendering that pet's happy-stage canvas as a live
thumbnail; selected tile highlighted). One **Save** writes both name and type.

---

## 5. Implementation plan (phased)

### Phase 0 — Reference study & palettes
- Inspect each reference PNG; define `PET_PALETTES` (normal/sick/dead) per pet
  and sketch each animal's anatomy in the 48px grid (key landmarks: body box,
  head box, ear/eye/limb positions, head anchor for faces).

### Phase 1 — Shared module + de-dup (`src/components/petCharacters.js`)
- Move `getPetStage` (returning `paletteRole`), `drawFaceExpression`,
  `drawDecoration`, motion helper, and the existing dog drawers into the module.
- Add `PET_TYPES`, `PET_PALETTES`, `drawPetCharacter`, `normalizePetType`.
- Repoint both panels' `DogCanvas` → a `PetCanvas` that calls
  `drawPetCharacter(ctx, frame, stage, petType)`. **Dog output must be
  byte-identical to today** (regression guard before adding new animals).

### Phase 2 — Author the three new pets (the core work)
Do **cat first as a vertical slice** to validate the abstraction, then frog, then
hamster. For each pet: `drawAlive<Pet>` (all 5 alive stages via palette+face+
decoration+motion), `drawDead<Pet>` pose, and palette tuning vs. the reference.
Reuse shared faces/decorations with a per-pet head anchor; add overrides only
where anatomy demands (frog eyes-on-top, cat ears/whiskers, hamster cheeks; drop
`tailWag` for frog/hamster).

### Phase 3 — "Customize companion" modal (in `PlatePetPanel.jsx`)
- Modal title → **Customize companion** (all 10 langs, §7).
- Add the 4-tile pet picker (live canvas thumbnails) under the name input.
- Track `draftType` with `draftName`; **Save** calls a single
  `onCustomizePet({ name, type })` (extends/replaces `onRenamePet`).
- Update the pencil `aria-label` to "Customize companion".

### Phase 4 — App.jsx wiring & persistence
- `handleRenamePet` → `handleCustomizePet({ name, type })` at
  [`App.jsx:5506`](nosabos/src/App.jsx:5506): optimistic
  `patchUser({ dailyGoalPetName, dailyGoalPetType })` + Firestore `setDoc` merge.
- Add `dailyGoalPetType` hydration near
  [`App.jsx:5940`](nosabos/src/App.jsx:5940).
- Pass `petType={normalizePetType(user?.dailyGoalPetType)}` to all render sites:
  daily-goal modal (~7826), `DailyPlateHome` (~7940), celebration (~8441), and
  thread it through [`DailyGoalModal.jsx`](nosabos/src/components/DailyGoalModal.jsx)
  (~405) and [`DailyPlateHome.jsx`](nosabos/src/components/DailyPlateHome.jsx)
  (~92).

### Phase 5 — Polish & verify
- Confirm all 6 stages × 4 pets read correctly in light + dark + celebration.
- `cd nosabos && npm run lint && npm run build`; user QA on `:5173`.

---

## 6. Data model / persistence changes
- Add `dailyGoalPetType` everywhere `dailyGoalPetName` appears:
  optimistic patch (5514), Firestore write (5521), hydration (5940), and the 3
  panel render sites (7826/7940/8441).
- Default/guard via `normalizePetType` so existing users (no field) → `"dog"`.

---

## 7. Copy / i18n changes

Localized **"Customize companion"** title (extend `NAME_MODAL_COPY` at
`PlatePetPanel.jsx:62`) plus localized pet-type labels:

| Lang | Customize companion | Dog / Cat / Frog / Hamster |
| --- | --- | --- |
| en | Customize companion | Dog / Cat / Frog / Hamster |
| es | Personaliza tu compañero | Perro / Gato / Rana / Hámster |
| pt | Personalize seu companheiro | Cachorro / Gato / Sapo / Hamster |
| fr | Personnalise ton compagnon | Chien / Chat / Grenouille / Hamster |
| it | Personalizza il compagno | Cane / Gatto / Rana / Criceto |
| de | Begleiter anpassen | Hund / Katze / Frosch / Hamster |
| ja | 相棒をカスタマイズ | 犬 / 猫 / カエル / ハムスター |
| zh | 自定义你的伙伴 | 狗 / 猫 / 青蛙 / 仓鼠 |
| hi | अपना साथी कस्टमाइज़ करें | कुत्ता / बिल्ली / मेंढक / हैम्स्टर |
| ar | خصّص رفيقك | كلب / قطة / ضفدع / هامستر |

(Keep `save` / `cancel`; add a "Choose your companion" sub-label as needed.)

---

## 8. Edge cases
- **Unknown/empty `dailyGoalPetType`** → `normalizePetType` → `dog` (covers
  existing users).
- **Dead state** per pet → bespoke `drawDead<Pet>` (or unified dead-palette +
  X-eyes + halo fallback); must read as "inactive".
- **Light vs dark theme** + **celebration** variant come from `getPetStage` and
  stay shared — confirm each new pet reads well in all.
- **Picker thumbnails** render live canvases — keep them small/cheap (happy
  stage, low frame rate or single frame) to avoid 4 extra animation loops.

---

## 9. Files touched (summary)
- **New:** `src/components/petCharacters.js` (palettes + shared stage/face/
  decoration/motion + per-pet draw fns + `drawPetCharacter`).
- **Edit:** `PlatePetPanel.jsx` (picker + modal + PetCanvas, import shared),
  `DailyGoalPetPanel.jsx` (PetCanvas + `petType`, import shared),
  `DailyGoalModal.jsx` (thread `petType`), `DailyPlateHome.jsx` (thread
  `petType` + `onCustomizePet`), `App.jsx` (`handleCustomizePet`, hydration, 3
  render sites).
- **Assets:** `src/sprites/{cat,frog,hamster}_sprites.png` used as **reference
  only** — not imported.

---

## 10. Verification
- `cd nosabos && npm run lint && npm run build` (no server spawn here).
- Manual QA on the user's Vite (`:5173`): switch each pet; confirm all 6 stages
  render per pet; name + type persist across reload; daily-goal modal +
  celebration reflect the chosen pet.

---

## 11. Open questions / decisions for you
1. **Shared module + de-dup** — OK to add `petCharacters.js` and move the
   existing dog/stage/face/decoration code into it (deleting the duplication), or
   keep everything inside the two panel files to match the current "independent
   copies" pattern?
2. **Art fidelity bar** — how close to the reference PNGs do the procedural pets
   need to be? "Recognizable, same vibe" (faster) vs. "near-pixel-match"
   (slower, more iteration). Affects Phase 2 time the most.
3. **Dead pose** — bespoke lying-down pose per pet (matches dog), or a unified
   dead treatment (alive body + dead palette + X-eyes + halo) for all?
4. **Build order** — ship cat first as a vertical slice for your review before
   frog + hamster?

---

## 12. Out of scope
- Loading/rendering the PNG sprite sheets at runtime (reference only).
- A dog redesign (dog stays as-is).
- New pets beyond the four listed.
- Changes to health math, decay, XP, daily-goal, or RPG-game NPCs.
