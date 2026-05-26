'use client'

import { useEffect, useMemo, useState } from 'react'

const ACCESSIBILITY_KEY = 'anbuworks_accessibility_preferences'

type PermissionStatusText = '허용됨' | '거부됨' | '대기중' | '지원 안 됨' | '확인 필요'

type AccessibilityPreferences = {
  largeText: boolean
  highContrast: boolean
  reduceMotion: boolean
}

const defaultAccessibilityPreferences: AccessibilityPreferences = {
  largeText: false,
  highContrast: false,
  reduceMotion: false
}

function readAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') return defaultAccessibilityPreferences

  try {
    return {
      ...defaultAccessibilityPreferences,
      ...JSON.parse(window.localStorage.getItem(ACCESSIBILITY_KEY) || '{}')
    }
  } catch {
    return defaultAccessibilityPreferences
  }
}

function saveAccessibilityPreferences(preferences: AccessibilityPreferences) {
  window.localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new Event('anbuworks-accessibility-updated'))
}

function statusBadgeClass(status: PermissionStatusText) {
  if (status === '허용됨') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === '거부됨') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (status === '지원 안 됨') return 'bg-[#F7F7F7] text-[#6F7775] ring-[#E3E3E3]'
  return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
}

async function ensureServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null

  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing

  return navigator.serviceWorker.register('/sw.js')
}

