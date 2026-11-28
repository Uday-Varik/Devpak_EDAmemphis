import { Link } from "react-router-dom";
import { Hexagon } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

interface LegalPageProps {
  source: string;
}

/** Shared layout for the privacy policy and terms of service. */
const LegalPage = ({ source }: LegalPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <Hexagon className="h-5 w-5" />
            DevPack
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 text-foreground">
        <div
          role="note"
          className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          This page is pending legal review and may change before it is final.
        </div>
        {renderMarkdown(source)}
      </main>
    </div>
  );
};

export default LegalPage;
