# DevPack Platform Wireframe Concepts
## UI/UX Design Direction for Lovable/Replit Build

## Design Philosophy

**Clean, Guided, Trustworthy**

The platform should feel like a knowledgeable mentor walking alongside the developer — not a bureaucratic form. Every screen should answer: "What do I do here, and why does it matter?"

## Design Principles

1. **Progressive Disclosure** — Show what's needed now, hide complexity until relevant
2. **Contextual Teaching** — Education appears where and when it's useful
3. **Visual Progress** — Always show where you are and what's complete
4. **Mobile-Responsive** — Developers may work from job sites
5. **Professional Output** — The tool looks like it produces quality work

## Color Palette

- **Primary Blue: #1B4F72** — Headers, primary actions, trust
- **Secondary Blue: #2E86AB** — Links, secondary elements
- **Success Green: #27AE60** — Completed items, positive status
- **Warning Orange: #F39C12** — Attention items, in-progress
- **Alert Red: #E74C3C** — Errors, critical warnings
- **Light Background: #EBF5FB** — Teaching callouts, section backgrounds
- **Dark Text: #2C3E50** — Body text
- **Light Text: #7F8C8D** — Secondary text, placeholders

---

## Screen 1: Dashboard (Home)

### Purpose
The hub. Show all projects, progress, and quick actions.

### Key Elements
- **Project Cards** — Show status at a glance, clear CTAs
- **Progress Bars** — Visual completion percentage
- **Status Badges** — Planning / Active / Completed
- **Quick Actions** — "Continue" takes you right where you left off
- **Learning Resources** — Optional section, can be collapsed

### Layout Structure
```
┌──────────────────────────────────────────────────────────────────────
│ ┌─────────┐ [+ New Project] │
│ │ DevPack │ Dashboard Welcome, Rasheedah ▼ │
│ └─────────┘ │
├──────────────────────────────────────────────────────────────────────
│ YOUR PROJECTS │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│ │ Planning                    │ │ 🏗 Active                   │
│ │ 1847 Rozelle St             │ │ 2341 Deadrick Ave           │
│ │ ██████████░░░░ 72%          │ │ Day 47 of 120               │
│ │ Last edited: 2 days ago     │ │ Budget: $89K / $185K        │
│ │ [Continue →]                │ │ Status: ✓ On Track          │
│ └─────────────────────────────┘ │ [View Dashboard →]          │
│                                 └─────────────────────────────┘
│ ┌─────────────────────────────┐
│ │ 456 Chelsea Ave             │ ┌─────────────────────────────┐
│ │ ██████░░░░░░░░ 45%          │ │ ✓ Completed                 │
│ │ Last edited: 1 week ago     │ │ • 789 Dunlap St (Sold)      │
│ │ [Continue →]                │ │ • 123 Trigg Ave (Rented)    │
│ └─────────────────────────────┘ └─────────────────────────────┘
│ [+ Start New Package]
│
│ 📚 LEARNING RESOURCES
│ • Understanding the Pencil Test (Video, 8 min)
│ • How to Read a Comp Analysis (Article)
│ • Capital Stack Basics for Emerging Developers (Webinar)
└──────────────────────────────────────────────────────────────────────
```

---

## Screen 2: Package Builder (Section Navigation)

### Purpose
The main workspace for creating development packages. Left sidebar for navigation, main area for content, right panel for help.

### Key Elements
- **Section Sidebar** — Shows all sections with completion status (✓ ● ○)
- **Progress Indicator** — Overall package completion
- **Main Content Area** — Current section form fields
- **Help Panel** — "Why This Matters" and "Common Mistakes" (toggle-able)
- **Info Icons** — (?) opens detailed explanations for any field
- **Navigation** — Previous/Next buttons, auto-save

