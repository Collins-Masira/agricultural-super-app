import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, EmptyState, LoadingState, Modal, VerifiedBadge } from '@/components/ui'
import { expertsService } from '@/services'

export function FollowingListModal({ open, onClose, userIds }) {
  const [status, setStatus] = useState('idle')
  const [people, setPeople] = useState([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setStatus('loading')
    Promise.all(userIds.map((id) => expertsService.getExpert(id).catch(() => null)))
      .then((results) => {
        if (cancelled) return
        setPeople(results.filter(Boolean))
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [open, userIds])

  return (
    <Modal open={open} title="Following" onClose={onClose}>
      {status === 'loading' && <LoadingState label="Loading…" />}
      {status === 'ready' && people.length === 0 && (
        <EmptyState title="Not following anyone yet" description="Search for farmers and experts to follow." />
      )}
      {status === 'ready' &&
        people.map((person) => {
          const name =
            person.profile.firstName && person.profile.lastName
              ? `${person.profile.firstName} ${person.profile.lastName}`
              : person.user.username
          return (
            <Link
              key={person.user.id}
              to={`/experts/${person.user.id}`}
              className="asa-following-modal__row"
              onClick={onClose}
            >
              <Avatar imageUrl={person.profile.profileImageUrl} name={name} username={person.user.username} size="sm" />
              <span className="asa-following-modal__info">
                <span className="asa-following-modal__name">
                  {name}
                  <VerifiedBadge profile={person.profile} />
                </span>
                <span className="asa-following-modal__username">@{person.user.username}</span>
              </span>
            </Link>
          )
        })}
    </Modal>
  )
}
