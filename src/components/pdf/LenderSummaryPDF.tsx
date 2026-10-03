import { allInBasisRule, seventyRule, ruleCheckLabel } from "@/utils/calculations";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ProjectExportData } from "@/utils/fetchProjectData";
import { colors } from "./PDFStyles";

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 50, paddingHorizontal: 45, fontFamily: "Helvetica", fontSize: 9, color: colors.body },
  footer: { position: "absolute", bottom: 18, left: 45, right: 45, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
  footerText: { fontSize: 7, color: colors.light },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: colors.navy, marginBottom: 8, marginTop: 14 },
  subTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.blue, marginBottom: 6, marginTop: 10 },
  coverTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: colors.navy, marginBottom: 4 },
  coverSubtitle: { fontSize: 11, color: colors.muted, marginBottom: 2 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  metricBox: { width: "33%", padding: 6 },
  metricLabel: { fontSize: 7, color: colors.muted, marginBottom: 2 },
  metricValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: colors.navy },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: colors.navy, paddingVertical: 5, paddingHorizontal: 4 },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.white },
  tdText: { fontSize: 8, color: colors.body },
  altRow: { backgroundColor: colors.tableAlt },
  body: { fontSize: 9, color: colors.body, lineHeight: 1.5, marginBottom: 8 },
  badge: { fontSize: 7, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  highlightBox: { backgroundColor: colors.summaryBg, borderRadius: 4, padding: 8, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border, marginVertical: 8 },
});

const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const EXIT_LABELS: Record<string, string> = { sell: "Sell", rent: "Rent", "rent-then-sell": "Rent → Sell" };

