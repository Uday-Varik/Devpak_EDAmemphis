import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hexagon, User, LogOut, LayoutDashboard, Briefcase, Camera, FolderOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { useDeveloperProfile } from "@/hooks/useDeveloperProfile";
import { useToast } from "@/hooks/use-toast";
import { DeveloperProfileFormSteps } from "@/components/developer-profile/DeveloperProfileFormSteps";
import { EMPTY_DEVELOPER_PROFILE, DeveloperProfile } from "@/types/developerProfile";
import { TeachingModeToggle } from "@/components/TeachingModeToggle";

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile: loaded, loading, save } = useDeveloperProfile();
  const [form, setForm] = useState<DeveloperProfile>(EMPTY_DEVELOPER_PROFILE);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate("/"); }, [user, authLoading, navigate]);
  useEffect(() => { if (loaded) setForm(loaded); }, [loaded]);

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await save(form);
      toast({ title: "Profile saved", description: "Your developer profile has been updated." });
    } catch (e: any) {
      toast({ title: "Couldn't save profile", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="border-b border-border bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-9 h-9 rounded-lg icon-gradient flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">DevPack</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-300 focus:outline-none">
                {form.headshot_url ? (
                  <img src={form.headshot_url} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4 -ml-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B4F72] mb-2">My Developer Profile</h1>
          <p className="text-muted-foreground">
            This information auto-populates every package you build. Changes save when you click Save Profile.
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["basic", "experience", "headshot", "portfolio"]} className="space-y-4">
          {[
            { value: "basic", title: "Basic Information", icon: User, step: 1 as const },
            { value: "experience", title: "Experience & Credentials", icon: Briefcase, step: 2 as const },
            { value: "headshot", title: "Headshot", icon: Camera, step: 3 as const },
            { value: "portfolio", title: "Portfolio", icon: FolderOpen, step: 4 as const },
          ].map(({ value, title, icon: Icon, step }) => (
            <AccordionItem key={value} value={value} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden data-[state=open]:bg-slate-50/50">
              <AccordionTrigger className="hover:no-underline px-6 border-l-[3px] border-l-[#2E86AB]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1B4F72]/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#1B4F72]" />
                  </div>
                  <span className="font-semibold text-foreground">{title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <DeveloperProfileFormSteps step={step} profile={form} onChange={setForm} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Preferences</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Turn off Teaching Mode to hide intro modals and the Learning Guide panel for a cleaner workspace. Field tooltips remain available.
          </p>
          <TeachingModeToggle />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
            size="lg"
          >
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
