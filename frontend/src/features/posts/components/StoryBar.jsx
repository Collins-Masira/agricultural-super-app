import { useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { StoryViewer } from '@/features/stories/components/StoryViewer'
import { StoryItem } from './StoryItem'

function displayName(actor) {
  return actor.profile.firstName && actor.profile.lastName
    ? `${actor.profile.firstName} ${actor.profile.lastName}`
    : actor.user.username
}

const MAX_SLIDES_PER_AUTHOR = 4

/** Horizontal "Farmer updates" bar at the top of the feed. There is no
 * stories/status backend feature, so each circle opens a StoryViewer built
 * from that person's real recent posts (image posts become photo slides,
 * text-only posts become text slides) rather than any fabricated content. */
export function StoryBar({ posts }) {
  const { user } = useAuth()
  const [openIndex, setOpenIndex] = useState(null)

  const stories = useMemo(() => {
    const byAuthor = new Map()
    for (const post of posts) {
      const id = post.author.user.id
      if (!byAuthor.has(id)) byAuthor.set(id, { author: post.author, posts: [] })
      const entry = byAuthor.get(id)
      if (entry.posts.length < MAX_SLIDES_PER_AUTHOR) entry.posts.push(post)
    }

    return Array.from(byAuthor.values()).map(({ author, posts: authorPosts }) => ({
      authorId: author.user.id,
      authorName: displayName(author),
      authorUsername: author.user.username,
      authorImageUrl: author.profile.profileImageUrl,
      slides: authorPosts.map((post) =>
        post.images[0]
          ? { id: post.id, type: 'image', imageUrl: post.images[0].imageUrl, caption: post.content, createdAt: post.createdAt }
          : { id: post.id, type: 'text', caption: post.title || post.content, createdAt: post.createdAt },
      ),
    }))
  }, [posts])

  return (
    <div className="asa-story-bar">
      {user && (
        <StoryItem
          to="/create/story"
          isAdd
          imageUrl={user.profile.profileImageUrl}
          name={displayName(user)}
          username={user.user.username}
          label="Your story"
        />
      )}
      {stories.map((story, index) => (
        <StoryItem
          key={story.authorId}
          onClick={() => setOpenIndex(index)}
          imageUrl={story.authorImageUrl}
          name={story.authorName}
          username={story.authorUsername}
          label={story.authorName.split(' ')[0]}
        />
      ))}

      {openIndex !== null && (
        <StoryViewer stories={stories} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  )
}
