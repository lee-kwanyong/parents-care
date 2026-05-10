# 보호자 30초 리포트 자동 생성

## 목적

매니저가 현장 체크 마지막 단계인 “리포트까지 완료했습니다”를 누르면 보호자에게 보여줄 30초 요약 리포트가 자동 생성된다.

## 생성되는 데이터

- manager_field_reports
- care_guardian_reports
- care_guardian_report_actions
- notification_outbox

## 화면

- /manager/today
- /child/reports
- /child/cases

## 흐름

1. 매니저 현장 체크 진행
2. 리포트까지 완료 클릭
3. 리포트 자동 생성
4. 보호자 화면에서 30초 요약 확인
5. 가족이 할 일 완료 표시
