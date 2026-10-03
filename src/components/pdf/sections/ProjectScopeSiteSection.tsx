import { View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency } from "../pdfUtils";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  "new-construction": "New Construction",
  "renovation-rehab": "Renovation/Rehab",
  "acquisition-rehab": "Acquisition + Rehab",
  "gut-renovation": "Renovation/Rehab",
  "light-renovation": "Renovation/Rehab",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  "single-family": "Single Family",
  duplex: "Duplex",
  triplex: "Triplex",
  fourplex: "Fourplex",
};

interface Props {
  scope: Record<string, any>;
  siteLocation: Record<string, any>;
  address: string;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={[styles.row, { marginBottom: 6 }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "—"}</Text>
  </View>
);

export const ProjectScopeSiteSection = ({ scope, siteLocation, address }: Props) => {
  const drawings: any[] = scope.conceptDrawings || [];
  const photos: any[] = siteLocation.photos || [];
  const isNewConstruction = scope.projectType === "new-construction";
  const sqftExisting = scope.sqftExisting ? `${Number(scope.sqftExisting).toLocaleString()} sq ft` : null;
  const sqftPlanned = scope.sqftPlanned ? `${Number(scope.sqftPlanned).toLocaleString()} sq ft` : null;
  const subsidies: any[] = siteLocation.subsidyPrograms || [];
  const totalSubsidy = subsidies.reduce((s: number, p: any) => s + (p.estimatedValue || 0), 0);
  const envConcerns: string[] = siteLocation.environmentalConcerns || [];

  return (
    <View>
      <Text style={styles.sectionTitle}>Project Scope & Site</Text>

      <Text style={styles.subTitle}>Property Details</Text>
      <Row label="Address" value={address} />
      <Row label="Project Type" value={PROJECT_TYPE_LABELS[scope.projectType] || scope.projectType || "—"} />
      <Row label="Property Type" value={PROPERTY_TYPE_LABELS[scope.propertyType] || scope.propertyType || "—"} />
      <Row label="Number of Units" value={scope.numberOfUnits || "—"} />
      {!isNewConstruction && !!sqftExisting && <Row label="Existing Sq Ft" value={sqftExisting} />}
      {!!sqftPlanned && (
        <Row label={isNewConstruction ? "Planned Sq Ft" : "Planned Sq Ft (After Construction)"} value={sqftPlanned} />
      )}
      <Row label="Bedrooms / Unit" value={scope.bedroomsPerUnit || "—"} />
      <Row label="Bathrooms / Unit" value={scope.bathroomsPerUnit || "—"} />

      {(scope.scopeOfWork || scope.projectDescription) && (
        <View>
          <Text style={styles.subTitle}>Scope of Work</Text>
          <Text style={styles.bodyText}>{scope.scopeOfWork || scope.projectDescription}</Text>
        </View>
      )}

      <Text style={styles.subTitle}>Lot & Site Details</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Detail</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
        </View>
        {[
          { label: "Lot Size", value: siteLocation.lotSize ? `${siteLocation.lotSize.toLocaleString()} ${siteLocation.lotSizeUnit || "sqft"}` : "—" },
          { label: "Topography", value: siteLocation.topography || "—" },
          { label: "Current Condition", value: siteLocation.currentCondition || "—" },
          { label: "Flood Zone", value: siteLocation.floodZone || "—" },
          { label: "Current Zoning", value: siteLocation.currentZoning || siteLocation.zoningClassification || "—" },
          { label: "Permitted Use", value: siteLocation.permittedUse || "—" },
          { label: "Entitlement Status", value: siteLocation.entitlementStatus || "—" },
        ].map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.label}</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {photos.length > 0 && (
        <View style={{ marginBottom: 10 }} break>
          <Text style={styles.subTitle}>Site Photos</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {photos.map((photo: any, i: number) => (
              <View key={i} style={{ width: "48%", marginBottom: 8 }}>
                <Image src={photo.url} style={{ width: "100%", height: 140, objectFit: "cover" as any, borderRadius: 4 }} />
                {!!photo.caption && <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>{photo.caption}</Text>}
              </View>
            ))}
          </View>
        </View>
      )}

      {drawings.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.subTitle}>Concept Drawings & Plans</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {drawings.map((drawing: any, i: number) => (
              <View key={i} style={{ width: "48%", marginBottom: 8 }}>
                {drawing.fileType === "image" ? (
                  <Image src={drawing.url} style={{ width: "100%", height: 160, objectFit: "contain" as any, borderRadius: 4, backgroundColor: "#F7F8FA" }} />
                ) : (
                  <View style={{ width: "100%", height: 60, backgroundColor: "#FEF2F2", borderRadius: 4, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 10, color: colors.red }}>PDF Attachment</Text>
                  </View>
                )}
                {!!drawing.title && <Text style={{ fontSize: 9, color: colors.navy, fontFamily: "Helvetica-Bold", marginTop: 3 }}>{drawing.title}</Text>}
              </View>
            ))}
          </View>
        </View>
      )}

      {envConcerns.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.subTitle}>Environmental Concerns</Text>
          {envConcerns.map((c, i) => (
            <View key={i} style={styles.bulletItem}>
              <View style={[styles.bullet, { backgroundColor: colors.red }]} />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))}
        </View>
      )}

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
