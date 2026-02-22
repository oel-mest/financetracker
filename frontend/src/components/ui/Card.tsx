interface CardProps {
  children:   React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-zinc-900/60 border border-zinc-800 rounded-xl backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}