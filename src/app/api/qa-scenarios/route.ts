import { NextRequest, NextResponse } from 'next/server'
import type { QARunStatus, QAStepResultStatus } from '@/lib/qa-scenario-engine'

export const dynamic = 'force-dynamic'

const allowedRunStatuses = new Set(['not_started', 'running', 'passed', 'failed', 'blocked', 'needs_fix'])
const allowedStepStatuses = new Set(['pending', 'passed', 'failed', 'blocked', 'skipped'])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

export async function GET() {
  const scenarioSelect = [
    'id',
    'scenario_code',
    'title',
    'description',
    'scenario_type',
    'target_user',
    'priority',
    'status',
    'expected_outcome',
    'pass_criteria',
    'created_at',
    'updated_at'
  ].join(',')

  const stepSelect = [
    'id',
    'scenario_id',
    'step_order',
    'actor',
    'screen_path',
    'action_label',
    'expected_result',
    'is_required',
    'created_at'
  ].join(',')

  const runSelect = [
    'id',
    'scenario_id',
    'run_label',
    'environment',
    'tester_name',
    'run_status',
    'summary',
    'issue_count',
    'started_at',
    'completed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const resultSelect = [
    'id',
    'qa_run_id',
    'qa_step_id',
    'result_status',
    'actual_result',
    'issue_note',
    'checked_at',
    'created_at',
    'updated_at'
  ].join(',')

  const [scenarios, steps, runs, results] = await Promise.all([
    rest('care_qa_scenarios?select=' + encodeURIComponent(scenarioSelect) + '&status=eq.active&order=created_at.asc&limit=200'),
    rest('care_qa_steps?select=' + encodeURIComponent(stepSelect) + '&order=step_order.asc&limit=1000'),
    rest('care_qa_runs?select=' + encodeURIComponent(runSelect) + '&order=created_at.desc&limit=300'),
    rest('care_qa_step_results?select=' + encodeURIComponent(resultSelect) + '&order=created_at.desc&limit=1000')
  ])

  if (!scenarios.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: 'QA 시나리오를 불러오지 못했습니다. QA SQL이 실행됐는지 확인해주세요.',
        detail: scenarios.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    scenarios: Array.isArray(scenarios.data) ? scenarios.data : [],
    steps: steps.ok && Array.isArray(steps.data) ? steps.data : [],
    runs: runs.ok && Array.isArray(runs.data) ? runs.data : [],
    results: results.ok && Array.isArray(results.data) ? results.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'start_run'

  if (action === 'start_run') {
    const scenarioId = text(body.scenarioId)

    if (!scenarioId) {
      return NextResponse.json({ ok: false, message: 'scenarioId가 필요합니다.' }, { status: 400 })
    }

    const runInsert = await rest('care_qa_runs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          scenario_id: scenarioId,
          run_label: text(body.runLabel) || `QA Run ${new Date().toLocaleString('ko-KR')}`,
          environment: text(body.environment) || 'local',
          tester_name: text(body.testerName) || null,
          run_status: 'running',
          started_at: new Date().toISOString()
        }
      ])
    })

    if (!runInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'QA Run 생성 중 오류가 발생했습니다.',
          detail: runInsert.error
        },
        { status: 500 }
      )
    }

    const run = Array.isArray(runInsert.data) ? runInsert.data[0] : null

    const steps = await rest(
      'care_qa_steps?select=' + encodeURIComponent('id') + '&scenario_id=eq.' + encodeURIComponent(scenarioId) + '&order=step_order.asc'
    )

    if (run?.id && steps.ok && Array.isArray(steps.data) && steps.data.length > 0) {
      const resultRows = steps.data.map((step: any) => ({
        qa_run_id: run.id,
        qa_step_id: step.id,
        result_status: 'pending'
      }))

      await rest('care_qa_step_results?on_conflict=qa_run_id,qa_step_id', {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
        body: JSON.stringify(resultRows)
      })
    }

    return NextResponse.json({
      ok: true,
      run
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const kind = text(body.kind)
  const id = text(body.id)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'run') {
    const statusValue = text(body.status)

    if (!allowedRunStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'run status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as QARunStatus

    const patch: Record<string, unknown> = {
      run_status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'passed' || status === 'failed' || status === 'blocked' || status === 'needs_fix') {
      patch.completed_at = new Date().toISOString()
    }

    if (text(body.summary)) {
      patch.summary = text(body.summary)
    }

    const result = await rest('care_qa_runs?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'QA Run 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (kind === 'step_result') {
    const statusValue = text(body.status)

    if (!allowedStepStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'step result status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as QAStepResultStatus

    const patch: Record<string, unknown> = {
      result_status: status,
      checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (text(body.actualResult)) patch.actual_result = text(body.actualResult)
    if (text(body.issueNote)) patch.issue_note = text(body.issueNote)

    const result = await rest('care_qa_step_results?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'QA Step 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  return NextResponse.json({ ok: false, message: 'kind가 올바르지 않습니다.' }, { status: 400 })
}
