# DevPack Complete Bug Registry
**October 5, 2026 - All 34 Bugs Documented**

---

## EXECUTIVE SUMMARY

**Total Bugs Found:** 34 (17 original + 17 newly discovered)
**Total Fix Effort:** 41.5 hours (~$1,038 at $25/hour)
**Critical Path (must fix first):** 15 hours (silent failures, data loss)

---

## BUG CATEGORIES & PRIORITIES

### 🔴 CRITICAL PATH - SILENT FAILURES & DATA LOSS (10 bugs, 15 hours)
These bugs directly cause data loss or prevent users from knowing if operations succeeded.

#### BUG #1: Multi-Property Square Footage Not Calculated ⚠️ DATA INTEGRITY
- **Severity:** CRITICAL
- **Impact:** Developers export packages with severely undersized construction costs
- **Location:** `src/components/builder/sections/ProjectScopeForm.tsx` + `src/utils/calculations.ts:161`
- **Example:** 6 properties × 1,200 SQ ft should be 7,200 SQ ft total, but system only uses 1,200 SQ ft
- **Fix Effort:** 2 hours

#### BUG #2: File Upload Errors Not Shown to Users
- **Severity:** CRITICAL
- **Impact:** Users don't know when file uploads fail
- **Locations:** `src/components/builder/sections/site-location/SitePhotoUpload.tsx:54` and `ConceptDrawingsUpload.tsx:56`
- **Fix Effort:** 2 hours

#### BUG #3: Insurance Data Structure Mismatch 🔄 DATA SYNC ISSUE
- **Severity:** CRITICAL
- **Impact:** Executive Summary shows "0 of 4 obtained" even when all insurance marked obtained
- **Root Cause:** RiskAssessmentForm stores `buildersRiskInsurance`, but ExecutiveSummaryForm looks for `risk.insurance.buildersRisk`
- **Locations:** `src/components/builder/sections/RiskAssessmentForm.tsx:76-84` vs `ExecutiveSummaryForm.tsx:339-341`
- **Fix Effort:** 2 hours

#### BUG #4: ROI Shows 0% When Deal Has Positive Profit 💰 FINANCIAL METRIC
- **Severity:** CRITICAL
- **Impact:** Confusing financials (e.g., $703k profit but 0% ROI)
- **Root Cause:** `roi = cashEquity > 0 ? (netProfit / cashEquity) * 100 : 0;` returns 0 when cashEquity is 0
- **Location:** `src/utils/calculations.ts:239`
- **Fix Effort:** 2-3 hours

#### BUG #10: Project Fetch Error Not Shown to User
- **Severity:** CRITICAL
- **Impact:** User redirected to dashboard without explanation
- **Location:** `src/pages/ProjectBuilder.tsx:146`
- **Fix Effort:** 1 hour

#### BUG #11: Section Save Error Not Shown to User 🚨 HIGHEST PRIORITY
- **Severity:** CRITICAL
- **Impact:** User thinks changes saved; they're lost (DATA LOSS RISK)
- **Location:** `src/pages/ProjectBuilder.tsx:193`
- **Fix Effort:** 1 hour

#### BUG #12: Dashboard Data Fetch Error Not Shown to User
- **Severity:** CRITICAL
- **Impact:** Dashboard loads empty without explanation
- **Location:** `src/pages/Dashboard.tsx:112`
- **Fix Effort:** 1 hour

#### BUG #13: Onboarding Auto-Save Error Not Shown to User
- **Severity:** CRITICAL
- **Impact:** User's onboarding data might not save without them knowing
- **Location:** `src/pages/Onboarding.tsx:66`
- **Fix Effort:** 1 hour

#### BUG #21: Fire-and-Forget Saves in useAutoSave 🔥 FIRE-AND-FORGET DATA LOSS
- **Severity:** CRITICAL
- **Impact:** Browser may close tab before save completes
- **Location:** `src/hooks/useAutoSave.ts:79, 93`
- **Why It's Critical:** `onSaveRef.current()` called without await in beforeunload/unmount
- **Fix Effort:** 2 hours

