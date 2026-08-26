/**
 * Password policy -- mirrors backend/app/validators.py exactly. Kept as
 * one source of truth on this side too, so the live requirement
 * checklist a user sees while typing is never out of sync with what the
 * server will actually accept.
 */

export const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

export function evaluatePassword(password) {
  const pw = password || ''
  return PASSWORD_REQUIREMENTS.map((req) => ({ ...req, met: req.test(pw) }))
}

export function isPasswordStrong(password) {
  return evaluatePassword(password).every((r) => r.met)
}
