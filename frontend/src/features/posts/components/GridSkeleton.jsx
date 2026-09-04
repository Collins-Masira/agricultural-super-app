import { SkeletonBlock } from '@/components/ui'
import './posts.css'

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="asa-post-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} />
      ))}
    </div>
  )
}
