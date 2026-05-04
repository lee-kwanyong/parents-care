# 매니저 신뢰 검증 + 매칭 후 평가

## 목적

부모님을 모시고 갈 분은 단순 매칭 대상이 아니다.
매칭 전 검증과 승인, 매칭 후 평가가 있어야 보호자가 신뢰할 수 있다.

## 매칭 전 필수 검증

- 휴대폰 본인확인
- 신분 확인
- 차량·이동 정책 확인
- 운영실 면접 확인

## 추가 검증

- 자격증 확인
- 경력 확인
- 교육 이수 확인
- CPR 교육 확인
- 디지털 활용 확인

## 승인 차단

SQL trigger로 필수 검증이 없는 경우 application_status = approved 변경을 차단한다.

## 매칭 후 평가

평가 항목:

- 안전
- 친절
- 정확성
- 시간준수

평가는 매니저 프로필의 rating_safety, rating_kindness, rating_accuracy, rating_punctuality에 자동 반영된다.
평가 수와 평균 점수에 따라 trust_level이 basic, standard, trusted로 갱신된다.

## 차량 정책

차량 보유 여부는 참고 정보다.
매니저 개인차량 직접 유상운송은 기본 서비스에 포함하지 않는다.
기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준이다.

## 화면

- /manager/verify
- /ops/manager-verification
- /child/manager-evaluations
