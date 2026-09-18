# Stale app management update plan

Date: September 18, 2026  
Status: Proposed implementation; this document does not change application behavior.

## Objective

Help installed PWA users discover and apply the latest available deployment during the same visit, without manually closing and reopening Piyali. Preserve active work, keep offline access usable, and verify that an attempted update actually changed the running build.

The proposed experience combines foreground update checks, downloads in the background, automatic application at clearly safe moments, and an **Update app** modal when the user should choose when to reload. A usable connection and a successful download are prerequisites; freshness cannot be guaranteed while offline.

## Current implementation and likely gaps

The following findings come from the local repository. The reported behavior has not yet been reproduced on the user's phone or verified against the currently deployed production assets.

| Area | Observed behavior | Planned improvement |
| --- | --- | --- |
| [PWA configuration](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/vite.config.js:26) | Uses `vite-plugin-pwa` with `registerType: "autoUpdate"`. | Replace unconditional activation/reload with an application-controlled policy. |
| [Update hook](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/hooks/useAppUpdate.js:6) | Registers immediately; checks at registration, on focus, on reconnect, and hourly. | Add foreground and restored-page checks, deduplication, explicit status, and bounded retries. |
| [Registration placement](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/App.jsx:2987) | The hook runs inside the lazily loaded main app. | Initialize update management before route-specific application code, including the landing page. |
| [Hosting configuration](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/firebase.json:22) | Explicitly revalidates `/sw.js`; no deployment version endpoint exists. | Add build identity and deliberate caching rules for version metadata and app HTML. |
| [Load error boundary](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/AppLoadBoundary.jsx:1) | Offers a plain reload and describes local-server failures. | Add production-appropriate recovery for stale assets and failed downloads. |

