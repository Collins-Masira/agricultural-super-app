import { useEffect, useState } from 'react'
import { Button, EmptyState, ErrorState, Input, LoadingState, Modal, PageHeader, Textarea } from '@/components/ui'
import { errorMessage } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { createCommunity, fetchCommunities } from '@/store/slices/communitiesSlice'
import { CommunityCard } from '../components/CommunityCard'
import '../communities.css'

export function CommunitiesPage() {
  const dispatch = useAppDispatch()
  const communities = useAppSelector((state) => state.communities.list)
  const status = useAppSelector((state) => state.communities.listStatus)
  const error = useAppSelector((state) => state.communities.listError)
  const createStatus = useAppSelector((state) => state.communities.createStatus)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '' })
  const [fieldError, setFieldError] = useState(null)
  const [formError, setFormError] = useState(null)

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

  return (
    <>
      <PageHeader
        title="Communities"
        subtitle="Join groups of farmers and experts around shared interests."
        actions={<Button onClick={() => setOpen(true)}>New community</Button>}
      />

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
      {status === 'ready' && communities.length > 0 && (
        <div className="asa-community-grid">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
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
