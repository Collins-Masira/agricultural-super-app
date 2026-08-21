import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui'
import { VerifiedBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/format'
import { addComment, fetchPost, toggleLike } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { LikeButton } from '../components/LikeButton'
import { CommentSection } from '../components/CommentSection'
import '../components/posts.css'

export function PostDetailPage() {
  const { postId } = useParams()
  const dispatch = useAppDispatch()

  const post = useAppSelector((state) => state.posts.current)
  const status = useAppSelector((state) => state.posts.currentStatus)
  const error = useAppSelector((state) => state.posts.currentError)
  const likeLoading = useAppSelector((state) => state.posts.likeLoadingPostId === post?.id)

  useEffect(() => {
    if (postId) dispatch(fetchPost(Number(postId)))
  }, [dispatch, postId])

  function handleToggleLike() {
    if (post && !likeLoading) dispatch(toggleLike(post.id))
  }

  if (status === 'loading') return <LoadingState label="Loading post…" />
  if (status === 'error') return <ErrorState message={error ?? undefined} onRetry={() => postId && dispatch(fetchPost(Number(postId)))} />
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

      <CommentSection post={post} onCommentAdded={(comment) => dispatch(addComment({ postId: post.id, content: comment }))} />
    </article>
  )
}