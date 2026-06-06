import { LegalCard, LegalPageShell } from '@/components/LegalPageShell'
import { dataSafetyRows } from '@/lib/anbu-legal-content'

export const metadata = {
  title: 'Data Safety 안내 | 안부웍스',
  description: 'Google Play Data Safety 신고용 데이터 처리 안내'
}

export default function DataSafetyPage() {
  return (
    <LegalPageShell
      eyebrow="Data Safety 안내"
      title="Google Play Data Safety 신고 기준으로 정리한 데이터 처리 항목입니다."
      description="앱이 수집·사용할 수 있는 정보와 목적을 사용자가 이해하기 쉽게 설명합니다."
    >
      <LegalCard title="수집 및 이용 항목">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs font-black text-[#637B76]">
                <th className="px-3 py-2">분류</th>
                <th className="px-3 py-2">데이터</th>
                <th className="px-3 py-2">목적</th>
              </tr>
            </thead>
            <tbody>
              {dataSafetyRows.map((row) => (
                <tr key={row.type} className="rounded-2xl bg-[#FAFFFD] text-sm font-bold text-[#637B76]">
                  <td className="rounded-l-2xl px-3 py-3 font-black text-[#17443F]">{row.type}</td>
                  <td className="px-3 py-3">{row.data}</td>
                  <td className="rounded-r-2xl px-3 py-3">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalCard>

      <LegalCard title="보안과 공유">
        <p>
          데이터는 서비스 제공 목적에 따라 서버에 저장될 수 있으며, 보호자 알림, 케어파트너 배정, 결제, 메시지 발송 등
          필요한 경우에 한해 외부 처리업체와 공유될 수 있습니다. 앱의 실제 처리 내용과 Google Play Data Safety 신고 내용은 일치해야 합니다.
        </p>
      </LegalCard>
    </LegalPageShell>
  )
}
