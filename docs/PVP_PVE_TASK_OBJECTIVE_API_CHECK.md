# PvP/PvE Task Objective API Check

Checked against `https://api.tarkov.dev/graphql` on 2026-04-23.

Freshness note: this was a one-off live snapshot against the same endpoint used
by `src/services/tarkovApi.ts` and the service tests. Recheck this document
after Tarkov wipes, major API/schema changes, or mode-specific objective
regressions. The LanguageTool "loose punctuation" hint on the Markdown lists is
a false positive.

Query shape:

```graphql
query CheckTaskObjectives {
  regular: tasks(lang: en, gameMode: regular) {
    id
    name
    objectives {
      description
      maps { name }
      ... on TaskObjectiveItem {
        items { id name }
        count
        foundInRaid
      }
      ... on TaskObjectiveShoot {
        count
      }
      ... on TaskObjectivePlayerLevel {
        playerLevel
      }
    }
  }
  pve: tasks(lang: en, gameMode: pve) {
    id
    name
    objectives {
      description
      maps { name }
      ... on TaskObjectiveItem {
        items { id name }
        count
        foundInRaid
      }
      ... on TaskObjectiveShoot {
        count
      }
      ... on TaskObjectivePlayerLevel {
        playerLevel
      }
    }
  }
}
```

Compared objective fields used by the app:

- `description`
- `maps { name }`
- `TaskObjectiveItem`: `items`, `count`, `foundInRaid`
- `TaskObjectiveShoot`: `count`
- `TaskObjectivePlayerLevel`: `playerLevel`

Implementation references:

- `src/services/tarkovApi.ts` owns the API query and cache normalization.
- `src/utils/taskProgressView.ts` maps equivalent task/objective progress across
  mode variants.

Summary:

- `regular` returned 494 tasks.
- `pve` returned 490 tasks.
- 22 task IDs were regular-only.
- 18 task IDs were PvE-only.
- For tasks with the same task ID in both modes, there were 0 objective differences in the app-consumed objective fields.

Most visible PvP/PvE differences are separate PvP/PvE zone task variants with different IDs, not same-ID objective changes.

Examples:

- `Easy Money - Part 1 [PVP ZONE]`
  - PvP ID: `66058cb22cee99303f1ba067`
  - PvE equivalent: `Easy Money - Part 1 [PVE ZONE]`
  - PvE ID: `6834145ebc1f443d7603c8a7`
  - Objective is effectively the same: plant the Arena advertisement poster in the living quarters at the Scav base on Customs.

- `Balancing - Part 2 [PVP ZONE]`
  - PvP ID: `66058cb9e8e4f17985230805`
  - PvE equivalent: `Balancing - Part 2 [PVE ZONE]`
  - PvE ID: `68341a0b2f0e2a7eb90b62d4`
  - Same objective: eliminate 2 PMC operatives while wearing PACA Soft Armor.

- `To Great Heights! - Part 4 [PVP ZONE]`
  - PvP ID: `66058cc72cee99303f1ba069`
  - PvE equivalent: `To Great Heights! - Part 4 [PVE ZONE]`
  - PvE ID: `683421515619c8e2a9031511`
  - Same objectives: hand over 1,000,000 roubles, win three out of six Arena matches, and fail if losing 4 matches.

- `New Beginning`
  - Regular mode returned multiple regular-only `New Beginning` task IDs.
  - No matching PvE-only `New Beginning` variants were returned in this check.
  - Regular-only objective sets differed materially, including variants with:
    - `Eliminate Scavs` x50
    - `Eliminate PMC operatives` x15
    - `Eliminate Raiders` x50
    - `Eliminate Rogues` x100

Conclusion:

If the app needs to distinguish PvP/PvE task objective behavior, compare by mode-aware task set first. Do not assume same-name tasks share IDs, and do not expect many same-ID objective payload differences based on this API check.
