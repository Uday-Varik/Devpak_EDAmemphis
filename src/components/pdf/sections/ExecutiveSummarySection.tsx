import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency, formatPercent, formatCompact } from "../pdfUtils";

interface ExecutiveSummarySectionProps {
  projectName: string;
  address: string;
  tdc: number;
  arv: number;
  netProfit: number;
  roi: number;
  profitMargin: number;
  exitStrategy: string;
  projectOverview: string;
  riskItems: string[];
  fundingGap: number;
  sqftPlanned: number;
  constructionPerSF: number;
  totalPerSF: number;
  salePerSF: number;
  packagePurpose?: string;
  bankLoan: number;
  privateLender: number;
  grants: number;
  noi?: number;
  dscr?: number;
  capRate?: number;
}

const EXIT_LABELS: Record<string, string> = {
  sell: "Sell",
  rent: "Rent",
  "rent-then-sell": "Rent → Sell",
};

const buildAsk = (
  packagePurpose: string | undefined,
  bankLoan: number,
  privateLender: number,
  grants: number,
  tdc: number,
  projectName: string,
): string => {
  const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  switch (packagePurpose) {
    case "loan-request": {
      const amt = bankLoan + privateLender;
      return amt > 0
        ? `This development package requests ${fmt(amt)} in construction financing for ${projectName}.`
        : `This development package presents ${projectName} for construction financing consideration.`;
    }
    case "grant-application":
      return grants > 0
        ? `This package requests ${fmt(grants)} in grant funding to support ${projectName}, advancing community housing goals.`
        : `This package seeks grant funding to support ${projectName}.`;
    case "investor-pitch":
      return `This package presents ${projectName} as an investment opportunity with ${fmt(tdc)} in total project costs.`;
    case "internal-planning":
      return `This document captures the plan, budget, schedule, and risk profile for ${projectName}.`;
    default:
      return `${projectName} — full development package for review.`;
  }
};

export const ExecutiveSummarySection = (props: ExecutiveSummarySectionProps) => {
  const {
    projectName, address, tdc, arv, netProfit, roi, profitMargin, exitStrategy,
    projectOverview, riskItems, fundingGap, sqftPlanned, constructionPerSF, totalPerSF, salePerSF,
    packagePurpose, bankLoan, privateLender, grants, noi = 0, dscr = 0, capRate = 0,
  } = props;
  const hasARV = arv > 0;
  const hasSF = sqftPlanned > 0;
  const isRental = exitStrategy === "rent" || exitStrategy === "rent-then-sell";

  const askText = buildAsk(packagePurpose, bankLoan, privateLender, grants, tdc, projectName);

  // Adaptive metrics based on exit strategy
  const metrics = isRental
    ? [
        { label: "Project", value: projectName || "—" },
        { label: "Address", value: address || "—" },
        { label: "Total Investment", value: tdc > 0 ? formatCompact(tdc) : "—" },
        { label: "NOI (Annual)", value: noi > 0 ? formatCompact(noi) : "—" },
        { label: "DSCR", value: dscr > 0 ? dscr.toFixed(2) : "—", highlight: dscr >= 1.25 },
        { label: "Cap Rate", value: capRate > 0 ? formatPercent(capRate) : "—" },
        { label: "Exit Strategy", value: EXIT_LABELS[exitStrategy] || "—" },
        { label: "Funding Gap", value: fundingGap > 0 ? formatCurrency(fundingGap) : "Fully Funded" },
      ]
    : [
        { label: "Project", value: projectName || "—" },
        { label: "Address", value: address || "—" },
        { label: "Total Investment", value: tdc > 0 ? formatCompact(tdc) : "—" },
        { label: "After Repair Value", value: hasARV ? formatCompact(arv) : "—" },
        { label: "Net Profit", value: hasARV ? formatCompact(netProfit) : "—", highlight: hasARV && netProfit > 0 },
        { label: "ROI", value: hasARV ? formatPercent(roi) : "—", highlight: hasARV && roi > 0 },
        { label: "Profit Margin", value: hasARV ? formatPercent(profitMargin) : "—" },
        { label: "Exit Strategy", value: EXIT_LABELS[exitStrategy] || "—" },
      ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      {/* Deal Snapshot Grid */}
      <View style={styles.metricGrid}>
        {metrics.map((m, i) => (
          <View key={i} style={[styles.metricBox, (m as any).highlight ? { borderLeftColor: colors.green } : {}]}>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={[styles.metricValue, { fontSize: 11 }, (m as any).highlight ? { color: colors.green, fontSize: 13 } : {}]}>
              {m.value}
            </Text>
          </View>
        ))}
      </View>

      {/* The Ask — prominent */}
      <View style={{
        backgroundColor: "#FFF8E1",
        borderLeftWidth: 4,
        borderLeftColor: colors.gold,
        padding: 12,
        marginBottom: 14,
      }}>
        <Text style={[styles.highlightTitle, { color: colors.gold, marginBottom: 4 }]}>The Ask</Text>
        <Text style={[styles.bodyText, { marginBottom: 0, fontFamily: "Helvetica-Bold", color: colors.navy, fontSize: 11 }]}>
          {askText}
        </Text>
      </View>

      {/* Project Overview */}
      {!!projectOverview && (
        <View>
          <Text style={styles.subTitle}>Project Overview</Text>
          <Text style={styles.bodyText}>{projectOverview}</Text>
        </View>
      )}

      {/* Financial highlights table */}
      {!!hasSF && (
        <View>
          <Text style={styles.subTitle}>Financial Highlights</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Metric</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
            </View>
            {[
              { label: "Construction $/SF", value: `$${Math.round(constructionPerSF)}` },
              { label: "Total Development $/SF", value: `$${Math.round(totalPerSF)}` },
              ...(hasARV ? [{ label: "Sale $/SF", value: `$${Math.round(salePerSF)}` }] : []),
              { label: "Total Investment", value: formatCurrency(tdc) },
              ...(hasARV ? [{ label: "Net Profit", value: formatCurrency(netProfit) }] : []),
              { label: "Funding Gap", value: fundingGap > 0 ? formatCurrency(fundingGap) : "Fully Funded" },
            ].map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{row.label}</Text>
                <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Risk Summary */}
      {riskItems.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Risk Summary</Text>
          {riskItems.map((risk, i) => (
            <View key={i} style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: colors.gold }]} />
              <Text style={styles.bulletText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
