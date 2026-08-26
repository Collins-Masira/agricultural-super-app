/** Small formatting helpers shared across the UI. */

const DATE_FORMAT_OPTS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

// The backend serializes timestamps as naive UTC (e.g. "2026-08-26T06:16:57.274690"),
// with no "Z" or offset. `new Date(...)` treats a designator-less string as local
// time per the ECMA-262 spec, so without this, every timestamp is shifted by the
// browser's UTC offset. Append "Z" only when no timezone designator is already present.
function asUtcDate(value) {
  if (typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    return new Date(`${value}Z`)
  }
  return new Date(value)
}

export function formatDate(value) {
  return asUtcDate(value).toLocaleDateString(undefined, DATE_FORMAT_OPTS)
}

export function formatRelativeTime(value) {
  const then = asUtcDate(value).getTime()
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