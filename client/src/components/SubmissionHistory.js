import React from 'react';

export default function SubmissionHistory({ submissions, loading, onFetch }) {
  return (
    <section className="history">
      <div className="history__header">
        <h2 className="history__title">Stored submissions</h2>
        <button className="btn btn--outline" onClick={onFetch} disabled={loading}>
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {submissions.length === 0 && !loading && (
        <p className="history__empty">No submissions yet. Submit the form above to see masked records here.</p>
      )}

      {submissions.length > 0 && (
        <div className="history__table-wrap">
          <table className="history__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email (masked)</th>
                <th>Phone (masked)</th>
                <th>ID (masked)</th>
                <th>Card (masked)</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s._id}>
                  <td>{s.name || '—'}</td>
                  <td><code>{s.email || '—'}</code></td>
                  <td><code>{s.phone || '—'}</code></td>
                  <td><code>{s.nationalId || '—'}</code></td>
                  <td><code>{s.cardNumber || '—'}</code></td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
