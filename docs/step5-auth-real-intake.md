# STEP 5 — Auth + Real Worry Intake

이번 단계의 목적은 화면 중심 MVP에서 실제 저장 MVP로 넘어가는 것입니다.

## 핵심 변경

- Supabase Magic Link 로그인
- `/auth/callback` 세션 교환
- `/logout`
- `/onboarding` 가족 공간 자동 생성
- `/account` 세션/가족 공간 확인
- `/care-request` 실제 Supabase 저장 폼
- `create_care_intake_request` RPC로 걱정 접수, 운영 이벤트, 앱 알림을 한 번에 생성

## 실행 순서

1. 프로젝트 루트에서 STEP5 zip 압축 해제
2. `node APPLY_STEP5_AUTH_REAL_INTAKE.js`
3. Supabase SQL Editor에서 `010_AUTH_REAL_INTAKE.sql` 실행
4. `CHECK_010_AUTH_REAL_INTAKE.sql` 실행
5. `.env.local`에 Supabase 값 확인
6. `npm run dev`

## UX 원칙

- 사용자는 기능을 찾지 않는다. 걱정을 누른다.
- 로그인은 비밀번호 없이 매직링크로 시작한다.
- 처음 이용자는 가족 공간을 자동 생성한다.
- 걱정 접수는 운영실 케어 플랜으로 이어진다.
- 사회공헌 체크는 접수 단계부터 포함한다.
