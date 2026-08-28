import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, PostContent, ReactionPicker, RepostButton, SaveButton, ShareButton, VerifiedBadge } from '@/components/ui'
import { CommentIcon, RepeatIcon } from '@/components/icons'
import { formatRelativeTime } from '@/lib/format'
import { removeReaction, setReaction, toggleRepost, toggleSave } from '@/store/slices/postsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PostMenu } from './PostMenu'

function displayName(actor) {
  return actor.profile.firstName && actor.profile.lastName
    ? `${actor.profile.firstName} ${actor.profile.lastName}`
    : actor.user.username
}

function PostBody({ post }) {
  return (
    <>
      <h2 className="asa-post-card__title">
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </h2>
      <PostContent content={post.content} className="asa-post-card__excerpt" />
      {post.images.length > 0 && (
        <div className={`asa-post-card__images asa-post-card__images--${post.images.length}`}>
          {post.images.map((image) => (
            <img key={image.id} src={image.imageUrl} alt="" loading="lazy" />
          ))}
        </div>
      )}
    </>
  )
}

export function PostCard({ post }) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const reactionLoading = useAppSelector((state) => state.posts.reactionLoadingPostId === post.id)
  const saveLoading = useAppSelector((state) => state.posts.saveLoadingPostId === post.id)
  const repostLoading = useAppSelector((state) => state.posts.repostLoadingPostId === post.id)

  const authorName = displayName(post.author)
  const displayedPost = post.originalPost ?? post

  return (
    <article className="asa-post-card asa-card">
      <header className="asa-post-card__header">
        <Avatar imageUrl={post.author.profile.profileImageUrl} name={authorName} username={post.author.user.username} size="md" />
        <div className="asa-post-card__meta">
          <div className="asa-post-card__author">
            <Link to={`/experts/${post.author.user.id}`} className="asa-post-card__name">
              {authorName}
            </Link>
            <VerifiedBadge profile={post.author.profile} />
          </div>
          <span className="asa-post-card__time">{formatRelativeTime(post.createdAt)}</span>
        </div>
        <div className="asa-post-card__menu">
          <PostMenu post={post} />
        </div>
      </header>

      {post.originalPost && (
        <p className="asa-post-card__repost-note">
          <RepeatIcon width={14} height={14} /> Reposted from {displayName(post.originalPost.author)}
        </p>
      )}

      {post.content && post.originalPost && (
        <PostContent content={post.content} className="asa-post-card__excerpt" />
      )}

      {displayedPost.isAnnouncement && (
        <span className="asa-post-card__announcement">📢 Community Announcement</span>
      )}

      {post.originalPost ? (
        <div className="asa-post-card__reposted">
          <PostBody post={post.originalPost} />
        </div>
      ) : (
        <PostBody post={post} />
      )}

      <footer className="asa-post-card__footer">
        <ReactionPicker
          reactionCounts={post.reactionCounts}
          myReaction={post.myReaction}
          loading={reactionLoading}
          onReact={(reactionType) => dispatch(setReaction({ postId: post.id, reactionType }))}
          onRemove={() => dispatch(removeReaction(post.id))}
        />
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
        <RepostButton
          reposted={post.repostedByMe}
          count={post.repostCount}
          loading={repostLoading}
          onToggle={() => dispatch(toggleRepost(post.id))}
        />
        <SaveButton saved={post.savedByMe} loading={saveLoading} onToggle={() => dispatch(toggleSave(post.id))} />
        <ShareButton postId={post.id} />
        <Badge variant="default">{post.author.user.role}</Badge>
      </footer>
    </article>
  )
}
