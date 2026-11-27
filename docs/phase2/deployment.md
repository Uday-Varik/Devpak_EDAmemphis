# Deployment Guide (Staging and Production)

**Status:** Draft. Needs owner review. Needs a Netlify site, a second Supabase project for staging, and GitHub environment secrets before the first deploy.

**Important:** The GitHub workflow files and Netlify and environment config are being added by a separate change in parallel. On this branch they do not exist yet. This guide describes them by path and purpose only. When that change lands, check each item against the actual file.

| Path | Purpose | Status on this branch |
|---|---|---|
| `.github/workflows/ci.yml` | Runs tests, build, and lint on pull requests and pushes | Not present yet (parallel change) |
| `.github/workflows/deploy.yml` | Manual deploy with an `environment` input (staging or production) | Not present yet (parallel change) |
| `netlify.toml` | Build command, publish directory, and SPA redirect so client routes such as `/project/:id` load on refresh | Not present yet (parallel change) |
| `.env.example` | Lists client environment variable names with placeholder values. Copy to `.env.local` for local work. Never commit real values. | Not present yet (parallel change) |
| `supabase/migrations/` | Database schema changes, applied in filename order | Present |
| `supabase/functions/` | Edge functions: `ai-generate`, `attom-comps` | Present |
| `supabase/config.toml` | Supabase project link (project reference) | Present |

---

## 1. Environments

| Environment | Purpose | Netlify site | Supabase project |
|---|---|---|---|
| Local | Development on your machine (`npm run dev`, port 8080) | None | A development project or the staging project. Do not use production data locally. |
| Staging | Test releases before users see them | [owner: create] | Separate project from production (owner: create) |
| Production | Live users | [owner: create] | The current production project |

Keep staging and production data apart. Do not point a staging build at production Supabase.

**Open engineering item:** `src/integrations/supabase/client.ts` is generated, and it selects one Supabase project. A staging frontend build therefore needs a decided mechanism (for example, environment variables read by the client, or a separate build). Decide this before the first staging deploy. Do not edit the generated file by hand.

---

## 2. Local checks before a pull request

Use npm. The repo has both `bun.lock` and `package-lock.json`. Use npm unless told otherwise.

```sh
npm ci
npm run lint
npm test          # vitest run
npm run build
```

Run the parity tests after any change to financial logic (`src/utils/calculations.ts` and its consumers). They are in `src/utils/__tests__/`.

---

## 3. CI (`.github/workflows/ci.yml`, when present)

Expected to run on pull requests and on pushes to `main`:

1. Install dependencies with npm.
2. Run tests (`npm test`).
3. Run the production build (`npm run build`).
4. Run lint (`npm run lint`).

A failing check blocks the merge. Do not merge a red pull request to get a deploy out. Fix the check or roll back.

---

## 4. Deploy (`.github/workflows/deploy.yml`, when present)

1. Go to **Actions**, select the deploy workflow, and choose **Run workflow**.
2. Choose the **environment** input: `staging` first, then `production`.
3. Wait for the workflow to finish. Check its logs for the build and any migration step.
4. Smoke test the deployed site (section 6).

**Order for a release that changes the database or functions:**

1. Apply migrations to staging, then test.
2. Deploy edge functions to staging, then test.
3. Deploy the frontend to staging, then test.
4. Repeat steps 1 to 3 for production, in the same order.

Migrations run before the frontend that needs them is published, so the old frontend keeps working during the change. Write migrations so the old code still works (add columns with defaults; do not drop a column in the same release that stops using it).

---

## 5. Netlify (`netlify.toml`)

Once `netlify.toml` lands, confirm these values in the file:

