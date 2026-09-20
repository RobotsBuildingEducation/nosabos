# Production cutover — September 19, 2026 (Mexico City)

The user explicitly approved publishing the production Worker, switching the
production frontend, and removing the Firebase function's reserved instance.

## Deployed configuration

- Worker: `nosabos-tts-proxy`
- Endpoint: `https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev`
- Active Worker version: `52cd5e68-1365-4ba8-b308-a8bc17a756ea`
- App Check required; approved origins and 120 sessions/minute/IP/location rate
  limit retained; Workers observability enabled; key stored as an encrypted secret.
- Hosting version: `a368ed3d33a59ce4`, released `2026-09-20T00:54:58.447Z`.
- Frontend build ID: `1789865545580-df9e536a`, built `2026-09-20T00:52:25.581Z`.
- Firebase `exchangeRealtimeSDP`: minimum instances 0, maximum 5, concurrency 80.
  Revision `exchangerealtimesdp-00049-dog` became active at
  `2026-09-20T01:01:11.765985506Z`. Both Cloud Run service and revision minimums
  were independently verified as zero; the new revision receives 100% of traffic.
- Local `.env.development.local` continues to use the separate staging Worker.

The production `.env` file is ignored by Git, as before. Its deployment setting is:

```dotenv
VITE_REALTIME_URL=https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev
```

## Verification

- 51 TTS tests passed; production build passed. The build includes the production
  endpoint and the warmup fix, excludes the staging endpoint and localhost App
  Check debug token, and does not publish the browser test pages.
- Worker health returned 200; `piyali.app` preflight returned 204; missing App Check
  returned 401; an unapproved origin returned 403.
- An authenticated, cache-bypassed browser narration through the production
  Worker completed with the full transcript and observed decoded audio. Response
  headers reported `cloudflare-edge`, `verified`, and `AMS`.
- The public site's build ID matches the deployed artifact. The app's update
  prompt applied successfully, and the live lesson Listen control was exercised
  without a reported TTS failure. No microphone permission was needed.
- After scaling, the Firebase fallback still returned 401 without App Check.
  The previous and copied source ZIP generations have matching checksums.
  The previous and new Cloud Run revisions have matching container environment,
  resources, service account, concurrency, timeout, and other compared service
  settings apart from the intended minimum-instance change.

Only `serviceConfig.minInstanceCount` was submitted to Google's PATCH API; no
local Functions source was uploaded. Google performed a managed rebuild and
updated its Node 20 builder image. The local `functions/index.js` mirrors the
zero minimum for future deployments. Other functions remain unchanged.

The Hosting CLI reported the already-existing unresolved `talkTurn` and `tts`
rewrites; their configuration was retained unchanged. This migration covers the
OpenAI Realtime SDP proxy, not other Firebase services or the Gemini Live backend.

## Compatibility, billing, and rollback

Open tabs/PWAs use the previous frontend until they accept the app update or load
the new version. They can still reach Firebase on demand. Zero minimum removes
the reserved warm-instance setting, not all usage, build, storage, or other
Firebase charges. Cloudflare and OpenAI usage remain subject to their own billing.

The previous Hosting version is `ba7e9da2804aff31`, released
`2026-09-19T07:48:13.562Z`; it can be selected in Firebase Hosting release history
for a frontend rollback if needed. Its Firebase endpoint remains deployed.
Alternatively, set `VITE_REALTIME_URL` back to
`https://us-central1-nosabo-30dcb.cloudfunctions.net/exchangeRealtimeSDP`, rebuild,
and publish Hosting. Raising Firebase minimum instances back to 1 is a separate
scaling change and restores the reserved-instance cost.

[Production Worker metrics and logs](https://dash.cloudflare.com/cfe53a18a4894aa8e5c2fe91af905d8a/workers/services/view/nosabos-tts-proxy/production)

[Firebase Hosting releases](https://console.firebase.google.com/project/nosabo-30dcb/hosting/sites/nosabo-30dcb)
