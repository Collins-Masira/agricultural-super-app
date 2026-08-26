import { EmptyState, Button } from '@/components/ui'

export function UnauthorizedPage() {
  return (
    <EmptyState
      icon="🚫"
      title="You do not have permission to access this page."
      description="This area is restricted to administrators. If you believe this is a mistake, contact an admin."
      action={<Button to="/">Go back home</Button>}
    />
  )
}
