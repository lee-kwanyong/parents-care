# 알림 자동 발송 워커

## 목적

notification_outbox에 쌓인 queued 알림을 자동으로 처리한다.

## API

/api/cron/notifications

## 인증

CRON_SECRET 필요.

사용 예시:

/api/cron/notifications?secret=CRON_SECRET&limit=20

## 모드

NOTIFICATION_SEND_MODE=simulation

초기에는 실제 카카오/SMS 발송이 아니라 simulation으로 발송 완료 처리한다.

## 처리 흐름

1. notification_outbox에서 queued 알림 조회
2. notification_templates에서 템플릿 조회
3. {{elder_name}} 같은 변수를 치환
4. simulation 발송 처리
5. notification_outbox 상태를 sent 또는 failed로 변경
6. notification_delivery_logs 기록
7. notification_cron_runs 실행 기록 저장

## 추후 고도화

- Kakao 알림톡 실제 발송
- SMS 실제 발송
- 푸시 알림
- 발송 실패 자동 재시도
- Vercel Cron 연결
