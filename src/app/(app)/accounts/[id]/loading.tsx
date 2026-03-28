export default function AccountDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-muted rounded" />
          <div className="h-7 w-64 bg-muted rounded" />
          <div className="h-5 w-24 bg-muted rounded" />
        </div>
        <div className="h-9 w-20 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 h-20" />
        ))}
      </div>
      <div className="rounded-xl border bg-card h-64" />
      <div className="rounded-xl border bg-card h-48" />
    </div>
  );
}
