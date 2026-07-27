# Patreon OAuth subscription verification

The subscription gate supports both the existing membership passcode and a
server-verified Patreon OAuth session. The browser never receives Patreon
tokens or decides whether a Patreon membership is eligible.

## Patreon client

Create an API v2 client in Patreon's Clients & API Keys portal. Register the
callback URL exactly as it appears in `PATREON_REDIRECT_URI`:

```text
https://your-host/api/patreon/callback
```

The integration requests only the `identity` scope. Patreon returns the user's
membership to the OAuth client's own campaign when `memberships` is included.

## Local configuration

Copy the non-secret values from `functions/patreon.env.example` into
`functions/.env`.

Create `functions/.secret.local` for emulator-only secrets:

```text
PATREON_CLIENT_SECRET=replace-with-v2-client-secret
PATREON_TOKEN_ENCRYPTION_KEY=replace-with-a-long-random-secret
```

Generate the encryption key with a password manager or a cryptographically
secure random generator. It protects OAuth access and refresh tokens stored in
the server-only `patreonOAuthSessions` Firestore collection.

Start the Functions emulator and Vite in separate terminals:

```sh
firebase emulators:start --only functions
npm run dev
```

Vite proxies `/api/patreon/*` to the local `patreonAuth` function. For a real
Patreon OAuth round trip, expose the Vite server through a temporary HTTPS
tunnel, register the tunnel callback with Patreon, and open the app through
that same tunnel hostname. Starting and finishing OAuth on the same hostname is
required for the HttpOnly state cookie.

Patreon does not provide a sandbox API. Use a separate Patreon patron account
for the final real-account check. The membership decision itself is covered by
local automated tests:

```sh
cd functions
npm test
```

## Production secrets

Store secrets in Firebase Secret Manager:

```sh
firebase functions:secrets:set PATREON_CLIENT_SECRET
firebase functions:secrets:set PATREON_TOKEN_ENCRYPTION_KEY
```

Set production values for `PATREON_CLIENT_ID`, `PATREON_CAMPAIGN_ID`,
`PATREON_REDIRECT_URI`, and `PATREON_APP_URL` in the Functions environment.
Deploy the function, hosting rewrite, and web app together only after the local
OAuth callback succeeds.

## Authorization rules

A Patreon account is accepted when all of the following are true:

- The membership belongs to `PATREON_CAMPAIGN_ID`.
- `patron_status` is `active_patron`.
- The currently entitled amount is greater than zero.
- The last charge is not declined or failed.
- If `PATREON_ALLOWED_TIER_IDS` is configured, at least one entitled tier is in
  that list.

The status endpoint rechecks Patreon every ten minutes by default. During a
short Patreon outage, a recently verified session receives a six-hour grace
period. Both values are configurable.
