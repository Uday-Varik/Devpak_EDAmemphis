// Typed shapes for the JSONB payload each builder section saves to project_details.data.
// The database column is schemaless, so every field is optional: sections autosave partial
// data and older rows may lack newer keys. Readers must treat missing values as absent.

/** A line item in a cost category (budget custom lines). */
export type CustomCostItem = {
  label: string;
  amount: number;
};

/** Budget cost category with an optional contingency and custom lines. */
/** Any budget cost category; used by generic helpers that sum line items. */
export type CostCategory = Record<string, unknown>;

export type SoftCostsData = {
  /** Legacy: property taxes moved to holding costs; read only for old rows. */
  propertyTaxes?: number;
  architectureEngineering?: number;
  permitsFees?: number;
  legalAccounting?: number;
  insurance?: number;
  loanInterestPoints?: number;
  marketingLeasing?: number;
  otherSoft?: number;
  contingencyPercent?: number;
  customItems?: CustomCostItem[];
};

export type HoldingCostsData = {
  propertyTaxes?: number;
  insurance?: number;
  loanPayments?: number;
  utilities?: number;
  otherHolding?: number;
  contingencyPercent?: number;
  customItems?: CustomCostItem[];
};

export type AcquisitionData = {
  purchasePrice?: number;
  closingCosts?: number;
  titleRecording?: number;
  contingencyPercent?: number;
  ownsProperty?: boolean;
  appraisedLandValue?: number;
  acquisitionDate?: string;
  originalPurchasePrice?: number;
};

export type HardCostsData = {
  foundation?: number;
  roofing?: number;
  hvac?: number;
  electrical?: number;
  plumbing?: number;
  interiorFinishes?: number;
  exteriorLandscaping?: number;
  otherHard?: number;
  contingencyPercent?: number;
  customItems?: CustomCostItem[];
  usePerSqftEstimate?: boolean;
  costPerSqft?: number;
};

export type CapitalStackData = {
  bankLoanRate?: number | string;
  bankLoanTerm?: number | string;
  bankLoanStatus?: string;
  privateLenderRate?: number | string;
  privateLenderTerm?: number | string;
  privateLenderStatus?: string;
  otherSourcesNotes?: string;
  grant1Status?: string;
  grant2Status?: string;
  grant3Status?: string;
  developerEquity?: number;
  privateLender?: number;
  bankLoan?: number;
  grant1Name?: string;
  grant1Amount?: number;
  grant2Name?: string;
  grant2Amount?: number;
  grant3Name?: string;
  grant3Amount?: number;
  otherSources?: number;
};

export type BudgetData = {
  acquisition?: AcquisitionData;
  hardCosts?: HardCostsData;
  softCosts?: SoftCostsData;
  holdingCosts?: HoldingCostsData;
  operatingReserves?: number;
  capitalStack?: CapitalStackData;
};

export type SubsidyProgram = {
  programName?: string;
  name?: string;
  type?: string;
  status?: string;
  notes?: string;
  estimatedValue?: number;
};

export type SitePhoto = {
  url: string;
  caption: string;
  featured: boolean;
};

export type ConceptDrawing = {
  url: string;
  title: string;
  fileType: string;
};

export type ComparableSale = {
  squareFootage?: number;
  address?: string;
  price?: number;
  salePrice?: number;
  sqft?: number;
  pricePerSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  condition?: string;
  saleDate?: string;
  notes?: string;
};

export type ScheduleMilestone = {
  id?: string;
  name?: string;
  durationWeeks?: number;
  duration?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  dependsOn?: string;
  notes?: string;
  progress?: number;
  complete?: boolean;
};

export type RiskItem = {
  likelihood?: string;
  status?: string;
  [field: string]: string | number | boolean | undefined;
};

/** Scalar value a form field can hold; used for open-ended per-item records. */
export type FieldValue = string | number | boolean | null | undefined;

export type ScopeData = {
  squareFootage?: number | string;
  projectType?: string;
  propertyType?: string;
  address?: string;
  projectDescription?: string;
  scopeOfWork?: string;
  renovationScope?: string;
  sqftPlanned?: number | string;
  sqftExisting?: number | string;
  numberOfUnits?: number | string;
  numUnits?: number | string;
  units?: number | string;
  unitCount?: number | string;
  bedrooms?: number | string;
  bedroomsPerUnit?: number | string;
  bathrooms?: number | string;
  bathroomsPerUnit?: number | string;
  conceptDrawings?: ConceptDrawing[];
};

export type SaleExitData = {
  arv?: number;
  salesCostsPercent?: number;
};

export type RentalExitData = {
  numberOfUnits?: number;
  monthlyRentPerUnit?: number;
  vacancyRate?: number;
  managementPercent?: number;
  maintenancePercent?: number;
  reservesPercent?: number;
  propertyTaxes?: number;
  insurance?: number;
  otherExpenses?: number;
  interestRate?: number;
  loanTerm?: number;
  loanAmount?: number;
  loanMaturityDate?: string;
  monthlyDebtService?: number;
  monthlyOperatingExpenses?: number;
  dscr?: number;
};

