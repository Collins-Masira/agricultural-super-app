import { Button } from './Button'
import { RepeatIcon } from '@/components/icons'

export function RepostButton({ reposted, count, onToggle, loading = false }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      loading={loading}
      aria-pressed={reposted}
      className={`asa-post__action ${reposted ? 'asa-post__action--active' : ''}`}
    >
      <RepeatIcon width={18} height={18} />
      <span>{count}</span>
      <span className="visually-hidden">{reposted ? 'Unrepost' : 'Repost'}</span>
    </Button>
  )
}
