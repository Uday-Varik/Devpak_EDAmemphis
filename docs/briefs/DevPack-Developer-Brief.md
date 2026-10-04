# DevPack Platform
## Project Brief for Website Developer

---

## EXECUTIVE SUMMARY

### What We're Building

**DevPack** is a web-based platform that helps emerging real estate developers create professional development packages — the documents needed to secure financing for small-scale residential projects (1-4 units).

The core idea: **Guide developers through creating investor-ready packages while teaching them why each element matters.** The platform produces professional output while building permanent capacity.

### Who It's For

- **First-time real estate developers** (completing their first 1-5 projects)
- **Participants in the Emerging Developer Academy** (our training program)
- **Small-scale developers** building or renovating 1-4 unit residential properties
- **Developers working in community development and affordable housing**

### The Problem We're Solving

Emerging developers have viable projects but struggle to present them professionally. They don't know:

- What lenders and investors actually need to see
- How to structure deals that include grants and subsidies
- How to demonstrate that a project is financially feasible
- How to create schedules, budgets, and pro formas that meet industry standards

**The result:** Good deals that never get funded because the developer couldn't communicate the opportunity effectively.

### The Solution

A guided platform that:

1. **Walks developers through each section** of a development package
2. **Teaches them what matters and why** at every step
3. **Auto-calculates financial metrics** and feasibility indicators
4. **Generates professional, investor-ready PDF packages**
5. **Converts funded projects into a management dashboard** for tracking construction

---

## THE USER JOURNEY

### Overview

```
1. SIGN UP      2. CREATE         3. SUBMIT         4. MANAGE
─────────────   ──────────────    ─────────────     ────────────

Developer      Build package     Export PDF and    Track active
creates        section by        submit to         project:
account        section with      lenders, CDFIs,   budget, draws,
               guidance          grant funders     schedule
```

### Detailed Flow

```
            ▼                ▼                  ▼                   ▼
        ┌───────┐      ┌─────────┐      ┌─────────┐      ┌─────────────┐
        │Profile│  ──► │ Package │  ──► │ Funding │  ──► │   Active    │
        │ Setup │      │ Builder │      │ Secured │      │   Project   │
        └───────┘      └─────────┘      └─────────┘      └─────────────┘

Platform teaches    Package is      Closeout adds
while developer     professional    to developer's
completes sections  and complete    track record
```

### Step-by-Step Breakdown

#### Step 1: Account & Profile Setup

Developer creates an account and completes their profile:
- Basic contact information
- Entity information (LLC, etc.)
- Experience level (first project, 2-5 projects, etc.)
- Brief bio/background

**Why this matters:** The developer profile becomes part of every package they create. Lenders evaluate the developer as much as the deal.

#### Step 2: Start a New Project

Developer clicks "New Project" and enters:
- Project name
- Property address (auto-populates census tract, zoning info if APIs integrated)
- Project type (new construction, major renovation, light renovation)

#### Step 3: Build the Package (Section by Section)

The developer works through 10 sections, completing forms and uploading documents:

| Section | What Developer Provides | What Platform Does |
|---------|------------------------|--------------------|
| 1. Executive Summary | Basic project info | Auto-generates summary from other sections |
| 2. Vision & Market | Target market, comps, need statement | Validates affordability math |
| 3. Project Scope | Unit config, finish level, specifications | Estimates costs based on selections |
| 4. Site & Location | Property details, zoning, photos | Checks zoning compliance |
| 5. Schedule | Start date, project type | Generates Gantt chart from template |
| 6. Budget & Capital Stack | Costs, funding sources, subsidies | Balances sources/uses, shows subsidy impact |
| 7. Team | Contractor, attorney, PM, etc. | Creates org chart |
| 8. Risk Assessment | Identifies project risks | Calculates risk scores |
| 9. Resilience Factors | Protective measures in place | Generates resilience score |
| 10. Feasibility | Reviews auto-calculated metrics | Pass/fail indicators, go/no-go decision |

**Throughout this process:**
- Progress bar shows completion percentage
- Teaching content explains why each field matters
- Common mistakes are flagged
- Fields auto-save

#### Step 4: Export Package

When the package is complete, developer can:
- Download full PDF (20-30 pages, professional formatting)
- Download lender summary (2 pages)
- Download investor one-pager (1 page)
- Download Excel financial model
- Download Gantt chart (PNG, PDF, or interactive)

