import { Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

interface PageWrapperProps {
  projectName: string;
  children: React.ReactNode;
}

export const PageWrapper = ({ projectName, children }: PageWrapperProps) => (
  <Page size="LETTER" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.headerText}>{projectName} — Development Package</Text>
    </View>
    {children}
    <View style={styles.footer} fixed>
      <Text style={styles.footerLeft}>Confidential — Prepared for Lender Review</Text>
      <Text style={styles.footerCenter}>{projectName}</Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  </Page>
);
