import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui'
import { Input } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { expertsService } from '@/services'
import { UserProfile } from '@/types/domain'
import { errorMessage } from '@/features/auth/AuthContext'
import { ExpertCard } from '../components/ExpertCard'

export function ExpertsPage() {
  const [experts, setExperts] = useState<UserProfile[]>([])
  const [followingIds, setFollowingIds] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const [list, following] = await Promise.all([
        expertsService.listExperts(1, 50),
        expertsService.getMyFollowing(),
      ])
      setExperts(list.items)
      setFollowingIds(following.followingIds)
      setStatus('ready')
    } catch (err) {
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function handleFollowChange(userId: number, following: boolean) {
    setFollowingIds((prev) =>
      following ? [...prev, userId] : prev.filter((id) => id !== userId),
    )
  }

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
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={load} />}
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
            onFollowChange={(following) => handleFollowChange(expert.user.id, following)}
          />
        ))}
    </>
  )
}