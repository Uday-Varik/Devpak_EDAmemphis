import { Hexagon, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Navbar = ({ onLoginClick, onSignupClick }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("photo_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setPhotoUrl((data as any)?.photo_url || null);
        });
    }
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate(user ? "/dashboard" : "/")}
        >
          <div className="w-9 h-9 rounded-lg icon-gradient flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">DevPack</span>
        </div>

        {/* CTA or Avatar */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-300 focus:outline-none">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                  />
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
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLoginClick}>
              Sign in
            </Button>
            <Button variant="accent" onClick={onSignupClick}>
              Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
