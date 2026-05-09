type StatusTone = 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'white'

type StatusPillProps = {
  text: string
  tone?: StatusTone
  className?: string
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function toneClasses(tone: StatusTone) {
  switch (tone) {
    case 'green':
      return 'bg-[#E5F8F4] text-[#2F756B] ring-1 ring-[#CBEAE4]'
    case 'blue':
      return 'bg-[#EAF6FC] text-[#456F88] ring-1 ring-[#D1EAF5]'
    case 'amber':
      return 'bg-[#FFF5DF] text-[#886B35] ring-1 ring-[#F0DDB6]'
    case 'red':
      return 'bg-[#FFF0F1] text-[#965D65] ring-1 ring-[#EFD2D6]'
    case 'white':
      return 'bg-white text-[#557A76] ring-1 ring-white/80'
    case 'slate':
    default:
      return 'bg-[#F4FAF9] text-[#667F7C] ring-1 ring-[#E2EFEC]'
  }
}

export function StatusPill({
  text,
  tone = 'slate',
  className
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-black tracking-[-0.01em]',
        toneClasses(tone),
        className
      )}
    >
      {text}
    </span>
  )
}
