import { Card, CardTitle } from './Card'
const risks = [['긴급', '1건', '만남 암호 불일치/응급 도움 요청'], ['확인 필요', '3건', '식사 미확인, 약 미확인, 서류 누락'], ['대체 배정', '1건', '매니저 지연 가능성'], ['사회공헌', '2건', '비용 부담 가족 공공지원 안내']]
export function OpsCommandCenter() { return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{risks.map(([title, count, desc]) => <Card key={title}><CardTitle eyebrow="운영실" title={`${title} ${count}`} description={desc} /></Card>)}</div> }
