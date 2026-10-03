import { Document } from "@react-pdf/renderer";
import { CoverPage } from "./sections/CoverPage";
import { DeveloperProfileSection } from "./sections/DeveloperProfileSection";
import { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection";
import { CaseForSupportSection } from "./sections/CaseForSupportSection";
import { MarketConditionsSection } from "./sections/MarketConditionsSection";
import { ProjectScopeSiteSection } from "./sections/ProjectScopeSiteSection";
import { ProFormaSection } from "./sections/ProFormaSection";
import { CapitalStackSection } from "./sections/CapitalStackSection";
import { FeasibilitySection } from "./sections/FeasibilitySection";
import { ScheduleSection } from "./sections/ScheduleSection";
import { TeamSection } from "./sections/TeamSection";
import { RiskSection } from "./sections/RiskSection";
import { ResilienceSection } from "./sections/ResilienceSection";
import { SupportingDocsSection } from "./sections/SupportingDocsSection";
import { Disclaimer } from "./sections/Disclaimer";
import { PageWrapper } from "./PageWrapper";

export interface PDFData {
  projectName: string;
  address: string;
  preparedBy: string;
  developerTitle?: string;
  companyName?: string;
  developerPhone?: string;
  developerEmail?: string;
  scope: Record<string, any>;
  budget: Record<string, any>;
  feasibility: Record<string, any>;
  executiveSummary: Record<string, any>;
  visionMarket: Record<string, any>;
  siteLocation: Record<string, any>;
  schedule: Record<string, any>;
  team: Record<string, any>;
  riskAssessment: Record<string, any>;
  resilience: Record<string, any>;
  tdc: number;
  arv: number;
  netProfit: number;
  roi: number;
  profitMargin: number;
  exitStrategy: string;
  fundingGap: number;
  riskItems: string[];
  sqftPlanned: number;
  constructionPerSF: number;
  totalPerSF: number;
  salePerSF: number;
  landEquity?: number;
  cashEquity?: number;
  bankLoan?: number;
  privateLender?: number;
  grants?: number;
  totalSources?: number;
  noi?: number;
  dscr?: number;
  capRate?: number;
  allInBasis?: number;
  sensitivityScenarios?: import("@/utils/calculations").SensitivityScenario[];
  salesCostsPct?: number;
  salesCosts?: number;
  netSaleProceeds?: number;
  seventyMaxPurchase?: number;
  purchasePrice?: number;
  totalEquity?: number;
  grossRent?: number;
  egi?: number;
  opex?: number;
  annualDebtService?: number;
  cashFlow?: number;
  cashOnCash?: number;
  onePercentRule?: number;
  budgetTotals?: Omit<import("@/utils/calculations").BudgetTotals, "purchasePrice">;
  developerProfile?: any;
}

export const DevelopmentPackagePDF = ({ data }: { data: PDFData }) => {
  const photos: any[] = data.siteLocation?.photos || [];
  const drawings: any[] = data.scope?.conceptDrawings || [];
  const featuredPhoto = photos.find((p: any) => p.featured) || null;
  const dp = data.developerProfile || null;
  const showDeveloperProfilePage = !!dp && (
    !!dp.bio ||
    (Array.isArray(dp.portfolio) && dp.portfolio.length > 0) ||
    (Array.isArray(dp.licenses) && dp.licenses.length > 0) ||
    (Array.isArray(dp.certifications) && dp.certifications.length > 0)
  );
  const packagePurpose = data.executiveSummary?.packagePurpose;

  return (
  <Document title={`${data.projectName} - Development Package`} author={data.preparedBy}>
    <CoverPage
      projectName={data.projectName}
      address={data.address}
      preparedBy={data.preparedBy}
      developerTitle={data.developerTitle}
      companyName={data.companyName}
      developerPhone={data.developerPhone}
      developerEmail={data.developerEmail}
      featuredPhotoUrl={featuredPhoto?.url}
      packagePurpose={packagePurpose}
      date={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    />

    {!!showDeveloperProfilePage && (
      <PageWrapper projectName={data.projectName}>
        <DeveloperProfileSection
          developerProfile={dp}
          developerName={data.preparedBy}
          developerTitle={data.developerTitle || ""}
          companyName={data.companyName || ""}
          developerPhone={data.developerPhone || ""}
          developerEmail={data.developerEmail || ""}
        />
      </PageWrapper>
    )}

    <PageWrapper projectName={data.projectName}>
      <ExecutiveSummarySection
        projectName={data.projectName}
        address={data.address}
        tdc={data.tdc}
        arv={data.arv}
        netProfit={data.netProfit}
        roi={data.roi}
        profitMargin={data.profitMargin}
        exitStrategy={data.exitStrategy}
        projectOverview={data.executiveSummary.projectOverview || ""}
        riskItems={data.riskItems}
        fundingGap={data.fundingGap}
        sqftPlanned={data.sqftPlanned}
        constructionPerSF={data.constructionPerSF}
        totalPerSF={data.totalPerSF}
        salePerSF={data.salePerSF}
        packagePurpose={packagePurpose}
        bankLoan={data.bankLoan || 0}
        privateLender={data.privateLender || 0}
        grants={data.grants || 0}
        noi={data.noi}
        dscr={data.dscr}
        capRate={data.capRate}
      />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <CaseForSupportSection
        caseForSupport={data.executiveSummary.investmentThesis || ""}
        packagePurpose={packagePurpose}
      />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <MarketConditionsSection visionMarket={data.visionMarket} />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <ProjectScopeSiteSection scope={data.scope} siteLocation={data.siteLocation} address={data.address} />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <ProFormaSection budget={data.budget} sqftPlanned={data.sqftPlanned} totals={data.budgetTotals} />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <CapitalStackSection
        budget={data.budget}
        tdc={data.tdc}
        cashEquity={data.cashEquity || 0}
        landEquity={data.landEquity || 0}
        bankLoan={data.bankLoan || 0}
        privateLender={data.privateLender || 0}
        grants={data.grants || 0}
        totalSources={data.totalSources || 0}
        fundingGap={data.fundingGap}
        packagePurpose={packagePurpose}
      />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <FeasibilitySection
        feasibility={data.feasibility}
        metrics={{
          tdc: data.tdc,
          arv: data.arv,
          salesCostsPct: data.salesCostsPct ?? 8,
          salesCosts: data.salesCosts ?? 0,
          netSaleProceeds: data.netSaleProceeds ?? 0,
          netProfit: data.netProfit,
          roi: data.roi,
          profitMargin: data.profitMargin,
          allInBasis: data.allInBasis ?? 0,
          seventyMaxPurchase: data.seventyMaxPurchase ?? 0,
          purchasePrice: data.purchasePrice ?? 0,
          totalEquity: data.totalEquity ?? data.cashEquity ?? 0,
          grossRent: data.grossRent ?? 0,
          egi: data.egi ?? 0,
          opex: data.opex ?? 0,
          noi: data.noi ?? 0,
          annualDebtService: data.annualDebtService ?? 0,
          cashFlow: data.cashFlow ?? 0,
          capRate: data.capRate ?? 0,
          cashOnCash: data.cashOnCash ?? 0,
          dscr: data.dscr ?? 0,
          exitStrategy: data.exitStrategy,
          sensitivityScenarios: data.sensitivityScenarios ?? [],
        }}
      />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <ScheduleSection schedule={data.schedule} />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <RiskSection riskAssessment={data.riskAssessment} />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <ResilienceSection resilience={data.resilience} />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <TeamSection
        team={data.team}
        developerName={data.preparedBy}
        developerTitle={data.developerTitle || ""}
        companyName={data.companyName || ""}
        developerPhone={data.developerPhone || ""}
        developerEmail={data.developerEmail || ""}
      />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <SupportingDocsSection drawings={drawings} photos={photos} />
    </PageWrapper>

    <PageWrapper projectName={data.projectName}>
      <Disclaimer />
    </PageWrapper>
  </Document>
  );
};
