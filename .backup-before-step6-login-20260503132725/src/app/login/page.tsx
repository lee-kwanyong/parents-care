import { sendMagicLinkAction } from '@/app/actions'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string; reason?: string; error?: string }> }) {
  const params = searchParams ? await searchParams : {}
  const next = params.next || '/child'
  return (
    <AppShell title="보호자 로그인" subtitle="40대 이상 보호자가 어렵지 않게 쓸 수 있도록 이메일 매직링크부터 연결합니다. 나중에 카카오/휴대폰 로그인도 같은 구조에 붙입니다.">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardTitle eyebrow="Supabase Auth" title="이메일로 로그인 링크 받기" description="비밀번호를 외우지 않아도 됩니다. 이메일로 받은 링크를 누르면 로그인됩니다." />
          {params.reason === 'auth' ? <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">걱정 접수 저장을 위해 로그인이 필요합니다.</p> : null}
          {params.error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{params.error === 'email' ? '이메일 주소를 확인해주세요.' : params.error}</p> : null}
          <form action={sendMagicLinkAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">이름</span>
              <input name="displayName" className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500" placeholder="예: 이관용" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">이메일</span>
              <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500" placeholder="name@example.com" />
            </label>
            <button className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-white hover:bg-care-700">로그인 링크 받기</button>
          </form>
        </Card>
        <Card>
          <CardTitle eyebrow="왜 이렇게 단순하게?" title="40대 이상 보호자 기준" description="비밀번호, 복잡한 회원가입, 긴 입력폼은 이탈을 만듭니다." />
          <ul className="space-y-3 text-sm leading-6 text-slate-700">
            <li className="rounded-2xl bg-slate-100 p-4">처음에는 이메일 매직링크로 간단히 시작합니다.</li>
            <li className="rounded-2xl bg-slate-100 p-4">로그인 후 가족 공간이 자동으로 만들어집니다.</li>
            <li className="rounded-2xl bg-slate-100 p-4">걱정 접수, 케어팩, 사회공헌 연결이 같은 가족 공간에 저장됩니다.</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  )
}
