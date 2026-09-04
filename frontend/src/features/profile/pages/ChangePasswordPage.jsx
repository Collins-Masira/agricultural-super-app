import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PageHeader, PasswordInput, PasswordRequirements } from '@/components/ui'
import { useAuth, errorMessage } from '@/features/auth/AuthContext'
import { isPasswordStrong } from '@/lib/passwordPolicy'

export function ChangePasswordPage() {
  const { changePassword } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function validate() {
    const errors = {}
    if (!currentPassword) errors.currentPassword = 'Current password is required.'
    if (!newPassword) errors.newPassword = 'New password is required.'
    else if (!isPasswordStrong(newPassword)) errors.newPassword = 'Password does not meet all requirements below.'
    if (confirmPassword !== newPassword) errors.confirmPassword = 'Passwords do not match.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      await changePassword(currentPassword, newPassword)
      setDone(true)
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <>
        <PageHeader title="Password changed" subtitle="Your password has been updated." />
        <Button onClick={() => navigate('/profile')}>Back to profile</Button>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Change password" subtitle="Update the password for your account." />
      <form onSubmit={handleSubmit} noValidate>
        <PasswordInput
          label="Current password"
          name="currentPassword"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={fieldErrors.currentPassword}
        />
        <PasswordInput
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldErrors.newPassword}
        />
        <PasswordRequirements password={newPassword} />
        <PasswordInput
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        {formError && (
          <p className="asa-form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="asa-profile-edit__actions">
          <Button type="submit" loading={submitting} disabled={submitting || !isPasswordStrong(newPassword)}>
            Change password
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate('/profile')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}
