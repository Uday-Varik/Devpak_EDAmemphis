# DevPack

DevPack helps small residential developers (1 to 4 units) build lender- and investor-ready development packages. A guided 10-section builder walks the developer through the project, then produces:

- A full development package (PDF)
- A lender summary (PDF)
- An investor one-pager (PDF)
- An Excel workbook with the financial model

**Live site:** https://devpak-edamemphis.netlify.app

## Features

- Guided builder with 10 sections: project scope, vision and market, site and location, schedule, budget and capital, team, risk, resilience, feasibility, and executive summary
- One financial engine for every figure, so the screen, PDFs and Excel always match
- Autosave while you type
- Pre-export review that flags missing or weak items before you send a package to a lender
- AI-assisted draft text, with placeholders wherever information is still missing
- Comparable sales lookup and neighborhood data
- Teaching panels that explain what lenders look for in each section

## Tech stack

- **Frontend:** Vite, React 18, TypeScript, shadcn/ui, Tailwind CSS, react-router
- **Backend:** Supabase (authentication, Postgres with row-level security, storage, and edge functions)
- **Documents:** `@react-pdf/renderer` for PDFs, `xlsx` for the workbook
- **Quality:** Vitest, ESLint, Playwright (end-to-end), Husky pre-commit hooks
- **Monitoring:** Sentry for error reporting
- **Hosting:** Netlify, deploying from `main`

## Getting started

You need Node.js 20 or later and npm.

```sh
npm ci
npm run dev
```

The app runs at http://localhost:8080.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run the unit tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run the Playwright end-to-end tests |

## Configuration

Copy `.env.example` to `.env.local` for local overrides. The file lists every variable the app reads.

- **Supabase URL and publishable key** are defined in `src/integrations/supabase/client.ts`. No variables are needed for them.
- **`VITE_SENTRY_DSN`** enables error reporting. Leave it empty to turn reporting off.
- **`VITE_ANALYTICS_ENDPOINT`** (optional) enables page-view analytics. It is off by default.

Server-side secrets (`OPENAI_API_KEY`, `ATTOM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are stored only as Supabase edge function secrets. They never go into this repository or a `.env` file.

## Project structure

```
src/
  components/   UI, builder sections, PDF templates, and shared components
  pages/        Routes: landing, dashboard, onboarding, profile, builder
  utils/        Financial engine (calculations.ts), exports, and validation
  services/     Client wrappers for Supabase functions and public data
  integrations/ Generated Supabase client and types (do not edit by hand)
supabase/
  functions/    Edge functions (ai-generate, attom-comps)
  migrations/   Database schema and storage policies
docs/           User manual, FAQ, deployment guide, security audit, QA checklists
```

## Financial figures

Every budget and financial figure comes from `src/utils/calculations.ts`. The screen, the PDFs and the Excel workbook all read from it. Do not add a second copy of any financial calculation. The parity tests in `src/utils/__tests__/` check that the outputs match.

## Deployment

The site deploys automatically from `main` on Netlify, and each pull request gets a preview deploy. Production environment variables are set in the Netlify dashboard. Supabase URL settings and edge function secrets are managed in Supabase. See the [deployment guide](docs/phase2/deployment.md) for the full steps.

## Documentation

- [User manual](docs/phase2/user-manual.md)
- [FAQ](docs/phase2/faq.md)
- [Deployment guide](docs/phase2/deployment.md)
- [Incident runbook](docs/phase2/incident-runbook.md)
- [Release and versioning](docs/phase2/release-and-versioning.md)
- [Privacy policy](docs/phase2/privacy-policy.md) and [terms of service](docs/phase2/terms-of-service.md) (drafts pending legal review)
