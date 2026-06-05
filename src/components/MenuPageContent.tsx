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
      title="필수 통합 메뉴"
      subtitle="부모님, 자녀·보호자, 요양보호사·케어파트너, 운영실, 지자체 제출에 필요한 필수 화면을 모았습니다."
    />
  )
}

export default MenuPageContent
