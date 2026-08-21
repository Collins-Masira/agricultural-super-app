import { useState } from 'react'

export default function Messages({
  messages,
  users,
  me,
  onSend,
}) {
  const [activeThread, setActiveThread] = useState(null)
  const [draft, setDraft] = useState('')

  const getUser = (id) =>
    users.find((u) => u.id === id) || me

  // Build thread list
  const partnerIds = Array.from(
    new Set(
      messages
        .flatMap((m) => [m.fromId, m.toId])
        .filter((id) => id !== 'me')
    )
  )

  const lastMessageWith = (partnerId) =>
    [...messages]
      .filter(
        (m) =>
          m.fromId === partnerId ||
          m.toId === partnerId
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      )[0]

  const unreadFrom = (partnerId) =>
    messages.filter(
      (m) =>
        m.fromId === partnerId &&
        m.toId === 'me' &&
        !m.read
    ).length

  const threadMessages = activeThread
    ? messages
        .filter(
          (m) =>
            m.fromId === activeThread ||
            m.toId === activeThread
        )
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime()
        )
    : []

  const send = () => {
    if (!draft.trim() || !activeThread) return

    onSend(
      activeThread,
      draft.trim()
    )

    setDraft('')
  }

  // -----------------------------
  // Active conversation
  // -----------------------------

  if (activeThread) {
    const partner = getUser(activeThread)

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: '#f5f0e8',
          paddingBottom: 80,
        }}
      >
        {/* Thread header */}

        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{
            background: '#f5f0e8',
            borderBottom: '1px solid #ddd5c0',
            paddingTop: 52,
          }}
        >
          <button
            onClick={() => setActiveThread(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
            }}
          >
            ←
          </button>

          <img
            src={partner.avatar}
            alt={partner.name}
            className="rounded-full"
            style={{
              width: 40,
              height: 40,
              objectFit: 'cover',
            }}
          />

          <div>
            <p
              style={{
                fontWeight: 600,
                color: '#1e4d2b',
                fontSize: 15,
              }}
            >
              {partner.name}
            </p>

            <p
              style={{
                fontSize: 12,
                color: '#9e8870',
              }}
            >
              {partner.location}
            </p>
          </div>
        </div>

        {/* Messages */}

        <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-3">
          {threadMessages.map((msg) => {
            const isMe = msg.fromId === 'me'

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMe
                    ? 'flex-end'
                    : 'flex-start',
                }}
              >
                {!isMe && (
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="rounded-full mr-2"
                    style={{
                      width: 30,
                      height: 30,
                      objectFit: 'cover',
                      alignSelf: 'flex-end',
                    }}
                  />
                )}

                <div
                  style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: isMe
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    background: isMe
                      ? '#1e4d2b'
                      : '#fff',
                    color: isMe
                      ? '#f5f0e8'
                      : '#3d2b1f',
                    fontSize: 14,
                    lineHeight: 1.55,
                    boxShadow:
                      '0 1px 4px rgba(61,43,31,0.08)',
                    border: isMe
                      ? 'none'
                      : '1px solid #e8deca',
                  }}
                >
                  {msg.content}

                  <p
                    style={{
                      fontSize: 10,
                      opacity: 0.6,
                      marginTop: 4,
                      textAlign: 'right',
                    }}
                  >
                    {new Date(
                      msg.timestamp
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Input */}

        <div
          className="flex items-end gap-3 px-4 py-3"
          style={{
            background: '#f5f0e8',
            borderTop: '1px solid #ddd5c0',
          }}
        >
          <textarea
            value={draft}
            onChange={(e) =>
              setDraft(e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey
              ) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Type a message…"
            rows={2}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 18,
              border: '1.5px solid #d4c9b0',
              background: '#fff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              color: '#3d2b1f',
              resize: 'none',
              outline: 'none',
            }}
          />

          <button
            onClick={send}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: draft.trim()
                ? '#1e4d2b'
                : '#ddd5c0',
              border: 'none',
              cursor: draft.trim()
                ? 'pointer'
                : 'default',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
      </div>
    )
  }

  // -----------------------------
  // Conversation list
  // -----------------------------

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}

      <div
        className="sticky top-0 z-10 px-5 pt-12 pb-4"
        style={{
          background: '#f5f0e8',
          borderBottom: '1px solid #ddd5c0',
        }}
      >
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 26,
            fontWeight: 700,
            color: '#1e4d2b',
          }}
        >
          Messages
        </h1>

        <p
          style={{
            fontSize: 13,
            color: '#6b4a35',
            marginTop: 4,
          }}
        >
          {
            messages.filter(
              (m) =>
                m.toId === 'me' &&
                !m.read
            ).length
          }{' '}
          unread
        </p>
      </div>

      {/* Conversation list */}

      <div className="flex flex-col">
        {partnerIds.map((pid) => {
          const partner = getUser(pid)
          const last = lastMessageWith(pid)
          const unread = unreadFrom(pid)

          return (
            <button
              key={pid}
              onClick={() =>
                setActiveThread(pid)
              }
              className="flex items-center gap-3 px-5 py-4"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom:
                  '1px solid #ede6d6',
                textAlign: 'left',
              }}
            >
              {/* Avatar */}

              <div className="relative">
                <img
                  src={partner.avatar}
                  alt={partner.name}
                  className="rounded-full"
                  style={{
                    width: 50,
                    height: 50,
                    objectFit: 'cover',
                  }}
                />

                {unread > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 16,
                      height: 16,
                      background: '#c4932a',
                      borderRadius: '50%',
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border:
                        '2px solid #f5f0e8',
                    }}
                  >
                    {unread}
                  </span>
                )}
              </div>

              {/* Message preview */}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontWeight:
                        unread > 0
                          ? 700
                          : 500,
                      color: '#1e4d2b',
                      fontSize: 15,
                    }}
                  >
                    {partner.name}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: '#9e8870',
                    }}
                  >
                    {new Date(
                      last.timestamp
                    ).toLocaleDateString(
                      [],
                      {
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color:
                      unread > 0
                        ? '#3d2b1f'
                        : '#9e8870',
                    fontWeight:
                      unread > 0
                        ? 500
                        : 400,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {last.fromId === 'me'
                    ? 'You: '
                    : ''}
                  {last.content}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}