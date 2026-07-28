# Patreon OAuth Improvement Plan

## Status

- Planning only. No recovery implementation should begin until this plan is accepted.
- Target branch: `codex/patreon-oauth`.
- This plan builds on the existing Patreon OAuth, Nostr challenge, persistent link, and session implementation.

## Objective

Allow a Patreon member who has lost an old Piyali key to replace the old Patreon-to-Piyali link with a newly created Piyali key. Add Patreon webhooks so cancellation, payment, and membership changes invalidate cached access promptly.

The recovery authority is a fresh, successful Patreon OAuth verification. The old Nostr private key is intentionally not required because the recovery case assumes it is unavailable.

After replacement:

- The Patreon account is linked to exactly one Piyali key: the new key.
- The old Piyali key can no longer restore Patreon access.
- Server-side sessions issued to the old key are invalidated.
- The new key receives a normal authenticated Patreon session.
- No Nostr private key is sent to or stored by the backend.
- Patreon membership changes can invalidate linked access without waiting for the next scheduled Patreon API refresh.

## Current Behavior

The current link transaction enforces both sides of a one-to-one relationship:

- A Piyali `npub` cannot be linked to a different Patreon user.
- A Patreon user cannot be linked to a different Piyali `npub`.

When a member signs into Patreon from a new Piyali key, the Patreon membership is correctly verified, but `linkPatreonAccount` raises `patreon_account_already_linked`. The callback redirects to `/subscribe?patreon=link_conflict`, and the user cannot recover without manually changing Firestore.

## Decisions

1. Preserve the one-Patreon-account-to-one-Piyali-key rule.
2. A fresh Patreon OAuth login can authorize replacement of the old Piyali key.
3. Replacement must require an explicit user action after OAuth; a conflict must never silently overwrite an existing link.
4. The new Piyali key must sign a short-lived, one-use `replace` challenge before the transfer is committed.
5. The old private key is not required.
6. The replacement is atomic: the old link is removed, the reverse mapping is changed, and the new session is created in one Firestore transaction.
7. Old sessions are invalidated both proactively and whenever `/status` is checked.
8. All new user-facing text must be localized for every supported support language.
9. Do not add a key-backup warning as part of this work.
10. Patreon webhooks are a fast invalidation signal, not the sole authorization source. Existing API verification remains the authority and fallback.

## Non-goals

- Recovering or displaying a lost `nsec`.
- Migrating learning progress, wallet data, or other Piyali data from the old key.
- Allowing one Patreon account to authorize multiple Piyali keys simultaneously.
- Removing the passcode fallback.
- Building a general account-recovery system unrelated to Patreon.

## Security Invariants

The implementation must maintain these rules:

- A Patreon replacement is available only after Patreon identifies the same active paid member already present in `patreonUserLinks`.
- The Patreon membership must pass the existing campaign, status, payment, entitlement, and optional tier checks before a recovery intent is created.
- The new `npub` must first prove possession of its private key through a valid Nostr signature.
- OAuth state, recovery state, and authenticated session cookies remain different typed values inside Firebase Hosting's `__session` cookie.
- OAuth state and recovery state are random, short-lived, single-purpose, and stored only as hashes in document IDs.
- A recovery intent cannot be used for a different Patreon user or a different new `npub`.
- Recovery confirmation is one-use and safe against replay.
- OAuth access and refresh tokens remain encrypted at rest.
- Logs and audit records must never contain OAuth tokens, an `nsec`, a signed event, or the raw temporary recovery secret.
- Concurrent replacement attempts must not produce two active Piyali links.
- A replacement cannot overwrite a new key that is already linked to a different Patreon account.
- Webhooks must be authenticated from the exact raw request body before their JSON data is trusted.
- A webhook for another campaign must never change Piyali access.
- Duplicate and retried webhook deliveries must be idempotent.
- A webhook may revoke access or force a fresh Patreon check, but it must never grant access without normal Patreon API verification.

## Proposed User Flow

