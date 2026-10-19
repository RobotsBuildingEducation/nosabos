# Public-page loading changes — October 18, 2026

The public landing page and /links now need less JavaScript before their content appears. These results compare production builds of the current checkout immediately before and after this task; they do not use the older October 17 comparison.

| Page | Before | After | Faster | Initial JavaScript, gzip |
| --- | ---: | ---: | ---: | ---: |
| Landing page | 7.21 s | 4.78 s | 2.43 s (33.7%) | 1059.7 → 657.4 KB |
| /links | 6.70 s | 5.40 s | 1.30 s (19.4%) | 1009.2 → 791.8 KB |

The table reports median time until the real page is mounted and its startup overlay has disappeared. JavaScript sizes count gzip-compressed bodies of scripts completed before that moment, including the selected locale. They exclude response headers and subsequent background downloads. The first visual feedback remains about 0.4 seconds in both builds.

## Implemented

- Moved the companion palettes and canvas drawing functions into a module with no lesson-panel, store, or translation imports. The landing-page drawings remain identical.
- Kept the privacy dialog shell lightweight; its Markdown content and renderer load when the dialog opens.
- Deferred the public pages’ 3D renderer until the completed startup overlay disappears and the page has painted. The orb fades in over 240 ms after its first rendered frame. There is no public-page loading substitute or failed-renderer backup. Reduced-motion preferences disable the fade.
- Split public-page copy into one module per page and language. Startup prepares the selected copy alongside page code. Language changes load the requested copy before switching the visible text; a failed selection leaves the current language visible.
- Kept Nostr identity, key preparation, profile, wallet and QR dependency behavior intact.

## Measurement conditions and limits

Local production builds served with gzip; fresh Chrome browser context for each visit; 393 × 851 mobile viewport; 1.6 Mbps download, 150 ms latency and 4× CPU slowdown. Three runs per page and build, alternating build order. The final comparison ran without the separate WebGL browser checks running alongside it.

These are controlled simulations, not live-production timings or measurements from a physical Pixel 5a. External requests, APIs, WebSockets and service workers were blocked to isolate initial page code. Real relay/account lookups, external resources, device performance and caching will affect observed times.

Existing service-worker precaching is unchanged. It can still download other application and locale bundles in the background for offline availability. The savings here describe the work required before initial content appears, not the total bytes downloaded during a browsing session. Three-dimensional content is intentionally completed later and is not part of the page-ready timing.

## Validation

- Production build passes.
- Browser checks pass on both pages: only the selected public locale is requested initially; Spanish switching works; privacy content loads on demand; the renderer request begins after the loader clears; no backup appears while it is held; the orb fades in after rendering; no page errors. /links still prepares a local Nostr key immediately through its existing flow.
- All 68 extracted drawing/palette declarations match the originals exactly; 180 canvas pixel comparisons match across six pets, six health levels and five animation frames.
- All 70 migrated original locale dictionaries were compared with the extracted versions.
- All 55 focused public-page, copy-cache and loading tests pass. New/extracted modules pass ESLint. Existing lint findings in LandingPage, LinksPage and main remain the same as HEAD.
- Full suite: 1,115 passed, four pre-existing failures: Arabic activity menu copy, dailyPlateHeadline’s extensionless useUserStore import, and two journey sound-effects assertions. The final loading-label change was covered by the focused rerun.

## Individual page-ready times

- /: before 7.359, 7.207, 7.201 s; after 4.764, 4.777, 4.892 s.
- /links: before 6.720, 6.695, 6.697 s; after 5.447, 5.397, 5.374 s.