#### Step 5: Submit for Funding

Developer submits package to lenders, CDFIs, and grant funders. (This happens outside the platform initially, though future versions could include direct submission.)

#### Step 6: Mark as Funded

When financing is secured, developer updates project status to "Funded." This triggers conversion to the Project Management module.

#### Step 7: Manage Active Project

The funded project becomes an active dashboard with:
- Live budget tracking (actual vs. projected)
- Draw request preparation and tracking
- Schedule progress updates
- Inspection logging
- Document storage
- Photo documentation

#### Step 8: Project Closeout

When the project exits (sale closes or lease-up completes):
- Final accounting is generated
- Project is marked complete
- Results are added to developer's track record
- Grant reporting data is compiled (if applicable)

---

## CORE FEATURES

### Feature 1: Guided Package Builder

**What it does:** Walks developers through creating a complete development package with form fields, guidance, and validation.

**Key elements:**
- Section-by-section navigation (can complete in any order)
- Progress tracking (percentage complete, which sections done)
- Form fields appropriate to each section (text, numbers, dropdowns, file uploads)
- Auto-save (never lose work)
- Smart defaults (pre-populate typical values where appropriate)

**User experience:**
- Clean, uncluttered forms
- One concept at a time
- Clear labels and placeholders
- Mobile-responsive (developers may work from job sites)

---

### Feature 2: Teaching Layer (Toggle-able)

**What it does:** Provides educational context throughout the platform so developers learn while doing.

| Content Type | Purpose | Example |
|--------------|---------|---------|
| "Why This Matters" | Explains lender/investor perspective | "Lenders use your budget to assess whether you understand real costs. Unrealistic numbers — too high or too low — signal inexperience." |
| "What They're Really Asking" | Translates requirements | "When they ask for 'exit strategy,' they want to know: How do I get repaid? What's Plan B?" |
| "Common Mistakes" | Warns about errors | "Don't list funding sources you haven't secured. Note status clearly: applied, committed, closed." |
| "Pro Tips" | Advanced insights | "Write your executive summary LAST, after completing all other sections. You'll have sharper numbers." |
| "Memphis Context" | Local specifics | "Memphis permits typically take 4-8 weeks for renovation projects. Plan accordingly." |

**Implementation:**
- Teaching content appears in a sidebar or collapsible panel
- Can be toggled on/off globally in settings
- Experienced developers can hide it for a streamlined experience
- First-time developers see it by default

---

### Feature 3: Financial Engine

**What it does:** Auto-calculates key financial metrics from budget and pro forma inputs.

**For Sale Exit:**
- Total profit (ARV minus TDC minus sales costs)
- Profit margin (profit / ARV)
- Return on investment (profit / equity)
- All-in basis (TDC / ARV)
- 70% rule check

**For Rental Exit:**
- Net Operating Income (income minus expenses)
- Cap rate (NOI / value)
- Cash-on-cash return (cash flow / equity)
- Debt service coverage ratio (NOI / debt service)
- 1% rule check

**Validation:**
- Compares metrics to targets (e.g., cap rate > 6%)
- Shows pass/fail/marginal status
- Runs sensitivity analysis (what if ARV is 10% lower?)

---

### Feature 4: Capital Stack with Subsidy Integration

**What it does:** Helps developers structure deals that include grants, forgivable loans, and other soft financing.

**Key capabilities:**
- Add multiple funding sources (senior debt, gap financing, grants, equity)
- Specify terms for each (rate, term, position, conditions)
- Track status of each source (applied, committed, closed)
- Auto-balance sources and uses
- Show subsidy impact (how grants change project feasibility)

**Subsidy impact analysis shows:**
- Debt required with and without subsidy
- Minimum viable rent with and without subsidy
- Income levels that can be served
- Why subsidy is necessary

---

### Feature 5: Gantt Chart Generator

**What it does:** Creates professional project schedules with visual Gantt charts.

**Functionality:**
- Load template schedule based on project type (new construction, major reno, etc.)
- Adjust dates and durations
- Auto-calculate end dates based on dependencies
- Show milestones (financing, permits, CO, exit)
- Include contingency buffer
- Export in multiple formats (PDF, PNG, Excel, interactive HTML)

**User interaction:**
- Select template as starting point
- Modify phases and durations
- Drag to adjust (if interactive version built)
- Add custom phases if needed

---

