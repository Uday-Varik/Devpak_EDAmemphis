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

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DevPack. Built for Emerging Developer Academy.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
