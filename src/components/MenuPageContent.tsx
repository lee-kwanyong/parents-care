'use client'

import { AdminMenuHub } from '@/components/admin/AdminMenuHub'

type MenuPageContentProps = {
  [key: string]: unknown
}

export function MenuPageContent(_props: MenuPageContentProps = {}) {
  return (
    <AdminMenuHub
      role="all"
      embedded
      title="통합 메뉴"
      subtitle="실제 운영에 필요한 핵심 화면만 역할별로 정리했습니다."
    />
  )
}

export default MenuPageContent
