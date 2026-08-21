import { forwardRef } from 'react'
import './ui.css'

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, id, className = '', rows = 4, ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined

  return (
    <div className="asa-field">
      <label className="asa-field__label" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`asa-textarea ${error ? 'asa-textarea--invalid' : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
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