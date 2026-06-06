import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const checks = [
  {
    title: 'Kakao REST API 키',
    where: 'Kakao Developers → 앱 설정 → 앱 키',
    ok: 'REST API 키를 Supabase Kakao Provider의 REST API Key에 넣습니다.',
    warning: 'JavaScript 키나 Admin 키를 넣으면 안 됩니다.'
  },
  {
    title: 'Kakao Client Secret',
    where: 'Kakao Developers → 제품 설정 → 카카오 로그인 → 보안',
    ok: 'Client Secret을 활성화하고 Supabase Kakao Provider의 Client Secret Code에 넣습니다.',
    warning: '카카오에서 활성화한 Secret과 Supabase에 넣은 값이 같아야 합니다.'
  },
  {
    title: 'Kakao Redirect URI',
    where: 'Kakao Developers → 제품 설정 → 카카오 로그인 → Redirect URI',
    ok: 'https://qqtcqefhdowlcejwwbvt.supabase.co/auth/v1/callback',
    warning: '여기에는 parents-care.net/auth/callback이 아니라 Supabase callback URL을 넣습니다.'
  },
  {
    title: 'Web 플랫폼 도메인',
    where: 'Kakao Developers → 앱 설정 → 플랫폼 → Web',
    ok: 'https://parents-care.net, https://www.parents-care.net, https://qqtcqefhdowlcejwwbvt.supabase.co',
    warning: 'Web 플랫폼 도메인이 없으면 서비스 설정 오류가 날 수 있습니다.'
  },
  {
    title: '카카오 로그인 활성화',
    where: 'Kakao Developers → 제품 설정 → 카카오 로그인 → 일반',
    ok: '카카오 로그인 활성화 설정을 ON으로 둡니다.',
    warning: 'OFF면 로그인 자체가 진행되지 않습니다.'
  },
  {
    title: '동의항목',
    where: 'Kakao Developers → 제품 설정 → 카카오 로그인 → 동의항목',
    ok: '닉네임은 필수, 이메일은 선택 또는 수집으로 설정합니다.',
    warning: '이메일을 못 받는 앱이면 Supabase에서 Allow users without an email을 ON으로 둡니다.'
  },
  {
    title: 'Supabase Redirect URLs',
    where: 'Supabase → Authentication → URL Configuration',
    ok: 'https://parents-care.net/auth/callback, https://www.parents-care.net/auth/callback 등록',
    warning: 'Site URL이 localhost면 로그인 후 localhost로 돌아갈 수 있습니다.'
  }
]

export default function KakaoChecklistPage() {
  return (
    <AppFrame title="KOE205 체크리스트" subtitle="카카오 로그인 서비스 설정 오류를 확인합니다">
      <section className="mx-auto max-w-5xl space-y-5">
        <CareCard tone="amber">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="Kakao" tone="green" />
            <StatusPill text="KOE205" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            KOE205는 대부분
            <br />
            설정 불일치입니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#6F5B31] md:text-lg">
            리다이렉트 URI가 맞아도 REST API 키, Client Secret, Web 플랫폼 도메인, Supabase URL Configuration이 하나라도 다르면 오류가 날 수 있습니다.
          </p>
        </CareCard>

        <div className="grid gap-4 md:grid-cols-2">
          {checks.map((item, index) => (
            <CareCard key={item.title} tone="white" className="p-4 md:p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAFBF6] text-sm font-black text-[#2F756B]">
                  {index + 1}
                </span>
                <h2 className="text-xl font-black text-[#24423F]">{item.title}</h2>
              </div>

              <div className="mt-4 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
                <div className="text-xs font-black text-[#718A87]">확인 위치</div>
                <p className="mt-1 text-sm font-bold leading-6 text-[#24423F]">{item.where}</p>
              </div>

              <div className="mt-3 rounded-2xl bg-[#F0FBF7] p-4 ring-1 ring-[#D3ECE6]">
                <div className="text-xs font-black text-[#2F756B]">정상 값</div>
                <p className="mt-1 text-sm font-bold leading-6 text-[#24423F]">{item.ok}</p>
              </div>

              <div className="mt-3 rounded-2xl bg-[#FFF9EF] p-4 ring-1 ring-[#F0E0C4]">
                <div className="text-xs font-black text-[#8A6C35]">주의</div>
                <p className="mt-1 text-sm font-bold leading-6 text-[#6F5B31]">{item.warning}</p>
              </div>
            </CareCard>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
