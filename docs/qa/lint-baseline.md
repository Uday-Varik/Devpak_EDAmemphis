# Lint baseline: d9766ca (before fixes) vs origin/main

## Method

- Command, run inside each worktree: `npx eslint src -f json -o <file>`
- Baseline: `d9766ca` (state before the fix PRs), linted in a temporary worktree.
- Main: `origin/main` at `a492d7b`, linted in the QA worktree.
- Counts come from the JSON output: `severity 2` = error, `severity 1` = warning.
- Install note: `origin/main`'s `package-lock.json` is out of sync with `package.json`
  (`npm ci` fails: missing `xlsx@0.18.5`, `@testing-library/dom@10.4.2`, and others).
  Both trees were installed with `npm install --no-save --ignore-scripts`, which leaves
  the lockfile unchanged. The esbuild postinstall script was skipped; lint does not need it.

## Totals

| Metric | d9766ca (baseline) | origin/main | Change |
|---|---|---|---|
| Errors | 369 | 365 | -4 |
| Warnings | 34 | 36 | +2 |
| Files linted | 167 | 183 | +16 (new files) |

## Counts by rule

| Rule | Level | Baseline | Main | Change |
|---|---|---|---|---|
| `@typescript-eslint/no-explicit-any` | error | 355 | 352 | -3 |
| `@typescript-eslint/no-empty-object-type` | error | 2 | 2 | 0 |
| `react-hooks/rules-of-hooks` | error | 9 | 9 | 0 |
| `no-empty` | error | 1 | 0 | -1 |
| `no-useless-escape` | error | 1 | 1 | 0 |
| `prefer-const` | error | 1 | 1 | 0 |
| `react-hooks/exhaustive-deps` | warn | 20 | 20 | 0 |
| `react-refresh/only-export-components` | warn | 13 | 15 | **+2** |
| (no rule id) | warn | 1 | 1 | 0 |

## Rules and files whose counts changed

| Rule | File | Baseline | Main | Caused by |
|---|---|---|---|---|
| `react-refresh/only-export-components` | `src/components/builder/CashNotInvested.tsx` | 0 | 2 | Fix #9/#28 (`3b8cd63`, `7696a8c`): exports constants and functions next to the component |
| `react-hooks/exhaustive-deps` | `src/pages/Dashboard.tsx` | 1 | 2 | Fix #25 (`30da92d`): dependency list omits `toast`. Removed the old `fetchData`/`navigate` warning, added one for `toast` |
| `react-hooks/exhaustive-deps` | `src/pages/ProjectBuilder.tsx` | 1 | 0 | Fix #26 (`a59a685`): removed |
| `@typescript-eslint/no-explicit-any` | `src/components/builder/sections/ExecutiveSummaryForm.tsx` | 37 | 35 | Not traced to a single fix |
| `@typescript-eslint/no-explicit-any` | `src/components/builder/SectionIntroModal.tsx` | 1 | 0 | Fix #23 (`9d35211`): removed |
| `no-empty` | `src/hooks/useAutoSave.ts` | 1 | 0 | Touched by fix #5 (`3f4ce11`) |

## Conclusion

- The fix PRs added **no new errors**. Errors fell from 369 to 365 (-3 `any`, -1 `no-empty`).
- The fix PRs added **2 net warnings**, both in code the fixes touched:
  - 2 `react-refresh/only-export-components` in `CashNotInvested.tsx`, because constants and helpers were exported from a component file.
  - 1 net `react-hooks/exhaustive-deps` in `Dashboard.tsx`, because the dependency list omits `toast`. The `ProjectBuilder.tsx` warning was removed, so the total for that rule is unchanged at 20.
- None of these block the build. They are cleanup candidates: move the constants and helpers to a separate module, and add `toast` to the Dashboard effect deps (or document why it is excluded).
- The lockfile drift on `origin/main` is a separate issue. `npm ci` cannot run on main until the lockfile is regenerated with `npm install`.
