# STEP6 휴대폰·카카오 우선 로그인

## 제품 원칙

이 앱의 핵심 사용자는 40대 이상 보호자다. 이메일 로그인은 보조 수단이고, 우선순위는 다음과 같다.

1. 휴대폰 번호 인증
2. 카카오 로그인
3. 전화/카톡/사진으로 맡기기
4. 이메일 로그인

부모님은 가능하면 로그인시키지 않는다. 부모님 화면은 큰 글씨, 오늘 일정, 만남 암호, 자녀 전화, 도움 요청, 안전 종료 중심으로 유지한다.

## Supabase 설정

### Phone Auth

Supabase Dashboard → Authentication → Sign In / Providers → Phone 활성화

SMS Provider 설정 필요:
- Twilio
- MessageBird
- Vonage
- TextLocal 등

### Kakao Auth

Kakao Developers에서 앱 생성 후 Supabase Dashboard → Authentication → Providers → Kakao 활성화.

Kakao redirect URI:
https://<project-ref>.supabase.co/auth/v1/callback

Supabase URL Configuration:
- Site URL: http://localhost:3000
- Redirect URLs: http://localhost:3000/auth/callback