### 1. Start from the new Piyali account

The user creates or signs into a new Piyali account and selects **Connect with Patreon** on `/subscribe`.

The existing flow remains in place:

1. Request a `link` challenge.
2. Sign the challenge with the new Piyali key.
3. Verify the proof on the backend.
4. Begin Patreon OAuth with state bound to the new `npub`.

### 2. Verify Patreon

The callback exchanges the code, fetches the Patreon identity, and applies the existing paid-membership rules.

If the Patreon account is not linked elsewhere, normal linking continues unchanged.

If the Patreon account is linked to a different Piyali key:

1. Do not replace anything yet.
2. Create a short-lived recovery intent containing the proposed old-to-new mapping.
3. Set a typed, secure, HTTP-only recovery cookie.
4. Redirect to `/subscribe?patreon=replace_required`.

### 3. Confirm replacement

The subscription page displays a localized recovery panel explaining that the Patreon membership is connected to another Piyali account.

It offers:

- **Replace old Piyali connection**
- **Cancel**

Selecting replacement silently signs a new Nostr challenge with action `replace` when Piyali holds the local `nsec`. A NIP-07 signer may show its normal signature approval prompt.

The browser sends the signed proof to `POST /api/patreon/replace-link`. No old key is requested.

### 4. Complete replacement

The backend verifies the recovery cookie and the signed `replace` proof, performs the atomic transfer, sets a normal authenticated session cookie, and returns `{ authorized: true }`.

The frontend marks Patreon as verified and routes the user into the app.

### 5. Cancel or expire

If the user cancels, the recovery record is removed and the recovery cookie is cleared.

If the user abandons the flow, the intent expires after 10 minutes. No account link changes.

## API Changes

### Existing: `POST /api/patreon/link-challenge`

Extend accepted actions from:

```text
link | restore
```

to:

```text
link | restore | replace
```

The `replace` proof uses the same five-minute, one-use challenge behavior and exact-event verification as the existing actions.

### Existing: `GET /api/patreon/callback`

Change only the `patreon_account_already_linked` path:

