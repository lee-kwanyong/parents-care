# 150점 개선 아키텍처

## 제품 구조

부모님 병원동행 서비스는 단순 예약 앱이 아니라 운영 OS로 설계합니다.

```txt
자녀앱 -> 일정 등록 / 질문 / 공유범위 / 평가
부모님앱 -> 오늘 일정 / 만남 암호 / 동의 / 긴급 버튼
매니저앱 -> 체크리스트 / 진행상태 / 리포트 초안
운영실 -> 심사 / 배정 / 리스크 / 검수 / 발송
Supabase -> 권한, 데이터, 로그, 리스크, 평가 점수
```

## 데이터 루프

```txt
appointment 생성
-> consent 확인
-> assignment 후보 산정
-> manager 배정
-> timeline_events 누적
-> report 초안
-> report_quality_review
-> notification_events 발송
-> review 평가
-> manager_trust_events 반영
```

## 권한 원칙

- 가족은 자기 가족 일정과 리포트만 본다.
- 매니저는 배정된 일정의 현장 수행 데이터만 본다.
- 운영실은 리스크/검수/배정 관리를 위해 전체를 본다.
- 민감정보 상세는 동의 범위별로 쪼갠다.
- 감사로그는 운영실만 조회한다.

## 차량 정책 가드레일

차량 보유는 `managers.has_vehicle`입니다. 직접 운송 가능 여부는 `direct_transport_allowed`, `direct_transport_contract_verified`, `appointments.direct_transport_requested`, `transport_policies`로 분리합니다.

기본 서비스는 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴입니다.


## 안심 체크인 레이어

이번 보강에서 추가한 유일한 큰 축은 현장 안전 확인입니다. 예약과 리포트가 좋아도 실제 현장에서 “만났는지”, “연락이 끊기지 않았는지”, “안전하게 종료됐는지”가 확인되지 않으면 서비스가 완결되지 않습니다.

```txt
appointment 생성
-> safety_checkpoints 자동 생성
-> 도착 전 연락
-> 만남 암호 상호확인
-> 이동 시작 확인
-> 병원 접수 확인
-> 진료/수납/약국 확인
-> 안전 종료 확인
-> 리포트/평가로 종료
```

안심 체크포인트가 grace time을 넘기면 `escalate_missed_safety_checkpoints`가 `risk_flags`와 `safety_escalations`를 생성합니다. 운영실은 이를 기준으로 보호자 연락, 매니저 연락, 대체 배정, 사고 대응 여부를 결정합니다.
