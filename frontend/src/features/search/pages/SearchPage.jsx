import { useEffect, useRef, useState } from 'react'
import { EmptyState, ErrorState, Input, LoadingState, PageHeader } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { errorMessage } from '@/features/auth/AuthContext'
import { ExpertCard } from '@/features/experts/components/ExpertCard'
import { fetchMyFollowing } from '@/store/slices/expertsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { usersService } from '@/services'
import '../search.css'

const DEBOUNCE_MS = 350

export function SearchPage() {
  const dispatch = useAppDispatch()
  const followingIds = useAppSelector((state) => state.experts.followingIds)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    dispatch(fetchMyFollowing())
  }, [dispatch])

  async function runSearch(term) {
    const requestId = ++requestIdRef.current
    setStatus('loading')
    try {
      const { items } = await usersService.searchUsers(term)
      if (requestId !== requestIdRef.current) return
      setResults(items)
      setStatus('ready')
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(errorMessage(err))
      setStatus('error')
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    const term = query.trim()

    if (!term) {
      requestIdRef.current += 1
      setStatus('idle')
      setResults([])
      setError(null)
      return
    }

    setStatus('loading')
    debounceRef.current = setTimeout(() => runSearch(term), DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  return (
    <>
      <PageHeader title="Search" subtitle="Find farmers and experts in the community." />

      <div className="asa-search__bar">
        <Input
          label=""
          name="userSearch"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          aria-label="Search users"
          className="asa-search__input"
          autoFocus
        />
        <SearchIcon width={18} height={18} className="asa-search__icon" />
      </div>

      {status === 'idle' && (
        <EmptyState
          title="Search for farmers and experts"
          description="Type a name or username to find people in the community."
          icon="🔍"
        />
      )}

      {status === 'loading' && <LoadingState label="Searching…" />}

      {status === 'error' && (
        <ErrorState message={error ?? undefined} onRetry={() => runSearch(query.trim())} />
      )}

      {status === 'ready' && results.length === 0 && (
        <EmptyState
          title="No farmers found"
          description="Try searching with a different name or username."
        />
      )}

      {status === 'ready' &&
        results.map((person) => (
          <ExpertCard
            key={person.user.id}
            expert={person}
            isFollowing={followingIds.includes(person.user.id)}
          />
        ))}
    </>
  )
}
