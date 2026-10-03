# CLAUDE.md

DevPack (EDA Memphis): a web app where small-scale (1–4 unit) residential developers fill out a 10-section guided builder. It produces a lender/investor-ready development package as a PDF, a lender summary, an investor one-pager and an Excel workbook. It started as a Lovable project, so Lovable may also commit to this repo.

Stack: Vite + React 18 + TypeScript, shadcn/ui (Radix) + Tailwind, react-router v6, TanStack Query (barely used), Supabase (auth, Postgres, storage, edge functions), `@react-pdf/renderer`, `xlsx`, recharts, Vitest + jsdom.

## Commands

```sh
npm run dev        # Vite dev server on port 8080
npm run build      # production build
npm run lint       # eslint
npm test           # vitest run (src/**/*.{test,spec}.{ts,tsx})
npx vitest run src/utils/__tests__/perSqftParity.test.ts   # single test file
```

The `@/` import alias maps to `src/`. Both `bun.lock` and `package-lock.json` are checked in; use npm unless told otherwise.

## Critical rule: one source of truth for financials

Every budget or financial figure comes from [src/utils/calculations.ts](src/utils/calculations.ts). That includes TDC, contingencies, sources, funding gap, land equity, ROI, DSCR, cap rate, rule checks, sensitivity scenarios and rental projections. They are computed by `computeBudgetTotals`, `computeProjectFinancials`, `computeSensitivityScenarios` and `computeRentalProjection`.

- **Never sum costs or compute metrics locally** in a form, a PDF section or the Excel generator. Divergent copies once caused a wrong TDC in per-SF mode and a UI vs. PDF mismatch.
- The basis rule is documented in the file header: `netTdc` (TDC minus grants) is used **only** for netProfit, roi and profitMargin. Every other metric uses gross TDC.
- When `hardCosts.usePerSqftEstimate` is set, per-SF mode replaces the itemized hard costs (`costPerSqft × scope.sqftPlanned`).
- New construction plus `acquisition.ownsProperty` means closing and title costs are excluded and land equity applies.
- The parity tests in [src/utils/__tests__/](src/utils/__tests__/) (`perSqftParity`, `excelRentalParity`, `calculations`, `ruleChecks`) guard this. Run them after any change to financial logic or to its consumers.

## Architecture

### Routes ([src/App.tsx](src/App.tsx))
`/` landing (Index), `/dashboard` project list, `/onboarding` developer-profile wizard, `/profile`, `/reset-password`, `/project/:id` builder. `useAuth` ([src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)) provides the Supabase session. Pages redirect to `/` when there is no user.

### Project builder
- [src/pages/ProjectBuilder.tsx](src/pages/ProjectBuilder.tsx) owns the `Section` union type and the ordered `SECTIONS` list: project-scope, vision-market, site-location, project-schedule, budget-capital, project-team, risk-assessment, resilience-factors, feasibility, executive-summary. It loads and saves section data and computes progress.
- [src/components/builder/BuilderContent.tsx](src/components/builder/BuilderContent.tsx) maps each section to its form in [src/components/builder/sections/](src/components/builder/sections/) and holds the titles and descriptions. Sub-components live in per-section subfolders (`budget/`, `feasibility/`, `executive/`, …).
- Each form receives `{ data, onSave, saving }` and autosaves through [useAutoSave](src/hooks/useAutoSave.ts): a 1.5 s debounce, a flush on unmount, and a best-effort save on `beforeunload`.
- Progress uses `PACKAGE_SECTIONS` / `countCompletedSections` in [src/utils/narrativeStaleness.ts](src/utils/narrativeStaleness.ts). It counts 9 sections; Executive Summary is excluded. Keep the builder header and the Executive Summary panels on this same helper.
- Cross-section navigation uses the `window` CustomEvent `"navigate-section"`, whose `detail` is the section-key string.
- Some forms read other sections' data directly from Supabase: `useProjectType`, `fetchProjectSections` in [autoAssess.ts](src/utils/autoAssess.ts), and the Executive Summary form.
- Teaching panel and section intro modals: [TeachingPanel.tsx](src/components/builder/TeachingPanel.tsx), [SectionIntroModal.tsx](src/components/builder/SectionIntroModal.tsx). The toggle is in [useTeachingMode](src/hooks/useTeachingMode.ts) (localStorage `devpack:teachingMode`). localStorage keys use the `devpack:` prefix.

