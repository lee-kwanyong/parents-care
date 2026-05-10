# 접수 → 케어 케이스/매칭 요청 자동 생성

## 목적

운영실 접수함에서 “케어 요청으로 정리”를 누르면 단순 상태 변경이 아니라 실제 운영 데이터가 생성되게 한다.

## 생성되는 데이터

- care_cases
- care_case_tasks
- care_case_events
- care_manager_matching_requests
- notification_outbox

## 분기 기준

- 병원 걱정 → hospital_visit
- 식사 걱정 → meal_check
- 약 걱정 → medication_check / matching은 meal_check
- 퇴원 후 걱정 → discharge_check
- 서류 걱정 → document_pickup
- 안부 확인 → wellbeing_check

## 확인 화면

- /ops/intake-inbox
- /ops/care-cases
- /ops/manager-offers
