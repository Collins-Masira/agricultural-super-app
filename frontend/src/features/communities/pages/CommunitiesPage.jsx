import { useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, ErrorState, Input, LoadingState, Modal, PageHeader, Textarea } from '@/components/ui'
import { errorMessage, useAuth } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { createCommunity, fetchCommunities } from '@/store/slices/communitiesSlice'
import { CommunityCard } from '../components/CommunityCard'
import '../communities.css'

function isMemberOf(community, userId) {
  return community.members.some((m) => m.userId === userId)
}

export function CommunitiesPage() {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const communities = useAppSelector((state) => state.communities.list)
  const status = useAppSelector((state) => state.communities.listStatus)
  const error = useAppSelector((state) => state.communities.listError)
  const createStatus = useAppSelector((state) => state.communities.createStatus)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '' })
  const [fieldError, setFieldError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchCommunities({ page: 1, pageSize: 50 }))
  }, [dispatch])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setFieldError('Community name is required.')
      return
    }
    setFieldError(null)
    setFormError(null)
    try {
      await dispatch(
        createCommunity({
          name: form.name.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
        }),
      ).unwrap()
      setForm({ name: '', description: '', imageUrl: '' })
      setOpen(false)
    } catch (err) {
      setFormError(errorMessage(err))
    }
  }

  const userId = user?.user.id
  const query = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!query) return communities
    return communities.filter(
      (c) => c.name.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query),
    )
  }, [communities, query])

  const myCommunities = filtered.filter((c) => isMemberOf(c, userId))
  const suggested = [...filtered.filter((c) => !isMemberOf(c, userId))].sort(
    (a, b) => b.members.length - a.members.length,
  )

  return (
    <>
      <PageHeader
        title="Communities"
        subtitle="Join groups of farmers and experts around shared interests."
        actions={<Button onClick={() => setOpen(true)}>New community</Button>}
      />

      <div className="asa-community-discovery__search">
        <Input
          label=""
          name="community-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities…"
          aria-label="Search communities"
        />
      </div>

      {status === 'loading' && <LoadingState label="Loading communities…" />}
      {status === 'error' && (
        <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchCommunities({ page: 1, pageSize: 50 }))} />
      )}
      {status === 'ready' && communities.length === 0 && (
        <EmptyState
          title="No communities yet"
          description="Start the first community for your area or specialty."
          action={<Button onClick={() => setOpen(true)}>Create a community</Button>}
        />
      )}

      {status === 'ready' && communities.length > 0 && query && (
        <section className="asa-community-discovery__section">
          <h2 className="asa-community-discovery__section-title">Search results</h2>
          {filtered.length === 0 ? (
            <EmptyState title="No communities match your search" icon="🔍" />
          ) : (
            <div className="asa-community-grid">
              {filtered.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}
        </section>
      )}

      {status === 'ready' && communities.length > 0 && !query && (
        <>
          {myCommunities.length > 0 && (
            <section className="asa-community-discovery__section">
              <h2 className="asa-community-discovery__section-title">My communities</h2>
              <div className="asa-community-grid">
                {myCommunities.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            </section>
          )}

          <section className="asa-community-discovery__section">
            <h2 className="asa-community-discovery__section-title">
              {myCommunities.length > 0 ? 'Suggested for you' : 'All communities'}
            </h2>
            {suggested.length === 0 ? (
              <EmptyState title="You've joined every community" icon="🎉" />
            ) : (
              <div className="asa-community-grid">
                {suggested.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal open={open} title="New community" onClose={() => setOpen(false)}>
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          error={fieldError}
          placeholder="e.g. Maize Farmers KE"
        />
        <Textarea
          label="Description"
          name="description"
          rows={3}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="What is this community about?"
        />
        <Input
          label="Image URL (optional)"
          name="imageUrl"
          type="url"
          value={form.imageUrl}
          onChange={(e) => setField('imageUrl', e.target.value)}
          placeholder="https://…"
        />
        {formError && (
          <p className="asa-form-error" role="alert">
            {formError}
          </p>
        )}
        <Button onClick={handleCreate} loading={createStatus === 'loading'} disabled={!form.name.trim()}>
          Create community
        </Button>
      </Modal>
    </>
  )
}
