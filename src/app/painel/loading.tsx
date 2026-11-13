export default function PanelLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
      />
      <span>Carregando...</span>
    </div>
  );
}
