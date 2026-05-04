import { vehiclePolicyText } from '@/lib/constants'
export function VehiclePolicyBadge() { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong className="block text-base">{vehiclePolicyText.title}</strong><span>{vehiclePolicyText.body}</span></div> }
