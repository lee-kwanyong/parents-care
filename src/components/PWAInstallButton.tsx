'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

type PWAInstallButtonProps = {
  className?: string
  label?: string
  guideOnly?: boolean
}

export function PWAInstallButton({
  className = '',
  label = '홈추가',
  guideOnly = false
}: PWAInstallButtonProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    setInstalled(Boolean(isStandalone))

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }

    function onInstalled() {
      setInstalled(true)
      setPromptEvent(null)
      setOpen(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleClick() {
    if (installed) {
      setOpen(true)
      return
    }

    if (!guideOnly && promptEvent) {
      await promptEvent.prompt()
      await promptEvent.userChoice.catch(() => null)
      setPromptEvent(null)
      setOpen(false)
      return
    }

    setOpen((value) => !value)
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          'rounded-full bg-[#F2FAF8] px-3 py-2 text-xs font-black text-[#537875] ring-1 ring-[#DDEEEA] transition hover:bg-[#E4F7F2] sm:px-4 sm:text-sm'
        }
      >
        {label}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="홈추가 안내 닫기"
            className="fixed inset-0 z-[85] cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-[calc(100%+10px)] z-[90] w-[min(21rem,calc(100vw-1.5rem))] rounded-[1.5rem] border border-[#DCEDE7] bg-white p-4 text-left shadow-[0_18px_48px_rgba(20,82,70,0.16)]">
            <div className="text-sm font-black text-[#159B84]">
              {installed ? '이미 앱처럼 실행 중입니다.' : '홈 화면에 추가하기'}
            </div>

            <div className="mt-3 space-y-2 text-xs font-bold leading-6 text-[#5F7772]">
              <p>설치 버튼이 바로 뜨지 않으면 브라우저 메뉴에서 직접 추가할 수 있습니다.</p>
              <p>Android Chrome: 오른쪽 위 메뉴 → 앱 설치 또는 홈 화면에 추가</p>
              <p>iPhone Safari: 공유 버튼 → 홈 화면에 추가</p>
              <p>PC Chrome: 주소창 오른쪽 설치 아이콘 또는 브라우저 메뉴에서 앱 설치</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-2xl bg-[#193B38] px-4 py-3 text-sm font-black text-white"
            >
              확인
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
