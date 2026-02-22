interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md'
}

export function Button({
  variant = 'primary',
  size    = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { backgroundColor: 'var(--accent)', color: '#000' },
    secondary: { backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    ghost:     { color: 'var(--text-secondary)', backgroundColor: 'transparent' },
    danger:    { backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' },
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={variantStyles[variant]}
      {...props}
    >
      {children}
    </button>
  )
}