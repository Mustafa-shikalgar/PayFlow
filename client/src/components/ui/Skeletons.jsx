export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="overflow-hidden">
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex items-center gap-4 border-b border-gray-100 px-6 py-4 last:border-0 dark:border-gray-800">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <div key={colIdx} className="skeleton h-4" style={{ flex: 1 }} />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="glass-card p-6">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton mt-4 h-8 w-32" />
        <div className="skeleton mt-2 h-3 w-20" />
      </div>
    ))}
  </div>
);