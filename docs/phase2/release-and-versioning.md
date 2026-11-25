# Release and Versioning

**Status:** Draft. Needs owner review. No CHANGELOG file exists in the repo yet; the template below can start one.

---

## 1. Versioning rule (semver tags)

DevPack uses [semantic versioning](https://semver.org): `vMAJOR.MINOR.PATCH`, for example `v1.4.2`.

| Part | Bump when | Examples |
|---|---|---|
| MAJOR | A change users must act on, or that changes a financial result or an export layout in a way lenders would notice | Changing how ROI or DSCR is calculated; removing an export; a data migration that users must run |
| MINOR | New user-facing feature that is backward compatible | A new builder field; a new export option; a new section tool |
| PATCH | Bug fix or wording change with no new feature | Fix an autosave error; correct a label; fix a broken link |

Rules:

- Tags are the source of truth for versions. Tag only commits on `main`.
- Use annotated tags (`git tag -a`), not lightweight tags.
- Do not move or reuse a tag. If a release is bad, cut a new patch release.
- Pre-releases use a suffix: `v1.5.0-rc.1`. Use them for staging sign-off if you want one.
- The `version` field in `package.json` should match the latest tag. Update it in the same pull request as the release notes, if the owner wants `package.json` kept in step. *(Owner decision: keep `package.json` in step with tags, or leave it at `0.0.0` and rely on tags only.)*

Financial changes need extra care. Any change to `src/utils/calculations.ts` or to the parity-tested code is at least a MINOR release, and the release notes must name the metric that changed and how.

---

## 2. Release notes template

Save as the body of the GitHub release (or as a section in `CHANGELOG.md` if you start one).

```markdown
## vX.Y.Z - YYYY-MM-DD

**Summary:** One or two sentences on what users will notice.

### Added
- [user-facing feature, with the section or export it affects]

### Changed
- [behavior change, and whether existing packages or figures are affected]

### Fixed
- [bug, in plain language, with the symptom users saw]

### Financial and export impact
- Metrics affected: [none / list]. Explain any change to a calculated figure.
- Exports affected: [none / PDF / Excel / list]

### Database and functions
- Migrations: [none / file names]
- Edge functions redeployed: [none / names]
- Action needed by users: [none / describe]

### Known issues
- [issue, workaround]

Verified on staging: [date, tester]
```

Keep entries short. Write for a developer user, not for the team.

---

## 3. Cutting a release from `main`

Only the owner or a designated release manager cuts releases.

1. **Check the state of `main`.** It must be green: CI passed, and the last deploy to staging passed the smoke test in `docs/phase2/deployment.md`, section 8.
2. **Update local main:**

```sh
git checkout main
git pull --ff-only origin main
```

3. **Check that no unreleased work is pending** for this version. Review merged pull requests since the last tag:

```sh
git log --oneline $(git describe --tags --abbrev=0)..HEAD
```

4. **Pick the version** using the rules in section 1. If you bump `package.json`, do it in a pull request to `main` first, then wait for CI.
5. **Write the release notes** from the template. Include the migrations and functions that changed (see the `supabase/` folders in the diff).
6. **Tag the commit:**

```sh
git tag -a vX.Y.Z -m "DevPack vX.Y.Z"
```

7. **Push the tag** (owner action):

```sh
git push origin vX.Y.Z
```

8. **Create the GitHub release** from that tag, and paste the release notes.
9. **Deploy.** Follow `docs/phase2/deployment.md`: migrations and functions first on production, then the frontend. Smoke test.
10. **Tell users** if the release changes anything they must do (for example, a figure that will now show differently).

If the release is bad, do not delete the tag. Roll back (see `docs/phase2/incident-runbook.md`), then cut a patch release with the fix.

---

## 4. Hotfix

For a SEV-1 fix that cannot wait for the normal flow:

1. Branch from the tag that is live, not from `main`, if `main` has unreleased work you do not want to ship: `git checkout -b hotfix/vX.Y.Z+1 vX.Y.Z`.
2. Make the smallest fix. Run tests and the build locally.
3. Merge the fix to `main` as well, so the fix is not lost in the next release.
4. Tag `vX.Y.(Z+1)` on the hotfix commit, and follow section 3 from step 6.
