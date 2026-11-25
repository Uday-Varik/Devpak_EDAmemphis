# DevPack Proposal Status

**As of:** 2026-11-25 (state of `main` at `c10afc3`)
**Source:** [DevPack_Proposal_Estimate.html](../references/DevPack_Proposal_Estimate.html), 3-phase roadmap at $25/hr.

This file tracks each proposal item against the repo. It replaces the status implied by the older bug registry and SDLC audit. Hours are the proposal's own estimates unless marked as an estimate.

---

## Summary

| Phase | Proposal hours | Done in repo | Remaining (dev hours) | Blocked on owner |
|---|---|---|---|---|
| 1. Fix issues + CI/CD | 24.25 | Complete | 0 | Staging and secrets setup, live verification |
| 2. Stabilize + docs | 13 | Mostly complete | ~1 (analytics) | Sentry DSN, staging, legal review, vendor DPAs |
| 3A. Testing + compliance | 10 | Partial | ~7 (performance 2 + E2E/integration ~5, estimate) | Compliance sign-off |
| 3B. Phase 2 features | 28.5 | Not started | 28.5 | None; starts after launch |
| **Total** | **75.75** | | **~36.5** (about $910 at $25/hr) | |

Development time left is about 36.5 hours. Owner-side setup and legal review are not in that number.

---

## Phase 1: Fix Current Issues (Week 1)

### Bug fixes (proposal: 34 bugs, 20.75 h)

- **Done.** All 32 GitHub issues (#1–#32) are closed. Each landed through its own PR.
- **Gap to confirm:** the proposal and bug registry say 34 bugs; the GitHub tracker has 32 issues. Confirm whether the 2 extra bugs are covered by existing issues or still need an issue.
- **Pending live check:** the silent-failure fixes (#1–#5, #10, #12) have unit tests, but the live checklist in [live-verification-checklist.md](../qa/live-verification-checklist.md) has not been run. It needs owner sign-in on the test project.

### CI/CD (proposal: 3.5 h)

| Task | Status | Evidence |
|---|---|---|
| GitHub Actions: test, lint, build | Done | `.github/workflows/ci.yml` |
| Deployment workflow (staging/production) | Code done; needs owner setup | `.github/workflows/deploy.yml`, `netlify.toml` |
| Environment configuration | Template done; secrets are owner-only | env template commit `271b40b` |
| Pre-commit hooks (Husky + lint-staged) | Done in config; run `npx husky` once | PR #69 |

### Deliverables

| Deliverable | Status |
|---|---|
| All bugs documented and fixed | Done (see note above) |
| GitHub Actions CI/CD operational | Done (Lint is non-blocking in CI) |
| Automated tests on every push | Done |
| Staging environment ready for testing | **Owner action**: GitHub environments and secrets |
| No console errors or debug logs | Mostly done. 32 lint warnings remain (no errors). |
| Data persistence issues resolved | Done in code; live check pending |

---

## Phase 2: Stabilize & Prepare for Launch (Week 2)

### Infrastructure (proposal: 9 h)

| Component | Proposal h | Status |
|---|---|---|
| Staging environment setup | 1.5 | Config in repo; **owner action** to link Netlify and set secrets |
| Deployment guide | 1 | Done: [deployment.md](../phase2/deployment.md) |
| Error monitoring (Sentry) | 1.5 | Code done, off by default (`src/lib/monitoring.ts`). **Owner action**: DSN. |
| Analytics integration | 1 | **Not started.** No analytics code in `src/`. |
| Incident runbook | 1 | Done: [incident-runbook.md](../phase2/incident-runbook.md) |
| Security audit | 2 | Done: [security-audit-2026-11.md](../security/security-audit-2026-11.md) (findings below) |

### Documentation (proposal: 8 h)

| Document | Proposal h | Status |
|---|---|---|
| User manual | 4 | Drafted: [user-manual.md](../phase2/user-manual.md). Needs review. |
| Privacy policy | 1 | Draft only. Needs attorney review and in-app routes (gap B4). |
| Terms of service | 1 | Draft only. Needs attorney review and in-app routes. |
| Deployment documentation | 1 | Done |
| FAQ | 1 | Drafted: [faq.md](../phase2/faq.md) |

### Security findings still open

From the 2026-11 audit:

- **SEC-01, SEC-02 (High):** code fixed in PRs #66 and #67. The two Supabase migrations (`attom_request_log`, `private_project_photo_buckets`) and the `attom-comps` redeploy are **owner actions**.
- **SEC-03 (High):** npm audit advisories in production deps (react-router-dom, postcss, zod). Open. Changes `package-lock.json`, so it needs your approval.
- **SEC-04 to SEC-13:** open. Not estimated in the proposal. Some are quick config changes; SEC-04 (AI cost caps) and SEC-13 (session storage review) are larger.

---

## Phase 3A: Advanced Testing & Compliance (Week 3)

| Task | Proposal h | Status |
|---|---|---|
| E2E testing setup (Playwright) | 3 | Partial. Smoke spec in `e2e/smoke.spec.ts`. Real user flows not covered yet. |
| Performance testing and optimization | 2 | **Not started.** No load or perf tests. |
| Integration tests | 4 | Partial. Rate-limit and attom-comps tests (PR #66); no full API or database integration suite. |
| GDPR/CCPA compliance audit | 1 | Checklist done: [compliance-gap-checklist.md](../phase2/compliance-gap-checklist.md). Needs counsel review. |

Open compliance gaps the proposal does not cover: data access and deletion requests (B1, B2), cookie or consent notice (B3), vendor DPAs (B5), retention policy (B7), and records of processing (B11).

---

## Phase 3B: Phase 2 Features (Post-Launch, Week 4)

Starts 2–4 weeks after launch. Nothing has been started.

| Item | Proposal h | Status |
|---|---|---|
| Database schema (5 tables: `project_activations`, `project_draws`, `construction_updates`, `project_closeouts`, `project_documents`) | 1.5 (table says 3.5 in the body) | **Not started.** No migrations or code for these tables. |
| Feature 1: Budget Tracking | 7 | Not started |
| Feature 2: Draw Management | 6.5 | Not started |
| Feature 3: Timeline Tracking | 4.5 | Not started |
| Feature 4: Document Storage | 2.5 | Not started |
| Feature 5: Project Closeout | 5 | Not started |

Note the proposal's schema hours disagree: the body says 3.5 h and the table says 1.5 h. Confirm which one was agreed.

---

## Remaining work at a glance

**Development (needs no owner access):**
1. Analytics integration (1 h).
2. Performance testing (2 h).
3. Finish E2E and integration tests (about 5 h, estimate).
4. Security findings SEC-03 to SEC-13 (estimate, not in the proposal).
5. Phase 3B features (28.5 h, after launch).

**Owner action (needs your access):**
1. Apply the two Supabase migrations and redeploy `attom-comps`.
2. Set up GitHub environments, secrets, Netlify staging, and the Sentry DSN.
3. Run `npx husky` once and `npx playwright install chromium`.
4. Run the live verification checklist on the test project.
5. Attorney review of the privacy policy and terms; choose the data-request process (B1, B2).
6. Sign or accept vendor DPAs (B5, B15).
7. Confirm the schema-hours figure for Phase 3B.

**Decisions:**
- Approve or defer the SEC-03 npm audit fix (changes `package-lock.json`).
- Clear the 32 remaining lint warnings (no errors), or leave them as a baseline.
