import { View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";

interface DeveloperProfilePageProps {
  developerProfile: any;
  developerName: string;
  developerTitle: string;
  companyName: string;
  developerPhone: string;
  developerEmail: string;
}

export const DeveloperProfileSection = ({
  developerProfile, developerName, developerTitle, companyName, developerPhone, developerEmail,
}: DeveloperProfilePageProps) => {
  const dp = developerProfile || {};
  const licenses: any[] = Array.isArray(dp.licenses) ? dp.licenses : [];
  const certifications: string[] = Array.isArray(dp.certifications) ? dp.certifications : [];
  const portfolio: any[] = Array.isArray(dp.portfolio) ? dp.portfolio : [];

  return (
    <View>
      <Text style={styles.sectionTitle}>Developer Profile</Text>

      {/* Header card */}
      <View style={[styles.highlightBox, { padding: 14, flexDirection: "row", gap: 14, alignItems: "center" as const, marginBottom: 12 }]}>
        {!!dp.headshot_url && (
          <Image src={dp.headshot_url} style={{ width: 70, height: 70, borderRadius: 35, objectFit: "cover" as any }} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.value, { fontSize: 14 }]}>{developerName || "—"}</Text>
          {developerTitle ? <Text style={[styles.label, { marginTop: 2 }]}>{developerTitle}</Text> : null}
          {companyName ? <Text style={[styles.tableCell, { color: colors.blue, marginTop: 2 }]}>{companyName}</Text> : null}
          {(developerPhone || developerEmail) ? (
            <Text style={[styles.label, { marginTop: 4 }]}>
              {[developerPhone, developerEmail].filter(Boolean).join(" • ")}
            </Text>
          ) : null}
          {dp.years_experience != null ? (
            <Text style={[styles.label, { marginTop: 2 }]}>{dp.years_experience} years of experience</Text>
          ) : null}
        </View>
      </View>

      {/* Bio */}
      {dp.bio ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subTitle}>About</Text>
          <Text style={styles.bodyText}>{dp.bio}</Text>
        </View>
      ) : null}

      {/* Credentials */}
      {(licenses.length > 0 || certifications.length > 0) && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subTitle}>Credentials</Text>
          {licenses.length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>License Type</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Number</Text>
                <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: "right" }]}>State</Text>
              </View>
              {licenses.map((l, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCellBold, { flex: 2 }]}>{l.type || "—"}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{l.number || "—"}</Text>
                  <Text style={[styles.tableCell, { flex: 0.5, textAlign: "right" }]}>{l.state || "—"}</Text>
                </View>
              ))}
            </View>
          )}
          {certifications.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Certifications</Text>
              <Text style={styles.bodyText}>{certifications.join(" • ")}</Text>
            </View>
          )}
        </View>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <View>
          <Text style={styles.subTitle}>Past Projects</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Address</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6 }]}>Year</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Type</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Disposition</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Role</Text>
            </View>
            {portfolio.map((p, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>{p.address || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{p.year || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{p.type || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{p.disposition || "—"}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{p.role || "—"}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
