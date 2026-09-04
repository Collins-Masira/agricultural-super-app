import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useAuth, errorMessage } from '@/features/auth/AuthContext'
import { AuthLayout } from './AuthLayout'
import './auth.css'

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    if (!email.trim()) {
      setFieldError('Email is required.')
      return
    }
    setFieldError(null)
    setFormError(null)
    setSubmitting(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If an account exists for that email, we've sent a link to reset your password."
        footer={
          <>
            Remembered it? <Link to="/login">Back to log in</Link>
          </>
        }
      >
        <p className="asa-auth__hint">
          The link expires in 1 hour. Didn&apos;t get it? Check your spam folder, or{' '}
          <button type="button" className="asa-auth__linklike" onClick={() => setSent(false)}>
            try again
          </button>
          .
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <>
          Remembered it? <Link to="/login">Back to log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
          placeholder="you@example.com"
        />
        {formError && (
          <p className="asa-auth__error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" block loading={submitting}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  )
}
