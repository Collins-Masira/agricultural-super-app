import { forwardRef, useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@/components/icons'
import './ui.css'

/**
 * Input with a show/hide toggle -- everything else (label, hint, error,
 * aria wiring) is identical to the plain Input component; this just
 * swaps the `type` and adds the toggle button, so it fits into forms
 * exactly like Input does.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  { label, hint, error, id, className = '', ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? rest.name
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="asa-field">
      <label className="asa-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="asa-password-input">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`asa-input asa-password-input__field ${error ? 'asa-input--invalid' : ''} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        <button
          type="button"
          className="asa-password-input__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
        </button>
      </div>
      {hint && !error && (
        <span className="asa-field__hint" id={`${inputId}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="asa-field__error" id={`${inputId}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
})