const Footer = ({ projectName }: { projectName: string }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>Lender Summary — Confidential</Text>
    <Text style={s.footerText}>{projectName}</Text>
    <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

export const LenderSummaryPDF = ({ data }: { data: ProjectExportData }) => {
  const risks = data.riskAssessment.risks || [];
  const milestones = data.schedule.milestones || [];
  const totalWeeks = milestones.reduce((s: number, m: any) => s + (m.duration || 0), 0);
  const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d || "—"; } };

  const insuranceFields = [
    ["General Liability", data.riskAssessment.generalLiabilityInsurance],
    ["Builder's Risk", data.riskAssessment.buildersRiskInsurance],
    ["Title Insurance", data.riskAssessment.titleInsurance],
    ["Property Insurance", data.riskAssessment.propertyInsurance],
  ];
  const insuranceObtained = insuranceFields.filter(([, v]) => v === "Obtained" || v === "Yes").length;

  const resFactors = data.resilience;
  const financialScore = ["hasContingency", "hasOperatingReserves", "hasInsurance", "hasClearTitle", "hasMultipleFunding", "lowLTV", "positiveAppraisal"]
    .filter(k => resFactors[k]).length;
  const projectScore = ["hasExperiencedGC", "hasArchitect", "hasPermits", "hasRealisticSchedule", "hasDetailedScope", "hasManagementPlan", "hasSiteControl"]
    .filter(k => resFactors[k]).length;
  const marketScore = ["strongMarketDemand", "positiveComps", "lowVacancy", "growingNeighborhood", "hasAnchorInstitutions", "affordableTarget"]
    .filter(k => resFactors[k]).length;
  const totalResScore = financialScore + projectScore + marketScore;
  const resPct = Math.round((totalResScore / 20) * 100);
  const resLabel = resPct >= 75 ? "Strong" : resPct >= 50 ? "Moderate" : "Needs Attention";

  const comps = data.visionMarket.comparables || [];

  const allInStatus = allInBasisRule(data.arv, data.allInBasis);
  const allInBasisPassed = allInStatus !== "fail";
  const purchasePrice = data.budget.acquisition?.purchasePrice || 0;
  const maxPurchase = data.arv > 0 ? data.arv * 0.7 : 0;
  const seventyStatus = seventyRule(data.arv, purchasePrice, maxPurchase);
  const seventyPassed = seventyStatus !== "fail";

  return (
    <Document title={`${data.projectName} - Lender Summary`} author={data.preparedBy}>
      {/* PAGE 1: Cover + Executive Summary */}
      <Page size="LETTER" style={s.page}>
        <View style={{ borderBottomWidth: 2, borderBottomColor: colors.navy, paddingBottom: 12, marginBottom: 12 }}>
          <Text style={s.coverTitle}>{data.projectName}</Text>
          <Text style={s.coverSubtitle}>{data.address}</Text>
          <Text style={s.coverSubtitle}>
            Prepared by {data.preparedBy}{data.companyName ? ` — ${data.companyName}` : ""} | {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </View>

        <Text style={s.sectionTitle}>Deal Snapshot</Text>
        <View style={s.metricGrid}>
          {[
            ["Total Investment", fmt(data.tdc)],
            ["After Repair Value", fmt(data.arv)],
            ["Net Profit", fmt(data.netProfit)],
            ["ROI (Cash)", fmtPct(data.roi)],
            ["Profit Margin", fmtPct(data.profitMargin)],
            ["Exit Strategy", EXIT_LABELS[data.exitStrategy] || data.exitStrategy],
            ["Funding Gap", data.fundingGap > 0 ? fmt(data.fundingGap) : "Fully Funded"],
            ["Duration", totalWeeks > 0 ? `${totalWeeks} weeks` : "—"],
            ["All-in Basis", data.arv > 0 ? fmtPct(data.allInBasis) : "—"],
          ].map(([label, value], i) => (
            <View key={i} style={s.metricBox}>
              <Text style={s.metricLabel}>{label}</Text>
              <Text style={s.metricValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.subTitle}>Project Overview</Text>
        <Text style={s.body}>{data.executiveSummary.projectOverview || "No overview available."}</Text>

        <Footer projectName={data.projectName} />
      </Page>

      {/* PAGE 2: Financial Summary */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionTitle}>Financial Summary</Text>

        <Text style={s.subTitle}>Cost Summary</Text>
        <View style={s.highlightBox}>
          {[
            ["Acquisition", fmt(data.acqTotal)],
            ["Construction", fmt(data.hardTotal)],
            ["Pre-Development", fmt(data.softTotal)],
            ["Holding Costs", fmt(data.holdingTotal)],
            ["Operating Reserves", fmt(data.operatingReserves)],
          ].map(([label, value], i) => (
            <View key={i} style={s.row}>
              <Text style={s.tdText}>{label}</Text>
              <Text style={s.tdText}>{value}</Text>
            </View>
          ))}
          <View style={[s.row, { borderTopWidth: 1, borderTopColor: colors.navy, marginTop: 4, paddingTop: 4 }]}>
            <Text style={[s.tdText, { fontFamily: "Helvetica-Bold" }]}>Total Development Cost</Text>
            <Text style={[s.tdText, { fontFamily: "Helvetica-Bold" }]}>{fmt(data.tdc)}</Text>
          </View>
        </View>

        <Text style={s.subTitle}>Capital Stack</Text>
        <View style={s.highlightBox}>
          {data.landEquity > 0 && (
            <View style={s.row}>
              <Text style={s.tdText}>Land Equity</Text>
              <Text style={s.tdText}>{fmt(data.landEquity)}</Text>
            </View>
          )}
          {[
            ["Developer Equity (Cash)", fmt(data.cashEquity)],
            ["Bank Loan", fmt(data.bankLoan)],
            ["Private Lender", fmt(data.privateLender)],
            ["Grants & Subsidies", fmt(data.grants)],
          ].map(([label, value], i) => (
            <View key={i} style={s.row}>
              <Text style={s.tdText}>{label}</Text>
              <Text style={s.tdText}>{value}</Text>
            </View>
          ))}
          <View style={[s.row, { borderTopWidth: 1, borderTopColor: colors.navy, marginTop: 4, paddingTop: 4 }]}>
            <Text style={[s.tdText, { fontFamily: "Helvetica-Bold" }]}>Total Sources</Text>
            <Text style={[s.tdText, { fontFamily: "Helvetica-Bold" }]}>{fmt(data.totalSources)}</Text>
          </View>
          {data.fundingGap > 0 && (
            <View style={[s.row, { marginTop: 2 }]}>
              <Text style={[s.tdText, { color: colors.red }]}>Funding Gap</Text>
              <Text style={[s.tdText, { color: colors.red }]}>{fmt(data.fundingGap)}</Text>
            </View>
          )}
        </View>

        <Text style={s.subTitle}>Key Feasibility Metrics</Text>
        <View style={s.highlightBox}>
          {[
            ["After Repair Value", fmt(data.arv)],
            ["Net Profit", fmt(data.netProfit)],
            ["ROI (Cash Equity)", fmtPct(data.roi)],
            ["Profit Margin", fmtPct(data.profitMargin)],
            ["All-in Basis", data.arv > 0 ? fmtPct(data.allInBasis) : "—"],
          ].map(([label, value], i) => (
            <View key={i} style={s.row}>
              <Text style={s.tdText}>{label}</Text>
              <Text style={s.tdText}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.subTitle}>Rule of Thumb Checks</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={[s.badge, { backgroundColor: allInBasisPassed ? colors.lightGreen : "#FEF2F2" }]}>
            <Text style={{ fontSize: 8, color: allInBasisPassed ? colors.green : colors.red }}>
              85% Rule: {ruleCheckLabel(allInStatus)}{data.arv > 0 ? ` (${fmtPct(data.allInBasis)})` : ""}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: seventyPassed ? colors.lightGreen : "#FEF2F2" }]}>
            <Text style={{ fontSize: 8, color: seventyPassed ? colors.green : colors.red }}>
              70% Rule: {ruleCheckLabel(seventyStatus)}
            </Text>
          </View>
        </View>

        <Footer projectName={data.projectName} />
      </Page>

      {/* PAGE 3: Schedule & Risk */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionTitle}>Schedule & Risk</Text>

        <Text style={s.subTitle}>Project Schedule</Text>
        {milestones.length > 0 ? (
          <View>
            <View style={s.tableHeader}>
              <Text style={[s.thText, { width: "35%" }]}>Milestone</Text>
              <Text style={[s.thText, { width: "20%" }]}>Duration</Text>
              <Text style={[s.thText, { width: "25%" }]}>Dates</Text>
              <Text style={[s.thText, { width: "20%" }]}>Status</Text>
            </View>
            {milestones.map((m: any, i: number) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 && s.altRow]}>
                <Text style={[s.tdText, { width: "35%", paddingLeft: 4 }]}>{m.name || "—"}</Text>
                <Text style={[s.tdText, { width: "20%", paddingLeft: 4 }]}>{m.duration || 0} wks</Text>
                <Text style={[s.tdText, { width: "25%", paddingLeft: 4 }]}>{m.startDate ? fmtDate(m.startDate) : "—"} – {m.endDate ? fmtDate(m.endDate) : "—"}</Text>
                <Text style={[s.tdText, { width: "20%", paddingLeft: 4 }]}>{m.status || "Not Started"}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.body}>No milestones defined.</Text>
        )}

        <Text style={s.subTitle}>Risk Register</Text>
        {risks.length > 0 ? (
          <View>
            <View style={s.tableHeader}>
              <Text style={[s.thText, { width: "25%" }]}>Category</Text>
              <Text style={[s.thText, { width: "35%" }]}>Description</Text>
              <Text style={[s.thText, { width: "20%" }]}>Likelihood</Text>
              <Text style={[s.thText, { width: "20%" }]}>Status</Text>
            </View>
            {risks.map((r: any, i: number) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 && s.altRow]}>
                <Text style={[s.tdText, { width: "25%", paddingLeft: 4 }]}>{r.category || "—"}</Text>
                <Text style={[s.tdText, { width: "35%", paddingLeft: 4 }]}>{r.description || "—"}</Text>
                <Text style={[s.tdText, { width: "20%", paddingLeft: 4, color: r.likelihood === "High" ? colors.red : r.likelihood === "Medium" ? colors.gold : colors.green }]}>{r.likelihood || "—"}</Text>
                <Text style={[s.tdText, { width: "20%", paddingLeft: 4 }]}>{r.status || "—"}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.body}>No risks identified.</Text>
        )}

        <View style={s.divider} />

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ width: "48%" }}>
            <Text style={s.subTitle}>Insurance Status</Text>
            <Text style={s.body}>{insuranceObtained} of 4 insurance types obtained</Text>
            {insuranceFields.map(([label, status], i) => (
              <View key={i} style={s.row}>
                <Text style={s.tdText}>{label}</Text>
                <Text style={[s.tdText, { color: status === "Obtained" || status === "Yes" ? colors.green : colors.muted }]}>{status || "Not Obtained"}</Text>
              </View>
            ))}
          </View>
          <View style={{ width: "48%" }}>
            <Text style={s.subTitle}>Resilience Score</Text>
            <Text style={[s.metricValue, { fontSize: 18, marginBottom: 4 }]}>{resPct}% — {resLabel}</Text>
            <View style={s.row}><Text style={s.tdText}>Financial</Text><Text style={s.tdText}>{financialScore}/7</Text></View>
            <View style={s.row}><Text style={s.tdText}>Project</Text><Text style={s.tdText}>{projectScore}/7</Text></View>
            <View style={s.row}><Text style={s.tdText}>Market</Text><Text style={s.tdText}>{marketScore}/6</Text></View>
          </View>
        </View>

        <Footer projectName={data.projectName} />
      </Page>

      {/* PAGE 4: Market & Comps (only if data exists) */}
      {(comps.length > 0 || data.visionMarket.neighborhoodName || data.visionMarket.medianHomePrice) && (
        <Page size="LETTER" style={s.page}>
          <Text style={s.sectionTitle}>Market & Comparables</Text>

          <Text style={s.subTitle}>Market Analysis</Text>
          <View style={s.highlightBox}>
            {[
              ["Neighborhood", (data.visionMarket.neighborhoodName || "").replace(/^Neighborhood:\s*/i, "")],
              ["Median Home Price", data.visionMarket.medianHomePrice ? fmt(data.visionMarket.medianHomePrice) : "—"],
              ["Average Rent", data.visionMarket.averageRent ? fmt(data.visionMarket.averageRent) : "—"],
              ["Vacancy Rate", data.visionMarket.vacancyRate ? `${data.visionMarket.vacancyRate}%` : "—"],
              ["Market Trend", data.visionMarket.marketTrend || "—"],
              ["Population Trend", data.visionMarket.populationTrend || "—"],
            ].filter(([, v]) => v && v !== "—").map(([label, value], i) => (
              <View key={i} style={s.row}>
                <Text style={s.tdText}>{label}</Text>
                <Text style={s.tdText}>{value}</Text>
              </View>
            ))}
          </View>

          {comps.length > 0 && (
            <>
              <Text style={s.subTitle}>Comparable Properties</Text>
              <View style={s.tableHeader}>
                <Text style={[s.thText, { width: "30%" }]}>Address</Text>
                <Text style={[s.thText, { width: "15%" }]}>Price</Text>
                <Text style={[s.thText, { width: "12%" }]}>Sq Ft</Text>
                <Text style={[s.thText, { width: "13%" }]}>$/SF</Text>
                <Text style={[s.thText, { width: "15%" }]}>Beds/Bath</Text>
                <Text style={[s.thText, { width: "15%" }]}>Condition</Text>
              </View>
              {comps.map((c: any, i: number) => (
                <View key={i} style={[s.tableRow, i % 2 === 1 && s.altRow]}>
                  <Text style={[s.tdText, { width: "30%", paddingLeft: 4 }]}>{c.address || "—"}</Text>
                  <Text style={[s.tdText, { width: "15%", paddingLeft: 4 }]}>{c.salePrice ? fmt(c.salePrice) : "—"}</Text>
                  <Text style={[s.tdText, { width: "12%", paddingLeft: 4 }]}>{c.sqft ? c.sqft.toLocaleString() : "—"}</Text>
                  <Text style={[s.tdText, { width: "13%", paddingLeft: 4 }]}>{!!c.sqft && c.salePrice ? fmt(Math.round(c.salePrice / c.sqft)) : "—"}</Text>
                  <Text style={[s.tdText, { width: "15%", paddingLeft: 4 }]}>{c.bedrooms || "—"}/{c.bathrooms || "—"}</Text>
                  <Text style={[s.tdText, { width: "15%", paddingLeft: 4 }]}>{c.condition || "—"}</Text>
                </View>
              ))}
            </>
          )}

          {!!data.siteLocation.currentZoning && (
            <>
              <Text style={s.subTitle}>Zoning Summary</Text>
              <View style={s.highlightBox}>
                <View style={s.row}><Text style={s.tdText}>Zoning</Text><Text style={s.tdText}>{data.siteLocation.currentZoning}</Text></View>
                {!!data.siteLocation.zoningDescription && <View style={s.row}><Text style={s.tdText}>Description</Text><Text style={s.tdText}>{data.siteLocation.zoningDescription}</Text></View>}
                {!!data.siteLocation.entitlementStatus && <View style={s.row}><Text style={s.tdText}>Entitlement Status</Text><Text style={s.tdText}>{data.siteLocation.entitlementStatus}</Text></View>}
              </View>
            </>
          )}

          <Footer projectName={data.projectName} />
        </Page>
      )}
    </Document>
  );
};