### Data model (Supabase, [supabase/migrations/](supabase/migrations/))
- `projects`: id, user_id, name, address, progress.
- `project_details`: one row per `(project_id, section)`, upserted with `onConflict: "project_id,section"`. It holds `data` (JSONB, the section's form state) and `completed`. **Section data is schemaless JSONB.** When you add, rename or remove a field, check every reader: calculations, autoAssess, validatePackage, fetchProjectData, generateExcel and the PDF sections.
- `profiles` and `developer_profiles` (the onboarding wizard, typed in [src/types/developerProfile.ts](src/types/developerProfile.ts)).
- `comp_lookups` and `comp_cache` are service-role only and are used by the `attom-comps` function.
- Storage buckets: `profile-assets`, `project-photos`, `project-drawings`, `developer-headshots`. Paths are prefixed by user id.
- RLS restricts all user tables to their owner.
- [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts) and `types.ts` are **generated; do not edit**. Regenerate the types after schema changes.

### Legacy value normalization
[src/lib/projectTypes.ts](src/lib/projectTypes.ts) maps the old `gut-renovation` / `light-renovation` values to `renovation-rehab`, and the old `mixed-use` property type to `single-family`. Use `normalizeProjectType` / `isRenovationType` rather than comparing raw strings. Note that `calculations.ts` compares `projectType === "new-construction"` directly.

### Narrative staleness
Generated narratives store a fingerprint of the figures they were based on ([narrativeFingerprints.ts](src/utils/narrativeFingerprints.ts), [narrativeStaleness.ts](src/utils/narrativeStaleness.ts)). `isNarrativeStale` flags text whose numbers have since changed, and `StaleNarrativeNotice` shows the warning. If you change which inputs feed a narrative, update its fingerprint builder.

### Exports
Exports are triggered from [ExecutiveSummaryForm.tsx](src/components/builder/sections/ExecutiveSummaryForm.tsx) after `PreExportValidationModal` runs `runValidation` ([validatePackage.ts](src/utils/validatePackage.ts)).
- [fetchProjectData.ts](src/utils/fetchProjectData.ts) `fetchProjectExportData` loads every section and builds the `PDFData` payload: financials, sensitivity, auto-generated overview and rationale text.
- PDFs: `generatePDF`, `generateLenderSummary`, `generateInvestorOnePager` render the components in [src/components/pdf/](src/components/pdf/) (one file per package section under `sections/`, with shared styles in `PDFStyles.ts`).
- Excel: [generateExcel.ts](src/utils/generateExcel.ts) (`buildExcelRentalProjection` is parity-tested).

### External data
- Supabase edge functions (Deno, [supabase/functions/](supabase/functions/)), called through `supabase.functions.invoke`:
  - `ai-generate`: OpenAI narrative generation with a strict lender-facing system prompt (no invented figures, no program-eligibility claims, `[MISSING: …]` placeholders). It is rate-limited per user. The client side is [AIGenerateButton.tsx](src/components/ai/AIGenerateButton.tsx). Secret: `OPENAI_API_KEY`.
  - `attom-comps`: an auth-checked ATTOM proxy for sale comps and AVM with a 24 h cache in `comp_cache`, plus a `mode: "log"` lookup log. Secrets: `ATTOM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Its field-mapping quirks are documented in the file header.
- Client-side services in [src/services/](src/services/): `censusAPI` (ACS data by ZIP), `dataMidsouthAPI` (Memphis/Shelby County sales fallback), `attomAPI` (the edge-function wrapper). Geocoding is in `utils/geocodeAddress.ts`.

## Conventions
- UI primitives in [src/components/ui/](src/components/ui/) are shadcn-generated. Prefer composing them over editing them.
- Toasts: both `sonner` (`toast` from "sonner") and the shadcn toaster are mounted; most newer code uses sonner.
- Money formatting is `en-US` USD with no decimals. Round with `roundHalfAway` / `roundCurrency` from calculations.ts.
- AI-written and auto-generated copy is lender-facing: third person, quantified, no invented market stats. Keep new generated text consistent with the `ai-generate` system prompt.
