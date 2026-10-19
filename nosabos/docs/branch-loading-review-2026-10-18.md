# Branch loading review — October 18, 2026

Direct comparison of the start of `codex/loader-testing` (`87d6fdc7`) with its current committed state (`b214c197`). Both versions were built afresh with the same installed dependencies and local build configuration. This comparison includes the latest loader rendering and localization changes. It does not add percentages from earlier incremental comparisons.

## Main public content

Five cold browser contexts per page, build, and scenario. Values are medians from 40 sequential visits, alternating build order. The timing is the first animation frame that observes substantive page content mounted with the startup screens removed. It is a DOM/frame measurement, not a Lighthouse score or full backend/media readiness measurement.

| Mobile simulation | Branch start | Current | Waiting reduced by |
| --- | ---: | ---: | ---: |
| Landing `/` | 6.974 s | 3.294 s | 3.680 s / 52.8% |
| `/links` | 8.640 s | 2.916 s | 5.724 s / 66.3% |

Mobile conditions: 393 × 851 viewport, mobile/touch context, 2.75 device scale factor, 1.6 Mbps download, 150 ms configured latency, 4× CPU slowdown. This is a Mac-based simulation, not a physical Pixel 5a measurement.

| Unthrottled desktop | Branch start | Current | Change |
| --- | ---: | ---: | ---: |
| Landing `/` | 0.344 s | 0.471 s | 0.127 s longer / 36.8% |
| `/links` | 0.565 s | 0.392 s | 0.172 s sooner / 30.5% |

Desktop conditions: 1440 × 900, no network or CPU throttling, local gzip server, empty browser HTTP cache. This is a fast local-server scenario, not a real internet connection or a warm-cache result. The landing page is not uniformly faster: the smaller download helps substantially under constrained conditions, while this fast-desktop test shows a small absolute regression in the content handoff.

The landing hero retains its entrance animation. A secondary style-based check for at least 95% heading/ancestor opacity measured 7.627 → 3.935 s on mobile and 0.987 → 1.106 s on desktop. This does not certify that every image or animation has finished.

## First visual feedback and initial JavaScript

First visual feedback is the browser's First Contentful Paint. The current version's candidate includes the immediate HTML loading screen; it should not be confused with the actual public page.

| First visual feedback | Branch start | Current |
| --- | ---: | ---: |
| Mobile landing | 7.120 s | 0.472 s |
| Mobile `/links` | 6.588 s | 0.476 s |
| Desktop landing | 0.432 s | 0.040 s |
| Desktop `/links` | 0.256 s | 0.044 s |

| Initial JavaScript, gzip response bodies | Branch start | Current | Reduction |
| --- | ---: | ---: | ---: |
| Landing | 1,104,775 bytes | 402,852 bytes | 63.5% |
| `/links` | 1,315,317 bytes | 374,762 bytes | 71.5% |

Initial JavaScript counts same-origin `.js` response bodies completed by the content-reveal measurement, excluding headers. It includes the selected English public-page copy. It excludes later SDK and 3D downloads. HTML itself grows from 802 to 20,090 gzip bytes to provide the immediate loader, tracking, theme restoration, and localized copy without waiting for React.

## What changed in the branch

- Replaced the JavaScript/3D-dependent startup feedback with an inline HTML loader. It uses a Wavebar, real declared startup work, saved themes, and all ten interface languages. Native and React screens share their rendering and state; fixed text/list space prevents layout movement. Page content can replace it as soon as the route is ready, without holding content behind a forced 100% completion screen. The fill uses CSS independently of the decorative SVG.
- Split LandingPage out of the shared entry, so `/links` no longer needs its initial code or styles. Required active-route modules can preload while the shell downloads.
- Extracted the pet canvas drawings from the full lesson panel, removing unrelated app/lesson/translation imports while preserving the drawings.
- Split public-page translation dictionaries by language. The loader's much smaller dictionaries remain inline for immediate localization.
- Deferred the privacy Markdown renderer until its dialog opens. Deferred the public 3D renderer until page content paints, with a fade after its first rendered frame.
- Moved Firebase/Nostr startup and wallet preparation behind the public pages' first paint. Saved theme, language, keys, and cached profile checks remain available locally. Actions can start or await the shared preparation. Non-public route startup retains its backend requirement.
- Removed retired music behavior and replaced the browser favicon's 861,926-byte logo with a 5,570-byte icon (99.4% fewer icon bytes). Their separate time contributions are not claimed here.
- Added skill-tree lesson preparation when the modal opens and preparation of the next question during the current question, with the game RPQ exception. This improves lesson transitions; it is not credited toward the public-page timings.

These are combined branch results. This test cannot assign an exact number of milliseconds to each individual change.

## Remaining trade-offs and scope

- Fast-desktop landing startup needs follow-up. In one representative current trace, required JavaScript requests finished by about 74 ms, declared work reached 96% by 145 ms, and content committed at 474 ms. The installed React production source contains a 300 ms Suspense fallback throttle; the route/fallback handoff is a plausible contributor. This is an inference from the trace and installed source, not an isolated root-cause experiment.
- Optional 3D, backend preparation, and broad service-worker precaching still do work after the page opens. Initial JavaScript savings are not total-session download savings. The generated precache list changes from 83 to 148 entries.
- External HTTPS requests, APIs, WebSockets, and service workers were blocked in both builds to prevent backend writes and isolate startup code. Retired music requests were blocked in both versions, so the comparison does not credit the avoided audio download. Real reCAPTCHA/analytics/relay requests, network latency, hosting compression, browser caches, and phone hardware can change the results.
- These are local production-build comparisons, not newly measured live-production or real-user timings. Both builds rendered the expected page headings in every measured visit, with no uncaught page exceptions. No application code was changed during this review.

## Individual content-reveal samples

Values below are milliseconds, in run order.

| Scenario / page | Branch start | Current |
| --- | --- | --- |
| Mobile landing | 7170.5, 6962.1, 6975.3, 6966.4, 6973.8 | 3260.8, 3299.1, 3307.5, 3263.2, 3293.6 |
| Mobile `/links` | 8667.1, 8625.6, 8632.3, 8639.6, 8688.2 | 2919.4, 2917.4, 2899.1, 2897.4, 2915.8 |
| Desktop landing | 498.0, 344.1, 341.7, 338.1, 344.7 | 466.5, 462.5, 473.8, 475.8, 470.9 |
| Desktop `/links` | 565.4, 564.5, 556.4, 566.7, 554.1 | 395.1, 395.2, 387.9, 392.4, 389.9 |
