import { Button } from '@/components/ui'
import { HeartIcon } from '@/components/icons'
import './posts.css'

interface LikeButtonProps {
  liked: boolean
  count: number
  onToggle: () => void
  loading?: boolean
}

export function LikeButton({ liked, count, onToggle, loading = false }: LikeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      loading={loading}
      aria-pressed={liked}
      className="asa-post__action"
    >
      <HeartIcon filled={liked} width={18} height={18} />
      <span>{count}</span>
      <span className="visually-hidden">{liked ? 'Unlike' : 'Like'}</span>
    </Button>
  )
}