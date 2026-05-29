'use client'

import Link from 'next/link'

export function GuardianSignupPanel() {
  return (
    <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8] sm:p-8">
      <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
        보호자 회원가입
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] text-[#173B36]">
        보호자는 부모님 연결코드부터 만듭니다.
      </h1>

      <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
        보호자 계정 화면은 부모님 연결코드 생성 화면으로 연결됩니다.
        부모님은 별도 회원가입 없이 6자리 코드만 입력하면 됩니다.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/family-link"
          className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white"
        >
          부모님 연결코드 만들기
        </Link>

        <Link
          href="/login"
          className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
        >
          로그인 화면
        </Link>
      </div>
    </section>
  )
}

export default GuardianSignupPanel
