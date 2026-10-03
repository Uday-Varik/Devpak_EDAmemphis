import { allInBasisRule, seventyRule, ruleCheckLabel } from "@/utils/calculations";
import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency, formatPercent } from "../pdfUtils";
import type { SensitivityScenario } from "@/utils/calculations";

interface FeasibilitySectionProps {
  feasibility: Record<string, any>;
  /** All financial metrics come from the single source in fetchProjectData. */
  metrics: {
    tdc: number;
    arv: number;
    salesCostsPct: number;
    salesCosts: number;
    netSaleProceeds: number;
    netProfit: number;
    roi: number;
    profitMargin: number;
    allInBasis: number;
    seventyMaxPurchase: number;
    purchasePrice: number;
    totalEquity: number;
    grossRent: number;
    egi: number;
    opex: number;
    noi: number;
    annualDebtService: number;
    cashFlow: number;
    capRate: number;
    cashOnCash: number;
    dscr: number;
    exitStrategy: string;
    /** Precomputed on the netTdc basis by fetchProjectData. */
    sensitivityScenarios: SensitivityScenario[];
  };
}

export const FeasibilitySection = ({ feasibility, metrics }: FeasibilitySectionProps) => {
  const rental = feasibility.rentalExit || {};
  const decision = feasibility.decision || {};

  const {
    tdc, arv, salesCostsPct, salesCosts, netSaleProceeds, netProfit, roi, profitMargin,
    allInBasis, seventyMaxPurchase: seventyMax, purchasePrice, totalEquity: equity,
    grossRent, egi, opex, noi, annualDebtService: annualDS, cashFlow, capRate, cashOnCash, dscr,
    exitStrategy: strategy, sensitivityScenarios: scenarios,
  } = metrics;

  const includesSale = strategy === "sell" || strategy === "rent-then-sell";
  const includesRental = strategy === "rent" || strategy === "rent-then-sell";


  const EXIT_LABELS: Record<string, string> = { sell: "Sell", rent: "Rent", "rent-then-sell": "Rent → Sell" };

  const getScenarioColor = (ret: number) => (ret >= 20 ? colors.green : ret >= 0 ? colors.gold : colors.red);

  return (
    <View>
      <Text style={styles.sectionTitle}>Feasibility Analysis</Text>

      <View style={[styles.row, { marginBottom: 12 }]}>
        <Text style={styles.label}>Exit Strategy</Text>
        <Text style={styles.value}>{EXIT_LABELS[strategy] || strategy}</Text>
      </View>

      {/* Key Returns Highlight */}
      {!!includesSale && arv > 0 && (
        <View style={styles.keyReturnsRow}>
          {[
            { label: "ROI", value: formatPercent(roi), pass: roi >= 15 },
            { label: "Profit Margin", value: formatPercent(profitMargin), pass: profitMargin >= 10 },
            { label: "All-in Basis", value: formatPercent(allInBasis), pass: allInBasis <= 85 },
          ].map((m, i) => (
            <View key={i} style={[styles.keyReturnBox, { backgroundColor: m.pass ? colors.lightGreen : colors.lightAmber }]}>
              <Text style={[styles.keyReturnValue, { color: m.pass ? colors.green : colors.gold }]}>{m.value}</Text>
              <Text style={styles.keyReturnLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sale Exit */}
      {!!includesSale && arv > 0 && (
        <View>
          <Text style={styles.subTitle}>Sale Exit Analysis</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Metric</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
            </View>
            {[
              { label: "After Repair Value (ARV)", value: formatCurrency(arv) },
              { label: `Sales Costs (${salesCostsPct}%)`, value: formatCurrency(salesCosts) },
              { label: "Net Sale Proceeds", value: formatCurrency(netSaleProceeds) },
              { label: "Total Development Cost", value: formatCurrency(tdc) },
              { label: "Net Profit", value: formatCurrency(netProfit) },
              { label: "ROI (on Equity)", value: formatPercent(roi) },
              { label: "Profit Margin", value: formatPercent(profitMargin) },
              { label: "All-in Basis", value: formatPercent(allInBasis) },
            ].map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{row.label}</Text>
                <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subTitle}>Rule of Thumb Checks</Text>
          <View style={[styles.row, { marginBottom: 6 }]}>
            <Text style={styles.tableCell}>85% Rule (All-in Basis ≤ 85%)</Text>
            <Text style={allInBasisRule(arv, allInBasis) === "fail" ? styles.failText : styles.passText}>
              {ruleCheckLabel(allInBasisRule(arv, allInBasis))}{arv > 0 ? ` (${formatPercent(allInBasis)})` : ""}
            </Text>
          </View>
          <View style={[styles.row, { marginBottom: 12 }]}>
            <Text style={styles.tableCell}>70% Rule (Purchase ≤ {formatCurrency(seventyMax)})</Text>
            <Text style={seventyRule(arv, purchasePrice, seventyMax) === "fail" ? styles.failText : styles.passText}>
              {ruleCheckLabel(seventyRule(arv, purchasePrice, seventyMax))}
            </Text>
          </View>
        </View>
      )}

      {/* Rental Exit */}
      {!!includesRental && (rental.monthlyRentPerUnit || 0) > 0 && (
        <View>
          <Text style={styles.subTitle}>Rental Exit Analysis</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Metric</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
            </View>
            {[
              { label: "Gross Annual Rent", value: formatCurrency(grossRent) },
              { label: "Effective Gross Income", value: formatCurrency(egi) },
              { label: "Operating Expenses", value: formatCurrency(opex) },
              { label: "Net Operating Income (NOI)", value: formatCurrency(noi) },
              { label: "Annual Debt Service", value: formatCurrency(annualDS) },
              { label: "Cash Flow Before Taxes", value: formatCurrency(cashFlow) },
              { label: "Cap Rate", value: formatPercent(capRate) },
              { label: "Cash-on-Cash Return", value: formatPercent(cashOnCash) },
              { label: "DSCR", value: dscr.toFixed(2) },
            ].map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{row.label}</Text>
                <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sensitivity table with visual indicators */}
      {!!includesSale && arv > 0 && (
        <View>
          <Text style={styles.subTitle}>Sensitivity Analysis</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Scenario</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>ARV</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Profit</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Return</Text>
            </View>
            {scenarios.map((s, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getScenarioColor(s.return) }} />
                  <Text style={styles.tableCell}>{s.label}</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrency(s.arv)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right", color: s.profit >= 0 ? colors.green : colors.red }]}>{formatCurrency(s.profit)}</Text>
                <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right", color: getScenarioColor(s.return) }]}>{formatPercent(s.return)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Decision with visual badge */}
      {!!decision.decision && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subTitle}>Go/No-Go Decision</Text>
          <View style={[styles.decisionBadge, {
            backgroundColor: decision.decision === "go" ? colors.green : decision.decision === "no-go" ? colors.red : colors.gold,
          }]}>
            <Text style={styles.decisionText}>
              {decision.decision === "go" ? "GO" : decision.decision === "no-go" ? "NO-GO" : "CONDITIONAL"}
            </Text>
          </View>
          {!!decision.rationale && (
            <View style={styles.rationaleBox}>
              <Text style={styles.bodyText}>{decision.rationale}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
