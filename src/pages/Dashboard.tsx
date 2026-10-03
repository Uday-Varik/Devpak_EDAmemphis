import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, MapPin, Calendar, Plus, User, LogOut, LayoutDashboard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { geocodeToSiteFields } from "@/utils/geocodeAddress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TeachingModeToggle } from "@/components/TeachingModeToggle";

interface Project {
  id: string;
  name: string;
  address: string | null;
  status: string;
  progress: number;
  updated_at: string;
}

interface Profile {
  full_name: string | null;
  photo_url?: string | null;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectAddress, setNewProjectAddress] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      // Check if developer profile exists; if not, send to onboarding
      (async () => {
        const { data } = await supabase
          .from("developer_profiles" as any)
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!data) {
          navigate("/onboarding");
          return;
        }
        fetchData();
      })();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Name comes from the developer profile first; legacy profile only if empty.
      const [{ data: devProfile }, { data: profileData }] = await Promise.all([
        supabase.from("developer_profiles" as any).select("full_name").eq("user_id", user!.id).maybeSingle(),
        supabase.from("profiles").select("full_name, photo_url").eq("user_id", user!.id).maybeSingle(),
      ]);
      const devName = ((devProfile as any)?.full_name || "").trim();
      setProfile({
        ...(profileData || { photo_url: null }),
        full_name: devName || profileData?.full_name || null,
      } as any);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);
    try {
      const address = newProjectAddress.trim();
      const { data: created, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name: newProjectName, address: address || null })
        .select("id")
        .single();

      if (error) throw error;

      // Prefill Site & Location from the entered address (best effort).
      if (address) {
        try {
          const siteData = await geocodeToSiteFields(address);
          await supabase.from("project_details").upsert(
            { project_id: created.id, section: "site-location", data: siteData, completed: false },
            { onConflict: "project_id,section" }
          );
        } catch (e) {
          console.warn("Address prefill failed", e);
        }
      }

      toast({ title: "Project created!", description: "Opening your new project…" });

      setShowNewProjectModal(false);
      setNewProjectName("");
      setNewProjectAddress("");
      navigate(`/project/${created.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete project_details first
      await supabase.from("project_details").delete().eq("project_id", deleteTarget.id);
      const { error } = await supabase.from("projects").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "Project deleted", description: `"${deleteTarget.name}" has been permanently deleted.` });
      setDeleteTarget(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Developer";

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="border-b border-border bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-9 h-9 rounded-lg icon-gradient flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <span className="text-xl font-bold text-foreground">DevPack</span>
          </div>
          {/* Avatar Dropdown */}
          <div className="flex items-center gap-4">
            <TeachingModeToggle />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-300 focus:outline-none">
                {(profile as any)?.photo_url ? (
                  <img src={(profile as any).photo_url} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Welcome back, {displayName}
            </h1>
            <p className="text-muted-foreground">
              Manage your development packages and projects
            </p>
          </div>
          <Button variant="accent" size="lg" onClick={() => setShowNewProjectModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Grid or Empty State */}
        {projects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-md">
            <div className="w-16 h-16 rounded-xl icon-gradient flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No projects yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start building your first professional financing package. Our guided process makes it easy.
            </p>
            <Button variant="accent" size="lg" onClick={() => setShowNewProjectModal(true)}>
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                {/* Status Badge & Delete */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      project.status === "complete"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}
                  >
                    {project.status === "complete" ? "Complete" : "Draft"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Project Name */}
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>

                {/* Address */}
                {project.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{project.address}</span>
                  </div>
                )}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Last Edited */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Last edited {formatDate(project.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <Dialog open={showNewProjectModal} onOpenChange={setShowNewProjectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Start a new development package. You can add more details later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="e.g., 123 Main St Duplex"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectAddress">Property Address</Label>
              <Input
                id="projectAddress"
                placeholder="e.g., 123 Main St, Memphis, TN"
                value={newProjectAddress}
                onChange={(e) => setNewProjectAddress(e.target.value)}
              />
            </div>

            <Button type="submit" variant="accent" className="w-full" size="lg" disabled={creating}>
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