- Keep `piyali_key_already_linked` as a hard conflict.
- Convert `patreon_account_already_linked` into a pending recovery intent.
- Store the newly issued encrypted Patreon tokens in the recovery record so the completed link uses fresh credentials.
- Set `__session=oauth-recovery.<opaqueRecoveryId>` with `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and a 10-minute maximum age.
- Redirect with `patreon=replace_required`; do not place the recovery secret in the URL.

### New: `POST /api/patreon/replace-link`

Request body:

```json
{
  "challengeId": "opaque challenge id",
  "signedEvent": {
    "id": "nostr event id",
    "pubkey": "new key in hex",
    "sig": "nostr signature",
    "kind": 27235,
    "created_at": 0,
    "tags": [],
    "content": "server-generated challenge content"
  }
}
```

Required checks:

1. Method is `POST`.
2. Patreon configuration is complete.
3. Recovery cookie is present and correctly typed.
4. Recovery record exists, is pending, and is not expired.
5. The `replace` challenge is valid and unused.
6. The proof's `npub` equals the recovery intent's new `npub`.
7. The reverse Patreon mapping still points to the expected old key.
8. The new key is not linked to a different Patreon user.
9. The authorized Patreon record is still recent enough to complete the transfer. If necessary, re-evaluate it before the transaction.

Success response:

```json
{
  "authorized": true,
  "replaced": true
}
```

The response replaces the recovery cookie with the normal 30-day authenticated session cookie.

Expected failures should use stable machine-readable errors, including:

- `replacement_unavailable`
- `replacement_expired`
- `replacement_state_changed`
- `invalid_nostr_proof`
- `piyali_key_already_linked`
- `membership_not_active`
- `patreon_unavailable`

### New: `POST /api/patreon/cancel-replacement`

- Delete the pending recovery record when possible.
- Clear the recovery cookie.
- Return `{ ok: true }` even if the record has already expired or disappeared.

### New: `POST /api/patreon/webhook`

This endpoint is called by Patreon, not by the Piyali frontend. It does not use the browser session cookie.

Required processing order:

1. Read the exact raw request bytes without re-serializing the parsed JSON body.
2. Calculate the Patreon-specified HMAC-MD5 digest using `PATREON_WEBHOOK_SECRET`.
3. Compare it to `X-Patreon-Signature` using a timing-safe comparison.
4. Reject missing or invalid signatures before reading membership fields.
5. Read and allowlist the `X-Patreon-Event` trigger.
6. Confirm `data.relationships.campaign.data.id` matches `PATREON_CAMPAIGN_ID`.
7. Build an idempotency key from the event name, signature, and raw body hash.
8. Ignore a delivery that has already been processed successfully.
9. Resolve the Patreon user from `data.relationships.user.data.id` and locate its reverse link.
10. Apply the event policy below and return a success response quickly.

Initial trigger allowlist:

```text
members:create
members:update
members:delete
members:pledge:create
members:pledge:update
members:pledge:delete
```

Webhook event policy:

- Explicit deletion, inactive patron status, declined/failed payment, or zero paid entitlement immediately marks the linked account unauthorized and revokes its sessions.
- Active-looking, newly created, upgraded, or renewed membership data marks the account `verificationRequiredAtMs` so the next status request bypasses the 10-minute cache and verifies through Patreon's identity API.
- A webhook never changes an unauthorized account to authorized by itself.
- Unknown events, unlinked Patreon users, and duplicate valid events return success without changing access so Patreon does not retry them indefinitely.
- Invalid signatures and wrong-campaign payloads are rejected and recorded without logging the full body.

Refactor the membership checks shared by OAuth and webhooks into a helper that can evaluate a single Patreon Member resource. OAuth continues to wrap that helper with identity and campaign-selection logic.

### Webhook configuration

- Add `PATREON_WEBHOOK_SECRET` to Firebase Secret Manager and the `patreonAuth` function's declared secrets.
- Configure `https://piyali.app/api/patreon/webhook` in Patreon's Platform Portal after the endpoint is deployed.
- Configure the webhook once as the creator; do not add creator webhook-management scopes to every member's OAuth request.
- Keep the member OAuth scope at `identity`.
- If the webhook becomes paused after delivery failures, restore it in Patreon only after the endpoint is healthy.

## Firestore Data Model

### Existing account link

```text
patreonAccountLinks/{sha256(npub)}
```

Continue storing the authorized Patreon record and public-key identifiers. Add `npubHash` explicitly for consistency and session invalidation.

### Existing reverse link

```text
patreonUserLinks/{sha256(patreonUserId)}
```

Continue storing exactly one `npubHash`.

### New recovery intent

```text
patreonLinkRecoveries/{sha256(recoveryId)}
```

Proposed fields:

```text
status: "pending" | "completed" | "cancelled"
patreonUserId: string
patreonUserHash: string
previousNpubHash: string
nextNpub: string
nextNpubHash: string
nextHexPubkey: string
authorized: true
memberId: string
tierIds: string[]
entitledAmountCents: number
lastVerifiedAtMs: number
oauthExpiresAtMs: number
encryptedAccessToken: string
encryptedRefreshToken: string
createdAtMs: number
expiresAtMs: number
completedAtMs: number | null
```

The raw recovery ID is never stored. The record contains only encrypted OAuth tokens, never an `nsec`.

### Session changes

New linked sessions should include:

```text
linkedNpubHash: string
linkedPatreonUserHash: string
```

Keep `linkedNpub` temporarily for compatibility with sessions already issued by the current implementation.

### Audit events

Add server-only audit records for:

- `replacement_requested`
- `replacement_completed`
- `replacement_cancelled`
- `replacement_rejected`

Audit data may include hashed Patreon and `npub` identifiers, timestamps, and rejection reasons. It must not include OAuth tokens, cookie values, private keys, or signed events.

