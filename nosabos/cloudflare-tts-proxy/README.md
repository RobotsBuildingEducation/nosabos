# Realtime SDP Worker

This Worker replaces Firebase `exchangeRealtimeSDP` for narration, speech practice,
and any OpenAI Realtime conversations using `VITE_REALTIME_URL`. It only exchanges
SDP; audio and data-channel events go directly between the client and OpenAI. The
player still waits for complete WebRTC playout before caching. Warmup prepares one
unused, receive-only WebRTC connection through the Worker while the visible app is
idle. A first uncached play claims it and sends that player's voice/instructions
in `response.create`, without a session-update acknowledgement or another SDP/ICE handshake.
Preparation sends no text, requests no audio, and never uses a microphone. A spare
is prepared while narration plays. Unused connections expire after four minutes
and close when the page is hidden, unloaded, or replaced by development hot reload.
Failures have a retry cooldown and fall back to an ordinary on-demand connection.
Prepared connections are not shared between players or reused after speaking, so
voice locking and conversation history cannot affect another narration.

While idle, a muted audio element consumes the prepared stream. Receiving RTP
without consuming it let Chrome accumulate silence and added seconds of delay
when Play finally attached an audio element. The silent consumer is detached
after the real player attaches; expiry, failure, page hide, and hot reload also
release it. If muted playback is blocked, preparation closes and ordinary
on-demand playback remains available.

On-demand connections receive narration settings in the initial SDP request.
Complete recordings are decoded offline and stripped of leading connection
silence, retaining 120 ms before speech and the entire ending. Existing v6 cache
entries are repaired once when loaded, without another OpenAI request or extending
their TTL. Older potentially truncated cache versions remain unusable.

Trimming uses 24 kHz PCM WAV because MediaRecorder's compressed files cannot be
safely cut at arbitrary byte offsets. Repaired entries therefore use more cache
space (about 3× in the measured sample); no-silence recordings keep their original
encoding. Offline decoding failures fall back to the original playable recording.

## Production deployment

The user approved the production cutover on 2026-09-19. The live frontend now
uses `https://nosabos-tts-proxy.robotsbuildingeducation.workers.dev`; the separately
named staging Worker remains the localhost default. The Firebase fallback has
minimum instances zero. See [the rollout record](production-rollout.md) for
deployed versions, verification, and rollback details.

Wrangler login, Worker deployment, and frontend publication are separate actions.
For a future approved production deployment:

```sh
npm ci --prefix cloudflare-tts-proxy
cd cloudflare-tts-proxy
npx wrangler login --scopes account:read user:read workers_scripts:write
npx wrangler deploy --env ""
npx wrangler secret put OPENAI_API_KEY --env ""
```

The initial deployment returns 503 until the secret is installed. Secrets must
never be placed in Wrangler `[vars]`, frontend `VITE_*` variables, or source control.
`wrangler.toml` targets the existing Cloudflare account and Firebase web app.

Set the app's `VITE_REALTIME_URL` to the deployed HTTPS URL, then rebuild/redeploy
the frontend. Keep `VITE_REALTIME_MODEL=gpt-realtime-2.1-mini` (also the default).
No client API key or Cloudflare API token belongs in the frontend.

## Access and limits

- Production POSTs require a Firebase App Check JWT for project `323662475274`
  and web app `1:323662475274:web:570aa2eb1beaf87810aff3`. Verification checks
  RS256 signatures, issuer, audience, expiration, type, and subject using cached
  Firebase public keys. No Firebase service-account secret is needed.
- Origins are explicitly listed in `ALLOWED_ORIGINS`. CORS is supplementary;
  requests without an Origin still require App Check.
- Only models in `ALLOWED_MODELS` can be selected, including JSON session overrides.
- The request body is capped at 64 KiB, and the OpenAI handshake has a 30 s timeout.
- Cloudflare limits attempts to 120/minute per IP per edge location. IPs can be
  shared by classrooms/mobile networks; tune this based on traffic. This is
  approximate abuse protection, not a global OpenAI spending cap or a session
  duration limit. Direct WebRTC sessions continue after the handshake.
- GET/HEAD `/health` checks configuration without calling OpenAI. OPTIONS does
  not need authentication. Session responses and errors use `Cache-Control: no-store`.
- Provider errors are sanitized; tokens, SDP, and OpenAI keys are not logged.

## Local verification

Copy `.dev.vars.example` to `.dev.vars` and supply an OpenAI key. Both `.dev.vars`
and `.wrangler` are ignored. `REQUIRE_APPCHECK=false` only works when the Worker
request URL is localhost/127.0.0.1/::1; it cannot disable verification on workers.dev.

