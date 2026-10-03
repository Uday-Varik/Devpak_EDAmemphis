import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";

interface ResilienceSectionProps {
  resilience: Record<string, any>;
}

import {
  FINANCIAL_FACTORS,
  PROJECT_FACTORS,
  MARKET_FACTORS,
  computeResilience,
  normalizeResilience,
} from "@/utils/resilience";


const CheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
  <View style={{ flexDirection: "row", marginBottom: 2, paddingVertical: 1 }}>
    <Text style={{
      width: 14,
      fontSize: 9,
      color: checked ? colors.green : colors.light,
      fontFamily: "Helvetica-Bold",
    }}>
      {checked ? "✓" : "—"}
    </Text>
    <Text style={{ fontSize: 8, color: checked ? colors.body : colors.light }}>{label}</Text>
  </View>
);

export const ResilienceSection = ({ resilience }: ResilienceSectionProps) => {
  const scores = computeResilience(resilience);
  const flags = normalizeResilience(resilience);
  const financialScore = scores.financial;
  const projectScore = scores.project;
  const marketScore = scores.market;
  const total = scores.total;
  const totalPossible = scores.totalPossible;
  const percentage = scores.percent;

  const ratingLabel = scores.label;
  const ratingColor = percentage >= 70 ? colors.green : percentage >= 40 ? colors.gold : colors.red;

  return (
    <View>
      <Text style={styles.sectionTitle}>Resilience Factors</Text>

      {/* Score Summary - compact single row */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
        <View style={[styles.keyReturnBox, { flex: 1, padding: 8, backgroundColor: percentage >= 70 ? colors.lightGreen : percentage >= 40 ? colors.lightAmber : "#FEE2E2" }]}>
          <Text style={[styles.keyReturnValue, { fontSize: 18, color: ratingColor }]}>{percentage}%</Text>
          <Text style={[styles.keyReturnLabel, { fontSize: 8 }]}>Overall Score</Text>
        </View>
        <View style={[styles.keyReturnBox, { flex: 1, padding: 8, backgroundColor: colors.tableAlt }]}>
          <Text style={[styles.keyReturnValue, { fontSize: 18, color: ratingColor }]}>{total}/{totalPossible}</Text>
          <Text style={[styles.keyReturnLabel, { fontSize: 8 }]}>Factors Checked</Text>
        </View>
        <View style={[styles.keyReturnBox, { flex: 1, padding: 8, backgroundColor: colors.tableAlt }]}>
          <Text style={[styles.keyReturnValue, { fontSize: 14, color: ratingColor }]}>{ratingLabel}</Text>
          <Text style={[styles.keyReturnLabel, { fontSize: 8 }]}>Rating</Text>
        </View>
        <View style={[styles.keyReturnBox, { flex: 1, padding: 8, backgroundColor: colors.tableAlt }]}>
          <Text style={{ fontSize: 8, color: colors.body, textAlign: "center" }}>Fin {financialScore}/7 · Proj {projectScore}/7 · Mkt {marketScore}/6</Text>
          <Text style={[styles.keyReturnLabel, { fontSize: 8 }]}>Breakdown</Text>
        </View>
      </View>

      {/* Three columns of checklists */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subTitle, { fontSize: 9, marginBottom: 4 }]}>Financial ({financialScore}/7)</Text>
          {FINANCIAL_FACTORS.map((f, i) => (
            <CheckItem key={i} checked={flags[f.key] === true} label={f.label} />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subTitle, { fontSize: 9, marginBottom: 4 }]}>Project ({projectScore}/7)</Text>
          {PROJECT_FACTORS.map((f, i) => (
            <CheckItem key={i} checked={flags[f.key] === true} label={f.label} />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subTitle, { fontSize: 9, marginBottom: 4 }]}>Market ({marketScore}/6)</Text>
          {MARKET_FACTORS.map((f, i) => (
            <CheckItem key={i} checked={flags[f.key] === true} label={f.label} />
          ))}
        </View>
      </View>

      {/* Additional Strengths */}
      {!!resilience.additionalStrengths && (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.subTitle, { fontSize: 9 }]}>Additional Strengths</Text>
          <Text style={{ fontSize: 8, color: colors.body }}>{resilience.additionalStrengths}</Text>
        </View>
      )}
    </View>
  );
};
