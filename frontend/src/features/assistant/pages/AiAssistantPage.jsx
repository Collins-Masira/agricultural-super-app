import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui'
import { formatRelativeTime } from '@/lib/format'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { createAIConversation, deleteAIConversation, fetchAIConversations } from '@/store/slices/aiSlice'
import '../assistant.css'

export function AiAssistantPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const conversations = useAppSelector((state) => state.ai.conversations)
  const status = useAppSelector((state) => state.ai.conversationsStatus)
  const error = useAppSelector((state) => state.ai.conversationsError)

  useEffect(() => {
    dispatch(fetchAIConversations())
  }, [dispatch])

  async function handleNewConversation() {
    const result = await dispatch(createAIConversation())
    if (createAIConversation.fulfilled.match(result)) {
      navigate(`/assistant/${result.payload.id}`)
    }
  }

  function handleDelete(event, conversationId) {
    event.stopPropagation()
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    dispatch(deleteAIConversation(conversationId))
  }

  return (
    <>
      <PageHeader
        title="AI Farming Assistant"
        subtitle="Ask about crops, pests, soil, livestock, and more."
        actions={<Button onClick={handleNewConversation}>New conversation</Button>}
      />

      <p className="asa-assistant__disclaimer">
        AI-generated guidance for quick, general advice. For anything high-stakes — disease outbreaks, chemical
        dosing, big financial decisions — confirm with a verified expert on AgriConnect.
      </p>

      {status === 'loading' && <LoadingState label="Loading conversations…" />}
      {status === 'error' && (
        <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchAIConversations())} />
      )}
      {status === 'ready' && conversations.length === 0 && (
        <EmptyState
          title="No conversations yet"
          description="Start a new conversation to ask the assistant about crops, livestock, soil, pests, and more."
          icon="🌾"
          action={<Button onClick={handleNewConversation}>Start your first conversation</Button>}
        />
      )}
      {status === 'ready' && conversations.length > 0 && (
        <ul className="asa-ai-conversation-list">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="asa-ai-conversation-row">
              <button
                type="button"
                className="asa-ai-conversation-item"
                onClick={() => navigate(`/assistant/${conversation.id}`)}
              >
                <span className="asa-ai-conversation-item__name">{conversation.title ?? 'New conversation'}</span>
                <span className="asa-ai-conversation-item__time">{formatRelativeTime(conversation.updatedAt)}</span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => handleDelete(event, conversation.id)}
                aria-label="Delete conversation"
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
