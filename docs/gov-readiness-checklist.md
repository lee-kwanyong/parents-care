# 지자체 제출 전 준비상태 체크리스트

## 목적

지자체 지원사업·R&D 제안 전, 서비스 기능·DB·문서·보안·PDF 제출본이 준비되었는지 확인한다.

## 점검 경로

- /gov/readiness

## 핵심 점검 항목

### 1. 환경변수

- Supabase URL
- Supabase Anon Key
- Supabase Service Role Key
- 서비스 URL
- SMS/알림 API

### 2. Supabase 테이블

- daily_care_checkins
- anbu_family_links
- family_action_tasks
- family_member_invites
- gov_recipients
- gov_case_notes
- gov_audit_logs
- iot_devices
- iot_device_events
- gov_pilot_sites
- gov_submission_packages

### 3. 주요 페이지

- /parent/login
- /parent/today
- /child/dashboard
- /family/actions
- /gov/dashboard
- /gov/iot
- /gov/submission
- /gov/submission/print

### 4. 수동 테스트

1. 보호자 로그인
2. 부모님 연결코드 생성
3. 부모님 연결
4. 안부 입력
5. 자녀 리포트 확인
6. 가족 실행 완료
7. 지자체 운영실 확인
8. 제출 PDF 생성

### 5. 제출 전 판단

- 85점 이상: 제안 미팅용 데모 가능
- 60~84점: 일부 미비 항목 보완 필요
- 60점 미만: SQL·환경변수·핵심 경로 우선 점검
