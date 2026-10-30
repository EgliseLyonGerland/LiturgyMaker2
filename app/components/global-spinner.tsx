export function GlobalSpinner() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 overflow-hidden bg-foreground/50">
      <div className="h-0.5 flex-1 animate-global-spinner bg-radial from-foreground to-transparent" />
    </div>
  );
}
