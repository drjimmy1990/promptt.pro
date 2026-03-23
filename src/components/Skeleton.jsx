export function SkeletonText({ width = '80%', lines = 3 }) {
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: i === lines - 1 ? '50%' : width }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

export function SkeletonTags({ count = 5 }) {
  return (
    <div className="tags-row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-tag" style={{ width: 60 + Math.random() * 40 }} />
      ))}
    </div>
  );
}
