import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserCircle, Hammer, Palette, UsersRound, ClipboardList, Plus, Trash2, ExternalLink, CheckCircle2,
} from "lucide-react";
import { CurrencyInput, PercentageInput } from "./budget/CurrencyInput";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { AutoSaveIndicator } from "@/components/builder/AutoSaveIndicator";
import { TeamSummaryCard } from "./project-team/TeamSummaryCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPhone } from "@/lib/formatPhone";

interface ProjectTeamFormProps {
  data: Record<string, any>;
  onSave: (data: Record<string, any>, markComplete?: boolean) => Promise<void>;
  saving: boolean;
}

interface ProfileData {
  full_name: string | null;
  title: string | null;
  company_name: string | null;
  phone: string | null;
  photo_url: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  completed_projects: number | null;
}

interface TeamMember {
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
}

const TEAM_ROLES = [
  "Attorney",
  "Accountant/CPA",
  "Real Estate Agent/Broker",
  "Appraiser",
  "Environmental Consultant",
  "Surveyor",
  "Title Company",
  "Insurance Agent",
  "Property Manager",
  "Lender Contact",
  "Other",
];

const STATUS_OPTIONS = ["Identified", "Under Contract", "Engaged", "Not Yet Identified"];
const ARCHITECT_STATUS_OPTIONS = [...STATUS_OPTIONS, "Not Required"];

const DEFAULT_DATA = {
  developerRole: "",
  developerEquity: 0,
  gc: {
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    yearsInBusiness: "",
    relevantExperience: "",
    status: "",
    bidStatus: "",
  },
  architect: {
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    relevantExperience: "",
    status: "",
  },
  teamMembers: [] as TeamMember[],
  management: {
    constructionManagement: "",
    propertyManagement: "",
    propertyManagerName: "",
    propertyManagerContact: "",
    managementFee: 8,
  },
};

const EMPTY_MEMBER: TeamMember = {
  name: "",
  company: "",
  role: "",
  phone: "",
  email: "",
  notes: "",
};

