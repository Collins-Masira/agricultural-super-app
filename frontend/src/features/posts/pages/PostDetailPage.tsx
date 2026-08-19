import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { VerifiedBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/format'
import { postsService } from '@/services'
import { Comment, PostDetail } from '@/types/domain'
import { errorMessage } from '@/features/auth/AuthContext'
import { LikeButton } from '../components/LikeButton'
import { CommentSection } from '../components/CommentSection'
import '../components/posts.css'

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [likeLoading, setLikeLoading] = useState(false)

  const load = useCallback(async () => {
    if (!postId) return
    setStatus('loading')
    setError(null)
    try {
      const detail = await postsService.getPost(Number(postId))
      setPost(detail)
      setStatus('ready')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [postId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleToggleLike() {
    if (!post || likeLoading) return
    setLikeLoading(true)
    try {
      const result = await postsService.toggleLike(post.id)
      setPost((prev) =>
        prev ? { ...prev, likedByMe: result.likedByMe, likeCount: result.likeCount } : prev,
      )
    } finally {
      setLikeLoading(false)
    }
  }

  function handleCommentAdded(comment: Comment) {
    setPost((prev) => (prev ? { ...prev, comments: [...prev.comments, comment] } : prev))
  }

  if (status === 'loading') return <LoadingState label="Loading post…" />
  if (status === 'error') return <ErrorState message={error ?? undefined} onRetry={load} />
  if (!post) return <EmptyState title="Post not found" />

  const authorName =
    post.author.profile.firstName && post.author.profile.lastName
      ? `${post.author.profile.firstName} ${post.author.profile.lastName}`
      : post.author.user.username

  return (
    <article>
      <Card className="asa-post-detail" padded>
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

        <h1 className="asa-post-detail__title">{post.title}</h1>
        <p className="asa-post-detail__content">{post.content}</p>

        {post.images.length > 0 && (
          <div className="asa-post-detail__images">
            {post.images.map((image) => (
              <img key={image.id} src={image.imageUrl} alt="" />
            ))}
          </div>
        )}

        <footer className="asa-post-card__footer">
          <LikeButton
            liked={post.likedByMe}
            count={post.likeCount}
            onToggle={handleToggleLike}
            loading={likeLoading}
          />
        </footer>
      </Card>

      <CommentSection post={post} onCommentAdded={handleCommentAdded} />
    </article>
  )
}