# 쉬운 로그인·회원가입

## 목적

40대 이상 보호자가 어렵지 않게 시작할 수 있는 인증 구조를 만든다.

## 우선순위

1. 카카오로 시작하기
2. 휴대폰 번호로 시작하기
3. 이메일 링크로 시작하기
4. 이메일/비밀번호는 보조 수단

## Supabase 설정

Email Magic Link:

- Supabase Auth Email provider 사용
- Redirect URL 추가:
  - http://localhost:3000/auth/callback
  - https://your-domain.vercel.app/auth/callback

Phone Login:

- Supabase Auth Phone provider 활성화
- SMS provider 설정 필요

Kakao Login:

- Kakao Developers에서 OAuth 앱 생성
- Supabase Dashboard Auth Providers에서 Kakao credentials 등록
- Redirect URL 설정 필요

## 추가 화면

- /login
- /signup
- /auth/callback
- /my

## 추가 테이블

- care_auth_profiles
- care_auth_login_events

## 보안 원칙

- NEXT_PUBLIC_SUPABASE_ANON_KEY만 브라우저에서 사용한다.
- SUPABASE_SERVICE_ROLE_KEY는 /api/auth/profile 서버 API에서만 사용한다.
- Service Role Key에 NEXT_PUBLIC_ 접두사를 붙이면 안 된다.