### Webhook receipts

```text
patreonWebhookReceipts/{sha256(eventName + signature + rawBodyHash)}
```

Store only minimal delivery metadata:

```text
eventName: string
campaignId: string
patreonUserHash: string | null
result: "processed" | "ignored" | "rejected"
reason: string
receivedAtMs: number
expiresAt: Firestore timestamp
```

Use the receipt document as the idempotency guard. Do not store the webhook body. Retain receipts only long enough to cover Patreon retries and operational investigation.

## Atomic Transfer

The replacement transaction must:

1. Read and validate the recovery record.
2. Read the reverse Patreon mapping.
3. Read the old account-link record.
4. Read the proposed new account-link record.
5. Confirm the mappings still match the state captured after OAuth.
6. Generate the new browser session ID before entering the transaction and use only its SHA-256 hash as the session document ID.
7. Write the authorized Patreon record to the new account-link document using the fresh encrypted tokens.
8. Update the reverse Patreon mapping to the new `npubHash`.
9. Delete the old account-link document.
10. Create the new browser-session document in the same transaction.
11. Mark the recovery record completed in the same transaction.

When marking the recovery complete, remove the encrypted OAuth token fields from the recovery document. Keep only the minimal completed metadata needed for idempotency, then remove the document through TTL.

Creating the new session in the transaction prevents a partial result where the link moves successfully but the user receives no usable session.

The transaction must be retry-safe. If Firestore retries it, the final state must still contain one Patreon mapping, one new account link, and one new session.

## Invalidating the Old Key

Deleting the old account link is not sufficient because current session documents contain their own encrypted Patreon tokens.

Two protections are required:

### Status-time validation

For linked sessions, `/status` must verify that:

- `patreonAccountLinks/{linkedNpubHash}` still exists.
- It still contains the same Patreon user.
- `patreonUserLinks/{patreonUserHash}` still points back to that `linkedNpubHash`.

If any check fails, delete the session, clear its cookie, and return unauthorized.

### Proactive deletion

After the transfer transaction commits, query sessions by the old `linkedNpubHash` and delete them in bounded batches. Failure to clean up must be logged and retried, but status-time validation remains the security backstop.

The frontend should also recheck Patreon access when the app regains focus or visibility. An already-rendered page cannot be remotely erased, but the next status check must lock the old account.

## Webhook-driven Membership Invalidation

Webhook handling and lost-key replacement share the same session-revocation helper.

For an explicitly inactive or unpaid member event:

1. Mark the account link unauthorized with a stable reason and `lastWebhookAtMs`.
2. Invalidate sessions using `linkedPatreonUserHash` and `linkedNpubHash` in bounded batches.
3. Record a sanitized audit event and idempotency receipt.
4. Leave the one-to-one Patreon/key mapping in place so the same key can regain access if the member renews.

For active-looking membership changes:

1. Set `verificationRequiredAtMs` on the account link.
2. Ensure `evaluateStoredPatreonRecord` ignores its 10-minute success cache while that marker is newer than `lastVerifiedAtMs`.
3. Require the next `/status` or `/key-status` call to use the Patreon API.
4. Clear the marker only after a successful authoritative check.

Webhook delivery does not replace focus/reload checks. It updates server state quickly, while the browser learns about that state on its next status request.

## Frontend and Localization

### `src/App.jsx`

- Recognize `patreon=replace_required`.
- Add `handlePatreonReplacement`.
- Request and sign a `replace` challenge for the active `npub`.
- Call `/api/patreon/replace-link`.
- On success, set Patreon verified and remove recovery query parameters.
- On expiration or changed state, return to the normal Connect with Patreon flow.
- Recheck Patreon status on window focus or document visibility restoration with a debounce to prevent excess requests.

### `src/utils/patreonNostrProof.js`

- Permit the new `replace` action.
- Continue signing locally with `local_nsec` or through NIP-07.
- Do not add any API that exposes the private key.

### `src/components/SubscriptionGate.jsx`

