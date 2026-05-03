# 릴리즈 계획

## 0.3.0 현재 ZIP

- 클릭형 화면 + Supabase Server Actions 골격
- 004 hardening migration
- PWA 설치 경험
- 매니저 배정 추천 데모 로직
- 운영실 리스크/품질 화면

## 0.4.0

- 가족 생성/초대 코드 실제 플로우
- 일정 등록 실제 CRUD
- 부모님 프로필 및 케어 프로필 CRUD
- 매니저 지원서 파일 업로드

## 0.5.0

- 운영실 배정 실제 기능
- 매니저 진행상태 실시간 반영
- 리포트 검수/발송 실제 기능
- 알림톡 provider 연동 준비

## 0.6.0

- 결제/영수증
- 전자서명
- 병원별 예상 소요시간
- 정기진료 자동배정

## 1.0.0

- 지역별 매니저 풀 운영
- 병원별 전문 매니저
- 보호자 후기 기반 품질 관리
- 방문요양/간병/약국/검진센터 연계


## 추가 릴리즈: 안심 체크인/SLA

1. `005_safety_handoff_sla.sql` 적용
2. `/manager/today`에서 만남 암호 확인 테스트
3. `/parent/today`에서 안전 종료 버튼 테스트
4. `/ops/safety`에서 SLA 스윕 실행 테스트
5. Vercel 환경변수 `CRON_SECRET`, `SUPABASE_SECRET_KEY` 등록
6. `vercel.json` Cron이 `/api/cron/safety-sweep`를 5분 주기로 호출하는지 Production 로그 확인

## 추가 릴리즈: 생활 편의 레이어

1. `006_real_life_convenience_layer.sql` 적용
2. `/child/convenience`에서 준비팩, 병원 동선, 서류 요청, 복약 확인, 다음 예약 후보 확인
3. `/parent/convenience`에서 큰 글씨 준비물·접수 위치 확인
4. `/manager/today`에서 현장 편의 도우미가 서류 요청과 병원 동선을 보여주는지 확인
5. `/ops/convenience`에서 준비물 누락, 서류 요청, 복약 알림, 다음 예약 후보를 운영실이 확인
6. 실서비스에서는 병원별 편의 데이터부터 운영실이 수기로 검증한 뒤 병원 DB로 확장
