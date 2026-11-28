import { Link } from "react-router-dom";
import { Hexagon } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg icon-gradient flex items-center justify-center">
              <Hexagon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">DevPack</span>
          </div>

          {/* Copyright and legal links */}
          <div className="flex flex-col items-center gap-2 md:items-end">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DevPack. Built for Emerging Developer Academy.
            </p>
            <nav aria-label="Legal" className="flex gap-4 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
