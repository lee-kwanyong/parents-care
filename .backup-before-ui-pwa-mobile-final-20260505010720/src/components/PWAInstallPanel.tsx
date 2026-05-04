'use client'

import { useEffect, useMemo, useState } from 'react'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { PWARegister } from '@/components/PWARegister'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function detectPlatform() {
  if (typeof window === 'undefined') return 'unknown'

  const ua = window.navigator.userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  if (/macintosh|mac os x/.test(ua)) return 'mac'
  if (/windows/.test(ua)) return 'windows'

  return 'unknown'
}

export function PWAInstallPanel({ mode = 'guardian' }: { mode?: 'guardian' | 'parent' }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [platform, setPlatform] = useState('unknown')

  useEffect(() => {
    setPlatform(detectPlatform())

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const steps = useMemo(() => {
    if (platform === 'ios') {
      return [
        '사파리에서 이 페이지를 엽니다.',
        '아래 공유 버튼을 누릅니다.',
        '홈 화면에 추가를 누릅니다.',
        mode === 'parent' ? '홈 화면에서 “부모님케어”를 누르면 큰 글씨 화면이 바로 열립니다.' : '홈 화면에서 “부모님케어”를 누르면 자녀앱이 바로 열립니다.'
      ]
    }

    if (platform === 'android') {
      return [
        '크롬에서 이 페이지를 엽니다.',
        '주소창 옆 메뉴 또는 설치 안내를 누릅니다.',
        '앱 설치 또는 홈 화면에 추가를 누릅니다.',
        mode === 'parent' ? '홈 화면에서 바로 부모님 큰 글씨 화면을 열 수 있습니다.' : '홈 화면에서 바로 오늘의 안심판을 열 수 있습니다.'
      ]
    }

    return [
      '브라우저에서 이 페이지를 엽니다.',
      '설치 버튼이 보이면 누릅니다.',
      '설치 버튼이 보이지 않으면 브라우저 메뉴에서 홈 화면에 추가 또는 앱 설치를 선택합니다.',
      '설치 후 홈 화면이나 앱 목록에서 바로 열 수 있습니다.'
    ]
  }, [mode, platform])

  async function install() {
    if (!installEvent) return

    await installEvent.prompt()
    const choice = await installEvent.userChoice

    if (choice.outcome === 'accepted') {
      setInstalled(true)
      setInstallEvent(null)
    }
  }

  return (
    <>
      <PWARegister />

      <CareCard tone={mode === 'parent' ? 'blue' : 'green'}>
        <div className="flex flex-wrap gap-2">
          <StatusPill text="PWA" tone={mode === 'parent' ? 'blue' : 'green'} />
          <StatusPill text="홈 화면에 추가" tone="slate" />
          {installed ? <StatusPill text="설치됨" tone="green" /> : null}
        </div>

        <h2 className="mt-4 text-3xl font-black">
          {mode === 'parent' ? '부모님 폰에 큰 버튼으로 추가하세요.' : '자녀 폰에 앱처럼 추가하세요.'}
        </h2>

        <p className="mt-3 text-base font-bold leading-7 text-slate-700">
          {mode === 'parent'
            ? '부모님은 복잡한 메뉴 없이 홈 화면 버튼을 눌러 오늘 일정, 만남 암호, 자녀 전화, 도움 요청만 보면 됩니다.'
            : '자녀는 홈 화면에서 오늘의 안심판, 사진·카톡 맡기기, 가족 할 일을 바로 확인할 수 있습니다.'}
        </p>

        {installEvent ? (
          <div className="mt-5">
            <CareButton onClick={install} size="xl" className="md:w-full">
              앱처럼 설치하기
            </CareButton>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl bg-white p-4">
              <div className="text-sm font-black text-slate-500">{index + 1}단계</div>
              <div className="mt-1 text-lg font-black">{step}</div>
            </div>
          ))}
        </div>
      </CareCard>
    </>
  )
}
