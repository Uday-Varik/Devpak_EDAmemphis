import { X, Lightbulb, AlertTriangle, Star, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section } from "@/pages/ProjectBuilder";

interface TeachingPanelProps {
  activeSection: Section;
  onClose: () => void;
}

const TEACHING_CONTENT: Partial<Record<Section, {
  whyMatters: string;
  commonMistakes: string[];
  proTips: string[];
  memphisContext?: string[];
}>> = {
  "project-scope": {
    whyMatters: "Lenders evaluate your project scope first to understand the deal's scale and complexity. A clear, well-defined scope signals that you've done your homework and understand what you're getting into. If the scope is vague or the numbers don't add up, lenders will question every other section of your package. Think of this as your project's foundation — everything else builds on it.",
    commonMistakes: [
      "Underestimating the full scope of renovation work needed. Walk the property with a contractor before filling this out, and document every issue you find with photos.",
      "Not verifying that current zoning actually allows your intended use. Call the city planning department to confirm — don't assume based on what was there before.",
      "Confusing existing square footage with planned square footage after renovation. Be precise about what the property is now versus what it will be when you're done.",
      "Forgetting to account for common areas, hallways, and utility spaces in multi-unit projects. These don't generate rent but still cost money to build and maintain.",
    ],
    proTips: [
      "Get a professional property inspection before finalizing your scope. The $400-500 cost can save you tens of thousands in surprises during construction.",
      "Research 3-5 comparable projects in the neighborhood to validate your assumptions about unit count, size, and finishes. What works two miles away may not work here.",
      "Document everything with dated photos, measurements, and notes. Lenders love visual evidence that you've personally assessed the property.",
      "Verify all unit counts and configurations with the city's building department. Unpermitted additions or conversions can derail your entire project.",
    ],
  },
  "budget-capital": {
    whyMatters: "Your budget is the financial blueprint lenders use to evaluate risk. A detailed, realistic budget with proper contingencies shows you understand what it actually costs to develop a property — not just the purchase price, but every permit, every professional fee, and every month of holding costs. The sources and uses section proves you can actually fund the project and have enough personal investment ('skin in the game') that you won't walk away if things get difficult.",
    commonMistakes: [
      "Underestimating pre-development costs like architecture, permits, insurance, and loan interest. These should be 15-25% of construction costs. If yours are lower, you're probably missing something.",
      "Setting contingency too low to make the deal look better on paper. Never go below 10%, and 15-20% is recommended for rehab projects. Lenders will catch this and lose confidence in your budget.",
      "Forgetting to include holding costs during the construction period — monthly loan payments, property taxes, insurance, and utilities add up fast over 6-12 months.",
      "Not including post-completion operating reserves. Lenders want to see that you can cover 6 months of expenses even if the property doesn't immediately generate income.",
      "Listing funding sources without documentation. Every dollar in your sources and uses should have a commitment letter, bank statement, or approval letter behind it.",
    ],
    proTips: [
      "Get at least 3 written contractor bids before finalizing your construction costs. Verbal estimates are not reliable enough for a lender package.",
      "Add 6 months of operating reserves to your budget. This satisfies most lender requirements and protects you from cash flow gaps during lease-up or sale.",
      "Document all subsidy and grant commitments with official approval or award letters. Lenders need to verify these funds are real and available.",
      "Show lenders you have backup capital available if costs run over budget. A line of credit or additional savings demonstrates financial resilience.",
    ],
    memphisContext: [
      "Memphis renovation costs typically range from $80-150 per square foot depending on the scope of work, age of the property, and level of finishes. Gut renovations on older homes trend toward the higher end.",
      "Shelby County building permit fees typically run 1-2% of your total construction value. Contact the Memphis Division of Planning & Development for current fee schedules before finalizing your budget.",
      "Local CDFI lenders like Community LIFT and Pathway Lending often offer better rates and more flexible terms than national banks for emerging developers. They're also more familiar with Memphis neighborhoods.",
      "Check MLGW (Memphis Light, Gas & Water) requirements early in your planning. Electrical panel upgrades, gas line work, and water/sewer connections can add $10,000-20,000 to your budget if not anticipated.",
      "Many Memphis developers start with property they already own — inherited lots, tax sale purchases, or Land Bank acquisitions. The difference between what you paid and what it's worth today is land equity, and lenders count this toward your equity contribution. This can significantly reduce the cash you need to bring to the deal. Get a current appraisal or BPO to document the value.",
      "Memphis developers should explore all available subsidy programs before finalizing their sources and uses. CDBG and HOME funds can significantly reduce out-of-pocket costs for qualifying projects. Land Bank acquisitions often come with property tax freezes that improve cash flow projections.",
    ],
  },
  "feasibility": {
    whyMatters: "This is where lenders determine whether your deal actually makes financial sense. Strong feasibility metrics with conservative assumptions show you're a serious developer who understands the numbers — not a speculator hoping the market bails you out. The 'pencil test' (does the deal pencil out?) separates fundable projects from wishful thinking. If the numbers don't work here, no amount of polish elsewhere will convince a lender to fund your deal.",
    commonMistakes: [
      "Using unrealistic After Repair Value (ARV) assumptions without solid comparable sales to back them up. Your ARV should be supported by at least 3 recent sales of similar properties within half a mile.",
      "Underestimating vacancy rates. Memphis averages 8-10% vacancy for residential rentals, and new properties take time to lease up. Using 5% vacancy to make the numbers look better will undermine your credibility.",
      "Forgetting to include all operating expenses when calculating Net Operating Income. Property management, maintenance reserves, insurance, and property taxes all reduce your cash flow.",
      "Ignoring debt service when calculating cash flow. Your mortgage payment is a real cost — Net Operating Income is not the same as money in your pocket.",
      "Not running stress test scenarios to see what happens if ARV drops 10-20% or costs increase. Lenders want to know your deal survives bad conditions, not just good ones.",
      "Using distant or non-comparable sales as comps. A renovated 3-bedroom in Midtown is not comparable to a 3-bedroom in Frayser, even if the square footage matches.",
    ],
    proTips: [
      "Definition — 70% Rule: A quick feasibility check used by real estate investors. Maximum purchase price should be no more than 70% of the After Repair Value (ARV) minus repair costs. Example: ARV of $200,000 with $40,000 in repairs → max purchase = ($200,000 × 0.70) − $40,000 = $100,000. This builds a margin for unexpected costs and ensures profitability.",
      "Definition — All-In Basis: The total cost of a project including every expense — acquisition, construction, soft costs, financing costs, holding costs, and contingency. Lenders evaluate deals on an all-in basis because it shows the true total investment needed. Your all-in cost divided by the ARV tells you how much of the property value is consumed by costs.",
      "Definition — Sensitivity Analysis: Tests how your deal performs under different scenarios. What if construction costs run 10% over budget? What if the property sells for 10% less than expected? By adjusting key variables up and down, you can see how sensitive your profit is to changes. A strong deal still works in the pessimistic scenario. For single family and small residential, focus on testing ARV changes and construction cost overruns — these have the biggest impact on profitability.",
      "Use at least 3 recent comparable sales within 0.5 miles that sold within the last 6 months. Adjust for differences in size, condition, and features. Document your sources.",
      "Model three scenarios: best case, expected, and stress test. If the deal still works in the stress test scenario, you have a strong project. If it only works in the best case, walk away.",
      "A DSCR (Debt Service Coverage Ratio) of 1.25 means your Net Operating Income is 125% of your debt payments — the minimum most lenders require. Aim for 1.3 or higher.",
      "The 70% rule (purchase price + renovation ≤ 70% of ARV) builds in enough profit margin to protect you even if costs run over or ARV comes in lower than expected.",
      "Show your math and cite your data sources. Lenders are more likely to fund a deal with conservative, well-documented assumptions than one with aggressive numbers and no backup.",
      "If the deal doesn't pencil out, it's okay to walk away. There will be other opportunities, and a bad deal can set you back years.",
    ],
    memphisContext: [
      "Memphis cap rates for residential rental properties typically range from 7-10%, which is favorable compared to many larger markets. This makes Memphis attractive for buy-and-hold strategies.",
      "ARV comparable sales should be within 0.5 miles of your property and sold within the last 6 months. Memphis neighborhoods can vary dramatically block by block, so proximity matters more here than in suburban markets.",
      "Memphis vacancy rates average 8-10% for residential rentals. Use 8% as your absolute minimum assumption, and consider 10% for properties in neighborhoods with higher turnover.",
      "Property management in Memphis typically costs 8-10% of collected rent. Even if you plan to self-manage, lenders will underwrite at market rates, so include this in your analysis.",
      "Factor in higher insurance costs for older Memphis properties, especially those built before 1970. Older homes may require specialized coverage for lead paint, asbestos, or outdated electrical systems.",
      "Shelby County property taxes can significantly impact your cash flow and cap rate. Check the current assessed value and millage rate at the Shelby County Assessor's website before finalizing your analysis.",
    ],
  },
  "executive-summary": {
    whyMatters: "The executive summary is often the only page a busy lender reads closely before deciding whether to dig deeper into your package. It needs to tell your deal's story concisely and compellingly — hitting all the key points that make this a fundable project in 1-2 pages. Think of it as your elevator pitch in written form: if a lender only reads this one section, they should understand what the project is, why it works financially, and exactly what you're asking for.",
    commonMistakes: [
      "Making the executive summary too long. Keep it to 1-2 pages maximum. If you can't explain the deal concisely, lenders will worry you don't fully understand it yourself.",
      "Leading with your personal background instead of the deal itself. Lenders want to see the numbers first — who you are matters, but what the deal looks like matters more.",
      "Burying the key financial metrics in long paragraphs of text. Use bullet points, tables, and clear formatting so a lender can scan the highlights in 30 seconds.",
      "Using industry jargon or vague language instead of clear, direct statements. Say 'projected 18% ROI' not 'strong anticipated returns on investment.'",
    ],
    proTips: [
      "Every development package exists to accomplish one thing: persuade a specific reader to take a specific action. Selecting your Package Purpose ensures the entire document is framed for your audience. A loan request reads differently than a grant application.",
      "Lead with the deal highlights: property address, total investment, ARV, expected ROI, and your funding ask. Put these front and center where they can't be missed.",
      "Use bullet points and short paragraphs for easy scanning. Lenders review dozens of packages — make yours easy to evaluate quickly.",
      "Include a clear, specific ask: how much money you need, what terms you're seeking, and what timeline you're working with. Vague asks get vague responses.",
      "Have someone outside of real estate read your executive summary for clarity. If they can understand the deal, a lender definitely will.",
    ],
  },
  "site-location": {
    whyMatters: "Site analysis is one of the first things lenders review. It tells them whether your project is physically and legally feasible. Zoning issues, environmental problems, or flood zone risks can kill a deal before financials even matter.",
    commonMistakes: [
      "Not verifying zoning before purchasing. Assuming utilities are available without confirmation.",
      "Ignoring environmental risks that could add $10,000-50,000+ in remediation costs.",
      "Skipping the title search for easements or liens.",
      "Assuming the property is in a favorable flood zone without checking FEMA maps.",
    ],
    proTips: [
      "Call the local planning department before you buy. They can tell you in 5 minutes if your intended use is allowed.",
      "Always get a Phase I environmental assessment for properties built before 1980.",
      "Document everything — lenders want to see you've done your homework.",
      "Check for any pending zoning changes or planned developments nearby that could affect your project.",
    ],
    memphisContext: [
      "For 1-4 unit residential projects, the most relevant Memphis incentive programs include CDBG rehabilitation grants (up to $25K through HCD), HOME Investment Partnership funds for affordable housing, Shelby County Land Bank property tax freezes, and Opportunity Zone tax benefits. PILOT (Payment in Lieu of Taxes) is primarily used for larger commercial and multifamily developments and generally does not apply to single family or small residential projects.",
      "Shelby County Assessor (assessor.shelby.tn.us) is your go-to for parcel data, zoning verification, and property records.",
      "Many Memphis neighborhoods are in designated Opportunity Zones which offer additional tax benefits for qualifying investments.",
      "Check with Memphis & Shelby County Office of Planning and Development for current zoning maps and any pending overlay districts.",
    ],
  },
  "vision-market": {
    whyMatters: "The market case is how you prove demand to a lender. They need to see that comparable properties support your projected values, that the neighborhood is trending in the right direction, and that there are real buyers or tenants for what you are building. Without strong comps and market data, lenders will question your exit strategy.",
    commonMistakes: [
      "Using comps that are too far away (keep within 0.5 miles and 6 months).",
      "Ignoring condition differences between your project and comps.",
      "Overstating market trends without data. Not accounting for seasonal variations in your market.",
      "Comparing renovated properties to your pre-renovation numbers.",
    ],
    proTips: [
      "Always pull comps from multiple sources (MLS, Zillow, county records). Adjust comp values for condition differences.",
      "Include at least 3 comps, ideally 5. Show a range, not just the highest value.",
      "Lenders trust conservative estimates. Add photos of comps to your final package if possible.",
      "Model your exit strategy around the median comp value, not the highest one.",
    ],
    memphisContext: [
      "Memphis is one of the strongest cash-flow rental markets in the Southeast. Key neighborhoods seeing development activity include Binghampton, Crosstown, Cooper-Young, and the Medical District.",
      "Memphis median home prices remain below the national average, creating opportunity for both rental and flip strategies.",
      "Check the Shelby County Register of Deeds for recent sales data and Memphis Area Association of Realtors (MAAR) for market reports.",
      "Many Memphis neighborhoods are in designated Opportunity Zones which offer additional federal tax benefits for long-term investments.",
    ],
  },
  "project-team": {
    whyMatters: "Lenders fund teams, not just deals. A strong project team with relevant experience reduces perceived risk significantly. If this is your first project, surrounding yourself with experienced professionals (contractor, attorney, property manager) shows lenders you have the support system to execute.",
    commonMistakes: [
      "Not vetting your contractor's license and insurance. Always verify both before signing any contract.",
      "Hiring the cheapest bid without checking references. The lowest price often leads to the most change orders.",
      "Not having an attorney review contracts before signing. Legal review costs far less than litigation.",
      "Assuming you can self-manage construction and rental operations without experience.",
      "Not documenting your team's qualifications in your package. Lenders want to see bios and track records.",
    ],
    proTips: [
      "Include brief bios for each team member highlighting relevant project experience.",
      "Lenders look for a track record — if you don't have one personally, your team's collective experience counts.",
      "Get at least 3 contractor bids and document why you chose your GC.",
      "Always have an attorney review your operating agreement and construction contracts.",
      "If using a property manager, confirm their portfolio size and vacancy rates on similar properties.",
    ],
    memphisContext: [
      "Memphis has a strong network of real estate professionals. Check the Memphis Area Association of Realtors for agent referrals.",
      "The Memphis Contractors Alliance and Memphis Urban League maintain lists of vetted professionals.",
      "For affordable housing projects, Memphis Housing Authority and THDA (Tennessee Housing Development Agency) maintain lists of approved contractors and consultants.",
      "EDA alumni network is a great source for contractor and attorney recommendations with experience in 1-4 unit projects.",
    ],
  },
  "risk-assessment": {
    whyMatters: "Risk assessment shows lenders you have thought through what could go wrong and have a plan. Every project has risks. Lenders do not expect zero risk. They expect you to identify risks, quantify them, and show mitigation strategies. A missing risk section is a red flag.",
    commonMistakes: [
      "Ignoring risks and hoping for the best. Every project has risks — pretending otherwise destroys credibility.",
      "Not having adequate insurance before starting construction. This can halt your project entirely.",
      "Underestimating timeline risks. Delays cost money in holding costs every single month.",
      "Not including contingency in the budget for identified risks.",
      "Assuming permits will be approved without checking first.",
    ],
    proTips: [
      "Pre-populate your risk register with the most common risks for your project type and adjust from there.",
      "Show your lender you have insurance lined up before they ask. It demonstrates professionalism.",
      "If you have never done a project before, acknowledge it as a risk and show how your team compensates.",
      "Update your risk register throughout the project — it's a living document, not a one-time exercise.",
    ],
    memphisContext: [
      "Property crime during construction is a real risk in Memphis — secure the site and get builder's risk insurance.",
      "Termite damage is common in older Memphis structures. Budget for inspection and treatment.",
      "Lead paint and asbestos in pre-1980 buildings require certified remediation, which adds cost and time.",
      "Check Memphis/Shelby County building codes which may differ from state standards.",
      "Flash flooding in certain areas — verify FEMA flood zone status before closing.",
    ],
  },
  "resilience-factors": {
    whyMatters: "Resilience factors are the positive counterweight to your risk assessment. While risks show what could go wrong, resilience shows what protects the deal. Lenders look for projects with multiple layers of protection. The more boxes you check here, the stronger your package.",
    commonMistakes: [
      "Not having enough contingency (15% minimum for renovations). This is the most common red flag.",
      "Relying on a single funding source. If that falls through, the entire project stalls.",
      "Using aggressive projections instead of conservative ones. Lenders will catch this immediately.",
      "Not having a backup exit strategy. What if you can't sell? Can you rent?",
      "Starting construction before all insurance and permits are in place.",
    ],
    proTips: [
      "Aim for at least 60% of the resilience factors checked. If you're below 50%, revisit your project structure.",
      "Each checked factor is a talking point in your lender meeting. Know why each one matters.",
      "Lenders love to see multiple exit strategies and conservative numbers — it shows maturity.",
      "The resilience score is a quick self-assessment. Use it to identify weak areas before a lender does.",
    ],
    memphisContext: [
      "CDBG grants and HOME funds can strengthen your financial resilience by reducing out-of-pocket costs. PILOT tax abatement is primarily for larger commercial projects.",
      "Opportunity Zone investments offer tax benefits that strengthen investor returns.",
      "Memphis median prices below national average means more room for margin on most deals.",
      "Strong rental demand with below-average vacancy rates in many neighborhoods supports rental fallback strategies.",
    ],
  },
  "project-schedule": {
    whyMatters: "A realistic project schedule shows lenders you understand the development process and have planned for each phase. Lenders use your timeline to structure loan terms, draw schedules, and interest reserves. An unrealistic schedule raises red flags about your experience level.",
    commonMistakes: [
      "Underestimating permitting timelines (Memphis can take 4-8 weeks). Always verify with the city before committing to dates.",
      "Not accounting for weather delays. Seasonal factors can add weeks to exterior work.",
      "Setting milestone durations too aggressively to impress lenders. Realistic timelines build credibility.",
      "Not building buffer between phases. Trades overlap and inspections take time.",
      "Assuming all trades will be available when you need them. Schedule subcontractors early.",
      "Forgetting inspection wait times between phases.",
    ],
    proTips: [
      "Add 20% buffer to every estimated duration. It's better to finish early than to miss deadlines.",
      "Build the schedule backwards from your target completion date to identify the latest possible start.",
      "Coordinate with your GC on realistic timelines before committing to lender deadlines.",
      "Include seasonal considerations — avoid starting exterior work in December.",
      "Track progress weekly against the schedule and update statuses regularly.",
    ],
    memphisContext: [
      "Memphis permitting typically takes 4-8 weeks for residential projects. Plan accordingly.",
      "Schedule around Memphis weather: summer heat slows exterior work, and spring storms cause delays.",
      "Memphis Light Gas and Water (MLGW) hookups can take 2-4 weeks — schedule early.",
      "Shelby County inspections are usually available within 48 hours of request.",
      "Factor in Memphis holiday schedules — city offices close for several local observances.",
    ],
  },
};

