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
      title="전체 메뉴"
      subtitle="부모님, 자녀, 요양보호사·케어파트너, 운영실 화면으로 바로 이동하세요."
    />
  )
}

export default MenuPageContent
