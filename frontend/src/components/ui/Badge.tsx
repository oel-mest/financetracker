interface BadgeProps {
  children:   React.ReactNode
  color?:     string   // hex color
  className?: string
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  const style = color
    ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` }
    : {}

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${
        color ? '' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
      } ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}