```sh
# Terminal 1, repository root
npm run tts:dev
# Terminal 2; use an isolated Vite port if another app server is running
VITE_REALTIME_URL=http://localhost:8787 npm run dev:ui
# Automated checks
npm run tts:test
npm --prefix cloudflare-tts-proxy run check
```

This checkout now has a gitignored `.env.development.local` override pointing at
the deployed staging Worker. Vite excludes that development-only file from
production builds. Local workerd at port 8787 is optional; the command above
explicitly selects it when a local-runtime test is wanted.

Open `/tests/browser/tts-playback.html` on Vite. The first narration must produce
live audio and a complete recording; subsequent plays and a page reload must
replay the recording without another narration request. Background preparation
may still open one unused connection even when the requested text is cached.
Use a new phrase when testing an endpoint so an existing recording does not mask
a failed setup. `/tests/browser/tts-cache.html` inspects the ten newest recordings
without changing them or calling OpenAI, including their encoding, preparation
version, duration, and first sample above −60 dBFS. The comparison page below
bypasses recordings entirely.
For live Worker tests on localhost, register your Firebase App Check debug token
in Firebase Console → App Check → web app → Manage debug tokens. Never disable
production App Check to make a local test pass.

## Cutover and rollback

1. Deploy the Worker and secret, verify health, rejected unauthenticated requests,
   valid App Check requests, and real narration/replay.
2. Set `VITE_REALTIME_URL` to its URL, build, then deploy Firebase Hosting.
3. After the live cutover is verified, change `exchangeRealtimeSDP.minInstances`
   from `1` to `0` in `functions/index.js`, then run
   `firebase deploy --only functions:exchangeRealtimeSDP --project nosabo-30dcb`.
   Other Firebase functions remain untouched.
4. Roll back by restoring
   `https://us-central1-nosabo-30dcb.cloudfunctions.net/exchangeRealtimeSDP` in
   `VITE_REALTIME_URL` and rebuilding/redeploying the frontend. The fallback still
   works with zero minimum instances, but may have cold starts.

Workers removes the need for a reserved Firebase instance. Cloudflare's free tier
currently includes 100,000 requests/day and 10 ms CPU/invocation; OpenAI usage is
still billed separately. End-to-end latency includes App Check key fetches, TLS,
network transit, and OpenAI processing; this is not a guaranteed sub-5-ms handshake.

## Controlled latency comparison

