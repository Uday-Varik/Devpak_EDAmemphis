import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full bg-card rounded-xl shadow-sm border border-border p-8 text-center transition-all duration-300 hover:shadow-md">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground mb-6">
            Please refresh the page. Your data is saved.
          </p>
          <Button
            variant="accent"
            size="lg"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
