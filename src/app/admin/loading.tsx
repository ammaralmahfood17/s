export default function AdminLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-[#1a1916] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-28" />
        ))}
      </div>
      <div className="card h-96" />
    </div>
  );
}
