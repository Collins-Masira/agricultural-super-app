import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, ErrorState, LoadingState, PageHeader } from '@/components/ui'
import { formatRelativeTime } from '@/lib/format'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchAdminStats } from '@/store/slices/adminSlice'
import '../admin.css'

function StatCard({ label, value, meta }) {
  return (
    <Card className="asa-admin-stat-card" padded>
      <p className="asa-admin-stat-card__label">{label}</p>
      <p className="asa-admin-stat-card__value">{value}</p>
      {meta && <p className="asa-admin-stat-card__meta">{meta}</p>}
    </Card>
  )
}

export function AdminDashboardPage() {
  const dispatch = useAppDispatch()
  const stats = useAppSelector((state) => state.admin.stats)
  const status = useAppSelector((state) => state.admin.statsStatus)
  const error = useAppSelector((state) => state.admin.statsError)

  useEffect(() => {
    dispatch(fetchAdminStats())
  }, [dispatch])

  if (status === 'loading' || status === 'idle') return <LoadingState label="Loading dashboard…" />
  if (status === 'error' || !stats) {
    return <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchAdminStats())} />
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live platform statistics." />

      <div className="asa-admin-stats">
        <StatCard
          label="Total users"
          value={stats.users.total}
          meta={`${stats.users.active} active · ${stats.users.inactive} deactivated`}
        />
        <StatCard
          label="By role"
          value={stats.users.by_role.farmer}
          meta={`farmers · ${stats.users.by_role.expert} experts · ${stats.users.by_role.admin} admins`}
        />
        <StatCard label="Posts" value={stats.posts.total} meta={`${stats.comments.total} comments`} />
        <StatCard label="Communities" value={stats.communities.total} />
        <Link to="/admin/reports" className="asa-admin-stat-card-link">
          <StatCard
            label="Reports"
            value={stats.reports.pending}
            meta={`${stats.reports.total} total · pending review`}
          />
        </Link>
        <StatCard label="Conversations" value={stats.conversations.total} meta={`${stats.messages.total} messages sent`} />
        <StatCard
          label="AI Assistant"
          value={stats.ai.configured ? 'Configured' : 'Not configured'}
          meta={`provider: ${stats.ai.provider}${stats.ai.model ? ` · ${stats.ai.model}` : ''}`}
        />
      </div>

      <section className="asa-admin-section">
        <h2 className="asa-admin-section__title">Recent registrations</h2>
        <Card padded>
          {stats.recentUsers.length === 0 ? (
            <p className="asa-admin-list-row__meta">No users yet.</p>
          ) : (
            <div className="asa-admin-list">
              {stats.recentUsers.map((u) => (
                <div key={u.user.id} className="asa-admin-list-row">
                  <div className="asa-admin-list-row__body">
                    <Link to="/admin/users" className="asa-admin-list-row__title">
                      {u.user.username}
                    </Link>
                    <span className="asa-admin-list-row__meta">
                      {u.user.email} · joined {formatRelativeTime(u.user.createdAt)}
                    </span>
                  </div>
                  <Badge>{u.user.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="asa-admin-section">
        <h2 className="asa-admin-section__title">Recent posts</h2>
        <Card padded>
          {stats.recentPosts.length === 0 ? (
            <p className="asa-admin-list-row__meta">No posts yet.</p>
          ) : (
            <div className="asa-admin-list">
              {stats.recentPosts.map((post) => (
                <div key={post.id} className="asa-admin-list-row">
                  <div className="asa-admin-list-row__body">
                    <Link to={`/posts/${post.id}`} className="asa-admin-list-row__title">
                      {post.title}
                    </Link>
                    <span className="asa-admin-list-row__meta">
                      by {post.author.user.username} · {formatRelativeTime(post.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </>
  )
}
