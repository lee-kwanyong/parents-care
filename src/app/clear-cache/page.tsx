'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ClearCachePage() {
  const [status, setStatus] = useState('Service Worker와 브라우저 캐시를 정리하는 중입니다...')

  useEffect(() => {
    async function clearAll() {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map((registration) => registration.unregister()))
        }

        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((key) => caches.delete(key)))
        }

        window.localStorage.clear()
        window.sessionStorage.clear()

        setStatus('완료됐습니다. 홈으로 돌아가서 새로고침해주세요.')
      } catch {
        setStatus('일부 캐시 정리에 실패했습니다. 브라우저 새로고침을 한 번 더 해주세요.')
      }
    }

    clearAll()
  }, [])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-10 text-[#24423F]">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-[#E3F0ED] bg-white p-7 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
        <div className="inline-flex rounded-full bg-[#E5F8F4] px-4 py-2 text-sm font-black text-[#2F756B]">
          캐시 초기화
        </div>

        <h1 className="mt-5 text-4xl font-black tracking-[-0.05em]">
          캐시를 초기화했습니다.
        </h1>

        <p className="mt-4 text-base font-bold leading-7 text-[#607D79]">
          {status}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-[#19B99A] px-5 py-4 text-base font-black text-white"
          >
            홈으로 돌아가기
          </Link>

          <Link
            href="/care-request"
            className="rounded-2xl bg-white px-5 py-4 text-base font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            걱정 맡기기 확인
          </Link>
        </div>
      </section>
    </main>
  )
}
