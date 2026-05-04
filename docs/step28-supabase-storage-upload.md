# STEP28 Supabase Storage 실제 파일 업로드

## 목적

사진·카톡·약 봉투·영수증·처방전·검사결과지를 임시 데이터가 아니라 Supabase Storage에 저장한다.

## 추가 기능

- care-files Storage bucket
- 파일 메타데이터 테이블
- 파일 업로드 API
- 파일 다운로드/미리보기 API
- 사진·카톡 접수와 Storage 연결
- 자녀 파일함
- 운영실 파일함

## 화면

- /care-files
- /child/files
- /ops/files
- /care-intake

## 운영 원칙

- 보호자는 사진이나 파일만 올리면 된다.
- 운영실이 파일을 보고 케어 요청으로 정리한다.
- 파일은 public bucket이 아니라 비공개 bucket에 저장한다.
- 미리보기는 서버 API를 통해 제공한다.
- 실제 OCR은 초기에는 운영실 검수 이후 단계로 둔다.
