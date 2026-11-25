# Production Incident Runbook

**Status:** Draft. Needs owner review. Fill in every `[bracketed]` contact and link before the first use.

Use this runbook when DevPack is broken for users in production, when data may be wrong or exposed, or when a key may be compromised.

---

## 0. Roles and contacts

| Role | Person | Contact |
|---|---|---|
| Incident lead | [name] | [phone or chat] |
| Engineering (deploys, code) | [name] | [contact] |
| Supabase project owner | [name] | [contact] |
| Netlify site owner | [name] | [contact] |
| Counsel (privacy, breach questions) | [name or firm] | [contact] |

Keep one shared channel or document for the incident. Write down times in UTC.

---

## 1. Triage (first 15 minutes)

1. **Confirm the symptom.** Open the site in a private window. Sign in with a test account. Try the step users reported.
2. **Classify severity:**

| Severity | Examples | Response |
|---|---|---|
| SEV-1 | Users cannot sign in or open projects; data loss or wrong numbers in exports; suspected data exposure; compromised key | Start now. Notify stakeholders within 1 hour. |
| SEV-2 | Exports fail; AI text or ATTOM lookups fail; autosave errors for some users | Fix within the business day. Notify stakeholders. |
| SEV-3 | Cosmetic issues; a single section misbehaves with a workaround | Track as a normal bug. |

3. **Check status pages** for Supabase, Netlify, OpenAI, and ATTOM.
4. **Decide if this is a deploy issue.** If it started right after a deploy, go to section 4 (rollback) early. Do not wait for a full root cause.
5. **Decide if this is a security issue.** If there is any sign of unauthorized access, a leaked key, or data shown to the wrong user, treat it as SEV-1 and go to section 5 and section 7.

---

## 2. Check logs

Check in this order.

| Source | Where to look | What to look for |
|---|---|---|
| Frontend errors | Browser console on the affected page (ask the reporter for a screenshot or the console text) | Red errors with the section name; failed Supabase requests |
| Netlify deploys | Netlify dashboard, site, **Deploys** | Recent deploy time compared with when the problem started; failed builds |
| Supabase API and Postgres | Supabase dashboard, **Logs** (API, Postgres) | 4xx and 5xx spikes; RLS or permission errors; slow queries |
| Supabase Auth | Supabase dashboard, **Logs** (Auth) | Failed sign-ins, email sending errors, reset failures |
| Edge functions | Supabase dashboard, **Edge Functions**, then the function's **Logs** | `ai-generate` errors (including the 429 rate limit); `attom-comps` errors and upstream status codes |
| Upstream services | OpenAI usage and error pages; ATTOM developer portal | Quota exhausted, invalid key, or a provider outage |

Record the first timestamp of errors, the affected functions or tables, and the error text. Do not paste keys or personal data into the incident channel.

---

## 3. Contain

Choose the smallest step that stops the harm:

- **Bad frontend release:** roll back (section 4).
- **Bad edge function release:** redeploy the last good version (section 4.2).
- **Upstream outage:** tell users which feature is down (AI text, ATTOM lookups). Core package editing should still work; confirm this in the app.
- **Suspected key leak:** rotate the key now (section 5).
- **Suspected data exposure:** restrict the affected path first (for example, make a bucket private or disable a function), then investigate.

Do not run ad hoc SQL against production user tables unless the incident lead and the Supabase owner both approve it, and take a backup first.

---

## 4. Rollback

### 4.1 Frontend (Netlify)