export const TeachingPanel = ({ activeSection, onClose }: TeachingPanelProps) => {
  const content = TEACHING_CONTENT[activeSection];
  if (!content) return null;
  const hasMemphisContext = content.memphisContext && content.memphisContext.length > 0;

  return (
    <aside className="w-full xl:w-[320px] xl:min-w-[300px] flex-shrink-0 border-t xl:border-t-0 xl:border-l border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Learning Guide</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Tabs - 2x2 Grid Layout */}
      <Tabs defaultValue="why" className="h-[calc(100vh-120px)]">
        <div className="grid grid-cols-2 border-b border-border">
          <TabsList className="col-span-2 grid grid-cols-2 gap-0 rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger
              value="why"
              className="rounded-none border-b-2 border-r border-transparent border-r-border data-[state=active]:border-b-primary data-[state=active]:bg-muted/50 py-2.5 px-2 text-xs font-medium"
            >
              Why It Matters
            </TabsTrigger>
            <TabsTrigger
              value="mistakes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-muted/50 py-2.5 px-2 text-xs font-medium"
            >
              Mistakes
            </TabsTrigger>
            <TabsTrigger
              value="tips"
              className="rounded-none border-b-2 border-r border-transparent border-r-border data-[state=active]:border-b-primary data-[state=active]:bg-muted/50 py-2.5 px-2 text-xs font-medium"
            >
              Pro Tips
            </TabsTrigger>
            {hasMemphisContext ? (
              <TabsTrigger
                value="memphis"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-muted/50 py-2.5 px-2 text-xs font-medium"
              >
                Memphis
              </TabsTrigger>
            ) : (
              <div className="py-2.5 px-2" />
            )}
          </TabsList>
        </div>

        <TabsContent value="why" className="p-4 m-0 overflow-y-auto h-full">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-medium text-foreground pt-1">Why This Matters</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content.whyMatters}
          </p>
        </TabsContent>

        <TabsContent value="mistakes" className="p-4 m-0 overflow-y-auto h-full">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <h4 className="font-medium text-foreground pt-1">Common Mistakes</h4>
          </div>
          <ul className="space-y-3">
            {content.commonMistakes.map((mistake, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                {mistake}
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="tips" className="p-4 m-0 overflow-y-auto h-full">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-green-600" />
            </div>
            <h4 className="font-medium text-foreground pt-1">Pro Tips</h4>
          </div>
          <ul className="space-y-3">
            {content.proTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </TabsContent>

        {hasMemphisContext && (
          <TabsContent value="memphis" className="p-4 m-0 overflow-y-auto h-full">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-medium text-foreground pt-1">Memphis Context</h4>
            </div>
            <ul className="space-y-3">
              {content.memphisContext!.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </TabsContent>
        )}
      </Tabs>
    </aside>
  );
};
