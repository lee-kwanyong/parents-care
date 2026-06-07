'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const beforeInstall = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }

    const appInstalled = () => {
      setInstalled(true)
      setEvent(null)
    }

    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', appInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', appInstalled)
    }
  }, [])

  if (installed) {
    return (
      <div className="rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
        안부웍스 앱이 홈 화면에 설치되었습니다.
      </div>
    )
  }

  if (!event) {
    return (
      <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
        휴대폰 브라우저 메뉴에서 “홈 화면에 추가”를 누르면 앱처럼 사용할 수 있습니다.
      </div>
    )
  }

  return (
    <button
      onClick={async () => {
        await event.prompt()
        await event.userChoice.catch(() => null)
        setEvent(null)
      }}
      className="w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white"
    >
      안부웍스 앱 설치하기
    </button>
  )
}

export default InstallPrompt
