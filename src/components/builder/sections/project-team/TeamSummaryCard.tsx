import { UserCircle, Hammer, Palette, UsersRound, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TeamSummaryCardProps {
  formData: Record<string, any>;
  profile: ProfileData | null;
}

const StatusBadge = ({ status }: { status: string }) => {
  if (!status) return <span className="text-xs text-muted-foreground">Not set</span>;

  const colors =
    status === "Engaged"
      ? "bg-green-100 text-green-700"
      : status === "Not Yet Identified" || status === "Not Required"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors)}>
      {status}
    </span>
  );
};

export const TeamSummaryCard = ({ formData, profile }: TeamSummaryCardProps) => {
  const gc = formData.gc || {};
  const architect = formData.architect || {};
  const teamMembers = formData.teamMembers || [];
  const management = formData.management || {};

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-[hsl(var(--secondary-blue))] px-5 py-3">
        <h3 className="text-sm font-bold text-primary-foreground">Team Summary</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Developer */}
        <div className="flex items-start gap-3">
          <UserCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Developer</p>
            {profile?.full_name ? (
              <div>
                <p className="text-sm font-semibold text-foreground truncate">{profile.full_name}</p>
                {profile.company_name && (
                  <p className="text-xs text-muted-foreground truncate">{profile.company_name}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Profile incomplete</p>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* GC */}
        <div className="flex items-start gap-3">
          <Hammer className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">General Contractor</p>
            {gc.companyName ? (
              <p className="text-sm font-semibold text-foreground truncate">{gc.companyName}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not entered</p>
            )}
            <div className="mt-1">
              <StatusBadge status={gc.status} />
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Architect */}
        <div className="flex items-start gap-3">
          <Palette className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Architect / Designer</p>
            {architect.companyName ? (
              <p className="text-sm font-semibold text-foreground truncate">{architect.companyName}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not entered</p>
            )}
            <div className="mt-1">
              <StatusBadge status={architect.status} />
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Additional Team Members */}
        <div className="flex items-start gap-3">
          <UsersRound className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Team</p>
            <p className="text-sm font-semibold text-foreground">
              {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Management */}
        <div className="flex items-start gap-3">
          <ClipboardList className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Management</p>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Construction: <span className="font-medium text-foreground">{management.constructionManagement || "Not set"}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Property: <span className="font-medium text-foreground">{management.propertyManagement || "Not set"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
