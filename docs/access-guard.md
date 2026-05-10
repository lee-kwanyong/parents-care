# 내부 화면 접근 보호

## 목적

정식 배포에서 운영실, 바이어 데모, 매니저 현장 화면이 일반 고객에게 노출되지 않도록 한다.

## 공개 화면

- /
- /care-request
- /care-intake
- /child
- /parent/today
- /manager/apply
- /manager/vetting
- /manager/install
- /install

## 보호 화면

- /ops/*
- /buyer-demo
- /demo-start
- /deploy-readiness
- /manager
- /manager/today
- /manager/offers
- /manager/earnings

## 환경변수

ACCESS_GUARD_ENABLED=false

테스트 또는 배포에서 보호를 켜려면:

ACCESS_GUARD_ENABLED=true

입장 코드:

- OPS_ACCESS_CODE
- MANAGER_ACCESS_CODE
- BUYER_ACCESS_CODE
- GUARDIAN_ACCESS_CODE

## 입장 페이지

/access-login
