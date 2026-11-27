# Performance Report: Bundle Optimization

Scope: production bundle size and route-level code splitting. No financial logic, export output, or Supabase files changed.

## Before and after

Measured with `npx vite build` (Vite 5.4.19) on `origin/main` (13d9af3) and on this branch.

| Output | Before (single entry) | After |
|---|---|---|
| Entry JS loaded on every page | `index-*.js` **3,103.99 kB** (gzip 966.44 kB) | `index-*.js` **558.33 kB** (gzip 167.82 kB) |
| CSS | 85.90 kB (gzip 14.46 kB) | 85.90 kB (gzip 14.46 kB), unchanged |
| Builder route chunk (`/project/:id`) | in entry | `ProjectBuilder-*.js` 515.19 kB (gzip 135.18 kB) |
| Dashboard route | in entry | `Dashboard-*.js` 10.19 kB |
| Profile / Onboarding / ResetPassword / NotFound | in entry | 4.76 kB / 6.91 kB / 2.13 kB / 0.63 kB |
| Full Development Package export | in entry | `generatePDF-*.js` 58.95 kB, plus shared `PDFStyles-*.js` 1,576.90 kB (gzip 528.16 kB) |
| Lender Summary export | in entry | `generateLenderSummary-*.js` 13.92 kB (shares the `PDFStyles` chunk) |
| Investor One-Pager export | in entry | `generateInvestorOnePager-*.js` 7.61 kB (shares the `PDFStyles` chunk) |
| Excel export | in entry | `generateExcel-*.js` 299.63 kB (gzip 100.81 kB) |

Result: the initial JS a visitor downloads on the landing page drops from 3,104 kB to 558 kB (about 82% smaller; gzip 966 kB to 168 kB). The PDF and Excel libraries are fetched only when a user clicks an export button.

Build output before:

```
dist/assets/index-BrYi6Kok.js   3,103.99 kB │ gzip: 966.44 kB
(!) Some chunks are larger than 500 kB after minification.
```

Build output after:

```
dist/assets/index-vJGFDij6.js                558.33 kB │ gzip: 167.82 kB
dist/assets/ProjectBuilder-B1MHnSMF.js       515.19 kB │ gzip: 135.18 kB
dist/assets/PDFStyles-MmTHQb6F.js          1,576.90 kB │ gzip: 528.16 kB
(!) Some chunks are larger than 500 kB after minification.
```

The warning still appears. The only chunks above 500 kB are the export library and the builder, and neither loads on the landing page.

## What changed

1. **Route-level code splitting** ([src/App.tsx](../../src/App.tsx)). `Dashboard`, `ProjectBuilder`, `Profile`, `Onboarding`, `ResetPassword` and `NotFound` are now `React.lazy` imports behind one `Suspense` boundary. `Index` stays eager. The `ErrorBoundary` wrappers are unchanged.
2. **Export libraries loaded on click** ([src/components/builder/sections/ExecutiveSummaryForm.tsx](../../src/components/builder/sections/ExecutiveSummaryForm.tsx)). The four static imports of `generatePDF`, `generateLenderSummary`, `generateInvestorOnePager` and `generateExcel` are replaced with `await import(...)` inside each export handler. Those modules are unchanged, so the generated files are the same.

Before this change, `ExecutiveSummaryForm` was statically imported by the builder, which pulled `@react-pdf/renderer` and `xlsx` into the entry chunk.

## Dependency notes

- **`recharts`**: no module imports it except [src/components/ui/chart.tsx](../../src/components/ui/chart.tsx), and nothing imports that file. It is tree-shaken out and adds 0 kB to the build. It is dead weight in `package.json`. Removing it needs a `package-lock.json` change, so it is deferred.
- **`@react-pdf/renderer`**: about 1.58 MB minified. It is now export-only, but it is still one large chunk, and it is the main reason the >500 kB warning remains. Making it smaller means replacing or re-architecting the PDF generator, which is out of scope for this submission.
- **`xlsx`**: about 300 kB, export-only.

## Remaining hotspots

| # | Hotspot | Size | Loaded when | Next step (not done) |
|---|---|---|---|---|
| 1 | `@react-pdf/renderer` (`PDFStyles` shared chunk) | 1,577 kB (gzip 528 kB) | First PDF/Lender/Investor export | Replace or slim the PDF renderer; not feasible before submission |
| 2 | `ProjectBuilder` chunk | 515 kB (gzip 135 kB) | Opening `/project/:id` | Lazy-load section forms in `BuilderContent.tsx` (`React.lazy` per section) |
| 3 | Entry chunk: React, Supabase client, Radix, router, TanStack Query | 558 kB (gzip 168 kB) | Every page | Vendor `manualChunks` split for better caching (does not reduce total) |
| 4 | `xlsx` | 300 kB (gzip 101 kB) | First Excel export | Use a lighter writer if one fits the workbook needs |
| 5 | Google Fonts `@import` in [src/index.css](../../src/index.css) | render-blocking request | Every page | Move to `<link rel="preconnect">` + `<link>` in `index.html` |
| 6 | Unused `recharts` dependency | 0 kB in bundle | n/a | Remove from `package.json` with a lockfile update |

Build warning `vite:css @import must precede all other statements`: pre-existing (the Google Fonts `@import` in `index.css`). Same as on `origin/main`.

## Commands used

```powershell
# Baseline: origin/main exported with git archive to a scratch folder, node_modules junctioned in
git archive origin/main | tar -x -C <scratch>\baseline
npx vite build

# After (this branch)
npx vite build
npm run lint
npx vitest run
npx tsc -p tsconfig.app.json --noEmit
```

Results on this branch:

- `npx vite build`: passes.
- `npm run lint`: 0 errors, no output.
- `npx vitest run`: 22 files, 110 tests, all pass. This includes the parity guards `perSqftParity`, `excelRentalParity`, `calculations` and `ruleChecks`.
- `npx tsc -p tsconfig.app.json --noEmit`: no errors.

Build time: the baseline build took 3m 26s and this branch took 36.7s, but the baseline was the first build in this worktree and included cold-cache costs. The times are not comparable, so no build-time claim is made.

Install note: `npm ci` failed on a Windows postinstall step, so dependencies were installed with `npm ci --ignore-scripts`. `package-lock.json` was not changed.

## Lighthouse (optional, not run)

No new dependency was added. Run Lighthouse against the Netlify preview with `npx` so nothing is installed into the project:

```powershell
npx lighthouse https://<preview-url>.netlify.app/ --only-categories=performance --output=html --output-path=.\lighthouse-landing.html
npx lighthouse https://<preview-url>.netlify.app/dashboard --only-categories=performance --output=html --output-path=.\lighthouse-dashboard.html
```

Replace `<preview-url>` with the Netlify deploy-preview URL. Lighthouse scores were **not** captured in this pass. Add them here after a run on the preview.