#### BUG #26: Unhandled Promise Rejection in fetchProjectExportData 💥 CRASH RISK
- **Severity:** CRITICAL
- **Impact:** PDF/Excel export can crash without meaningful error
- **Location:** `src/utils/fetchProjectData.ts:140, 159-162`
- **Why It's Critical:** Promise.all() chain doesn't catch nested `.then()` errors
- **Fix Effort:** 1.5 hours

**Subtotal: 10 bugs, 15 hours**

---

### 🟠 HIGH PRIORITY - ERROR HANDLING & VALIDATION (9 bugs, 12 hours)

#### BUG #6: Schedule Cascade Warnings Not Shown to Users
- **Severity:** HIGH
- **Impact:** Users don't realize schedule has date/cascade problems
- **Location:** `src/components/builder/sections/ProjectScheduleForm.tsx`
- **Fix Effort:** 2 hours

#### BUG #7: Budget Sources/Uses Balance Not Validated
- **Severity:** HIGH
- **Impact:** Developer can export budget where sources don't equal uses
- **Location:** `src/utils/validatePackage.ts` (missing validation rule)
- **Fix Effort:** 3 hours

#### BUG #8: Profile Fetch Error Not Shown to User
- **Severity:** MEDIUM
- **Impact:** User doesn't know if developer profile failed to load
- **Location:** `src/components/builder/sections/ProjectTeamForm.tsx:151`
- **Fix Effort:** 1 hour

#### BUG #18: Race Condition in Auth State Initialization
- **Severity:** CRITICAL
- **Impact:** Auth may not properly wait for initial session
- **Location:** `src/hooks/useAuth.tsx:21-36`
- **Why It's Critical:** `getSession()` and listener fire simultaneously
- **Fix Effort:** 2 hours

#### BUG #19: Unreliable Recovery Session Detection
- **Severity:** HIGH
- **Impact:** Password reset flow may not work correctly
- **Location:** `src/pages/ResetPassword.tsx:19`
- **Fix Effort:** 1.5 hours

#### BUG #22: Unrecoverable Error State in ErrorBoundary
- **Severity:** CRITICAL
- **Impact:** Users stuck on error screen until page refresh
- **Location:** `src/components/ErrorBoundary.tsx`
- **Fix Effort:** 1 hour

#### BUG #23: Missing Error Handling in Navbar Supabase Query
- **Severity:** HIGH
- **Impact:** Profile photo fails to load silently
- **Location:** `src/components/Navbar.tsx:27-34`
- **Fix Effort:** 0.5 hours

#### BUG #30: Missing Error Handling on Project Load
- **Severity:** CRITICAL
- **Impact:** Query failures silently show empty project list
- **Location:** `src/pages/Dashboard.tsx:107`
- **Fix Effort:** 0.5 hours

#### BUG #28: Missing Authorization Check Before Navigation
- **Severity:** HIGH
- **Impact:** User could be stuck in loading state indefinitely
- **Location:** Multiple route handlers
- **Fix Effort:** 1.5 hours

**Subtotal: 9 bugs, 12 hours**

---

### 🟡 MEDIUM PRIORITY - STATE MANAGEMENT & LOGIC (7 bugs, 10 hours)

#### BUG #20: Unsafe Array Indexing as React Key
- **Severity:** MEDIUM
- **Impact:** Deleting/reordering files causes UI glitches
- **Locations:** `SitePhotoUpload.tsx:134` and `ConceptDrawingsUpload.tsx:125`
- **Fix Effort:** 1 hour

#### BUG #24: Logic Error in Narrative Rationale Generation
- **Severity:** MEDIUM
- **Impact:** Rationale text may not load correctly
- **Location:** `src/utils/fetchProjectData.ts:289-296`
- **Why:** Ternary checks `storedRationale` twice; second never true
- **Fix Effort:** 1 hour

#### BUG #25: Inadequate Currency Input Parsing
- **Severity:** MEDIUM
- **Impact:** Large amounts like "1,234,567" parse incorrectly as "1.234567"
- **Location:** `src/components/form/CurrencyInput.tsx:44-45`
- **Fix Effort:** 1 hour

