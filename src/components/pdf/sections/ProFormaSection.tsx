import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency } from "../pdfUtils";
import { computeBudgetTotals } from "@/utils/calculations";

type BudgetTotals = Omit<import("@/utils/calculations").BudgetTotals, "purchasePrice">;

interface ProFormaSectionProps {
  budget: Record<string, any>;
  sqftPlanned: number;
  /** Pre-computed totals from fetchProjectData — the single source of truth. */
  totals?: BudgetTotals;
}


const PhaseTable = ({
  title, items, contingencyPct, contingencyAmt, total, sqft,
}: {
  title: string;
  items: { label: string; value: number; note?: string }[];
  contingencyPct: number;
  contingencyAmt: number;
  total: number;
  sqft: number;
}) => {
  const visible = items.filter((i) => i.value > 0);
  if (visible.length === 0 && contingencyPct === 0) return null;
  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <Text style={styles.subTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2.4 }]}>Line Item</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Amount</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: "right" }]}>$/SF</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Notes</Text>
        </View>
        {visible.map((item, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 2.4 }]}>{item.label}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrency(item.value)}</Text>
            <Text style={[styles.tableCell, { flex: 0.7, textAlign: "right" }]}>{sqft > 0 ? `$${(item.value / sqft).toFixed(0)}` : "—"}</Text>
            <Text style={[styles.tableCell, { flex: 1.2, color: colors.muted, fontSize: 8 }]}>{item.note || ""}</Text>
          </View>
        ))}
        {contingencyPct > 0 && (
          <View style={[styles.tableRow, { backgroundColor: "#FEF9C3" }]}>
            <Text style={[styles.tableCell, { flex: 2.4, fontStyle: "italic" }]}>Contingency</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right", fontStyle: "italic" }]}>{formatCurrency(contingencyAmt)}</Text>
            <Text style={[styles.tableCell, { flex: 0.7, textAlign: "right", fontStyle: "italic" }]}>{sqft > 0 ? `$${(contingencyAmt / sqft).toFixed(0)}` : "—"}</Text>
            <Text style={[styles.tableCell, { flex: 1.2, fontStyle: "italic", color: colors.muted, fontSize: 8 }]}>{contingencyPct}% buffer</Text>
          </View>
        )}
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableTotalText, { flex: 2.4 }]}>Phase Subtotal</Text>
          <Text style={[styles.tableTotalText, { flex: 1, textAlign: "right" }]}>{formatCurrency(total)}</Text>
          <Text style={[styles.tableTotalText, { flex: 0.7, textAlign: "right" }]}>{sqft > 0 ? `$${(total / sqft).toFixed(0)}` : "—"}</Text>
          <Text style={[styles.tableTotalText, { flex: 1.2 }]}></Text>
        </View>
      </View>
    </View>
  );
};

