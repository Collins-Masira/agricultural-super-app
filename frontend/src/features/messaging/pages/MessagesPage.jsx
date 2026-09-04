import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui'
import { formatRelativeTime } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchConversations } from '@/store/slices/messagesSlice'
import '../messaging.css'

function otherParticipants(conversation, myId) {
  return conversation.participants.filter((p) => p.userId !== myId).map((p) => p.participant)
}

function lastMessage(conversation) {
  if (conversation.messages.length === 0) return null
  return [...conversation.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)
}

function unreadCount(conversation, myId) {
  return conversation.messages.filter((m) => m.senderId !== myId && !m.isRead).length
}

export function MessagesPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const conversations = useAppSelector((state) => state.messages.conversations)
  const status = useAppSelector((state) => state.messages.conversationsStatus)
  const error = useAppSelector((state) => state.messages.conversationsError)

  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  const myId = user?.user.id

  return (
    <>
      <PageHeader title="Messages" subtitle="Conversations with experts and farmers you've connected with." />

      {status === 'loading' && <LoadingState label="Loading conversations…" />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchConversations())} />}
      {status === 'ready' && conversations.length === 0 && (
        <EmptyState
          title="No conversations yet"
          description="Message an expert from their profile to start a conversation."
          icon="💬"
        />
      )}
      {status === 'ready' && conversations.length > 0 && (
        <ul className="asa-conversation-list">
          {conversations.map((conversation) => {
            const [partner] = otherParticipants(conversation, myId)
            const name =
              partner?.profile.firstName && partner?.profile.lastName
                ? `${partner.profile.firstName} ${partner.profile.lastName}`
                : partner?.user.username ?? 'Conversation'
            const last = lastMessage(conversation)
            const unread = unreadCount(conversation, myId)

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  className="asa-conversation-item"
                  onClick={() => navigate(`/messages/${conversation.id}`)}
                >
                  <Avatar imageUrl={partner?.profile.profileImageUrl} name={name} username={partner?.user.username} size="lg" />
                  <div className="asa-conversation-item__body">
                    <div className="asa-conversation-item__top">
                      <span className={`asa-conversation-item__name ${unread > 0 ? 'asa-conversation-item__name--unread' : ''}`}>
                        {name}
                      </span>
                      {last && <span className="asa-conversation-item__time">{formatRelativeTime(last.createdAt)}</span>}
                    </div>
                    <p className={`asa-conversation-item__preview ${unread > 0 ? 'asa-conversation-item__preview--unread' : ''}`}>
                      {last ? (last.senderId === myId ? `You: ${last.content}` : last.content) : 'No messages yet'}
                    </p>
                  </div>
                  {unread > 0 && <span className="asa-unread-dot">{unread}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
