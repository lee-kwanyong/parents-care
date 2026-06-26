import { SharedAnbuReport } from '@/components/guardian/SharedAnbuReport'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '안부완료 리포트 공유본 | 안부웍스',
  description: '안부 확인과 후속조치 완료 기록을 확인합니다.'
}

export default async function SharedAnbuReportPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return <SharedAnbuReport token={token} />
}