export function AppPermissionCenter() {
  const [notificationStatus, setNotificationStatus] = useState<PermissionStatusText>('확인 필요')
  const [locationStatus, setLocationStatus] = useState<PermissionStatusText>('확인 필요')
  const [locationText, setLocationText] = useState('')
  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(defaultAccessibilityPreferences)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotificationStatus('지원 안 됨')
    } else if (Notification.permission === 'granted') {
      setNotificationStatus('허용됨')
    } else if (Notification.permission === 'denied') {
      setNotificationStatus('거부됨')
    } else {
      setNotificationStatus('대기중')
    }

    if (!('geolocation' in navigator)) {
      setLocationStatus('지원 안 됨')
    } else {
      const saved = window.localStorage.getItem('anbuworks_location_permission')
      const savedLocation = window.localStorage.getItem('anbuworks_last_location_text')

      if (saved === 'granted') setLocationStatus('허용됨')
      if (saved === 'denied') setLocationStatus('거부됨')
      if (savedLocation) setLocationText(savedLocation)
    }

    setAccessibility(readAccessibilityPreferences())
  }, [])

  const enabledAccessibilityCount = useMemo(() => {
    return Object.values(accessibility).filter(Boolean).length
  }, [accessibility])

  async function requestNotificationPermission() {
    setMessage('')

    if (!('Notification' in window)) {
      setNotificationStatus('지원 안 됨')
      setMessage('이 브라우저는 앱 알림을 지원하지 않습니다.')
      return
    }

    try {
      const result = await Notification.requestPermission()

      if (result === 'granted') {
        setNotificationStatus('허용됨')
        window.localStorage.setItem('anbuworks_notification_permission', 'granted')

        const registration = await ensureServiceWorkerRegistration().catch(() => null)

        if (registration?.showNotification) {
          await registration.showNotification('안부웍스 알림이 켜졌어요', {
            body: '부모님 안부 확인, 응답 없음, 복약 알림을 받을 준비가 되었습니다.',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { url: '/child/daily-care' }
          })
        }

        setMessage('앱 알림이 허용되었습니다. 실제 정기 푸시 알림은 서버 알림 설정과 연결하면 사용할 수 있습니다.')
      } else if (result === 'denied') {
        setNotificationStatus('거부됨')
        window.localStorage.setItem('anbuworks_notification_permission', 'denied')
        setMessage('앱 알림이 거부되었습니다. 다시 허용하려면 브라우저 사이트 설정에서 알림을 허용해주세요.')
      } else {
        setNotificationStatus('대기중')
        setMessage('아직 알림 허용이 완료되지 않았습니다.')
      }
    } catch {
      setMessage('알림 권한을 요청하는 중 오류가 발생했습니다.')
    }
  }

  async function requestLocationPermission() {
    setMessage('')

    if (!('geolocation' in navigator)) {
      setLocationStatus('지원 안 됨')
      setMessage('이 브라우저는 위치 권한을 지원하지 않습니다.')
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 1000 * 60 * 10
        })
      })

      const latitude = position.coords.latitude.toFixed(5)
      const longitude = position.coords.longitude.toFixed(5)
      const savedText = `위도 ${latitude}, 경도 ${longitude}`

      setLocationStatus('허용됨')
      setLocationText(savedText)

      window.localStorage.setItem('anbuworks_location_permission', 'granted')
      window.localStorage.setItem('anbuworks_last_location_text', savedText)

      setMessage('위치 권한이 허용되었습니다. 병원동행, 귀가확인, 지역 케어파트너 배정에 활용할 수 있습니다.')
    } catch (error) {
      setLocationStatus('거부됨')
      window.localStorage.setItem('anbuworks_location_permission', 'denied')

      if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
        setMessage('위치 권한이 거부되었습니다. 다시 허용하려면 브라우저 사이트 설정에서 위치를 허용해주세요.')
      } else {
        setMessage('위치를 확인하지 못했습니다. 네트워크 상태나 브라우저 권한을 확인해주세요.')
      }
    }
  }

  function toggleAccessibility(key: keyof AccessibilityPreferences) {
    const next = {
      ...accessibility,
      [key]: !accessibility[key]
    }

    setAccessibility(next)
    saveAccessibilityPreferences(next)

    setMessage('접근성 설정이 저장되었습니다.')
  }

  function resetAccessibility() {
    setAccessibility(defaultAccessibilityPreferences)
    saveAccessibilityPreferences(defaultAccessibilityPreferences)
    setMessage('접근성 설정을 기본값으로 되돌렸습니다.')
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 text-[#173B36]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          안부웍스 앱 권한
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          알림, 위치, 접근성을
          <br />
          한 번에 설정하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          부모님 안부 확인, 응답 없음 알림, 병원동행 위치 확인, 큰 글씨 화면을 사용하려면 필요한 권한을 먼저 확인해주세요.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#126F61] ring-1 ring-[#CDEFE5]">
            {message}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <PermissionCard
          title="앱 알림"
          status={notificationStatus}
          description="응답 없음, 복약 확인, 병원 일정, 보호자 확인 필요 알림을 받을 수 있게 준비합니다."
          buttonLabel="알림 허용하기"
          onClick={requestNotificationPermission}
          notes={[
            '브라우저가 허용창을 띄우면 허용을 눌러주세요.',
            '거부한 경우 브라우저 사이트 설정에서 다시 허용해야 합니다.',
            '정기 푸시 알림은 서버 푸시 설정과 연결 후 사용할 수 있습니다.'
          ]}
        />

        <PermissionCard
          title="위치"
          status={locationStatus}
          description="병원동행, 귀가 확인, 가까운 케어파트너 배정에 필요한 위치 확인 권한입니다."
          buttonLabel="위치 허용하기"
          onClick={requestLocationPermission}
          notes={[
            '위치는 동의한 경우에만 확인합니다.',
            '정확한 주소보다 지역 배정과 안전 확인 목적에 맞춰 사용합니다.',
            locationText ? `최근 확인 위치: ${locationText}` : '아직 확인된 위치가 없습니다.'
          ]}
        />

        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.05em]">접근성 지원</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">
                부모님이 보기 편하도록 글씨, 대비, 움직임 설정을 조정합니다.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-[#EFFFF9] px-3 py-1 text-xs font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
              {enabledAccessibilityCount}개 적용
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <AccessibilityToggle
              title="큰 글씨"
              desc="전체 글씨 크기를 조금 키웁니다."
              checked={accessibility.largeText}
              onClick={() => toggleAccessibility('largeText')}
            />

            <AccessibilityToggle
              title="고대비"
              desc="배경과 글자 대비를 강하게 합니다."
              checked={accessibility.highContrast}
              onClick={() => toggleAccessibility('highContrast')}
            />

            <AccessibilityToggle
              title="움직임 줄이기"
              desc="전환 효과와 움직임을 줄입니다."
              checked={accessibility.reduceMotion}
              onClick={() => toggleAccessibility('reduceMotion')}
            />
          </div>

          <button
            type="button"
            onClick={resetAccessibility}
            className="mt-4 w-full rounded-2xl bg-[#F7FBFF] px-4 py-3 text-sm font-black text-[#234B68] ring-1 ring-[#DCEDE7]"
          >
            접근성 설정 초기화
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em]">접근성 권한 안내</h2>
        <p className="mt-3 text-sm font-bold leading-7 text-[#CDEEE6]">
          웹앱은 Android나 iPhone의 시스템 접근성 권한창을 직접 띄울 수 없습니다.
          대신 안부웍스 안에서 큰 글씨, 고대비, 움직임 줄이기 설정을 제공하고,
          기기 자체의 접근성 설정은 사용자가 직접 켜야 합니다.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-sm font-black text-[#9DF4DD]">Android</div>
            <p className="mt-2 text-sm font-bold leading-6 text-[#E7FFF7]">
              설정 → 접근성 → 글자 크기, 화면 확대, 고대비 텍스트를 조정하세요.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-sm font-black text-[#9DF4DD]">iPhone</div>
            <p className="mt-2 text-sm font-bold leading-6 text-[#E7FFF7]">
              설정 → 손쉬운 사용 → 디스플레이 및 텍스트 크기, 더 큰 텍스트를 조정하세요.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
        안부온은 의료 진단, 처방, 응급 판단을 제공하지 않습니다.
        앱 알림과 위치는 부모님 안부 확인, 보호자 알림, 케어파트너 연결을 돕기 위한 목적으로만 사용해야 합니다.
        응급상황은 119 또는 의료기관에 연락하세요.
      </div>
    </section>
  )
}

function PermissionCard({
  title,
  status,
  description,
  buttonLabel,
  onClick,
  notes
}: {
  title: string
  status: PermissionStatusText
  description: string
  buttonLabel: string
  onClick: () => void
  notes: string[]
}) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.05em]">{title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{description}</p>
        </div>

        <span className={'shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusBadgeClass(status)}>
          {status}
        </span>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 w-full rounded-2xl bg-[#193B38] px-4 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#24423F]"
      >
        {buttonLabel}
      </button>

      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <p key={note} className="rounded-2xl bg-[#F8FCFB] p-3 text-xs font-bold leading-6 text-[#5F7772]">
            {note}
          </p>
        ))}
      </div>
    </div>
  )
}

function AccessibilityToggle({
  title,
  desc,
  checked,
  onClick
}: {
  title: string
  desc: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full rounded-2xl p-4 text-left ring-1 transition ' +
        (checked
          ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
          : 'bg-[#F8FCFB] text-[#24423F] ring-[#DCEDE7]')
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-black">{title}</div>
          <div className="mt-1 text-xs font-bold leading-5 opacity-75">{desc}</div>
        </div>

        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black ring-1 ring-current/10">
          {checked ? '켜짐' : '꺼짐'}
        </span>
      </div>
    </button>
  )
}