### Layout Structure
```
Desktop View:
┌──────────────────────────────────────────────────────────────────────
│ ← Back to Dashboard 1847 Rozelle St [Export ▼] │
├──────────────────────────────────────────────────────────────────────
│ ┌─────────────┐ ┌───────────────────────────────────────┐
│ SECTIONS │ │ 3. PROJECT SCOPE │ 💡 WHY THIS MATTERS
│ │ ✓ Executive │ │ Define what you're building. │ Lenders need
│ ✓ Market     │ │ to understand
│ ● Scope ◄── │ │ ┌─────────────────────────────────┐ │ exactly what
│ ○ Site       │ │ │ Project Type                    │ │ they're
│ ○ Schedule   │ │ │ ○ New Construction              │ │ financing to
│ ○ Budget     │ │ │ ● Major Renovation              │ │ assess value.
│ ○ Team       │ │ │ ○ Moderate Renovation           │ │
│ ○ Risk       │ │ │ ○ Light Renovation              │ │ ⚠️ COMMON
│ ○ Resilience │ │ └─────────────────────────────────┘ │ MISTAKE
│ ○ Work Plan  │ │ │ │ Being vague
│ ○ Feasibility│ │ ┌─────────────────────────────────┐ │ about scope
│          │ │ │ Unit Configuration              │ │ leads to bids
│ ─────────── │ │ │                                 │ │ that don't
│ Progress    │ │ │ Unit 1:                         │ │ match reality.
│ ████████░░░ │ │ │ Bedrooms: [3 ▼]                 │ │
│ 72%         │ │ │ Bathrooms: [2 ▼]                │ │ [Hide Help]
│          │ │ │ Square Feet: [1,450 ]              │ │
│          │ │ │ [+ Add Another Unit]                │ │
│          │ │ └─────────────────────────────────┘ │ │
│          │ │ │ │
│          │ │ ┌─────────────────────────────────┐ │ │
│          │ │ │ Finish Level (?) ℹ️              │ │ │
│          │ │ │ ○ Builder Grade ($85-100/SF)    │ │ │
│          │ │ │ ● Standard ($100-125/SF)        │ │ │
│          │ │ │ ○ Upgraded ($125-160/SF)        │ │ │
│          │ │ │ ○ Luxury ($160+/SF)             │ │ │
│          │ │ │ [View finish level examples →]   │ │ │
│          │ │ └─────────────────────────────────┘ │ │
│          │ │ [← Previous] [Save & Continue →]     │ │
└──────────────────────────────────────────────────────────────────────
```

### Mobile Version
```
┌─────────────────────────────┐
│ ≡ 1847 Rozelle St 72%       │
├─────────────────────────────┤
│ 3. PROJECT SCOPE            │
│ 💡 Lenders need to know     │
│ exactly what they're        │
│ financing. [More ▼]         │
│ Project Type: Major Renovation ▼
│ Unit 1:                     │
│ Bedrooms: [3 BR ▼]          │
│ Bathrooms: [2 BA ▼]         │
│ Square Footage: [1,450 SF]  │
│ Finish Level:               │
│ Standard ($100-125/SF) ▼    │
│ [← Back] [Continue →]       │
└─────────────────────────────┘
```

---

## Screen 3: Budget & Capital Stack

### Purpose
The financial heart of the package. Two tabs: Uses (what it costs) and Sources (where money comes from).

### Key Elements
- **Expandable Categories** — Collapse what you're not working on
- **Running Totals** — Always visible at bottom
- **Benchmark Checks** — Auto-compare to typical costs
- **Contingency Slider** — Visual feedback on recommended contingency
- **Capital Stack Diagram** — Visual representation of sources (bottom = most senior)
- **Balance Check** — Sources must equal Uses
- **Subsidy Impact Box** — Shows how grants change project economics

