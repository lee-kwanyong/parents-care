# 운영 흐름 통합 점검

## 목적

정식 배포 전 보호자 접수부터 리포트, 알림, 정산까지 핵심 흐름이 끊기지 않는지 점검한다.

## 화면

- /ops/flow-qa

## API

- /api/ops/flow-qa

## 점검 항목

- 환경변수
- 핵심 테이블
- 보호자 접수 데이터
- 케어 케이스
- 검증 매니저
- 매니저 일감 제안
- 현장 배정
- 보호자 리포트
- 알림 큐
- 자동 발송 실행 기록
- 정산 예정

## 권장 시연 순서

1. /care-request
2. /ops/intake-inbox
3. /ops/care-cases
4. /ops/manager-vetting
5. /ops/manager-offers
6. /manager/today
7. /child/reports
8. /ops/notifications
9. /ops/cron-health
