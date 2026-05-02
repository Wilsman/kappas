# Sentry Common Production Issues

Captured: 2026-05-02 01:10 +01:00
Repo: `F:\task-tracker`
Sentry org/project: `ccc-l4` / `kappas`
Query: unresolved issues, `environment=production`, last 14 days, limit 50

## Most Common Groups

### 1. Stale dynamic import chunks for lazy views

- Representative issue: `KAPPAS-E`
- Sentry ID: `115290810`
- Count: 17 events
- First seen: 2026-04-26 12:23:54 UTC
- Last seen: 2026-05-01 11:14:55 UTC
- Route: `/`
- Error: `TypeError: Failed to fetch dynamically imported module: https://kappas.pages.dev/assets/CheckListView-MlhDbACQ.js`
- Sample browsers: Opera 130, Chrome 147 on Windows

Description:
Browsers are trying to load an old hashed lazy chunk after a deploy. This is the same stale-bundle family as prior `CheckListView`, `CurrentlyWorkingOnView`, and `StorylineQuestsView` chunk errors. The current app has stale asset reload handling in `src/utils/sentryNoiseFilters.ts`, `src/main.tsx`, and `src/components/LazyLoadErrorBoundary.tsx`, but this issue is still unresolved and regressed in Sentry.

Next checks:
- Confirm whether this event happened before or after the stale-asset reload patch was deployed.
- Check whether the old chunk URL returns Cloudflare Pages SPA fallback HTML instead of JavaScript.
- If events continue after deploy, inspect Pages caching headers for `index.html` and immutable asset files.

### 2. iOS DOM `NotFoundError` around Hideout routes

- Representative issues: `KAPPAS-T`, `KAPPAS-V`, `KAPPAS-10`, `KAPPAS-11`
- Sentry IDs: `115636585`, `115636592`, `116887323`, `116887325`
- Combined count: 21 events
- Highest individual count: `KAPPAS-T` with 11 events
- First seen: 2026-04-27 14:33:38 UTC
- Last seen: 2026-05-01 20:21:47 UTC
- Routes: `/Items/HideoutRequirements`, `/Items/HideoutStations`, `/`
- Error: `NotFoundError: The object can not be found here.`
- Sample browser: Chrome Mobile iOS 147 on iPhone
- Sentry metadata: `DOMException.code=8`, handled `yes`

Description:
This looks like browser DOM state getting out of sync during UI updates on the Hideout item pages. The Sentry function name is minified (`Z_`) and the issue is handled, so source maps or a production sourcemap lookup are needed to map it to the component. It may be related to image fallback handlers, virtualized/list rendering, or a Radix/portal DOM remove path.

Next checks:
- Pull sourcemapped stack frames from Sentry or upload/verify sourcemaps for the release.
- Reproduce on iOS or Chrome iOS by switching between Hideout Requirements and Hideout Stations while images/data load.
- If the stack maps near image `onError` handlers, prefer state-driven fallback rendering over direct DOM mutation.

### 3. Null item/id crashes during home-page derived data

- Representative issues: `KAPPAS-G`, `KAPPAS-Q`
- Sentry IDs: `115313223`, `115426267`
- Combined count: 14 events
- First seen: 2026-04-26 14:34:41 UTC
- Last seen: 2026-04-27 07:39:43 UTC
- Route: `/`
- Errors:
  - `TypeError: Cannot read properties of null (reading 'item')`
  - `TypeError: Cannot read properties of null (reading 'id')`
- Sample browser: Edge 147 on Windows
- Sample functions: `Object.j_ [as useMemo]`, `Array.forEach`

Description:
The app is assuming API or overlay records are non-null while building memoized home-page derived data. The `item` variant is handled in React flow; the `id` variant is an unhandled global error. This points to a mapper/reducer over task objectives, rewards, unlocks, or hideout requirements that does not guard against nullable nested API fields.

Next checks:
- Search home-page `useMemo` blocks and shared data builders for direct `.item` and `.id` access inside `forEach`/`map`.
- Compare current API payloads for null nested `item` or null item IDs.
- Add targeted null guards plus a service/util test with a null nested object fixture.

### 4. Lazy view export/property mismatch symptoms

- Representative issues: `KAPPAS-W`, `KAPPAS-R`, `KAPPAS-M`, `KAPPAS-K`, `KAPPAS-J`
- Sentry IDs: `115639561`, `115468677`, `115340550`, `115339658`, `115324078`
- Combined count: 11 events
- Routes: `/`, `/Current`, `/Storyline`
- Errors:
  - `Cannot read properties of undefined (reading 'CheckListView')`
  - `can't access property "CheckListView", e is undefined`
  - `Cannot read properties of undefined (reading 'CurrentlyWorkingOnView')`
  - `can't access property "CurrentlyWorkingOnView", e is undefined`
  - `Cannot read properties of undefined (reading 'StorylineQuestsView')`

Description:
These appear related to lazy-loaded view modules resolving to an unexpected shape or being partially loaded from a stale bundle. They overlap with the stale dynamic import family but show up after module evaluation rather than as a direct chunk fetch failure.

Next checks:
- Confirm whether the lazy imports in `src/App.tsx` unwrap named exports safely.
- Check whether current built chunks still contain the expected named exports.
- Treat as stale deploy noise first if the reported asset hash no longer exists in the live build.

### 5. Hideout Stations recursive crash

- Representative issue: `KAPPAS-13`
- Sentry ID: `116887638`
- Count: 2 events
- First seen: 2026-05-01 19:26:28 UTC
- Last seen: 2026-05-01 19:26:30 UTC
- Route: `/Items/HideoutStations`
- Error: `RangeError: Maximum call stack size exceeded.`
- Unhandled: yes

Description:
This is low volume but high severity. It likely comes from recursive traversal, derived station dependency resolution, or a render loop on the Hideout Stations view.

Next checks:
- Inspect station dependency traversal for cycles and add a visited-set guard.
- Check route-specific state effects for self-triggering updates.
- Add a fixture with cyclic station requirements if the traversal is in shared utils.

### 6. External Tarkov asset load failure

- Representative issue: `KAPPAS-7`
- Sentry ID: `115220274`
- Count: 1 event
- First/last seen: 2026-04-26 04:16:30 UTC
- Route: `/`
- Error: `TypeError: Load failed (assets.tarkov.dev)`
- Sample browser: Safari 26.4 on Mac

Description:
One Safari unhandled promise rejection from `assets.tarkov.dev`. This is external asset availability/browser networking noise, not a first-party API failure.

Current local fix:
`src/utils/sentryNoiseFilters.ts` now detects `Load failed` events only when the Sentry event metadata contains `assets.tarkov.dev`, and `src/instrument.ts` drops them in `beforeSend`.

## Notes

- Personal token was used only for Sentry API queries. Do not commit tokens.
- User, email, and IP fields were redacted by the Sentry helper before review.
- Re-run after the next deploy to separate already-fixed stale/noise events from active production regressions.
