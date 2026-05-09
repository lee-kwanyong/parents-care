import type { HTMLAttributes, ReactNode } from 'react'

type CareCardTone =
  | 'white'
  | 'soft'
  | 'blue'
  | 'green'
  | 'dark'
  | 'amber'
  | 'red'

type CareCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  tone?: CareCardTone
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function toneClasses(tone: CareCardTone) {
  switch (tone) {
    case 'white':
      return 'bg-white border border-[#E3EFEC] text-[#243F3B]'
    case 'soft':
      return 'bg-[#FBFEFD] border border-[#E3EFEC] text-[#243F3B]'
    case 'blue':
      return 'bg-[#F1FAFE] border border-[#DDEDF5] text-[#243F3B]'
    case 'green':
      return 'bg-[#F0FBF7] border border-[#D3ECE6] text-[#243F3B]'
    case 'dark':
      return 'bg-[#F4FAFC] border border-[#DDEDF5] text-[#243F3B]'
    case 'amber':
      return 'bg-[#FFF9EF] border border-[#F0E0C4] text-[#514536]'
    case 'red':
      return 'bg-[#FFF5F5] border border-[#F0D6D8] text-[#5C4245]'
    default:
      return 'bg-white border border-[#E3EFEC] text-[#243F3B]'
  }
}

export function CareCard({
  children,
  tone = 'white',
  className,
  ...props
}: CareCardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.8rem] p-5 md:p-6',
        'shadow-[0_16px_44px_rgba(93,139,131,0.10)]',
        toneClasses(tone),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
