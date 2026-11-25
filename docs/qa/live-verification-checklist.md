# Live verification checklist

Manual checks for fixes that have unit tests but no live check yet.

## Rule before testing on the test project

Test project: **Kimball Avenue Fourplex**, id `078f8715-57ee-48ce-9cab-ea96e1fdd9fe`.

Before any live test on this project:

1. **Snapshot** every field you will change (write the old values down, or copy the section JSON from DevTools or Supabase).
2. Change values as needed to exercise the case.
3. Test and record findings.
4. **Restore** the snapshot, then confirm the restore by reloading the page and checking each field.

## Forcing failures

- **Offline**: DevTools > Network > Throttling > Offline. Restore to "No throttling" afterwards.
- **Bad id**: edit the project id in the URL, for example `/project/00000000-0000-0000-0000-000000000000`.
- **Network panel**: tick "Preserve log" before actions that navigate or close the tab.
- **Console**: note any entries before and after each step.

## Checks

| # | Page or action | Steps | Expected result | How to force the failure |
|---|---|---|---|---|
| 1 | Project builder, any section | 1. Snapshot one field. 2. Go Offline. 3. Edit the field and wait 2 s. | Error toast or save-error state. No green checkmark. | DevTools Offline |
| 2 | `/project/<bad id>` | 1. Open the URL while signed in. | Error toast that the project failed to load. Not a silent redirect. | Bad id in URL |
| 3 | `/dashboard` | 1. Go Offline. 2. Reload. | Error message on the dashboard. Not an empty list that looks like "no projects". | DevTools Offline before reload |
| 4 | `/onboarding` | 1. Change a field. 2. Go Offline. 3. Wait for auto-save. | Error toast that the save failed. | DevTools Offline |
| 5 | Any builder section, tab close | 1. Online: edit a field, then close the tab or navigate away within 1 s. 2. Repeat with Offline. | Online: a `project_details` upsert appears in Network and completes (200 or 204). Offline: the same request is listed and marked failed. No console crash. | DevTools Offline; close or navigate away |
| 8 | Executive Summary, readiness check | 1. Snapshot insurance fields. 2. Mark all 4 insurance items obtained in Risk Assessment. 3. Open Executive Summary. | Readiness shows 4 of 4 insurance obtained. | Set one item to not obtained, expect 3 of 4 |
| 9 | Budget & Capital, zero Developer Equity | 1. Snapshot Developer Equity. 2. Set it to 0. 3. View the cash return line. | Shows "Cash not invested" instead of 0%. ROI does not show 0% when profit is positive. | Set equity to 0 |
| 10 | Drawing or photo upload (sections using `project-drawings` or `project-photos`) | 1. Go Offline. 2. Choose a file to upload. | Error toast. Spinner stops. No stuck upload state. | DevTools Offline before upload |
| 11 | Project schedule | 1. Snapshot a milestone that has dependents. 2. Move its start date later. | A notice says dependent milestones shifted. | Change a milestone with dependents |
| 12 | Budget & Capital, then Export review | 1. Snapshot sources and uses. 2. Set total sources above total uses. 3. Open pre-export review. | Validation flags that sources exceed uses. | Enter sources above uses |
| 13 | `/profile` | 1. Go Offline. 2. Reload. | Error state with a message. Not a blank form. | DevTools Offline before reload |
| 14 | Signed-in session | 1. Sign in. 2. Reload `/dashboard` online. 3. Reload again with Offline, then go online. | Stays signed in. No redirect to `/` or onboarding loop. Hard to force. Record what happens if it does not reproduce. | Offline during reload |
| 16 | Error boundary | 1. Trigger a render error in a child component. 2. Click "Try again". | Boundary shows the fallback with a working "Try again" that re-renders. | No built-in crash path. Needs a temporary throw in a local, uncommitted branch. Otherwise mark unverified. |
| 17 | Navbar profile photo | 1. Snapshot the profile photo URL. 2. Set it to a broken path. 3. Reload. | Fallback avatar or initials. No broken image or crash. | Broken photo URL |
| 18 | `/profile` | 1. Go Offline. 2. Open `/profile`. | Error state within a few seconds. No endless spinner. | DevTools Offline |
| 20 | Any upload list | 1. Upload 3 files. 2. Remove the middle one. | Remaining items stay correct. Console has no React "key" warning. | Filter console for `key` |
| 21 | Export, rationale | 1. Snapshot a rationale field. 2. Clear it. 3. Export the PDF. | Fallback rationale text is shown. No blank text or `undefined`. | Clear rationale |
| 23 | Section intro modal | 1. Open the modal on the test project. | Correct intro for the project type. Check both new construction and renovation if you can switch. | Snapshot project type before switching |
| 25 | `/dashboard` | 1. Load the page. 2. Watch Network for 5 s. | Projects request runs once. No repeating requests. | Navigate back and forth |
| 26 | `/project/<id>` | 1. Load the builder. 2. Watch Network for 5 s. | Stable request count. No infinite loop. | Navigate between sections |
| 27, 29, 30, 31 | Executive Summary, Budget, readiness checklist, schedule | 1. Open each screen. 2. Check the console. | No debug log output from these screens. Errors only where expected. | Use the screens above |
| 28 | Executive Summary, "Enter your cash in Budget" link | 1. Click the link. | Budget opens with Sources and Uses expanded and the Developer Equity input focused. | Works from both a mounted and an unmounted Budget |
| 59 | `/dashboard`, profile check | 1. Sign in. 2. Go Offline. 3. Reload. | Error toast: "Couldn't load your dashboard. Refresh the page to try again." Not a redirect to onboarding. | DevTools Offline before reload |
| 60 | Executive Summary, Lender Summary PDF | 1. Snapshot any field that feeds the stress-test line. 2. Generate the lender summary. | Lender-facing text uses the exact label "Cash not invested" (not lowercase). | Set Developer Equity to 0 |

## After testing

- Restore every snapshotted field, reload each page, and confirm the values match the snapshot.
- Record the snapshot values and the results in the test notes.
