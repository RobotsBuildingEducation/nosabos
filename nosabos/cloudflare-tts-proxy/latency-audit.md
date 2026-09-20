# TTS latency audit — 2026-09-19

The implementation and the measurement method are separate questions. Until a
Worker runs on Cloudflare, local measurements cannot select a hosting provider.
Neither provider removes WebRTC negotiation or OpenAI generation latency. After
SDP exchange, audio and data-channel messages travel between the browser and
OpenAI, not through either proxy.

| Claim | Finding and action |
| --- | --- |
| A generic prepared connection adds a configuration round trip. | Correct for the earlier change. Removed: the selected voice, locale/personality instructions, and audio format now accompany `response.create`. There is no `session.update` wait. Settings and inference cannot race. Prepared sessions still never generate audio before the user needs it and are never reused after speech. |
| The original Firebase client set everything during SDP and had no update wait. | Not true of this checkout's Git baseline. `git show HEAD:nosabos/src/utils/tts.js` sends raw SDP and sends `session.update` on data-channel open, waiting for `session.updated` with a 500 ms fallback. The Firebase handler supports JSON session settings, but the old narration client did not use that capability. Current on-demand playback sends them in the SDP request for both proxies. |
| Local workerd is not a fair Cloudflare-vs-Firebase test. | Correct. The comparison page explicitly identifies it as local. The quoted 15–25 ms and 150–350 ms network figures, assumed OpenAI regions, and “always slower” assertion have not been established for this app. A warm Firebase instance does not prove zero TCP/TLS cost. |
| Cloudflare edge startup determines total latency. | Incorrect. Handler startup, auth/key-cache misses, upstream SDP/session creation, browser WebRTC connection, and inference are separate stages. Neither the presumed Google/Azure adjacency nor the claimed Cloudflare lack of reusable upstream connections is evidence from our measurements. Test the deployed path and location; do not infer a winner from architecture alone. |
| Audio decoding/WAV conversion delays every first playback and every replay. | Incorrect. New recordings are processed only after complete live playout; repaired IndexedDB entries carry a preparation version and are not processed again. An old unprepared entry does incur one repair on read. Conversion has CPU and storage costs and can contend with subsequent work, but it cannot explain the initial silence of the same live narration. The latency page bypasses the entire cache/recorder/preparation path. |
| Rate limiting adds a distributed network round trip on each request. | Cloudflare explicitly documents same-machine cached counters with asynchronous synchronization, not a network wait in `limit()`. Retained the protection and exposed its measured wall time. |
| App Check adds cost absent from Firebase. | The deployed Firebase endpoint returned HTTP 401 with `Missing App Check token.` to an unauthenticated request during this audit. Its source default is not its effective deployed policy. The Worker verifies tokens on live hosts, caches signing keys per isolate for up to six hours, and uses jose/Web Crypto for RS256. New isolates or expired keys can incur a key fetch. Local testing explicitly bypasses validation, so verification did not cause the previously observed local delay. Timings now expose this stage; do not disable live verification to improve benchmark scores. |

The benchmark uses the same app code, model, voice, text, locale, and instructions
for both endpoints. It turns off speculative connections and all caching, runs
balanced sequences, retains failures, and observes actual decoded non-silent
stream samples rather than treating a server event as audible playback. Browser
and network state, CORS preflight caching, OpenAI prompt/server load, auth/JWK
caches, service configuration, and WebRTC routing still vary. Multiple trials
are required, with first-request behavior reported separately.

The test page makes no production configuration changes. After this audit, the
user approved a separate hosted staging Worker and local App Check setup. The
Worker is now deployed and only the local app points at it. Production users
remain on the existing Firebase endpoint; the frontend cutover is a separate
deployment that has not been approved or performed.

Harness verification (individual samples, not a provider benchmark): local
workerd SDP HTTP 1,523 ms, of which the upstream OpenAI call reported 1,502 ms,
rate limiting 1 ms, and local App Check bypass. SDP-to-data-channel 2,611 ms;
narration request-to-first decoded samples 1,284 ms; click-to-first samples
5,447 ms. The server output-start event preceded first decoded samples by
209 ms. The Firebase attempt was retained as a 401 failure, excluded from speed
statistics. A registered App Check debug token is required for the hosted test.

Hosted follow-up: a registered local App Check debug token resolved the Firebase
401 and authenticated Cloudflare staging successfully. A four-trial BAAB batch
completed all four narrations verbatim. Some trials ran in a hidden tab and were
excluded from aggregates. These results verify that both hosted paths work;
they are not sufficient to choose a latency winner. The staged Worker reported
`cloudflare-edge`, `verified`, and its serving colo in its responses.

Sources:

- [OpenAI response.create](https://developers.openai.com/api/reference/resources/realtime/client-events#response.create): response-scoped instructions and audio output voice/format.
- [Cloudflare rate-limit performance](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/#performance): same-machine counters and asynchronous backing-store updates.
- [Cloudflare local development](https://developers.cloudflare.com/workers/local-development/): workerd runs locally.
- [Cloudflare performance and timers](https://developers.cloudflare.com/workers/runtime-apis/performance/): clock advancement and limits of CPU measurement.
- [Firebase custom App Check verification](https://firebase.google.com/docs/app-check/custom-resource-backend): verification requirements and signing-key caching.
