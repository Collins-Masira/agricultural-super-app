import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, EmptyState, ErrorState, LoadingState, Tabs, VerifiedBadge } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCommunity, toggleMembership } from '@/store/slices/communitiesSlice'
import '../communities.css'

const TABS = [
  { value: 'announcements', label: 'Announcements' },
  { value: 'feed', label: 'Feed' },
  { value: 'members', label: 'Members' },
  { value: 'about', label: 'About' },
]

export function CommunityDetailPage() {
  const { communityId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const [tab, setTab] = useState('feed')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const community = useAppSelector((state) => state.communities.current)
  const status = useAppSelector((state) => state.communities.currentStatus)
  const error = useAppSelector((state) => state.communities.currentError)
  const loading = useAppSelector((state) => state.communities.membershipLoadingId === Number(communityId))

  useEffect(() => {
    if (communityId) dispatch(fetchCommunity(Number(communityId)))
  }, [dispatch, communityId])

  useEffect(() => {
    if (communityId) dispatch(fetchCommunityPosts(Number(communityId)))
  }, [dispatch, communityId])

  if (status === 'loading') return <LoadingState label="Loading community…" />
  if (status === 'error' || !community) {
    return <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchCommunity(Number(communityId)))} />
  }

  const isMember = community.members.some((m) => m.userId === user?.user.id)
  const isCreator = community.createdBy === user?.user.id

  function handleToggleMembership() {
    if (loading) return
    dispatch(toggleMembership({ communityId: community.id, userId: user.user.id }))
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/communities')}>
        &larr; Back to communities
      </Button>

      <section className="asa-community-hero">
        {community.imageUrl && <img className="asa-community-hero__image" src={community.imageUrl} alt="" />}
        <div className="asa-community-hero__header">
          <div>
            <h1 className="asa-community-hero__name">
              <span>{community.name}</span>
              {isAdmin && <Badge variant="default">Admin</Badge>}
            </h1>
            <p className="asa-community-hero__meta">
              {community.members.length} member{community.members.length === 1 ? '' : 's'} · created by{' '}
              {community.creator?.profile.firstName || community.creator?.user.username}
            </p>
          </div>
          {!isCreator && (
            <Button variant={isMember ? 'secondary' : 'primary'} onClick={handleToggle} loading={loading} aria-pressed={isMember}>
              {isMember ? 'Leave community' : 'Join community'}
            </Button>
          )}
        </div>
        {community.description && <p>{community.description}</p>}
      </section>

      <Tabs items={TABS} value={tab} onChange={setTab} className="asa-community-tabs" />

      {tab === 'announcements' && (
        <>
          {announcements.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              description="Community admins can post announcements from the Feed tab."
              icon="📢"
            />
          ) : (
            announcements.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </>
      )}

      {tab === 'feed' && (
        <>
          {allowedToPost && (
            <QuickComposer
              communityId={community.id}
              placeholder={`Share something with ${community.name}…`}
              allowAnnouncement={isAdmin}
              onPosted={() => dispatch(fetchCommunityPosts(community.id))}
            />
          )}
          {!allowedToPost && isMember && (
            <p className="asa-community-join-hint">
              🔒 Only {community.postingPermission === 'experts_only' ? 'experts' : 'admins'} can post in this
              community right now.
            </p>
          )}
          {!isMember && <p className="asa-community-join-hint">👋 Join this community to start posting.</p>}

          {postsStatus === 'loading' && <LoadingState label="Loading posts…" />}
          {postsStatus === 'error' && (
            <ErrorState message={postsError ?? undefined} onRetry={() => dispatch(fetchCommunityPosts(community.id))} />
          )}
          {postsStatus === 'ready' && posts.length === 0 && (
            <EmptyState
              title="No posts yet"
              description="Be the first to share something with this community."
              icon="🌾"
            />
          )}
          {postsStatus === 'ready' && posts.map((post) => <PostCard key={post.id} post={post} />)}
        </>
      )}

      {tab === 'members' && (
        <>
          {community.members.length === 0 ? (
            <EmptyState title="No members yet" icon="👥" />
          ) : (
            <ul className="asa-community-members">
              {community.members.map((membership) => {
                const member = membership.member
                const name =
                  member?.profile.firstName && member?.profile.lastName
                    ? `${member.profile.firstName} ${member.profile.lastName}`
                    : member?.user.username
                const isRowCreator = community.createdBy === member?.user.id
                const rowLoading = memberActionLoadingUserId === member?.user.id
                return (
                  <li key={membership.id} className="asa-community-member">
                    <div className="asa-community-member-row">
                      <Avatar imageUrl={member?.profile.profileImageUrl} name={name} username={member?.user.username} size="sm" />
                      <div className="asa-community-member-row__identity">
                        <span className="asa-community-member__name">{name}</span>
                        <VerifiedBadge profile={member?.profile ?? { isVerified: false }} />
                      </div>
                      <div className="asa-community-member-row__badges">
                        {member?.user.role === 'expert' && <Badge variant="default">Expert</Badge>}
                        {isRowCreator ? (
                          <span className="asa-community-member__badge">Creator</span>
                        ) : membership.role === 'admin' ? (
                          <span className="asa-community-member__badge">Admin</span>
                        ) : null}
                      </div>
                      {isAdmin && !isRowCreator && (
                        <div className="asa-community-member-row__actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={rowLoading}
                            onClick={() => handleSetRole(member.user.id, membership.role === 'admin' ? 'member' : 'admin')}
                          >
                            {membership.role === 'admin' ? 'Demote' : 'Promote'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={rowLoading}
                            onClick={() => handleRemoveMember(member.user.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {tab === 'about' && (
        <div className="asa-community-about">
          <p>{community.description || 'No description provided.'}</p>
          <dl>
            <dt>Created by</dt>
            <dd>{community.creator?.profile.firstName || community.creator?.user.username}</dd>
            <dt>Created on</dt>
            <dd>{formatDate(community.createdAt)}</dd>
            <dt>Members</dt>
            <dd>{community.members.length}</dd>
            <dt>Who can post</dt>
            <dd>{community.postingPermission.replace('_', ' ')}</dd>
            <dt>Who can comment</dt>
            <dd>{community.commentsEnabled ? community.messagingPermission.replace('_', ' ') : 'Comments closed'}</dd>
          </dl>
        </div>
      )}

      {settingsOpen && (
        <CommunitySettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} community={community} />
      )}
    </>
  )
}
