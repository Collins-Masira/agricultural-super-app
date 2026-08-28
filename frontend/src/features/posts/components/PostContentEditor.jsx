import { useRef, useState } from 'react'
import { Button, PostContent, Tabs, Textarea } from '@/components/ui'

const CONTENT_TABS = [
  { value: 'write', label: 'Write' },
  { value: 'preview', label: 'Preview' },
]

function wrapSelection(content, textarea, prefix, suffix, placeholder) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = content.slice(0, start)
  const selected = content.slice(start, end) || placeholder
  const after = content.slice(end)
  return {
    next: `${before}${prefix}${selected}${suffix}${after}`,
    selectionStart: before.length + prefix.length,
    selectionEnd: before.length + prefix.length + selected.length,
  }
}

function prefixSelectedLines(content, textarea, placeholder, makePrefix) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = content.slice(0, start)
  const selected = content.slice(start, end) || placeholder
  const after = content.slice(end)
  const prefixed = selected.split('\n').map((line, index) => `${makePrefix(index)}${line}`).join('\n')
  return {
    next: `${before}${prefixed}${after}`,
    selectionStart: before.length,
    selectionEnd: before.length + prefixed.length,
  }
}

export function PostContentEditor({ content, onChange, error, rows = 8 }) {
  const [mode, setMode] = useState('write')
  const textareaRef = useRef(null)

  function applyFormatting(transform) {
    const textarea = textareaRef.current
    if (!textarea) return
    const result = transform(content, textarea)
    onChange(result.next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  return (
    <div className="asa-composer__content">
      <Tabs items={CONTENT_TABS} value={mode} onChange={setMode} className="asa-composer__tabs" />

      {mode === 'write' ? (
        <>
          <div className="asa-composer-toolbar" role="toolbar" aria-label="Formatting">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Bold"
              aria-label="Bold"
              onClick={() => applyFormatting((c, t) => wrapSelection(c, t, '**', '**', 'bold text'))}
            >
              <strong>B</strong>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Italic"
              aria-label="Italic"
              onClick={() => applyFormatting((c, t) => wrapSelection(c, t, '*', '*', 'italic text'))}
            >
              <em>I</em>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Bulleted list"
              aria-label="Bulleted list"
              onClick={() =>
                applyFormatting((c, t) => prefixSelectedLines(c, t, 'List item', () => '- '))
              }
            >
              • List
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Numbered list"
              aria-label="Numbered list"
              onClick={() =>
                applyFormatting((c, t) => prefixSelectedLines(c, t, 'List item', (i) => `${i + 1}. `))
              }
            >
              1. List
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Add a link"
              aria-label="Add a link"
              onClick={() =>
                applyFormatting((c, t) => wrapSelection(c, t, '[', '](https://example.com)', 'link text'))
              }
            >
              🔗 Link
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            label="Content"
            name="content"
            rows={rows}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            placeholder="What would you like to share?"
          />
        </>
      ) : (
        <div className="asa-field">
          <span className="asa-field__label">Preview</span>
          <div className="asa-composer__preview">
            {content.trim() ? (
              <PostContent content={content} />
            ) : (
              <p className="asa-field__hint">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
