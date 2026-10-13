# Public page first-load performance

The October 12, 2026 changes focus on a new visitor to `/` or `/links`.

| Required JavaScript | Before, gzip | After, gzip | Reduction |
| --- | ---: | ---: | ---: |
| Landing page | 1,105 KB | 403 KB | 64% |
| `/links` | 1,315 KB | 351 KB | 73% |

These are local production-build measurements of the entry point, selected
route, and every static JavaScript dependency. Gzip is calculated locally;
actual transfer size depends on hosting compression. CSS, fonts, images,
and optional code loaded after rendering are outside these figures.

## Loading boundaries

- The landing page is a separate route bundle, so `/links` does not load it.
- Theme initialization uses local storage. Firebase loads when authenticated
  theme persistence is needed.
- Public identity hooks skip automatic relay connections and load signing
  dependencies asynchronously.
- `/links` restores automatic Nostr key creation after page load and the first
  visible paint, followed by two animation frames and an idle callback (with
  a timer fallback). Browsers without paint timing use the frames. Opening its
  profile or RBE handoff starts initialization immediately if needed. Both paths share a
  pending generation; existing identities are reused. This initialization stores
  keys locally without automatically publishing registration messages.
- The wallet loads when the profile panel opens, using the existing global
  wallet store. Transactions and subscriptions remain owned by that store.
- Audio loads on interaction. A native audio context is unlocked synchronously
  in the gesture before Tone arrives.
- 3D orbs reserve their space while their renderer loads near the viewport,
  then fade in after the first rendered frame. Reduced-motion preferences
  skip the fade. Small CSS icons and the fallback for unavailable WebGL remain.
  Route loading indicators use a simple spinner without starting a 3D download.
- Companion drawing is shared directly, without importing the learning screen,
  its translations, or its audio dependencies.
- Privacy policy rendering loads when the policy opens. `/links` display fonts
  load after rendering instead of blocking the initial HTML of both routes.
- The update worker caches only `index.html` and the manifest (about 2.6 KB
  uncompressed), replacing the former 114-file, 12 MB offline bundle. It retains
  the existing version checks and safe update activation. Activation removes
  obsolete Workbox cache entries without changing account storage. Firebase
  Hosting still caches accessed, hashed assets through normal browser caching.
- Onboarding prepares only the selected language and level, the introductory
  level if needed, and the game client/loader. Returning learners prepare their
  current course too. Preparation runs after first paint, two frames, and idle
  time; pending jobs are cancelled when the selection changes or the screen
  unmounts. Existing lesson/game loaders share their caches with these warmups.
  Preparation does not call AI services or change account/course progress.
- First public visits defer update-worker registration. Entering the
  authenticated app starts the existing coordinator. Existing worker-controlled
  visits retain their update checks and migrate to the minimal cache.

## Verification

Run `npm run build` followed by `npm run audit:public-startup`. The audit counts
shared chunks, enforces a 450 KB gzip budget per public route, and rejects static
Firebase, Nostr, Cashu, Tone, and Three.js dependencies. It also checks that HTML
does not automatically register the offline worker or load the display fonts.
It also enforces a two-file update cache, with a 16 KB maximum, so broad offline
precaching cannot silently return.

Isolated mobile Chrome checks covered initial rendering, theme switching,
first-click audio, privacy content, invalid and valid local key sign-in, deferred
profile/wallet loading, and registration after sign-in. Earlier full-cache checks
also covered an offline `/links` reload; offline availability is no longer a
requirement. Drawing commands matched the original across 240 combinations of pet,
health, animation state, and frame.

Additional Chrome checks delayed the 3D module and its first animation frame on
both public pages: no temporary CSS orb appeared, reserved layout dimensions
stayed stable, and the real canvas faded in only after rendering. Reduced-motion
preferences skipped the fade, keyboard interaction worked after readiness,
and unavailable WebGL retained its accessible CSS fallback. All 26 focused
orb renderer, expression, and reaction tests passed.

Background identity checks covered eight scenarios: automatic generation after
load and first paint, early profile opening with quick reopen, early RBE key
copying, timer and paint-timing fallbacks, cancelled navigation, existing keys,
and NIP-07 identity preservation. Generated public keys were verified against
their secrets; initialization wrote one identity, preserved it on reload, and
made no relay connections. All 20 focused Nostr and PWA tests passed.

The focused startup, game-loader, account, and PWA tests passed (32 tests).
Mobile Chrome verified that onboarding prepared only the chosen French
curriculum and reused its course/game downloads when Today's Focus appeared.
A simulated previous installation with 114 cached files retained its files
while the update waited, then removed obsolete entries on activation, preserved
local account keys, and successfully rendered the updated `/links` page.
Remote HTTP requests were blocked and relays mocked; the onboarding transition
simulated a saved account arriving in the local store rather than writing an
account or calling AI services.

The broader suite passed 1,077 tests, with four failures also reproduced on unchanged HEAD: Arabic
activity-menu copy, the daily headline test's module resolution, and two
Journey sound source assertions. Existing lint findings in the touched legacy
files were likewise reproduced on HEAD; the new modules and drawing extraction
passed lint.

Device timings still need a real Pixel 5a measurement; bundle reductions are
not percentages of elapsed load time.