export type DecisionData = {
  decision?: string;
  rationale?: string;
  reviewedBy?: string;
  rationaleFingerprint?: string;
  [field: string]: FieldValue | Record<string, boolean> | undefined;
};

export type FeasibilityData = {
  saleExit?: SaleExitData;
  rentalExit?: RentalExitData;
  exitStrategy?: { strategy?: string; holdPeriod?: number; replace?: string };
  dscr?: number;
  decision?: DecisionData;
  comparables?: ComparableSale[];
};

export type VisionData = {
  projectedPrice?: number;
  daysOnMarket?: number | string;
  population?: number | string;
  ownershipRate?: number | string;
  medianIncome?: number | string;
  avgPricePerSqFt?: number;
  comps?: ComparableSale[];
  subsidyPrograms?: SubsidyProgram[];
  visionStatement?: string;
  projectVision?: string;
  targetMarket?: string[] | string;
  targetIncomeLevel?: string[] | string;
  communityImpact?: string;
  neighborhoodName?: string;
  neighborhoodDescription?: string;
  populationTrend?: string;
  medianHouseholdIncome?: number;
  medianHomePrice?: number;
  averageRent?: number;
  vacancyRate?: number;
  marketTrend?: string;
  comparables?: ComparableSale[];
  projectedSalePriceOrRent?: number;
  daysOnMarketEstimate?: string;
  censusPopulatedFields?: string[];
};

export type SiteData = {
  parkingRequired?: string;
  address?: string;
  propertyAddress?: string;
  zoningClassification?: string;
  latitude?: number;
  longitude?: number;
  utilities?: string[];
  setbacks?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  parcelNumber?: string;
  legalDescription?: string;
  lotSize?: string | number;
  lotSizeUnit?: string;
  lotDimensions?: string;
  topography?: string;
  currentCondition?: string;
  currentConditionOther?: string;
  environmentalConcerns?: string[];
  environmentalConcernsOther?: string;
  floodZone?: string;
  utilitiesAvailable?: string[];
  currentZoning?: string;
  zoningDescription?: string;
  permittedUse?: string;
  maxDensity?: string;
  setbackRequirements?: string;
  heightLimit?: string;
  parkingRequirements?: string;
  entitlementStatus?: string;
  subsidyPrograms?: SubsidyProgram[];
  photos?: SitePhoto[];
};

export type ScheduleData = {
  startDate?: string;
  endDate?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  constructionStartDate?: string;
  loanClosingDate?: string;
  loanMaturityDate?: string;
  firstLeaseSaleDate?: string;
  coTargetDate?: string;
  timelineNotes?: string;
  totalDurationWeeks?: number;
  keyDates?: Record<string, string>;
  milestones?: ScheduleMilestone[];
};

export type PartyInfo = {
  companyName?: string;
  contactName?: string;
  name?: string;
  status?: string;
  bidStatus?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseVerified?: boolean;
  yearsInBusiness?: string;
  relevantExperience?: string;
};

export type TeamMemberData = {
  name?: string;
  role?: string;
  company?: string;
  [field: string]: FieldValue;
};

export type ManagementInfo = {
  constructionManagement?: string;
  propertyManagement?: string;
  propertyManagerName?: string;
  propertyManagerContact?: string;
  managementFee?: number | string;
};

export type TeamData = {
  gcCompany?: string;
  gcCompanyName?: string;
  gcStatus?: string;
  architectCompany?: string;
  developerName?: string;
  developerCompany?: string;
  roleOnProject?: string;
  equityContribution?: number | string;
  gc?: PartyInfo;
  architect?: PartyInfo;
  generalContractor?: PartyInfo;
  management?: ManagementInfo;
  managementFee?: number | string;
  propertyManagerName?: string;
  propertyManagement?: string;
  constructionManagement?: string;
  consultants?: TeamMemberData[];
  teamMembers?: TeamMemberData[];
};

export type RiskEntry = {
  mitigationStrategy?: string;
  id?: string;
  category?: string;
  description?: string;
  likelihood?: string;
  impact?: string;
  mitigation?: string;
  status?: string;
};

export type RiskData = {
  permitStatus?: string;
  risks?: RiskEntry[];
  propertyInsurance?: string;
  generalLiabilityInsurance?: string;
  buildersRiskInsurance?: string;
  titleInsurance?: string;
  complianceNotes?: string;
};

export type ResilienceData = {
  additionalStrengths?: string;
  [item: string]: unknown;
};

export type ExecutiveData = {
  projectOverview?: string;
  investmentThesis?: string;
  packagePurpose?: string;
  overviewEdited?: boolean;
  overviewFingerprint?: string;
  thesisFingerprint?: string;
  [field: string]: unknown;
};

/** Saved row shape: each section's JSONB payload, as fetched from project_details. */
export interface SectionRow<T> {
  section: string;
  data: T;
  completed: boolean;
};
