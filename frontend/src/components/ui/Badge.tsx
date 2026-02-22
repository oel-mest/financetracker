interface BadgeProps {
  children:   React.ReactNode
  color?:     string
  className?: string
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  const style = color
    ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` }
    : {
        backgroundColor: 'var(--bg-hover)',
        color: 'var(--text-secondary)',
        borderColor: 'var(--border)',
      }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}