# STEP 4 기술 연동 기반

이번 단계의 목적은 기능을 더 늘리는 것이 아니라, 부모님 케어 플랫폼의 핵심 편의 기능을 실제 서비스 구조에 연결할 수 있도록 기반을 잡는 것입니다.

## 제품 기준

- 핵심 사용자는 40대 이상 보호자입니다.
- 사용자는 기능을 찾지 않고 걱정을 누릅니다.
- 전화, 카톡, 사진, 간단 입력 중 편한 방식으로 접수합니다.
- 부모님 화면은 큰 글씨와 큰 버튼만 사용합니다.
- 병원동행은 시작점이고, 식사, 약, 서류, 퇴원 후 케어, 정기진료, 사회공헌까지 연결합니다.

## 이번 단계에 반영된 기술

- Supabase Auth, DB, RLS 기반 권한 분리
- PWA 홈 화면 설치
- Vercel Cron 안전 점검 API
- 카카오 알림톡/채널 접수용 notification outbox
- 전화/카톡/사진 접수용 care_intake_entries
- Google Maps 병원 동선 가이드 API scaffold
- SerpApi 지역 제휴 탐색 환경변수 scaffold
- 전자서명/동의 scaffold
- 결제/추가비용 승인 scaffold
- 안심밥상, 이동지원, 방문요양, 공공지원 제휴 referral 구조
- 40대 이상 사용자를 위한 accessibility_preferences

## 실행 순서

1. `009_technology_integration_foundation.sql`을 Supabase SQL Editor에서 실행합니다.
2. `CHECK_009_TECH_FOUNDATION.sql`로 테이블 생성 여부를 확인합니다.
3. 로컬 프로젝트에서는 `APPLY_STEP4_TECH_INTEGRATION.js`를 실행합니다.
4. `npm run typecheck`, `npm run build`를 확인합니다.
