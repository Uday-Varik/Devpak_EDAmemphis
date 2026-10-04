# DevPack Platform Specification
## Complete Field-by-Field Reference for Development Package Builder

---

## PLATFORM OVERVIEW

### Purpose

DevPack is a teaching-first platform that guides emerging developers through creating professional, investor-ready development packages for single-family residential projects (1-4 units). The platform produces professional output while building permanent developer capacity.

### Design Philosophy

**Dual Mission:**
1. **Capacity Building** — Teach developers to think like experienced developers
2. **Production Tool** — Generate packages that meet lender and funder standards

### Teaching Layers

Every section includes toggle-able educational content:

| Layer | Icon | Purpose |
|-------|------|---------|
| Why This Matters | 💡 | Explains lender/investor/grantor perspectives |
| What They're Really Asking | 🎯 | Translates requirements into underlying concerns |
| Common Mistakes | ⚠️ | Warns about errors that sink deals |
| Pro Tip | ✨ | Advanced insights from experienced developers |
| Memphis Context | 📍 | Local programs, resources, and market specifics |

---

## CORE PRINCIPLE: ONE SOURCE OF TRUTH FOR FINANCIALS

**All financial calculations come from `src/utils/calculations.ts`**, specifically the `computeBudgetTotals()` and `computeProjectFinancials()` functions. No form, PDF section, or export module does its own arithmetic.

This ensures:
- TDC is consistent everywhere
- Subsidy math works right
- Per-SF mode produces correct numbers
- PDF exports match UI calculations
- Test suites catch regressions

See CLAUDE.md and AGENTS.md for full context.

---

## SECTION 1: EXECUTIVE SUMMARY

### Purpose

A one-page snapshot allowing any stakeholder to quickly assess project viability. Often the only page read in full.

### Why This Matters

**To Lenders:** The executive summary is a screening tool. Loan officers review dozens of packages; they spend 60 seconds on your summary to decide whether to read further.

**To Grant Funders:** Program officers need to quickly assess whether your project fits their funding priorities.

**To Equity Partners:** Investors evaluate YOU as much as the deal. A crisp, professional summary signals competence.

### What They're Really Asking

| When they ask for... | They really want to know... |
|---------------------|----------------------------|
| Project description | Is this straightforward or overly complicated? |
| Total development cost | Is this sized appropriately for your experience? |
| Funding request | Are you bringing enough of your own resources? |
| Timeline | Is this realistic? Have you done this before? |
| Exit strategy | How do I get repaid? What's Plan B? |
| Developer experience | Have you done this before? Who's helping you? |

### Common Mistakes

1. **Burying the ask** — State your funding request clearly on page one
2. **Inconsistent numbers** — If summary says $185,000 but budget says $192,000, you've lost credibility
3. **Vague exit strategy** — "We'll either sell or rent" isn't a strategy
4. **Overselling** — "Guaranteed returns" signals inexperience
5. **Missing the developer story** — Acknowledge experience level, explain your team

---

## SECTIONS 2–10 (ABBREVIATED REFERENCE)

*(Detailed field specifications for all 10 sections contained in the DevPack-Complete-Specification full document. Sections include Vision & Market, Project Scope, Site & Location, Schedule, Budget & Capital Stack, Project Team, Risk Assessment, Resilience Factors, and Feasibility Analysis.)*

---

## PLATFORM OUTPUT

### Development Package PDF

20-30 page professional package containing:

1. Cover page
2. Table of contents
3. Executive Summary (1 pg)
4. Vision & Market (2-3 pg)
5. Project Scope (2-4 pg with plans)
6. Site & Location (2-3 pg with maps/photos)
7. Schedule (1-2 pg with Gantt chart)
8. Budget & Capital Stack (2-3 pg)
9. Team (1-2 pg with org chart)
10. Risk Assessment (1-2 pg)
11. Resilience Factors (1 pg)
12. Feasibility (2-3 pg)
13. Appendices

### Export Formats

- Full PDF package
- Lender summary (2 pg)
- Investor one-pager
- Grant supplement
- Excel financial model
- Gantt chart (PDF, PNG, HTML)

---

## PROJECT MANAGEMENT PORTAL (PHASE 2)

### Conversion Trigger

When developer marks project "Funded":
- Package converts to Active Project
- Budget becomes trackable
- Schedule goes live
- Draw module activates
- Document vault opens

### Dashboard Features

**Budget Tracking:**
- Actual vs. projected by line item
- Variance flags
- Contingency monitoring
- Cost-to-complete projection

**Draw Manager:**
- Draw schedule template
- Documentation checklist
- Submission tracking
- Payment reconciliation

**Schedule Tracking:**
- Live Gantt with progress
- Actual vs. planned
- Delay tracking
- Milestone log

**Inspection Tracker:**
- Scheduling
- Pass/fail logging
- Correction tracking
- CO countdown

**Document Vault:**
- Category organization
- Version control
- Expiration alerts
- Secure sharing

### Closeout

When exit complete:
- Final accounting
- Project marked complete
- Added to track record
- Grant reporting compiled

---

*End of DevPack Complete Specification*
*For full field-by-field detail, see the extended specification document.*
