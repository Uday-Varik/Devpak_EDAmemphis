import { View, Text } from "@react-pdf/renderer";
import { styles } from "../PDFStyles";

export const Disclaimer = () => (
  <View>
    <Text style={styles.sectionTitle}>Disclaimer</Text>
    <Text style={styles.bodyText}>
      This Development Package has been prepared for informational and planning purposes only. All financial projections, cost estimates, and return calculations contained herein are based on assumptions and estimates that may differ from actual results.
    </Text>
    <Text style={styles.bodyText}>
      The information presented does not constitute financial, legal, or investment advice. Actual costs, market values, rental rates, and returns may vary significantly from the projections provided. Market conditions, construction timelines, regulatory requirements, and other factors may materially impact the financial performance of this project.
    </Text>
    <Text style={styles.bodyText}>
      All parties reviewing this document should conduct their own independent due diligence, including but not limited to property inspections, appraisals, title searches, environmental assessments, and legal reviews before making any investment or lending decisions.
    </Text>
    <Text style={styles.bodyText}>
      Past performance of similar projects is not indicative of future results. The developer makes no guarantees or warranties, express or implied, regarding the accuracy, completeness, or reliability of the information contained in this document.
    </Text>
    <Text style={[styles.bodyText, { marginTop: 20, fontStyle: "italic" }]}>
      This document is confidential and intended solely for the use of the recipient(s) to whom it is addressed.
    </Text>
  </View>
);