#### BUG #27: Duplicate Project Type Queries
- **Severity:** MEDIUM
- **Impact:** Wasted network calls, potential data inconsistency
- **Locations:** `SectionIntroModal.tsx` and `useProjectType.ts`
- **Fix Effort:** 1.5 hours

#### BUG #31: Onboarding Step Restoration Race Condition
- **Severity:** MEDIUM
- **Impact:** User could get returned to wrong onboarding step
- **Location:** `src/pages/Onboarding.tsx:36-52`
- **Fix Effort:** 1 hour

#### BUG #16: Missing useEffect Dependency in Dashboard
- **Severity:** HIGH
- **Impact:** Navigation logic may use outdated references
- **Location:** `src/pages/Dashboard.tsx:88`
- **Fix Effort:** 0.5 hours

#### BUG #22: Missing useEffect Dependency in ProjectBuilder
- **Severity:** HIGH
- **Impact:** Project data may not update when needed
- **Location:** `src/pages/ProjectBuilder.tsx:95`
- **Fix Effort:** 0.5 hours

**Subtotal: 7 bugs, 10 hours**

---

### 🟢 LOW PRIORITY - POLISH & CLEANUP (8 bugs, 4.5 hours)

#### BUG #5: Debug Console Logs in ExecutiveSummaryForm
- **Severity:** HIGH (professional impact)
- **Locations:** Lines 191, 198, 202
- **Fix Effort:** 0.5 hours

#### BUG #9: Cash-on-Cash Return Shows 0% (cascading from BUG #4)
- **Severity:** MEDIUM
- **Impact:** Related to ROI bug
- **Fix Effort:** Included in Bug #4 fix

#### BUG #11: Debug Logs in BudgetCapitalForm
- **Severity:** LOW
- **Location:** Line 176
- **Fix Effort:** 0.25 hours

#### BUG #12: Debug Logs in PackageReadinessChecklist
- **Severity:** LOW
- **Locations:** Lines 57, 126
- **Fix Effort:** 0.25 hours

#### BUG #13: Extensive Debug Logs in ProjectScheduleForm
- **Severity:** MEDIUM
- **Locations:** Lines 230, 233, 240, 251, 267, 275, 285, 295, 307
- **Fix Effort:** 1 hour

#### BUG #17: Unsafe User Access Without Null Check
- **Severity:** HIGH (crash risk)
- **Impact:** App can crash with "Cannot read property 'id' of null"
- **Location:** `src/pages/Dashboard.tsx:94`
- **Fix Effort:** 0.5 hours

#### BUG #29: Potential Null Reference in AuthModal
- **Severity:** MEDIUM
- **Impact:** Potential runtime error
- **Location:** `src/components/auth/AuthModal.tsx:66`
- **Fix Effort:** 0.5 hours

**Subtotal: 8 bugs, 4.5 hours**

---

## FIX PRIORITY ROADMAP

### Phase 1: CRITICAL PATH (Day 1-2, 15 hours) ⚠️ MUST DO FIRST
1. Bug #11 - Section save error (1 hr) - HIGHEST DATA LOSS RISK
2. Bug #21 - Fire-and-forget saves (2 hrs)
3. Bug #26 - Promise rejection crash (1.5 hrs)
4. Bug #1 - Multi-property SQ footage (2 hrs)
5. Bug #3 - Insurance sync (2 hrs)
6. Bug #4 - ROI edge case (2-3 hrs)
7. Bug #10, #12, #13 - Silent failures (3 hrs)
8. Bug #18 - Auth race condition (2 hrs)

### Phase 2: HIGH PRIORITY (Day 3-4, 12 hours)
9. Bug #2 - File upload errors (2 hrs)
10. Bug #6 - Schedule validation (2 hrs)
11. Bug #7 - Budget validation (3 hrs)
12. Bug #19 - Recovery detection (1.5 hrs)
13. Bug #22 - ErrorBoundary recovery (1 hr)
14. Bug #23, #30 - Missing error checks (1 hr)
15. Bug #28 - Nav guards (1.5 hrs)

