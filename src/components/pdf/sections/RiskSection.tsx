import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";

interface RiskSectionProps {
  riskAssessment: Record<string, any>;
}

const getLikelihoodColor = (l: string) =>
  l === "High" ? colors.red : l === "Medium" ? colors.gold : colors.green;

export const RiskSection = ({ riskAssessment }: RiskSectionProps) => {
  const risks: any[] = riskAssessment.risks || [];

  const insuranceFields = [
    { label: "Builder's Risk Insurance", key: "buildersRiskInsurance", fallback: "buildersRisk" },
    { label: "General Liability Insurance", key: "generalLiabilityInsurance", fallback: "generalLiability" },
    { label: "Title Insurance", key: "titleInsurance", fallback: "titleInsurance" },
    { label: "Property Insurance", key: "propertyInsurance", fallback: "propertyInsurance" },
  ];

  const getStatusColor = (s: string) =>
    s === "Obtained" ? colors.green : s === "Pending" ? colors.gold : colors.red;

  return (
    <View>
      <Text style={styles.sectionTitle}>Risk Assessment</Text>

      {/* Risk Register */}
      {risks.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Risk Register</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Category</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>Likelihood</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>Impact</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: "center" }]}>Status</Text>
            </View>
            {risks.map((r: any, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}, { minHeight: 28 }]}>
                <Text style={[styles.tableCellBold, { flex: 1 }]}>{r.category || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{r.description || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 0.7, textAlign: "center", color: getLikelihoodColor(r.likelihood) }]}>
                  {r.likelihood || "—"}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.7, textAlign: "center", color: getLikelihoodColor(r.impact) }]}>
                  {r.impact || "—"}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.7, textAlign: "center" }]}>{r.status || "—"}</Text>
              </View>
            ))}
          </View>

          {/* Mitigation Strategies */}
          {risks.some((r: any) => r.mitigationStrategy) && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.subTitle}>Mitigation Strategies</Text>
              {risks.filter((r: any) => r.mitigationStrategy).map((r: any, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <View style={[styles.bullet, { backgroundColor: getLikelihoodColor(r.likelihood) }]} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{r.category}: </Text>
                    {r.mitigationStrategy}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Insurance & Compliance */}
      <Text style={styles.subTitle}>Insurance & Compliance</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Insurance Type</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Status</Text>
        </View>
        {insuranceFields.map((f, i) => {
          const status = riskAssessment[f.key] || riskAssessment[f.fallback] || "Not Yet";
          return (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{f.label}</Text>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right", color: getStatusColor(status) }]}>
                {status}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Permit Status */}
      <View style={{ flexDirection: "row", marginTop: 8, marginBottom: 8 }}>
        <Text style={styles.label}>Permit Status: </Text>
        <Text style={[styles.value, {
          color: riskAssessment.permitStatus === "All Obtained" ? colors.green
            : riskAssessment.permitStatus === "In Progress" ? colors.gold : colors.red,
        }]}>
          {riskAssessment.permitStatus || "Not Started"}
        </Text>
      </View>

      {/* Compliance Notes */}
      {!!riskAssessment.complianceNotes && (
        <View>
          <Text style={styles.subTitle}>Code Compliance Notes</Text>
          <Text style={styles.bodyText}>{riskAssessment.complianceNotes}</Text>
        </View>
      )}
    </View>
  );
};
