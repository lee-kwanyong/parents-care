import { MobileSimpleRolePanel } from '@/components/mobile/MobileSimpleRolePanel'

export const metadata = {
  title: '자녀·보호자 앱 | 안부웍스',
  description: '부모님 상태와 후속조치를 확인하는 보호자 모바일 앱입니다.'
}

export default function MobileGuardianPage() {
  return (
    <MobileSimpleRolePanel
      badge="자녀·보호자"
      title="부모님 상태와 다음 행동을 확인합니다."
      desc="보호자는 부모님 신호, 후속조치, 가족 실행 보드, 지역 안심망 연결 상태를 확인합니다."
      actions={[
        {
          href: '/portal/child',
          title: '보호자 메뉴',
          desc: '보호자에게 필요한 화면만 모아서 봅니다.',
          primary: true
        },
        {
          href: '/response',
          title: '후속조치 조회',
          desc: '부모님 신호에 대한 후속조치 상태를 확인합니다.'
        },
        {
          href: '/family-link',
          title: '부모님 연결코드',
          desc: '가족코드로 부모님과 보호자를 연결합니다.'
        },
        {
          href: '/response/about',
          title: '지역 안심망 소개',
          desc: '가족, 도움망, 운영실이 어떻게 연결되는지 확인합니다.'
        }
      ]}
    />
  )
}
