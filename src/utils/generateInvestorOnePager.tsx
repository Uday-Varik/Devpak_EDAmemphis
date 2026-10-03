import { pdf } from "@react-pdf/renderer";
import { fetchProjectExportData } from "./fetchProjectData";
import { InvestorOnePagerPDF } from "@/components/pdf/InvestorOnePagerPDF";

export const generateInvestorOnePager = async (projectId: string): Promise<void> => {
  const data = await fetchProjectExportData(projectId);
  const blob = await pdf(<InvestorOnePagerPDF data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Investor_OnePager.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
