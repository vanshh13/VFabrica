export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <input className={`input ${error ? 'error' : ''} ${className}`.trim()} {...props} />
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-help">{hint}</span> : null}
    </label>
  );
}