export const ProFormaSection = ({ budget, sqftPlanned, totals }: ProFormaSectionProps) => {
  const acq = budget.acquisition || {};
  const hard = budget.hardCosts || {};
  const soft = budget.softCosts || {};
  const holding = budget.holdingCosts || {};
  const operatingReserves = budget.operatingReserves || 0;

  // Totals come from fetchProjectData; direct callers fall back to the same shared engine.
  const t: BudgetTotals = totals ?? computeBudgetTotals(budget, { sqftPlanned });
  const acqContPct = t.acqContPct;
  const acqContAmt = t.acqContingency;
  const acqTotal = t.acqTotal;
  const hardContPct = t.hardContPct;
  const hardContAmt = t.hardContingency;
  const hardTotal = t.hardTotal;
  const softContPct = t.softContPct;
  const softContAmt = t.softContingency;
  const softTotal = t.softTotal;
  const holdingContPct = t.holdingContPct;
  const holdingContAmt = t.holdingContingency;
  const holdingTotal = t.holdingTotal;
  const tdc = t.tdc;

  return (
    <View>
      <Text style={styles.sectionTitle}>Development Pro Forma</Text>
      {sqftPlanned > 0 && (
        <Text style={[styles.label, { marginBottom: 8 }]}>
          Planned square footage: {sqftPlanned.toLocaleString()} sq ft (used for $/SF calculations)
        </Text>
      )}

      <PhaseTable
        title="Acquisition"
        sqft={sqftPlanned}
        items={[
          { label: "Purchase Price / Land Value", value: acq.purchasePrice || 0 },
          // Omitted when the engine excludes them (new construction on owned land).
          ...(t.acqBase === (acq.purchasePrice || 0) ? [] : [
            { label: "Closing Costs", value: acq.closingCosts || 0 },
            { label: "Title & Recording", value: acq.titleRecording || 0 },
          ]),
        ]}
        contingencyPct={acqContPct}
        contingencyAmt={acqContAmt}
        total={acqTotal}
      />

      <PhaseTable
        title="Pre-Development Costs"
        sqft={sqftPlanned}
        items={[
          { label: "Architecture/Engineering", value: soft.architectureEngineering || 0 },
          { label: "Permits & Fees", value: soft.permitsFees || 0 },
          { label: "Legal & Accounting", value: soft.legalAccounting || 0 },
          { label: "Insurance", value: soft.insurance || 0 },
          { label: "Property Taxes", value: soft.propertyTaxes || 0 },
          { label: "Loan Interest/Points", value: soft.loanInterestPoints || 0 },
          { label: "Marketing/Leasing", value: soft.marketingLeasing || 0 },
          { label: "Other Pre-Development", value: soft.otherSoft || 0 },
          ...((soft.customItems || []) as any[]).filter((c) => c.amount > 0).map((c) => ({ label: c.label || "Custom Item", value: c.amount })),
        ]}
        contingencyPct={softContPct}
        contingencyAmt={softContAmt}
        total={softTotal}
      />

      <PhaseTable
        title="Construction Hard Costs"
        sqft={sqftPlanned}
        items={hard.usePerSqftEstimate ? [
          {
            label: `Construction (${sqftPlanned.toLocaleString()} SF @ $${Number(hard.costPerSqft) || 0}/SF)`,
            value: t.hardBase,
          },
        ] : [
          { label: "Foundation/Structural", value: hard.foundation || 0 },
          { label: "Roofing", value: hard.roofing || 0 },
          { label: "HVAC", value: hard.hvac || 0 },
          { label: "Electrical", value: hard.electrical || 0 },
          { label: "Plumbing", value: hard.plumbing || 0 },
          { label: "Interior Finishes", value: hard.interiorFinishes || 0 },
          { label: "Exterior/Landscaping", value: hard.exteriorLandscaping || 0 },
          { label: "Other Construction", value: hard.otherHard || 0 },
          ...((hard.customItems || []) as any[]).filter((c) => c.amount > 0).map((c) => ({ label: c.label || "Custom Item", value: c.amount })),
        ]}
        contingencyPct={hardContPct}
        contingencyAmt={hardContAmt}
        total={hardTotal}
      />

      <PhaseTable
        title="Holding Costs"
        sqft={sqftPlanned}
        items={[
          { label: "Property Taxes (Construction)", value: holding.propertyTaxes || 0 },
          { label: "Insurance (Construction)", value: holding.insurance || 0 },
          { label: "Loan Payments (Construction)", value: holding.loanPayments || 0 },
          { label: "Utilities (Construction)", value: holding.utilities || 0 },
          { label: "Other Holding", value: holding.otherHolding || 0 },
          ...((holding.customItems || []) as any[]).filter((c) => c.amount > 0).map((c) => ({ label: c.label || "Custom Item", value: c.amount })),
        ]}
        contingencyPct={holdingContPct}
        contingencyAmt={holdingContAmt}
        total={holdingTotal}
      />

      {operatingReserves > 0 && (
        <View style={{ marginBottom: 14 }} wrap={false}>
          <Text style={styles.subTitle}>Operating Reserves</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2.4 }]}>Line Item</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Amount</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.7, textAlign: "right" }]}>$/SF</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Notes</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2.4 }]}>Operating Reserves</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrency(operatingReserves)}</Text>
              <Text style={[styles.tableCell, { flex: 0.7, textAlign: "right" }]}>{sqftPlanned > 0 ? `$${(operatingReserves / sqftPlanned).toFixed(0)}` : "—"}</Text>
              <Text style={[styles.tableCell, { flex: 1.2, color: colors.muted, fontSize: 8 }]}>Lease-up / cash buffer</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.highlightBox}>
        <Text style={styles.highlightTitle}>Total Development Cost</Text>
        <Text style={styles.highlightValue}>{formatCurrency(tdc)}</Text>
        {sqftPlanned > 0 && (
          <Text style={[styles.value, { color: colors.muted, marginTop: 4 }]}>
            ${(tdc / sqftPlanned).toFixed(0)}/SF total
          </Text>
        )}
      </View>
    </View>
  );
};
