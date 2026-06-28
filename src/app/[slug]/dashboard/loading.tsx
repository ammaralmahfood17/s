export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-48 bg-card rounded-xl" />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>

      {/* Content block */}
      <div className="card h-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card h-40" />
        <div className="card h-40" />
      </div>
    </div>
  );
}
