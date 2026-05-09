# STEP32 데모 운영 모드

## 목적

M&A, 전략제휴, 투자 검토자에게 문서가 아니라 실제로 돌아가는 서비스를 보여준다.

## 추가 화면

- /demo-start
- /demo-login

## 추가 API

- /api/demo/session
- /api/demo/seed

## 데모 역할

- 보호자
- 가족
- 부모님
- 동행매니저
- 운영실

## 데모 시나리오

1. 보호자 걱정 접수
2. 사진·카톡 접수
3. 운영실 접수 확인
4. 케어패스포트 입력
5. 매니저 지원
6. 매니저 본인확인·신분확인
7. 매니저 승인·신뢰카드
8. 검증 매니저 매칭
9. 부모님 큰 글씨 화면
10. 매니저 현장 체크
11. 보호자 리포트 확인
12. 매칭 후 평가

## 환경변수

DEMO_GUARD_ENABLED=false
DEMO_SEED_SECRET=replace-with-strong-random-demo-secret

Production에서 데모 데이터 생성을 허용하려면 DEMO_SEED_SECRET 또는 CRON_SECRET이 필요하다.

## 최소 접근 잠금

DEMO_GUARD_ENABLED=true일 때:

- /ops/* 는 ops 역할 필요
- /manager/* 는 manager 또는 ops 역할 필요

## 주의

데모 데이터 생성 API는 Supabase Service Role Key를 사용한다.
Production에서는 반드시 DEMO_SEED_SECRET을 설정한다.
