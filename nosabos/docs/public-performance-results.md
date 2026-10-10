# Public performance and SEO results

Measured October 10, 2026 against the local production build using Lighthouse
13.5.0 and Chrome 154. These are anonymous visits with all storage cleared,
standard simulated mobile throttling and a desktop profile. Production hosting
latency is not included.

## Results

The initial sweep of every generated public URL passed the 90 performance target on both profiles:
172 URLs, 344 audits, scores **92–100**. All 165 indexable URLs scored **100 SEO**;
these resolve to 150 canonical URLs. The seven utility routes intentionally use
`noindex`. Accessibility scored 92–100 and best practices scored 100 throughout.

| Page | Mobile performance | Desktop performance |
| --- | ---: | ---: |
| Homepage before changes | 36 | 69 |
| Homepage with the restored real orb | 97–98 | 100 |
| Links | 99 | 100 |
| Citizenship | 100 | 100 |
| All static learning pages | 100 | 100 |
| Arabic citizenship | 92 | 100 |

The homepage baseline used the same Lighthouse version and profiles against
unchanged commit `7ecdb97b`. Three repeat runs per profile on the homepage,
links, citizenship and Arabic citizenship confirmed every performance result
remained at least 92. That adds 24 audits after the final input-replay change.

After restoring the actual 3D orb, all ten localized landing pages, the English
alias and legacy links were measured again. Landing pages scored
97–98 mobile, 100 desktop and 100 SEO; legacy links scored 97 mobile and 100 desktop.
The combined coverage still has a minimum of 92 across the public URLs.

The [numeric summary](public-audit-summary.json) contains every page's scores
and timing measurements. Full Lighthouse reports remain in the ignored
`reports/lighthouse/final-all` and `reports/lighthouse/final-repeat` directories.

For manual verification, `npm run preview:public` serves this checkout's complete
build at `http://127.0.0.1:4173/`. Before restoring the orb, three additional homepage runs on each profile
against that exact URL scored 99 mobile, 100 desktop and 100 SEO in every run;
their reports are in `reports/lighthouse/preview-4173`. A Vite development server
on port 5173 in a different checkout does not serve these changes.

## Changes delivered

- Rendered public content into HTML, including localized titles, descriptions,
  canonicals, reciprocal language links, social previews and factual JSON-LD.
- Added learning pages for all twelve practice languages in all ten UI languages,
  using real beginner curriculum examples and links into the tutor.
- Generated the sitemap and robots file, excluded utility routes from indexing,
  and configured clean URLs, real 404 responses and HTML cache revalidation.
- Deferred expensive public visuals and account resources, self-hosted fonts,
  reduced the favicon, and avoided downloading the offline cache on a new public
  visit. The app starts after the initial content paints or immediately on input.
- Restored the actual voice orb automatically near the viewport, with its
  original animation and reactions, using the existing shared renderer.
- Preserved early input, sign-in clicks, language navigation, selected practice
  language and display names while the application loads.

## Verification

The production build passed. The public browser check verified status and
metadata on all 172 URLs and exercised representative pages, delayed application
loading, early typing and clicks, language changes, the tutor language selector,
the squircle controls and cached app-shell navigation. The focused tests passed
(29 tests), and new-file lint and whitespace checks passed.

The full suite passed 1,052 of 1,056 tests. The same four failures were reproduced
against the unchanged baseline: Arabic activity-menu copy, an extensionless
import in the daily headline tests, and two journey sound source-pattern checks.

The orb-restoration follow-up passed 31 focused orb, renderer, immersion and
Patreon-proof tests, plus the preview-server regression test. Browser checks
confirm the real header orb appears without a click. All public status,
metadata, hydration and early-input checks still pass.

## Local preview feature fixes

The original static preview did not forward Firebase Hosting's API routes and
did not reuse the registered development App Check token. Its new browser origin
therefore failed Firebase requests and returned HTML for Patreon API requests.
The preview now injects the existing development token into local responses only
and forwards the configured API paths to the existing Firebase Hosting backend.
The development token is absent from deployable files and repository artifacts.
Both preview tabs were refreshed so Firestore's shared connection could recover.

Live smoke checks passed for account, Teams and invite reads using the Firebase
SDK. A synthetic beginner immersion request returned HTTP 200 and three tasks
that passed the app's quality checks. An invalid Patreon test request reached
backend validation and returned JSON HTTP 400, confirming API forwarding.
These checks verify the reported backend failures; they do not constitute a
manual walkthrough of every authenticated feature or a live microphone session.

## Next iteration

Publish the complete production build to Firebase Hosting, then repeat audits on
`https://piyali.app` and inspect the deployed HTML and response headers. Search
Console verification is currently unknown; check ownership, submit the sitemap
and inspect representative localized URLs after publication.

Arabic citizenship has mobile layout shift of 0.168 despite meeting the score
target; reducing that shift is the next performance polish. Search results and
AI citations require observation after indexing. The technical SEO score does
not measure ranking, and localized content should receive ongoing language and
editorial review.

See [the implementation and deployment guide](performance-seo.md) for commands,
loading behavior and search-discovery follow-up.
