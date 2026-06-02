'use client'

import Link from 'next/link'

const packages = [
  {
    title: '1단계 · 소프트웨어 실증',
    desc: '부모님 PWA, 안부지문 리포트, 가족 실행 보드, 지자체 운영실로 100가구 MVP 실증을 진행합니다.',
    items: ['부모님 안부 입력', '자녀 리포트', '가족 실행 보드', '지자체 대시보드', '성과지표 집계']
  },
  {
    title: '2단계 · 스마트 복약통 연동',
    desc: '일반관리군을 중심으로 복약통 개폐 로그와 복약 미확인 이벤트를 수집합니다.',
    items: ['복약 예정 시간', '약통 개폐 로그', '30분 초과 미개봉', '가족 알림', '지자체 통계']
  },
  {
    title: '3단계 · UWB 비접촉 관제',
    desc: '고위험군을 중심으로 카메라·음성 없는 비접촉 신호를 실증 데이터로 검증합니다.',
    items: ['재실·부재', '12시간 무활동', '낙상 의심', '호흡 저하 의심', '사생활 거부감 최소화']
  },
  {
    title: '4단계 · 조달·성과보고',
    desc: '실증 성과를 월간 보고서, 감사로그, CSV/PDF, R&D 후속 과제로 연결합니다.',
    items: ['월간 성과보고', '사례관리 기록', '감사로그', 'CSV 내보내기', '조달 연계 검토']
  }
]

const safeWording = [
  {
    before: '오탐률 2% 미만 보장',
    after: '오탐률 2% 미만을 목표로 실증 데이터 기반 검증'
  },
  {
    before: '원클릭 119 연계',
    after: '응급안전망·119 연계 가능 구조 검토'
  },
  {
    before: '데이터 유실 가능성 0%',
    after: '백업 이중화와 접속기록 보관을 통한 유실 최소화 설계'
  },
  {
    before: '무경쟁 수의계약 확보',
    after: '실증 성과 기반 조달·혁신제품·디지털서비스 등록 가능성 검토'
  }
]

export function GovProposalPackagePanel() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            지자체 지원사업·R&D 제안 패키지 v2
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            IoT 스마트 실버 케어를
            <br />
            지자체 실증 과제로 전환합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            안부웍스는 부모님 안부 입력과 안부지문 리포트를 기반으로, 스마트 복약통·UWB 비접촉 센서·지자체 운영실·성과보고까지 확장하는 B2G형 통합돌봄 플랫폼으로 준비합니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/gov/dashboard" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
              지자체 운영실
            </Link>
            <Link href="/gov/iot" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              IoT 관제 준비
            </Link>
            <Link href="/gov/export" className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              성과 데이터 내보내기
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric title="실증 MVP" value="100가구" desc="소프트웨어 기반 1차 실증" />
          <Metric title="확장 실증" value="200~500가구" desc="복약통·UWB 단계적 적용" />
          <Metric title="핵심 지표" value="응답률·복약률" desc="성과보고 가능한 정량 지표" />
          <Metric title="운영 대상" value="지자체·수행기관" desc="B2G 실증·조달 방향" />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {packages.map((item) => (
            <article key={item.title} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
              <div className="mt-5 grid gap-2">
                {item.items.map((sub) => (
                  <div key={sub} className="rounded-2xl bg-[#F8FCFB] p-3 text-sm font-black text-[#637B76] ring-1 ring-[#D8EEE8]">
                    {sub}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">공공 제안용 표현 보정</h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
            지자체·정부과제 제출용 문서는 보장형 표현보다 목표·검증·연계 가능성 중심으로 작성합니다.
          </p>

          <div className="mt-5 grid gap-3">
            {safeWording.map((item) => (
              <article key={item.before} className="grid gap-3 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] md:grid-cols-2">
                <div>
                  <div className="text-xs font-black text-[#8A2525]">수정 전</div>
                  <div className="mt-1 text-sm font-bold leading-6 text-[#637B76]">{item.before}</div>
                </div>
                <div>
                  <div className="text-xs font-black text-[#116D5F]">제안서용 표현</div>
                  <div className="mt-1 text-sm font-black leading-6 text-[#173B36]">{item.after}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">최종 제안명</h2>
          <p className="mt-4 text-xl font-black leading-9 text-[#E7FFF7]">
            안부지문 기반 고령자 생활리듬 변화감지 및 IoT 스마트 실버 케어 통합돌봄 플랫폼 개발·실증
          </p>
          <p className="mt-4 text-sm font-bold leading-7 text-[#A7F2E3]">
            부모님 안부 선택 데이터, 스마트 복약통 개폐 로그, UWB 비접촉 이벤트를 통합하여 가족·수행기관·지자체가 함께 확인·조치·보고할 수 있는 B2G형 지역사회 통합돌봄 운영 플랫폼.
          </p>
        </section>
      </section>
    </main>
  )
}

function Metric({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{title}</div>
      <div className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#173B36]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

export default GovProposalPackagePanel
