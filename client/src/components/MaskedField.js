import React from 'react';

/**
 * MaskedField
 * A form field that shows a live masked preview beneath the input.
 *
 * Props:
 *   label      - visible label text
 *   name       - field name (must match useForm state keys)
 *   value      - raw (actual) value
 *   maskedValue - masked string to preview
 *   isMasked   - whether masking is applied (false for 'name')
 *   onChange   - change handler from useForm
 *   error      - field-level error string
 *   placeholder
 *   type       - input type (default 'text')
 *   maxLength
 *   icon       - emoji or symbol for the field icon
 */
export default function MaskedField({
  label,
  name,
  value,
  maskedValue,
  isMasked = true,
  onChange,
  error,
  placeholder,
  type = 'text',
  maxLength,
  icon,
}) {
  const hasValue = value && value.length > 0;

  return (
    <div className="field">
      <label htmlFor={name} className="field-label">
        <span>{label}</span>
        {isMasked && (
          <span className={`mask-badge ${hasValue ? 'mask-badge--active' : ''}`}>
            {hasValue ? '🔒 masked' : '🔒 will mask'}
          </span>
        )}
      </label>

      <div className="input-wrapper">
        {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`field-input ${icon ? 'field-input--icon' : ''} ${error ? 'field-input--error' : ''}`}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className={`masked-preview ${hasValue ? 'masked-preview--filled' : ''}`}>
        <span className="masked-preview__label">
          {isMasked ? (hasValue ? 'Stored as:' : 'Preview:') : 'Stored as-is:'}
        </span>
        <code className={`masked-preview__value ${!hasValue ? 'masked-preview__value--empty' : ''}`}>
          {hasValue ? maskedValue : '—'}
        </code>
      </div>
    </div>
  );
}
