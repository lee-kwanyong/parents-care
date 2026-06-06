import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type SubmissionInput = {
  projectTitle: string
  targetTrack: string
  targetRegion: string
  targetHouseholds: number
  pilotMonths: number
  requestedBudgetKrw: number
  createdByName: string
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  })

  const raw = await response.text()
  let parsed: unknown = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

function defaultInput(raw?: Partial<SubmissionInput>): SubmissionInput {
  return {
    projectTitle:
      raw?.projectTitle ||
      '안부지문 기반 고령자 생활리듬 변화감지 및 IoT 스마트 실버 케어 통합돌봄 플랫폼 개발·실증',
    targetTrack:
      raw?.targetTrack ||
      '스마트 사회서비스 시범사업형 + 지자체 지역사회 통합돌봄 실증형 R&D',
    targetRegion: raw?.targetRegion || '전남·경북 등 고령화 지수 상위 기초지자체',
    targetHouseholds: raw?.targetHouseholds || 100,
    pilotMonths: raw?.pilotMonths || 6,
    requestedBudgetKrw: raw?.requestedBudgetKrw || 100000000,
    createdByName: raw?.createdByName || '안부웍스'
  }
}

function formatWon(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

function markdownToHtml(md: string) {
  const lines = md.split('\n')
  const html: string[] = []
  let inTable = false

  function closeTable() {
    if (inTable) {
      html.push('</tbody></table>')
      inTable = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (!line.trim()) {
      closeTable()
      html.push('<p class="blank">&nbsp;</p>')
      continue
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())

      if (cells.every((cell) => /^[-: ]+$/.test(cell))) {
        continue
      }

      if (!inTable) {
        html.push('<table><tbody>')
        inTable = true
      }

      html.push(
        '<tr>' +
          cells.map((cell) => '<td>' + escapeHtml(cell).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</td>').join('') +
          '</tr>'
      )
      continue
    }

    closeTable()

    if (line.startsWith('# ')) {
      html.push('<h1>' + escapeHtml(line.replace(/^# /, '')) + '</h1>')
    } else if (line.startsWith('## ')) {
      html.push('<h2>' + escapeHtml(line.replace(/^## /, '')) + '</h2>')
    } else if (line.startsWith('### ')) {
      html.push('<h3>' + escapeHtml(line.replace(/^### /, '')) + '</h3>')
    } else if (line.startsWith('- ')) {
      html.push('<div class="bullet">• ' + escapeHtml(line.replace(/^- /, '')) + '</div>')
    } else if (/^\d+\.\s/.test(line)) {
      html.push('<div class="numbered">' + escapeHtml(line) + '</div>')
    } else {
      html.push('<p>' + escapeHtml(line).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</p>')
    }
  }

  closeTable()
  return html.join('\n')
}

function generateDocs(input: SubmissionInput) {
  const proposal = [
    '# ' + input.projectTitle,
    '',
    '## 1. 제안 개요',
    '',
    `본 제안은 ${input.targetRegion}을 대상으로 고령자의 식사·복약·몸 상태·도움 요청 선택 데이터와 스마트 복약통·UWB 비접촉 센서 이벤트를 통합하여, 가족·수행기관·지자체가 위험 신호를 함께 확인·조치·보고할 수 있는 ICT 기반 지역사회 통합돌봄 모니터링 플랫폼을 개발·실증하는 것을 목표로 한다.`,
    '',
    '## 2. 지원사업 적합 트랙',
    '',
    `- ${input.targetTrack}`,
    '- 지역사회 통합돌봄 모니터링',
    '- 노인맞춤돌봄 ICT 안전·안부확인 보조',
    '- 고독사 예방형 안부 모니터링',
    '- 스마트 복약관리 및 비접촉 IoT 실증',
    '',
    '## 3. 문제 정의',
    '',
    '- 전화·방문 중심 안부확인으로 인한 수행기관·지자체 업무 부담',
    '- 식사·복약·몸 상태 변화가 데이터로 축적되지 않는 문제',
    '- 가족·수행기관·지자체 간 조치 이력이 분산되는 문제',
    '- 영상·음성 기반 관제의 사생활 거부감',
    '- 지자체 성과보고와 사례관리 데이터 자동화 부족',
    '',
    '## 4. 핵심 솔루션',
    '',
    '- 부모님 PWA 안부 입력',
    '- 안부지문 기반 자녀·가족 리포트',
    '- 가족 실행 보드',
    '- 지자체 실증 운영실',
    '- 사례관리 기록',
    '- 스마트 복약통 개폐 이벤트 연동',
    '- UWB 비접촉 센서 이벤트 연동',
    '- 성과보고 및 감사로그',
    '',
    '## 5. 실증 규모',
    '',
    `- 실증 대상: ${input.targetHouseholds}가구`,
    `- 실증 기간: ${input.pilotMonths}개월`,
    `- 신청 예산: ${formatWon(input.requestedBudgetKrw)}`,
    '',
    '## 6. 단계별 고도화',
    '',
    '### 1단계: 소프트웨어 기반 안부지문 실증',
    '부모님 안부 입력, 자녀 리포트, 가족 실행 보드, 지자체 운영실을 통해 1차 실증을 수행한다.',
    '',
    '### 2단계: 스마트 복약통 연동',
    '복약 예정 시간과 약통 개폐 로그를 기반으로 복약 미확인 이벤트를 자동 감지한다.',
    '',
    '### 3단계: UWB 비접촉 관제',
    '고위험군 중심으로 재실·부재, 무활동, 낙상 의심, 호흡 저하 의심 이벤트를 검증한다.',
    '',
    '### 4단계: 성과보고·조달 연계',
    '월간 성과지표, 사례관리 기록, 감사로그를 기반으로 후속 R&D 및 조달 연계 가능성을 검토한다.',
    '',
    '## 7. 기대효과',
    '',
    '- 지자체·수행기관의 수작업 안부확인 부담 완화',
    '- 식사·복약·몸 상태 변화의 데이터화',
    '- 가족 참여형 확인 체계 구축',
    '- 위험 대상자 조기 선별',
    '- 실증 성과 기반 후속 지원사업·R&D·조달 연계 가능성 확보'
  ].join('\n')

  const pilot = [
    '# 지자체 실증 운영계획서',
    '',
    '## 1. 실증 목표',
    '',
    '고령자의 안부 선택 데이터와 IoT 이벤트를 활용하여 지자체가 대상자 상태를 모니터링하고, 가족·수행기관이 조치 이력을 남기는 운영 모델을 검증한다.',
    '',
    '## 2. 실증 대상',
    '',
    `- 총 대상: ${input.targetHouseholds}가구`,
    '- A그룹 고위험군: 약 30%',
    '- B그룹 일반관리군: 약 70%',
    '- 대상 유형: 독거노인, 고령부부, 퇴원 후 관리 필요자, 복약 관리 필요자',
    '',
    '## 3. 실증 기간',
    '',
    `- 총 ${input.pilotMonths}개월`,
    '- 1개월: 대상자 모집·동의·교육',
    '- 2~5개월: 서비스 운영 및 데이터 수집',
    '- 마지막 1개월: 성과 분석 및 보고서 작성',
    '',
    '## 4. 운영 흐름',
    '',
    '1. 대상자 등록',
    '2. 보호자·가족 연결',
    '3. 부모님 안부 입력',
    '4. 자녀 안부지문 리포트 확인',
    '5. 가족 실행 보드 처리',
    '6. 수행기관 사례관리',
    '7. 지자체 대시보드 모니터링',
    '8. 월간 성과보고',
    '',
    '## 5. IoT 적용',
    '',
    '- B그룹: 스마트 복약통 우선 적용',
    '- A그룹: UWB 비접촉 센서 우선 적용',
    '- 영상·음성 수집 배제',
    '- 물리 이벤트 데이터 중심 수집',
    '',
    '## 6. 실증 산출물',
    '',
    '- 대상자 등록 현황',
    '- 안부 응답률',
    '- 식사·복약 확인률',
    '- 위험 신호 발생 건수',
    '- 가족 실행 완료율',
    '- 사례관리 기록',
    '- 월간 성과보고서'
  ].join('\n')

  const kpi = [
    '# 성과지표 KPI 매트릭스',
    '',
    '| 구분 | 지표 | 산식 | 목표 |',
    '|---|---|---|---|',
    `| 참여 | 등록 대상자 수 | 등록 가구 수 | ${input.targetHouseholds}가구 |`,
    '| 참여 | 보호자 연결률 | 보호자 연결 대상 / 전체 대상 | 70% 이상 |',
    '| 참여 | 가족 초대율 | 가족 초대 대상 / 전체 대상 | 30% 이상 |',
    '| 안부 | 일평균 응답률 | 응답 대상 / 전체 대상 | 60% 이상 |',
    '| 식사 | 식사 확인률 | 완료 식사 슬롯 / 전체 식사 슬롯 | 60% 이상 |',
    '| 복약 | 복약 확인률 | 완료 복약 슬롯 / 전체 복약 슬롯 | 70% 이상 |',
    '| 위험 | 도움 요청 감지 | 도움 요청 이벤트 수 | 집계 |',
    '| 조치 | 가족 실행 완료율 | 완료 실행 / 전체 실행 | 50% 이상 |',
    '| 조치 | 사례관리 완료율 | 완료 사례 / 전체 사례 | 50% 이상 |',
    '| 운영 | 평균 확인 소요시간 | 위험 신호 발생 후 완료까지 | 단축 목표 |',
    '| 보고 | 월간 리포트 생성 | 월별 보고서 생성 여부 | 월 1회 |',
    '| 수용성 | 부모님 사용 편의성 | 설문 평균 | 4점 이상 / 5점 |',
    '| 수용성 | 보호자 안심감 | 설문 평균 | 4점 이상 / 5점 |'
  ].join('\n')

  const security = [
    '# 개인정보·보안·공공제안 체크리스트',
    '',
    '## 1. 개인정보 최소수집',
    '',
    '- 주민등록번호 수집 금지',
    '- 대상자 내부 ID 또는 가족코드 기반 운영',
    '- 휴대폰 번호는 본인 확인·초대 검증 목적',
    '- 민감정보 수집 시 별도 동의',
    '',
    '## 2. 동의 관리',
    '',
    '- 식사 기록 공유 동의',
    '- 복약 기록 공유 동의',
    '- 몸 상태 공유 동의',
    '- 도움 요청 공유 동의',
    '- 가족 공유 동의',
    '- 수행기관 공유 동의',
    '- 통계 활용 동의',
    '',
    '## 3. 접근권한',
    '',
    '- 지자체 관리자',
    '- 수행기관 관리자',
    '- 담당자',
    '- 보호자',
    '- 가족',
    '- 부모님',
    '',
    '## 4. 감사로그',
    '',
    '- 리포트 열람',
    '- 대상자 정보 수정',
    '- 사례관리 생성',
    '- 사례관리 완료',
    '- CSV/PDF 다운로드',
    '- 가족 초대',
    '- 연결 해제',
    '',
    '## 5. IoT 개인정보 원칙',
    '',
    '- 카메라 영상 수집 배제',
    '- 음성 수집 배제',
    '- 물리 이벤트 데이터 중심',
    '- 사생활 침해 가능성 최소화',
    '',
    '## 6. 공공 제안용 표현',
    '',
    '- 보장형 표현보다 목표·검증·연계 가능성 중심으로 작성',
    '- 오탐률, 응급연계, 조달연계는 실증 검증 항목으로 표현'
  ].join('\n')

  const email = [
    '# 지자체 제안 메일 초안',
    '',
    '제목: ICT 기반 고령자 안부확인·통합돌봄 모니터링 실증사업 제안드립니다',
    '',
    '안녕하세요.',
    '',
    '안부웍스 이관용입니다.',
    '',
    `저희는 ${input.targetRegion}의 고령자 돌봄 현장에서 활용할 수 있는 ICT 기반 안부확인 및 지역사회 통합돌봄 모니터링 플랫폼을 개발하고 있습니다.`,
    '',
    '현재 부모님 안부 입력, 자녀·가족 리포트, 가족 실행 보드, 지자체 운영실, 사례관리 기록, 성과보고 기능을 준비하고 있으며, 향후 스마트 복약통과 UWB 비접촉 센서 이벤트를 연동하여 고령자 생활리듬 변화감지 및 위험 신호 조기 확인 플랫폼으로 고도화하고자 합니다.',
    '',
    '제안드리는 실증 방향은 다음과 같습니다.',
    '',
    `- 실증 규모: ${input.targetHouseholds}가구`,
    `- 실증 기간: ${input.pilotMonths}개월`,
    '- 대상: 독거노인, 고령부부, 복약 관리 필요자, 퇴원 후 관리 필요자',
    '- 주요 기능: 안부 입력, 식사·복약 확인, 안부지문 리포트, 가족 실행 보드, 사례관리, 지자체 성과보고',
    '- 기대효과: 수작업 안부확인 부담 완화, 위험 대상자 조기 선별, 가족·수행기관 조치 이력 관리, 월간 성과보고 자동화',
    '',
    '귀 기관의 지역사회 통합돌봄, 노인맞춤돌봄, 고독사 예방, 스마트 사회서비스 실증 방향과 연계하여 논의드리고 싶습니다.',
    '',
    '검토 가능하시다면 간단한 미팅 일정을 부탁드립니다.',
    '',
    '감사합니다.',
    '',
    '이관용 드림',
    '안부웍스 AnbuWorks',
    'contact@parents-care.net',
    'https://parents-care.net'
  ].join('\n')

  const summary = [
    '안부웍스는 개인용 안부 앱이 아니라 지자체·수행기관·가족이 함께 사용하는 ICT 기반 지역사회 통합돌봄 안부 관제 플랫폼입니다.',
    '부모님 안부 입력, 안부지문 리포트, 가족 실행 보드, 지자체 운영실을 1단계로 실증하고, 스마트 복약통과 UWB 비접촉 센서 이벤트를 2~3단계 고도화로 연동합니다.'
  ].join('\n\n')

  return {
    proposal,
    pilot,
    kpi,
    security,
    email,
    summary
  }
}

function buildPrintHtml(input: SubmissionInput, docs: ReturnType<typeof generateDocs>) {
  const sections = [
    { title: 'R&D 제안서', content: docs.proposal },
    { title: '실증 운영계획서', content: docs.pilot },
    { title: 'KPI 매트릭스', content: docs.kpi },
    { title: '개인정보·보안 체크리스트', content: docs.security },
    { title: '지자체 제안 메일 초안', content: docs.email }
  ]

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(input.projectTitle)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f4fbf8;
    color: #173B36;
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
    line-height: 1.65;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    gap: 10px;
    justify-content: center;
    padding: 14px;
    background: rgba(255,255,255,0.94);
    border-bottom: 1px solid #D8EEE8;
  }
  .toolbar button {
    border: 0;
    border-radius: 999px;
    background: #247A71;
    color: white;
    font-weight: 900;
    padding: 12px 18px;
    cursor: pointer;
  }
  .toolbar a {
    border-radius: 999px;
    background: white;
    color: #173B36;
    font-weight: 900;
    padding: 12px 18px;
    text-decoration: none;
    border: 1px solid #D8EEE8;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 20px auto;
    padding: 24mm 18mm;
    background: white;
    border: 1px solid #D8EEE8;
    box-shadow: 0 18px 48px rgba(20,82,70,0.10);
    page-break-after: always;
  }
  .cover {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .badge {
    display: inline-flex;
    width: fit-content;
    border-radius: 999px;
    padding: 8px 14px;
    background: #E8FAF5;
    color: #11977F;
    font-weight: 900;
    font-size: 14px;
  }
  .cover h1 {
    margin: 32px 0 0;
    font-size: 38px;
    line-height: 1.22;
    letter-spacing: -0.06em;
  }
  .cover p {
    font-size: 17px;
    font-weight: 700;
    color: #637B76;
  }
  .meta {
    margin-top: 28px;
    display: grid;
    gap: 10px;
  }
  .meta div {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 14px 16px;
    border-radius: 16px;
    background: #F8FCFB;
    border: 1px solid #D8EEE8;
    font-weight: 800;
  }
  h1 {
    margin: 0 0 18px;
    font-size: 30px;
    line-height: 1.25;
    letter-spacing: -0.05em;
    page-break-after: avoid;
  }
  h2 {
    margin: 28px 0 10px;
    font-size: 21px;
    letter-spacing: -0.04em;
    page-break-after: avoid;
    color: #247A71;
  }
  h3 {
    margin: 20px 0 8px;
    font-size: 17px;
    page-break-after: avoid;
    color: #116D5F;
  }
  p, .bullet, .numbered {
    margin: 7px 0;
    font-size: 12.5px;
    font-weight: 650;
    color: #4E6D69;
    word-break: keep-all;
  }
  .bullet, .numbered {
    padding-left: 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    page-break-inside: avoid;
  }
  td {
    border: 1px solid #D8EEE8;
    padding: 8px;
    font-size: 11px;
    font-weight: 700;
    color: #4E6D69;
    vertical-align: top;
  }
  tr:first-child td {
    background: #E8FAF5;
    color: #173B36;
    font-weight: 900;
  }
  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #247A71;
    padding-bottom: 12px;
    margin-bottom: 18px;
  }
  .section-title .num {
    font-size: 12px;
    font-weight: 900;
    color: #11977F;
  }
  .blank { height: 2px; margin: 0; }
  .footer {
    margin-top: 36px;
    padding-top: 14px;
    border-top: 1px solid #D8EEE8;
    color: #7A9692;
    font-size: 11px;
    font-weight: 800;
  }
  @media print {
    body { background: white; }
    .toolbar { display: none; }
    .page {
      width: auto;
      min-height: auto;
      margin: 0;
      padding: 0;
      border: 0;
      box-shadow: none;
    }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">PDF로 저장 / 인쇄</button>
    <a href="/gov/submission">제출 패키지로 돌아가기</a>
  </div>

  <section class="page cover">
    <div>
      <div class="badge">안부웍스 · 지자체 지원사업 제출 패키지</div>
      <h1>${escapeHtml(input.projectTitle)}</h1>
      <p>
        부모님 안부 입력, 안부지문 리포트, 가족 실행 보드, 지자체 운영실,
        스마트 복약통·UWB 비접촉 관제 고도화를 위한 R&D·실증 제안 문서입니다.
      </p>

      <div class="meta">
        <div><span>지원 트랙</span><span>${escapeHtml(input.targetTrack)}</span></div>
        <div><span>대상 지역</span><span>${escapeHtml(input.targetRegion)}</span></div>
        <div><span>실증 규모</span><span>${input.targetHouseholds}가구</span></div>
        <div><span>실증 기간</span><span>${input.pilotMonths}개월</span></div>
        <div><span>신청 예산</span><span>${formatWon(input.requestedBudgetKrw)}</span></div>
        <div><span>작성</span><span>${escapeHtml(input.createdByName)}</span></div>
      </div>
    </div>

    <div class="footer">
      contact@parents-care.net · https://parents-care.net · AnbuWorks
    </div>
  </section>

  ${sections
    .map(
      (section, index) => `
  <section class="page">
    <div class="section-title">
      <h1>${escapeHtml(section.title)}</h1>
      <div class="num">${String(index + 1).padStart(2, '0')}</div>
    </div>
    ${markdownToHtml(section.content)}
    <div class="footer">안부웍스 · 지자체 지원사업 제출 패키지</div>
  </section>`
    )
    .join('\n')}
</body>
</html>`
}

async function insertAudit(input: {
  actorName: string
  actionType: string
  targetType: string
  description: string
  metadata?: Record<string, unknown>
}) {
  await rest('gov_audit_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        actor_name: input.actorName,
        actor_role: 'gov_admin',
        action_type: input.actionType,
        target_type: input.targetType,
        description: input.description,
        metadata: input.metadata || {}
      }
    ])
  })
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const format = text(url.searchParams.get('format'))
  const type = text(url.searchParams.get('type')) || 'proposal'

  const input = defaultInput({
    projectTitle: text(url.searchParams.get('projectTitle')) || undefined,
    targetTrack: text(url.searchParams.get('targetTrack')) || undefined,
    targetRegion: text(url.searchParams.get('targetRegion')) || undefined,
    targetHouseholds: numberValue(url.searchParams.get('targetHouseholds'), 100),
    pilotMonths: numberValue(url.searchParams.get('pilotMonths'), 6),
    requestedBudgetKrw: numberValue(url.searchParams.get('requestedBudgetKrw'), 100000000),
    createdByName: text(url.searchParams.get('createdByName')) || undefined
  })

  const docs = generateDocs(input)

  const docMap: Record<string, string> = {
    proposal: docs.proposal,
    pilot: docs.pilot,
    kpi: docs.kpi,
    security: docs.security,
    email: docs.email
  }

  if (format === 'html' || format === 'print') {
    return new NextResponse(buildPrintHtml(input, docs), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8'
      }
    })
  }

  if (format === 'markdown') {
    const content = docMap[type] || docs.proposal
    const filename =
      type === 'pilot'
        ? 'anbuworks-pilot-plan.md'
        : type === 'kpi'
          ? 'anbuworks-kpi-matrix.md'
          : type === 'security'
            ? 'anbuworks-security-checklist.md'
            : type === 'email'
              ? 'anbuworks-local-government-email.md'
              : 'anbuworks-gov-rnd-proposal.md'

    return new NextResponse('\ufeff' + content, {
      status: 200,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`
      }
    })
  }

  return NextResponse.json({
    ok: true,
    input,
    docs,
    checklist: [
      '지원사업 트랙 정의',
      '실증 대상 지자체·수행기관 후보 정리',
      '대상자 규모 100가구 MVP / 200~500가구 확장안 준비',
      '개인정보 동의 항목 정리',
      '성과지표 KPI 확정',
      '안전한 공공 제안용 표현으로 보정',
      '지자체 제안 메일 발송',
      '미팅 후 실증 협약 구조 검토',
      '인쇄본/PDF 제출본 생성'
    ],
    safeWording: [
      {
        before: '오탐률 2% 미만 보장',
        after: '오탐률 2% 미만을 목표로 실증 데이터 기반 검증'
      },
      {
        before: '원클릭 119 연계',
        after: '응급안전망·119 연계 가능 구조 검토'
      },
      {
        before: '무경쟁 수의계약 확보',
        after: '실증 성과 기반 조달·혁신제품·디지털서비스 등록 가능성 검토'
      },
      {
        before: '데이터 유실 가능성 0%',
        after: '백업 이중화와 접속기록 보관을 통한 데이터 유실 최소화 설계'
      }
    ]
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const input = defaultInput({
    projectTitle: text(body.projectTitle) || undefined,
    targetTrack: text(body.targetTrack) || undefined,
    targetRegion: text(body.targetRegion) || undefined,
    targetHouseholds: numberValue(body.targetHouseholds, 100),
    pilotMonths: numberValue(body.pilotMonths, 6),
    requestedBudgetKrw: numberValue(body.requestedBudgetKrw, 100000000),
    createdByName: text(body.createdByName) || undefined
  })

  const docs = generateDocs(input)

  const payload = {
    package_type: 'gov_rnd_submission_v1',
    project_title: input.projectTitle,
    target_track: input.targetTrack,
    target_region: input.targetRegion,
    target_households: input.targetHouseholds,
    pilot_months: input.pilotMonths,
    requested_budget_krw: input.requestedBudgetKrw,
    summary: docs.summary,
    proposal_md: docs.proposal,
    pilot_plan_md: docs.pilot,
    kpi_md: docs.kpi,
    security_md: docs.security,
    email_md: docs.email,
    status: text(body.status) || 'draft',
    created_by_name: input.createdByName,
    metadata: {
      input,
      source: 'gov-submission-package-api'
    },
    updated_at: new Date().toISOString()
  }

  const result = await rest('gov_submission_packages', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '제출 패키지를 저장하지 못했습니다. Supabase SQL을 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  await insertAudit({
    actorName: input.createdByName,
    actionType: 'create',
    targetType: 'gov_submission_package',
    description: `지자체 제출 패키지 생성: ${input.projectTitle}`,
    metadata: {
      targetRegion: input.targetRegion,
      targetHouseholds: input.targetHouseholds
    }
  })

  return NextResponse.json({
    ok: true,
    message: '지자체 제출 패키지가 저장되었습니다.',
    package: Array.isArray(result.data) ? result.data[0] : result.data,
    docs
  })
}
