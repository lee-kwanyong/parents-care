'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const managerSteps = [
  {
    title: '1. 매니저 간단 등록',
    desc: '이름, 연락처, 활동지역, 경력, 기본 동의를 입력합니다.'
  },
  {
    title: '2. 운영실 검증',
    desc: '자격, 경력, 개인정보 취급 동의, 의료행위 금지 원칙을 확인합니다.'
  },
  {
    title: '3. 제안 수신',
    desc: '지역과 가능한 업무가 맞는 부모님 안심케어 제안을 받습니다.'
  },
  {
    title: '4. 현장 수행·정산',
    desc: '수락한 배정을 수행하고 완료 후 정산 예정 내역을 확인합니다.'
  }
]

const managerFeatures = [
  '새 안심케어 제안 확인',
  '수락/거절',
  '오늘 배정 확인',
  '현장 시작·완료',
  '보호자 리포트 생성',
  '정산 예정 확인'
]

export function HomeManagerPanel() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function openFromHash() {
      if (window.location.hash === '#manager-app') {
        setOpen(true)
        setTimeout(() => {
          document.getElementById('manager-app')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 50)
      }
    }

    openFromHash()
    window.addEventListener('hashchange', openFromHash)

    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  function openPanel() {
    setOpen(true)

    setTimeout(() => {
      document.getElementById('manager-app')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 50)
  }

  return (
    <section id="manager-app" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-8">
      <div className="rounded-[2rem] border border-[#DDEEEA] bg-[linear-gradient(135deg,#F0FBF7_0%,#F4FAFF_100%)] p-6 shadow-[0_18px_50px_rgba(125,169,162,0.14)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#2F756B] ring-1 ring-[#DDEEEA]">
              케어파트너
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#193B38] md:text-5xl">
              부모님 안심케어 매니저로
              <br />
              활동할 수 있습니다.
            </h2>

            <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#607D79]">
              매니저는 부모님 안심케어 요청을 받고, 병원동행·식사 확인·복약 확인·서류 챙김 같은 현장 업무를 수행합니다.
              검증이 끝난 매니저만 매칭 후보로 등록됩니다.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={openPanel}
                className="rounded-3xl bg-[#193B38] px-7 py-5 text-lg font-black text-white shadow-[0_14px_34px_rgba(25,59,56,0.18)]"
              >
                케어파트너 자세히 보기
              </button>

              <Link
                href="/manager"
                className="rounded-3xl bg-[#19B99A] px-7 py-5 text-center text-lg font-black text-white shadow-[0_14px_34px_rgba(25,185,154,0.22)]"
              >
                케어파트너에서 등록하기
              </Link>

              <Link
                href="/manager"
                className="rounded-3xl bg-white px-7 py-5 text-center text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                케어파트너 열기
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 ring-1 ring-[#E3EFEC]">
            <div className="text-sm font-black text-[#19A98E]">케어파트너에서 하는 일</div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {managerFeatures.map((feature) => (
                <div key={feature} className="rounded-2xl bg-[#F6FCFA] p-4 text-sm font-black text-[#24423F] ring-1 ring-[#E3EFEC]">
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#EAFBF6] p-4 text-sm font-bold leading-6 text-[#2F756B]">
              케어파트너 후 운영실 검증을 통과하면 매칭 후보로 등록되고, 제안 링크를 통해 본인에게 온 일감만 확인할 수 있습니다.
            </div>
          </div>
        </div>

        {open ? (
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {managerSteps.map((step) => (
              <div key={step.title} className="rounded-[1.5rem] bg-white p-5 ring-1 ring-[#E3EFEC]">
                <h3 className="text-xl font-black text-[#24423F]">{step.title}</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">{step.desc}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
