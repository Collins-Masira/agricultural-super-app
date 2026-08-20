/** Small formatting helpers shared across the UI. */

const DATE_FORMAT_OPTS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, DATE_FORMAT_OPTS)
}

export function formatRelativeTime(value) {
  const then = new Date(value).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, now - then)
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return formatDate(value)
}

export function initials(firstName, lastName, username) {
  const a = firstName?.trim().charAt(0)
  const b = lastName?.trim().charAt(0)
  if (a && b) return `${a}${b}`.toUpperCase()
  if (a) return a.toUpperCase()
  return username?.slice(0, 2).toUpperCase() ?? '?'
}