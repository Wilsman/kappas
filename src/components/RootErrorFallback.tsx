export function RootErrorFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reload the app to try again.
        </p>
      </div>
      <button
        type="button"
        className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </main>
  );
}
