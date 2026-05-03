import { vehiclePolicyText } from '@/lib/constants'

export function VehiclePolicyBadge({ hasVehicle, directTransportEligible }: { hasVehicle: boolean; directTransportEligible: boolean }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 font-semibold">차량 보유: {hasVehicle ? '있음' : '없음'}</span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold">
          직접 운송 가능: {directTransportEligible ? '별도 승인 필요' : '기본 미포함'}
        </span>
      </div>
      <p className="mt-3 leading-6">{vehiclePolicyText}</p>
    </div>
  )
}
