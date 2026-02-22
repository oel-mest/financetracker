interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:  string
  error?:  string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-zinc-800/60 border ${
          error ? 'border-red-500/50' : 'border-zinc-700'
        } rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-600
        focus:outline-none focus:border-[#c8f65d] focus:ring-1 focus:ring-[#c8f65d]/20
        transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}