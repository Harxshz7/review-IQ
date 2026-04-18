export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((i) => (
          <div key={i} className="bg-card border border-border-dark rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl shimmer-bg" />
            <div className="h-8 w-20 rounded-lg shimmer-bg" />
            <div className="h-4 w-32 rounded shimmer-bg" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'feature') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <div key={i} className="bg-card border border-border-dark rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl shimmer-bg" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded shimmer-bg" />
                <div className="h-3 w-16 rounded shimmer-bg" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full shimmer-bg" />
              <div className="h-1.5 w-3/4 rounded-full shimmer-bg" />
              <div className="h-1.5 w-1/2 rounded-full shimmer-bg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className="bg-card border border-border-dark rounded-2xl p-6 space-y-4">
        <div className="h-5 w-48 rounded shimmer-bg" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-7 w-20 rounded-lg shimmer-bg" />
          ))}
        </div>
        <div className="h-64 rounded-xl shimmer-bg" />
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="bg-card border border-border-dark rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border-dark flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-20 rounded-lg shimmer-bg" />
          ))}
        </div>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border-dark/50">
            <div className="flex-1 h-4 rounded shimmer-bg" />
            <div className="w-16 h-5 rounded shimmer-bg" />
            <div className="w-16 h-4 rounded shimmer-bg" />
            <div className="w-8 h-5 rounded shimmer-bg" />
          </div>
        ))}
      </div>
    )
  }

  // Default card skeleton
  return (
    <div className="space-y-4">
      {items.map((i) => (
        <div key={i} className="bg-card border border-border-dark rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg shimmer-bg" />
            <div className="flex-1 h-4 rounded shimmer-bg" />
          </div>
          <div className="h-3 w-3/4 rounded shimmer-bg" />
          <div className="h-3 w-1/2 rounded shimmer-bg" />
        </div>
      ))}
    </div>
  )
}
