export function HomeResponseNetworkBanner() {
  return (
    <section className="mx-auto mt-5 max-w-6xl px-4">
      <div className="rounded-[2rem] bg-[#247A71] p-5 text-white shadow-[0_18px_52px_rgba(20,82,70,0.16)] sm:rounded-[2.5rem] sm:p-8">
        <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-[#A7F2E3] ring-1 ring-white/20">
          안부웍스 지역 안심망
        </div>

        <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.06em] sm:text-5xl">
          서로가 서로를 보호하고
          <br />
          위험할 때 가까운 사람이 돕습니다.
        </h2>

        <p className="mt-5 max-w-4xl text-base font-bold leading-8 text-[#E7FFF7] sm:text-lg">
          부모님의 안부 신호를 가족, 돌봄파트너, 지역상점, 약국, 수행기관, 지자체가 처리 가능한 행동으로 자동 연결하는 플랫폼입니다.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <a href="/parent/login" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F]">
            부모님 코드 입력
          </a>
          <a href="/response/about" className="rounded-2xl bg-[#20BFA7] px-5 py-4 text-center text-sm font-black text-white">
            지역 안심망 알아보기
          </a>
          <a href="/child/dashboard" className="rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/20">
            부모님 리포트
          </a>
          <a href="/response" className="rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/20">
            보호자 후속조치
          </a>
        </div>
      </div>
    </section>
  )
}

export default HomeResponseNetworkBanner