### Feature 6: PDF Package Generation

**What it does:** Compiles all sections into a professional, investor-ready PDF document.

**Output includes:**
- Cover page with project photo and key metrics
- Table of contents
- All 10 sections with consistent formatting
- Embedded Gantt chart
- Financial tables and calculations
- Appendices (photos, comps, documents)

**Design:**
- Clean, professional typography
- Consistent headers and page numbers
- Alliance for Housing Progress / EDA branding
- Print-ready formatting

---

### Feature 7: Project Management Dashboard (Phase 2)

**What it does:** Converts funded packages into active project tracking.

**Capabilities:**
- Budget tracking (actual vs. projected by category)
- Draw request preparation (documentation checklist, submission tracking)
- Schedule tracking (actual vs. planned progress)
- Inspection logging (scheduled, passed, failed, re-inspect)
- Document storage (organized by category)
- Photo documentation (progress photos by date)

*This feature is lower priority than the package builder but should be designed into the architecture from the start.*

---

## INFORMATION ARCHITECTURE

### The Development Package (10 Sections)

#### Section 1: Executive Summary

**One-page snapshot of the entire project.** Auto-generated from other sections.

**Fields:**
- Project name, address
- Developer name, entity
- Project type (new construction, renovation type)
- Unit count, square footage, beds/baths
- Total development cost
- Capital stack summary (sources with amounts and percentages)
- Funding request (amount and type)
- Exit strategy (sell, rent, lease-to-own)
- Timeline (start date, completion date, months)
- Key metrics (ROI, profit margin OR cap rate, cash-on-cash)
- Developer experience summary

---

#### Section 2: Vision & Market Case

**Why this project, in this location, for this market.**

**Fields:**
- Vision statement (2-3 sentences)
- Target market profile:
  - Buyer or renter?
  - Income range (as % of AMI)
  - Household type (families, professionals, seniors, etc.)
  - Current housing situation
- Market need statement
- Comparable sales/rentals (minimum 3):
  - Address, price/rent, size, beds/baths, date, days on market
- Neighborhood analysis:
  - Name, trajectory assessment, evidence
  - Proximity to amenities
- Competitive advantage
- Community impact statement (for grant applications)

---

#### Section 3: Project Scope

**Exactly what is being built or renovated.**

**Fields:**
- Project type (new construction, major/moderate/light renovation)
- For new construction:
  - Architectural style, foundation type, stories
  - Unit configuration (beds, baths, SF per unit)
  - Finish level (builder grade through luxury)
  - Specifications by category (kitchen, bath, flooring, exterior)
  - Mechanical systems
  - Energy efficiency features
- For renovation:
  - Existing conditions assessment
  - Scope of work (what stays, what changes)
  - Systems assessment (electrical, plumbing, HVAC, roof)
  - Hazardous materials status (lead, asbestos)
  - Permits required
  - Floor plans (upload)
  - Specification documents (upload)

---

#### Section 4: Site & Location

**Property characteristics and location analysis.**

**Fields:**
- Parcel information:
  - Parcel number, legal description
  - Lot size, dimensions, shape
  - Current use
- Site conditions:
  - Topography, drainage
  - Flood zone determination
  - Utilities (water, sewer, gas, electric)
- Title and ownership:
  - Current owner
  - Acquisition method
  - Title status, known issues
  - Survey status
- Zoning analysis:
  - Current zoning
  - Zoning fit test (compliance check for each requirement)
  - Variance needs
  - Historic district status, HOA, deed restrictions
- Location analysis:
  - Walkability scores
  - Proximity to amenities (grocery, schools, employers)
  - Neighborhood assessment
  - Safety/crime data
- Subsidy eligibility screening:
  - Census tract
  - CDBG eligibility
  - Opportunity Zone status
  - Land Bank status
- Photos (upload, minimum 8)
- Survey (upload)

---

#### Section 5: Project Schedule

**Timeline from site control through exit.**

**Fields:**
- Anticipated start date (site control)
- Target construction start
- Target completion (CO)
- Target exit
- Schedule builder:
  - Phase name
  - Duration (weeks)
  - Start date
  - Dependencies
- Milestones:
  - Financing committed
  - Permits issued
  - Construction start
  - Dry-in
  - CO
  - Exit
- Contingency percentage
- Schedule assumptions (text)
- Schedule risks (text)
- **Output:** Visual Gantt chart

