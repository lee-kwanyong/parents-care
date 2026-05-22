# Parents Care Marketing OS Phase 2

추가된 기능:

1. 홍보 문구 고도화
2. 블로그/SNS/LinkedIn/YouTube별 문체 분리
3. 이미지 카드 자동 생성 API
4. 카드뉴스 구성 자동 생성
5. YouTube Shorts 대본/장면/썸네일 문구 자동 생성
6. Webhook payload에 `image_url`, `media.video`, `media.carousel` 포함

확인 URL:

- 관리자: `/admin/agent?key=ADMIN_SECRET값`
- 블로그: `/blog`
- 이미지 카드: `/api/marketing-card/STAGE값`

다음 외부 연결 환경변수:

```env
SNS_PUBLISH_WEBHOOK_URL=""
LINKEDIN_PUBLISH_WEBHOOK_URL=""
YOUTUBE_PUBLISH_WEBHOOK_URL=""
AUTO_PUBLISH_ENABLED=false
AUTO_PUBLISH_CHANNELS="blog"
MEDIA_CREATION_MODE="brief-and-svg"
```

처음에는 `DRY_RUN=true`, `AUTO_PUBLISH_ENABLED=false`로 테스트하세요.
