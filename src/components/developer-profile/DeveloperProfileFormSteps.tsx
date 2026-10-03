import { useState } from "react";
import { Plus, Trash2, Upload, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperProfile, DeveloperLicense, PortfolioProject } from "@/types/developerProfile";
import { formatPhone } from "@/lib/formatPhone";

interface Props {
  step: 1 | 2 | 3 | 4;
  profile: DeveloperProfile;
  onChange: (p: DeveloperProfile) => void;
}

const PROJECT_TYPES = ["New Construction", "Renovation/Rehab", "Acquisition + Rehab", "Other"];
const DISPOSITIONS = ["Sold", "Held / Rental", "Refinanced", "In Progress"];

export const DeveloperProfileFormSteps = ({ step, profile, onChange }: Props) => {
  const update = <K extends keyof DeveloperProfile>(k: K, v: DeveloperProfile[K]) =>
    onChange({ ...profile, [k]: v });

  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [certInput, setCertInput] = useState("");

  const handleHeadshotUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/headshot-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("developer-headshots").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("developer-headshots").getPublicUrl(path);
      update("headshot_url", publicUrl);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // STEP 1 — Basic Info
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={profile.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Jane Developer" />
          </div>
          <div className="space-y-2">
            <Label>Entity Name (LLC / Company)</Label>
            <Input value={profile.entity_name} onChange={(e) => update("entity_name", e.target.value)} placeholder="Smith Development LLC" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Professional Title</Label>
          <Input value={profile.professional_title} onChange={(e) => update("professional_title", e.target.value)} placeholder="Managing Partner" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} placeholder="(901) 555-0123" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input value={profile.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@example.com" />
          </div>
        </div>
      </div>
    );
  }

  // STEP 2 — Experience
  if (step === 2) {
    const addLicense = () => update("licenses", [...profile.licenses, { type: "", number: "", state: "" }]);
    const updateLicense = (i: number, field: keyof DeveloperLicense, val: string) => {
      const next = [...profile.licenses];
      next[i] = { ...next[i], [field]: val };
      update("licenses", next);
    };
    const removeLicense = (i: number) => update("licenses", profile.licenses.filter((_, idx) => idx !== i));

    const addCert = () => {
      const v = certInput.trim();
      if (!v) return;
      update("certifications", [...profile.certifications, v]);
      setCertInput("");
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Bio (max 500 chars)</Label>
          <Textarea
            rows={4}
            maxLength={500}
            value={profile.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Brief professional summary that lenders will see in your packages..."
          />
          <div className="text-xs text-muted-foreground text-right">{profile.bio.length}/500</div>
        </div>

        <div className="space-y-2">
          <Label>Years of Experience</Label>
          <Input
            type="number"
            min={0}
            max={70}
            step={1}
            value={profile.years_experience ?? ""}
            onChange={(e) => {
              if (e.target.value === "") return update("years_experience", null);
              const n = parseInt(e.target.value, 10);
              if (!Number.isFinite(n)) return;
              update("years_experience", Math.min(70, Math.max(0, n)));
            }}
            placeholder="5"
            className="max-w-[120px]"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Licenses</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLicense}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add License
            </Button>
          </div>
          {profile.licenses.length === 0 && (
            <p className="text-sm text-muted-foreground">No licenses added yet.</p>
          )}
          {profile.licenses.map((lic, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_80px_auto] gap-2 items-end p-3 bg-muted/40 rounded-lg">
              <div>
                <Label className="text-xs">Type</Label>
                <Input value={lic.type} onChange={(e) => updateLicense(i, "type", e.target.value)} placeholder="Real Estate Broker" />
              </div>
              <div>
                <Label className="text-xs">Number</Label>
                <Input value={lic.number} onChange={(e) => updateLicense(i, "number", e.target.value)} placeholder="12345" />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input value={lic.state} onChange={(e) => updateLicense(i, "state", e.target.value.toUpperCase())} placeholder="TN" maxLength={2} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLicense(i)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Label>Certifications</Label>
          <div className="flex gap-2">
            <Input
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="e.g. OSHA-30, CCIM Candidate"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert(); } }}
            />
            <Button type="button" variant="outline" onClick={addCert}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {profile.certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((c, i) => (
                <Badge key={i} variant="secondary" className="gap-1.5 pr-1">
                  {c}
                  <button
                    onClick={() => update("certifications", profile.certifications.filter((_, idx) => idx !== i))}
                    className="hover:bg-muted-foreground/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 3 — Headshot
  if (step === 3) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            {profile.headshot_url ? (
              <img src={profile.headshot_url} alt="Headshot" className="w-32 h-32 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#1B4F72] text-white flex items-center justify-center cursor-pointer hover:bg-[#2E86AB] transition-colors">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeadshotUpload(f); }}
              />
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            {uploading ? "Uploading..." : "Upload a professional headshot. This will appear on your packages."}
          </div>
        </div>
        {profile.headshot_url && (
          <Button variant="outline" size="sm" onClick={() => update("headshot_url", "")}>
            Remove headshot
          </Button>
        )}
      </div>
    );
  }

  // STEP 4 — Portfolio
  const addProject = () => {
    if (profile.portfolio.length >= 3) return;
    update("portfolio", [...profile.portfolio, { address: "", year: "", type: "", disposition: "", role: "" }]);
  };
  const updateProject = (i: number, field: keyof PortfolioProject, val: string) => {
    const next = [...profile.portfolio];
    next[i] = { ...next[i], [field]: val };
    update("portfolio", next);
  };
  const removeProject = (i: number) => update("portfolio", profile.portfolio.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Add up to 3 past projects to demonstrate your track record.</p>
        <Button type="button" variant="outline" size="sm" onClick={addProject} disabled={profile.portfolio.length >= 3}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
        </Button>
      </div>
      {profile.portfolio.length === 0 && (
        <div className="text-sm text-muted-foreground p-6 text-center bg-muted/30 rounded-lg border border-dashed">
          No past projects yet. Add one to strengthen your profile.
        </div>
      )}
      {profile.portfolio.map((p, i) => (
        <div key={i} className="p-4 bg-white border border-border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1B4F72]">Project {i + 1}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeProject(i)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Address</Label>
            <Input value={p.address} onChange={(e) => updateProject(i, "address", e.target.value)} placeholder="123 Main St, Memphis, TN" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Year</Label>
              <Input value={p.year} onChange={(e) => updateProject(i, "year", e.target.value)} placeholder="2023" maxLength={4} />
            </div>
            <div>
              <Label className="text-xs">Project Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={p.type}
                onChange={(e) => updateProject(i, "type", e.target.value)}
              >
                <option value="">Select…</option>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Disposition</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={p.disposition}
                onChange={(e) => updateProject(i, "disposition", e.target.value)}
              >
                <option value="">Select…</option>
                {DISPOSITIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Your Role</Label>
            <Input value={p.role} onChange={(e) => updateProject(i, "role", e.target.value)} placeholder="Lead Developer" />
          </div>
        </div>
      ))}
    </div>
  );
};
