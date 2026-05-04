import { vehiclePolicyText } from './constants'
import type { CareReport, ManagerTrustCard, TimelineItem } from './types'

export const demoTimeline: TimelineItem[] = [
  { id: '1', title: '도착 전 안심전화', status: 'done', scheduledAt: '08:30', actualAt: '08:27', note: '어머니와 통화 완료. 천천히 설명드리기로 했습니다.', actor: '김OO 매니저' },
  { id: '2', title: '만남 암호 확인', status: 'done', scheduledAt: '09:00', actualAt: '08:58', note: '암호 2580 확인. 병원 정문에서 만남 완료.', actor: '김OO 매니저' },
  { id: '3', title: '병원 접수', status: 'current', scheduledAt: '09:20', actualAt: '09:18', note: '정형외과 접수 완료. 대기 중입니다.', actor: '김OO 매니저' },
  { id: '4', title: '진료·검사', status: 'waiting', scheduledAt: '10:00', note: '의사에게 물어볼 질문 3개 확인 예정.' },
  { id: '5', title: '약국·서류·귀가', status: 'waiting', scheduledAt: '11:30', note: '처방약, 영수증, 세부내역서 확인 예정.' }
]

export const demoManager: ManagerTrustCard = {
  id: 'manager-demo', name: '김OO 매니저', trustScore: 94, completedCount: 128,
  specialties: ['정형외과', '재활', '큰 병원 동선 안내'], availableRegions: ['강남구', '서초구', '송파구'],
  hasVehicle: true, directTransportAvailable: false, verifiedBadges: ['신원 확인', '경력 확인', '안전 교육', '리포트 품질 우수'], lastMatchedNote: vehiclePolicyText.short
}

export const demoReport: CareReport = {
  id: 'report-demo', appointmentId: 'appointment-demo', summary: '오늘 진료는 잘 끝났습니다. 무릎 통증으로 약이 추가됐고 2주 뒤 재진이 필요합니다.',
  progress: ['정형외과 접수 완료', '무릎 통증 관련 진료', '약국 수령 예정', '영수증/세부내역서 요청 예정'],
  medicalGuidance: ['무리한 계단 이용 피하기', '통증이 심하면 병원에 전화', '2주 뒤 재진 권고'],
  testsAndMedication: ['소염진통제 3일분', '기존 혈압약과 함께 복용 가능 여부 약국에서 재확인'],
  nextAppointment: ['2주 뒤 정형외과 재진 후보 등록', '물리치료 필요 여부 가족 확인'],
  costs: ['진료비 예상 18,000원', '서류 발급비 발생 시 보호자 승인 후 진행'],
  condition: '대기 시간이 길어 약간 피곤해하셨으나 귀가 시 보행은 안정적이었습니다.',
  nextActions: ['오늘 저녁 약 복용 확인', '보험서류 제출 여부 결정', '2주 뒤 재진 예약 확정'],
  managerNote: '오른쪽 귀가 잘 안 들리셔서 왼쪽에서 천천히 안내드리니 편안해하셨습니다.'
}
