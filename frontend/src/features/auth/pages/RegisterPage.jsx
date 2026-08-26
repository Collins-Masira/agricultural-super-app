import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, PasswordInput, PasswordRequirements } from '@/components/ui'
import { useAuth, errorMessage } from '@/features/auth/AuthContext'
import { isPasswordStrong } from '@/lib/passwordPolicy'
import { AuthLayout } from './AuthLayout'
import './auth.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const errors = {}
    if (!form.username.trim()) errors.username = 'Username is required.'
    if (form.username.trim().length < 3) errors.username = 'Username must be at least 3 characters.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    if (!form.password) errors.password = 'Password is required.'
    else if (!isPasswordStrong(form.password)) errors.password = 'Password does not meet all requirements below.'
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPasswordTouched(true)
    if (!validate() || submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the agricultural community and connect with experts."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={(e) => setField('username', e.target.value)}
          error={fieldErrors.username}
          placeholder="e.g. jane_kamau"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          error={fieldErrors.email}
          placeholder="you@example.com"
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
          onFocus={() => setPasswordTouched(true)}
          error={fieldErrors.password}
        />
        {(passwordTouched || form.password) && <PasswordRequirements password={form.password} />}
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => setField('confirmPassword', e.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          value={form.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          error={fieldErrors.firstName}
        />
        <Input
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          value={form.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          error={fieldErrors.lastName}
        />
        {formError && (
          <p className="asa-auth__error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" block loading={submitting} disabled={submitting || !isPasswordStrong(form.password)}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
