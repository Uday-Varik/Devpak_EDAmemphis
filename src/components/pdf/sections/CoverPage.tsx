import { Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "../PDFStyles";

interface CoverPageProps {
  projectName: string;
  address: string;
  preparedBy: string;
  date: string;
  developerTitle?: string;
  companyName?: string;
  developerPhone?: string;
  developerEmail?: string;
  featuredPhotoUrl?: string;
  packagePurpose?: string;
}

const PURPOSE_LABELS: Record<string, string> = {
  "loan-request": "PACKAGE PURPOSE: Loan Request",
  "grant-application": "PACKAGE PURPOSE: Grant Application",
  "investor-pitch": "PACKAGE PURPOSE: Investment Opportunity",
  "internal-planning": "PACKAGE PURPOSE: Internal Planning Document",
};

export const CoverPage = ({ 
  projectName, address, preparedBy, date,
  developerTitle, companyName, developerPhone, developerEmail,
  featuredPhotoUrl, packagePurpose,
}: CoverPageProps) => (
  <Page size="LETTER" style={[styles.page, { paddingTop: 0, paddingBottom: 0 }]}>
    <View style={styles.coverBorder} />
    <View style={styles.coverPage}>
      <Text style={styles.coverTitle}>{projectName}</Text>
      {!!address && <Text style={styles.coverAddress}>{address}</Text>}

      {/* Featured site photo */}
      {!!featuredPhotoUrl && (
        <View style={{ marginTop: 16, marginBottom: 8, alignItems: "center" as const }}>
          <Image
            src={featuredPhotoUrl}
            style={{ width: 360, height: 220, objectFit: "cover" as any, borderRadius: 6 }}
          />
        </View>
      )}

      <View style={styles.coverLine} />
      <Text style={styles.coverSubtitle}>Development Package</Text>
      {!!packagePurpose && PURPOSE_LABELS[packagePurpose] && (
        <Text style={{ fontSize: 11, color: "#F39C12", marginTop: 6, fontFamily: "Helvetica-Bold", letterSpacing: 1 }}>
          {PURPOSE_LABELS[packagePurpose]}
        </Text>
      )}
      {!!preparedBy && (
        <View style={{ marginTop: 20, alignItems: "center" as const }}>
          <Text style={styles.coverMeta}>Prepared by</Text>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1B4F72", marginTop: 4 }}>
            {preparedBy}
          </Text>
          {!!developerTitle && (
            <Text style={{ fontSize: 10, color: "#4A5568", marginTop: 2 }}>{developerTitle}</Text>
          )}
          {!!companyName && (
            <Text style={{ fontSize: 11, color: "#2E86AB", marginTop: 2 }}>{companyName}</Text>
          )}
          {(developerPhone || developerEmail) && (
            <Text style={{ fontSize: 9, color: "#718096", marginTop: 4 }}>
              {[developerPhone, developerEmail].filter(Boolean).join(" • ")}
            </Text>
          )}
        </View>
      )}
      <Text style={styles.coverMeta}>{date}</Text>
    </View>
    <View style={{ position: "absolute", bottom: 80, left: 60, right: 60, alignItems: "center" }}>
      <Text style={{ fontSize: 8, color: "#718096", fontStyle: "italic", textAlign: "center" }}>
        Borrower financial documentation available upon request for further project review.
      </Text>
    </View>
    <Text style={styles.coverWatermark}>Confidential</Text>
  </Page>
);
