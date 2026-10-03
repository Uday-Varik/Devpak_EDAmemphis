import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency } from "../pdfUtils";

interface ComparablesSectionProps {
  feasibility: Record<string, any>;
  scope: Record<string, any>;
}

export const ComparablesSection = ({ feasibility, scope }: ComparablesSectionProps) => {
  const comps = feasibility.comparables || {};

  // Map flat field names (comp1Address, comp1Price, comp1SqFt) to objects
  const compList = [1, 2, 3].map(i => ({
    address: comps[`comp${i}Address`] || "",
    salePrice: comps[`comp${i}Price`] || 0,
    sqft: comps[`comp${i}SqFt`] || 0,
  })).filter(c => c.address && c.salePrice);

  if (compList.length === 0) return null;

  const avgPricePerSqFt =
    compList.filter(c => c.sqft > 0).length > 0
      ? compList.filter(c => c.sqft > 0).reduce((s, c) => s + c.salePrice / c.sqft, 0) / compList.filter(c => c.sqft > 0).length
      : 0;

  const plannedSqFt = scope.sqftPlanned || 0;
  const projectedPricePerSqFt = plannedSqFt > 0 && feasibility.saleExit?.arv > 0
    ? feasibility.saleExit.arv / plannedSqFt
    : 0;

  return (
    <View>
      <Text style={styles.sectionTitle}>Comparable Sales Analysis</Text>

      <Text style={styles.bodyText}>
        The following comparable sales were identified to support the After Repair Value (ARV) estimate for this project.
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 3 }]}>Address</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Sale Price</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Sq Ft</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>$/Sq Ft</Text>
        </View>
        {compList.map((comp, i) => {
          const ppsf = comp.sqft > 0 ? comp.salePrice / comp.sqft : 0;
          return (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { flex: 3 }]}>{comp.address}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrency(comp.salePrice)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{comp.sqft ? Number(comp.sqft).toLocaleString() : "—"}</Text>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{ppsf > 0 ? formatCurrency(Math.round(ppsf)) : "—"}</Text>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.highlightBox}>
        {avgPricePerSqFt > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.highlightTitle}>Average $/Sq Ft</Text>
            <Text style={[styles.highlightValue, { fontSize: 16 }]}>{formatCurrency(Math.round(avgPricePerSqFt))}</Text>
          </View>
        )}
        {projectedPricePerSqFt > 0 && (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.highlightTitle}>Your Projected $/Sq Ft</Text>
            <Text style={[styles.highlightValue, { fontSize: 16 }]}>{formatCurrency(Math.round(projectedPricePerSqFt))}</Text>
          </View>
        )}
        {avgPricePerSqFt > 0 && projectedPricePerSqFt > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={[styles.label, { fontSize: 9 }]}>
              Variance: {((projectedPricePerSqFt / avgPricePerSqFt - 1) * 100).toFixed(1)}% {projectedPricePerSqFt >= avgPricePerSqFt ? "above" : "below"} comps average
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
