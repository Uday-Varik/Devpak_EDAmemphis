import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const EDUCATION_CONTENT: Record<string, string> = {
  "pre-development": `This phase covers all the groundwork before construction begins. Key activities include:

• Market research and feasibility analysis
• Site assessment and property inspection
• Environmental testing (lead, asbestos for pre-1978 buildings)
• Architectural design and engineering plans
• Cost estimation and contractor bidding
• Financing applications and lender meetings
• Title search and insurance
• Survey and boundary confirmation

For Memphis projects, this is also when you research available incentives (CDBG, HOME, Land Bank programs) and engage with Develop901 for zoning verification.`,

  "permitting": `Securing all government approvals needed to begin work. Includes:

• Building permit application through Shelby County
• Zoning verification with Develop901
• Historic district review (if applicable in Memphis)
• Utility connection applications (MLGW)
• Stormwater management permits
• Demolition permits (if demolishing existing structures)
• Plan review by code enforcement

Memphis tip: Building permits are processed through the Office of Construction Code Enforcement. Allow 4-6 weeks for standard plan review.`,

  "site preparation": `Getting the physical site ready for construction. Includes:

• Demolition of existing structures (if gut renovation)
• Debris removal and site clearing
• Grading and drainage preparation
• Temporary utilities setup
• Construction fencing and signage
• Tree protection (if required by city)
• Erosion control measures

For Memphis renovation projects, this phase often reveals hidden conditions (termite damage, foundation issues) that may require change orders.`,

  "foundation": `The structural skeleton of the building. Includes:

• Foundation repair or new foundation pour
• Structural framing (wood frame for most 1-4 unit residential)
• Subfloor installation
• Load-bearing wall construction
• Roof framing and sheathing
• Structural inspections (required before covering)

Memphis note: Many Binghampton and Orange Mound properties have pier and beam foundations that may need releveling or replacement.`,

  "mechanical": `All the systems that make a building function. Includes:

• Rough plumbing (supply and drain lines)
• Rough electrical (wiring, panel upgrade, circuits)
• HVAC system installation (ductwork, equipment)
• Gas line installation or repair
• Low-voltage wiring (data, security)
• Mechanical inspections (required before covering walls)

Memphis tip: MLGW handles all utility connections. Schedule inspections early as wait times can be 2-3 weeks.`,

  "interior": `Transforming the structure into livable space. Includes:

• Insulation installation
• Drywall hanging and finishing
• Interior painting
• Flooring installation (tile, hardwood, LVP)
• Cabinet and countertop installation
• Trim and millwork
• Fixture installation (lights, plumbing fixtures)
• Appliance installation
• Interior door hanging

This is where the quality of your finish choices directly impacts your ARV and rental rates.`,

  "exterior": `Curb appeal and weather protection. Includes:

• Siding repair or installation
• Exterior painting
• Window and door installation
• Gutter and downspout installation
• Driveway and walkway work
• Landscaping and grading
• Fencing
• Exterior lighting
• Mailbox and address numbers

Memphis tip: Curb appeal matters significantly in emerging neighborhoods like Binghampton. Invest in quality exterior finishes that signal neighborhood improvement.`,

  "inspection": `Final quality verification before occupancy. Includes:

• Final building inspection (Shelby County)
• Final electrical inspection
• Final plumbing inspection
• Final mechanical inspection
• Certificate of occupancy application
• Punch list walkthrough (identify and fix defects)
• Cleaning and final prep
• Utility transfer to permanent service
• Final photos for documentation

Memphis note: Schedule final inspections at least 2 weeks ahead as the county inspection office has limited availability.`,

  "marketing": `Getting the property sold or rented. Includes:

• Professional photography and virtual tours
• Listing on MLS (if selling) or rental platforms
• Open houses or showings
• Tenant screening and lease execution (if renting)
• Closing coordination with title company (if selling)
• Final accounting and investor reporting
• Warranty documentation for buyers/tenants
• Project closeout and lessons learned

For Memphis rental properties, target marketing to voucher program and workforce housing waitlists for faster lease-up.`,
};

const MATCH_KEYS: [string, string][] = [
  ["pre-development", "pre-development"],
  ["preconstruction", "pre-development"],
  ["permitting", "permitting"],
  ["approval", "permitting"],
  ["site prep", "site preparation"],
  ["site preparation", "site preparation"],
  ["foundation", "foundation"],
  ["structural", "foundation"],
  ["mechanical", "mechanical"],
  ["interior finish", "interior"],
  ["exterior", "exterior"],
  ["landscaping", "exterior"],
  ["inspection", "inspection"],
  ["punch list", "inspection"],
  ["marketing", "marketing"],
  ["disposition", "marketing"],
];

function getEducationContent(milestoneName: string): string | null {
  const lower = milestoneName.toLowerCase().trim();
  for (const [keyword, key] of MATCH_KEYS) {
    if (lower.includes(keyword)) return EDUCATION_CONTENT[key];
  }
  return null;
}

export const MilestoneEducation = ({ milestoneName }: { milestoneName: string }) => {
  const [open, setOpen] = useState(false);
  const content = getEducationContent(milestoneName);

  if (!content) return null;

  return (
    <div className="mt-2 mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-secondary hover:text-secondary/80 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        <span>What's included in this phase?</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 bg-blue-50 border-l-4 border-blue-300 rounded-r-lg p-3 text-xs text-blue-800 leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-top-1 duration-200">
          {content}
        </div>
      )}
    </div>
  );
};
