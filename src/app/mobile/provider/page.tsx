import { MobileSimpleRolePanel } from '@/components/mobile/MobileSimpleRolePanel'

export const metadata = {
  title: '요양보호사·돌봄파트너 앱 | 안부웍스',
  description: '긴급 요청을 수락하고 완료 처리하는 도움망 모바일 앱입니다.'
}

export default function MobileProviderPage() {
  return (
    <MobileSimpleRolePanel
      badge="요양보호사·돌봄파트너"
      title="가까운 어르신의 긴급 요청을 확인합니다."
      desc="문자로 받은 1회용 링크에서 요청을 수락하고, 확인 완료를 남깁니다."
      actions={[
        {
          href: '/provider/urgent-requests',
          title: '긴급 요청함',
          desc: '1회용 링크로 받은 긴급 요청을 확인합니다.',
          primary: true
        },
        {
          href: '/portal/care-worker',
          title: '도움망 전용 메뉴',
          desc: '요양보호사·돌봄파트너에게 필요한 메뉴만 봅니다.'
        },
        {
          href: '/mobile',
          title: '앱 홈으로',
          desc: '안부웍스 앱 홈으로 돌아갑니다.'
        }
      ]}
    />
  )
}
