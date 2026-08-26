import { useEffect, useState } from 'react'
import { Badge, Button, ErrorState, Input, LoadingState, Modal, PageHeader } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { errorMessage, useAuth } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchAdminUsers, updateAdminUser } from '@/store/slices/adminSlice'
import '../admin.css'

const ROLES = ['farmer', 'expert', 'admin']

export function AdminUsersPage() {
  const dispatch = useAppDispatch()
  const { user: currentAdmin } = useAuth()
  const users = useAppSelector((state) => state.admin.users)
  const status = useAppSelector((state) => state.admin.usersStatus)
  const error = useAppSelector((state) => state.admin.usersError)
  const total = useAppSelector((state) => state.admin.usersTotal)
  const page = useAppSelector((state) => state.admin.usersPage)
  const perPage = useAppSelector((state) => state.admin.usersPerPage)
  const updateLoadingId = useAppSelector((state) => state.admin.updateLoadingId)

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmAction, setConfirmAction] = useState(null) // { user, type: 'deactivate'|'activate'|'role', role? }
  const [actionError, setActionError] = useState(null)

  function load(nextPage = 1) {
    dispatch(fetchAdminUsers({ search: search.trim() || undefined, role: role || undefined, status: statusFilter || undefined, page: nextPage, perPage }))
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  function handleFilterSubmit(event) {
    event.preventDefault()
    load(1)
  }

  async function confirmAndRun() {
    if (!confirmAction) return
    setActionError(null)
    try {
      if (confirmAction.type === 'deactivate') {
        await dispatch(updateAdminUser({ userId: confirmAction.user.user.id, isActive: false })).unwrap()
      } else if (confirmAction.type === 'activate') {
        await dispatch(updateAdminUser({ userId: confirmAction.user.user.id, isActive: true })).unwrap()
      } else if (confirmAction.type === 'role') {
        await dispatch(updateAdminUser({ userId: confirmAction.user.user.id, role: confirmAction.role })).unwrap()
      }
      setConfirmAction(null)
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <>
      <PageHeader title="Users" subtitle={`${total} registered user${total === 1 ? '' : 's'}.`} />

      <form className="asa-admin-toolbar" onSubmit={handleFilterSubmit}>
        <Input
          label=""
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, email, or name…"
          aria-label="Search users"
        />
        <select
          className="asa-input"
          style={{ width: 'auto' }}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          className="asa-input"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {status === 'loading' && <LoadingState label="Loading users…" />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={() => load(page)} />}

      {status === 'ready' && (
        <>
          <div className="asa-admin-table-wrap">
            <table className="asa-admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.user.id === currentAdmin?.user.id
                  return (
                    <tr key={u.user.id}>
                      <td>
                        {u.user.username}
                        {isSelf && <span className="asa-admin-list-row__meta"> (you)</span>}
                      </td>
                      <td>{u.user.email}</td>
                      <td>
                        <Badge variant={u.user.role === 'admin' ? 'success' : 'default'}>{u.user.role}</Badge>
                      </td>
                      <td>
                        <Badge variant={u.user.isActive ? 'success' : 'danger'}>
                          {u.user.isActive ? 'Active' : 'Deactivated'}
                        </Badge>
                      </td>
                      <td>{formatDate(u.user.createdAt)}</td>
                      <td>
                        {isSelf ? (
                          <span className="asa-admin-list-row__meta">Manage your own account from Profile</span>
                        ) : (
                          <div className="asa-admin-table__actions">
                            <select
                              className="asa-input"
                              style={{ width: 'auto', minHeight: '2.25rem' }}
                              value={u.user.role}
                              onChange={(e) => setConfirmAction({ user: u, type: 'role', role: e.target.value })}
                              aria-label={`Change role for ${u.user.username}`}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            {u.user.isActive ? (
                              <Button
                                variant="danger"
                                size="sm"
                                loading={updateLoadingId === u.user.id}
                                onClick={() => setConfirmAction({ user: u, type: 'deactivate' })}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                loading={updateLoadingId === u.user.id}
                                onClick={() => setConfirmAction({ user: u, type: 'activate' })}
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="asa-admin-pagination">
            <span>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                Previous
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!confirmAction}
        title={
          confirmAction?.type === 'deactivate'
            ? 'Deactivate account?'
            : confirmAction?.type === 'activate'
              ? 'Reactivate account?'
              : 'Change role?'
        }
        onClose={() => {
          setConfirmAction(null)
          setActionError(null)
        }}
      >
        {confirmAction?.type === 'deactivate' && (
          <p>
            <strong>{confirmAction.user.user.username}</strong> will be immediately logged out and unable to log
            back in until reactivated.
          </p>
        )}
        {confirmAction?.type === 'activate' && (
          <p>
            <strong>{confirmAction.user.user.username}</strong> will be able to log in again.
          </p>
        )}
        {confirmAction?.type === 'role' && (
          <p>
            Change <strong>{confirmAction.user.user.username}</strong>&apos;s role from{' '}
            <strong>{confirmAction.user.user.role}</strong> to <strong>{confirmAction.role}</strong>?
          </p>
        )}
        {actionError && (
          <p className="asa-form-error" role="alert">
            {actionError}
          </p>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant={confirmAction?.type === 'deactivate' ? 'danger' : 'primary'}
            loading={!!updateLoadingId}
            onClick={confirmAndRun}
          >
            Confirm
          </Button>
          <Button variant="ghost" onClick={() => setConfirmAction(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  )
}
