import { FamilyPlanStatus } from '@/components/FamilyPlanStatus'

export default async function CareRequestStatusPage(props: any) {
  const params = await props.params
  return <FamilyPlanStatus intakeId={params.id} />
}
