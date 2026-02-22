interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors ${className}`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-muted)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'var(--border)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}