### USES Tab (Costs)
```
ACQUISITION $47,500
├─ Purchase price $42,000
├─ Closing costs $3,500
└─ Inspection/appraisal $2,000

HARD COSTS $112,500
├─ Site work/demo $8,500
├─ Foundation repair $6,000
├─ Framing/structural $12,000
├─ Roofing $9,500
├─ Plumbing $14,000
├─ Electrical $11,000
├─ HVAC $12,500
├─ Interior finishes $28,000
└─ Other $11,000

Contingency (15%): $16,875
Recommended: 15% ██████████████░░░░

SOFT COSTS $12,800

FINANCING COSTS $11,200

═════════════════════════════════════════════════════════════
TOTAL DEVELOPMENT COST: $185,000
Cost per SF: $127.59 ✓ Within range for Standard
═════════════════════════════════════════════════════════════
```

### SOURCES Tab (Capital Stack)
```
CAPITAL STACK

DEVELOPER EQUITY $25,000 (14%)
Status: ✓ Committed

GRANT/SUBSIDY $30,000 (16%)
Source: CDBG via City of Memphis
Type: Forgivable loan (5 year affordability)
Status: ⏳ Application submitted
[Edit Details]

GAP FINANCING $20,000 (11%)
Source: The Housing Fund
Rate: 6% | Term: 18 mo | Position: 2nd
Status: ⏳ Pre-approved
[Edit Details]

SENIOR DEBT $110,000 (59%)
Source: Community Bank
Rate: 8.5% | Term: 12 mo | LTV: 75%
Status: ⏳ Application submitted
[Edit Details]

[+ Add Funding Source]

═════════════════════════════════════════════════════════════
TOTAL SOURCES: $185,000
TOTAL USES: $185,000
BALANCE: ✓ $0
═════════════════════════════════════════════════════════════

💡 SUBSIDY IMPACT

Without subsidy, minimum viable rent: $1,450/mo
With $30,000 subsidy, minimum rent: $1,180/mo

This enables serving households at 65% AMI
instead of 80% AMI.

[Learn more about how subsidies affect feasibility →]
```

---

## Screen 4: Schedule / Gantt Builder

### Purpose
Build project timeline with interactive Gantt chart.

### Layout
```
Load Template: [Major Renovation - SF ▼] Start: [Mar 15, 2025]

PHASE │ Mar Apr May Jun Jul Aug Sep │
─────────────────────────────────────

PRE-DEVELOPMENT
├ Site control                ████
├ Due diligence               ██████
└ Team assembly               █████
  ◆ Financing committed

DESIGN & PERMITS
├ Design/plans                ████████
└ Permit review               ████████
  ◆ Permits issued

CONSTRUCTION
├ Demo/site work              ████
├ Structural                  ██████
├ MEP rough-in                ██████
├ Insulation/drywall          ████
├ Finishes                    ██████████
└ Final inspections           ████
  ◆ CO

EXIT
├ Marketing                   ████████████
└ Sale/lease-up               ████████
  ◆ Exit

─────────────────────────────────────

CONTINGENCY │ ░░░░░░░░░░░░░░░ (20% = 4 weeks)

─────────────────────────────────────

TOTAL: 28 weeks construction + 4 weeks contingency = 32 weeks
Target completion: October 15, 2025
```

### Key Milestones
```
◆ Financing committed ───── Apr 15  ○ Not yet
◆ Permits issued ────────── May 20  ○ Not yet
◆ Certificate of Occupancy Sep 30  ○ Not yet
◆ Project exit ──────────── Nov 15  ○ Not yet
```

### Gantt Interactions
- Click bar — Edit task details (duration, start date, dependencies)
- Drag bar edges — Extend or shorten duration
- Drag bar — Move entire task (auto-adjusts dependents)
- Click milestone — Set specific date
- Zoom controls — Week/Month/Quarter view

---

## Screen 5: Feasibility Analysis (Pencil Test)

### Purpose
The go/no-go decision. Auto-calculated from budget and pro forma inputs.