- Replace the generic conflict message for `replace_required` with a dedicated recovery panel.
- Add localized **Replace old Piyali connection** and **Cancel** actions.
- Disable repeat submissions while the replacement request is in flight.
- Keep the existing passcode and standard Patreon connection sections unchanged.

### Localization requirement

Add complete replacement copy for every language currently represented in `SUBSCRIBE_COPY`. Add a test that fails if any supported language is missing any new recovery key.

## Rate Limits and Abuse Controls

Before enabling the flow publicly:

- Limit pending recovery creation by Patreon user hash, new `npub` hash, and IP address.
- Permit no more than three completed replacements for one Patreon account in 24 hours without admin intervention.
- Permit only one active recovery intent for the same Patreon account and new `npub`; creating another invalidates the previous intent.
- Use generic public errors while recording specific server-only rejection reasons.
- Never reveal the full old `npub` to an unverified browser.

These limits reduce link-flipping and automated OAuth abuse while leaving normal lost-key recovery available.

## Expiration and Cleanup

- Nostr challenges: five minutes, one use.
- OAuth link state: ten minutes, one use.
- Recovery intent: ten minutes, one use.
- Authenticated browser session: existing 30-day configuration.
- Webhook idempotency receipt: retain for 30 days, then remove through TTL.

Add Firestore TTL-compatible timestamp fields for challenge, OAuth-state, recovery, webhook-receipt, and expired-session documents. Logical expiry checks remain mandatory because TTL deletion is asynchronous.

## Test Plan

### Pure/unit tests

- A valid `replace` event verifies only for the intended new key.
- Wrong action, wrong key, tampered content, expired challenge, and replay are rejected.
- Patreon membership must be active and paid before a recovery intent is created.
- A normal first-time link does not create a recovery intent.
- `piyali_key_already_linked` remains a hard conflict.
- `patreon_account_already_linked` creates a pending intent instead of changing either link.
- Recovery cookie types cannot be used as OAuth state or authenticated sessions.

### Firestore transaction tests

- Successful replacement leaves exactly one reverse Patreon mapping.
- The old account-link document is deleted.
- The new account-link document contains the new `npub` and fresh encrypted OAuth tokens.
- A new authenticated session is created atomically.
- Concurrent replacement attempts cannot authorize two keys.
- A changed reverse mapping causes `replacement_state_changed`.
- A new key linked to a different Patreon user cannot be overwritten.
- Retrying the same completed recovery is safe and does not duplicate state.

### Session tests

- Old sessions fail `/status` after replacement.
- New sessions pass `/status`.
- Proactive session cleanup does not delete the newly created session.
- Legacy unlinked sessions follow an explicit compatibility policy and expire normally.

### Webhook tests

- A correctly signed raw payload is accepted.
- Missing, malformed, or incorrect signatures are rejected.
- Verification fails if the body changes after signing.
- A valid webhook for another campaign cannot change access.
- Duplicate delivery of the same event is idempotent.
- Inactive, deleted, declined, failed, and zero-entitlement events revoke sessions.
- Active-looking events force the next API verification but do not grant access directly.
- Unlinked Patreon users return success without creating account data.
- Unknown event types are ignored safely.
- Webhook logs and receipts contain no body, email, token, cookie, or private key.
- The handler uses `req.rawBody`; JSON re-serialization is never used for signature verification.

### Frontend tests

- `replace_required` renders the replacement controls.
- Replacement signs with the active new key.
- Success unlocks the app.
- Cancel clears the recovery state.
- Expired recovery returns to Connect with Patreon.
- Double-clicking cannot submit twice.
- Every supported language contains complete recovery copy.
- Focus/visibility rechecks are debounced.

### Local integration tests

Use the Firebase emulators and an injected mock Patreon API to exercise:

1. Link Patreon user A to old key A.
2. Create new key B.
3. OAuth as Patreon user A from key B.
4. Confirm that the old mapping remains unchanged before confirmation.
5. Confirm replacement from key B.
6. Verify key B restores access in a fresh browser.
7. Verify key A cannot restore access.
8. Verify an existing key-A session becomes unauthorized.

