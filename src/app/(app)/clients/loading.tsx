export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-8 w-64 bg-muted rounded-lg" />
        <div className="h-8 w-32 bg-muted rounded-lg" />
        <div className="h-8 w-20 bg-muted rounded-lg" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="h-10 bg-muted/50" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-t bg-card px-4 flex items-center gap-4">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-5 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