### Layout
```
THE PENCIL TEST   Exit: ○Sale ●Rent

┌────────────────────────────────────────────────────────────┐
│ METRIC                    TARGET          YOUR STATUS      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ After Repair Value        —              $245,000          │
│ Total Development Cost    —              $185,000          │
│                                                             │
│ All-in Basis (TDC/ARV) < 85%            75.5% ✅ PASS     │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│                                                             │
│ Monthly Rent Market       $1,450         —                  │
│ Net Operating Income      —              $12,180           │
│                                                             │
│ Cap Rate > 6%            6.6% ✅ PASS                      │
│ █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░        │
│                                                             │
│ Cash-on-Cash Return > 8% 9.2% ✅ PASS                      │
│ ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
│                                                             │
│ Debt Service Coverage > 1.25 1.38 ✅ PASS                  │
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
│                                                             │
│ 1% Rule > 1%            0.95% ⚠️ MARGINAL                 │
│ ██████████████████████████████░░░░░░░░░░░░░░░░░░░░░      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Sensitivity Analysis
```
What if ARV is 10% lower?
├─ Cash-on-cash drops to: 4.8% ⚠️
└─ Still above breakeven: ✓ Yes

What if costs are 10% higher?
├─ Cash-on-cash drops to: 6.1% ⚠️
└─ Still above breakeven: ✓ Yes

What if both? (Pessimistic scenario)
├─ Cash-on-cash drops to: 2.3% ⚠️
└─ Still above breakeven: ✓ Yes (barely)
```

### Your Decision
```
○ GO — Project meets feasibility thresholds; proceed
○ CONDITIONAL GO — Proceed with modifications
○ NO GO — Project does not meet minimum thresholds

Decision notes:
Project passes pencil test but 1% rule is marginal. Subsidy
makes this feasible for target income level. Will proceed with
close budget monitoring.
```

### Key Elements
- **Visual Pass/Fail Indicators** — Green check, yellow warning, red X
- **Progress Bars** — Show where metric falls relative to threshold
- **Sensitivity Analysis** — Pre-calculated scenarios
- **Decision Capture** — Document the go/no-go decision with rationale

---

## Screen 6: Active Project Dashboard

### Purpose
Once funded, the project management view.

### Key Metrics
```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ PROGRESS         │ │ BUDGET           │ │ SCHEDULE         │
│ ██████████░░░░   │ │ $89K / $185K     │ │ On Track ✓       │
│ 67%              │ │ 48% spent        │ │ Est: Nov 15      │
│                  │ │                  │ │                  │
│ Current phase:   │ │ Contingency:     │ │ Days remaining:  │
│ Framing          │ │ $14,200 (76%)    │ │ 73               │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Quick Actions
```
[📋 Prepare Draw #3] [📸 Upload Photos] [✓ Update Progress]
```

### Live Schedule & Next Up
```
LIVE SCHEDULE              │  NEXT UP
                           │
CONSTRUCTION Oct Nov       │  □ Framing inspection
Framing      ████████░░░░ │    Due: Oct 18
Roofing      ░░░░████     │
MEP rough    ░░░░░░████   │  □ Order windows
Insulation   ░░░░████     │    Due: Oct 20
Drywall      ░░░░████     │
Finishes     ████████     │  □ Draw #3 submission
◆ CO                       │    Due: Oct 22
                           │
[View Full Schedule →]    │  □ HVAC rough start
                           │    Due: Oct 25
```

### Budget Tracking & Draw Status
```
BUDGET                     │  DRAW STATUS
─────────────────────────────────────────
Category │ Budget │ Actual │ Var
Acquisition $47.5K $47.5K  $0
Hard Costs $112.5K $38.2K -$74K
Soft Costs $12.8K $11.8K  -$1K
Financing $11.2K  $5.4K   -$6K
Contingency $16.9K $2.7K  -$14K
─────────────────────────────────────────
TOTAL $185K $89K On track

[View Full Budget →]

Draw 1: ✓ $32,000
Draw 2: ✓ $41,500
Draw 3: ⏳ $28,500 (Preparing...)
Draw 4: ○ $35,000
Draw 5: ○ $28,000
Final: ○ $20,000

[Prepare Draw →]
```

