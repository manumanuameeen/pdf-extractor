import { Skeleton } from '../common/Skeleton'

export function LibrarySkeleton() {
  return (
    <div className="library-grid" style={{ pointerEvents: 'none' }} aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <article className="library-card" key={i} style={{ borderStyle: 'dashed' }}>
          <div className="library-info" style={{ display: 'grid', gap: '8px' }}>
            <Skeleton width="60%" height={18} borderRadius={6} />
            <Skeleton width="45%" height={14} borderRadius={4} />
          </div>
          <div className="library-actions" style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width={56} height={34} borderRadius={8} />
            <Skeleton width={68} height={34} borderRadius={8} />
          </div>
        </article>
      ))}
    </div>
  )
}
