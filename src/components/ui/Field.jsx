/**
 * Field — Form field wrapper with label and optional error message.
 *
 * Wraps form inputs with a styled label and displays validation errors in red.
 *
 * @param {Object} props
 * @param {string} props.label - Field label text
 * @param {React.ReactNode} props.children - Form input element(s)
 * @param {string} [props.error] - Optional error message displayed in red below the field
 *
 * Requirements: 9.5
 */
export default function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-4)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <div style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
