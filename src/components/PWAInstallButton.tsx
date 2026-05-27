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
    <div className="relative inline-flex w-full">
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          'w-full rounded-xl bg-[#EFFFF9] px-3 py-2.5 text-left text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5] transition hover:bg-[#DDF8EF]'
        }
      >
        {label}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="홈추가 안내 닫기"
            className="fixed inset-0 z-[95] cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div className="fixed left-3 right-3 top-24 z-[100] rounded-[1.25rem] border border-[#DCEDE7] bg-white p-4 text-left shadow-[0_18px_48px_rgba(20,82,70,0.18)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[21rem]">
            <div className="text-sm font-black text-[#159B84]">
              {installed ? '이미 앱처럼 실행 중입니다.' : '홈 화면에 추가하기'}
            </div>

            <div className="mt-3 space-y-2 text-xs font-bold leading-6 text-[#5F7772]">
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
