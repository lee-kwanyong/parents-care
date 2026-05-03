# 통합 분석

## 첫 번째 ZIP에서 가져온 핵심

- 자녀앱, 부모님앱, 매니저앱, 운영실을 1차 MVP 역할로 명확히 구분
- 병원 일정 등록, 가족 공동조회 코드, 타임라인, 매니저 신뢰카드, 리포트, 평가 흐름
- 차량 보유 여부와 직접 운송 가능 여부 분리
- 리포트 항목: 진료 진행 내용, 의료진 안내사항, 검사/약/다음 예약, 비용, 부모님 컨디션, 가족 다음 액션
- 평가 항목: 안전, 친절, 정확성, 시간준수
- 운영실: 매니저 심사/승인, 배정, 위험 플래그, 리포트 검수/발송, 운영 로그

## 두 번째 ZIP에서 가져온 핵심

- 공동 케어룸을 제품 중심 구조로 설정
- 부모님 케어 프로필, 보호자 다음 액션, 소통함, 긴급 버튼, 결제/영수증 구조
- 위험상황 빠른 보고, 위치공유 세션, 리포트 첨부파일, 체크리스트 템플릿, 매니저 가능시간
- Supabase Auth callback, middleware, 확장 migration, PWA manifest
- 운영실의 배정 추천, 리스크 큐, 품질/정산 관리 화면

## 통합 판단

두 프로젝트는 서로 경쟁하는 구조가 아니라 레이어가 다릅니다.

- 첫 번째는 MVP 기능 정의가 좋습니다.
- 두 번째는 제품 확장성과 화면 밀도가 좋습니다.

따라서 통합본은 두 번째 프로젝트의 `app/`, `components/`, `lib/supabase/`, `supabase/migrations`를 기반으로 삼고, 첫 번째 프로젝트의 상세 라우트와 정책/리포트/평가 구조를 이식했습니다.

## 새로 보강한 부분

- `/child/appointments/new`: 병원 일정 등록 입력형 데모
- `/child/appointments/[id]`: 타임라인, 리포트, 평가 상세
- `/parent/today`: 부모님 큰 글씨 화면
- `/manager/apply`: 매니저 지원서
- `/manager/today`: 현장 수행 화면
- `/ops/assignments`: 매니저 심사/승인·배정
- `/ops/reports`: 리포트 검수/발송
- `/ops/risks`: 사고/법무/운영 리스크 보드
- `components/RatingForm.tsx`: 평가 4대 항목 localStorage 데모
- `components/LocalAppointmentForm.tsx`: 일정 등록 localStorage 데모
- `components/ReportDraftForm.tsx`: 리포트 초안 localStorage 데모
- `supabase/migrations/003_unified_mvp_hardening.sql`: 가족 공동조회 코드, 평가 4대 항목, 안심도 재계산 함수, 차량 정책 보강

## 아직 실제 연동이 필요한 부분

- localStorage 데모를 Supabase insert/update/select로 교체
- role 기반 route guard
- Realtime 구독
- 알림톡/SMS/전화 fallback
- 전자서명
- 결제/환불
- Storage 파일 업로드
- 운영실 실제 처리 상태 변경과 감사 로그 자동화
