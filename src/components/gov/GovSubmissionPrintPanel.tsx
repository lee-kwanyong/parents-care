'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Docs = {
  proposal: string
  pilot: string
  kpi: string
  security: string
  email: string
  summary: string
}

type ApiData = {
  input: {
    projectTitle: string
    targetTrack: string
    targetRegion: string
    targetHouseholds: number
    pilotMonths: number
    requestedBudgetKrw: number
    createdByName: string
  }
  docs: Docs
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

      if (cells.every((cell) => /^[-: ]+$/.test(cell))) continue

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

function formatWon(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

export function GovSubmissionPrintPanel() {
  const [data, setData] = useState<ApiData | null>(null)
  const [message, setMessage] = useState('')

  const query = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.search.replace(/^\?/, '')
  }, [])

  async function load() {
    try {
      const response = await fetch('/api/gov-submission?' + query, { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        setMessage(json.message || '제출 패키지를 불러오지 못했습니다.')
        return
      }

      setData(json)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '제출 패키지를 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sections = data
    ? [
        { title: 'R&D 제안서', content: data.docs.proposal },
        { title: '실증 운영계획서', content: data.docs.pilot },
        { title: 'KPI 매트릭스', content: data.docs.kpi },
        { title: '개인정보·보안 체크리스트', content: data.docs.security },
        { title: '지자체 제안 메일 초안', content: data.docs.email }
      ]
    : []

  return (
    <>
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        body { background: #f4fbf8; }
        .print-toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          padding: 14px;
          background: rgba(255,255,255,0.95);
          border-bottom: 1px solid #D8EEE8;
        }
        .print-toolbar button,
        .print-toolbar a {
          border-radius: 999px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
        }
        .print-toolbar button {
          border: 0;
          background: #247A71;
          color: white;
        }
        .print-toolbar a {
          background: white;
          color: #173B36;
          border: 1px solid #D8EEE8;
        }
        .print-page {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          padding: 24mm 18mm;
          background: white;
          border: 1px solid #D8EEE8;
          box-shadow: 0 18px 48px rgba(20,82,70,0.10);
          color: #173B36;
          font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
          line-height: 1.65;
          page-break-after: always;
        }
        .print-page.cover {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .badge {
          display: inline-flex;
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
        .print-content h1 {
          margin: 0 0 18px;
          font-size: 30px;
          line-height: 1.25;
          letter-spacing: -0.05em;
          page-break-after: avoid;
        }
        .print-content h2 {
          margin: 28px 0 10px;
          font-size: 21px;
          letter-spacing: -0.04em;
          page-break-after: avoid;
          color: #247A71;
        }
        .print-content h3 {
          margin: 20px 0 8px;
          font-size: 17px;
          page-break-after: avoid;
          color: #116D5F;
        }
        .print-content p,
        .print-content .bullet,
        .print-content .numbered {
          margin: 7px 0;
          font-size: 12.5px;
          font-weight: 650;
          color: #4E6D69;
          word-break: keep-all;
        }
        .print-content .bullet,
        .print-content .numbered {
          padding-left: 10px;
        }
        .print-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          page-break-inside: avoid;
        }
        .print-content td {
          border: 1px solid #D8EEE8;
          padding: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #4E6D69;
          vertical-align: top;
        }
        .print-content tr:first-child td {
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
          .print-toolbar { display: none; }
          .site-header, header { display: none !important; }
          .print-page {
            width: auto;
            min-height: auto;
            margin: 0;
            padding: 0;
            border: 0;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="print-toolbar">
        <button onClick={() => window.print()}>PDF로 저장 / 인쇄</button>
        <Link href="/gov/submission">제출 패키지로 돌아가기</Link>
        <a href={'/api/gov-submission?format=html&' + query} target="_blank" rel="noreferrer">
          HTML 제출본 열기
        </a>
      </div>

      {message ? (
        <main className="print-page">
          <div className="badge">오류</div>
          <h1>{message}</h1>
        </main>
      ) : null}

      {data ? (
        <>
          <section className="print-page cover">
            <div>
              <div className="badge">안부웍스 · 지자체 지원사업 제출 패키지</div>
              <h1>{data.input.projectTitle}</h1>
              <p>
                부모님 안부 입력, 안부지문 리포트, 가족 실행 보드, 지자체 운영실,
                스마트 복약통·UWB 비접촉 관제 고도화를 위한 R&D·실증 제안 문서입니다.
              </p>

              <div className="meta">
                <div><span>지원 트랙</span><span>{data.input.targetTrack}</span></div>
                <div><span>대상 지역</span><span>{data.input.targetRegion}</span></div>
                <div><span>실증 규모</span><span>{data.input.targetHouseholds}가구</span></div>
                <div><span>실증 기간</span><span>{data.input.pilotMonths}개월</span></div>
                <div><span>신청 예산</span><span>{formatWon(data.input.requestedBudgetKrw)}</span></div>
                <div><span>작성</span><span>{data.input.createdByName}</span></div>
              </div>
            </div>

            <div className="footer">
              contact@parents-care.net · https://parents-care.net · AnbuWorks
            </div>
          </section>

          {sections.map((section, index) => (
            <section key={section.title} className="print-page">
              <div className="section-title">
                <h1>{section.title}</h1>
                <div className="num">{String(index + 1).padStart(2, '0')}</div>
              </div>

              <div
                className="print-content"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
              />

              <div className="footer">안부웍스 · 지자체 지원사업 제출 패키지</div>
            </section>
          ))}
        </>
      ) : (
        <main className="print-page">
          <div className="badge">불러오는 중</div>
          <h1>제출 패키지를 준비하고 있습니다.</h1>
        </main>
      )}
    </>
  )
}

export default GovSubmissionPrintPanel
