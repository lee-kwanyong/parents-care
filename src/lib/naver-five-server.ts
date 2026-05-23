import { createClient } from "@supabase/supabase-js";

export function adminKeyOk(key: string | null) {
  const expected = process.env.ADMIN_SECRET || "";
  return Boolean(expected && key && expected === key);
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

const KEYWORDS = [
  {
    keyword: "혼자 계신 부모님 안부 확인",
    title: "혼자 계신 부모님 안부 확인, 매일 전화가 어려울 때 현실적인 방법",
    pain: "일과 육아, 거리 문제 때문에 매일 전화를 드리기 어려운 보호자",
    focus: "안부·식사·복약·컨디션을 정기적으로 확인하는 루틴",
  },
  {
    keyword: "부모님 복약 체크",
    title: "부모님 복약 체크, 자녀가 놓치기 쉬운 7가지 신호",
    pain: "약을 드셨는지 확인하고 싶지만 매번 묻기 미안한 자녀",
    focus: "복약 여부와 생활 리듬을 부담스럽지 않게 확인하는 방법",
  },
  {
    keyword: "멀리 사는 부모님 케어",
    title: "멀리 사는 자녀가 부모님을 챙기는 방법, 전화만으로 부족할 때",
    pain: "부모님과 멀리 떨어져 살아 갑작스러운 생활 변화가 걱정되는 가족",
    focus: "정기 확인과 안심 리포트로 돌봄 공백을 줄이는 방식",
  },
  {
    keyword: "독거 부모님 케어 서비스",
    title: "독거 부모님 케어 서비스가 필요한 순간과 확인해야 할 체크리스트",
    pain: "혼자 생활하시는 부모님의 식사, 외출, 건강 상태가 걱정되는 보호자",
    focus: "혼자 계신 어르신에게 필요한 일상 확인 항목",
  },
  {
    keyword: "부모님 안심 리포트",
    title: "부모님 안심 리포트란? 바쁜 자녀를 위한 생활 체크 서비스",
    pain: "전화는 하지만 실제 생활 변화까지 파악하기 어려운 가족",
    focus: "부모님의 하루 상태를 요약해 보호자에게 전달하는 리포트",
  },
  {
    keyword: "어르신 식사 확인",
    title: "어르신 식사 확인, 부모님 생활 변화의 첫 신호를 놓치지 않는 법",
    pain: "식사량 감소나 생활 리듬 변화가 걱정되는 보호자",
    focus: "식사·수분·컨디션을 함께 보는 생활 체크",
  },
  {
    keyword: "부모님 전화 안 받을 때",
    title: "부모님이 전화를 늦게 받거나 안 받을 때, 자녀가 할 수 있는 준비",
    pain: "전화가 늦어질 때마다 불안해지는 가족",
    focus: "불안을 줄이는 정기 확인 체계와 연락 루틴",
  },
];

function pick(slot: number, seed = 0) {
  return KEYWORDS[(slot + seed) % KEYWORDS.length];
}

function tagList(keyword: string) {
  const base = [
    "부모님안심케어",
    "부모님안부확인",
    "독거부모님",
    "복약체크",
    "어르신케어",
    "부모님돌봄",
    "자녀안심리포트",
    "시니어케어",
  ];
  return Array.from(new Set([keyword.replace(/\s+/g, ""), ...base]));
}

function makeCards(title: string, keyword: string, focus: string) {
  return [
    {
      headline: "매일 전화하지 못해도",
      body: "부모님 하루는 놓치지 않게",
      footer: "부모님 안심케어",
    },
    {
      headline: "이런 순간이 걱정된다면",
      body: "전화를 늦게 받거나 식사·복약 루틴이 달라질 때",
      footer: keyword,
    },
    {
      headline: "핵심 체크 4가지",
      body: "안부 · 식사 · 복약 · 컨디션 변화",
      footer: "생활 루틴 확인",
    },
    {
      headline: "자녀에게 필요한 건",
      body: "막연한 걱정보다 정기적인 확인 기록",
      footer: "안심 리포트",
    },
    {
      headline: "부모님 안심케어",
      body: focus,
      footer: "상황별 확인 주기 설계",
    },
    {
      headline: "상담 신청",
      body: "부모님 상황에 맞는 체크 주기를 안내받아보세요",
      footer: "parents-care.net",
    },
  ];
}

function makeLongBody(input: { keyword: string; title: string; pain: string; focus: string }) {
  const { keyword, title, pain, focus } = input;
  return `${title}

부모님이 혼자 계시거나 자녀와 떨어져 지내는 경우, 가족이 느끼는 걱정은 단순히 “오늘 전화를 했는가”의 문제가 아닙니다. 전화를 받으셨는지, 식사는 하셨는지, 약은 잘 챙기셨는지, 평소와 다른 컨디션 변화는 없는지, 외출 후 안전하게 귀가하셨는지처럼 작은 확인들이 쌓여야 진짜 안심이 됩니다.

특히 ${pain}에게는 매일 같은 시간에 부모님 상태를 확인하는 일이 생각보다 쉽지 않습니다. 바쁜 업무, 육아, 거리 문제, 부모님께 부담을 드리고 싶지 않은 마음이 겹치면 확인은 점점 불규칙해집니다. 그러다 보면 어느 날 작은 변화가 뒤늦게 눈에 들어오기도 합니다.

이 글에서는 ${keyword}을 고민하는 보호자에게 필요한 현실적인 체크 방법과 부모님 안심케어가 어떤 방식으로 도움을 줄 수 있는지 정리해보겠습니다.

1. 왜 부모님 안부 확인은 “가끔 전화”만으로 부족할까요?

전화는 가장 따뜻한 확인 방법입니다. 하지만 전화 한 통으로 부모님의 하루 전체를 파악하기는 어렵습니다. 부모님은 자녀가 걱정할까 봐 불편한 일을 숨기기도 하고, “괜찮다”고 말씀하시지만 실제로는 식사를 거르거나 약 복용 시간이 흐트러진 경우도 있습니다.

또한 자녀 입장에서는 매번 같은 질문을 반복하기 어렵습니다.

“식사하셨어요?”
“약 드셨어요?”
“어디 불편한 곳은 없으세요?”
“오늘 외출하셨어요?”

이 질문들이 필요하다는 걸 알지만, 부모님께 잔소리처럼 들릴까 조심스러워집니다. 그래서 중요한 것은 감시가 아니라 자연스러운 확인 루틴입니다.

2. 자녀가 놓치기 쉬운 작은 신호

부모님의 생활 변화는 큰 사건으로 시작되기보다 작은 신호로 시작되는 경우가 많습니다.

- 평소보다 전화를 늦게 받는다
- 식사 시간이 자주 늦어진다
- 약 복용 여부를 헷갈려 하신다
- 외출 빈도가 갑자기 줄어든다
- 목소리에 기운이 없다
- 같은 이야기를 반복하는 빈도가 늘어난다
- 집안일이나 생활 루틴이 흐트러진다
- 병원 예약, 약 수령, 장보기 같은 일정이 밀린다

이런 신호가 한 번 나타났다고 큰 문제라고 단정할 수는 없습니다. 하지만 반복된다면 보호자가 생활 패턴을 조금 더 가까이 확인할 필요가 있습니다.

3. 부모님 안부 확인 체크리스트

부모님과 떨어져 사는 자녀라면 아래 항목을 주기적으로 확인해보는 것이 좋습니다.

첫째, 식사 확인입니다. 아침이나 점심을 거르지 않으셨는지, 식사량이 갑자기 줄지는 않았는지 확인합니다. 식사는 컨디션과 생활 리듬을 가장 쉽게 보여주는 지표입니다.

둘째, 복약 확인입니다. 약을 정해진 시간에 드셨는지, 약 봉투가 쌓이거나 빠지는 일이 있는지 확인합니다. 복약은 건강 상태와 직접 연결되기 때문에 반복적인 체크가 중요합니다.

셋째, 컨디션 확인입니다. 목소리, 피로감, 통증, 기분 변화를 살펴봅니다. 부모님은 자녀가 걱정할까 봐 표현을 줄이는 경우가 있으므로 단순히 “괜찮다”는 말만 듣기보다 평소와의 차이를 보는 것이 좋습니다.

넷째, 외출과 귀가 확인입니다. 병원, 산책, 장보기 등 외출 후 안전하게 돌아오셨는지 확인합니다. 특히 혼자 계신 부모님에게는 외출 루틴도 중요한 안심 요소입니다.

다섯째, 도움 요청 여부입니다. 장보기, 병원 동행, 약 수령, 집안 정리처럼 작은 도움이 필요한지 확인합니다. 부모님은 먼저 요청하지 않는 경우가 많기 때문에 정기적으로 묻는 것이 좋습니다.

4. 부모님 안심케어가 하는 일

부모님 안심케어는 ${focus}에 초점을 둔 서비스입니다. 자녀가 매일 직접 확인하기 어려운 부분을 정해진 주기와 항목에 맞춰 점검하고, 필요한 내용을 보호자에게 전달하는 구조입니다.

기본 확인 항목은 다음과 같습니다.

- 오늘 안부와 컨디션
- 식사 여부
- 복약 여부
- 외출 및 귀가 여부
- 생활 변화
- 도움이 필요한 요청 사항
- 보호자에게 전달해야 할 특이사항

이 서비스의 목적은 부모님을 감시하는 것이 아닙니다. 부모님께는 부담스럽지 않은 관심을, 자녀에게는 막연한 걱정을 줄이는 확인 기록을 제공하는 것입니다.

5. 어떤 분들에게 필요할까요?

부모님 안심케어는 이런 보호자에게 특히 적합합니다.

- 부모님이 혼자 거주하신다
- 자녀가 타지역 또는 해외에 있다
- 부모님의 약 복용 여부가 걱정된다
- 매일 전화하기 어렵지만 정기 확인은 필요하다
- 부모님이 “괜찮다”고만 하셔서 실제 상태를 알기 어렵다
- 식사, 병원, 외출 루틴이 불규칙해진 것 같다
- 가족끼리 부모님 케어 정보를 공유하고 싶다

6. 이용 흐름

부모님 안심케어는 복잡하지 않게 시작할 수 있습니다.

1단계: 상담 신청
부모님의 생활 상황, 거주 형태, 걱정되는 부분을 남깁니다.

2단계: 확인 항목 설계
안부, 식사, 복약, 외출, 컨디션 등 필요한 확인 항목을 정합니다.

3단계: 확인 주기 설정
주 1회, 주 3회, 매일 확인 등 부모님 상황에 맞는 주기를 정합니다.

4단계: 안심 리포트 전달
확인 내용을 보호자가 보기 쉽게 요약해 전달합니다.

5단계: 변화 발생 시 알림
평소와 다른 변화나 도움 요청이 있으면 보호자에게 공유합니다.

7. 자주 묻는 질문

Q. 부모님이 부담스러워하시지 않을까요?
A. 서비스의 핵심은 감시가 아니라 안부 확인입니다. 부모님께 불편하지 않은 방식으로 확인 항목과 빈도를 조정하는 것이 중요합니다.

Q. 의료 서비스인가요?
A. 아닙니다. 부모님 안심케어는 의료 진단이나 치료가 아니라 안부, 식사, 복약 여부, 생활 변화 확인을 돕는 생활 케어 서비스입니다.

Q. 매일 확인이 꼭 필요한가요?
A. 부모님 상황에 따라 다릅니다. 혼자 계시거나 복약이 중요한 경우에는 자주 확인하는 것이 좋고, 안정적인 경우 주 1~3회부터 시작할 수 있습니다.

Q. 자녀가 여러 명이면 함께 볼 수 있나요?
A. 가족이 함께 부모님 상태를 공유하는 방식으로 운영할 수 있습니다. 상담 시 원하는 전달 방식을 정하면 됩니다.

8. 마무리

부모님을 걱정하는 마음은 누구에게나 있지만, 매일 같은 시간에 같은 항목을 확인하는 일은 쉽지 않습니다. 그래서 필요한 것은 더 많은 걱정이 아니라 지속 가능한 확인 루틴입니다.

${keyword}을 고민하고 있다면, 부모님 상황에 맞는 안부 확인 주기를 먼저 상담받아보세요. 매일 전화하지 못해도 부모님 하루는 놓치지 않도록, 부모님 안심케어가 함께 확인하겠습니다.

상담 신청: https://parents-care.net
`;
}

function makeVideoBrief(input: { keyword: string; title: string; focus: string }) {
  return {
    title: input.title,
    thumbnail: "매일 전화하지 못해도, 부모님 하루는 놓치지 않게",
    duration: "35초",
    scenes: [
      { time: "0-3초", caption: "부모님이 혼자 계신데 매일 확인하기 어렵다면?", narration: "혼자 계신 부모님, 매일 챙기고 싶지만 쉽지 않죠.", visual: "걱정하며 휴대폰을 바라보는 보호자" },
      { time: "3-8초", caption: "식사는 하셨는지, 약은 드셨는지", narration: "식사와 복약, 컨디션은 작은 변화에서 시작됩니다.", visual: "식탁, 약봉투, 달력 체크 장면" },
      { time: "8-15초", caption: "중요한 건 정기적인 확인 루틴", narration: "한 번의 전화보다 중요한 건 꾸준한 확인 기록입니다.", visual: "체크리스트가 하나씩 체크되는 장면" },
      { time: "15-24초", caption: "부모님 안심케어", narration: input.focus, visual: "안부·식사·복약·외출 체크 카드" },
      { time: "24-32초", caption: "자녀에게 안심 리포트", narration: "확인 내용을 보호자에게 요약해 전달합니다.", visual: "스마트폰 리포트 화면" },
      { time: "32-35초", caption: "parents-care.net 상담 신청", narration: "부모님 상황에 맞는 확인 주기를 상담받아보세요.", visual: "상담 신청 버튼과 서비스 로고" },
    ],
    hashtags: ["#부모님안심케어", "#부모님안부확인", "#독거부모님", "#복약체크", "#시니어케어"],
  };
}

export function generateFivePackages(date: string) {
  const seed = new Date(date + "T00:00:00Z").getUTCDate();
  return Array.from({ length: 5 }).map((_, index) => {
    const item = pick(index, seed);
    const cards = makeCards(item.title, item.keyword, item.focus);
    const body = makeLongBody(item);
    const tags = tagList(item.keyword);
    const videoBrief = makeVideoBrief(item);
    return {
      campaign_date: date,
      slot: index + 1,
      keyword: item.keyword,
      title: item.title,
      subtitle: item.focus,
      body,
      summary: `${item.keyword}을 고민하는 보호자를 위한 장문 네이버 블로그 원고, 카드뉴스 6장, 숏폼 영상 대본, 카페/지식iN 답변, 검색광고 문구 패키지입니다.`,
      tags,
      card_news: cards,
      video_brief: videoBrief,
      youtube_brief: {
        ...videoBrief,
        description: `${item.title}\n\n부모님 안심케어 상담: https://parents-care.net\n\n${tags.map((t) => "#" + t).join(" ")}`,
      },
      tiktok_brief: {
        hook: "부모님이 혼자 계신데 매일 확인하기 어렵다면?",
        caption: "부모님 하루를 놓치지 않기 위한 정기 안부 확인 루틴. 상담은 parents-care.net",
        scenes: videoBrief.scenes,
        hashtags: videoBrief.hashtags,
      },
      instagram_brief: {
        caption: `매일 전화하지 못해도 부모님 하루는 놓치지 않게.\n\n${item.focus}\n\n상담 신청: parents-care.net\n\n${tags.map((t) => "#" + t).join(" ")}`,
        carousel: cards,
      },
      cafe_answer: `저도 비슷한 고민을 하는 보호자분들을 많이 봤습니다. ${item.keyword}은 단순히 전화를 자주 하는 것보다 식사, 복약, 컨디션, 외출 여부를 정기적으로 확인하는 루틴을 만드는 게 중요합니다. 가족이 직접 체크리스트를 만들어 주 2~3회라도 기록해보시고, 혼자 관리하기 어렵다면 부모님 안부 확인 서비스나 생활 케어 서비스를 검토해보는 것도 방법입니다. 핵심은 부모님께 부담을 주지 않으면서 꾸준히 확인하는 방식입니다.`,
      kin_answer: `부모님이 혼자 계시면 가장 먼저 식사 여부, 복약 여부, 컨디션 변화, 외출 후 귀가 여부를 정기적으로 확인하는 것이 좋습니다. 매일 전화가 어렵다면 가족끼리 확인 요일을 나누거나, 체크리스트를 만들어 기록하는 방식이 도움이 됩니다. 상황에 따라 정기 안부 확인 서비스를 이용하면 자녀가 놓치기 쉬운 부분을 보완할 수 있습니다. 다만 의료 진단이나 치료가 아니라 생활 확인 목적이라는 점을 구분해서 보시면 좋습니다.`,
      search_ad: {
        campaign: "부모님 안심케어",
        headline1: "혼자 계신 부모님 안부 확인",
        headline2: "식사·복약·생활 변화 체크",
        description: "매일 전화가 어려워도 부모님 하루는 놓치지 않도록. 부모님 안심케어 상담 신청.",
        landing_url: "https://parents-care.net",
        daily_budget: 10000,
      },
      status: "draft",
    };
  });
}

export function svgCard(card: any, index: number) {
  const bg = ["#172554", "#1e3a8a", "#2563eb", "#0f766e", "#7c3aed", "#be123c"][index % 6];
  const safe = (s: string) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
  const headline = safe(card?.headline || "부모님 안심케어");
  const body = safe(card?.body || "");
  const footer = safe(card?.footer || "parents-care.net");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="${bg}"/>
  <circle cx="880" cy="160" r="180" fill="rgba(255,255,255,0.12)"/>
  <circle cx="120" cy="900" r="220" fill="rgba(255,255,255,0.10)"/>
  <rect x="74" y="72" width="932" height="936" rx="48" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>
  <text x="100" y="150" fill="#dbeafe" font-size="34" font-family="Arial, sans-serif" font-weight="700">부모님 안심케어</text>
  <text x="100" y="380" fill="#ffffff" font-size="78" font-family="Arial, sans-serif" font-weight="800">
    <tspan x="100" dy="0">${headline}</tspan>
  </text>
  <foreignObject x="100" y="455" width="860" height="300">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial, sans-serif;color:white;font-size:48px;line-height:1.35;font-weight:700;word-break:keep-all;">
      ${body}
    </div>
  </foreignObject>
  <rect x="100" y="840" width="620" height="72" rx="36" fill="rgba(255,255,255,0.18)"/>
  <text x="136" y="888" fill="#ffffff" font-size="32" font-family="Arial, sans-serif" font-weight="700">${footer}</text>
  <text x="100" y="972" fill="#bfdbfe" font-size="28" font-family="Arial, sans-serif">parents-care.net</text>
</svg>`;
}
