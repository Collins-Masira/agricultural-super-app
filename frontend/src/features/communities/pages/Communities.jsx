import { useState } from 'react'

export default function Communities({
  communities,
  experts,
  me,
  onToggle,
  onMessage,
}) {
  const [view, setView] = useState('communities')

  const [followMap, setFollowMap] = useState({
    '2': false,
    '4': false,
  })

  const toggleFollow = (id) => {
    setFollowMap((m) => ({
      ...m,
      [id]: !m[id],
    }))
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: '#f5f0e8',
          borderBottom: '1px solid #ddd5c0',
        }}
      >
        <div className="px-5 pt-12 pb-4">
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 26,
              fontWeight: 700,
              color: '#1e4d2b',
            }}
          >
            Network
          </h1>

          <p
            style={{
              fontSize: 13,
              color: '#6b4a35',
              marginTop: 4,
            }}
          >
            Communities, experts &amp; connections
          </p>
        </div>

        <div className="flex px-5 pb-3 gap-2">
          {['communities', 'experts'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                background: view === v ? '#1e4d2b' : '#ede6d6',
                color: view === v ? '#f5f0e8' : '#6b4a35',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 flex flex-col gap-4">
        {view === 'communities' &&
          communities.map((c) => (
            <CommunityCard
              key={c.id}
              community={c}
              onToggle={() => onToggle(c.id)}
            />
          ))}

        {view === 'experts' &&
          experts.map((e) => (
            <ExpertCard
              key={e.id}
              expert={e}
              followed={followMap[e.id] ?? (e.id === me.id)}
              isMe={e.id === me.id}
              onFollow={() => toggleFollow(e.id)}
              onMessage={() => onMessage(e.id)}
            />
          ))}
      </div>
    </div>
  )
}

function CommunityCard({ community, onToggle }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #e8deca',
        boxShadow: '0 2px 8px rgba(61,43,31,0.05)',
      }}
    >
      <div className="relative">
        <img
          src={community.image}
          alt={community.name}
          style={{
            width: '100%',
            height: 130,
            objectFit: 'cover',
            display: 'block',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(30,77,43,0.7), transparent)',
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <span
            style={{
              fontSize: 10,
              background: '#e8b84b',
              color: '#1e4d2b',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            {community.category}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 16,
                fontWeight: 600,
                color: '#1e4d2b',
                lineHeight: 1.3,
              }}
            >
              {community.name}
            </h3>

            <p
              style={{
                fontSize: 13,
                color: '#6b4a35',
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              {community.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div
            className="flex items-center gap-3"
            style={{
              fontSize: 12,
              color: '#9e8870',
            }}
          >
            <span>
              👥 {community.members.toLocaleString()} members
            </span>

            <span>
              📝 {community.recentPosts} posts this week
            </span>
          </div>

          <button
            onClick={onToggle}
            style={{
              padding: '7px 18px',
              borderRadius: '999px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              background: community.joined ? '#ede6d6' : '#1e4d2b',
              color: community.joined ? '#6b4a35' : '#f5f0e8',
              border: community.joined
                ? '1px solid #d4c9b0'
                : 'none',
              cursor: 'pointer',
            }}
          >
            {community.joined ? 'Joined ✓' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpertCard({
  expert,
  followed,
  isMe,
  onFollow,
  onMessage,
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '16px',
        border: '1px solid #e8deca',
        boxShadow: '0 2px 8px rgba(61,43,31,0.05)',
      }}
    >
      <div className="flex items-start gap-3">
        <img
          src={expert.avatar}
          alt={expert.name}
          className="rounded-full"
          style={{
            width: 52,
            height: 52,
            objectFit: 'cover',
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: '#1e4d2b',
              }}
            >
              {expert.name}
            </span>

            {expert.isExpert && (
              <span
                style={{
                  fontSize: 10,
                  background: '#d4e6d0',
                  color: '#1e4d2b',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}
              >
                Expert
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: 12,
              color: '#9e8870',
              marginTop: 1,
            }}
          >
            {expert.handle} · {expert.location}
          </p>

          <p
            style={{
              fontSize: 13,
              color: '#6b4a35',
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            {expert.bio.slice(0, 90)}…
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {expert.expertise.slice(0, 2).map((e) => (
              <span
                key={e}
                style={{
                  fontSize: 11,
                  background: '#f5f0e8',
                  color: '#6b4a35',
                  padding: '2px 9px',
                  borderRadius: '999px',
                  border: '1px solid #e8deca',
                }}
              >
                {e}
              </span>
            ))}
          </div>

          <div
            className="flex items-center gap-4 mt-3"
            style={{
              fontSize: 12,
              color: '#9e8870',
            }}
          >
            <span>
              <b style={{ color: '#1e4d2b' }}>
                {expert.followers.toLocaleString()}
              </b>{' '}
              followers
            </span>

            <span>
              <b style={{ color: '#1e4d2b' }}>
                {expert.following}
              </b>{' '}
              following
            </span>
          </div>

          {!isMe && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={onFollow}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '999px',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                  background: followed ? '#ede6d6' : '#1e4d2b',
                  color: followed ? '#6b4a35' : '#f5f0e8',
                  border: followed
                    ? '1px solid #d4c9b0'
                    : 'none',
                  cursor: 'pointer',
                }}
              >
                {followed ? 'Following ✓' : 'Follow'}
              </button>

              <button
                onClick={onMessage}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '999px',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif",
                  background: '#ede6d6',
                  color: '#6b4a35',
                  border: '1px solid #d4c9b0',
                  cursor: 'pointer',
                }}
              >
                Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}