The existing plugin registration already contains automatic reload behavior. Installing a service worker, activating it, and loading its corresponding application code are separate steps. Investigation should distinguish a missed foreground check, slow/failed installation, missed activation/reload handling, and an older deployed client. Do not assume that enabling `skipWaiting` is the missing fix. See the [service worker lifecycle](https://web.dev/articles/service-worker-lifecycle).

## User experience

### Update modal

Create a modal using the app's existing Chakra styling and supported-language copy conventions.

| Element | Proposed copy or behavior |
| --- | --- |
| Title | **Update available** |
| Body | **A new version of Piyali is ready. Update now to use the latest improvements.** |
| Primary action | **Update app** |
| Secondary action | **Later** |
| Applying state | **Updating Piyali…** with duplicate submissions disabled. |
| Recoverable failure | **We couldn't finish the update. Try again when your connection is ready.** with **Try again** and **Later**. |

The primary action applies a downloaded update and reloads the app after the new worker takes control. It does not require reinstalling the PWA. Show the ready copy only after installation succeeds; finding a different build ID alone does not mean the download is ready.

Do not open this modal over an active lesson, recording, conversation, assessment, unsaved editor, payment, or authentication return. Keep a small **Update ready** indicator available and present the modal at the next safe boundary. If the user opens the indicator during protected work, explain that they must finish or save that activity before updating. Do not introduce a discard-work action in the initial implementation.

**Later** dismisses the modal and suppresses automatic reopening for that build during the current session. Keep the indicator available, and reconsider prompting on a later visit. It also suppresses automatic application for that session so dismissal has a predictable effect. Focus, visibility, and reconnect events must not each reopen the same modal.

Use accessible focus management and announcements. Permit normal dismissal before application begins, and restore dismissal/retry controls if application times out. Avoid progress percentages unless actual download progress is available.

### Automatic application policy

| Situation | Expected behavior |
| --- | --- |
| Cold start or return to an idle home screen, before interaction resumes | Apply an already downloaded update automatically if safety checks pass; show a brief updating state. |
| Download finishes after the user starts interacting | Show the indicator and offer the modal at a safe boundary. |
| Active or unsaved activity | Continue downloading; postpone activation and reload. |
| Activity completion and confirmed save | Re-evaluate safety; use the modal if the user is already interacting with results. |
| User selected Later | Preserve the current session; retain the indicator. |
| Offline, failed download, or unavailable version endpoint | Keep the working version usable and retry later. |

Do not infer safety from being on the home route alone: it can contain drawers, drafts, and transactions. Automatic updates require an explicit safe-state signal, no protected work, no active interaction, and coordination with other clients. If state is unknown, defer. Keep initial rendering responsive; do not hold startup indefinitely while checking or downloading.

## Implementation design

### 1. One update coordinator initialized at startup

Move registration out of `App.jsx` into a singleton coordinator initialized from [main.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/main.jsx:1). Mount a lightweight update UI/provider above route-specific content. Refactor `useAppUpdate` into a subscription to that coordinator rather than a registration owner.

The coordinator owns the registration, listeners, timers, update state, current attempt, and reload guard. Initialization must be idempotent so remounts cannot create duplicate registrations or timers. Retain service-worker-free local development and support browsers without service workers with a guarded version-check/manual-reload fallback.

Track these concepts separately:

- Running build ID, advertised deployment ID, and the target of the current attempt.
- Discovery status: idle, checking, different deployment detected, or check failed.
- Worker status: installing, waiting/ready, activating, or failed.
- UI policy: protected activity, ready to prompt, deferred by user, or safe to apply.
- Reload verification: expected target, attempted reload, success, or unresolved mismatch.

This prevents a failed metadata request from erasing an already downloaded update or a version mismatch from being treated as permission to reload.

### 2. Check when users return

Use `registration.update()` and the version check at startup, on `visibilitychange` when the document becomes visible, on `pageshow`, and on reconnect. Keep focus as a supplementary trigger. These browser events cover visibility changes and restored pages; see [visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) and [pageshow](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event).

Proposed initial settings:

- One in-flight check at a time; coalesce foreground events within 30 seconds.
- A periodic check every 15 minutes while visible; do not rely on background timers.
- A user-requested retry may bypass the ordinary throttle, but still joins an in-flight request.
- Give the metadata fetch a 10-second timeout. Bound retries and back off after failures; reconnect permits a fresh attempt.
- Handle network failures even when `navigator.onLine` reports true.

Inspect existing `registration.waiting` and `registration.installing` state at startup and on resume, in addition to listening for new events. Reconcile current state when resuming because an event may have occurred while a page was suspended. Recheck safety immediately before applying an update.

### 3. Build identity and an uncached deployment endpoint

Generate one opaque build ID per production build. Embed that same value into the application bundle and emit `dist/version.json` from the same build pipeline. Do not use the current `package.json` version (`0.0.0`) as the deployment identity.

Example metadata:

```json
{
  "buildId": "deployment-specific-id",
  "builtAt": "2026-09-18T12:00:00Z"
}
```

Fetch metadata with `cache: "no-store"`; exclude it from Workbox precaching and runtime cache routes. Validate the status, content type, and schema so an HTML SPA fallback is never accepted as metadata. A missing or invalid endpoint is an unavailable check, not an update and not a fatal app error.

A different ID triggers reconciliation and worker installation checks. Treat IDs as opaque values: a rollback is also a deployment change. The version endpoint must ship atomically with matching HTML, service worker, and assets; do not publish metadata ahead of its files.

### 4. Controlled activation and a single reload owner

Change `registerType` to `prompt` with deliberate waiting-worker behavior. The application decides when to apply a ready update. The plugin's [prompt mode](https://vite-pwa-org.netlify.app/guide/prompt-for-update) supports notifying the UI and triggering worker activation, but its generated registration also performs reloads. Its [automatic mode](https://vite-pwa-org.netlify.app/guide/auto-update) forces immediate-activation options and requires careful migration.

Use an application-owned Workbox registration wrapper for explicit activation and reload coordination. Declare `workbox-window` directly if imported; do not depend on an incidental transitive installation. Remove the old virtual registration owner when the wrapper takes over. Inspect the generated output to ensure no second registration or unconditional `skipWaiting` remains. Preserve existing precaching and the OAuth/API navigation exclusions.

Application sequence:

1. Confirm a waiting worker has successfully installed, or reconcile an update already activated elsewhere.
2. Confirm local and other-client safety; persist recoverable UI state and wait for relevant saves to settle.
3. Record the target build and attempt in session storage before activation.
4. Attach control-change listeners before sending `SKIP_WAITING` to the waiting worker.
5. Wait for the new worker to control the page, then reload once. Registration or download completion alone must not trigger reload.
6. On the next boot, compare the embedded running build with the expected target and refreshed deployment metadata. Record success only when the result is verified.

Reconcile an already changed controller instead of waiting forever for an event that has passed. Never reload on first installation merely because the page gained a controller. Activation timeouts restore a usable UI and retry path. They must not trigger a speculative reload.

Permit at most one automatic reload per target build per session, with a small overall automatic-attempt cap to prevent churn during rapid releases. If the same build returns, report a recoverable failure and offer an explicit retry. If deployment C supersedes target B, reconcile C as a new target without repeatedly reloading in a loop.

### 5. Protect active work and coordinate clients

Introduce a small update-safety interface through which features register blockers and persistence callbacks. Begin with an inventory of lessons, games, proficiency/citizenship assessments, conversations, recordings/uploads, unsaved settings or drafts, wallet actions, and Patreon authentication/subscription flows. Determine their actual save completion boundaries during implementation; clearing a modal or changing a route does not prove persistence succeeded.

Mount blockers for each feature's lifetime and clear them on successful completion or unmount. Default to protected while a feature's status is unresolved. A failed save blocks automatic reload and explains the necessary next step. Preserve identity and stored progress; updating must not clear local storage, IndexedDB, or wallet data.

Activation affects other pages sharing the registration. Coordinate readiness across those clients before activating, using a service-worker client inventory and messaging handshake; optional BroadcastChannel messages can supplement this. An unresponsive or protected client causes deferral, never assumed consent. Revalidate readiness immediately before activation and prevent new protected actions during an agreed handoff. A timeout releases the handoff and leaves clients usable.

Each controlled page independently enforces its reload guard. Explicitly test installed-window plus browser-tab combinations where the platform shares their registration; do not assume all platforms share their storage. Old clients without the new coordinator require the migration treatment below.

### 6. Hosting and stale-asset recovery

Keep `/sw.js` revalidated, serve `/version.json` with `Cache-Control: no-store`, and configure HTML to revalidate. Verify headers on `/`, direct `/index.html`, and rewritten application routes on a Hosting preview deployment. HTTP headers do not bypass an existing service-worker cache, so validate both layers. See [Firebase cache behavior](https://firebase.google.com/docs/hosting/manage-cache).

Keep long-lived immutable caching limited to content-hashed static assets. Preserve prior deployment assets through the supported update/rollback window where the hosting process allows it; document and test the retention policy. Do not assume Firebase deployment history automatically makes old asset URLs available on the current live site.

For a failed lazy import or stale chunk, connect the existing load boundary and Vite preload-error handling to the same coordinator. Distinguish a plausible stale asset from an ordinary application exception. Offer bounded update/reload recovery with offline-aware copy; do not reload all runtime errors or blindly unregister the worker and delete every cache.

## Delivery sequence

1. **Reproduce and capture a baseline.** Compare current production headers/assets with local configuration; record phone OS, browser, standalone mode, running build where identifiable, and worker states during an A-to-B deployment.
2. **Build the coordinator and metadata pipeline.** Add checks, states, attempt guards, diagnostics, and early startup initialization. Validate production-generated assets locally.
3. **Add the modal and protection interfaces.** Integrate activity blockers and save boundaries; implement client coordination. Start with manual application and keep automatic application disabled until protection tests pass.
4. **Test the registration migration.** Exercise the exact current production-style `autoUpdate` client upgrading to the new controlled worker, then that release upgrading again. Include users who skip intermediate deployments. An old running client cannot gain new safeguards retroactively, and may still reload according to its existing behavior during the transition. Do not claim the new protection guarantees for that legacy session.
5. **Validate on preview and physical phones.** Use production builds with service workers, an HTTPS preview origin, and sequential deployments. Run desktop automation alongside installed iOS and Android tests.
6. **Release controlled updates, then enable safe automation.** Ship manual application first, observe update failures and completion, and enable automatic application only for verified safe states. Test rollback as another coordinated deployment.

Implementation and production deployment are subsequent work; this plan itself publishes nothing. Forced minimum-version enforcement for critical releases is deferred to a separate policy decision, including backend compatibility and offline behavior.

## Planned code locations

| Location | Responsibility |
| --- | --- |
| Existing `vite.config.js` and `firebase.json` | Build metadata, controlled worker configuration, exclusions, and caching headers. |
| Existing `src/main.jsx` and `src/App.jsx` | Early coordinator/provider initialization, removal of nested registration, safety integration. |
| Existing `src/hooks/useAppUpdate.js` | Subscribe to update state and expose user actions. |
| Proposed `src/pwa/appUpdateCoordinator.js` | Discovery, registration lifecycle, client handoff, retries, and reload verification. |
| Proposed `src/pwa/updateSafety.js` | Blocker registration and persistence coordination. |
| Proposed `src/components/AppUpdateModal.jsx` | Ready, deferred, applying, and retry UI. |
| Existing `src/components/AppLoadBoundary.jsx` | Production load-error recovery connected to the coordinator. |
| Relevant activity components and focused tests | Declare safety and save boundaries; verify update behavior. |

## Validation and acceptance criteria

| Scenario | Required result |
| --- | --- |
| Installed A, deploy B, foreground A | Check begins after return; B becomes ready without force-closing the app. |
| Already waiting worker on startup | Ready state is discovered without needing a new installation event. |
| Update app pressed | Applies the ready worker and reloads once into the target deployment, subject to successful activation. |
| Fresh installation | No update modal or redundant reload just for installing the first worker. |
| Lesson, recording, unsaved draft, or transaction active | No automatic activation/reload; protection clears only at a real safe boundary. |
| Later selected | App remains usable; foreground events do not repeatedly reopen the modal. |
| Multiple same-registration clients | Protected/unresponsive clients defer activation; safe clients complete a coordinated handoff. |
| Offline, slow connection, failed precache, invalid metadata, or activation timeout | Working version remains usable; failures have bounded retry behavior. |
| Reload returns the same build | Guard stops automatic loops and offers recovery. |
| Deployment changes again or rolls back | Opaque build IDs reconcile correctly without an upgrade loop. |
| Landing page or standalone secondary route | Checks and update UI are available before the main app mounts. |
| Old lazy chunk disappears | Recovery is bounded; unrelated runtime errors do not trigger automatic reload. |
| Legacy autoUpdate client migrates, including skipped releases | Actual transition behavior is documented and tested. |
| Update completes | Identity, persisted progress, and relevant recoverable state remain intact. |

Use focused coordinator tests with fake time/events for deduplication, state transitions, blockers, failures, and attempt guards. Use browser integration tests with real sequential production builds for worker activation and cached navigation. Run the project build, applicable existing tests, and lint for changed files. Physical installed-PWA tests are required because desktop simulations alone do not establish iOS/Android resume behavior.

Record build IDs, lifecycle stages, durations, trigger reasons, deferrals, and failure categories through the project's existing diagnostics mechanism where available. Exclude credentials and user content. Measure discovery-to-ready time, successful application after an update action, stale builds after reload, and any protected-session interruption. Those measurements decide when automatic application is ready to enable.
