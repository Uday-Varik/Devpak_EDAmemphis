import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  navy: "#1B4F72",
  blue: "#2E86AB",
  body: "#333333",
  muted: "#666666",
  light: "#999999",
  tableAlt: "#F8FAFC",
  border: "#E2E8F0",
  green: "#059669",
  red: "#E74C3C",
  gold: "#F39C12",
  white: "#FFFFFF",
  lightBlue: "#EFF6FF",
  lightGreen: "#ECFDF5",
  lightAmber: "#FFFBEB",
  summaryBg: "#F0F4F8",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 55,
    paddingBottom: 65,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.body,
  },
  // Header/Footer
  header: {
    position: "absolute",
    top: 20,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 8,
    color: colors.light,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerLeft: {
    fontSize: 7,
    color: colors.light,
    fontStyle: "italic",
  },
  footerCenter: {
    fontSize: 7,
    color: colors.light,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.light,
  },

  // Cover page
  coverPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  coverBorder: {
    position: "absolute",
    top: 40,
    left: 40,
    right: 40,
    bottom: 40,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
  },
  coverAddress: {
    fontSize: 16,
    color: colors.blue,
    textAlign: "center",
    marginBottom: 50,
  },
  coverSubtitle: {
    fontSize: 18,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 70,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  coverMeta: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 8,
  },
  coverLine: {
    width: 80,
    height: 3,
    backgroundColor: colors.gold,
    marginBottom: 20,
  },
  coverWatermark: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#D1D5DB",
    letterSpacing: 6,
    textTransform: "uppercase",
  },

  // Section headers
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.navy,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.blue,
    marginBottom: 8,
    marginTop: 16,
  },

  // Tables
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.navy,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.tableAlt,
  },
  tableTotalRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: colors.navy,
  },
  tableTotalText: {
    color: colors.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tableCell: {
    fontSize: 9,
    color: colors.body,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.body,
  },

  // Metric grid
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    width: "23%",
    backgroundColor: colors.tableAlt,
    borderRadius: 4,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.navy,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: 7,
    color: colors.muted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
  },

  // Highlight box (for key returns, budget summary)
  highlightBox: {
    backgroundColor: colors.lightBlue,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 4,
    padding: 14,
    marginBottom: 16,
    marginTop: 8,
  },
  highlightTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  highlightValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
  },

  // Key returns row
  keyReturnsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  keyReturnBox: {
    flex: 1,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  keyReturnValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  keyReturnLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Decision badge
  decisionBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  decisionText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    letterSpacing: 2,
  },
  rationaleBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.blue,
    paddingLeft: 12,
    paddingVertical: 6,
    backgroundColor: colors.tableAlt,
    marginTop: 6,
  },

  // Scenario indicator
  scenarioBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },

  // Bullet list
  bulletItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.navy,
    marginRight: 8,
    marginTop: 4,
  },
  bulletText: {
    fontSize: 10,
    color: colors.body,
    flex: 1,
    lineHeight: 1.5,
  },

  // Text
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.body,
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.body,
  },

  // Pass/fail
  passText: {
    fontSize: 9,
    color: colors.green,
    fontFamily: "Helvetica-Bold",
  },
  failText: {
    fontSize: 9,
    color: colors.red,
    fontFamily: "Helvetica-Bold",
  },

  // TOC
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tocNumber: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
    width: 24,
  },
  tocText: {
    fontSize: 12,
    color: colors.body,
    flex: 1,
  },
  tocPage: {
    fontSize: 12,
    color: colors.muted,
  },

  // Row helper
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
});
