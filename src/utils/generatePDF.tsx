import { pdf } from "@react-pdf/renderer";
import { fetchProjectExportData } from "./fetchProjectData";
import { DevelopmentPackagePDF } from "@/components/pdf/DevelopmentPackagePDF";

export { type PDFData } from "@/components/pdf/DevelopmentPackagePDF";

export const generatePDF = async (projectId: string): Promise<void> => {
  const data = await fetchProjectExportData(projectId);

  const blob = await pdf(<DevelopmentPackagePDF data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Development_Package.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
