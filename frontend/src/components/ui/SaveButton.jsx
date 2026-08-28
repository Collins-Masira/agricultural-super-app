import { Button } from './Button'
import { BookmarkIcon } from '@/components/icons'

export function SaveButton({ saved, onToggle, loading = false }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      loading={loading}
      aria-pressed={saved}
      className="asa-post__action"
    >
      <BookmarkIcon filled={saved} width={18} height={18} />
      <span className="visually-hidden">{saved ? 'Unsave' : 'Save'}</span>
    </Button>
  )
}
