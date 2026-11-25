**DRAFT FOR ATTORNEY REVIEW. This is not legal advice and is not final. Do not publish until counsel has reviewed it.**

# DevPack Privacy Policy (Draft)

**Status:** Draft for attorney review. Facts below are taken from the application code on branch `docs/phase2-documentation`. Items in [brackets] need owner input or counsel decisions.

**Operator:** [Legal entity name, address, contact email]
**Effective date:** [date]

---

## 1. What this policy covers

This policy describes what personal information DevPack (the web app for building development packages) collects, why, who processes it, and what choices you have. It applies to the DevPack web app. It does not cover third-party websites you visit from it.

## 2. Information we store

| Category | What it is | Where it is stored | Source code evidence |
|---|---|---|---|
| Account | Email address, password (hashed by the auth service, never stored by the app in plain text), full name given at sign-up | Supabase Auth and the `profiles` table | `src/hooks/useAuth.tsx`; `supabase/migrations/20260204030203_*.sql` |
| Developer profile | Full name, contact details, experience and credentials, portfolio entries, optional headshot, preferences | `developer_profiles` table; `developer-headshots` storage bucket | `supabase/migrations/20260501062955_*.sql`; `src/types/developerProfile.ts` |
| Project data | Project name and address, every section you fill in (budget, team names and contact details, schedule, site, market, risk, feasibility, executive summary), completion status, progress | `projects` and `project_details` tables (section data stored as JSON) | `supabase/migrations/20260204030203_*.sql`; `supabase/migrations/20260206003517_*.sql`; `src/pages/ProjectBuilder.tsx` |
| Uploaded files | Site photos (`project-photos`) and concept drawings or plans (`project-drawings`) | Storage buckets | `supabase/migrations/20260410105404_*.sql` |
| Lookup records | Address and location searched for comparable sales, the service's cache, and a lookup log | `comp_lookups`, `comp_cache` tables (server-side only) | `supabase/migrations/20260929111123_*.sql`; `supabase/functions/attom-comps/index.ts` |
| Local browser storage | Last section you opened, teaching-mode choice, onboarding step, intro dismissal | Your browser (localStorage, sessionStorage) | `src/pages/ProjectBuilder.tsx`; `src/hooks/useTeachingMode.ts`; `src/pages/Onboarding.tsx` |

The app does not set advertising or third-party analytics cookies. We found no analytics or ad SDK in the application code. [Owner: confirm that no analytics or hosting-level tracking is enabled outside the code.]

## 3. How we use the information

- To sign you in, keep your projects separate from other users' projects, and save your work.
- To generate your development package (PDF, lender summary, investor one-pager, Excel workbook) and to run the pre-export review.
- To fill in market and location context from public sources, when you ask for it.
- To generate draft narrative text when you use the AI assist feature.
- To keep the service secure, to rate-limit requests, and to fix problems.

[Counsel: confirm the lawful basis for each purpose under GDPR, if applicable.]

## 4. Who we share information with (processors and third parties)

Based on the code, the following services receive data. [Owner: confirm each vendor, region, and contract. Counsel: confirm the processor terms.]

| Recipient | What is sent | When | Where in code |
|---|---|---|---|
| **Supabase** (hosting for database, authentication, file storage, and edge functions) | All account, profile, project, and uploaded file data | Every use of the app | `src/integrations/supabase/client.ts`; `supabase/` |
| **OpenAI** (text generation) | The prompt you write, the section data included as context, and any draft text you already wrote. The request is sent by the `ai-generate` edge function, which holds the API key. | When you use the AI assist feature | `supabase/functions/ai-generate/index.ts`; `src/components/ai/AIGenerateButton.tsx` |
| **ATTOM** (property data: sale comparables, automated value estimate, address matching) | Street address, city, state, ZIP, and subject square footage. Requests go through the `attom-comps` edge function, which holds the API key. | When you look up comparables or match an address | `supabase/functions/attom-comps/index.ts`; `src/services/attomAPI.ts`; `src/utils/geocodeAddress.ts` |
| **U.S. Census Bureau** (American Community Survey data by ZIP) | The ZIP code requested. The request is made from your browser to the Census API, so your IP address is visible to Census. | When neighborhood data is loaded | `src/services/censusAPI.ts` |
| **Shelby County open data portal** (sales records, a fallback for Memphis and Shelby County sales) | Search parameters for sales records. The request is made from your browser, so your IP address is visible to the portal. | When sales fallback data is loaded | `src/services/dataMidsouthAPI.ts` |

We do not sell personal information. [Counsel: confirm the "sale" and "sharing" analysis under CCPA/CPRA.]

We do not send your full profile or project data to ATTOM, the Census Bureau, or the open data portal. Only the lookup fields listed above are sent.

## 5. Your exports

Exports you generate are files on your device. DevPack does not email or publish them. You are responsible for who receives them. Your lender or investor will see what is in the export.

## 6. Retention

[Owner: define retention periods. The app currently has no automated deletion schedule.]

- Project data remains until you delete the project. Deleting a project from the Dashboard removes it permanently.
- Account data remains until [define].
- Lookup records and cache entries remain for [define]. The cache entries expire for use after 24 hours, but the records are not automatically removed.
- Backups held by the hosting provider are kept for [define].

## 7. Security

- Each user table is protected by row-level security so that users can read and change only their own rows.
- Storage paths for profile assets and headshots are prefixed by the user's ID, and upload and change rules check that prefix.
- Lookup tables are accessible only to the server-side service.
- Edge function API keys are stored as server secrets, not in the browser.

No system is perfectly secure. [Owner: describe incident-response commitments, if any.]

**Known gap:** the `project-photos` and `project-drawings` buckets are public. Anyone with a file's link can open it, and the policy allows anyone to view files in these buckets. Review this before collecting sensitive site or plan files. [Owner decision required.]

## 8. Your choices and rights

- You can edit your profile and project data at any time.
- You can delete a project from the Dashboard.
- [Owner: describe how users request a copy of their data or account deletion. The app does not currently have a self-service export or account deletion flow.]
- [Counsel: add rights language for your jurisdiction, such as GDPR access, erasure, and portability, and the CCPA/CPRA rights to know, delete, and correct.]

## 9. Children

DevPack is for businesses and professional developers. It is not directed at children under 16. [Counsel: confirm.]

## 10. Changes to this policy

[Owner: describe how users will be told about changes.]

## 11. Contact

[Name, email, and mailing address for privacy questions.]
