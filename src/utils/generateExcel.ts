import * as XLSX from "xlsx";
import { fetchProjectExportData } from "./fetchProjectData";
import { computeProjectFinancials, computeRentalProjection, NO_ARV_LABEL, ruleCheckLabel, type RuleCheckStatus } from "./calculations";

/** Rows for the Excel "Pro Forma" sheet — exported for tests. */
export const buildExcelRentalProjection = (data: { scope: any; budget: any; feasibility: any }) =>
  computeRentalProjection(computeProjectFinancials({ scope: data.scope, budget: data.budget, feasibility: data.feasibility }));


// Cell helpers
const curr = (v: number) => ({ v: Math.sign(v || 0) * Math.round(Math.abs(v || 0)), t: "n" as const, z: "$#,##0" });
const pct = (v: number) => ({ v: v / 100, t: "n" as const, z: "0.0%" });
const pctRaw = (v: number) => ({ v, t: "n" as const, z: "0.0%" });
const bold = (v: string) => ({ v, t: "s" as const });
const num = (v: number) => ({ v, t: "n" as const, z: "#,##0" });
const numDec = (v: number) => ({ v, t: "n" as const, z: "#,##0.0" });

const setCell = (ws: XLSX.WorkSheet, r: number, c: number, cell: any) => {
  const addr = XLSX.utils.encode_cell({ r, c });
  ws[addr] = cell;
};

const ensureRange = (ws: XLSX.WorkSheet, maxR: number, maxC: number) => {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  if (maxR > range.e.r) range.e.r = maxR;
  if (maxC > range.e.c) range.e.c = maxC;
  ws["!ref"] = XLSX.utils.encode_range(range);
};