export const ProjectTeamForm = ({ data, onSave, saving }: ProjectTeamFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({ ...DEFAULT_DATA, ...data });
  const [openSections, setOpenSections] = useState<string[]>(["developer"]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const [{ data: devProfile }, { data: legacy }] = await Promise.all([
        supabase
          .from("developer_profiles" as any)
          .select("full_name, professional_title, entity_name, phone, headshot_url, years_experience")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, title, company_name, phone, photo_url, specializations, years_experience, completed_projects")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);
      const dp: any = devProfile || {};
      const lp: any = legacy || {};
      // Merge — developer_profiles wins, profiles fills gaps
      const merged: ProfileData = {
        full_name: dp.full_name || lp.full_name || null,
        title: dp.professional_title || lp.title || null,
        company_name: dp.entity_name || lp.company_name || null,
        phone: dp.phone || lp.phone || null,
        photo_url: dp.headshot_url || lp.photo_url || null,
        specializations: lp.specializations || null,
        years_experience: dp.years_experience ?? lp.years_experience ?? null,
        completed_projects: lp.completed_projects ?? null,
      };
      setProfile(merged);
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAutoSave = useCallback(
    async (d: any) => { await onSave(d, false); },
    [onSave]
  );
  const { saveStatus, lastSaved } = useAutoSave(formData, handleAutoSave);

  const update = (field: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({ ...prev, [field]: value }));
  };

  const updateNested = (section: string, field: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const addTeamMember = () => {
    const members = [...(formData.teamMembers || []), { ...EMPTY_MEMBER }];
    update("teamMembers", members);
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    const members = [...(formData.teamMembers || [])];
    members[index] = { ...members[index], [field]: value };
    update("teamMembers", members);
  };

  const removeTeamMember = (index: number) => {
    const members = [...(formData.teamMembers || [])];
    members.splice(index, 1);
    update("teamMembers", members);
  };

  const profileComplete = profile && profile.full_name && profile.company_name;

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* DEVELOPER / SPONSOR */}
          <AccordionItem value="developer" className="border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <UserCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Developer / Sponsor</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-5">
              {profileLoading ? (
                <div className="text-sm text-muted-foreground">Loading profile...</div>
              ) : profileComplete ? (
                <div className="bg-gradient-to-r from-[hsl(var(--primary)/0.05)] to-[hsl(var(--secondary-blue)/0.05)] border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-4">
                    {profile.photo_url ? (
                      <img src={profile.photo_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-primary/20" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-7 h-7 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-foreground text-lg">{profile.full_name}</p>
                      {profile.title && <p className="text-sm text-muted-foreground">{profile.title}</p>}
                      {profile.company_name && <p className="text-sm text-muted-foreground">{profile.company_name}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.years_experience && (
                      <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        {profile.years_experience}+ years experience
                      </span>
                    )}
                    {profile.completed_projects != null && profile.completed_projects > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                        {profile.completed_projects} projects completed
                      </span>
                    )}
                    {(profile.specializations || []).slice(0, 3).map((s) => (
                      <span key={s} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-3">
                  <UserCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Complete your Developer Profile to auto-fill this section</p>
                    <Link to="/profile" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                      Go to Profile <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm font-medium">Role on this project</Label>
                  <Input
                    value={formData.developerRole || ""}
                    onChange={(e) => update("developerRole", e.target.value)}
                    placeholder="e.g., Owner/Developer, Managing Partner"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Equity Contribution</Label>
                  <CurrencyInput
                    value={formData.developerEquity || 0}
                    onChange={(v) => update("developerEquity", v)}
                    placeholder="0"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* GENERAL CONTRACTOR */}
          <AccordionItem value="gc" className="border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <Hammer className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">General Contractor</span>
                {formData.gc?.status && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium ml-2",
                    formData.gc.status === "Engaged" ? "bg-green-100 text-green-700" :
                    formData.gc.status === "Not Yet Identified" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {formData.gc.status}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company Name</Label>
                  <Input value={formData.gc?.companyName || ""} onChange={(e) => updateNested("gc", "companyName", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact Name</Label>
                  <Input value={formData.gc?.contactName || ""} onChange={(e) => updateNested("gc", "contactName", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input value={formData.gc?.phone || ""} onChange={(e) => updateNested("gc", "phone", formatPhone(e.target.value))} placeholder="(901) 555-0123" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={formData.gc?.email || ""} onChange={(e) => updateNested("gc", "email", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">License Number</Label>
                  <Input value={formData.gc?.licenseNumber || ""} onChange={(e) => updateNested("gc", "licenseNumber", e.target.value)} className="mt-1.5" />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="gc-license-verified"
                      checked={!!formData.gc?.licenseVerified}
                      onCheckedChange={(v) => updateNested("gc", "licenseVerified", !!v)}
                    />
                    <label htmlFor="gc-license-verified" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                      {formData.gc?.licenseVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      License Verified
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Years in Business</Label>
                  <Input type="number" value={formData.gc?.yearsInBusiness || ""} onChange={(e) => updateNested("gc", "yearsInBusiness", e.target.value)} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Relevant Experience</Label>
                <Textarea
                  value={formData.gc?.relevantExperience || ""}
                  onChange={(e) => updateNested("gc", "relevantExperience", e.target.value)}
                  placeholder="Describe similar projects completed"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={formData.gc?.status || ""} onValueChange={(v) => updateNested("gc", "status", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bid Status</Label>
                  <Select value={formData.gc?.bidStatus || ""} onValueChange={(v) => updateNested("gc", "bidStatus", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select bid status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bid Accepted">Bid Accepted</SelectItem>
                      <SelectItem value="Pending Bid">Pending Bid</SelectItem>
                      <SelectItem value="Not Yet Requested">Not Yet Requested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ARCHITECT / DESIGNER */}
          <AccordionItem value="architect" className="border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <Palette className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Architect / Designer</span>
                {formData.architect?.status && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium ml-2",
                    formData.architect.status === "Engaged" ? "bg-green-100 text-green-700" :
                    ["Not Yet Identified", "Not Required"].includes(formData.architect.status) ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {formData.architect.status}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company Name</Label>
                  <Input value={formData.architect?.companyName || ""} onChange={(e) => updateNested("architect", "companyName", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact Name</Label>
                  <Input value={formData.architect?.contactName || ""} onChange={(e) => updateNested("architect", "contactName", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input value={formData.architect?.phone || ""} onChange={(e) => updateNested("architect", "phone", formatPhone(e.target.value))} placeholder="(901) 555-0123" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={formData.architect?.email || ""} onChange={(e) => updateNested("architect", "email", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-medium">License Number</Label>
                  <Input value={formData.architect?.licenseNumber || ""} onChange={(e) => updateNested("architect", "licenseNumber", e.target.value)} className="mt-1.5" />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="arch-license-verified"
                      checked={!!formData.architect?.licenseVerified}
                      onCheckedChange={(v) => updateNested("architect", "licenseVerified", !!v)}
                    />
                    <label htmlFor="arch-license-verified" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                      {formData.architect?.licenseVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      License Verified
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Relevant Experience</Label>
                <Textarea
                  value={formData.architect?.relevantExperience || ""}
                  onChange={(e) => updateNested("architect", "relevantExperience", e.target.value)}
                  placeholder="Describe similar projects completed"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={formData.architect?.status || ""} onValueChange={(v) => updateNested("architect", "status", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {ARCHITECT_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* KEY CONSULTANTS & ADVISORS */}
          <AccordionItem value="consultants" className="border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <UsersRound className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Key Consultants & Advisors</span>
                {(formData.teamMembers || []).length > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium ml-2">
                    {(formData.teamMembers || []).length} added
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-4">
              {(formData.teamMembers || []).map((member: TeamMember, index: number) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Team Member {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeTeamMember(index)} className="text-destructive hover:text-destructive/80 h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Name</Label>
                      <Input value={member.name} onChange={(e) => updateTeamMember(index, "name", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Company</Label>
                      <Input value={member.company} onChange={(e) => updateTeamMember(index, "company", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Role</Label>
                      <Select value={member.role} onValueChange={(v) => updateTeamMember(index, "role", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {TEAM_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Phone</Label>
                      <Input value={member.phone} onChange={(e) => updateTeamMember(index, "phone", formatPhone(e.target.value))} placeholder="(901) 555-0123" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Email</Label>
                      <Input value={member.email} onChange={(e) => updateTeamMember(index, "email", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Notes</Label>
                      <Input value={member.notes} onChange={(e) => updateTeamMember(index, "notes", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addTeamMember} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Team Member
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* MANAGEMENT PLAN */}
          <AccordionItem value="management" className="border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Management Plan</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-4">
              <div>
                <Label className="text-sm font-medium">Who manages construction?</Label>
                <Select value={formData.management?.constructionManagement || ""} onValueChange={(v) => updateNested("management", "constructionManagement", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select option" /></SelectTrigger>
                  <SelectContent>
                    {["Self-Managed", "General Contractor", "Construction Manager", "Other"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Who manages the property post-completion?</Label>
                <Select value={formData.management?.propertyManagement || ""} onValueChange={(v) => updateNested("management", "propertyManagement", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select option" /></SelectTrigger>
                  <SelectContent>
                    {["Self-Managed", "Property Management Company", "Other"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.management?.propertyManagement === "Property Management Company" && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Property Manager Name</Label>
                    <Input
                      value={formData.management?.propertyManagerName || ""}
                      onChange={(e) => updateNested("management", "propertyManagerName", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Property Manager Contact</Label>
                    <Input
                      value={formData.management?.propertyManagerContact || ""}
                      onChange={(e) => updateNested("management", "propertyManagerContact", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Management Fee</Label>
                    <PercentageInput
                      value={formData.management?.managementFee ?? 8}
                      onChange={(v) => updateNested("management", "managementFee", v)}
                      placeholder="8"
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <AutoSaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onSave(formData, false)} disabled={saving}>
              Save Draft
            </Button>
            <Button
              onClick={() => onSave(formData, true)}
              disabled={saving}
              className="btn-accent px-6 transition-all duration-300"
            >
              {saving ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel: Team Summary */}
      <div className="w-full xl:w-[320px] flex-shrink-0">
        <div className="sticky top-24">
          <TeamSummaryCard formData={formData} profile={profile} />
        </div>
      </div>
    </div>
  );
};
