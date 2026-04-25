import { Component, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureReactException(error, errorInfo);
  }

  private isChunkLoadError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("failed to fetch dynamically imported module") ||
      message.includes("loading chunk") ||
      message.includes("loading css chunk") ||
      message.includes("mime type")
    );
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isStaleBundle =
        this.state.error && this.isChunkLoadError(this.state.error);

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
          <div className="rounded-full bg-amber-500/10 p-4 mb-4">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>

          <h2 className="text-xl font-semibold mb-2">
            {isStaleBundle ? "Update Available" : "Something went wrong"}
          </h2>

          <p className="text-muted-foreground max-w-md mb-6">
            {isStaleBundle
              ? "A new version of the app has been deployed. Please refresh to get the latest version."
              : "Failed to load this section. This might be due to a network issue or an outdated cache."}
          </p>

          <Button onClick={this.handleReload} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>

          {this.state.error && !isStaleBundle && (
            <details className="mt-6 text-left w-full max-w-md">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Technical details
              </summary>
              <pre className="mt-2 p-3 rounded-md bg-muted text-xs overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
