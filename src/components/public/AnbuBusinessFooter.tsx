'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const BANK_ACCOUNT = '신한은행 100-038-855020 안부웍스 주식회사'
const SUPPORT_EMAIL = 'mixer0326@gmail.com'

const hiddenPathPrefixes = [
  '/admin',
  '/mobile/parent',
  '/parent',
  '/reports/anbu'
]

export function AnbuBusinessFooter() {
  const pathname = usePathname() || ''
  const [copiedBank, setCopiedBank] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  if (hiddenPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  async function copyBankAccount() {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT)
      setCopiedBank(true)
      window.setTimeout(() => setCopiedBank(false), 1800)
    } catch {
      setCopiedBank(false)
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopiedEmail(true)
      window.setTimeout(() => setCopiedEmail(false), 1800)
    } catch {
      setCopiedEmail(false)
    }
  }

  return (
    <footer className="border-t border-[#D6EDE7] bg-white px-4 py-7 text-[#315E58]">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-5 rounded-[1.5rem] bg-[#F7FFFC] p-5 ring-1 ring-[#D6EDE7] md:grid-cols-[1fr_1fr] md:items-center">
          <div className="space-y-2">
            <div className="text-lg font-black tracking-[-0.04em] text-[#17443F]">
              안부웍스 주식회사
            </div>

            <div className="text-sm font-bold leading-7 text-[#637B76]">
              <p>
                대표자: 이관용
                <span className="mx-2 text-[#B8D8D1]">|</span>
                사업자등록번호: 301-88-03572
              </p>
              <p>주소: 충청북도 청주시 청원구 오창읍 중심상업로 32-13, 7층 701-62호</p>
            </div>

            <p className="text-xs font-bold leading-6 text-[#8AA09B]">
              안부웍스는 의료 진단·치료·응급구조를 대체하지 않는 비의료 안부확인·기록 서비스입니다.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.25rem] bg-white p-4 ring-1 ring-[#D6EDE7]">
              <div className="text-xs font-black text-[#247A71]">고객센터</div>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="break-all text-lg font-black leading-7 tracking-[-0.04em] text-[#17443F]"
                >
                  {SUPPORT_EMAIL}
                </a>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="rounded-xl bg-[#EFFFFA] px-4 py-3 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]"
                  >
                    {copiedEmail ? '복사됨' : '메일 복사'}
                  </button>

                  <Link
                    href="/support"
                    className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                  >
                    고객센터
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-[1.25rem] bg-white p-4 ring-1 ring-[#D6EDE7]">
              <div className="text-xs font-black text-[#247A71]">결제 계좌</div>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-lg font-black leading-7 tracking-[-0.04em] text-[#17443F]">
                  신한은행 100-038-855020
                  <br className="sm:hidden" />
                  <span className="sm:ml-2">안부웍스 주식회사</span>
                </div>

                <button
                  type="button"
                  onClick={copyBankAccount}
                  className="shrink-0 rounded-xl bg-[#EFFFFA] px-4 py-3 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]"
                >
                  {copiedBank ? '복사됨' : '계좌 복사'}
                </button>
              </div>
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
