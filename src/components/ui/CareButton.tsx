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
      return 'bg-[#19B99A] text-white hover:bg-[#16A98D] ring-1 ring-[#19B99A]/25'
    case 'soft':
      return 'bg-[#EAF8F5] text-[#315F59] hover:bg-[#DDF3EF] ring-1 ring-[#CFE9E4]'
    case 'white':
      return 'bg-white text-[#315F59] hover:bg-[#FBFEFD] ring-1 ring-[#DDEBE8]'
    case 'ghost':
      return 'bg-transparent text-[#587A76] hover:bg-[#F0FAF8] ring-1 ring-transparent'
    case 'dark':
      return 'bg-[#DCEFF7] text-[#365E78] hover:bg-[#D1E9F4] ring-1 ring-[#C2DDEA]'
    case 'danger':
      return 'bg-[#F7D5D5] text-[#8A4A4A] hover:bg-[#F2C7C7] ring-1 ring-[#EEC4C4]'
    case 'amber':
      return 'bg-[#F8E9C9] text-[#735C31] hover:bg-[#F4DEB1] ring-1 ring-[#EAD3A7]'
    case 'blue':
      return 'bg-[#DCEFF7] text-[#365E78] hover:bg-[#D1E9F4] ring-1 ring-[#C2DDEA]'
    case 'green':
      return 'bg-[#E6F8F3] text-[#2D6A60] hover:bg-[#D8F1EC] ring-1 ring-[#C8E8E1]'
    default:
      return 'bg-[#19B99A] text-white hover:bg-[#16A98D] ring-1 ring-[#19B99A]/25'
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
    'shadow-[0_10px_28px_rgba(25,185,154,0.17)]',
    'focus:outline-none focus:ring-2 focus:ring-[#A9E6DA] focus:ring-offset-2',
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
