import { View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";
import { formatCurrency } from "../pdfUtils";

interface TeamSectionProps {
  team: Record<string, any>;
  developerName: string;
  developerTitle: string;
  companyName: string;
  developerPhone: string;
  developerEmail: string;
}

const StatusText = ({ status }: { status: string }) => {
  const color = status === "Engaged" ? colors.green
    : status === "Under Contract" || status === "Identified" ? colors.gold
    : status === "Not Yet Identified" ? colors.red
    : colors.muted;
  return <Text style={{ fontSize: 9, color, fontFamily: "Helvetica-Bold" }}>{status || "—"}</Text>;
};

const LicenseBadge = ({ licenseNumber, verified }: { licenseNumber?: string; verified?: boolean }) => {
  if (!licenseNumber) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 }}>
      <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.navy }}>
        License #{licenseNumber}
      </Text>
      {!!verified && (
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#DCFCE7", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 8, color: "#15803D", fontFamily: "Helvetica-Bold" }}>✓ License Verified</Text>
        </View>
      )}
    </View>
  );
};

export const TeamSection = ({ team, developerName, developerTitle, companyName, developerPhone, developerEmail }: TeamSectionProps) => {
  const gc = team.gc || team.generalContractor || {};
  const architect = team.architect || {};
  const members: any[] = team.teamMembers || [];
  const mgmt = team.management || {};

  return (
    <View>
      <Text style={styles.sectionTitle}>Project Team</Text>

      {/* Developer */}
      <Text style={styles.subTitle}>Developer / Sponsor</Text>
      <View style={[styles.highlightBox, { padding: 12 }]}>
        <Text style={[styles.value, { fontSize: 13, marginBottom: 2 }]}>{developerName || "—"}</Text>
        {!!developerTitle && <Text style={[styles.label, { marginBottom: 1 }]}>{developerTitle}</Text>}
        {!!companyName && <Text style={[styles.tableCell, { color: colors.blue, marginBottom: 2 }]}>{companyName}</Text>}
        {(developerPhone || developerEmail) && (
          <Text style={[styles.label, { marginTop: 2 }]}>
            {[developerPhone, developerEmail].filter(Boolean).join(" • ")}
          </Text>
        )}
        {!!team.roleOnProject && (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.label}>Role on Project</Text>
            <Text style={styles.value}>{team.roleOnProject}</Text>
          </View>
        )}
        {team.equityContribution > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={styles.label}>Equity Contribution</Text>
            <Text style={styles.value}>{formatCurrency(team.equityContribution)}</Text>
          </View>
        )}
      </View>

      {/* General Contractor */}
      <Text style={styles.subTitle}>General Contractor</Text>
      {!!gc.companyName && (
        <View style={{ marginBottom: 6 }}>
          <Text style={[styles.value, { fontSize: 12 }]}>{gc.companyName}</Text>
          {!!gc.contactName && <Text style={[styles.label, { marginTop: 1 }]}>{gc.contactName}</Text>}
          <LicenseBadge licenseNumber={gc.licenseNumber} verified={gc.licenseVerified} />
        </View>
      )}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Detail</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
        </View>
        {[
          { label: "Phone", value: gc.phone || "—" },
          { label: "Email", value: gc.email || "—" },
          { label: "Years in Business", value: gc.yearsInBusiness ? `${gc.yearsInBusiness} years` : "—" },
          { label: "Bid Status", value: gc.bidStatus || "—" },
        ].map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.label}</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginBottom: 8, marginTop: 4 }}>
        <Text style={styles.label}>Status: </Text>
        <StatusText status={gc.status} />
      </View>
      {!!gc.relevantExperience && <Text style={styles.bodyText}>{gc.relevantExperience}</Text>}

      {/* Architect */}
      <Text style={styles.subTitle}>Architect / Designer</Text>
      {!!architect.companyName && (
        <View style={{ marginBottom: 6 }}>
          <Text style={[styles.value, { fontSize: 12 }]}>{architect.companyName}</Text>
          {!!architect.contactName && <Text style={[styles.label, { marginTop: 1 }]}>{architect.contactName}</Text>}
          <LicenseBadge licenseNumber={architect.licenseNumber} verified={architect.licenseVerified} />
        </View>
      )}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Detail</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Value</Text>
        </View>
        {[
          { label: "Phone", value: architect.phone || "—" },
          { label: "Email", value: architect.email || "—" },
        ].map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.label}</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{row.value}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginBottom: 8, marginTop: 4 }}>
        <Text style={styles.label}>Status: </Text>
        <StatusText status={architect.status} />
      </View>

      {/* Key Consultants */}
      {members.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Key Consultants & Advisors</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Name</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Company</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Role</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Contact</Text>
            </View>
            {members.map((m: any, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { flex: 1.5 }]}>{m.name || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{m.company || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{m.role || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{m.phone || m.email || "—"}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Management Plan */}
      <Text style={styles.subTitle}>Management Plan</Text>
      <View style={{ marginBottom: 8 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Construction Management</Text>
          <Text style={styles.value}>{mgmt.constructionManagement || team.constructionManagement || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Property Management</Text>
          <Text style={styles.value}>{mgmt.propertyManagement || team.propertyManagement || "—"}</Text>
        </View>
        {(mgmt.propertyManagement === "Property Management Company" || team.propertyManagement === "Property Management Company") && (
          <>
            {(mgmt.propertyManagerName || team.propertyManagerName) && (
              <View style={styles.row}>
                <Text style={styles.label}>Property Manager</Text>
                <Text style={styles.value}>{mgmt.propertyManagerName || team.propertyManagerName}</Text>
              </View>
            )}
            {(mgmt.managementFee || team.managementFee) && (
              <View style={styles.row}>
                <Text style={styles.label}>Management Fee</Text>
                <Text style={styles.value}>{mgmt.managementFee || team.managementFee}%</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
};
