import { renderMarkdown } from '@/lib/markdown'
import './ui.css'

export function PostContent({ content, className = '' }) {
  return (
    <div
      className={`asa-post-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}
