# DevPack User Manual

**Status:** Draft. Needs owner review (wording, screenshots, and anything the owner wants changed before sharing).

This guide is for a developer who is using DevPack for the first time. It follows the order you will actually use the app: create an account, set up your developer profile, create a project, fill in the 10 sections, check the package, and export it.

DevPack helps you build a lender- or investor-ready package for a small residential project (1 to 4 units). It organizes your numbers and text. It does not approve loans, give financial advice, or guarantee that any lender or investor will say yes.

---

## 1. Sign up and sign in

1. Open the DevPack home page and select **Sign up** (or sign in if you already have an account).
2. On the sign-up form, enter your **Full Name**, **Email**, and a **Password** of at least 6 characters.
3. DevPack shows "Account created!" and asks you to check your email. Open the verification email and confirm your address.
4. Sign in with your email and password. You land on your **Dashboard** (your project list).

**Signing out:** open the menu at the top right and select sign out.

### Forgot your password

1. On the sign-in form ("Welcome back"), choose the forgot-password option. The form changes to "Reset your password". Enter your email and select **Send Reset Link**.
2. DevPack shows "Check your email." If an account exists for that address, a reset link is sent. (The message is the same either way, for privacy.)
3. Open the email and select the link. It opens the **Set a new password** page.
4. Enter the new password and confirm it. It must be at least 6 characters, and both fields must match.
5. DevPack signs you in and takes you to the Dashboard.

---

## 2. Set up your developer profile (onboarding)

The first time you sign in, DevPack asks you to set up a developer profile. Its details are reused across the packages you build. The wizard has four steps:

| Step | What it asks for |
|---|---|
| 1. Basic Info | Full name and email (both required to continue) |
| 2. Experience | Your background and credentials |
| 3. Headshot | An optional professional photo |
| 4. Portfolio | Past work you want to show |

- You can leave partway through. DevPack saves what you entered, returns you to the Dashboard, and resumes at the same step next time.
- You can change your profile at any time from the menu, **Profile** page ("My Developer Profile").
- Your developer name is checked before export. If it is blank, the pre-export review shows a critical item (see section 6).

---

## 3. Create a project

1. On the **Dashboard**, select **New Project**.
2. Enter a **Project Name** (required), for example "123 Main St Duplex".
3. Optionally enter a **Property Address**. If you enter one, DevPack tries to fill in the city, state, and ZIP for you.
4. Select create. DevPack opens the project in the builder.

**Deleting a project:** from the Dashboard, delete it and confirm. The project and its data are permanently removed. There is no undo.

---

## 4. The builder: sections in order

The builder has 10 sections. The left menu lists them in order. A progress bar at the top shows how much of the package is complete. The percentage counts the first 9 sections. The Executive Summary is the final review step and is not counted.

DevPack saves as you type (see the FAQ for how autosave works). Some sections also have **Save Draft** and **Mark Complete** buttons. Marking a section complete saves it and moves you to the next section.

| # | Section | What you enter (summary) |
|---|---|---|
| 1 | Project Scope | Project type and property type (required), number of units, existing and total square footage, bedrooms and bathrooms per unit, scope of work, optional concept drawings and plans |
| 2 | Vision & Market Case | Project vision, target market, target income level, community impact; neighborhood figures you have sourced (income, home price, rent, vacancy, trend); comparable sales or rentals |
| 3 | Site & Location | Address, city, state, ZIP, county; lot size and dimensions; topography and current condition; flood zone; zoning, permitted use, density, setbacks, height, parking, entitlement status; site photos; subsidy programs |
| 4 | Project Schedule | Project start and target completion; milestones with dates, status, and dependencies; timeline notes |
| 5 | Budget & Sources/Uses | Land value or purchase price, closing and title costs, construction costs (itemized or by cost per square foot), contingency, soft costs, your cash (Developer Equity), other funding sources, subsidies |
| 6 | Project Team | Developer role and equity, general contractor, architect/designer, property manager (company, contact, license, experience, bid status) |
| 7 | Risk Assessment | Risks by category with likelihood, impact, and mitigation; permit status; code compliance notes; insurance |
| 8 | Resilience Factors | A checklist of factors that support the project, plus any additional strengths |
| 9 | Feasibility Analysis | Exit strategy (sell or rent), hold period, after-repair value or rent, operating costs and reserves. DevPack calculates returns, DSCR, cap rate and rule-of-thumb checks |
| 10 | Executive Summary | Package purpose, project overview, optional AI-assisted text, a key-numbers review, a readiness check, and the export menu |

Notes:

- **Total square footage** in Project Scope means the total for all units, not one unit. Example: 4 units at 1,200 SF each is 4,800.
- On Executive Summary, **Mark Complete** is available only when the project overview has text and the Budget and Feasibility sections are complete.
- All figures in the package are calculated from the numbers you enter. Use your own sources for market data. DevPack's AI text tool does not add market statistics that you did not provide.

---

## 5. The teaching panel

The **Learning Guide** is a side panel on most sections (not Executive Summary). It has four tabs:

- **Why This Matters**: why the section matters to a lender or investor.
- **Common Mistakes**: errors to avoid.
- **Pro Tips**: practical advice.
- **Memphis Context**: local considerations.

A section intro pop-up appears when you open a section that has no data yet. Close it with **Got it, let's go**. You can also choose not to see intros again. Both the panel and the intros are part of **Teaching Mode**, which is on by default.

- To hide the intro pop-ups and the Learning Guide, turn **Teaching Mode** off on the **Profile** page. Field tooltips stay on.
- If you close the panel, a **Tips** tab on the right edge reopens it (on wide screens).

---

## 6. Pre-export review

Before any export, DevPack runs a **Pre-Export Review**. It lists findings in three levels: **Critical**, **Warning**, and **Info**. Each finding names the section to fix.

The review checks, among other things:

- Different addresses in different sections
- Missing projected value (sale exit) or missing projected rent (rental exit)
- DSCR below 1.20
- Projected rent more than 25% above the area average
- Fewer than 3 comparable properties
- Gaps of more than 14 days between schedule milestones
- Loan maturity less than 90 days after completion
- Readiness score below 50% (resilience factors)
- A funding gap, or sources that exceed uses
- A missing developer name
- No package purpose selected

**The review is advisory.** It does not block you. The button reads **Export Anyway** when there are findings, or **Continue** when there are none. Fix what is real before you send anything to a lender.

---

## 7. Exporting the package

Go to the **Executive Summary** section, select **Export Package**, then choose one:

| Export | Format | What the menu describes it as |
|---|---|---|
| Full Development Package | PDF | Complete lender document |
| Lender Summary | PDF | Condensed financial overview |
| Investor One-Pager | PDF | Single-page deal summary |
| Excel Workbook | .xlsx | Financial data spreadsheet |

Steps:

1. Select the export. The pre-export review opens first.
2. Read the findings, fix anything important, or continue.
3. Select **Continue** or **Export Anyway**. The file generates and downloads. The button shows progress while it works.

Keep your own copy of each export. DevPack does not send exports to anyone.

---

## 8. Get help

- Problems with saving, signing in, or exports: see the [FAQ](faq.md).
- For anything else, contact the owner of your DevPack account or the support contact the owner publishes. *(Owner: add the support contact here.)*
