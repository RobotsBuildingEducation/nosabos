# Public Firebase and Nostr startup — October 18, 2026

Firebase and Nostr initialization now start after the landing page or /links has replaced its startup screen and painted. Theme, language, saved-key checks, display name and profile-image restoration still use local storage immediately.

| Page | Before | After | Saved | Initial JavaScript (gzip) |
| --- | ---: | ---: | ---: | ---: |
| Landing page | 4.79 s | 3.44 s | 1.36 s (28.3%) | 657.4 → 403.6 KB |
| /links | 5.42 s | 3.10 s | 2.32 s (42.9%) | 791.8 → 375.6 KB |

These are three-run medians from production builds saved immediately before and after this change. The before build already includes the pet drawing extraction, on-demand privacy renderer, deferred 3D rendering and per-language public copy. The gains here are additional to that earlier work.

The timing measures mounted public content with its startup overlay removed. Account-dependent actions can still briefly wait for background preparation. Initial JavaScript counts compressed response bodies of scripts completed before that reveal, including selected language copy; response headers and subsequent background downloads are excluded. First visual feedback stays about 0.41 seconds in both builds.

## Behavior and scope

- Only LandingPage and LinksPage use the new public identity adapter. It mounts the original identity hook after the first paint and exposes its methods through a shared readiness promise. A Start/sign-in/profile action can initiate preparation immediately and wait for the same promise.
- /links still prepares a guest identity automatically, now after first paint. The landing page still generates a new identity only when the user starts. Existing private keys and extension markers are reused. Key preparation and authentication are serialized so automatic preparation cannot replace a sign-in. Browsers with Web Locks also coordinate generation across public tabs.
- Wallet hydration on /links runs after key preparation. Its original store loads dynamically, and the existing modal loading state remains visible until hydration finishes. The wallet card loads only when it is rendered.
- Firebase is no longer imported by the theme store just to read local preferences. Theme writes load persistence when needed. Public analytics/profile saves load shared Firebase actions when needed, and public background warmup starts the existing Firebase setup after paint.
- Non-public routes explicitly await Firebase setup in the existing route loader. Their direct identity hooks, wallet store and backend operations remain unchanged. Authenticated root visits still load the app through its existing route flow.
- External links preserve their normal navigation behavior. Launching Piyali also starts any pending identity preparation immediately; the app already observes saved-key storage events.

This moves work later; it does not remove the SDKs from the application or reduce every session’s total download. Existing service-worker precaching remains unchanged and may fetch other bundles for offline availability.

## Validation

- Production build passes.
- Both public routes’ initial static dependency graphs contain no Firebase, Nostr or wallet SDK code. Browser requests for those SDKs begin only after the startup overlay disappears.
- Browser tests deliberately hold backend downloads: both pages reveal their content and saved dark theme; an early landing-page Start click waits and prepares one distinct identity before requesting the app; /links profile controls open before backend readiness; new visitors receive keys after release; returning users retain their keys, saved profile name and Spanish language.
- A separate non-public /squircle check holds Firebase and confirms that route still waits for backend readiness before revealing its page.
- App code is deliberately blocked after the verified account handoff in the early-Start test; the test does not perform live signed-in database operations. External requests and WebSockets are blocked.
- All 62 focused public-page, startup, copy and loader tests pass. The seven new startup tests cover shared requests, import failure/retry, paint gating/cancellation, key reuse, authentication races and coordinated generation across tabs.
- Full suite: 1,122 passed, four existing failures: Arabic activity menu copy, dailyPlateHeadline’s extensionless useUserStore import, and two journey sound-effects assertions.
- New modules pass ESLint. Existing lint findings in LandingPage, LinksPage and main are unchanged. Diff whitespace checks pass.

## Measurement conditions

Local gzip server, fresh Chrome context per visit, 393 × 851 mobile viewport, 1.6 Mbps download, 150 ms latency, 4× CPU slowdown. Three visits per build and page, alternating before/after order, with no other browser checks running alongside the comparison. External requests, APIs, WebSockets and service workers are blocked to isolate startup code.

These are controlled local simulations, not live-production timings or measurements from a physical Pixel 5a. Service-worker activity, real account/relay requests, network and device performance can change the observed results.

## Individual page-reveal times

- /: before 4.970, 4.795, 4.775 s; after 3.438, 3.437, 3.436 s.
- /links: before 5.444, 5.396, 5.423 s; after 3.099, 3.094, 3.107 s.
