export default function ReportsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 h-24" />
        ))}
      </div>
      <div className="rounded-xl border bg-card h-48" />
    </div>
  );
}
