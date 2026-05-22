export type CreativeTopic = {
  key: string;
  audience: string;
  title: string;
  shortTitle: string;
  focus: string;
  pain: string;
  promise: string;
  urgency: string;
  proofAngle: string;
  cta: string;
  keywords: string[];
};

export type MediaBrief = {
  image: {
    format: 'blog_hero' | 'sns_carousel' | 'linkedin_card' | 'youtube_thumbnail';
    title: string;
    subtitle: string;
    style: string;
    prompt: string;
    negative_prompt: string;
  };
  carousel?: Array<{
    slide: number;
    headline: string;
    copy: string;
    visual: string;
  }>;
  video?: {
    platform: 'youtube_shorts' | 'instagram_reels';
    duration_sec: number;
    title: string;
    hook: string;
    voiceover: string;
    scenes: Array<{
      time: string;
      visual: string;
      caption: string;
      voiceover: string;
    }>;
    thumbnail_text: string;
    description: string;
    hashtags: string[];
  };
};

const MEDIA_START = '---MEDIA_JSON_START---';
const MEDIA_END = '---MEDIA_JSON_END---';

export function todayKey() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

export function todayKoreanDate() {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

export function topicOfDay(): CreativeTopic {
  const topics: CreativeTopic[] = [
    {
      key: 'busy_children_reassurance',
      audience: '부모님과 떨어져 살고 바쁜 40~60대 자녀',
      title: '매일 전화드리기 어려운 자녀를 위한 부모님 안심 체크 5가지',
      shortTitle: '매일 전화 못 해도 놓치지 않는 안심 체크',
      focus: '정기 안부 확인',
      pain: '전화 한 통 못 한 날마다 마음이 불편하지만, 일과 생활 때문에 매일 챙기기 어렵습니다.',
      promise: '안부, 식사, 복약, 생활 변화를 정기적으로 확인하고 가족에게 요약 리포트를 전달합니다.',
      urgency: '부모님의 작은 생활 변화는 늦게 알아차릴수록 가족의 걱정이 커집니다.',
      proofAngle: '매번 긴 통화보다 정해진 항목을 반복 확인하는 루틴이 가족의 불안을 줄입니다.',
      cta: '부모님 상황에 맞는 안심 체크 주기를 무료로 상담받아 보세요.',
      keywords: ['부모님 안부 확인', '혼자 계신 부모님', '부모님 케어', '안심 리포트'],
    },
    {
      key: 'medication_check_routine',
      audience: '복약 여부가 걱정되는 보호자',
      title: '부모님 약 드셨는지 매일 확인하기 어렵다면, 복약 체크 루틴이 필요합니다',
      shortTitle: '부모님 복약 체크 루틴',
      focus: '복약 체크',
      pain: '약을 드셨는지 확인하려고 전화해도 바쁠 때는 놓치기 쉽고, 부모님도 기억이 헷갈릴 수 있습니다.',
      promise: '정해진 시간과 항목으로 복약 여부를 확인하고, 특이사항을 가족에게 전달합니다.',
      urgency: '복약 확인은 한 번의 확인보다 꾸준한 반복 루틴이 중요합니다.',
      proofAngle: '복약, 식사, 컨디션을 함께 보면 부모님의 하루 상태를 더 입체적으로 파악할 수 있습니다.',
      cta: '복약 체크가 필요한 부모님께 맞는 확인 주기를 상담받아 보세요.',
      keywords: ['복약 체크', '부모님 약 확인', '시니어 케어', '부모님 안심케어'],
    },
    {
      key: 'living_alone_parent',
      audience: '혼자 계신 부모님을 둔 자녀',
      title: '혼자 계신 부모님, 안부 전화만으로 부족할 때 확인해야 할 생활 신호',
      shortTitle: '혼자 계신 부모님 생활 신호',
      focus: '혼자 계신 부모님 케어',
      pain: '혼자 계신 부모님은 작은 불편을 자녀에게 바로 말하지 않는 경우가 많습니다.',
      promise: '식사, 외출, 귀가, 컨디션, 도움이 필요한 일을 정기적으로 확인합니다.',
      urgency: '평소와 다른 생활 패턴은 빨리 알아차릴수록 가족이 더 침착하게 대응할 수 있습니다.',
      proofAngle: '생활 신호를 기록하면 감으로 걱정하는 대신 확인 가능한 정보로 판단할 수 있습니다.',
      cta: '혼자 계신 부모님께 필요한 체크 항목을 무료로 점검해 보세요.',
      keywords: ['혼자 계신 부모님', '독거 부모님 안부', '생활 변화 확인', '가족 돌봄'],
    },
    {
      key: 'meal_and_condition',
      audience: '부모님 식사와 컨디션이 걱정되는 가족',
      title: '부모님 식사 확인, 단순 안부보다 중요한 하루 컨디션 체크',
      shortTitle: '부모님 식사와 컨디션 체크',
      focus: '식사와 컨디션 확인',
      pain: '식사를 거르거나 컨디션이 달라져도 자녀가 바로 알기 어렵습니다.',
      promise: '식사 여부와 컨디션 변화를 함께 확인해 가족에게 간단히 공유합니다.',
      urgency: '식사 변화는 부모님 생활 리듬을 보여주는 중요한 신호입니다.',
      proofAngle: '식사, 복약, 안부를 함께 보면 부모님 상태를 더 정확히 이해할 수 있습니다.',
      cta: '부모님 식사 확인이 필요하다면 안심케어 상담을 신청해 주세요.',
      keywords: ['부모님 식사 확인', '부모님 컨디션', '부모님 안부', '생활 루틴'],
    },
    {
      key: 'family_report',
      audience: '형제자매와 부모님 상태를 공유해야 하는 가족',
      title: '부모님 안심 리포트가 가족 돌봄 부담을 줄이는 이유',
      shortTitle: '가족에게 필요한 안심 리포트',
      focus: '자녀 안심 리포트',
      pain: '가족마다 부모님 상태를 다르게 알고 있으면 돌봄 부담과 갈등이 커질 수 있습니다.',
      promise: '정기 확인 결과를 요약해 가족이 같은 정보를 보고 판단할 수 있게 돕습니다.',
      urgency: '부모님 상태 공유가 늦어지면 가족이 뒤늦게 허둥대기 쉽습니다.',
      proofAngle: '간단한 리포트는 가족 간 소통 비용을 줄이고 돌봄 결정을 쉽게 만듭니다.',
      cta: '부모님 상태를 가족과 공유하는 안심 리포트 방식을 상담받아 보세요.',
      keywords: ['안심 리포트', '부모님 상태 공유', '가족 돌봄', '부모님 케어 서비스'],
    },
  ];

  const idx = Math.floor(Date.now() / 86400000) % topics.length;
  return topics[idx];
}

function safeFooter() {
  return '※ 부모님 안심케어는 의료 진단·치료·응급 대응을 보장하는 서비스가 아니라, 안부·식사·복약 여부 등 생활 루틴을 확인하고 가족에게 전달하는 정기 확인 서비스입니다.';
}

function hashtags(topic: CreativeTopic) {
  const base = ['#부모님안심케어', '#부모님케어', '#안부확인', '#시니어케어'];
  const fromKeywords = topic.keywords.map((k) => `#${k.replace(/\s+/g, '')}`);
  return Array.from(new Set([...base, ...fromKeywords])).slice(0, 8);
}

export function buildMediaBrief(topic: CreativeTopic, format: MediaBrief['image']['format']): MediaBrief {
  const visualStyle = '따뜻하고 신뢰감 있는 한국형 가족 케어 브랜드 이미지. 과장된 병원 느낌은 피하고, 밝은 집 안 분위기, 스마트폰 리포트, 체크리스트, 부드러운 베이지/블루 톤. 얼굴은 특정 인물처럼 식별되지 않게 손, 전화기, 체크리스트, 뒷모습 중심.';
  const negative = '공포 분위기, 병원 응급실, 의료 진단 장면, 과장된 슬픔, 노골적인 환자 이미지, 개인정보가 보이는 화면, 실제 유명인 얼굴, 자극적인 문구';

  const carousel = [
    {
      slide: 1,
      headline: '매일 전화 못 해도 괜찮습니다',
      copy: '부모님 안부는 정해진 루틴으로 놓치지 않게 확인할 수 있습니다.',
      visual: '스마트폰을 바라보는 자녀의 손과 따뜻한 거실 조명',
    },
    {
      slide: 2,
      headline: topic.focus,
      copy: topic.pain,
      visual: '체크리스트에 안부·식사·복약 항목이 표시된 장면',
    },
    {
      slide: 3,
      headline: '다섯 가지를 확인합니다',
      copy: '안부, 식사, 복약, 외출, 도움이 필요한 일',
      visual: '깔끔한 아이콘 5개와 부드러운 배경',
    },
    {
      slide: 4,
      headline: '가족에게 요약 리포트',
      copy: '길게 설명하지 않아도 부모님 하루 상태를 한눈에 확인합니다.',
      visual: '휴대폰 알림으로 도착한 안심 리포트 카드',
    },
    {
      slide: 5,
      headline: '무료 상담 신청',
      copy: topic.cta,
      visual: '상담 신청 버튼과 부모님 안심케어 로고 카드',
    },
  ];

  const videoScenes = [
    {
      time: '0~4초',
      visual: '밤에 퇴근 후 전화기를 보는 자녀의 손, 조용한 집 분위기',
      caption: '오늘도 부모님께 전화 못 드렸다면',
      voiceover: '오늘도 바빠서 부모님께 전화 못 드렸다면, 마음이 편하지 않으셨죠.',
    },
    {
      time: '4~10초',
      visual: '체크리스트에 안부, 식사, 복약, 외출 항목이 차례로 체크됨',
      caption: '안부·식사·복약·외출 확인',
      voiceover: '부모님 안심케어는 안부, 식사, 복약, 외출 같은 생활 루틴을 정기적으로 확인합니다.',
    },
    {
      time: '10~18초',
      visual: '부모님 댁의 따뜻한 조명과 달력, 전화 상담 이미지',
      caption: topic.focus,
      voiceover: topic.promise,
    },
    {
      time: '18~26초',
      visual: '스마트폰에 가족 안심 리포트가 도착하는 장면',
      caption: '가족에게 안심 리포트 전달',
      voiceover: '확인 결과는 가족이 보기 쉽게 요약해 전달합니다.',
    },
    {
      time: '26~35초',
      visual: '부모님 안심케어 상담 신청 CTA 카드',
      caption: '부모님 상황에 맞게 상담받기',
      voiceover: '혼자 계신 부모님이 걱정된다면, 지금 부모님 안심케어 상담을 신청해 주세요.',
    },
  ];

  return {
    image: {
      format,
      title: topic.shortTitle,
      subtitle: topic.cta,
      style: visualStyle,
      prompt: `${visualStyle} 주제: ${topic.shortTitle}. 핵심 메시지: ${topic.promise}. 텍스트 삽입용 여백이 있는 16:9 마케팅 이미지.`,
      negative_prompt: negative,
    },
    carousel,
    video: {
      platform: 'youtube_shorts',
      duration_sec: 35,
      title: `${topic.shortTitle} | 부모님 안심케어`,
      hook: '오늘도 부모님께 전화 못 드렸다면, 이 체크가 필요합니다.',
      voiceover: videoScenes.map((s) => s.voiceover).join(' '),
      scenes: videoScenes,
      thumbnail_text: topic.shortTitle,
      description: `${topic.title}\n\n부모님 안심케어는 안부, 식사, 복약, 생활 변화를 정기적으로 확인하고 가족에게 안심 리포트를 전달합니다.\n\n${safeFooter()}`,
      hashtags: hashtags(topic),
    },
  };
}

export function appendMediaJson(body: string, media: MediaBrief) {
  return `${body.trim()}\n\n${MEDIA_START}\n${JSON.stringify(media, null, 2)}\n${MEDIA_END}`;
}

export function extractMediaJson(body: string | null | undefined): MediaBrief | null {
  const text = body || '';
  const start = text.indexOf(MEDIA_START);
  const end = text.indexOf(MEDIA_END);
  if (start < 0 || end < 0 || end <= start) return null;
  const raw = text.slice(start + MEDIA_START.length, end).trim();
  try {
    return JSON.parse(raw) as MediaBrief;
  } catch {
    return null;
  }
}

export function stripMediaJson(body: string | null | undefined) {
  const text = body || '';
  const start = text.indexOf(MEDIA_START);
  const end = text.indexOf(MEDIA_END);
  if (start < 0 || end < 0 || end <= start) return text;
  return `${text.slice(0, start)}${text.slice(end + MEDIA_END.length)}`.trim();
}

export function buildBlogBody(topic: CreativeTopic) {
  return `# ${topic.title}

${topic.pain}

부모님과 떨어져 지내는 자녀에게 가장 어려운 점은 “괜찮으시겠지”라고 생각하면서도 계속 마음이 쓰인다는 것입니다. 부모님 안심케어는 이런 불안을 줄이기 위해 부모님의 안부, 식사, 복약, 생활 변화를 정기적으로 확인하고 가족에게 요약 리포트를 전달하는 서비스입니다.

## 이런 분께 필요합니다

- 부모님이 혼자 계셔서 정기적인 안부 확인이 필요한 가족
- 약 복용, 식사, 외출 여부가 걱정되는 자녀
- 형제자매와 부모님 상태를 같은 기준으로 공유하고 싶은 가족
- 매일 전화드리기는 어렵지만 부모님 상태를 놓치고 싶지 않은 보호자

## 왜 지금 확인 루틴이 필요할까요?

${topic.urgency} 단순히 “괜찮으세요?”라고 묻는 것보다 정해진 항목을 꾸준히 확인하는 것이 더 도움이 됩니다.

확인해야 할 기본 항목은 다음과 같습니다.

1. 오늘 컨디션과 안부
2. 식사 여부
3. 복약 여부
4. 외출과 귀가 여부
5. 도움이 필요한 일
6. 가족에게 전달할 특이사항

## 부모님 안심케어는 어떻게 진행되나요?

1. 가족이 부모님 상황을 상담합니다.
2. 필요한 확인 항목과 주기를 정합니다.
3. 정해진 방식으로 안부와 생활 루틴을 확인합니다.
4. 가족에게 요약 리포트를 전달합니다.
5. 특이사항이 있으면 가족이 빠르게 확인할 수 있게 돕습니다.

## 자녀에게 좋은 점

${topic.proofAngle} 매일 긴 통화를 하지 못해도, 부모님의 하루 상태를 확인할 수 있는 기준이 생깁니다.

## 부모님께 좋은 점

부모님께는 “나를 계속 챙겨주는 사람이 있다”는 안정감을 줄 수 있습니다. 단순 감시가 아니라 따뜻한 안부 확인과 생활 루틴 체크에 가깝습니다.

## 상담 신청 안내

${topic.cta}

상담 신청을 남겨주시면 부모님 상황에 맞는 확인 항목, 주기, 리포트 방식을 안내해 드립니다.

${safeFooter()}`;
}

export function buildSnsBody(topic: CreativeTopic) {
  return `오늘도 부모님께 전화 못 드렸다면, 마음이 불편하셨죠.

${topic.pain}

부모님 안심케어는 ${topic.focus}을 포함해 안부, 식사, 복약, 생활 변화를 정기적으로 확인하고 가족에게 안심 리포트를 전합니다.

카드뉴스 구성:
1) 매일 전화 못 해도 놓치지 않는 안심 체크
2) ${topic.focus}이 중요한 이유
3) 안부·식사·복약·외출·도움 필요 여부
4) 가족에게 전달되는 안심 리포트
5) 무료 상담 신청

CTA: ${topic.cta}

${hashtags(topic).join(' ')}`;
}

export function buildLinkedInBody(topic: CreativeTopic) {
  return `고령 부모님을 돌보는 가족에게 필요한 것은 일회성 연락이 아니라 반복 가능한 확인 체계입니다.

오늘의 주제는 “${topic.focus}”입니다.

${topic.pain}

부모님 안심케어는 부모님의 안부, 식사, 복약, 생활 변화를 정기적으로 확인하고 가족에게 요약 리포트를 전달하는 케어 루틴을 지향합니다.

이 서비스의 핵심은 기술 자체가 아니라 가족이 지속적으로 안심할 수 있는 운영 체계입니다.

- 부모님께는 꾸준한 관심
- 자녀에게는 확인 가능한 정보
- 가족에게는 돌봄 부담 감소
- 운영자에게는 반복 가능한 케어 프로세스

${topic.cta}

${safeFooter()}

${hashtags(topic).join(' ')}`;
}

export function buildYoutubeBody(topic: CreativeTopic) {
  const media = buildMediaBrief(topic, 'youtube_thumbnail');
  const video = media.video!;
  return `제목: ${video.title}

영상 길이: ${video.duration_sec}초
형식: YouTube Shorts / Instagram Reels 공용

후킹 문구:
${video.hook}

장면 구성:
${video.scenes
  .map((s) => `\n[${s.time}]\n화면: ${s.visual}\n자막: ${s.caption}\n내레이션: ${s.voiceover}`)
  .join('\n')}

썸네일 문구:
${video.thumbnail_text}

설명란:
${video.description}

해시태그:
${video.hashtags.join(' ')}

제작 지시:
- 영상 톤은 따뜻하고 과장되지 않게
- 의료 진단처럼 보이는 표현 금지
- 자막은 큰 글씨, 2줄 이하
- 마지막 3초는 상담 신청 CTA 카드
- 부모님 얼굴은 특정 인물처럼 식별되지 않게 연출`;
}

export function buildOpsReportBody(topic: CreativeTopic) {
  return `오늘 앱/마케팅 케어 리포트: ${todayKoreanDate()}

오늘의 마케팅 주제:
${topic.title}

오늘 생성할 자산:
1. 검색 노출용 블로그 글
2. 카드뉴스/SNS 게시글
3. LinkedIn 신뢰형 게시글
4. YouTube Shorts 대본 및 썸네일 문구
5. 블로그 대표 이미지 카드
6. 상담 리드 후속 메시지

점검 항목:
- 상담 신청 폼 정상 작동 여부
- Supabase 저장 여부
- 승인 대기 콘텐츠 수
- 블로그 게시 성공 여부
- SNS/LinkedIn/YouTube Webhook 연결 상태
- 발송 실패/수신거부 여부

운영 원칙:
- 공식 계정/API/Webhook으로만 게시
- 무작위 DM, 댓글 도배, 스크래핑 연락처 광고 금지
- 수신동의 없는 직접 광고 발송 금지
- 의료 효과 보장 표현 금지

다음 개선 과제:
랜딩페이지 첫 화면에 “매일 전화 못 해도 부모님 상태는 놓치지 않도록” 메시지와 무료 상담 CTA를 더 강하게 노출하세요.`;
}

export function buildLeadFollowupBody(input: { name?: string | null; situation?: string | null }) {
  const name = input.name || '고객';
  const situation = input.situation || '부모님 안부 확인이 필요한 상황';

  return `${name}님, 안녕하세요. 부모님 안심케어입니다.

상담 신청 내용을 확인했습니다.

남겨주신 상황:
${situation}

부모님 안심케어는 부모님의 안부, 식사, 복약 여부, 외출·귀가, 생활 변화를 정기적으로 확인하고 가족에게 안심 리포트를 전달하는 서비스입니다.

처음 상담에서는 아래 세 가지만 확인하면 됩니다.

1. 가장 걱정되는 부분
2. 확인이 필요한 요일과 시간대
3. 가족에게 받고 싶은 리포트 방식

부모님 상황에 맞는 확인 주기를 제안드릴 수 있습니다.
상담 가능하신 시간대를 알려주시면 자세히 안내드리겠습니다.

${safeFooter()}

수신거부를 원하시면 메일의 수신거부 링크를 통해 처리하실 수 있습니다.`;
}
