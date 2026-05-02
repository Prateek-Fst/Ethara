export function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: radius, display: 'block', ...style }}
    />
  );
}

export function SkeletonStatGrid() {
  return (
    <div className="stats-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="stat-card">
          <Skeleton width={44} height={44} radius={10} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="60%" height={26} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCardGrid({ count = 4 }) {
  return (
    <div className="projects-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="project-card">
          <Skeleton width="70%" height={20} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="40%" height={14} />
          <Skeleton width="100%" height={6} radius={3} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton width={70} height={28} />
            <Skeleton width={70} height={28} />
          </div>
        </div>
      ))}
    </div>
  );
}
