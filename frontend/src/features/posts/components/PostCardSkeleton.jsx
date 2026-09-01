import { SkeletonBlock, SkeletonCircle, SkeletonLine } from '@/components/ui'

export function PostCardSkeleton() {
  return (
    <article className="asa-post-card asa-card asa-post-card-skeleton" aria-hidden="true">
      <header className="asa-post-card__header">
        <SkeletonCircle />
        <div className="asa-post-card__meta asa-post-card-skeleton__lines">
          <SkeletonLine width="40%" />
          <SkeletonLine width="25%" height={0.65} />
        </div>
      </header>
      <div className="asa-post-card-skeleton__body">
        <SkeletonLine width="90%" />
        <SkeletonLine width="70%" />
      </div>
      <SkeletonBlock aspectRatio="1 / 1" />
    </article>
  )
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </>
  )
}
