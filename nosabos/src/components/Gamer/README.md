# Asterfall /gamer demo

A separate, lazy-loaded 3D design playground. Visit `/gamer` on the local Vite
server. No account is required. The existing RPG renderer, authored episodes,
account data, and learning progress are untouched.

The default view is an art study with a quiet HUD. The single map uses Three.js
toon materials, compact anime proportions, sculpted ribbon hair, painted facial
features on full rounded heads, textured terrain and buildings, layered leaf cards, shadows, animated
water, and a perspective follow camera. Characters are actual mesh models that
retain their shape when the camera orbits.

Human locomotion coordinates contact, compression, push-off and recovery.
The trailing heel folds behind the hip before the knee passes forward, the
shoulders counter-rotate against the pelvis, and bent arms swing in opposition
to the legs. A continuous skinned spine provides forward lean and slight banking
on turns. Travel distance drives cadence; the support foot moves backward at
the same speed the character travels forward. Shared two-bone IK keeps the
soles above the ground through walk/run blends. Reversals turn the character
before accelerating so the first steps do not slide backwards.
The animal cast keeps its shorter grounded IK strides and gentler weight shift.

Normal movement is 2.3 world units/second; sprint is 3.8. These speeds are matched
to the stride so the legs do not need to cycle frantically. The previous
retargeted clip data and bake pipeline have been removed from this demo.

Yoruichi, Jiraiya, Sheilfer, Neko, and Yachiru are visual translations of the
existing NPC and tutor sprite sheets. They stand in the village independently
of the original Hana/Milo quest. Their source sprites appear in the small cast
strip for comparison. The original sprites and existing RPG remain unchanged.

All seven villagers periodically take short local walks and pause at independent
intervals. They turn before stepping, avoid structures, fences, the river, and
one another, and stop to look at and greet a nearby player. Panels pause their
motion. Hana's interaction prompt, distance, collider, and map marker follow her
current position as she wanders near the square.

Painted assets live in `public/images/gamer`. They load locally, without any
third-party model requests. See `ART_ASSETS.md` for their generation prompts
and provenance. The character shapes, clothes, hair, and rig are authored in code.

The environment combines quieter meadow textures with drifts of vegetation
along the painted paths. Canopies use layered irregular volumes and drooping
boughs; only the leaf cards cast the canopy shadows, keeping their edges
feathered. Cottages have roof courses, shutters, side windows, bracing, masonry
footings and lanterns. The river has moving caustics, shallow bank color and
distance fog; a procedural painted sky closes the background.

Rigid character details are batched per pivot and material while leaving cloth
and joints independent. The explorer uses 72 meshes, down from 136 before this
pass. Character self-shadows are disabled to keep hair shadow-map aliasing off
the face; cel bands still shade the model and it still casts a ground shadow.

Walk with WASD or arrow keys, hold Shift to sprint, drag to orbit, scroll to zoom,
and use C to reset the camera. Click the ground to walk toward a point. Use E or
Space near a character, object, or berry bush. J opens the journal and I opens the
inventory. Small screens and touch devices also have a movement stick, a sprint
button, and an interaction button. Settings offer lighter rendering and reduced
motion. Movement pauses while a panel or conversation is open.

Hana's local Spanish conversation starts a three-berry collection quest. The last
bush is across the bridge; the river and structures block walking. Delivering all
three berries updates the journal, satchel, and demo XP. State lasts until the
route is left or the page is reloaded.

- `Gamer.jsx`: HUD, dialogue, panels, and the local quest state.
- `world.js`: scene construction, rendering, camera, movement, and cleanup.
- `characters.js`: articulated procedural character models.
- `head.js`: continuous anime skull, jaw, cheeks and facial UV mapping.
- `rigGeometry.js`: rigid detail batching that preserves joint transforms.
- `atmosphere.js`: procedural sky and cloud shading.
- `motion.js`: travel-based cadence, locomotion state, and animal foot IK.
- `locomotion.js`: coordinated full-body poses and velocity-matched support steps.
- `legIK.js`: shared two-bone leg solver.
- `spine.js`: continuous human spine skinning and attachment points.
- `villagers.js`: local wandering, pauses, clearance, and greetings.
- `gameData.js`: map coordinates, collision rules, and interactions.
- `gamer.css`: scoped desktop and touch layouts.

Run `node --test src/components/Gamer/*.test.js` for map boundaries,
river/bridge collision, rotated structures, interaction range, and quest-target
reachability, foot placement, cadence, pauses, and safe villager wandering.
Run `npx eslint src/components/Gamer` and `npm run build` for the
route's source checks and production bundle.

This is an art-direction prototype with authored procedural models. Quest
dialogue is authored and Spanish-only, and remains accessible through proximity
interactions and the J/I shortcuts. Click-to-walk
stops at obstacles; keyboard or joystick movement can route around them.