export const generateExcel = async (projectId: string): Promise<void> => {
  const data = await fetchProjectExportData(projectId);
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const acq = data.budget.acquisition || {};
  const hard = data.budget.hardCosts || {};
  const soft = data.budget.softCosts || {};
  const holding = data.budget.holdingCosts || {};
  const cap = data.budget.capitalStack || {};
  const opReserves = data.budget.operatingReserves || 0;

  // All totals come from the shared engine via fetchProjectExportData — no local arithmetic.
  const t = data.budgetTotals!;
  const acqCont = t.acqContingency, acqTotal = t.acqTotal;
  const hardBase = t.hardBase, hardCont = t.hardContingency, hardTotal = t.hardTotal;
  const softCont = t.softContingency, softTotal = t.softTotal;
  const holdCont = t.holdingContingency, holdTotal = t.holdingTotal;
  const tdc = t.tdc;
  // Per-SF mode replaces itemized construction; closing/title are excluded when the engine excludes them.
  const perSqft = !!hard.usePerSqftEstimate;
  const sqft = Number(data.sqftPlanned) || 0;
  const perSqftLabel = `Construction (${sqft.toLocaleString()} SF @ $${Number(hard.costPerSqft) || 0}/SF)`;
  const acqExtrasExcluded = t.acqBase === (acq.purchasePrice || 0);

  // ─── SHEET 1: SOURCES & USES ────────────────────────────────────────
  {
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    ws["!cols"] = [{ wch: 38 }, { wch: 16 }, { wch: 13 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    let r = 0;

    setCell(ws, r, 0, bold(data.projectName)); r++;
    setCell(ws, r, 0, { v: `Prepared by ${data.preparedBy}  |  ${today}`, t: "s" }); r++;
    r++; // blank

    setCell(ws, r, 0, bold("USES OF FUNDS"));
    setCell(ws, r, 1, bold("Amount"));
    setCell(ws, r, 2, bold("% of TDC")); r++;

    const useRow = (label: string, amount: number, indent = false) => {
      setCell(ws, r, 0, { v: indent ? `   ${label}` : label, t: "s" });
      if (amount !== 0) {
        setCell(ws, r, 1, curr(amount));
        setCell(ws, r, 2, tdc > 0 ? pctRaw(amount / tdc) : { v: "—", t: "s" });
      }
      r++;
    };

    const subtotalRow = (label: string, amount: number) => {
      setCell(ws, r, 0, bold(label));
      setCell(ws, r, 1, curr(amount));
      setCell(ws, r, 2, tdc > 0 ? pctRaw(amount / tdc) : { v: "—", t: "s" });
      r++;
    };

    // Acquisition
    setCell(ws, r, 0, bold("Acquisition")); r++;
    useRow("Purchase Price", acq.purchasePrice || 0, true);
    if (!acqExtrasExcluded) {
      useRow("Closing Costs", acq.closingCosts || 0, true);
      useRow("Title & Recording", acq.titleRecording || 0, true);
    }
    if (acqCont > 0) useRow(`Contingency (${t.acqContPct}%)`, acqCont, true);
    subtotalRow("Acquisition Subtotal", acqTotal);

    // Construction
    setCell(ws, r, 0, bold("Construction")); r++;
    const hardItems: [string, string][] = [
      ["Foundation/Structural", "foundation"], ["Roofing", "roofing"], ["HVAC", "hvac"],
      ["Electrical", "electrical"], ["Plumbing", "plumbing"], ["Interior Finishes", "interiorFinishes"],
      ["Exterior/Landscaping", "exteriorLandscaping"], ["Other Construction", "otherHard"],
    ];
    if (perSqft) {
      useRow(perSqftLabel, hardBase, true);
    } else {
      hardItems.forEach(([label, key]) => useRow(label, hard[key] || 0, true));
      ((hard.customItems || []) as any[]).forEach((ci: any) => { if (ci.amount > 0) useRow(ci.label || "Custom Item", ci.amount, true); });
    }
    if (hardCont > 0) useRow(`Contingency (${t.hardContPct}%)`, hardCont, true);
    subtotalRow("Construction Subtotal", hardTotal);

    // Pre-Development
    setCell(ws, r, 0, bold("Pre-Development")); r++;
    const softItems: [string, string][] = [
      ["Architecture/Engineering", "architectureEngineering"], ["Permits & Fees", "permitsFees"],
      ["Legal & Accounting", "legalAccounting"], ["Insurance", "insurance"],
      ["Property Taxes", "propertyTaxes"], ["Loan Interest/Points", "loanInterestPoints"],
      ["Marketing/Leasing", "marketingLeasing"], ["Other Pre-Development", "otherSoft"],
    ];
    softItems.forEach(([label, key]) => useRow(label, soft[key] || 0, true));
    ((soft.customItems || []) as any[]).forEach((ci: any) => { if (ci.amount > 0) useRow(ci.label || "Custom Item", ci.amount, true); });
    if (softCont > 0) useRow(`Contingency (${t.softContPct}%)`, softCont, true);
    subtotalRow("Pre-Development Subtotal", softTotal);

    // Holding
    setCell(ws, r, 0, bold("Holding Costs")); r++;
    const holdItems: [string, string][] = [
      ["Property Taxes", "propertyTaxes"], ["Insurance", "insurance"],
      ["Loan Payments", "loanPayments"], ["Utilities", "utilities"], ["Other Holding", "otherHolding"],
    ];
    holdItems.forEach(([label, key]) => useRow(label, holding[key] || 0, true));
    ((holding.customItems || []) as any[]).forEach((ci: any) => { if (ci.amount > 0) useRow(ci.label || "Custom Item", ci.amount, true); });
    if (holdCont > 0) useRow(`Contingency (${t.holdingContPct}%)`, holdCont, true);
    subtotalRow("Holding Subtotal", holdTotal);

    // Operating Reserves
    if (opReserves > 0) useRow("Operating Reserves", opReserves);

    r++; // blank
    setCell(ws, r, 0, bold("TOTAL USES"));
    setCell(ws, r, 1, curr(tdc));
    setCell(ws, r, 2, pctRaw(1)); r++;

    r++; // blank
    setCell(ws, r, 0, bold("SOURCES OF FUNDS"));
    setCell(ws, r, 1, bold("Amount"));
    setCell(ws, r, 2, bold("% of Total")); r++;

    const landEquity = data.landEquity || 0;
    const cashEquity = data.cashEquity || 0;
    const bankLoan = cap.bankLoan || 0;
    const privateLender = cap.privateLender || 0;
    const totalSources = data.totalSources || 0;

    const srcRow = (label: string, amount: number) => {
      if (amount <= 0) return;
      setCell(ws, r, 0, { v: `   ${label}`, t: "s" });
      setCell(ws, r, 1, curr(amount));
      setCell(ws, r, 2, totalSources > 0 ? pctRaw(amount / totalSources) : { v: "—", t: "s" });
      r++;
    };

    srcRow("Land Equity", landEquity);
    srcRow("Developer Equity (Cash)", cashEquity);
    srcRow("Bank / Construction Loan", bankLoan);
    srcRow("Private Lender", privateLender);
    if (cap.grant1Name && cap.grant1Amount > 0) srcRow(cap.grant1Name, cap.grant1Amount);
    if (cap.grant2Name && cap.grant2Amount > 0) srcRow(cap.grant2Name, cap.grant2Amount);
    if (cap.grant3Name && cap.grant3Amount > 0) srcRow(cap.grant3Name, cap.grant3Amount);
    srcRow("Other Sources", cap.otherSources || 0);

    setCell(ws, r, 0, bold("TOTAL SOURCES"));
    setCell(ws, r, 1, curr(totalSources));
    setCell(ws, r, 2, pctRaw(1)); r++;

    r++;
    const gap = tdc - totalSources;
    setCell(ws, r, 0, bold(gap > 0 ? "FUNDING GAP" : "SURPLUS"));
    setCell(ws, r, 1, curr(Math.abs(gap)));
    setCell(ws, r, 2, { v: gap > 0 ? "UNDERFUNDED" : "FULLY FUNDED", t: "s" }); r++;

    ensureRange(ws, r, 2);
    XLSX.utils.book_append_sheet(wb, ws, "Sources & Uses");
  }

  // ─── SHEET 2: BUDGET WORKSHEET ──────────────────────────────────────
  {
    const headers = ["Category / Item", "Budgeted Amount", "Contingency %", "Total w/ Contingency", "Notes"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    ws["!cols"] = [{ wch: 38 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 28 }];
    let r = 1;

    const catSection = (
      title: string,
      items: { label: string; amount: number; note?: string }[],
      contPct: number,
      customItems: any[],
      contAmt: number,
      total: number,
    ) => {
      setCell(ws, r, 0, bold(title)); r++;
      items.forEach(({ label, amount, note }) => {
        if (amount <= 0) return;
        setCell(ws, r, 0, { v: `   ${label}`, t: "s" });
        setCell(ws, r, 1, curr(amount));
        if (note) setCell(ws, r, 4, { v: note, t: "s" });
        r++;
      });
      (customItems || []).forEach((ci: any) => {
        if (ci.amount > 0) {
          setCell(ws, r, 0, { v: `   ${ci.label || "Custom Item"}`, t: "s" });
          setCell(ws, r, 1, curr(ci.amount));
          setCell(ws, r, 4, { v: "Custom line item", t: "s" });
          r++;
        }
      });
      setCell(ws, r, 0, { v: `   Contingency`, t: "s" });
      setCell(ws, r, 1, curr(contAmt));
      setCell(ws, r, 2, pct(contPct));
      r++;
      setCell(ws, r, 0, bold(`${title} Total`));
      setCell(ws, r, 3, curr(total));
      r++;
    };

    catSection("Acquisition", [
      { label: "Purchase Price", amount: acq.purchasePrice || 0 },
      ...(acqExtrasExcluded ? [] : [
        { label: "Closing Costs", amount: acq.closingCosts || 0 },
        { label: "Title & Recording", amount: acq.titleRecording || 0 },
      ]),
    ], t.acqContPct, [], acqCont, acqTotal);

    catSection("Construction", perSqft ? [{ label: perSqftLabel, amount: hardBase }] : [
      { label: "Foundation/Structural", amount: hard.foundation || 0 },
      { label: "Roofing", amount: hard.roofing || 0 },
      { label: "HVAC", amount: hard.hvac || 0 },
      { label: "Electrical", amount: hard.electrical || 0 },
      { label: "Plumbing", amount: hard.plumbing || 0 },
      { label: "Interior Finishes", amount: hard.interiorFinishes || 0 },
      { label: "Exterior/Landscaping", amount: hard.exteriorLandscaping || 0 },
      { label: "Other Construction", amount: hard.otherHard || 0 },
    ], t.hardContPct, perSqft ? [] : hard.customItems, hardCont, hardTotal);

    catSection("Pre-Development", [
      { label: "Architecture/Engineering", amount: soft.architectureEngineering || 0 },
      { label: "Permits & Fees", amount: soft.permitsFees || 0 },
      { label: "Legal & Accounting", amount: soft.legalAccounting || 0 },
      { label: "Insurance", amount: soft.insurance || 0 },
      { label: "Property Taxes", amount: soft.propertyTaxes || 0 },
      { label: "Loan Interest/Points", amount: soft.loanInterestPoints || 0 },
      { label: "Marketing/Leasing", amount: soft.marketingLeasing || 0 },
      { label: "Other Pre-Development", amount: soft.otherSoft || 0 },
    ], t.softContPct, soft.customItems, softCont, softTotal);

    catSection("Holding Costs", [
      { label: "Property Taxes", amount: holding.propertyTaxes || 0 },
      { label: "Insurance", amount: holding.insurance || 0 },
      { label: "Loan Payments", amount: holding.loanPayments || 0 },
      { label: "Utilities", amount: holding.utilities || 0 },
      { label: "Other Holding", amount: holding.otherHolding || 0 },
    ], t.holdingContPct, holding.customItems, holdCont, holdTotal);

    if (opReserves > 0) {
      setCell(ws, r, 0, bold("Operating Reserves"));
      setCell(ws, r, 1, curr(opReserves));
      setCell(ws, r, 3, curr(opReserves)); r++;
    }

    r++;
    setCell(ws, r, 0, bold("TOTAL DEVELOPMENT COST"));
    setCell(ws, r, 3, curr(tdc)); r++;

    ensureRange(ws, r, 4);
    XLSX.utils.book_append_sheet(wb, ws, "Budget Worksheet");
  }

  // ─── SHEET 3: PRO FORMA (rental only) ──────────────────────────────
  const exitStrategy = data.feasibility.exitStrategy?.strategy || data.exitStrategy || "sell";
  // Rental projection: shared engine only (year 1 === Feasibility page).
  const rentalFin = computeProjectFinancials({ scope: data.scope, budget: data.budget, feasibility: data.feasibility });
  const projection = buildExcelRentalProjection(data);

  if ((exitStrategy === "rent" || exitStrategy === "rent-then-sell") && rentalFin.grossRent > 0) {
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    ws["!cols"] = [{ wch: 38 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    let r = 0;

    setCell(ws, r, 0, bold(`${data.projectName} — 3-Year Rental Pro Forma`)); r++;
    setCell(ws, r, 0, { v: `${data.address}`, t: "s" }); r++;
    setCell(ws, r, 0, { v: `Units: ${rentalFin.units}  |  Prepared: ${today}  |  Years 2–3: rent +3%/yr, fixed costs and debt service flat`, t: "s" }); r++;
    r++;

    setCell(ws, r, 0, bold(""));
    setCell(ws, r, 1, bold("Year 1"));
    setCell(ws, r, 2, bold("Year 2"));
    setCell(ws, r, 3, bold("Year 3")); r++;

    setCell(ws, r, 0, bold("INCOME")); r++;
    projection.forEach((y, yr) => {
      if (yr === 0) {
        const rowLabels = [
          "Gross Potential Rent", "Less: Vacancy", "Effective Gross Income", "",
          "EXPENSES", "   Management", "   Property Taxes", "   Insurance",
          "   Maintenance/Repairs", "   Replacement Reserves", "   Other Expenses",
          "Total Operating Expenses", `   OpEx Ratio`, "",
          "NET OPERATING INCOME", "",
          "DEBT SERVICE", "   Annual Debt Service", "",
          "CASH FLOW", "   Annual Cash Flow", "   Monthly Cash Flow", "",
          "KEY METRICS", "   Cap Rate", "   Cash-on-Cash Return", "   DSCR", "   GRM",
        ];
        rowLabels.forEach((label, i) => {
          setCell(ws, r + i, 0, label.startsWith("INCOME") || label.startsWith("EXPENSES") ||
            label.startsWith("NET ") || label.startsWith("DEBT ") || label.startsWith("CASH FLOW") ||
            label.startsWith("KEY ") ? bold(label) : { v: label, t: "s" });
        });
      }

      const col = 1 + yr;
      let row = r;
      setCell(ws, row++, col, curr(y.grossRent));
      setCell(ws, row++, col, curr(-y.vacancyLoss));
      setCell(ws, row++, col, curr(y.egi));
      row++; // blank
      row++; // EXPENSES header
      setCell(ws, row++, col, curr(y.managementExpense));
      setCell(ws, row++, col, curr(y.propertyTaxesExpense));
      setCell(ws, row++, col, curr(y.insuranceExpense));
      setCell(ws, row++, col, curr(y.maintenanceExpense));
      setCell(ws, row++, col, curr(y.reservesExpense));
      setCell(ws, row++, col, curr(y.otherExpense));
      setCell(ws, row++, col, curr(y.opex));
      setCell(ws, row++, col, y.egi > 0 ? pctRaw(y.opexRatio / 100) : { v: "—", t: "s" });
      row++; // blank
      setCell(ws, row++, col, curr(y.noi));
      row++; // blank
      row++; // DEBT SERVICE header
      setCell(ws, row++, col, curr(y.annualDebtService));
      row++; // blank
      row++; // CASH FLOW header
      setCell(ws, row++, col, curr(y.cashFlow));
      setCell(ws, row++, col, curr(y.monthlyCashFlow));
      row++; // blank
      row++; // KEY METRICS header
      setCell(ws, row++, col, pctRaw(y.capRate / 100));
      setCell(ws, row++, col, pctRaw(y.cashOnCash / 100));
      setCell(ws, row++, col, numDec(y.dscr));
      setCell(ws, row++, col, numDec(y.grm));
    });

    ensureRange(ws, r + 30, 3);
    XLSX.utils.book_append_sheet(wb, ws, "Pro Forma");
  }

  // ─── SHEET 4: FEASIBILITY ──────────────────────────────────────────
  {
    const ws = XLSX.utils.aoa_to_sheet([["Feasibility Analysis"]]);
    ws["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    let r = 1;
    r++; // blank

    const fStrategy = exitStrategy;
    const fIncludesSale = fStrategy === "sell" || fStrategy === "rent-then-sell";
    const fIncludesRental = fStrategy === "rent" || fStrategy === "rent-then-sell";
    const EXIT_LABELS: Record<string, string> = { sell: "Sell", rent: "Rent", "rent-then-sell": "Rent then Sell" };
    setCell(ws, r, 0, { v: "Exit Strategy", t: "s" });
    setCell(ws, r, 1, { v: EXIT_LABELS[fStrategy] || fStrategy, t: "s" }); r += 2;
    const writeRows = (rows: [string, any][]) => rows.forEach(([label, cell]) => {
      setCell(ws, r, 0, { v: label, t: "s" }); setCell(ws, r, 1, cell); r++;
    });
    const hasArv = rentalFin.arv > 0;
    const na = { v: NO_ARV_LABEL, t: "s" as const };

    if (fIncludesSale) {
      setCell(ws, r, 0, bold("Sale Exit Analysis")); r++;
      writeRows([
        ["After Repair Value (ARV)", hasArv ? curr(data.arv) : na],
        ["Sales Costs", curr(data.salesCosts)],
        ["Net Sale Proceeds", curr(data.netSaleProceeds)],
        ["Total Development Cost", curr(tdc)],
        ["Net Profit", curr(data.netProfit)],
        ["ROI (Cash Equity)", pctRaw(data.roi / 100)],
        ["ROI (Total Equity)", pctRaw(data.roiOnTotalEquity / 100)],
        ["Profit Margin", pctRaw(data.profitMargin / 100)],
        ["All-in Basis (TDC/ARV)", hasArv ? pctRaw(data.allInBasis / 100) : na],
      ]);
      r++;
    }

    if (fIncludesRental) {
      setCell(ws, r, 0, bold("Rental Exit Analysis")); r++;
      writeRows([
        ["Gross Annual Rent", curr(rentalFin.grossRent)],
        ["Effective Gross Income", curr(rentalFin.egi)],
        ["Operating Expenses", curr(rentalFin.opex)],
        ["Net Operating Income (NOI)", curr(rentalFin.noi)],
        ["Annual Debt Service", curr(rentalFin.annualDebtService)],
        ["Annual Cash Flow", curr(rentalFin.cashFlow)],
        ["Cap Rate", pctRaw(rentalFin.capRate / 100)],
        ["Cash-on-Cash Return", pctRaw(rentalFin.cashOnCash / 100)],
        ["DSCR", { v: Number(rentalFin.dscr.toFixed(2)), t: "n" as const, z: "0.00\"x\"" }],
      ]);
      r++;
    }

    setCell(ws, r, 0, bold("Rule of Thumb Checks")); r++;
    const pf = (st: RuleCheckStatus) => ({ v: ruleCheckLabel(st, "PASS ✓", "FAIL ✗"), t: "s" as const });
    if (fIncludesSale) {
      setCell(ws, r, 0, { v: "85% Rule (TDC ≤ 85% ARV)", t: "s" });
      setCell(ws, r, 1, pf(rentalFin.allInBasisCheck)); r++;
      setCell(ws, r, 0, { v: "70% Rule (Purchase ≤ 70% ARV − Rehab)", t: "s" });
      setCell(ws, r, 1, pf(rentalFin.seventyRuleCheck)); r++;
    }
    if (fIncludesRental) {
      setCell(ws, r, 0, { v: "1% Rule (Monthly Rent ≥ 1% TDC)", t: "s" });
      setCell(ws, r, 1, { v: rentalFin.monthlyRentTotal > 0 ? (rentalFin.onePercentRule >= 1 ? "PASS ✓" : "FAIL ✗") : "N/A", t: "s" }); r++;
    }

    if (fIncludesSale) {
      r++;
      setCell(ws, r, 0, bold("Sensitivity Analysis"));
      setCell(ws, r, 1, bold("ARV"));
      setCell(ws, r, 2, bold("Total Cost"));
      setCell(ws, r, 3, bold("Net Profit"));
      setCell(ws, r, 4, bold("ROI")); r++;
      // Scenarios come from the shared engine (netTdc basis) so the Base Case row
      // matches the headline Net Profit / ROI above.
      data.sensitivityScenarios.forEach((sc) => {
        setCell(ws, r, 0, { v: sc.label, t: "s" });
        setCell(ws, r, 1, curr(sc.arv));
        setCell(ws, r, 2, curr(sc.cost));
        setCell(ws, r, 3, curr(sc.profit));
        setCell(ws, r, 4, pctRaw(sc.return / 100));
        r++;
      });
    }

    ensureRange(ws, r, 4);
    XLSX.utils.book_append_sheet(wb, ws, "Feasibility");
  }

  // ─── SHEET 5: SCHEDULE ─────────────────────────────────────────────
  {
    const milestones = data.schedule.milestones || [];
    const headers = ["Milestone", "Duration (wks)", "Start Date", "End Date", "Status", "Progress %"];
    const rows: any[][] = [headers];
    milestones.forEach((m: any) => {
      rows.push([
        m.name || "—",
        m.duration || m.durationWeeks || 0,
        m.startDate || "—",
        m.endDate || "—",
        m.status || "Not Started",
        (m.progress || 0) / 100,
      ]);
    });
    const totalWeeks = milestones.reduce((s: number, m: any) => s + (m.duration || m.durationWeeks || 0), 0);
    rows.push(["TOTAL", totalWeeks, data.schedule.startDate || "", data.schedule.endDate || "", "", ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];

    // Format progress column as percentage
    for (let i = 1; i <= milestones.length; i++) {
      const addr = XLSX.utils.encode_cell({ r: i, c: 5 });
      if (ws[addr]) ws[addr].z = "0%";
    }

    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
  }

  // ─── SHEET 6: MARKET DATA ─────────────────────────────────────────
  {
    const vm = data.visionMarket;
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    ws["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 14 }];
    let r = 0;

    setCell(ws, r, 0, bold("Neighborhood Demographics")); r++;
    const neighborhood = (vm.neighborhoodName || "").replace(/^Neighborhood:\s*/i, "");
    const demoItems: [string, any][] = [
      ["Neighborhood", { v: neighborhood || "—", t: "s" }],
      ["Population", vm.population ? num(vm.population) : { v: "—", t: "s" }],
      ["Median Income", vm.medianIncome ? curr(vm.medianIncome) : { v: "—", t: "s" }],
      ["Median Home Value", vm.medianHomePrice ? curr(vm.medianHomePrice) : { v: "—", t: "s" }],
      ["Average Rent", vm.averageRent ? curr(vm.averageRent) : { v: "—", t: "s" }],
      ["Vacancy Rate", vm.vacancyRate ? pct(vm.vacancyRate) : { v: "—", t: "s" }],
      ["Ownership Rate", vm.ownershipRate ? pct(vm.ownershipRate) : { v: "—", t: "s" }],
      ["Market Trend", { v: vm.marketTrend || "—", t: "s" }],
    ];
    demoItems.forEach(([label, cell]) => {
      setCell(ws, r, 0, { v: label, t: "s" });
      setCell(ws, r, 1, cell);
      r++;
    });

    const comps = vm.comparables || [];
    if (comps.length > 0) {
      r++;
      setCell(ws, r, 0, bold("Comparable Properties")); r++;
      const compHeaders = ["Address", "Sale Price", "Sq Ft", "$/SqFt", "Beds", "Baths", "Condition"];
      compHeaders.forEach((h, c) => setCell(ws, r, c, bold(h)));
      r++;

      let totalPSF = 0;
      let psfCount = 0;
      comps.forEach((c: any) => {
        setCell(ws, r, 0, { v: c.address || "—", t: "s" });
        setCell(ws, r, 1, c.salePrice ? curr(c.salePrice) : { v: "—", t: "s" });
        setCell(ws, r, 2, c.sqft ? num(c.sqft) : { v: "—", t: "s" });
        const psf = c.sqft && c.salePrice ? Math.round(c.salePrice / c.sqft) : 0;
        setCell(ws, r, 3, psf > 0 ? curr(psf) : { v: "—", t: "s" });
        setCell(ws, r, 4, c.bedrooms ? num(c.bedrooms) : { v: "—", t: "s" });
        setCell(ws, r, 5, c.bathrooms ? num(c.bathrooms) : { v: "—", t: "s" });
        setCell(ws, r, 6, { v: c.condition || "—", t: "s" });
        if (psf > 0) { totalPSF += psf; psfCount++; }
        r++;
      });

      if (psfCount > 0) {
        r++;
        setCell(ws, r, 0, bold("Average $/SqFt"));
        setCell(ws, r, 1, curr(Math.round(totalPSF / psfCount)));
        r++;
      }
    }

    ensureRange(ws, r, 6);
    XLSX.utils.book_append_sheet(wb, ws, "Market Data");
  }

  // ─── SHEET 7: RISK & RESILIENCE ────────────────────────────────────
  {
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    ws["!cols"] = [{ wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 32 }, { wch: 12 }];
    let r = 0;

    // Risk Register
    setCell(ws, r, 0, bold("Risk Register")); r++;
    const riskHeaders = ["Category", "Description", "Likelihood", "Impact", "Mitigation", "Status"];
    riskHeaders.forEach((h, c) => setCell(ws, r, c, bold(h)));
    r++;

    const risks = data.riskAssessment.risks || [];
    risks.forEach((risk: any) => {
      setCell(ws, r, 0, { v: risk.category || "—", t: "s" });
      setCell(ws, r, 1, { v: risk.description || "—", t: "s" });
      setCell(ws, r, 2, { v: risk.likelihood || "—", t: "s" });
      setCell(ws, r, 3, { v: risk.impact || "—", t: "s" });
      setCell(ws, r, 4, { v: risk.mitigation || "—", t: "s" });
      setCell(ws, r, 5, { v: risk.status || "—", t: "s" });
      r++;
    });
    if (risks.length === 0) {
      setCell(ws, r, 0, { v: "No risks identified", t: "s" }); r++;
    }

    r += 2;

    // Resilience Checklist
    setCell(ws, r, 0, bold("Resilience Checklist")); r++;

    const res = data.resilience || {};
    const categories: [string, [string, string][]][] = [
      ["Financial Resilience", [
        ["hasContingency", "Contingency Budget"], ["hasOperatingReserves", "Operating Reserves"],
        ["hasInsurance", "Insurance Coverage"], ["hasClearTitle", "Clear Title"],
        ["hasMultipleFunding", "Multiple Funding Sources"], ["lowLTV", "Low LTV"],
        ["positiveAppraisal", "Positive Appraisal"],
      ]],
      ["Project Resilience", [
        ["hasExperiencedGC", "Experienced GC"], ["hasArchitect", "Licensed Architect"],
        ["hasPermits", "Permits Obtained"], ["hasRealisticSchedule", "Realistic Schedule"],
        ["hasDetailedScope", "Detailed Scope"], ["hasManagementPlan", "Management Plan"],
        ["hasSiteControl", "Site Control"],
      ]],
      ["Market Resilience", [
        ["strongMarketDemand", "Strong Market Demand"], ["positiveComps", "Positive Comps"],
        ["lowVacancy", "Low Vacancy"], ["growingNeighborhood", "Growing Neighborhood"],
        ["hasAnchorInstitutions", "Anchor Institutions"], ["affordableTarget", "Affordable Target"],
      ]],
    ];

    let totalChecked = 0;
    let totalItems = 0;
    categories.forEach(([catName, items]) => {
      setCell(ws, r, 0, bold(catName));
      setCell(ws, r, 1, bold("Status")); r++;
      items.forEach(([key, label]) => {
        const checked = !!res[key];
        if (checked) totalChecked++;
        totalItems++;
        setCell(ws, r, 0, { v: `   ${label}`, t: "s" });
        setCell(ws, r, 1, { v: checked ? "✓ Yes" : "— No", t: "s" });
        r++;
      });
      r++;
    });

    setCell(ws, r, 0, bold("Overall Resilience Score"));
    setCell(ws, r, 1, { v: `${totalChecked} / ${totalItems}`, t: "s" }); r++;

    if (res.additionalStrengths) {
      r++;
      setCell(ws, r, 0, bold("Additional Strengths"));
      setCell(ws, r, 1, { v: res.additionalStrengths, t: "s" }); r++;
    }

    ensureRange(ws, r, 5);
    XLSX.utils.book_append_sheet(wb, ws, "Risk & Resilience");
  }

  // ─── DOWNLOAD ──────────────────────────────────────────────────────
  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Development_Package.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
