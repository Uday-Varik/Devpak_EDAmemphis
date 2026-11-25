# GDPR and CCPA Gap Checklist

**Status:** Working checklist. Needs owner review and counsel review. This is an engineering inventory, not a legal compliance opinion.

Evidence paths are relative to the repo root. "Exists" means the code or migration shows it. "Missing" means no code or document was found on this branch.

---

## A. What exists

| # | Item | Status | Evidence | Next action |
|---|---|---|---|---|
| A1 | Row-level security on user tables (`profiles`, `projects`, `project_details`, `developer_profiles`), owner-only policies | Exists | `supabase/migrations/20260204030203_beaba8f3-90f6-4b13-a776-a74e507c5f58.sql`; `supabase/migrations/20260206003517_4c5b4500-e106-40c8-ab0a-143f5b3d38ed.sql`; `supabase/migrations/20260501062955_f82392a3-2f96-46af-ada0-3dc9fb191923.sql` | Re-test policies after any schema change. Add a test that one user cannot read another's rows. |
| A2 | Lookup tables (`comp_lookups`, `comp_cache`) enabled for RLS and granted only to the service role, with no client policies | Exists | `supabase/migrations/20260929111123_6329f3b1-0b0e-4938-9928-21c7c5f047d9.sql` | Confirm in the Supabase dashboard that no policy was added later. |
| A3 | Storage paths for profile assets and headshots prefixed by user ID, with upload and update checks | Exists | `supabase/migrations/20260306082032_8d9d2cc8-35e3-4c43-81f5-9112adde5839.sql`; `supabase/migrations/20260501062955_f82392a3-2f96-46af-ada0-3dc9fb191923.sql` | None beyond regression checks. |
| A4 | Project photo and drawing uploads restricted to authenticated users | Partial | `supabase/migrations/20260410105404_fb2c77d7-7387-4bb7-a611-5523051a30d4.sql` | See C3. |
| A5 | Sign-in, sign-up, password reset handled by the auth service; password minimum of 6 characters | Exists | `src/hooks/useAuth.tsx`; `src/components/AuthModal.tsx`; `src/pages/ResetPassword.tsx` | Consider a stronger minimum length. Owner decision. |
| A6 | Third-party API keys kept in edge function secrets, not in the browser | Exists | `supabase/functions/ai-generate/index.ts` (`OPENAI_API_KEY`); `supabase/functions/attom-comps/index.ts` (`ATTOM_API_KEY`; the service role key is injected by the Supabase runtime) | Keep the secret list in the deployment guide up to date. |
| A7 | Auth-checked proxy for ATTOM, with a 24-hour cache and per-user rate limit on AI generation | Exists | `supabase/functions/attom-comps/index.ts` (cache, 24 h); `supabase/functions/ai-generate/index.ts` (10 requests per 60 s per user) | Confirm the rate limit works across function instances. The in-memory limit may reset when the function restarts. |
| A8 | Delete project from the Dashboard (permanent) | Exists | `src/pages/Dashboard.tsx` (delete confirmation dialog) | Confirm cascading delete of `project_details` and uploaded files. |
| A9 | Local-only browser storage used for preferences (no sensitive data found there) | Exists | `src/hooks/useTeachingMode.ts`; `src/pages/ProjectBuilder.tsx`; `src/pages/Onboarding.tsx` | None. |
| A10 | Draft privacy policy and terms of service (for attorney review) | Exists as draft | `docs/phase2/privacy-policy.md`; `docs/phase2/terms-of-service.md` | Counsel review. Publish links in the app footer and sign-up flow. |

---

## B. What is missing

