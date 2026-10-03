import { View, Text } from "@react-pdf/renderer";
import { styles } from "../PDFStyles";

const tocItems = [
  { num: "1", title: "Executive Summary", page: "3" },
  { num: "2", title: "Vision & Market Case", page: "4" },
  { num: "3", title: "Site & Location", page: "5" },
  { num: "4", title: "Project Scope", page: "6" },
  { num: "5", title: "Project Schedule", page: "7" },
  { num: "6", title: "Budget & Capital Stack", page: "8" },
  { num: "7", title: "Project Team", page: "10" },
  { num: "8", title: "Risk Assessment", page: "11" },
  { num: "9", title: "Resilience Factors", page: "12" },
  { num: "10", title: "Feasibility Analysis", page: "13" },
  { num: "11", title: "Disclaimer", page: "14" },
];

export const TableOfContents = () => (
  <View>
    <Text style={styles.sectionTitle}>Table of Contents</Text>
    {tocItems.map((item, i) => (
      <View key={i} style={styles.tocItem}>
        <Text style={styles.tocNumber}>{item.num}.</Text>
        <Text style={styles.tocText}>{item.title}</Text>
        <Text style={styles.tocPage}>{item.page}</Text>
      </View>
    ))}
  </View>
);
