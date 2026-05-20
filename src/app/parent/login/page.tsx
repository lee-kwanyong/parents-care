import { AppFrame } from '@/components/ui/AppFrame'
import { ParentCodeLoginPanel } from '@/components/auth/ParentCodeLoginPanel'

export default function ParentLoginPage() {
  return (
    <AppFrame title="부모님 접속" subtitle="자녀가 알려준 4자리 코드로 들어갑니다">
      <section className="mx-auto max-w-xl">
        <ParentCodeLoginPanel />
      </section>
    </AppFrame>
  )
}
