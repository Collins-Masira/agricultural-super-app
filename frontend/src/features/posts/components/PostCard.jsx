import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button } from '@/components/ui'
import { VerifiedBadge } from '@/components/ui'
import { CommentIcon } from '@/components/icons'
import { formatRelativeTime } from '@/lib/format'
import { toggleLike } from '@/store/slices/postsSlice'
import { useAppDispatch } from '@/store/hooks'
import { LikeButton } from './LikeButton'
import './posts.css'

export function PostCard({ post }) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [likeLoading, setLikeLoading] = useState(false)

  const authorName =
    post.author.profile.firstName && post.author.profile.lastName
      ? `${post.author.profile.firstName} ${post.author.profile.lastName}`
      : post.author.user.username

  async function handleToggleLike() {
    if (likeLoading) return
    setLikeLoading(true)
    try {
      await dispatch(toggleLike(post.id)).unwrap()
    } finally {
      setLikeLoading(false)
    }
  }

  return (
    <article className="asa-post-card asa-card">
      <header className="asa-post-card__header">
        <Avatar
          imageUrl={post.author.profile.profileImageUrl}
          name={authorName}
          username={post.author.user.username}
          size="md"
        />
        <div className="asa-post-card__meta">
          <div className="asa-post-card__author">
            <Link to={`/experts/${post.author.user.id}`} className="asa-post-card__name">
              {authorName}
            </Link>
            <VerifiedBadge profile={post.author.profile} />
          </div>
          <span className="asa-post-card__time">{formatRelativeTime(post.createdAt)}</span>
        </div>
      </header>

      <h2 className="asa-post-card__title">
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </h2>

      <p className="asa-post-card__excerpt">{post.content}</p>

      {post.images.length > 0 && (
        <div className={`asa-post-card__images asa-post-card__images--${post.images.length}`}>
          {post.images.map((image) => (
            <img key={image.id} src={image.imageUrl} alt="" loading="lazy" />
          ))}
        </div>
      )}

      <footer className="asa-post-card__footer">
        <LikeButton liked={post.likedByMe} count={post.likeCount} onToggle={handleToggleLike} loading={likeLoading} />
        <Button
          variant="ghost"
          size="sm"
          className="asa-post__action"
          onClick={() => navigate(`/posts/${post.id}#comments`)}
        >
          <CommentIcon width={18} height={18} />
          <span>{post.comments.length}</span>
          <span className="visually-hidden">Comments</span>
        </Button>
        <Badge variant="default">{post.author.user.role}</Badge>
      </footer>
    </article>
  )
}