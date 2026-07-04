'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const BANK_ACCOUNT = '신한은행 100-038-855020 안부웍스 주식회사'

const hiddenPathPrefixes = [
  '/admin',
  '/mobile/parent',
  '/parent',
  '/reports/anbu'
]

export function AnbuBusinessFooter() {
  const pathname = usePathname() || ''
  const [copied, setCopied] = useState(false)

  if (hiddenPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  async function copyBankAccount() {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <footer className="border-t border-[#D6EDE7] bg-[#F7FFFC] px-4 py-8 text-[#315E58]">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-5 rounded-[2rem] bg-white/90 p-5 ring-1 ring-[#D6EDE7] sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-lg font-black tracking-[-0.04em] text-[#17443F]">
              안부웍스 주식회사
            </div>

            <div className="mt-3 grid gap-1 text-xs font-bold leading-6 text-[#637B76] sm:text-sm">
              <p>
                대표자: 이관용
                <span className="mx-2 text-[#B8D8D1]">|</span>
                사업자등록번호: 301-88-03572
              </p>
              <p>
                법인등록번호: 150111-0040317
              </p>
              <p>
                사업장/본점: 충청북도 청주시 청원구 오창읍 중심상업로 32-13, 7층 701-62호(엔젤프리존)
              </p>
              <p>
                업태/종목: 정보통신업 · 소프트웨어 개발
              </p>
            </div>

            <p className="mt-4 text-xs font-bold leading-6 text-[#7B8F8A]">
              안부웍스는 의료 진단, 치료, 응급구조를 제공하거나 대체하지 않는 비의료 안부확인·기록 서비스입니다.
              응급상황이 의심되는 경우 즉시 119 또는 의료기관에 연락해 주세요.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-[#EFFFFA] p-5 ring-1 ring-[#CDEFE7]">
            <div className="text-sm font-black text-[#247A71]">
              결제 계좌
            </div>

            <div className="mt-2 text-xl font-black leading-8 tracking-[-0.04em] text-[#17443F]">
              신한은행
              <br />
              100-038-855020
              <br />
              안부웍스 주식회사
            </div>

            <button
              type="button"
              onClick={copyBankAccount}
              className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              {copied ? '계좌번호 복사됨' : '계좌번호 복사'}
            </button>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#247A71]">
              <Link href="/pricing" className="rounded-full bg-white px-3 py-2 ring-1 ring-[#D6EDE7]">
                요금제 보기
              </Link>
              <Link href="/checkout" className="rounded-full bg-white px-3 py-2 ring-1 ring-[#D6EDE7]">
                결제하기
              </Link>
              <Link href="/" className="rounded-full bg-white px-3 py-2 ring-1 ring-[#D6EDE7]">
                www.parents-care.net
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs font-bold text-[#8AA09B]">
          © AnbuWorks Inc. All rights reserved.
        </div>
      </section>
    </footer>
  )
}
