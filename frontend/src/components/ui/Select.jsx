export function Select({ label, error, hint, className = '', children, ...props }) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <select className={`select ${error ? 'error' : ''} ${className}`.trim()} {...props}>
        {children}
      </select>
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-help">{hint}</span> : null}
    </label>
  );
}