| # | Item | Regime | Status | Evidence | Next action |
|---|---|---|---|---|---|
| B1 | Self-service data access request (copy of your data) | GDPR Art. 15, 20; CCPA right to know | Missing | No export flow in `src/` (only per-export PDF and Excel files) | Decide the process: an in-app export of profile and project JSON, or a documented email process with identity checks. Build or document it. |
| B2 | Self-service account and data deletion | GDPR Art. 17; CCPA right to delete | Missing | No `deleteUser` or account-deletion code in `src/` or `supabase/`. Project deletion exists only in `src/pages/Dashboard.tsx` | Build an account-deletion path (including storage files and `profiles` and `developer_profiles` rows), or document a manual process with a deadline. |
| B3 | Cookie or consent notice | ePrivacy / GDPR (if EU users); CCPA notice at collection | Missing | No cookie banner or consent code found. The app sets only a sidebar state cookie (`src/components/ui/sidebar.tsx`) and uses localStorage and sessionStorage | Confirm that only strictly necessary storage is used, then state that in the privacy policy. Add a notice at sign-up if counsel requires it. |
| B4 | Privacy policy and terms linked in the app | GDPR Art. 13; CCPA notice | Missing in app | No routes for privacy or terms in `src/App.tsx` | Add `/privacy` and `/terms` routes after counsel approves the drafts. Link them from sign-up and the footer. Owner decision on routes. |
| B5 | Data processing agreements (DPAs) with vendors | GDPR Art. 28 | Missing (owner action) | Vendors in use: Supabase, OpenAI, ATTOM, U.S. Census Bureau (API), Shelby County open data portal (API), Netlify (hosting, if used), GitHub (source and CI) | Sign or accept each vendor's DPA. Record the dates and links in a vendor register. |
| B6 | Sub-processor list | GDPR Art. 13(1)(e) | Missing | Not in repo | Publish the list with the privacy policy (see section 4 of the draft). |
| B7 | Retention policy and automated deletion | GDPR Art. 5(1)(e); CCPA | Missing | No retention jobs or cleanup in `supabase/` | Set periods for accounts, projects, lookup records, `comp_lookups`, backups, and uploaded files. Add a scheduled cleanup if needed. |
| B8 | Transfer mechanism for non-EU processing | GDPR Chapter V | Unknown | Vendor regions are not recorded in the repo | Confirm each vendor's processing region and transfer terms (for example, standard contractual clauses). |
| B9 | Data protection impact assessment (DPIA), if required | GDPR Art. 35 | Unknown | Not in repo | Counsel to decide whether one is needed, given the scale and the financial data involved. |
| B10 | Breach notification procedure | GDPR Art. 33 (72 hours), CCPA and state breach laws | Partial | `docs/phase2/incident-runbook.md` (new) | Owner and counsel to confirm the notice steps, timelines, and contacts. |
| B11 | Records of processing activities (ROPA) | GDPR Art. 30 | Missing | Not in repo | Create a short register from section 4 of the privacy policy draft. |
| B12 | Sensitive data handling in uploaded photos and drawings | GDPR and state law | Partial | `supabase/migrations/20260410105404_fb2c77d7-7387-4bb7-a611-5523051a30d4.sql` makes both buckets public (`public = true`) and allows anyone to view files. Planned: buckets made private, see the photo-privacy change; until its migration is applied the buckets remain public. | Confirm the private-bucket change (signed URLs) is applied. Owner decision. |
| B13 | Sharing of user IP addresses with third parties | GDPR transparency | Known | Census and the open data portal are called from the browser: `src/services/censusAPI.ts`; `src/services/dataMidsouthAPI.ts` | Disclose in the privacy policy, or move these calls behind the edge functions. |
| B14 | Minimization of data sent to AI text generation | GDPR Art. 5(1)(c) | Partial | `supabase/functions/ai-generate/index.ts` (strict system prompt); `src/components/ai/AIGenerateButton.tsx` (sends `context` from the section) | Review what `context` includes for each section and remove fields the model does not need, such as contact details. |
| B15 | Vendor contract for OpenAI API data use | GDPR Art. 28 | Missing (owner action) | Not in repo | Confirm the OpenAI API terms for data use and retention, and record the account setting used. |

---

## C. Known gaps to fix first

1. **B12 public project buckets.** Planned: buckets made private, see the photo-privacy change; until its migration is applied the buckets remain public. Site photos and plans can reveal a person's property and plans.
2. **B1 and B2 data subject requests.** Without a process, you cannot answer a request within the legal deadline. Decide the process even if the feature comes later.
3. **B4 policy links.** Users must see the policy before they give data.
4. **B5 DPAs.** Get these signed before taking real user data.

---

## D. Owner decisions required

| Decision | Options | Note |
|---|---|---|
| Should project photos and drawings be private? | Keep public, or make private with signed URLs | Affects `supabase/migrations/20260410105404_*.sql` |
| How are access and deletion requests handled? | In-app flow or manual email process | Affects B1 and B2 |
| Which jurisdictions do you serve? | US only, or EU and UK too | Sets which regimes apply first |
| Retention periods | Owner choice, with counsel review | Affects B7 |

---

## E. Attorney review required

- Whether GDPR applies (users, offering, or monitoring in the EU or UK).
- CCPA and other state privacy laws (including Tennessee's) and whether their thresholds apply.
- Whether the "sale" or "sharing" analysis is clean for the vendor set in use.
- Wording of the privacy policy and terms (see drafts in this folder).
- Need for a DPIA and cross-border transfer terms.
