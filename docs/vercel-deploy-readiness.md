# Vercel 배포 전 점검

## 목적

기능 개발이 끝나기 전에 배포 환경에서 위험한 설정을 확인한다.

## 핵심 원칙

- NEXT_PUBLIC_ 값은 브라우저에 노출될 수 있다.
- SUPABASE_SERVICE_ROLE_KEY는 서버 API 안에서만 사용한다.
- Service Role Key를 NEXT_PUBLIC_ 이름으로 만들면 안 된다.
- Supabase URL은 /rest/v1이 붙은 주소보다 프로젝트 기본 URL을 사용한다.
- Production APP URL은 localhost가 아니어야 한다.
- care-files Storage bucket이 있어야 사진·카톡 접수 파일 업로드가 정상 동작한다.
- typecheck와 build를 먼저 통과해야 한다.

## 추가 화면

- /deploy-readiness

## 추가 API

- /api/deploy-readiness

## Vercel 환경변수

필수 공개 환경변수:

- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

필수 서버 전용 시크릿:

- SUPABASE_SERVICE_ROLE_KEY
- CRON_SECRET

배포 직전 선택 연동:

- KAKAO_ALIMTALK_API_KEY
- KAKAO_CHANNEL_ID
- GOOGLE_MAPS_API_KEY
- SERPAPI_API_KEY
- PAYMENT_PROVIDER_SECRET
- ESIGN_PROVIDER_SECRET

## 실행

npm run predeploy:check

로컬 실행 후:

npm run dev

그리고 /deploy-readiness 확인.
