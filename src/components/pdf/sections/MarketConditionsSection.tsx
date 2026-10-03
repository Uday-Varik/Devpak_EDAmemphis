import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency } from "../pdfUtils";

interface MarketConditionsSectionProps {
  visionMarket: Record<string, any>;
}

export const MarketConditionsSection = ({ visionMarket }: MarketConditionsSectionProps) => {
  const comps = visionMarket.comparables || [];
  const avgPSF = comps.length > 0
    ? comps.reduce((s: number, c: any) => {
        const sf = c.sqft || c.squareFootage || 0;
        return s + (sf > 0 ? (c.salePrice || 0) / sf : 0);
      }, 0) / comps.length
    : 0;

  return (
    <View>
      <Text style={styles.sectionTitle}>Market Conditions</Text>

      {!!visionMarket.neighborhoodName && (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Metric</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
          </View>
          {[
            { label: "Neighborhood", value: (visionMarket.neighborhoodName || "").replace(/^Neighborhood:\s*/i, "") },
            { label: "Population Trend", value: visionMarket.populationTrend || "—" },
            { label: "Median Household Income", value: visionMarket.medianHouseholdIncome ? formatCurrency(visionMarket.medianHouseholdIncome) : "—" },
            { label: "Median Home Price", value: visionMarket.medianHomePrice ? formatCurrency(visionMarket.medianHomePrice) : "—" },
            { label: "Average Rent", value: visionMarket.averageRent ? `${formatCurrency(visionMarket.averageRent)}/mo` : "—" },
            { label: "Vacancy Rate", value: visionMarket.vacancyRate ? `${visionMarket.vacancyRate}%` : "—" },
            { label: "Market Trend", value: visionMarket.marketTrend || "—" },
          ].map((row, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { flex: 1 }]}>{row.label}</Text>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}

      {(() => {
        const tm = Array.isArray(visionMarket.targetMarket) ? visionMarket.targetMarket.filter(Boolean).join(" / ") : (visionMarket.targetMarket || "");
        const til = Array.isArray(visionMarket.targetIncomeLevel) ? visionMarket.targetIncomeLevel.filter(Boolean).join(" / ") : (visionMarket.targetIncomeLevel || "");
        if (!tm && !til && !visionMarket.communityImpact) return null;
        return (
          <View style={{ marginTop: 4 }}>
            {(tm || til) && (
              <View style={{ flexDirection: "row", gap: 20, marginBottom: 10 }}>
                {!!tm && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Target Market</Text>
                    <Text style={styles.value}>{tm}</Text>
                  </View>
                )}
                {!!til && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Target Income Level</Text>
                    <Text style={styles.value}>{til}</Text>
                  </View>
                )}
              </View>
            )}
            {!!visionMarket.communityImpact && (
              <View>
                <Text style={styles.subTitle}>Community Impact</Text>
                <Text style={styles.bodyText}>{visionMarket.communityImpact}</Text>
              </View>
            )}
          </View>
        );
      })()}

      {comps.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Comparable Properties</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Address</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Price</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6, textAlign: "right" }]}>Sq Ft</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6, textAlign: "right" }]}>$/SF</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: "right" }]}>Bd/Ba</Text>
            </View>
            {comps.map((c: any, i: number) => {
              const sf = c.sqft || c.squareFootage || 0;
              const psf = sf > 0 ? (c.salePrice || 0) / sf : 0;
              return (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{c.address || "—"}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{c.salePrice ? formatCurrency(c.salePrice) : "—"}</Text>
                  <Text style={[styles.tableCell, { flex: 0.6, textAlign: "right" }]}>{sf ? Number(sf).toLocaleString() : "—"}</Text>
                  <Text style={[styles.tableCell, { flex: 0.6, textAlign: "right" }]}>{psf > 0 ? `$${Math.round(psf)}` : "—"}</Text>
                  <Text style={[styles.tableCell, { flex: 0.5, textAlign: "right" }]}>{c.bedrooms || "—"}/{c.bathrooms || "—"}</Text>
                </View>
              );
            })}
          </View>
          {avgPSF > 0 && (
            <View style={[styles.highlightBox, { padding: 10 }]}>
              <Text style={styles.highlightTitle}>Average Price per Sq Ft</Text>
              <Text style={[styles.highlightValue, { fontSize: 16 }]}>${Math.round(avgPSF)}/SF</Text>
            </View>
          )}
        </View>
      )}

      {(visionMarket.daysOnMarketEstimate || visionMarket.daysOnMarket || visionMarket.projectedSalePriceOrRent || visionMarket.projectedPrice) && (
        <View>
          <Text style={styles.subTitle}>Disposition / Exit Strategy Support</Text>
          {(visionMarket.projectedSalePriceOrRent || visionMarket.projectedPrice) && (
            <View style={styles.row}>
              <Text style={styles.label}>Projected Price/Rent</Text>
              <Text style={styles.value}>{formatCurrency(visionMarket.projectedSalePriceOrRent || visionMarket.projectedPrice)}</Text>
            </View>
          )}
          {(visionMarket.daysOnMarketEstimate || visionMarket.daysOnMarket) && (
            <View style={styles.row}>
              <Text style={styles.label}>Estimated Days on Market</Text>
              <Text style={styles.value}>{visionMarket.daysOnMarketEstimate || visionMarket.daysOnMarket} days</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
