import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "../PDFStyles";

interface CaseForSupportSectionProps {
  caseForSupport: string;
  packagePurpose?: string;
}

const PURPOSE_INTRO: Record<string, string> = {
  "loan-request": "Why this project is a sound lending opportunity:",
  "grant-application": "Why this project advances community housing goals:",
  "investor-pitch": "Why this project represents a compelling investment:",
  "internal-planning": "Strategic rationale for pursuing this project:",
};

export const CaseForSupportSection = ({ caseForSupport, packagePurpose }: CaseForSupportSectionProps) => (
  <View>
    <Text style={styles.sectionTitle}>Case for Support</Text>
    {!!packagePurpose && PURPOSE_INTRO[packagePurpose] && (
      <Text style={[styles.label, { fontSize: 10, color: colors.blue, marginBottom: 10 }]}>
        {PURPOSE_INTRO[packagePurpose]}
      </Text>
    )}
    <View
      style={{
        borderLeftWidth: 4,
        borderLeftColor: colors.gold,
        paddingLeft: 14,
        paddingVertical: 8,
        backgroundColor: "#FFFDF5",
      }}
    >
      <Text style={[styles.bodyText, { marginBottom: 0 }]}>
        {!!caseForSupport && caseForSupport.trim().length > 0
          ? caseForSupport
          : "Case for Support content not yet provided."}
      </Text>
    </View>
  </View>
);
