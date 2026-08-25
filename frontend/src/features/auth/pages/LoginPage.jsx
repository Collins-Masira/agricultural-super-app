import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useAuth, errorMessage } from '@/features/auth/AuthContext'
import { AuthLayout } from './AuthLayout'
import './auth.css'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from ?? '/'

  function validate() {
    const errors = {}
    if (!usernameOrEmail.trim()) errors.usernameOrEmail = 'Username or email is required.'
    if (!password) errors.password = 'Password is required.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      await login(usernameOrEmail.trim(), password)
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see the latest from experts and farmers."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Username or email"
          name="usernameOrEmail"
          type="text"
          autoComplete="username"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          error={fieldErrors.usernameOrEmail}
          placeholder="e.g. jane_kamau"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          placeholder="Your password"
        />
        {formError && (
          <p className="asa-auth__error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" block loading={submitting}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  )
}