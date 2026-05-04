type StatusPillProps = {
  text: string
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'white'
}

const tones = {
  green: 'bg-emerald-100 text-emerald-900',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-900',
  blue: 'bg-blue-100 text-blue-900',
  slate: 'bg-slate-100 text-slate-700',
  white: 'bg-white/15 text-white'
}

export function StatusPill({ text, tone = 'slate' }: StatusPillProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {text}
    </span>
  )
}
