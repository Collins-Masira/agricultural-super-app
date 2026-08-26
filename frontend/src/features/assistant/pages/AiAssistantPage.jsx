import { useRef, useState } from 'react'
import { Button, EmptyState, PageHeader, Spinner, Textarea } from '@/components/ui'
import { errorMessage } from '@/features/auth/AuthContext'
import { aiService } from '@/services'
import '../assistant.css'

const SUGGESTIONS = [
  'Why are my tomato leaves turning yellow?',
  "What's the best time to plant maize this season?",
  'How do I tell if my chicken flock has a health problem?',
  'My avocado tree is dropping flowers — is that normal?',
]

export function AiAssistantPage() {
  const [messages, setMessages] = useState([]) // [{ role, content }]
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  async function send(text) {
    const content = text.trim()
    if (!content || loading) return

    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setDraft('')
    setError(null)
    setLoading(true)

    try {
      const reply = await aiService.askAssistant(nextMessages)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ block: 'end' }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    send(draft)
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) send(lastUser.content)
  }

  return (
    <div className="asa-assistant">
      <PageHeader title="AI Farming Assistant" subtitle="Ask about crops, pests, soil, livestock, and more." />

      <p className="asa-assistant__disclaimer">
        AI-generated guidance for quick, general advice. For anything high-stakes — disease outbreaks, chemical
        dosing, big financial decisions — confirm with a verified expert on AgriConnect.
      </p>

      <div className="asa-assistant__messages">
        {messages.length === 0 && (
          <EmptyState
            title="Ask your first question"
            description="The assistant can help with crops, livestock, soil, pests, and general farm management."
            icon="🌾"
            action={
              <div className="asa-assistant__suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <Button key={suggestion} variant="outline" size="sm" onClick={() => send(suggestion)}>
                    {suggestion}
                  </Button>
                ))}
              </div>
            }
          />
        )}

        {messages.map((message, index) => (
          <div key={index} className={`asa-assistant-message asa-assistant-message--${message.role}`}>
            <div className="asa-assistant-message__bubble">{message.content}</div>
          </div>
        ))}

        {loading && (
          <div className="asa-assistant-message asa-assistant-message--assistant">
            <div className="asa-assistant-message__bubble">
              <Spinner size="sm" />
            </div>
          </div>
        )}

        {error && (
          <div className="asa-assistant-message asa-assistant-message--error">
            <div className="asa-assistant-message__bubble">
              {error}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Button variant="outline" size="sm" onClick={retryLast}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="asa-assistant__composer" onSubmit={handleSubmit}>
        <Textarea
          label=""
          name="draft"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a farming question…"
          aria-label="Your question"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button type="submit" loading={loading} disabled={!draft.trim()}>
          Ask
        </Button>
      </form>
    </div>
  )
}