- **Build command:** expected `npm run build`.
- **Publish directory:** expected `dist` (Vite's default output folder).
- **SPA redirect:** a rule that sends all paths to `/index.html` with status 200, so react-router routes work on refresh.

Netlify-side setup (owner):

1. Create a Netlify site for staging and one for production, or use branch and context settings if you prefer one site.
2. Connect the GitHub repo.
3. Set the production branch to `main`.
4. Add the client environment variables the build needs (names come from `.env.example`).
5. Enable deploy previews if you want them for pull requests.

### Optional: usage analytics (off by default)

Analytics run only when the build has `VITE_ANALYTICS_ENDPOINT` set (see `.env.example`). Leave it unset to ship with no analytics.

- Set `VITE_ANALYTICS_ENDPOINT` to a Plausible-compatible event endpoint, for example `https://plausible.io/api/event`. Optionally set `VITE_ANALYTICS_DOMAIN` to the site domain the provider expects.
- The client sends page paths (no query strings; project ids are replaced with `:id`) and a few event names: `project_created`, `section_saved`, `export_generated`. Event props hold only the section key, the completion flag, or the export type.
- No cookies, localStorage, or user, project, or financial data are sent. This keeps the app within the "strictly necessary storage only" position in `compliance-gap-checklist.md` (B3). If you enable this in production, update `privacy-policy.md` and the sub-processor list (B6) to name the provider.
- Provider choice: pending owner decision. The module (`src/lib/analytics.ts`) is provider-neutral; only the endpoint changes.

---

## 6. Supabase steps

Run these from the repo root with the Supabase CLI.

### 6.1 Link the project

```sh
supabase login
supabase link --project-ref <project-ref>
```

Use the project reference from the Supabase dashboard (the value in `supabase/config.toml` is the current project). Link to staging when you deploy to staging, and to production when you deploy to production. Check which project is linked before every deploy (`supabase status` or the dashboard).

### 6.2 Run migrations

```sh
supabase db push
```

This applies the files in `supabase/migrations/` that are not yet applied to the linked project. Review the list it prints before confirming. Take a backup before any production push.

### 6.3 Deploy edge functions

```sh
supabase functions deploy ai-generate
supabase functions deploy attom-comps
```

### 6.4 Set function secrets

Set only the secrets the functions read from the environment. Supabase reserves the `SUPABASE_` prefix, so `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to functions.

```sh
supabase secrets set OPENAI_API_KEY=<key>      # used by ai-generate
supabase secrets set ATTOM_API_KEY=<key>       # used by attom-comps
```

Use a separate key for staging where the vendor allows it. Never commit these values or put them in `.env.example`.

Check the list with `supabase secrets list` (names only are shown).

---

## 7. GitHub environment secrets (owner must create)

Create these in **Settings > Environments** for each of `staging` and `production`. Use the **environment** scope, not the repository scope, so staging and production values stay apart.

The exact list depends on what `deploy.yml` uses when it lands. The list below is what a typical setup needs. Confirm each name against the file.

| Secret | Needed for | Where to get it |
|---|---|---|
| `NETLIFY_AUTH_TOKEN` | Deploying to Netlify from Actions, if the workflow uses the Netlify CLI | Netlify user settings, personal access token |
| `NETLIFY_SITE_ID` | Selecting the Netlify site, if used | Netlify site settings |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI in Actions | Supabase account, access tokens |
| `SUPABASE_PROJECT_REF` | Linking the right project in Actions | Supabase project settings |
| `SUPABASE_DB_PASSWORD` | `supabase db push` in Actions | Set when the Supabase project was created; reset in the Supabase dashboard if lost |
| Client environment variables (names from `.env.example`) | Frontend build | Supabase project API settings (public URL and anon key only) |

Do not create a secret for the Supabase service role key or the OpenAI or ATTOM keys in GitHub unless `deploy.yml` needs it. Those belong in Supabase function secrets (section 6.4).

Protect the `production` environment: add required reviewers so a production deploy needs a second person to approve.

---

## 8. Smoke test after each deploy

Use a test account, not a real client's account.

1. Open the site in a private window. The home page loads.
2. Sign in. The Dashboard loads.
3. Open a project directly by URL (refresh the page). It loads. This checks the SPA redirect.
4. Edit a section, wait for **Saved at**, refresh, and confirm the value is still there.
5. Open the Executive Summary, run the pre-export review, and export the Excel workbook. Open it.
6. If AI text or ATTOM lookups changed, test one of each.

---

## 9. Rollback

- Frontend: roll back in Netlify (see `docs/phase2/incident-runbook.md`, section 4.1).
- Edge functions: redeploy the previous good commit (section 4.2 of the runbook).
- Database: no automatic down migration. Write a forward fix. See section 4.3 of the runbook.
