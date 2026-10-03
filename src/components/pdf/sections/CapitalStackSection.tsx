import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency } from "../pdfUtils";

interface CapitalStackSectionProps {
  budget: Record<string, any>;
  tdc: number;
  cashEquity: number;
  landEquity: number;
  bankLoan: number;
  privateLender: number;
  grants: number;
  totalSources: number;
  fundingGap: number;
  packagePurpose?: string;
}

export const CapitalStackSection = ({
  budget, tdc, cashEquity, landEquity, bankLoan, privateLender, grants, totalSources, fundingGap, packagePurpose,
}: CapitalStackSectionProps) => {
  const cap = budget.capitalStack || {};
  const isLoanRequest = packagePurpose === "loan-request";
  const askLabel = isLoanRequest ? "  ◄ THE ASK" : "";

  const sources: { label: string; value: number; terms?: string; status?: string; isAsk?: boolean }[] = [];
  if (landEquity > 0) sources.push({ label: "Land Equity (Non-Cash)", value: landEquity, terms: "Existing property contribution", status: "Committed" });
  if (cashEquity > 0) sources.push({ label: "Developer Equity (Cash)", value: cashEquity, terms: "Sponsor cash injection", status: "Committed" });
  if (bankLoan > 0) {
    const terms = [
      cap.bankLoanRate ? `${cap.bankLoanRate}% rate` : null,
      cap.bankLoanTerm ? `${cap.bankLoanTerm}-mo term` : null,
    ].filter(Boolean).join(", ") || "Construction loan";
    sources.push({ label: "Bank / Construction Loan", value: bankLoan, terms, status: cap.bankLoanStatus || "Pending", isAsk: isLoanRequest });
  }
  if (privateLender > 0) {
    const terms = [
      cap.privateLenderRate ? `${cap.privateLenderRate}% rate` : null,
      cap.privateLenderTerm ? `${cap.privateLenderTerm}-mo term` : null,
    ].filter(Boolean).join(", ") || "Private debt";
    sources.push({ label: "Private Lender", value: privateLender, terms, status: cap.privateLenderStatus || "Pending" });
  }
  if (cap.grant1Name && cap.grant1Amount > 0) sources.push({ label: cap.grant1Name, value: cap.grant1Amount, terms: "Grant program", status: cap.grant1Status || "Applied" });
  if (cap.grant2Name && cap.grant2Amount > 0) sources.push({ label: cap.grant2Name, value: cap.grant2Amount, terms: "Grant program", status: cap.grant2Status || "Applied" });
  if (cap.grant3Name && cap.grant3Amount > 0) sources.push({ label: cap.grant3Name, value: cap.grant3Amount, terms: "Grant program", status: cap.grant3Status || "Applied" });
  if ((cap.otherSources || 0) > 0) sources.push({ label: "Other Sources", value: cap.otherSources, terms: cap.otherSourcesNotes || "—", status: "—" });

  return (
    <View>
      <Text style={styles.sectionTitle}>Capital Stack / Sources of Funds</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Source</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Amount</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.6, textAlign: "right" }]}>% TDC</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.4 }]}>Terms</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.9, textAlign: "right" }]}>Status</Text>
        </View>
        {sources.map((s, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}, s.isAsk ? { backgroundColor: "#FFF8E1" } : {}]}>
            <Text style={[styles.tableCell, { flex: 2, fontFamily: s.isAsk ? "Helvetica-Bold" : "Helvetica" }]}>
              {s.label}{s.isAsk ? askLabel : ""}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrency(s.value)}</Text>
            <Text style={[styles.tableCell, { flex: 0.6, textAlign: "right" }]}>{tdc > 0 ? `${((s.value / tdc) * 100).toFixed(0)}%` : "—"}</Text>
            <Text style={[styles.tableCell, { flex: 1.4, fontSize: 8, color: colors.muted }]}>{s.terms}</Text>
            <Text style={[styles.tableCell, { flex: 0.9, textAlign: "right", fontSize: 8 }]}>{s.status}</Text>
          </View>
        ))}
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableTotalText, { flex: 2 }]}>Total Sources</Text>
          <Text style={[styles.tableTotalText, { flex: 1, textAlign: "right" }]}>{formatCurrency(totalSources)}</Text>
          <Text style={[styles.tableTotalText, { flex: 0.6, textAlign: "right" }]}>{tdc > 0 ? `${((totalSources / tdc) * 100).toFixed(0)}%` : "—"}</Text>
          <Text style={[styles.tableTotalText, { flex: 1.4 }]}></Text>
          <Text style={[styles.tableTotalText, { flex: 0.9 }]}></Text>
        </View>
      </View>

      <View style={[styles.highlightBox, { backgroundColor: fundingGap > 0 ? "#FEF2F2" : colors.lightGreen, borderColor: fundingGap > 0 ? colors.red : colors.green }]}>
        <Text style={[styles.highlightTitle, { color: fundingGap > 0 ? colors.red : colors.green }]}>
          {fundingGap > 0 ? "Funding Gap" : "Fully Funded"}
        </Text>
        <Text style={[styles.highlightValue, { color: fundingGap > 0 ? colors.red : colors.green }]}>
          {fundingGap > 0 ? formatCurrency(fundingGap) : "✓"}
        </Text>
        <Text style={[styles.value, { color: colors.muted, marginTop: 4 }]}>
          Total Uses: {formatCurrency(tdc)} • Total Sources: {formatCurrency(totalSources)}
        </Text>
      </View>
    </View>
  );
};
