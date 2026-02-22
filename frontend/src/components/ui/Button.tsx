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

  const variants = {
    primary:   'bg-[#c8f65d] hover:bg-[#d4f870] text-black',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700',
    ghost:     'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
    danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}