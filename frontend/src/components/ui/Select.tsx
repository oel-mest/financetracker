interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string
  error?:   string
  options:  { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-zinc-800/60 border ${
          error ? 'border-red-500/50' : 'border-zinc-700'
        } rounded-lg px-3 py-2.5 text-white text-sm
        focus:outline-none focus:border-[#c8f65d] focus:ring-1 focus:ring-[#c8f65d]/20
        transition-colors ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-zinc-900">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}