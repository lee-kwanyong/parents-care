export type NaverResult = {
  title: string;
  link: string;
  description: string;
};

export type Research = {
  keyword: string;
  resultCount: number;
  topTitles: string[];
  topLinks: string[];
  insights: {
    titlePatterns: string[];
    contentAngles: string[];
    gapOpportunities: string[];
  };
};

export type ImageCard = {
  title: string;
  subtitle: string;
  bullets: string[];
  footer: string;
  tone: string;
};

export type RichPackage = {
  keyword: string;
  title: string;
  body: string;
  tags: string[];
  imageBrief: {
    mainTheme: string;
    colorMood: string;
    cards: ImageCard[];
  };
  videoBrief: {
    shortsTitle: string;
    thumbnailText: string;
    hook: string;
    durationSec: number;
    scenes: {
      sec: string;
      visual: string;
      caption: string;
      narration: string;
    }[];
    description: string;
    hashtags: string[];
    tiktokCaption: string;
    instagramCaption: string;
    linkedinPost: string;
    naverCafeAnswer: string;
    knowledgeInAnswer: string;
  };
  adPlan: {
    campaignName: string;
    adgroupName: string;
    headline: string;
    description: string;
    landingUrl: string;
    dailyBudget: number;
  };
};

function stripHtml(value: string) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function getPrimaryKeywords() {
  const raw =
    process.env.MARKETING_PRIMARY_KEYWORDS ||
    "부모님 안부 확인,혼자 계신 부모님,독거 부모님 케어,부모님 복약 체크,부모님 돌봄 서비스,멀리 사는 부모님 케어,어르신 안부 확인";

  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function fetchNaverResearch(keyword: string): Promise<Research> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID || "";
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    return fallbackResearch(keyword, "NAVER_SEARCH_CLIENT_ID/SECRET 미설정");
  }

  try {
    const params = new URLSearchParams({
      query: keyword,
      display: "10",
      sort: "sim",
    });

    const res = await fetch(`https://openapi.naver.com/v1/search/blog.json?${params.toString()}`, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return fallbackResearch(keyword, `네이버 검색 API 오류: ${res.status} ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const items = Array.isArray(json.items) ? json.items : [];

    const results: NaverResult[] = items.map((item: any) => ({
      title: stripHtml(item.title),
      link: String(item.link || ""),
      description: stripHtml(item.description),
    }));

    const topTitles = results.map((r) => r.title).filter(Boolean).slice(0, 10);
    const topLinks = results.map((r) => r.link).filter(Boolean).slice(0, 10);

    return {
      keyword,
      resultCount: Number(json.total || results.length || 0),
      topTitles,
      topLinks,
      insights: buildInsights(keyword, topTitles),
    };
  } catch (err) {
    return fallbackResearch(keyword, err instanceof Error ? err.message : String(err));
  }
}

function fallbackResearch(keyword: string, reason: string): Research {
  const topTitles = [
    `${keyword}, 자녀가 놓치기 쉬운 현실적인 체크 포인트`,
    `혼자 계신 부모님 안부를 매일 챙기기 어려울 때`,
    `부모님 복약·식사 확인을 가족이 지속하기 어려운 이유`,
    `멀리 사는 자녀를 위한 부모님 안심 체크 방법`,
    `어르신 생활 변화, 작은 신호를 놓치지 않는 방법`,
  ];

  return {
    keyword,
    resultCount: 0,
    topTitles,
    topLinks: [],
    insights: {
      titlePatterns: ["공감형 제목", "체크리스트형 제목", "현실 문제 해결형 제목", "자녀 관점 제목"],
      contentAngles: ["멀리 사는 자녀의 불안", "혼자 계신 부모님 생활 루틴", "복약·식사 확인", "가족 안심 리포트"],
      gapOpportunities: [
        "단순 홍보보다 실제 체크 항목을 보여주는 글이 필요",
        "부모님을 감시한다는 느낌이 아니라 따뜻한 안부 확인으로 표현",
        "의료·응급 보장처럼 보이는 표현은 피하고 생활 루틴 확인에 집중",
        `fallback reason: ${reason}`,
      ],
    },
  };
}

function buildInsights(keyword: string, topTitles: string[]) {
  const joined = topTitles.join(" ");
  const patterns: string[] = [];
  const angles: string[] = [];
  const gaps: string[] = [];

  if (/체크|확인|방법/.test(joined)) patterns.push("방법·체크리스트형 제목이 많이 보임");
  if (/혼자|독거|멀리/.test(joined)) patterns.push("혼자 계신 부모님·멀리 사는 자녀 관점이 강함");
  if (/걱정|안심|불안/.test(joined)) patterns.push("보호자 불안 해소형 메시지가 적합");
  if (patterns.length === 0) patterns.push("공감형 후킹 + 체크리스트 구성이 적합");

  angles.push(`${keyword}를 보호자 입장에서 쉽게 설명`);
  angles.push("안부·식사·복약·생활 변화 체크를 구체적으로 제시");
  angles.push("부모님을 감시하는 느낌이 아닌 따뜻한 안부 루틴으로 표현");
  angles.push("상담 신청 전환으로 이어지는 CTA 배치");

  gaps.push("서비스 홍보만 하는 짧은 글보다 실제 체크리스트와 사례가 필요");
  gaps.push("의료·간병을 직접 제공하는 것처럼 보이는 과장 표현은 피해야 함");
  gaps.push("네이버 블로그용은 제목 후보, 본문, 이미지 카드, 태그까지 한 묶음으로 제공해야 함");

  return { titlePatterns: patterns, contentAngles: angles, gapOpportunities: gaps };
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function landingUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "https://parents-care.net";
}

export function createRichPackage(keyword: string, research: Research): RichPackage {
  const brandMessage = process.env.MARKETING_BRAND_MESSAGE || "매일 전화하지 못해도, 부모님 하루는 놓치지 않게.";
  const date = nowDate();
  const landing = landingUrl();

  const title = `${keyword}, 매일 챙기기 어려운 자녀를 위한 현실적인 안심 체크 방법`;

  const body = `# ${title}

${brandMessage}

부모님과 떨어져 지내는 자녀라면 한 번쯤 이런 생각을 해보셨을 겁니다.

“오늘 식사는 잘하셨을까?”
“약은 제때 드셨을까?”
“전화를 안 받으시는데 무슨 일이 있는 건 아닐까?”
“매일 전화드리고 싶은데 일이 바빠서 놓치는 날이 생긴다.”

부모님을 사랑하지 않아서가 아닙니다. 현실적으로 매일 같은 시간에 안부를 확인하고, 식사와 복약, 생활 변화를 꾸준히 살피는 일은 쉽지 않습니다. 특히 부모님이 혼자 계시거나 자녀가 다른 지역에 살고 있다면 작은 변화 하나도 늦게 알게 되는 경우가 많습니다.

이 글은 ${keyword}를 고민하는 보호자를 위해, 집에서 바로 적용할 수 있는 체크 방법과 부모님 안심케어가 어떤 방식으로 도움을 줄 수 있는지 정리한 글입니다.

---

## 1. 부모님 안부 확인이 어려운 이유

부모님 안부 확인은 단순히 “전화 한 통”의 문제가 아닙니다. 실제로는 아래 항목을 계속 확인해야 합니다.

- 오늘 식사를 하셨는지
- 약을 제때 드셨는지
- 평소와 다른 컨디션 변화가 있는지
- 외출 후 무사히 귀가하셨는지
- 불편한 점이나 도움이 필요한 일이 있는지
- 병원 일정이나 생활 일정이 밀리지 않았는지
- 최근 말수가 줄거나 생활 패턴이 바뀌지는 않았는지

이 항목은 하루 이틀 확인한다고 끝나는 것이 아니라 반복적으로 확인해야 의미가 있습니다. 그래서 많은 보호자가 “걱정은 되지만 지속하기가 어렵다”는 문제를 겪습니다.

---

## 2. 자녀가 놓치기 쉬운 작은 신호

부모님 생활 변화는 큰 사건으로 갑자기 나타나기보다 작은 신호로 시작되는 경우가 많습니다. 예를 들면 다음과 같습니다.

- 평소보다 전화를 늦게 받는다
- 식사 시간이 불규칙해진다
- 약 복용 여부를 자주 헷갈려 하신다
- 외출을 줄이고 집에만 계신다
- 예전보다 말수가 줄어든다
- 같은 말을 반복하거나 일정 확인을 자주 하신다
- 집안일이나 생활 루틴이 흐트러진다

이런 변화는 무조건 위험하다는 뜻은 아닙니다. 다만 자녀가 멀리 있거나 바쁠 때는 이런 변화를 늦게 알아차리기 쉽습니다. 그래서 중요한 것은 “한 번의 확인”이 아니라 “정기적인 확인 루틴”입니다.

---

## 3. 집에서 바로 쓸 수 있는 부모님 안심 체크리스트

부모님과 통화할 때 아래 순서로 확인해 보세요. 질문은 너무 딱딱하게 하기보다 자연스럽게 대화 속에 넣는 것이 좋습니다.

### 식사 확인
- 오늘 아침이나 점심은 드셨는지
- 식사를 거르는 날이 늘지는 않았는지
- 장보기나 반찬 준비가 불편하지 않은지

### 복약 확인
- 오늘 드셔야 할 약을 드셨는지
- 약 봉투나 약통 정리가 잘 되어 있는지
- 병원에서 받은 약이 바뀌지는 않았는지

### 컨디션 확인
- 몸이 평소와 다르게 불편한 곳은 없는지
- 잠은 잘 주무셨는지
- 기운이 없거나 어지러운 느낌은 없는지

### 생활 확인
- 외출이나 병원 일정이 있었는지
- 집안에서 불편한 물건이나 고장 난 것이 있는지
- 도움이 필요한 일이 생기지는 않았는지

### 정서 확인
- 요즘 외롭거나 답답하지 않으신지
- 친구나 이웃과 연락은 하시는지
- 대화할 사람이 필요한 순간은 없는지

이 체크리스트는 단순하지만 꾸준히 하면 부모님의 생활 흐름을 이해하는 데 도움이 됩니다.

---

## 4. 부모님 안심케어는 무엇을 확인하나요?

부모님 안심케어는 보호자가 매일 직접 확인하기 어려운 안부·식사·복약·생활 변화를 정해진 주기에 맞춰 확인하고, 필요한 내용을 보호자에게 정리해 전달하는 케어 루틴입니다.

확인 항목은 부모님 상황에 맞춰 조정할 수 있습니다.

- 정기 안부 확인
- 식사 여부 확인
- 복약 여부 확인
- 외출·귀가 여부 확인
- 컨디션 변화 확인
- 불편사항 확인
- 보호자 안심 리포트 전달

여기서 중요한 점은 부모님을 감시하거나 통제하는 것이 아닙니다. 부모님께는 따뜻한 안부를, 자녀에게는 놓치기 쉬운 생활 변화를 전달하는 것이 목적입니다.

---

## 5. 어떤 보호자에게 필요할까요?

부모님 안심케어는 특히 아래 상황에 잘 맞습니다.

- 부모님이 혼자 거주하신다
- 자녀가 타지역이나 해외에 산다
- 부모님이 약을 정기적으로 드신다
- 식사 여부가 걱정된다
- 매일 전화드리기 어려운 직장인 자녀다
- 부모님의 생활 패턴 변화를 늦게 알게 될까 걱정된다
- 부모님이 간병까지는 필요 없지만 정기적인 안부 확인은 필요하다

부모님 상황은 집마다 다릅니다. 그래서 무조건 매일 확인이 필요한 가정도 있고, 주 2~3회 정도면 충분한 가정도 있습니다. 핵심은 부모님 생활에 맞는 주기를 정하는 것입니다.

---

## 6. 실제 이용 흐름 예시

예를 들어 어머니가 혼자 거주하시고, 자녀가 직장 때문에 매일 같은 시간에 전화드리기 어렵다고 가정해 보겠습니다.

1. 보호자가 상담 신청을 합니다.
2. 부모님 상황을 간단히 공유합니다.
3. 안부 확인 주기와 확인 항목을 정합니다.
4. 정해진 주기에 안부·식사·복약·생활 변화를 확인합니다.
5. 보호자에게 요약 리포트를 전달합니다.
6. 특이사항이 있으면 보호자가 더 빠르게 확인할 수 있습니다.

이 과정은 복잡하지 않습니다. 보호자가 혼자 모든 것을 챙기지 않아도 되도록, 반복되는 안부 확인 루틴을 대신 정리해 주는 방식입니다.

---

## 7. 자주 묻는 질문

### Q. 의료 서비스인가요?
아닙니다. 부모님 안심케어는 의료 진단이나 치료, 응급 구조를 제공하는 서비스가 아닙니다. 안부·식사·복약 여부 같은 생활 루틴을 확인하고 보호자에게 전달하는 서비스입니다.

### Q. 부모님이 부담스러워하지 않으실까요?
확인 방식은 부모님 성향에 맞춰 조정할 수 있습니다. 핵심은 감시가 아니라 안부입니다. 부담을 줄이기 위해 자연스러운 대화형 확인을 지향합니다.

### Q. 매일 확인해야 하나요?
가정마다 다릅니다. 혼자 거주하시거나 복약 확인이 중요한 경우에는 더 자주 확인할 수 있고, 일반 안부 목적이라면 주 2~3회부터 시작할 수 있습니다.

### Q. 자녀에게는 무엇이 전달되나요?
부모님 상태, 식사·복약 확인 여부, 불편사항, 특이사항 등을 요약해 전달하는 방식으로 운영할 수 있습니다.

---

## 8. 지금 바로 시작하는 방법

부모님 안부가 걱정되지만 매일 챙기기 어려우셨다면, 먼저 부모님 상황에 맞는 확인 주기부터 정해보세요.

상담 신청 시 아래 내용을 알려주시면 더 정확하게 안내드릴 수 있습니다.

- 부모님 거주 형태
- 가장 걱정되는 부분
- 식사·복약 확인 필요 여부
- 희망 확인 주기
- 보호자가 받고 싶은 리포트 방식

부모님 안심케어 상담 신청:
${landing}

---

## 9. 마무리

부모님을 챙기는 마음은 크지만, 현실의 시간은 항상 부족합니다. 그래서 필요한 것은 죄책감이 아니라 지속 가능한 케어 루틴입니다.

부모님 안심케어는 자녀의 부담을 줄이고, 부모님께는 정기적인 안부와 관심을 전달하기 위한 서비스입니다.

매일 전화하지 못해도,
부모님 하루는 놓치지 않게.

${date} 작성`;

  const tags = [
    "부모님안심케어",
    "부모님안부확인",
    "혼자계신부모님",
    "독거부모님케어",
    "부모님복약체크",
    "어르신안부확인",
    "멀리사는부모님",
    "부모님돌봄서비스",
    "자녀안심리포트",
    keyword.replace(/\s+/g, ""),
  ];

  const cards: ImageCard[] = [
    {
      title: "매일 전화하지 못해도",
      subtitle: "부모님 하루는 놓치지 않게",
      bullets: ["안부 확인", "식사 확인", "복약 확인"],
      footer: "부모님 안심케어",
      tone: "warm",
    },
    {
      title: "혼자 계신 부모님",
      subtitle: "이런 신호를 놓치지 마세요",
      bullets: ["전화 응답이 늦어짐", "식사 시간이 불규칙", "약 복용을 헷갈려 하심"],
      footer: "작은 변화도 정기적으로 확인",
      tone: "trust",
    },
    {
      title: "안부 확인 체크리스트",
      subtitle: "통화할 때 자연스럽게 확인하세요",
      bullets: ["오늘 식사는 하셨나요?", "약은 드셨나요?", "불편한 곳은 없나요?"],
      footer: "가족이 바로 쓸 수 있는 체크 포인트",
      tone: "info",
    },
    {
      title: "부모님 안심케어가 하는 일",
      subtitle: "안부·식사·복약·생활 변화 확인",
      bullets: ["정기 안부 확인", "생활 루틴 체크", "보호자 요약 리포트"],
      footer: "감시가 아니라 따뜻한 안부",
      tone: "service",
    },
    {
      title: "멀리 사는 자녀를 위한",
      subtitle: "지속 가능한 케어 루틴",
      bullets: ["바쁜 일정에도", "반복 확인을 놓치지 않게", "가족의 걱정을 줄이도록"],
      footer: "부모님 상황에 맞춰 조정",
      tone: "family",
    },
    {
      title: "무료 상담 신청",
      subtitle: "부모님 상황에 맞는 확인 주기를 안내합니다",
      bullets: ["혼자 거주", "복약 체크", "식사 확인"],
      footer: landing,
      tone: "cta",
    },
  ];

  const videoScenes = [
    {
      sec: "0-3초",
      visual: "혼자 계신 부모님 집 창가, 따뜻한 아침 빛",
      caption: "매일 전화드리고 싶지만",
      narration: "매일 전화드리고 싶지만, 현실은 쉽지 않습니다.",
    },
    {
      sec: "3-7초",
      visual: "직장에서 바쁜 자녀가 휴대폰을 바라보는 장면",
      caption: "일과 생활 때문에 놓치는 날도 있죠",
      narration: "일과 생활 때문에 부모님 안부를 놓치는 날도 생깁니다.",
    },
    {
      sec: "7-12초",
      visual: "식탁, 약통, 달력 체크 화면",
      caption: "식사·복약·생활 변화",
      narration: "식사는 하셨는지, 약은 드셨는지, 생활에 불편함은 없는지.",
    },
    {
      sec: "12-18초",
      visual: "안부 확인 체크리스트 그래픽",
      caption: "정기적으로 확인하면 달라집니다",
      narration: "중요한 건 한 번의 확인이 아니라 정기적인 확인 루틴입니다.",
    },
    {
      sec: "18-25초",
      visual: "부모님 안심케어 리포트 카드",
      caption: "자녀에게 안심 리포트",
      narration: "부모님 안심케어는 확인 내용을 보호자에게 정리해 전달합니다.",
    },
    {
      sec: "25-32초",
      visual: "부모님과 자녀가 미소 짓는 따뜻한 이미지",
      caption: "감시가 아니라 따뜻한 안부",
      narration: "감시가 아니라, 부모님께 전하는 따뜻한 안부입니다.",
    },
    {
      sec: "32-38초",
      visual: "상담 신청 버튼과 URL",
      caption: "부모님 상황에 맞는 케어 주기 상담",
      narration: "부모님 상황에 맞는 안심 체크 주기를 상담받아보세요.",
    },
  ];

  const videoBrief = {
    shortsTitle: `${keyword}가 걱정된다면, 먼저 이 3가지를 확인하세요`,
    thumbnailText: "부모님 안부, 이렇게 챙기세요",
    hook: "부모님이 혼자 계신데 매일 안부 확인이 어렵다면?",
    durationSec: 38,
    scenes: videoScenes,
    description: `부모님 안심케어는 안부·식사·복약·생활 변화를 정기적으로 확인하고 보호자에게 요약 리포트를 전달하는 서비스입니다.\n상담 신청: ${landing}`,
    hashtags: ["#부모님안심케어", "#부모님안부확인", "#복약체크", "#독거부모님", "#시니어케어"],
    tiktokCaption: `부모님이 혼자 계신데 매일 확인하기 어렵다면? 안부·식사·복약 체크 루틴부터 만들어보세요. ${landing}`,
    instagramCaption: `매일 전화하지 못해도 부모님 하루는 놓치지 않게.\n안부, 식사, 복약, 생활 변화를 정기적으로 확인하고 보호자에게 안심 리포트를 전달합니다.\n\n상담 신청: ${landing}\n\n#부모님안심케어 #부모님안부확인 #독거부모님케어 #복약체크`,
    linkedinPost: `고령 부모님을 둔 자녀 세대에게 필요한 것은 단발성 확인이 아니라 지속 가능한 케어 루틴입니다.\n\n부모님 안심케어는 안부·식사·복약·생활 변화를 정기적으로 확인하고 보호자에게 요약 리포트를 전달하는 서비스입니다.\n\n핵심은 감시가 아니라 따뜻한 안부 확인입니다.\n상담: ${landing}`,
    naverCafeAnswer: `저도 비슷한 고민을 하는 분들을 많이 봤습니다. 혼자 계신 부모님은 큰 문제보다 작은 생활 변화가 먼저 나타나는 경우가 많아서 식사, 복약, 컨디션, 외출 여부를 정기적으로 확인하는 루틴이 중요합니다. 가족이 직접 체크하기 어렵다면 정기 안부 확인 서비스를 검토해 볼 수 있습니다. 부모님 안심케어는 안부·식사·복약 여부를 확인하고 보호자에게 요약해 주는 방식이라 이런 고민에 도움이 될 수 있습니다. 다만 의료나 응급 대응 서비스는 아니므로 부모님 상황에 맞게 이용 범위를 확인해 보시는 게 좋습니다.`,
    knowledgeInAnswer: `멀리 사는 자녀 입장에서는 매일 같은 시간에 부모님 안부와 복약 여부를 확인하기가 쉽지 않습니다. 우선은 식사 여부, 약 복용 여부, 컨디션 변화, 외출·귀가 여부를 체크리스트로 만들어 통화 때 자연스럽게 확인해 보세요. 지속이 어렵다면 정기 안부 확인 서비스를 이용하는 방법도 있습니다. 부모님 안심케어처럼 안부·식사·복약·생활 변화를 확인하고 보호자에게 리포트하는 서비스를 검토해 볼 수 있습니다.`,
  };

  const adPlan = {
    campaignName: "부모님 안심케어 검색 캠페인",
    adgroupName: keyword,
    headline: "부모님 안부 확인, 매일 놓치지 않게",
    description: "안부·식사·복약 체크와 자녀 안심 리포트. 부모님 상황에 맞는 케어 주기를 상담받아보세요.",
    landingUrl: landing,
    dailyBudget: Number(process.env.NAVER_AD_DAILY_BUDGET || 10000),
  };

  return {
    keyword,
    title,
    body,
    tags,
    imageBrief: {
      mainTheme: "따뜻한 가족 돌봄, 안심, 정기 확인, 시니어 케어",
      colorMood: "mint, warm white, soft navy, calm beige",
      cards,
    },
    videoBrief,
    adPlan,
  };
}
