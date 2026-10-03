import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ProjectExportData } from "@/utils/fetchProjectData";
import { colors } from "./PDFStyles";

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 30, paddingHorizontal: 35, fontFamily: "Helvetica", fontSize: 9, color: colors.body },
  headerBar: { backgroundColor: colors.navy, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 4, marginBottom: 14 },
  projectTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: colors.white, marginBottom: 2 },
  headerSub: { fontSize: 9, color: "#B0C4DE" },
  columns: { flexDirection: "row", gap: 14, marginBottom: 12 },
  col: { flex: 1 },
  colTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.navy, borderBottomWidth: 1.5, borderBottomColor: colors.blue, paddingBottom: 3, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  label: { fontSize: 8, color: colors.muted },
  value: { fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.body },
  bottomBar: { flexDirection: "row", gap: 14, marginTop: 4 },
  bottomBox: { flex: 1, backgroundColor: colors.summaryBg, borderRadius: 4, padding: 8 },
  bottomTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.navy, marginBottom: 4 },
  bottomText: { fontSize: 7.5, color: colors.body, lineHeight: 1.4 },
  capBar: { flexDirection: "row", height: 10, borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  disclaimer: { fontSize: 6.5, color: colors.light, marginTop: 8, textAlign: "center" },
});

const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const EXIT_LABELS: Record<string, string> = { sell: "Sell", rent: "Rent", "rent-then-sell": "Rent → Sell" };

const MetricRow = ({ label, value }: { label: string; value: string }) => (
  <View style={s.row}>
    <Text style={s.label}>{label}</Text>
    <Text style={s.value}>{value}</Text>
  </View>
);

