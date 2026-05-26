'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

const guides = [
  {
    title: 'iPhone Safari에서 추가하기',
    desc: 'Safari로 접속한 뒤 하단 공유 버튼을 누르고, “홈 화면에 추가”를 선택하세요.',
    badge: 'iPhone'
  },
  {
    title: 'Android Chrome에서 추가하기',
    desc: 'Chrome 오른쪽 위 메뉴를 누르고, “앱 설치” 또는 “홈 화면에 추가”를 선택하세요.',
    badge: 'Android'
  },
  {
    title: '네이버앱·기타 브라우저 사용 중이라면',
    desc: '설치 메뉴가 바로 보이지 않을 수 있습니다. Safari 또는 Chrome으로 parents-care.net에 접속한 뒤 추가하면 가장 안정적입니다.',
    badge: '안내'
  },
  {
    title: 'PC Chrome에서 설치하기',
    desc: '주소창 오른쪽 설치 아이콘을 누르거나, 브라우저 메뉴에서 “페이지를 앱으로 설치”를 선택하세요.',
    badge: 'PC'
  }
]

export default function InstallPage() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }

    function onInstalled() {
      setMessage('홈 화면에 추가되었습니다.')
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function installApp() {
    if (!promptEvent) {
      setMessage('이 브라우저에서는 자동 설치 버튼이 뜨지 않습니다. 아래 안내대로 브라우저 메뉴에서 직접 추가해주세요.')
      return
    }

    await promptEvent.prompt()
    const choice = await promptEvent.userChoice.catch(() => null)

    if (choice?.outcome === 'accepted') {
      setMessage('설치가 시작되었습니다.')
    } else {
      setMessage('설치가 취소되었습니다. 필요하면 다시 눌러주세요.')
    }

    setPromptEvent(null)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F2FFFB_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            홈 화면에 추가
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            부모님 안심케어를
            <br />
            앱처럼 사용하세요.
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-[#637B76]">
            홈 화면에 추가하면 브라우저 주소를 매번 입력하지 않아도 바로 접속할 수 있습니다.
            설치 버튼이 바로 뜨지 않는 브라우저에서는 아래 방법대로 직접 추가해주세요.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={installApp}
              className="rounded-[1.5rem] bg-[#123F38] px-6 py-5 text-center text-lg font-black text-white shadow-sm"
            >
              설치 버튼 확인하기
            </button>

            <Link
              href="/"
              className="rounded-[1.5rem] bg-[#EFFFF9] px-6 py-5 text-center text-lg font-black text-[#116D5F] shadow-sm ring-1 ring-[#CDEFE5]"
            >
              홈으로 돌아가기
            </Link>
          </div>

          {message ? (
            <div className="mt-5 rounded-[1.5rem] bg-[#FFF8E8] p-5 text-base font-black leading-7 text-[#735212] ring-1 ring-[#F0D299]">
              {message}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <article
              key={guide.title}
              className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8]"
            >
              <div className="inline-flex rounded-full bg-[#F2FAF8] px-3 py-1 text-xs font-black text-[#159B84] ring-1 ring-[#DDEEEA]">
                {guide.badge}
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[#173B36]">
                {guide.title}
              </h2>

              <p className="mt-3 text-base font-bold leading-8 text-[#637B76]">
                {guide.desc}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[2rem] bg-[#123F38] p-6 text-white">
          <p className="text-sm font-black text-[#9DF4DD]">
            부모님께 안내할 때
          </p>
          <p className="mt-3 text-xl font-black leading-9 tracking-[-0.04em]">
            “홈 화면에 추가해두면 앞으로는 아이콘만 눌러서 안부 체크를 할 수 있어요.”
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/parent/login"
            className="rounded-[1.5rem] bg-white px-6 py-5 text-center text-lg font-black text-[#173B36] shadow-sm ring-1 ring-[#D8EEE8]"
          >
            부모님 6자리 코드 입력
          </Link>

          <Link
            href="/family-link"
            className="rounded-[1.5rem] bg-white px-6 py-5 text-center text-lg font-black text-[#173B36] shadow-sm ring-1 ring-[#D8EEE8]"
          >
            부모님 연결 방법 보기
          </Link>
        </div>
      </section>
    </main>
  )
}
