import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hexagon, ChevronLeft, ChevronRight, CheckCircle2, User, Briefcase, Camera, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useDeveloperProfile } from "@/hooks/useDeveloperProfile";
import { DeveloperProfileFormSteps } from "@/components/developer-profile/DeveloperProfileFormSteps";
import { useToast } from "@/hooks/use-toast";
import { EMPTY_DEVELOPER_PROFILE, DeveloperProfile } from "@/types/developerProfile";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User, desc: "Tell us who you are" },
  { id: 2, title: "Experience", icon: Briefcase, desc: "Your background and credentials" },
  { id: 3, title: "Headshot", icon: Camera, desc: "Add a professional photo" },
  { id: 4, title: "Portfolio", icon: FolderOpen, desc: "Showcase your past work" },
] as const;

type StepId = 1 | 2 | 3 | 4;

const completeKey = (uid: string) => `devpack:onboardingComplete:${uid}`;
const stepKey = (uid: string) => `devpack:onboardingStep:${uid}`;

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile: loaded, exists, loading, save } = useDeveloperProfile();
  const [step, setStep] = useState<StepId>(1);
  const [form, setForm] = useState<DeveloperProfile>(EMPTY_DEVELOPER_PROFILE);
  const [saving, setSaving] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => { if (!authLoading && !user) navigate("/"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (loaded) setForm(loaded);
    if (loading || !user) return;
    // Send to dashboard only if user explicitly finished onboarding before.
    if (exists && localStorage.getItem(completeKey(user.id)) === "true") {
      navigate("/dashboard");
      return;
    }
    // Resume from last visited step if available (only once).
    if (restoredRef.current) return;
    const saved = localStorage.getItem(stepKey(user.id));
    if (saved) {
      const s = parseInt(saved, 10);
      if (s >= 1 && s <= 4) setStep(s as StepId);
    }
    restoredRef.current = true;
  }, [loaded, loading, exists, user, navigate]);

  // Persist the active step — only after restoring, so the initial step 1
  // doesn't overwrite the saved step before it's read.
  useEffect(() => {
    if (user && restoredRef.current) localStorage.setItem(stepKey(user.id), String(step));
  }, [step, user]);

  // Silent auto-save (best effort) — used on step change & before unload.
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);
  const silentSave = async () => {
    if (!user) return;
    if (!formRef.current.full_name?.trim() || !formRef.current.email?.trim()) return;
    try { await save(formRef.current); } catch (e) { console.error("Onboarding auto-save failed", e); }
  };

  // Warn on tab close if any data was entered.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasData = !!(formRef.current.full_name || formRef.current.email || formRef.current.bio || formRef.current.phone);
      if (hasData) {
        silentSave();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [user]);

  const canProceed = () => {
    if (step === 1) return form.full_name.trim().length > 0 && form.email.trim().length > 0;
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    // Auto-save current progress before advancing.
    await silentSave();
    if (step < 4) setStep((s) => (s + 1) as StepId);
  };

  const handleSaveAndExit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({
        title: "Add your name and email first",
        description: "We need a name and email to save your profile draft.",
        variant: "destructive",
      });
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      await save(form);
      toast({ title: "Progress saved", description: "You can finish your profile next time you log in." });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Couldn't save progress", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await save(form);
      if (user) {
        localStorage.setItem(completeKey(user.id), "true");
        localStorage.removeItem(stepKey(user.id));
      }
      toast({ title: "Welcome to DevPack!", description: "Your developer profile is set up." });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Couldn't save profile", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const progress = (step / 4) * 100;
  const ActiveIcon = STEPS[step - 1].icon;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="border-b border-border bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg icon-gradient flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">DevPack</span>
          </div>
          <button
            type="button"
            onClick={handleSaveAndExit}
            disabled={saving}
            className="text-sm text-muted-foreground hover:text-[#1B4F72] underline-offset-4 hover:underline transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Exit"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B4F72] mb-2">Welcome to DevPack</h1>
          <p className="text-muted-foreground">Let's set up your developer profile. This information will auto-populate every package you build.</p>
          {exists && (
            <p className="mt-3 inline-block text-xs bg-[#F39C12]/10 text-[#1B4F72] px-3 py-1 rounded-full">
              Picking up where you left off — Step {step} of 4
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isComplete = s.id < step;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id as StepId)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all duration-300 ${
                    isActive ? "bg-[#1B4F72]/5 border-2 border-[#1B4F72]" :
                    isComplete ? "bg-[#27AE60]/5 border-2 border-[#27AE60]/30" :
                    "bg-white border-2 border-border"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? "bg-[#1B4F72] text-white" :
                    isComplete ? "bg-[#27AE60] text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-[#1B4F72]" : "text-muted-foreground"}`}>
                    Step {s.id}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-[#1B4F72] text-white flex items-center justify-center">
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{STEPS[step - 1].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[step - 1].desc}</p>
            </div>
          </div>

          <DeveloperProfileFormSteps step={step} profile={form} onChange={setForm} />

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1) as StepId)}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < 4 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={saving}
                  className="text-sm text-muted-foreground hover:text-[#1B4F72] underline-offset-4 hover:underline transition-colors disabled:opacity-50"
                >
                  Save & Exit
                </button>
                <Button onClick={handleNext} className="bg-[#1B4F72] hover:bg-[#2E86AB] text-white">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={handleFinish}
                  disabled={saving || !form.full_name.trim() || !form.email.trim()}
                  className="bg-[#F39C12] hover:bg-[#F39C12]/90 text-white"
                >
                  {saving ? "Saving..." : "Save & Continue to Dashboard"}
                </Button>
                {(!form.full_name.trim() || !form.email.trim()) && (
                  <p className="text-xs text-[#E74C3C]">
                    Please complete your Full Name and Email in Step 1 to continue.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