---

#### Section 6: Budget & Capital Stack

**What it costs and where the money comes from.**

**Budget (Uses) fields:**
- Acquisition costs (purchase, closing, inspection, etc.)
- Hard costs (by category or lump sum with contingency)
- Soft costs (design, permits, insurance, legal, etc.)
- Financing costs (origination, interest reserve, closing)
- Carrying costs (taxes, insurance, utilities during construction)
- Developer fee (optional)
- Reserves (for rental projects)

**Capital Stack (Sources) fields:**
- Developer equity (amount, timing, source)
- Senior debt (lender, amount, rate, term, status)
- Subordinate/gap debt (lender, amount, rate, term, position, status)
- Grants/subsidies (source, amount, type, requirements, status)

**Validation:**
- Sources must equal Uses
- Show commitment status summary

**Subsidy section fields:**
- Program name
- Administering agency
- Amount
- Type (grant, forgivable loan, deferred loan, etc.)
- Terms (if loan)
- Requirements (income restrictions, affordability period, reporting)
- Subsidy necessity statement (text)

---

#### Section 7: Project Team

**Who is doing the work.**

**Fields:**
- Developer profile (from account, can customize per project)
- Support structure (mentor, academy participation, partner)
- General contractor:
  - Company, contact
  - License number, insurance
  - Experience, references
  - Contract type, status
- Construction/project manager (recommended for first-timers):
  - Name, company
  - Experience
  - Fee structure
  - Services included
- Real estate attorney:
  - Name, firm
  - Services
- Property manager (for rentals):
  - Company, contact
  - License
  - Portfolio size, vacancy rate
  - Fee structure, services
- Extended team (optional):
  - Lender contact
  - CDFI contact
  - Architect
  - Title company
  - Insurance agent
  - CPA
  - Real estate agent

---

#### Section 8: Risk Assessment

**What could go wrong and how you'll address it.**

**Fields:**
- Risk register (pre-populated list, customizable):
  - Risk description
  - Category (market, construction, financial, regulatory, site, personal)
  - Likelihood (1-5)
  - Impact (1-5)
  - Risk score (auto-calculated)
  - Mitigation strategy
  - Custom risks (add your own)
- Risk summary (auto-generated):
  - Heat map
  - High priority risks
  - Mitigation coverage

---

#### Section 9: Resilience Factors

**Built-in protection against setbacks.**

**Fields:**
- Checklist by phase:
  - Pre-development resilience (due diligence period, earnest money limits, contingencies, backup property)
  - Financing resilience (multiple lenders, rate buffer, liquidity reserves, gap financing backup)
  - Construction resilience (contingency funded, schedule float, retainage, lien waivers, contractor backup)
  - Exit resilience (multiple strategies, carrying reserves, price reduction triggers, PM identified)
- Resilience score (auto-calculated from checklist)

---

#### Section 10: Feasibility Analysis

**The go/no-go decision.**

**Fields (mostly auto-calculated):**
- Exit strategy selection (sale or rental)
- For sale:
  - ARV (from comps)
  - Sales costs percentage
  - Net proceeds (calculated)
  - Profit (calculated)
  - Profit margin (calculated)
  - ROI (calculated)
  - All-in basis (calculated)
  - 70% rule check (calculated)
- For rental:
  - Monthly rent, gross annual
  - Vacancy rate
  - Operating expenses (by category or percentage)
  - NOI (calculated)
  - Debt service (calculated)
  - Cash flow (calculated)
  - Cap rate (calculated)
  - Cash-on-cash (calculated)
  - DSCR (calculated)
  - 1% rule (calculated)
- Sensitivity analysis (auto-calculated scenarios)
- Subsidy impact comparison (with/without)
- Go/no-go decision:
  - Decision (GO, CONDITIONAL GO, HOLD, NO GO)
  - Decision rationale (text)
  - Decision date
  - Reviewed by

---

## TECHNICAL REQUIREMENTS

### Platform Requirements

- **Web-based:** Accessible via browser on desktop, tablet, and mobile
- **User accounts:** Email/password authentication (consider social login)
- **Data persistence:** All user data saved to database
- **Auto-save:** Form data saves automatically (no lost work)
- **File storage:** Support for document and image uploads
- **PDF generation:** Create professional PDF packages
- **Responsive design:** Works on mobile devices

### Performance Requirements

