interface CardProps {
  children:   React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl backdrop-blur-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {children}
    </div>
  )
}