### Recent Activity
```
• Oct 10: Draw #2 funded - $41,500
• Oct 8: Framing inspection PASSED
• Oct 5: Progress photos uploaded (12 photos)
• Oct 1: Framing phase started
```

---

## Screen 7: Draw Request Preparation

### Layout
```
DRAW REQUEST #3
Amount: $28,500
2341 Deadrick Ave

CHECKLIST  4 of 6 done

✓ Progress photos uploaded (12 photos)
✓ Inspection report attached (framing passed)
✓ Lien waiver from GC (signed)
✓ Invoices/receipts uploaded ($28,340)
□ Contractor draw request form [Upload]
□ Budget variance explanation [Complete]

DRAW BREAKDOWN

Line Item │ Budget  │ Prior Draws │ This Draw │ Remaining
───────────────────────────────────────────────────────────
Framing    $18,000  $0           $18,000   $0
Windows    $6,500   $0           $6,500    $6,500
Electrical $4,000   $0           $4,000    $7,000

TOTAL THIS DRAW: $28,500

PHOTOS [Add More]
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ +6 more
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘

[Save Draft] [Submit to Lender →]
```

---

## Screen 8: Mobile Responsive View

```
┌─────────────────────────────┐
│ ≡ DevPack [👤]              │
├─────────────────────────────┤
│ 1847 Rozelle St             │
│ ████████████░░░░ 72%        │
│ ───────────────────────────│
│ 3. PROJECT SCOPE            │
│ ┌─────────────────────────┐│
│ │ 💡 Lenders need to     ││
│ │ know exactly what       ││
│ │ they're financing.     ││
│ │ [More ▼]              ││
│ └─────────────────────────┘│
│ Project Type              │
│ ┌─────────────────────────┐│
│ │ Major Renovation ▼      ││
│ └─────────────────────────┘│
│ Unit 1                    │
│ ┌───────────┐ ┌───────────┐│
│ │ 3 Beds ▼  │ │ 2 Baths ▼││
│ └───────────┘ └───────────┘│
│ Square Footage            │
│ ┌─────────────────────────┐│
│ │ 1,450                  ││
│ └─────────────────────────┘│
│ Finish Level              │
│ ┌─────────────────────────┐│
│ │ Standard ($100-125/SF)▼││
│ └─────────────────────────┘│
│ ┌───────────┐ ┌───────────┐│
│ │ ← Back    │ │ Continue →││
│ └───────────┘ └───────────┘│
│ ▼ Sections (3 of 10)      │
└─────────────────────────────┘
```

---

## Component Library

### Status Badges
- **Planning:** [📋 Planning] — Blue outline
- **In Review:** [👁 In Review] — Yellow fill
- **Funded:** [💰 Funded] — Green fill
- **Active:** [🏗Active] — Orange fill
- **Complete:** [✓ Complete] — Green outline

### Progress Indicators
- Not started: ░░░░░░░░░░ 0%
- In progress: ████░░░░░░ 40%
- Complete: ██████████ 100%
- Warning: ████████░░ (yellow when behind)

### Form Field States
- **Empty:** [ Placeholder text... ] Gray border
- **Focused:** [ | ] Blue border
- **Filled:** [ Entered value ] Gray border
- **Error:** [ Invalid entry ] Red border + message
- **Success:** [ Valid entry ✓ ] Green checkmark

### Buttons
- **Primary:** [Save & Continue →] Blue fill, white text
- **Secondary:** [Previous] White fill, blue outline
- **Tertiary:** [Cancel] Text only
- **Danger:** [Delete Project] Red fill, white text

### Teaching Callouts

#### Why This Matters
```
┌─────────────────────────────┐
│ 💡 WHY THIS MATTERS         │
│                             │
│ Explanatory text in a light │
│ blue background box.        │
│                             │
│ [Dismiss] [Learn more]      │
└─────────────────────────────┘
```

