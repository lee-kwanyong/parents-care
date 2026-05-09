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
      return 'bg-white border border-[#E4F0EE] text-[#314846]'
    case 'soft':
      return 'bg-[#FBFEFD] border border-[#E4F0EE] text-[#314846]'
    case 'blue':
      return 'bg-[#F3FAFE] border border-[#DDEDF5] text-[#314846]'
    case 'green':
      return 'bg-[#F2FBF8] border border-[#D5ECE7] text-[#314846]'
    case 'dark':
      return 'bg-[#F4FAFC] border border-[#DDEDF5] text-[#314846]'
    case 'amber':
      return 'bg-[#FFF9EF] border border-[#F0E0C4] text-[#514536]'
    case 'red':
      return 'bg-[#FFF5F5] border border-[#F0D6D8] text-[#5C4245]'
    default:
      return 'bg-white border border-[#E4F0EE] text-[#314846]'
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
        'shadow-[0_16px_44px_rgba(125,169,162,0.10)]',
        toneClasses(tone),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
