import { View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";

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

interface ProjectScopeSectionProps {
  scope: Record<string, any>;
  address: string;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={[styles.row, { marginBottom: 8 }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "—"}</Text>
  </View>
);

export const ProjectScopeSection = ({ scope, address }: ProjectScopeSectionProps) => {
  const drawings: any[] = scope.conceptDrawings || [];
  const isNewConstruction = scope.projectType === "new-construction";
  const sqftExisting = scope.sqftExisting ? `${Number(scope.sqftExisting).toLocaleString()} sq ft` : null;
  const sqftPlanned = scope.sqftPlanned ? `${Number(scope.sqftPlanned).toLocaleString()} sq ft` : null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Project Scope</Text>

      <Text style={styles.subTitle}>Property Details</Text>
      <DetailRow label="Address" value={address} />
      <DetailRow label="Project Type" value={PROJECT_TYPE_LABELS[scope.projectType] || scope.projectType || "—"} />
      <DetailRow label="Property Type" value={PROPERTY_TYPE_LABELS[scope.propertyType] || scope.propertyType || "—"} />
      <DetailRow label="Number of Units" value={scope.numberOfUnits || "—"} />
      {!isNewConstruction && sqftExisting && (
        <DetailRow label="Existing Sq Ft" value={sqftExisting} />
      )}
      {!!sqftPlanned && (
        <DetailRow
          label={isNewConstruction ? "Planned Sq Ft" : "Planned Sq Ft (After Construction)"}
          value={sqftPlanned}
        />
      )}
      <DetailRow label="Bedrooms / Unit" value={scope.bedroomsPerUnit || "—"} />
      <DetailRow label="Bathrooms / Unit" value={scope.bathroomsPerUnit || "—"} />

      {(scope.scopeOfWork || scope.projectDescription) && (
        <View>
          <Text style={styles.subTitle}>Scope of Work</Text>
          <Text style={styles.bodyText}>{scope.scopeOfWork || scope.projectDescription}</Text>
        </View>
      )}

      {!!scope.renovationScope && !scope.scopeOfWork && (
        <View>
          <Text style={styles.subTitle}>Renovation Scope</Text>
          <Text style={styles.bodyText}>{scope.renovationScope}</Text>
        </View>
      )}

      {/* Concept Drawings */}
      {drawings.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subTitle}>Concept Drawings & Plans</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {drawings.map((drawing: any, i: number) => (
              <View key={i} style={{ width: "48%", marginBottom: 8 }}>
                {drawing.fileType === "image" ? (
                  <Image
                    src={drawing.url}
                    style={{ width: "100%", height: 160, objectFit: "contain" as any, borderRadius: 4, backgroundColor: "#F7F8FA" }}
                  />
                ) : (
                  <View style={{ width: "100%", height: 60, backgroundColor: "#FEF2F2", borderRadius: 4, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 10, color: colors.red }}>PDF Attachment</Text>
                  </View>
                )}
                {!!drawing.title && (
                  <Text style={{ fontSize: 9, color: colors.navy, fontFamily: "Helvetica-Bold", marginTop: 3 }}>{drawing.title}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