#### Common Mistake
```
┌─────────────────────────────┐
│ ⚠️ COMMON MISTAKE           │
│                             │
│ Warning text in a light     │
│ yellow background box.      │
└─────────────────────────────┘
```

#### Pro Tip
```
┌─────────────────────────────┐
│ ✨ PRO TIP                  │
│                             │
│ Advanced insight in a light │
│ purple background box.      │
└─────────────────────────────┘
```

---

## Interaction Patterns

### Navigation

#### Section Sidebar (Desktop)
- Always visible on left
- Shows completion status: ✓ Complete, ● Current, ○ Not started
- Click to jump to any section
- Progress bar at bottom

#### Mobile Navigation
- Hamburger menu for sections
- Swipe between sections
- Bottom progress indicator

### Form Interactions

#### Auto-save
- Save after 2 seconds of inactivity
- "Saving..." indicator
- "All changes saved" confirmation

#### Validation
- Inline validation on blur
- Error messages below field
- Section won't show ✓ until valid

#### Help Content
- (?) icon opens tooltip
- Teaching panels collapsible
- "Hide all help" toggle in settings

### Gantt Chart Interactions

#### Desktop
- Click bar to edit details
- Drag bar edges to adjust duration
- Drag bar to move (updates dependents)
- Hover for details tooltip
- Zoom: Week / Month / Quarter views

#### Mobile
- Tap bar for details modal
- Pinch to zoom
- Horizontal scroll

---

## Data Model (Simplified)

```
User
├── id
├── email
├── name
├── organization
└── created_at

Project
├── id
├── user_id
├── name
├── address
├── status (planning, funded, active, complete)
├── created_at
├── updated_at
└── sections (JSON or related tables)

Section (or embedded in Project)
├── executive_summary
├── market_analysis
├── project_scope
├── site_location
├── schedule
├── budget
├── team
├── risk_assessment
├── resilience
├── work_plan
└── feasibility

Draw (for active projects)
├── id
├── project_id
├── draw_number
├── amount
├── status
├── submitted_at
├── funded_at
└── documents (file references)

Document
├── id
├── project_id
├── draw_id
├── type
├── filename
├── url
└── uploaded_at
```

---

## MVP Feature Priority

### Phase 1 (Core Package Builder)
1. User auth
2. Project creation
3. Section forms (start with Executive Summary, Scope, Budget, Feasibility)
4. Basic PDF export

### Phase 2 (Full Package)
5. All 10 sections
6. Gantt chart builder
7. Teaching content toggles
8. Multiple export formats

### Phase 3 (Project Management)
9. Active project conversion
10. Budget tracking
11. Draw management
12. Document storage

---

## Build Notes for Lovable/Replit

### Recommended Tech Stack
- **Frontend:** React or Vue.js
- **UI Library:** Tailwind CSS + Headless UI (or similar)
- **Charts/Gantt:** Chart.js, or lightweight Gantt library (frappe-gantt, etc.)
- **PDF Generation:** React-PDF or html2pdf.js
- **Backend:** Supabase or Firebase (for quick auth + database)
- **File Storage:** Supabase Storage or AWS S3

---

## Export Specifications

### PDF Package Layout

**Page 1: Cover**
- Project photo (full width)
- Project name and address
- Developer name and entity
- Key metrics box
- Date prepared

**Page 2: Table of Contents**
- Linked sections
- Page numbers

**Pages 3-25: Content**
- Consistent headers/footers
- Page numbers
- Section dividers
- Professional typography

**Gantt Chart**
- Full-width landscape orientation
- Color-coded phases
- Milestone markers
- Legend

### Export Formats

| Format | Use Case |
|--------|----------|
| Full PDF | Primary package for submissions |
| Lender Summary (2pg) | Quick review |
| Investor One-Pager | Marketing |
| Excel Model | Editable financials |
| Gantt PNG/PDF | Standalone schedule |

---

*End of DevPack Wireframes Document*
*Alliance for Housing Progress*