Open [the development comparison page](http://localhost:5173/tests/browser/tts-latency.html).
It exercises the real player against endpoint A and endpoint B without changing
the app's endpoint. Both use new WebRTC sessions with the same model, narration
instructions, text, locale, and voice. This page disables background preparation,
all cache reads/writes, MediaRecorder, and audio re-encoding. Normal app playback
keeps its prepared connection and silence-repaired replay behavior.

The four-trial button chooses ABBA or BAAB to reduce order bias. Run multiple
batches in the foreground on the same device/network; export the individual
attempts, errors, median and p95 instead of comparing isolated best cases.
The first request, later requests, cached replay, and prepared-connection playback
are different workloads. Do not pool their measurements. A fresh WebRTC session
does not force a backend cold start, new TCP connection, or empty OpenAI prompt cache.

The page separates client App Check token acquisition, SDP HTTP (including any
CORS preflight), SDP-to-data-channel setup, model request-to-first decoded audio,
and total time until first decoded audio. Stream samples above -60 dBFS are
observed every ~20 ms, before output-device latency; this is not a microphone
measurement. OpenAI's `output_audio_buffer.started` is also logged separately.
There is no microphone permission or audio upload in the measurement code.

Worker responses expose `Server-Timing` for rate limiting, App Check validation
(including any signing-key retrieval), body parsing, the OpenAI SDP call, and
total handler time. `X-TTS-Runtime`, `X-TTS-AppCheck`, and `X-TTS-Colo` identify
local vs edge, verification vs local bypass, and serving location. Worker clocks
advance after I/O, so these are wall-time diagnostics, not precise CPU profiles;
zero does not prove zero CPU. The OpenAI duration includes upstream networking
and session creation; it does not separate DNS, TLS, and model service work.

**Staging is deployed and configured for local testing.** The endpoint is
`https://nosabos-tts-proxy-staging.robotsbuildingeducation.workers.dev`.
The development-only `VITE_REALTIME_URL` points there and a registered App Check
debug token is configured. Worker verification remains enabled. The public
frontend uses the separately deployed production Worker. The comparison page
permits the configured origin, the existing Firebase
origin, and that account's named staging and production Workers, only in development.

Observe it in the [staging Worker dashboard](https://dash.cloudflare.com/cfe53a18a4894aa8e5c2fe91af905d8a/workers/services/view/nosabos-tts-proxy-staging/production):
use **Metrics** for requests/CPU/errors and **Observability** for logs. The dashboard
shows Workers Logs enabled and no custom domains or routes. Cloudflare's URL uses
`production` for this separately named Worker's active deployment; that does not
mean the public app has been switched to it.

The `[env.staging]` configuration has its own Worker name and rate-limit
namespace, localhost-only CORS origins, mandatory App Check, and Workers logs.
Deployment uses `npx wrangler deploy --env staging`
and secret installation uses `npx wrangler secret put OPENAI_API_KEY --env staging`
from this directory. Neither command deploys the frontend or changes Firebase.

Firebase's source defaults App Check enforcement to false, but the deployed
endpoint returned HTTP 401 `Missing App Check token.` during this audit. The
local emulator/bypass configuration could not run the live comparison. After
registering the debug token, both Firebase and staging accepted authenticated
requests and completed real narration in the same browser test.
Missing server timings or auth metadata are
reported as unknown. Do not interpret authenticated Worker vs unauthenticated
Firebase timings as a pure hosting comparison. They compare the actual endpoint
pipelines; matched authentication policies and server instrumentation are needed
to isolate hosting alone. Also confirm both deployed proxies use the same OpenAI
project/model/service configuration before attributing a difference to hosting.

See [latency audit](latency-audit.md) for the review of the implementation claims.

References: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[rate limits](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/),
[Firebase JWT verification](https://firebase.google.com/docs/app-check/custom-resource-backend),
[OpenAI Realtime calls](https://platform.openai.com/docs/api-reference/realtime).

## Verification / rollout status

Implementation verified locally on 2026-09-19 with the real OpenAI key, Cloudflare
workerd, and Chrome: complete narration, a decodable saved recording, and replay
after reload with zero new WebRTC connections. A saved recording had 4.096 seconds
of startup silence; automatic repair reduced it to 0.120 seconds with zero new
connections. With a prepared connection, a fresh uncached narration began at
1.22 s after the click, versus 6.55 s in an earlier on-demand local test. These are
individual local measurements, not a Cloudflare edge-versus-Firebase benchmark;
those measurements used workerd on this machine. An immediate click before preparation
finishes still waits for setup. These earlier numbers used the server output
event, not a measurement at the speakers. Worker tests (11) and TTS/cache-audio tests (38)
pass; Worker lint,
Wrangler dry-run, and the frontend production build
pass. The broader app suite has two existing formatting-sensitive failures in
`journeySoundEffects.test.js` (648/650 passing).

After removing the prepared-session acknowledgement wait, a real browser run
sent the narration request at 0.01 s, completed the full verbatim transcript,
saved 15.83 seconds of audio with 0.120 seconds of leading silence, and replayed
locally without another narration. This verifies the response-scoped settings
path; it is not evidence of a provider speed advantage.

The user approved staging deployment on 2026-09-19, followed by the Wrangler
authorization grant. The staging secret is installed, `/health` returns 200 with
`cloudflare-edge`, and unauthenticated POSTs return 401. Four real authenticated
browser narrations completed (two staging, two Firebase), with verbatim output.
Some trials became hidden and were excluded from timing aggregates; this verifies
the hosted paths, not a statistical speed advantage. Use the foreground test page
for additional comparable measurements.

Production cutover was subsequently approved and completed: `.env` now points at
the production Worker, Firebase Hosting serves the updated player including the
idle-stream warmup fix, and `exchangeRealtimeSDP` has minimum instances zero.
The scaling change used the Cloud Functions API with the update mask
`serviceConfig.minInstanceCount`; Google performed its managed rebuild of the
existing function. The source file mirrors `minInstances: 0` for future deploys.
Other Firebase functions and hosting rewrites were not changed.

Existing open app versions can still call Firebase until they update. Keeping
the endpoint at zero minimum instances preserves that compatibility and removes
the reserved-instance requirement; it does not guarantee a zero total Firebase
bill. Actual usage, other services, and artifact storage can still incur costs.

The local debug token is named
`Nosabos local Cloudflare staging test 2026-09-19` in Firebase Console → App Check →
the web app → Manage debug tokens, where it can be revoked after testing. Its
value is stored only in ignored `.env.development.local` and
`.wrangler/staging-app-check.json`, both with owner-only file permissions.
The OpenAI key is stored as a Worker secret, not in frontend environment variables.
