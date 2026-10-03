import { composeAddress } from "@/utils/address";
import { View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency } from "../pdfUtils";

interface SiteLocationSectionProps {
  siteLocation: Record<string, any>;
}

export const SiteLocationSection = ({ siteLocation }: SiteLocationSectionProps) => {
  const address = composeAddress(
    siteLocation.streetAddress,
    siteLocation.city,
    siteLocation.state,
    siteLocation.zipCode
  );

  const subsidies: any[] = siteLocation.subsidyPrograms || [];
  const totalSubsidy = subsidies.reduce((s: number, p: any) => s + (p.estimatedValue || 0), 0);
  const envConcerns: string[] = siteLocation.environmentalConcerns || [];
  const utilities: string[] = siteLocation.utilitiesAvailable || siteLocation.utilities || [];
  const photos: any[] = siteLocation.photos || [];

  return (
    <View>
      <Text style={styles.sectionTitle}>Site & Location</Text>

      {/* Address */}
      {!!address && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Property Address</Text>
          <Text style={[styles.value, { fontSize: 12 }]}>{address}</Text>
        </View>
      )}

      {/* Lot Details */}
      <Text style={styles.subTitle}>Lot & Site Details</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Detail</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
        </View>
        {[
          { label: "Lot Size", value: siteLocation.lotSize ? `${siteLocation.lotSize.toLocaleString()} ${siteLocation.lotSizeUnit || "sqft"}` : "—" },
          { label: "Lot Dimensions", value: siteLocation.lotDimensions || "—" },
          { label: "Topography", value: siteLocation.topography || "—" },
          { label: "Current Condition", value: siteLocation.currentCondition || "—" },
          { label: "Flood Zone", value: siteLocation.floodZone || "—" },
        ].map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.label}</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Site Photos */}
      {photos.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subTitle}>Site Photos</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {photos.map((photo: any, i: number) => (
              <View key={i} style={{ width: "48%", marginBottom: 8 }}>
                <Image
                  src={photo.url}
                  style={{ width: "100%", height: 140, objectFit: "cover" as any, borderRadius: 4 }}
                />
                {!!photo.caption && (
                  <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>{photo.caption}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Zoning */}
      <Text style={styles.subTitle}>Zoning & Entitlements</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Detail</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
        </View>
        {[
          { label: "Current Zoning", value: siteLocation.currentZoning || siteLocation.zoningClassification || "—" },
          { label: "Zoning Description", value: siteLocation.zoningDescription || "—" },
          { label: "Permitted Use", value: siteLocation.permittedUse || "—" },
          { label: "Max Density", value: siteLocation.maxDensity || "—" },
          { label: "Setbacks", value: siteLocation.setbackRequirements || siteLocation.setbacks || "—" },
          { label: "Height Limit", value: siteLocation.heightLimit ? `${siteLocation.heightLimit} ft` : "—" },
          { label: "Parking Required", value: siteLocation.parkingRequirements || siteLocation.parkingRequired || "—" },
          { label: "Entitlement Status", value: siteLocation.entitlementStatus || "—" },
        ].map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.label}</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Environmental */}
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.subTitle}>Environmental Concerns</Text>
        {envConcerns.length > 0 ? (
          envConcerns.map((c, i) => (
            <View key={i} style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: colors.red }]} />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.bodyText, { color: colors.green }]}>None identified</Text>
        )}
      </View>

      {/* Utilities */}
      {utilities.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Utilities Available</Text>
          <Text style={styles.bodyText}>{utilities.join(", ")}</Text>
        </View>
      )}

      {/* Subsidies */}
      {subsidies.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Subsidies & Incentives</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Program</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Type</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: "right" }]}>Status</Text>
            </View>
            {subsidies.map((s: any, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{s.name || s.programName || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{s.type || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{s.estimatedValue ? formatCurrency(s.estimatedValue) : "—"}</Text>
                <Text style={[styles.tableCell, { flex: 0.8, textAlign: "right" }]}>{s.status || "—"}</Text>
              </View>
            ))}
            <View style={styles.tableTotalRow}>
              <Text style={[styles.tableTotalText, { flex: 2 }]}>Total Incentives</Text>
              <Text style={[styles.tableTotalText, { flex: 1 }]}></Text>
              <Text style={[styles.tableTotalText, { flex: 1, textAlign: "right" }]}>{formatCurrency(totalSubsidy)}</Text>
              <Text style={[styles.tableTotalText, { flex: 0.8 }]}></Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