- **Page load:** < 3 seconds
- **Auto-save:** < 1 second after user stops typing
- **PDF generation:** < 30 seconds for complete package

### Browser Support

- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Security Requirements

- HTTPS everywhere
- Secure password storage (hashed)
- User data isolated (can only see own projects)
- File uploads scanned/validated
- Session management (timeout after inactivity)

---

## DESIGN REQUIREMENTS

### Brand Identity

- **Primary color:** Deep blue (#1B4F72) — trust, professionalism
- **Secondary color:** Medium blue (#2E86AB) — approachable
- **Accent color:** Orange/gold (#F39C12) — attention, action
- **Success:** Green (#27AE60)
- **Warning:** Yellow (#F1C40F)
- **Error:** Red (#E74C3C)

### Design Principles

1. **Clean and uncluttered** — One task at a time, minimal distraction
2. **Professional output** — The tool should look like it produces quality work
3. **Progressive disclosure** — Show what's needed now, hide complexity
4. **Clear navigation** — Always know where you are and what's complete
5. **Mobile-friendly** — Developers may work from job sites

### Typography

- **Headings:** Clean sans-serif (Inter, Open Sans, or similar)
- **Body:** Readable sans-serif, 16px minimum
- **Numbers/data:** Monospace or tabular figures for alignment

### Key UI Patterns

- **Section navigation:** Sidebar or tab-based, with completion status
- **Progress indicators:** Visual percentage bars
- **Form validation:** Inline errors, clear messages
- **Help content:** Collapsible panels, tooltips, info icons
- **Status badges:** Color-coded (planning, funded, active, complete)

---

## DEVELOPMENT PHASES

### Phase 1: MVP Package Builder (Priority)

**Goal:** Working tool that creates development packages

**Scope:**
- User authentication
- Project creation
- Core sections (Executive Summary, Scope, Budget, Feasibility)
- Basic form fields and validation
- PDF export (basic formatting)
- Progress tracking

**Timeline:** 8-12 weeks

---

### Phase 2: Complete Package Builder

**Goal:** Full-featured package creation with all sections

**Scope:**
- All 10 sections
- Teaching content layer
- Gantt chart generation
- Multiple export formats
- Financial calculations and validation
- Subsidy integration

**Timeline:** 6-8 weeks after Phase 1

---

### Phase 3: Project Management

**Goal:** Support for active project tracking

**Scope:**
- Project status conversion (planning → funded → active)
- Budget tracking module
- Draw request management
- Document storage
- Basic reporting

**Timeline:** 8-10 weeks after Phase 2

---

### Phase 4: Enhancements

**Goal:** Advanced features and integrations

**Scope:**
- Data integrations (property data, zoning, Walk Score)
- Partner integrations (lender submission, Land Bank)
- Advanced reporting
- Program administration dashboard
- Multi-user collaboration

**Timeline:** Ongoing

---

## SUCCESS CRITERIA

### For Users (Developers)

- Can complete a full package in under 4 hours
- Package is accepted by lenders without requests for additional information
- Developer learns something new through the teaching content
- Developer returns to create packages for subsequent projects

### For the Platform

- 80%+ of started packages are completed
- 60%+ of completed packages result in funded projects
- Users rate the platform 4+ stars
- Platform handles 100+ concurrent users

### For the Organization

- Emerging Developer Academy participants use the platform as standard practice
- Lenders recognize and trust packages created with DevPack
- Platform demonstrates impact for grant reporting
- Platform becomes sustainable (either grant-funded or revenue-generating)

---

## QUESTIONS FOR DISCUSSION

1. **Build vs. integrate:** Should we build the Gantt chart from scratch or use an existing library?
2. **PDF generation:** What approach for PDF generation? (Server-side vs. client-side, library options)
3. **File storage:** What's the expected volume of file uploads? (Impacts storage architecture)
4. **Offline capability:** Do users need to work offline? (Significantly impacts architecture)
5. **Multi-user:** Will multiple team members need to collaborate on a single project? (Impacts data model)
6. **Admin dashboard:** What reporting/oversight does the organization need? (Separate interface?)
7. **API integrations:** Which external data sources are highest priority? (Property data, zoning, etc.)
8. **Mobile priority:** Is mobile a "nice to have" or "must have" for MVP?

---

*Project Brief prepared for DevPack platform development*
*Alliance for Housing Progress / Emerging Developer Academy*
*January 2026*
