-- 샘플 병원/정책 데이터. 실제 auth user가 없는 상태에서도 실행 가능합니다.
insert into public.hospitals (name, address, region_code, average_duration_minutes, specialty_tags)
values
  ('서울○○병원', '서울 강남구 테헤란로 00', 'SEOUL_GANGNAM', 150, array['정형외과', '내과']),
  ('분당△△병원', '경기 성남시 분당구 00', 'GYEONGGI_BUNDANG', 130, array['내과', '검진']),
  ('강남□□검진센터', '서울 서초구 00', 'SEOUL_SEOCHO', 180, array['검진센터'])
on conflict do nothing;

-- 006 편의 레이어 샘플 병원 동선 데이터
insert into public.hospital_visit_guides (
  hospital_id,
  hospital_name,
  address,
  main_entrance,
  checkin_floor,
  taxi_dropoff,
  pickup_return_spot,
  wheelchair_desk,
  restroom_hint,
  pharmacy_hint,
  parking_hint,
  estimated_stay_minutes,
  accessibility_tips,
  manager_tips,
  is_verified
)
select
  h.id,
  h.name,
  h.address,
  '정문 자동문 진입 후 오른쪽 원무과',
  '2층 정형외과 접수대',
  '정문 앞 택시 승하차 구역',
  '1층 약국 옆 의자',
  '1층 안내데스크',
  '2층 접수대 뒤편 엘리베이터 옆',
  '수납 후 병원 밖 오른쪽 30m 약국',
  '지하 2층 주차 후 진료 확인 할인',
  130,
  array['보행이 불편하면 접수 전 휠체어 대여 확인', '엘리베이터 동선 우선', '약국 이동 전 화장실 확인'],
  array['대기번호와 예상 대기시간을 텍스트로 공유', '처방전과 영수증은 동의 범위 확인 후 첨부'],
  true
from public.hospitals h
where h.name = '서울○○병원'
on conflict (hospital_name) do nothing;
