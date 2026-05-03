import type { CareReport, ManagerTrustCard, TimelineItem } from './types'
import { vehiclePolicyText } from './constants'

export const demoManager: ManagerTrustCard = {
  name: '김도윤 매니저',
  approved: true,
  specialties: ['정형외과', '검진센터', '약국 동행'],
  regions: ['강남구', '서초구', '송파구'],
  completedCount: 128,
  ratingAverage: 4.8,
  hasVehicle: true,
  directTransportEligible: false,
  vehiclePolicyText
}

export const demoTimeline: TimelineItem[] = [
  {
    id: '1',
    status: 'assigned',
    title: '동행매니저 배정 완료',
    actualAt: '2026-04-29 08:30',
    actor: '운영실'
  },
  {
    id: '2',
    status: 'meeting',
    title: '집 앞 만남 예정',
    scheduledAt: '2026-04-29 09:20',
    note: '만남 암호: 봄길 27'
  },
  {
    id: '3',
    status: 'arrived_hospital',
    title: '서울튼튼병원 도착 예정',
    scheduledAt: '2026-04-29 10:00'
  },
  {
    id: '4',
    status: 'in_care',
    title: '정형외과 진료',
    scheduledAt: '2026-04-29 10:30'
  },
  {
    id: '5',
    status: 'report_sent',
    title: '보호자 리포트 발송',
    scheduledAt: '2026-04-29 12:30'
  }
]

export const demoReport: CareReport = {
  visitSummary: '무릎 통증 경과 확인을 위해 정형외과 외래 진료를 진행했습니다.',
  doctorInstructions: ['무릎 사용량 조절', '물리치료 주 2회 권장', '통증 심해지면 조기 내원'],
  tests: ['X-ray 확인: 큰 변화 없음', '혈압 측정: 정상 범위'],
  medications: ['소염진통제 5일분', '위장 보호제 5일분'],
  nextAppointment: '2026-05-20 10:20 정형외과 재진',
  cost: '진료비 8,600원 / 약제비 4,200원',
  condition: '대기 시간이 길어 약간 피곤해하셨으나 귀가 시 보행은 안정적이었습니다.',
  nextActions: ['물리치료 예약 확인', '약 복용 여부 저녁에 확인', '다음 예약일 가족 캘린더 등록']
}
