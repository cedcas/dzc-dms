export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-20 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-lg" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-32 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="h-10 bg-muted/50" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 border-t bg-card px-4 flex items-center gap-4">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded" />
            <div className="h-5 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
