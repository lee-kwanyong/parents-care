'use client'

import Link from 'next/link'

export function GuardianSignupPanel() {
  return (
    <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
      <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
        보호자 로그인
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#173B36]">
        보호자는 로그인 화면에서 시작합니다.
      </h1>

      <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
        보호자 회원가입 단계는 현재 로그인 화면으로 통합되어 있습니다.
        부모님 연결코드는 로그인 후 가족 연결 화면에서 만들 수 있습니다.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/login"
          className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white"
        >
          로그인으로 이동
        </Link>

        <Link
          href="/family-link"
          className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
        >
          부모님 연결하기
        </Link>
      </div>
    </section>
  )
}

export default GuardianSignupPanel
