# DevPack

DevPack helps small residential developers (1 to 4 units) build lender- and investor-ready development packages. A guided 10-section builder produces a PDF development package, a lender summary, an investor one-pager, and an Excel workbook.

Live site: https://devpak-edamemphis.netlify.app

## Documentation

- [User manual](docs/phase2/user-manual.md)
- [FAQ](docs/phase2/faq.md)
- [Deployment guide](docs/phase2/deployment.md)
- [Incident runbook](docs/phase2/incident-runbook.md)
- [Release and versioning](docs/phase2/release-and-versioning.md)

## Tech stack

Vite, React 18, TypeScript, shadcn/ui with Tailwind, react-router, Supabase (auth, Postgres, storage, edge functions), `@react-pdf/renderer`, `xlsx`, and Sentry for error monitoring.

## Local development

Requires Node.js 20 or later.

```sh
npm ci
npm run dev        # http://localhost:8080
npm run build      # production build in dist/
npm test           # Vitest
npm run lint       # ESLint
```

Local environment variables are optional. See `.env.example`. Server-side secrets (OpenAI, ATTOM, Supabase service role) live only in Supabase edge function secrets and are never placed in this repository.

## Deployment

The site is hosted on Netlify and deploys automatically from `main`. Pull requests get a preview deploy. See the [deployment guide](docs/phase2/deployment.md).
