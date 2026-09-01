import { Link } from 'react-router-dom'
import { ImageIcon, PlayIcon } from '@/components/icons'
import './posts.css'

/** Instagram-style 3-column thumbnail grid for a profile's posts/saved
 * items. Posts without an image show a text snippet tile instead of a
 * blank square; Reels (posts with a video) show a muted video poster
 * with a play badge, falling back to their cover image if one exists. */
export function PostGrid({ posts }) {
  if (posts.length === 0) return null

  return (
    <div className="asa-post-grid">
      {posts.map((post) => {
        const cover = post.images[0]
        const isReel = Boolean(post.videoUrl)
        return (
          <Link key={post.id} to={`/posts/${post.id}`} className="asa-post-grid__item">
            {cover ? (
              <img
                src={cover.imageUrl}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : isReel ? (
              <video src={post.videoUrl} muted playsInline preload="metadata" />
            ) : (
              <span className="asa-post-grid__text">{post.title}</span>
            )}
            {isReel && (
              <span className="asa-post-grid__badge" aria-hidden="true">
                <PlayIcon width={14} height={14} />
              </span>
            )}
            {!isReel && post.images.length > 1 && (
              <span className="asa-post-grid__badge" aria-hidden="true">
                <ImageIcon width={14} height={14} />
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
