# Public performance and search discovery

The [October 10 audit results](public-performance-results.md) record the baseline,
all-page measurements and remaining deployment checks.

`npm run build` produces the client bundle, renders the public routes using
React on the server, emits language pages and metadata, and regenerates the
service-worker manifest from the finished HTML. Deploy the complete `dist`
directory, rather than the output of `build:client`.

Firebase Hosting serves clean URLs without trailing slashes. Public HTML uses
explicit revalidation headers matched to those URLs; hashed assets retain their
one-year immutable cache policy.

## Coverage

- Home, links and citizenship have separate URLs for all ten UI languages.
- Twelve practice languages each have a learning page in those ten UI languages.
  Their example phrases come from the existing beginner curriculum, and beta
  languages retain their beta labels.
- There are 172 public URLs, with 150 canonical indexable URLs. English aliases
  such as `/en/links` point to `/links` as their canonical.
- Callback, account and playground routes use `noindex, follow` and stay out of
  the sitemap. Unknown paths return an HTTP 404 through Firebase Hosting.

The HTML includes titles, descriptions, canonical and reciprocal `hreflang`
links, social previews and factual JSON-LD. Every indexable page has readable
content before JavaScript runs. Learning pages use native links and no executable
JavaScript. This also makes the content available to crawlers that do not render
the interactive application. It does not guarantee search rankings or AI citations.

## Loading behavior

Public HTML and route styles paint first. The small bootstrap starts the
interactive application after the browser confirms the first contentful paint.
Focus, a keypress, a pointer gesture or an input event starts it immediately.
Early edits and button clicks are replayed after hydration.

Signed-in visits, callbacks and cached app-shell navigation start immediately.
The snapshot path is checked before hydration, so a service-worker fallback
cannot be mistaken for a different route's server-rendered content.

Firebase, wallet, identity and audio resources load when their actions need them.
Public orbs automatically load the actual 3D renderer as they approach the viewport;
offscreen decorative canvases load near the viewport. The legacy cloud visual
animates on mouse hover. Fonts are self-hosted, and the favicon is a small SVG.
The offline app installs for signed-in learners and existing installations,
instead of downloading its entire cache on a first marketing visit.

## Verification

Use Node 22.19+ and an installed Chrome. `CHROME_PATH` can select a Chrome binary.

```sh
npm ci
npm run build
npm run test:seo
npm run check:public
npm run audit:public -- --runs=3 --assert
```

`check:public` checks every generated URL's status and metadata, exercises
representative routes in Chrome, and tests input and sign-in while the app chunk
is held back. Screenshots default to `/private/tmp/piyali-public-screenshots`.

The auditor uses Lighthouse's standard simulated mobile profile and a desktop
profile, clears all storage between anonymous visits, saves complete JSON
reports under `reports/lighthouse`, and reports
the median and minimum of each set of runs. `--assert` requires every run to
reach 90 performance and rejects missing metrics. Utility pages' intentional
`noindex` lowers their Lighthouse SEO category; only content pages should be indexed.

```sh
# Every generated URL, including all language variants:
npm run audit:public -- --all --runs=1 --assert

# Audit the deployed site after publishing:
npm run audit:public -- --origin=https://piyali.app --runs=3 --assert
```

Local scores exclude production hosting latency and should be confirmed on the
deployed site. Lighthouse SEO checks technical discoverability, not rankings.

For a manual Lighthouse audit, start `npm run preview:public` from the checkout
containing these changes and open `http://127.0.0.1:4173/`. This serves the same
complete production build as the automated audit. Port 5173 normally serves Vite
development code; a server started in another checkout will also miss these
changes. Use a clean anonymous browser session to match the saved measurements.

The preview also forwards `/api/patreon/*`, `/talkTurn` and `/tts` to the configured
Firebase Hosting site. Account actions therefore use the live backend. To test
Firebase-backed features locally, put the existing registered App Check debug
token in ignored `.env.development.local` as `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`.
The preview injects it into local HTML responses only; the deployable `dist`
files do not contain it. Refresh every open preview tab after configuration
changes, since Firestore shares its active connection between tabs.

## After deployment

Check whether the domain is verified in Google Search Console. If necessary,
verify it using DNS, submit `https://piyali.app/sitemap.xml`, and inspect the home,
links, citizenship and a few localized learning URLs. Review indexing exclusions
and real-user Core Web Vitals as data becomes available.

Future content should answer specific learner questions with useful examples,
clear authorship and links from relevant pages. Any claims about citizenship
eligibility should be maintained against current official sources. There is no
special AI ranking file needed for Google's AI features; its
[guidance](https://developers.google.com/search/docs/appearance/ai-features)
uses the same search-discovery foundations.