1. Open the Netlify site and go to **Deploys**.
2. Find the last deploy that was working. Check its time and commit.
3. Open that deploy and select **Publish deploy** (Netlify's rollback). This makes that build live again without a new build.
4. Test the site in a private window: sign in, open a project, save a section, and run an export.
5. Record the deploy ID and the time.

To fix forward later, revert the bad commit on `main` in Git, let CI pass, and deploy again (see `docs/phase2/deployment.md`).

### 4.2 Edge functions (Supabase)

Edge functions are not rolled back in the dashboard. Redeploy the last good code:

1. Find the last good commit for the function in `supabase/functions/<name>/`.
2. Check out that version in a clean working copy. Do not switch the working copy of an active branch without saving work.
3. Deploy it from the repo root, linked to the production project:

```sh
supabase functions deploy <name>
```

4. Test the function through the app (for `ai-generate`, use the AI button once; for `attom-comps`, run a comparable lookup).

### 4.3 Database migrations

There is no automatic down migration. Do not reverse a migration in production by hand unless the Supabase owner and incident lead approve it.

1. Take a backup or point-in-time snapshot first (Supabase dashboard, database backups).
2. Write a new forward migration that fixes the problem, in `supabase/migrations/`.
3. Test it on a staging project, then apply it to production.

---

## 5. Rotate keys

Rotate a key any time it may have been exposed: in a log, in a commit, in a screenshot, or by a former collaborator. Rotate in this order: create the new key, update the server secret, verify, then revoke the old key.

| Secret | Used by | Where it is set | Rotation steps |
|---|---|---|---|
| `OPENAI_API_KEY` | `supabase/functions/ai-generate/index.ts` | Supabase function secrets | 1. Create a new key in the OpenAI dashboard. 2. Run `supabase secrets set OPENAI_API_KEY=<new key>` for the production project. 3. Test the AI button. 4. Revoke the old key in OpenAI. |
| `ATTOM_API_KEY` | `supabase/functions/attom-comps/index.ts` | Supabase function secrets | 1. Request a new key from the ATTOM developer portal and check any plan limits. 2. Run `supabase secrets set ATTOM_API_KEY=<new key>`. 3. Test a comparable lookup. 4. Revoke the old key with ATTOM. |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase/functions/attom-comps/index.ts` | Injected automatically by the Supabase edge runtime. You do not set it as a function secret (the `SUPABASE_` prefix is reserved for secrets). | 1. Read the Supabase dashboard's current guidance first. Rotating the service role key can affect every system that uses it, including CI and scripts. 2. Rotate it in the Supabase dashboard (project API settings). 3. Redeploy `attom-comps` so the new value is picked up: `supabase functions deploy attom-comps`. 4. Test a lookup. |

Notes:

- Never put a key in the repo, a commit message, a ticket, or the incident channel.
- Rotating the Supabase JWT secret signs every user out. Do this only if the JWT secret itself is compromised, and tell users first.
- Record who rotated which key, when, and where the new key is stored (password manager or GitHub or Supabase secret store).

---

## 6. Communication

Send the first notice within 1 hour for SEV-1. Update every 60 minutes, or when the status changes.

### Template: first notice

> **Subject:** DevPack incident: [short description], started [time UTC]
>
> We are investigating [symptom] in DevPack. Users affected: [who or what]. What works: [what still works]. What you can do now: [workaround, or "nothing needed"]. Next update by [time UTC].
>
> Incident lead: [name]

### Template: update

> **Subject:** DevPack incident update: [status]
>
> Status: [investigating / mitigated / resolved]. What we know: [facts only]. What we changed: [change]. Next update by [time UTC].

### Template: resolution

> **Subject:** DevPack incident resolved: [short description]
>
> The issue started at [time UTC] and was resolved at [time UTC]. Cause: [plain language]. Fix: [what changed]. Data impact: [none / describe]. If you saw [symptom] between those times, please [action, such as re-save your section]. A full review will follow by [date].

### Breach or exposure

If personal information may have been exposed, do not send a general notice until counsel has reviewed it. Counsel will set the notice content and deadlines (GDPR generally requires notice to the authority within 72 hours of awareness where a risk exists; state laws vary). See `docs/phase2/compliance-gap-checklist.md` item B10.

---

## 7. After the incident

1. **Confirm recovery** in production: sign-in, project open, section save, each export type, AI text, ATTOM lookup.
2. **Confirm keys** are rotated if any were exposed, and that old keys are revoked.
3. **Post-incident review** within 5 business days. Blameless. Use this outline:

| Section | Content |
|---|---|
| Summary | One paragraph: what happened, impact, duration |
| Timeline | UTC times: start, detection, first notice, mitigation, resolution |
| Impact | Users, features, data, financial figures shown in exports |
| Root cause | The technical and process causes, including why it was not caught earlier |
| What went well | |
| What did not | |
| Action items | Each with owner and due date. Add a test or check if one would have caught the issue. |

4. Store the review with the incident record. Link the pull request that fixed it.
