import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, ErrorState, LoadingState, PageHeader, Tabs } from '@/components/ui'
import { formatRelativeTime } from '@/lib/format'
import { errorMessage } from '@/features/auth/AuthContext'
import { adminService } from '@/services'
import '../admin.css'

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: '', label: 'All' },
]

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  scam: 'Scam',
  misleading: 'Misleading information',
  inappropriate: 'Inappropriate content',
  other: 'Other',
}

export function AdminReportsPage() {
  const [status, setStatus] = useState('pending')
  const [reports, setReports] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [reviewingId, setReviewingId] = useState(null)

  function load() {
    setLoadStatus('loading')
    adminService
      .listReports({ status: status || undefined, perPage: 50 })
      .then((result) => {
        setReports(result.items)
        setLoadStatus('ready')
      })
      .catch((err) => {
        setError(errorMessage(err))
        setLoadStatus('error')
      })
  }

  useEffect(load, [status])

  async function handleReview(reportId, nextStatus) {
    setReviewingId(reportId)
    try {
      await adminService.reviewReport(reportId, nextStatus)
      setReports((prev) =>
        status
          ? prev.filter((r) => r.id !== reportId)
          : prev.map((r) => (r.id === reportId ? { ...r, status: nextStatus } : r)),
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Posts flagged by the community for review." />

      <Tabs items={STATUS_TABS} value={status} onChange={setStatus} className="asa-profile-tabs" />

      {loadStatus === 'loading' && <LoadingState label="Loading reports…" />}
      {loadStatus === 'error' && <ErrorState message={error ?? undefined} onRetry={load} />}
      {loadStatus === 'ready' && reports.length === 0 && (
        <EmptyState title="No reports here" description="Nothing to review right now." icon="🚩" />
      )}

      {loadStatus === 'ready' && reports.length > 0 && (
        <div className="asa-admin-list">
          {reports.map((report) => (
            <div key={report.id} className="asa-admin-list-row">
              <div className="asa-admin-list-row__body">
                {report.post ? (
                  <Link to={`/posts/${report.post.id}`} className="asa-admin-list-row__title">
                    {report.post.title}
                  </Link>
                ) : (
                  <span className="asa-admin-list-row__title">Post no longer available</span>
                )}
                <span className="asa-admin-list-row__meta">
                  Reported by {report.reporter.user.username} for{' '}
                  <strong>{REASON_LABELS[report.reason] ?? report.reason}</strong> ·{' '}
                  {formatRelativeTime(report.createdAt)}
                </span>
                {report.details && <span className="asa-admin-list-row__quote">"{report.details}"</span>}
              </div>
              <div className="asa-admin-list-row__actions">
                <Badge variant={report.status === 'pending' ? 'warning' : 'default'}>{report.status}</Badge>
                {report.status === 'pending' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={reviewingId === report.id}
                      onClick={() => handleReview(report.id, 'dismissed')}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={reviewingId === report.id}
                      onClick={() => handleReview(report.id, 'reviewed')}
                    >
                      Mark reviewed
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
