import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";

interface SupportingDocsSectionProps {
  drawings: any[];
  photos: any[];
}

const STANDARD_AVAILABLE = [
  "Personal Tax Returns (2 years)",
  "Business Tax Returns (2 years)",
  "Personal Bank Statements (2 months)",
  "Business Bank Statements (2 months)",
  "Personal Financial Statement",
  "Entity Documents (LLC Operating Agreement, Articles, EIN)",
  "Property Deed",
];

export const SupportingDocsSection = ({ drawings, photos }: SupportingDocsSectionProps) => {
  const attached: string[] = [];
  if (drawings && drawings.length > 0) attached.push(`${drawings.length} concept drawing${drawings.length === 1 ? "" : "s"} / plan${drawings.length === 1 ? "" : "s"}`);
  if (photos && photos.length > 0) attached.push(`${photos.length} site photo${photos.length === 1 ? "" : "s"}`);

  return (
    <View>
      <Text style={styles.sectionTitle}>Supporting Documentation</Text>

      <Text style={styles.subTitle}>Attached to This Package</Text>
      {attached.length > 0 ? (
        attached.map((a, i) => (
          <View key={i} style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: colors.green }]} />
            <Text style={styles.bulletText}>{a}</Text>
          </View>
        ))
      ) : (
        <Text style={[styles.bodyText, { color: colors.muted }]}>No supplementary files attached to this package.</Text>
      )}

      <Text style={styles.subTitle}>Available Upon Request</Text>
      {STANDARD_AVAILABLE.map((item, i) => (
        <View key={i} style={styles.bulletItem}>
          <View style={[styles.bullet, { backgroundColor: colors.navy }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}

      <View style={{ marginTop: 14, padding: 10, backgroundColor: colors.tableAlt, borderLeftWidth: 3, borderLeftColor: colors.blue }}>
        <Text style={[styles.bodyText, { marginBottom: 0, fontSize: 9, color: colors.muted }]}>
          Borrower financial documentation available upon request for further project review.
        </Text>
      </View>
    </View>
  );
};