export const InvestorOnePagerPDF = ({ data }: { data: ProjectExportData }) => {
  const milestones = data.schedule.milestones || [];
  const totalWeeks = milestones.reduce((sum: number, m: any) => sum + (m.duration || 0), 0);
  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }); } catch { return d || "—"; } };
  const neighborhood = (data.visionMarket.neighborhoodName || "").replace(/^Neighborhood:\s*/i, "");
  const risks = data.riskAssessment.risks || [];
  const mitigatedRisks = risks.filter((r: any) => r.status === "Mitigated" || r.status === "Resolved").length;

  // Capital stack percentages
  const equityPct = data.totalSources > 0 ? (data.totalEquity / data.totalSources) * 100 : 0;
  const debtPct = data.totalSources > 0 ? ((data.bankLoan + data.privateLender) / data.totalSources) * 100 : 0;
  const subsidyPct = data.totalSources > 0 ? (data.grants / data.totalSources) * 100 : 0;

  // Sensitivity
  const salesCostsPct = data.salesCostsPct;
  const bestArv = data.arv * 1.1;
  const bestProfit = bestArv - (bestArv * salesCostsPct / 100) - data.tdc * 0.95;
  const bestRoi = data.cashEquity > 0 ? (bestProfit / data.cashEquity * 100) : 0;
  const worstArv = data.arv * 0.85;
  const worstProfit = worstArv - (worstArv * salesCostsPct / 100) - data.tdc * 1.15;
  const worstRoi = data.cashEquity > 0 ? (worstProfit / data.cashEquity * 100) : 0;

  // Resilience
  const resFactors = data.resilience;
  const totalRes = ["hasContingency","hasOperatingReserves","hasInsurance","hasClearTitle","hasMultipleFunding","lowLTV","positiveAppraisal",
    "hasExperiencedGC","hasArchitect","hasPermits","hasRealisticSchedule","hasDetailedScope","hasManagementPlan","hasSiteControl",
    "strongMarketDemand","positiveComps","lowVacancy","growingNeighborhood","hasAnchorInstitutions","affordableTarget"]
    .filter(k => resFactors[k]).length;
  const resPct = Math.round((totalRes / 20) * 100);

  

  return (
    <Document title={`${data.projectName} - Investor One-Pager`} author={data.preparedBy}>
      <Page size="LETTER" orientation="landscape" style={s.page}>
        {/* HEADER */}
        <View style={s.headerBar}>
          <Text style={s.projectTitle}>{data.projectName}</Text>
          <Text style={s.headerSub}>
            {data.address}{neighborhood ? ` | ${neighborhood}` : ""} | Prepared by {data.preparedBy}{data.companyName ? ` — ${data.companyName}` : ""} | {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
        </View>

        {/* THREE COLUMNS */}
        <View style={s.columns}>
          {/* Column 1: The Deal */}
          <View style={s.col}>
            <Text style={s.colTitle}>THE DEAL</Text>
            <MetricRow label="Project Type" value={data.scope.projectType || "Development"} />
            <MetricRow label="Property Type" value={`${data.scope.propertyType || "—"} | ${data.scope.unitCount || 1} unit(s)`} />
            <MetricRow label="Square Footage" value={data.sqftPlanned > 0 ? `${data.sqftPlanned.toLocaleString()} SF` : "—"} />
            <MetricRow label="Total Investment" value={fmt(data.tdc)} />
            <MetricRow label="After Repair Value" value={fmt(data.arv)} />
            <MetricRow label="Net Profit" value={fmt(data.netProfit)} />
            <MetricRow label="ROI (Cash)" value={fmtPct(data.roi)} />
            <MetricRow label="Exit Strategy" value={EXIT_LABELS[data.exitStrategy] || data.exitStrategy} />
          </View>

          {/* Column 2: The Numbers */}
          <View style={s.col}>
            <Text style={s.colTitle}>THE NUMBERS</Text>
            <Text style={[s.label, { marginBottom: 2 }]}>Sources and Uses</Text>
            <View style={s.capBar}>
              {equityPct > 0 && <View style={{ width: `${equityPct}%`, backgroundColor: "#27AE60" }} />}
              {debtPct > 0 && <View style={{ width: `${debtPct}%`, backgroundColor: "#2E86AB" }} />}
              {subsidyPct > 0 && <View style={{ width: `${subsidyPct}%`, backgroundColor: "#F39C12" }} />}
            </View>
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              <Text style={{ fontSize: 7, color: "#27AE60" }}>■ Equity {fmtPct(equityPct)}  </Text>
              <Text style={{ fontSize: 7, color: "#2E86AB" }}>■ Debt {fmtPct(debtPct)}  </Text>
              <Text style={{ fontSize: 7, color: "#F39C12" }}>■ Subsidy {fmtPct(subsidyPct)}</Text>
            </View>
            <MetricRow label="Funding Status" value={data.fundingGap > 0 ? `Gap: ${fmt(data.fundingGap)}` : "Fully Funded"} />
            <MetricRow label="Profit Margin" value={fmtPct(data.profitMargin)} />
            <MetricRow label="All-in Basis" value={data.arv > 0 ? fmtPct(data.allInBasis) : "—"} />
            <View style={{ marginTop: 4, borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 4 }}>
              <Text style={[s.label, { marginBottom: 2 }]}>Sensitivity</Text>
              <MetricRow label="Best Case" value={`${fmtPct(bestRoi)} ROI`} />
              <MetricRow label="Base Case" value={`${fmtPct(data.roi)} ROI`} />
              <MetricRow label="Worst Case" value={`${fmtPct(worstRoi)} ROI`} />
            </View>
            <MetricRow label="Resilience Score" value={`${resPct}%`} />
          </View>

          {/* Column 3: The Market */}
          <View style={s.col}>
            <Text style={s.colTitle}>THE MARKET</Text>
            <MetricRow label="Neighborhood" value={neighborhood || "—"} />
            <MetricRow label="Market Trend" value={data.visionMarket.marketTrend || "—"} />
            <MetricRow label="Median Home Price" value={data.visionMarket.medianHomePrice ? fmt(data.visionMarket.medianHomePrice) : "—"} />
            <MetricRow label="Average Rent" value={data.visionMarket.averageRent ? fmt(data.visionMarket.averageRent) : "—"} />
            <MetricRow label="Vacancy Rate" value={data.visionMarket.vacancyRate ? `${data.visionMarket.vacancyRate}%` : "—"} />
            {data.visionMarket.avgPricePerSqFt > 0 && (
              <MetricRow label="Comp Avg $/SF" value={fmt(Math.round(data.visionMarket.avgPricePerSqFt))} />
            )}
          </View>
        </View>

        {/* BOTTOM SECTION */}
        <View style={s.bottomBar}>
          <View style={s.bottomBox}>
            <Text style={s.bottomTitle}>Timeline</Text>
            <Text style={s.bottomText}>
              {totalWeeks > 0 ? `${totalWeeks} weeks (${Math.round(totalWeeks / 4.33)} months)` : "TBD"}
              {data.schedule.startDate ? ` | ${fmtDate(data.schedule.startDate)}` : ""}
              {data.schedule.endDate ? ` — ${fmtDate(data.schedule.endDate)}` : ""}
            </Text>
          </View>
          <View style={s.bottomBox}>
            <Text style={s.bottomTitle}>Team</Text>
            <Text style={s.bottomText}>Developer: {data.preparedBy}{data.companyName ? ` (${data.companyName})` : ""}</Text>
            {!!data.team.gcCompany && <Text style={s.bottomText}>GC: {data.team.gcCompany}</Text>}
            {!!data.team.architectCompany && <Text style={s.bottomText}>Architect: {data.team.architectCompany}</Text>}
          </View>
          <View style={s.bottomBox}>
            <Text style={s.bottomTitle}>Risk Summary</Text>
            <Text style={s.bottomText}>{risks.length} risks identified, {mitigatedRisks} mitigated</Text>
          </View>
        </View>

        <Text style={s.disclaimer}>
          This document is for informational purposes only and does not constitute an offer of securities or investment advice. All projections are estimates subject to change.
        </Text>
      </Page>
    </Document>
  );
};
