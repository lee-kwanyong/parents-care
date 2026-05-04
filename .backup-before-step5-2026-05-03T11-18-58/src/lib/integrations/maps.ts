export type HospitalRouteRequest = { hospitalName: string; department?: string; region?: string }
export function buildGoogleMapsSearchUrl(input: HospitalRouteRequest) {
  const query = encodeURIComponent([input.region, input.hospitalName, input.department].filter(Boolean).join(' '))
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
export function createHospitalGuide(input: HospitalRouteRequest) {
  return {
    hospitalName: input.hospitalName,
    department: input.department ?? '진료과 미정',
    taxiDropoff: '정문 또는 본관 앞 하차 위치를 운영실이 확인합니다.',
    receptionFloor: '접수층 확인 필요',
    wheelchair: '안내데스크 또는 원무과 문의',
    restroom: '진료과 근처 화장실 위치 확인 필요',
    pharmacy: '처방 후 병원 인근 약국 후보 확인',
    mapUrl: buildGoogleMapsSearchUrl(input)
  }
}
