export function Spinner({ full = false }: { full?: boolean }) {
  const dot = (
    <span className="block w-1.5 h-1.5 rounded-full bg-ink/70 animate-pulse" />
  );
  if (full) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex gap-1.5" aria-label="Laden">
          {dot}
          {dot}
          {dot}
        </div>
      </div>
    );
  }
  return <div className="flex gap-1.5">{dot}{dot}{dot}</div>;
}
