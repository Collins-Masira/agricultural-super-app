import { useEffect, useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui'
import { Input } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { fetchExperts, fetchMyFollowing } from '@/store/slices/expertsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { ExpertCard } from '../components/ExpertCard'

export function ExpertsPage() {
  const dispatch = useAppDispatch()
  const experts = useAppSelector((state) => state.experts.experts)
  const status = useAppSelector((state) => state.experts.expertsStatus)
  const error = useAppSelector((state) => state.experts.expertsError)
  const followingIds = useAppSelector((state) => state.experts.followingIds)
  const [query, setQuery] = useState('')

  useEffect(() => {
    dispatch(fetchExperts({ page: 1, pageSize: 50 }))
    dispatch(fetchMyFollowing())
  }, [dispatch])

  const visibleExperts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return experts
    return experts.filter((expert) => {
      const name = `${expert.profile.firstName ?? ''} ${expert.profile.lastName ?? ''} ${expert.user.username} ${expert.profile.location ?? ''}`
      return name.toLowerCase().includes(q)
    })
  }, [experts, query])

  return (
    <>
      <PageHeader
        title="Experts"
        subtitle="Verified agricultural experts ready to help."
      />

      <div className="asa-experts__search">
        <Input
          label=""
          name="expertSearch"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search experts by name or location…"
          aria-label="Search experts"
          className="asa-experts__search-input"
        />
        <SearchIcon width={18} height={18} className="asa-experts__search-icon" />
      </div>

      {status === 'loading' && <LoadingState label="Loading experts…" />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchExperts({ page: 1, pageSize: 50 }))} />}
      {status === 'ready' && visibleExperts.length === 0 && (
        <EmptyState
          title={query ? 'No experts match your search' : 'No experts yet'}
          description={query ? 'Try a different search term.' : 'Expert profiles will appear here.'}
        />
      )}
      {status === 'ready' &&
        visibleExperts.map((expert) => (
          <ExpertCard
            key={expert.user.id}
            expert={expert}
            isFollowing={followingIds.includes(expert.user.id)}
          />
        ))}
    </>
  )
}