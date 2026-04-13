import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
}

export default function Skeleton({ width = '100%', height = '16px', borderRadius = '8px', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width, height, borderRadius }}
        />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="18px" width="60%" />
      <Skeleton height="14px" width="40%" />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
