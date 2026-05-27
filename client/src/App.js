import React, { useState } from 'react';
import MaskedField from './components/MaskedField';
import SubmissionHistory from './components/SubmissionHistory';
import { useForm } from './hooks/useForm';
import './App.css';

export default function App() {
  const {
    fields, masked, errors, status, serverError,
    submissions, loadingHistory,
    handleChange, handleSubmit, fetchSubmissions, reset,
  } = useForm();

  const [tab, setTab] = useState('form'); // 'form' | 'history'

  const isSubmitting = status === 'submitting';
  const isSuccess    = status === 'success';

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__logo">
            <span className="app-header__shield">🔐</span>
            <div>
              <h1 className="app-header__title">SecureForm</h1>
              <p className="app-header__sub">Real-time data masking · MERN stack</p>
            </div>
          </div>
          <div className="app-header__pills">
            <span className="pill pill--green">MongoDB</span>
            <span className="pill pill--blue">Express</span>
            <span className="pill pill--cyan">React</span>
            <span className="pill pill--yellow">Node.js</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Explainer banner */}
        <div className="banner">
          <span className="banner__icon">ℹ️</span>
          <p className="banner__text">
            Sensitive fields are masked <strong>as you type</strong> — the preview below each input shows
            what gets stored. Raw values travel to the server only once and are immediately discarded
            after masking is applied.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="tabs">
          <button
            className={`tab ${tab === 'form' ? 'tab--active' : ''}`}
            onClick={() => setTab('form')}
          >
            Submit data
          </button>
          <button
            className={`tab ${tab === 'history' ? 'tab--active' : ''}`}
            onClick={() => { setTab('history'); fetchSubmissions(); }}
          >
            View stored records
          </button>
        </div>

        {tab === 'form' && (
          <>
            {isSuccess ? (
              <div className="success-card">
                <span className="success-card__icon">✅</span>
                <h2>Submitted successfully</h2>
                <p>Only masked values were saved to MongoDB. Raw data was never persisted.</p>
                <button className="btn btn--primary" onClick={reset}>Submit another</button>
              </div>
            ) : (
              <form className="form-card" onSubmit={handleSubmit} noValidate>
                {errors._form && (
                  <div className="form-alert">{errors._form}</div>
                )}
                {serverError && (
                  <div className="form-alert">{serverError}</div>
                )}

                <MaskedField
                  label="Full name"
                  name="name"
                  value={fields.name}
                  maskedValue={masked.name}
                  isMasked={false}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Jane Doe"
                  icon="👤"
                />

                <MaskedField
                  label="Email address"
                  name="email"
                  value={fields.email}
                  maskedValue={masked.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="jane@example.com"
                  icon="✉️"
                />

                <div className="form-row">
                  <MaskedField
                    label="Phone number"
                    name="phone"
                    value={fields.phone}
                    maskedValue={masked.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="+254 712 345 678"
                    icon="📞"
                  />
                  <MaskedField
                    label="National ID / SSN"
                    name="nationalId"
                    value={fields.nationalId}
                    maskedValue={masked.nationalId}
                    onChange={handleChange}
                    error={errors.nationalId}
                    placeholder="12345678"
                    icon="🪪"
                  />
                </div>

                <MaskedField
                  label="Card number"
                  name="cardNumber"
                  value={fields.cardNumber}
                  maskedValue={masked.cardNumber}
                  onChange={handleChange}
                  error={errors.cardNumber}
                  placeholder="4111 1111 1111 1111"
                  icon="💳"
                  maxLength={19}
                />

                {/* Live payload preview */}
                <div className="payload-preview">
                  <p className="payload-preview__label">📦 Payload sent to <code>POST /api/submissions</code></p>
                  <pre className="payload-preview__pre">
{JSON.stringify({
  name:       fields.name       || '',
  email:      masked.email      || '',
  phone:      masked.phone      || '',
  nationalId: masked.nationalId || '',
  cardNumber: masked.cardNumber || '',
}, null, 2)}
                  </pre>
                  <p className="payload-preview__note">
                    🟢 Green fields = masked &nbsp;|&nbsp; 🟡 name = stored as-is
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn--primary btn--full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : '🔒 Submit (masked data only)'}
                </button>
              </form>
            )}
          </>
        )}

        {tab === 'history' && (
          <SubmissionHistory
            submissions={submissions}
            loading={loadingHistory}
            onFetch={fetchSubmissions}
          />
        )}
      </main>
    </div>
  );
}
