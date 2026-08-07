export function TextArea({ label, error, hint, className = '', ...props }) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <textarea className={`textarea ${error ? 'error' : ''} ${className}`.trim()} {...props} />
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-help">{hint}</span> : null}
    </label>
  );
}