import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type CareButtonTone =
  | 'primary'
  | 'soft'
  | 'white'
  | 'ghost'
  | 'dark'
  | 'danger'
  | 'amber'
  | 'blue'
  | 'green'

type CareButtonSize = 'sm' | 'md' | 'lg' | 'xl'

type CareButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  href?: string
  tone?: CareButtonTone
  size?: CareButtonSize
  className?: string
  target?: string
  rel?: string
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function toneClasses(tone: CareButtonTone) {
  switch (tone) {
    case 'primary':
      return 'bg-[#8CCFC3] text-[#244B48] hover:bg-[#7EC5B8] ring-1 ring-[#BFE5DF]'
    case 'soft':
      return 'bg-[#F0FAF8] text-[#466B68] hover:bg-[#E5F5F2] ring-1 ring-[#D2E8E4]'
    case 'white':
      return 'bg-white text-[#466B68] hover:bg-[#FBFEFD] ring-1 ring-[#DCEBE8]'
    case 'ghost':
      return 'bg-transparent text-[#5B7B78] hover:bg-[#F0FAF8] ring-1 ring-transparent'
    case 'dark':
      return 'bg-[#DCEEF6] text-[#3F6177] hover:bg-[#CFE6F1] ring-1 ring-[#C2DCEB]'
    case 'danger':
      return 'bg-[#F7D5D5] text-[#8A4A4A] hover:bg-[#F2C7C7] ring-1 ring-[#EEC4C4]'
    case 'amber':
      return 'bg-[#F8E9C9] text-[#735C31] hover:bg-[#F4DEB1] ring-1 ring-[#EAD3A7]'
    case 'blue':
      return 'bg-[#DCEEF6] text-[#3F6177] hover:bg-[#CFE6F1] ring-1 ring-[#C2DCEB]'
    case 'green':
      return 'bg-[#E5F5F2] text-[#3F6865] hover:bg-[#D8EFEA] ring-1 ring-[#C9E5DF]'
    default:
      return 'bg-[#8CCFC3] text-[#244B48] hover:bg-[#7EC5B8] ring-1 ring-[#BFE5DF]'
  }
}

function sizeClasses(size: CareButtonSize) {
  switch (size) {
    case 'sm':
      return 'px-3 py-2 text-sm rounded-xl'
    case 'md':
      return 'px-4 py-3 text-sm rounded-2xl'
    case 'lg':
      return 'px-5 py-3.5 text-base rounded-2xl'
    case 'xl':
      return 'px-6 py-4 text-lg rounded-3xl'
    default:
      return 'px-4 py-3 text-sm rounded-2xl'
  }
}

export function CareButton({
  children,
  href,
  tone = 'primary',
  size = 'md',
  className,
  target,
  rel,
  type = 'button',
  disabled,
  ...props
}: CareButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 font-black tracking-[-0.01em] transition-all duration-150',
    'shadow-[0_8px_24px_rgba(111,171,162,0.13)]',
    'focus:outline-none focus:ring-2 focus:ring-[#BFE5DF] focus:ring-offset-2',
    disabled ? 'cursor-not-allowed opacity-60' : '',
    toneClasses(tone),
    sizeClasses(size),
    className
  )

  if (href) {
    return (
      <Link href={href} className={classes} target={target} rel={rel}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  )
}