Use a separate Patreon OAuth test client and callback URL for the final real-provider test before production.

For the webhook staging test:

1. Configure a staging webhook and secret.
2. Send a real Patreon test delivery.
3. Confirm the signature is accepted and a receipt is written.
4. Confirm an inactive test member revokes the linked session.
5. Replay the same delivery and confirm no second state change occurs.

## Implementation Phases

### Phase 1: Refactor for testability

- Extract account-link conflict classification from the callback.
- Extract browser-session record construction so it can participate in a transaction.
- Add helpers for typed recovery cookies and records.
- Expand handler-level Firestore mocks or emulator tests.

### Phase 2: Backend recovery intent

- Add `replace` Nostr challenges.
- Create recovery records on the correct callback conflict.
- Add recovery cookie handling.
- Add cancellation and expiration handling.

### Phase 3: Atomic replacement and revocation

- Implement `/replace-link`.
- Add new session linkage fields.
- Add status-time mapping validation.
- Add old-session batch cleanup.
- Add audit events and rate limits.

### Phase 4: Patreon webhooks

- Add raw-body signature verification and the webhook secret.
- Add the trigger allowlist, campaign validation, and idempotency receipts.
- Add webhook-driven cache invalidation and session revocation.
- Refactor membership evaluation for a single Member resource.
- Add webhook unit, transaction, and staging-delivery tests.

### Phase 5: Frontend and localization

- Add the replacement panel and actions.
- Add all localized strings.
- Add focus/visibility status rechecks.
- Add frontend behavior and localization tests.

### Phase 6: Local and staging validation

- Run backend tests, full app tests, lint, and production build.
- Exercise the complete flow in Firebase emulators.
- Exercise one real Patreon replacement with the non-production OAuth client.
- Exercise one signed webhook delivery and replay in staging.
- Confirm no secrets or private keys appear in browser requests, Firestore, or logs.

### Phase 7: Production rollout

- Deploy backend support before exposing the frontend action.
- Store the production webhook secret and configure the production Patreon webhook only after the endpoint passes its smoke test.
- Enable the UI after backend smoke tests pass.
- Monitor replacement requested/completed/rejected counts, callback errors, webhook signature failures, and Patreon delivery failures.
- Keep manual admin recovery available during the initial rollout.

## Rollback

- Hide or disable the replacement UI.
- Keep existing OAuth linking and key-based restoration operational.
- Pause or remove the Patreon webhook before rolling back its endpoint.
- Pending recovery records may expire naturally and be removed by TTL.
- Completed replacements remain valid one-to-one links; rollback must not attempt to restore old mappings automatically.

## Acceptance Criteria

The work is complete only when all of the following are true:

- A paid Patreon member linked to an old key can explicitly replace it with a new signed key.
- The old private key is never required.
- The old link remains active until the user confirms replacement.
- Confirmation produces exactly one active Patreon-to-Piyali mapping.
- The old key cannot silently restore access after replacement.
- Existing sessions associated with the old key fail their next status check.
- The new key can restore access in a fresh browser session without repeating Patreon OAuth.
- Inactive or unpaid Patreon memberships cannot create or complete recovery.
- Correctly signed Patreon membership changes invalidate cached state promptly.
- Webhook retries do not repeat revocation work or corrupt mappings.
- A webhook cannot grant membership access without an authoritative Patreon API check.
- Expired, replayed, mismatched, or concurrent recovery attempts fail safely.
- No Nostr private key or plaintext Patreon token is stored or logged.
- Recovery UI is complete in every supported language.
- All automated tests, lint checks, and the production build pass.

## Future Work Outside This Plan

- A user-facing connected-account and session-management page.
- Progress migration between Piyali identities.
- Removal or replacement of the shared passcode fallback.
- Firebase App Check and broader endpoint abuse protection.
