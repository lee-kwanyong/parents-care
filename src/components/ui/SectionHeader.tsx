import type { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  align?: 'left' | 'center'
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  align = 'left'
}: SectionHeaderProps) {
  const isCenter = align === 'center'

  return (
    <section
      className={[
        'rounded-[2rem] border border-[#E1EFEC] bg-[linear-gradient(135deg,#FFFFFF_0%,#F2FBF8_48%,#F3FAFE_100%)] px-6 py-7 shadow-[0_18px_54px_rgba(125,169,162,0.11)] md:px-8 md:py-9',
        isCenter ? 'text-center' : 'text-left'
      ].join(' ')}
    >
      {eyebrow ? (
        <div
          className={[
            'inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-black tracking-[0.02em] text-[#64A098] ring-1 ring-[#D8ECE8]',
            isCenter ? 'mx-auto' : ''
          ].join(' ')}
        >
          {eyebrow}
        </div>
      ) : null}

      <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] text-[#2E504D] md:text-6xl">
        {title}
      </h1>

      {description ? (
        <p
          className={[
            'mt-4 max-w-3xl text-base font-bold leading-7 text-[#63807C] md:text-lg md:leading-8',
            isCenter ? 'mx-auto' : ''
          ].join(' ')}
        >
          {description}
        </p>
      ) : null}

      {actions ? (
        <div
          className={[
            'mt-6 flex flex-wrap gap-3',
            isCenter ? 'justify-center' : ''
          ].join(' ')}
        >
          {actions}
        </div>
      ) : null}
    </section>
  )
}