### Phase 3: MEDIUM PRIORITY (Day 5, 10 hours)
16. Bug #20 - React keys (1 hr)
17. Bug #24 - Narrative logic (1 hr)
18. Bug #25 - Currency parsing (1 hr)
19. Bug #27 - Duplicate queries (1.5 hrs)
20. Bug #31 - Onboarding race (1 hr)
21. Bug #16, #22 - useEffect deps (1 hr)
22. Bug #8 - Profile error (1 hr)

### Phase 4: POLISH (Day 5-6, 4.5 hours)
23. Bug #5, #13 - Debug logs (1.5 hrs)
24. Bug #11, #12 - More debug (0.5 hrs)
25. Bug #17, #29 - Null checks (1 hr)

---

## TESTING CHECKLIST

- [ ] **Critical Path Tests** (must pass before any user testing)
  - [ ] Section auto-save works with network failures (shows error)
  - [ ] File uploads show error toasts on failure
  - [ ] Project loading shows error if fetch fails
  - [ ] Dashboard shows error if fetch fails
  - [ ] Auth initializes correctly without race conditions
  - [ ] Export doesn't crash on promise rejection

- [ ] **Integration Tests**
  - [ ] Multi-property SQ footage calculates correctly
  - [ ] Insurance data syncs between Risk Assessment and Executive Summary
  - [ ] ROI calculates correctly when cashEquity = 0 but profit > 0
  - [ ] Budget balance validation blocks unbalanced exports
  - [ ] Schedule validation shows user-facing warnings
  - [ ] Currency inputs parse large numbers correctly
  - [ ] All console.log statements removed

- [ ] **Functional Tests**
  - [ ] All three PDF exports generate without errors
  - [ ] Excel export generates and opens correctly
  - [ ] Mobile layout renders acceptably
  - [ ] No TypeScript errors
  - [ ] No console errors during normal usage

---

## COMMON PATTERNS

### Pattern 1: Silent Failure (5 bugs: #2, #8, #10, #12, #13)
**Problem:** Error detected but not shown to user
**Solution:** Add `toast({ title: "Error", variant: "destructive" })` alongside `console.error()`

### Pattern 2: Missing .error Check (3 bugs: #23, #30, more in dashboard)
**Problem:** Supabase query doesn't check `.error` property
**Solution:** Always check `if (error) { ... }` after Supabase queries

### Pattern 3: Division by Zero (3 bugs: #4, #9, #10)
**Problem:** `denominator > 0 ? (numerator / denominator) : 0` returns 0 when denominator is 0 but numerator > 0
**Solution:** Add alternative calculation when denominator is 0 but value is meaningful

### Pattern 4: Data Structure Mismatch (1 bug: #3)
**Problem:** Form A stores data differently than Form B expects it
**Solution:** Standardize on one TypeScript interface, use in all consumers

### Pattern 5: React Best Practices (2 bugs: #16, #20, #22)
**Problem:** Missing dependencies, array index as key
**Solution:** Run eslint-plugin-react-hooks to catch all violations

---

## EFFORT SUMMARY TABLE

| Category | Bugs | Hours | Priority |
|----------|------|-------|----------|
| Critical Path | #1-4, #10-13, #21, #26 | 15 | 🔴 DO FIRST |
| High Priority | #2, #6-8, #18-19, #22-23, #28, #30 | 12 | 🟠 DO SECOND |
| Medium | #16, #20, #24-27, #31 | 10 | 🟡 DO THIRD |
| Low/Polish | #5, #9, #11-12, #17, #29 | 4.5 | 🟢 DO LAST |
| **TOTAL** | **34 bugs** | **41.5 hrs** | |

---

## COST BREAKDOWN

At $25/hour:
- Critical Path: 15 hrs = $375
- Critical + High: 27 hrs = $675
- All bugs: 41.5 hrs = $1,038
- All bugs + mobile: 48.5 hrs = $1,213
- All bugs + mobile + testing: 64.5 hrs = $1,613

---

**Generated:** October 5, 2026
**Status:** Complete bug registry ready for implementation
**Next Step:** Begin Phase 1 (critical path) fixes

For more details, see:
- CLIENT_ASSESSMENT.md - Executive overview and launch options
- KNOWN_BUGS.md - Detailed per-bug fixes
- BUGS_DEEP_ANALYSIS.md - Root cause analysis and patterns
