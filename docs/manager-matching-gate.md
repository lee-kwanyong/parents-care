# 검증 매니저 매칭 게이트

## 목적

매니저 지원, 검증, 승인, 평가 구조를 실제 현장 배정과 연결한다.

## 핵심 원칙

- 본인확인 완료 매니저만 매칭 가능
- 활동 중 매니저만 매칭 가능
- trust_level = hold 매니저 제외
- direct_transport_included = true 매니저 제외
- 차량 보유 여부는 참고 정보
- 매니저 개인차량 직접 유상운송은 기본 서비스에 포함하지 않음

## 필수 흐름

1. /manager/apply 에서 매니저 지원
2. /ops/manager-verification 에서 본인확인, 신분확인, 차량정책, 면접 확인
3. /ops/managers 에서 승인 및 신뢰카드 생성
4. /ops/manager-matching 에서 검증 매니저 후보 추천
5. 선택 매니저로 /ops/manager-field 현장 배정 생성
6. /child/manager-evaluations 에서 평가 제출
7. 평가가 매니저 신뢰카드에 반영

## DB 안전장치

manager_field_assignments insert 시 manager_profile_id가 없으면 차단한다.
manager_profile_id가 있어도 active, identity_verified, direct_transport_included=false 조건을 통과해야 한다.
