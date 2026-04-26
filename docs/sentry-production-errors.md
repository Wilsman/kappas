# Sentry Production Error Checklist

Captured: 2026-04-26 12:18:43 +01:00
Refreshed: 2026-04-26 12:25:00 +01:00
Repo: `F:\task-tracker`
Sentry org/project: `ccc-l4` / `kappas`
Query: unresolved issues, `environment=production`, last 14 days

## Summary

- `environment=prod` returned no unresolved issues.
- `environment=production` returned 11 unresolved issues.
- Main pattern: stale deploy chunks/CSS assets after Cloudflare Pages deploys.
- Second pattern: React DOM reconciliation errors around `removeChild` / `insertBefore`.
- One issue appears to be the default Sentry test error and can likely be resolved/ignored after confirming no test button is exposed.

## Checklist

- [x] Mitigate stale dynamic import chunks after deploys.
  - Sentry issues: [`KAPPAS-C`](https://ccc-l4.sentry.io/issues/115276857/), [`KAPPAS-6`](https://ccc-l4.sentry.io/issues/115182580/), [`KAPPAS-5`](https://ccc-l4.sentry.io/issues/115182509/), [`KAPPAS-4`](https://ccc-l4.sentry.io/issues/115180428/), [`KAPPAS-3`](https://ccc-l4.sentry.io/issues/115159350/)
  - Count: 6 events across 5 grouped issues.
  - First seen: 2026-04-25 19:22:21 UTC.
  - Last seen: 2026-04-26 10:56:44 UTC.
  - Routes: `/`, `/Items/CollectorItems`, `/Items/TrackedItems`, `/Storyline`.
  - Errors:
    - `Failed to fetch dynamically imported module: https://kappas.pages.dev/assets/CheckListView-CdMXbzGU.js`
    - `Failed to fetch dynamically imported module: https://kappas.pages.dev/assets/CheckListView-B-gLrIiV.js`
    - `Failed to fetch dynamically imported module: https://kappas.pages.dev/assets/StorylineQuestsView-C139R_eH.js`
    - `error loading dynamically imported module: https://kappas.pages.dev/assets/TrackedItemsView-CCTi4BqS.js`
    - `Failed to fetch dynamically imported module: https://dev.kappas.pages.dev/assets/TrackedItemsView-CADh2hBW.js`
  - Suspected area: lazy-loaded views in `src/App.tsx` plus `src/components/LazyLoadErrorBoundary.tsx`.
  - Notes: the app already catches common chunk load messages and shows a refresh prompt. This may still be noisy in Sentry because the boundary reports the handled exception with `Sentry.captureReactException`.
  - Fix applied: `src/components/LazyLoadErrorBoundary.tsx` now attempts a one-time reload before reporting stale chunk failures, and `src/main.tsx` installs a Vite `vite:preloadError` handler for stale CSS/module preload failures.
  - Follow-up: watch Sentry after the next deploy. If these continue, inspect Cloudflare Pages caching headers and service-worker/browser-cache behavior.

- [x] Mitigate CSS preload failure after deploy.
  - Sentry issue: [`KAPPAS-D`](https://ccc-l4.sentry.io/issues/115278867/)
  - Count: 1 event.
  - First/last seen: 2026-04-26 11:08:11 UTC.
  - Route: `/Storyline/Ending/fallen`.
  - Error: `Unable to preload CSS for /assets/index-BZV40eAE.css`.
  - Suspected area: Vite asset preload behavior and Cloudflare Pages stale HTML/assets during deploy.
  - Fix applied: handled with the same one-time stale asset reload path as dynamic import chunks.
  - Follow-up: watch Sentry after the next deploy.

- [x] Filter known React DOM `removeChild` recoverable noise from Sentry.
  - Sentry issues: [`KAPPAS-B`](https://ccc-l4.sentry.io/issues/115233149/), [`KAPPAS-A`](https://ccc-l4.sentry.io/issues/115233147/), [`KAPPAS-9`](https://ccc-l4.sentry.io/issues/115227801/)
  - Count: 6 events across 3 grouped issues.
  - First seen: 2026-04-26 05:32:18 UTC.
  - Last seen: 2026-04-26 08:39:22 UTC.
  - Routes: `/`, `/Storyline`.
  - Error: `Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`
  - Suspected area: React reconciliation around frequently remounted keyed views, browser extensions mutating the DOM, or transition between view modes in `src/App.tsx`.
  - Fix applied: `src/main.tsx` now skips Sentry reporting for this known React recoverable DOM mutation signature.
  - Follow-up: if users report visible crashes around `/Storyline`, inspect breadcrumbs/session replay and try to reproduce by switching routes/views while data is loading.

- [x] Filter known React DOM `insertBefore` recoverable noise from Sentry.
  - Sentry issue: [`KAPPAS-8`](https://ccc-l4.sentry.io/issues/115224506/)
  - Count: 1 event.
  - First/last seen: 2026-04-26 04:51:41 UTC.
  - Route: `/Storyline`.
  - Error: `Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`
  - Suspected area: same family as the `removeChild` issues.
  - Fix applied: handled with the same React recoverable DOM mutation Sentry filter as `removeChild`.
  - Follow-up: triage with the `removeChild` cluster if this appears as a user-visible crash rather than handled noise.

- [ ] Check external image/load failure from `assets.tarkov.dev`.
  - Sentry issue: [`KAPPAS-7`](https://ccc-l4.sentry.io/issues/115220274/)
  - Count: 1 event.
  - First/last seen: 2026-04-26 04:16:30 UTC.
  - Route: `/`.
  - Error: `Load failed (assets.tarkov.dev)`.
  - Suspected area: third-party Tarkov image asset availability or browser/network blocking.
  - Next step: confirm whether this was an image element/network failure and whether it needs filtering, fallback images, or no action.

- [x] Resolve or ignore default Sentry test error.
  - Sentry issue: [`KAPPAS-2`](https://ccc-l4.sentry.io/issues/115159123/)
  - Count: 1 event.
  - First/last seen: 2026-04-25 19:20:55 UTC.
  - Route: `/Achievements`.
  - Error: `This is your first error!`
  - Suspected area: Sentry setup/test button or a manual test event.
  - Next step: verify no test trigger is present in production UI, then mark resolved in Sentry.

## Follow-up Commands

Refresh production unresolved issues:

```powershell
$env:SENTRY_ORG = "ccc-l4"
$env:SENTRY_PROJECT = "kappas"

python "C:\Users\myles\.codex\plugins\cache\openai-curated\sentry\b066e4a0\skills\sentry\scripts\sentry_api.py" `
  --org $env:SENTRY_ORG `
  --project $env:SENTRY_PROJECT `
  list-issues `
  --environment production `
  --time-range 14d `
  --limit 50 `
  --query "is:unresolved"
```

Pull event samples for one issue:

```powershell
python "C:\Users\myles\.codex\plugins\cache\openai-curated\sentry\b066e4a0\skills\sentry\scripts\sentry_api.py" `
  --org "ccc-l4" `
  issue-events <issue-id> `
  --environment production `
  --time-range 14d `
  --limit 5
```

## Notes

- Keep issue details short here; use the Sentry links for full event payloads and stack traces.
- Redact emails, IP addresses, tokens, and session identifiers before copying event details into this file.
- Rotate the personal token after this run because it was pasted into chat.
