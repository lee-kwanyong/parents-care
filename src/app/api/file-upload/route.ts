import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  buildStoragePath,
  inferCareFileKind,
  type CareFileModule
} from '@/lib/file-upload-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BUCKET_ID = 'care-files'
const MAX_FILE_SIZE = 10 * 1024 * 1024

const allowedModules = new Set([
  'assisted_intake',
  'care_passport',
  'documents',
  'medication',
  'receipt',
  'report',
  'manager_field',
  'discharge',
  'meal',
  'social_support',
  'manual'
])

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'text/plain'
])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function encodeStoragePath(path: string) {
  return path.split('/').map((part) => encodeURIComponent(part)).join('/')
}

function fileDownloadUrl(storagePath: string) {
  return '/api/file-upload?path=' + encodeURIComponent(storagePath)
}

function bufferToArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)
  const view = new Uint8Array(arrayBuffer)
  view.set(buffer)
  return arrayBuffer
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase service env is missing' }
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

async function uploadToStorage(input: {
  storagePath: string
  mimeType: string
  buffer: Buffer
}) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, error: 'Supabase service env is missing' }
  }

  const response = await fetch(
    base + '/storage/v1/object/' + BUCKET_ID + '/' + encodeStoragePath(input.storagePath),
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': input.mimeType,
        'Cache-Control': '3600',
        'x-upsert': 'false'
      },
      body: bufferToArrayBuffer(input.buffer)
    }
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return { ok: false, error: detail || 'Storage upload failed' }
  }

  return { ok: true, error: null }
}

async function downloadFromStorage(storagePath: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, response: null as Response | null, error: 'Supabase service env is missing' }
  }

  const response = await fetch(
    base + '/storage/v1/object/' + BUCKET_ID + '/' + encodeStoragePath(storagePath),
    {
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key
      }
    }
  )

  if (!response.ok) {
    return { ok: false, response: null, error: await response.text().catch(() => 'download failed') }
  }

  return { ok: true, response, error: null }
}

async function createFileRow(input: {
  elderName: string
  linkedModule: CareFileModule
  fileName: string
  fileLabel: string | null
  mimeType: string
  sizeBytes: number
  storagePath: string
  uploadedByRole: string
  uploadedByName: string | null
  uploadedByPhone: string | null
  memo: string | null
}) {
  return rest('care_storage_files', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: input.elderName,
        linked_module: input.linkedModule,
        file_kind: inferCareFileKind(input.mimeType),
        bucket_id: BUCKET_ID,
        storage_path: input.storagePath,
        file_name: input.fileName,
        file_label: input.fileLabel,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
        uploaded_by_role: input.uploadedByRole,
        uploaded_by_name: input.uploadedByName,
        uploaded_by_phone: input.uploadedByPhone,
        status: 'active',
        memo: input.memo
      }
    ])
  })
}

async function handleOneFile(input: {
  fileName: string
  mimeType: string
  sizeBytes: number
  buffer: Buffer
  elderName: string
  linkedModule: CareFileModule
  fileLabel: string | null
  uploadedByRole: string
  uploadedByName: string | null
  uploadedByPhone: string | null
  memo: string | null
}) {
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new Error(`${input.fileName}: 허용되지 않는 파일 형식입니다.`)
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_FILE_SIZE) {
    throw new Error(`${input.fileName}: 파일 크기는 10MB 이하만 가능합니다.`)
  }

  const uploadId = randomUUID()
  const storagePath = buildStoragePath({
    linkedModule: input.linkedModule,
    elderName: input.elderName,
    fileName: input.fileName,
    id: uploadId
  })

  const uploaded = await uploadToStorage({
    storagePath,
    mimeType: input.mimeType,
    buffer: input.buffer
  })

  if (!uploaded.ok) {
    throw new Error(`${input.fileName}: Storage 업로드 실패 - ${uploaded.error}`)
  }

  const inserted = await createFileRow({
    elderName: input.elderName,
    linkedModule: input.linkedModule,
    fileName: input.fileName,
    fileLabel: input.fileLabel,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storagePath,
    uploadedByRole: input.uploadedByRole,
    uploadedByName: input.uploadedByName,
    uploadedByPhone: input.uploadedByPhone,
    memo: input.memo
  })

  if (!inserted.ok) {
    throw new Error(`${input.fileName}: 파일 메타데이터 저장 실패`)
  }

  const file = Array.isArray(inserted.data) ? inserted.data[0] : inserted.data

  return {
    ...file,
    file_url: fileDownloadUrl(storagePath)
  }
}

export async function GET(request: NextRequest) {
  const storagePath = request.nextUrl.searchParams.get('path')

  if (storagePath) {
    const downloaded = await downloadFromStorage(storagePath)

    if (!downloaded.ok || !downloaded.response) {
      return NextResponse.json(
        {
          ok: false,
          message: '파일을 불러오지 못했습니다.',
          detail: downloaded.error
        },
        { status: 404 }
      )
    }

    const contentType = downloaded.response.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await downloaded.response.arrayBuffer()

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300'
      }
    })
  }

  const select = [
    'id',
    'elder_name',
    'linked_module',
    'linked_record_id',
    'file_kind',
    'bucket_id',
    'storage_path',
    'file_name',
    'file_label',
    'mime_type',
    'size_bytes',
    'uploaded_by_role',
    'uploaded_by_name',
    'uploaded_by_phone',
    'status',
    'memo',
    'created_at',
    'updated_at'
  ].join(',')

  const result = await rest(
    'care_storage_files?select=' + encodeURIComponent(select) + '&status=neq.deleted&order=created_at.desc&limit=100'
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '파일 목록을 불러오지 못했습니다. STEP28 SQL이 실행됐는지 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const files = Array.isArray(result.data) ? result.data : []

  return NextResponse.json({
    ok: true,
    files: files.map((file: any) => ({
      ...file,
      file_url: fileDownloadUrl(file.storage_path)
    }))
  })
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      const elderName = text(formData.get('elderName')) || '부모님'
      const moduleValue = text(formData.get('linkedModule')) || 'assisted_intake'
      const linkedModule: CareFileModule = allowedModules.has(moduleValue) ? (moduleValue as CareFileModule) : 'manual'
      const fileLabel = text(formData.get('fileLabel')) || null
      const uploadedByRole = text(formData.get('uploadedByRole')) || 'family'
      const uploadedByName = text(formData.get('uploadedByName')) || null
      const uploadedByPhone = text(formData.get('uploadedByPhone')) || null
      const memo = text(formData.get('memo')) || null

      const files = formData.getAll('files').filter((item): item is File => item instanceof File)

      if (files.length === 0) {
        return NextResponse.json({ ok: false, message: '업로드할 파일이 없습니다.' }, { status: 400 })
      }

      const uploaded = []

      for (const file of files.slice(0, 8)) {
        const arrayBuffer = await file.arrayBuffer()

        uploaded.push(
          await handleOneFile({
            fileName: file.name || 'file',
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            buffer: Buffer.from(arrayBuffer),
            elderName,
            linkedModule,
            fileLabel,
            uploadedByRole,
            uploadedByName,
            uploadedByPhone,
            memo
          })
        )
      }

      return NextResponse.json({
        ok: true,
        files: uploaded
      })
    }

    const body = await request.json().catch(() => ({}))
    const dataUrl = text(body.dataUrl)

    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return NextResponse.json({ ok: false, message: 'dataUrl 또는 multipart 파일이 필요합니다.' }, { status: 400 })
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

    if (!match) {
      return NextResponse.json({ ok: false, message: 'dataUrl 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')
    const moduleValue = text(body.linkedModule) || 'assisted_intake'
    const linkedModule: CareFileModule = allowedModules.has(moduleValue) ? (moduleValue as CareFileModule) : 'manual'

    const uploaded = await handleOneFile({
      fileName: text(body.fileName) || 'file',
      mimeType,
      sizeBytes: buffer.length,
      buffer,
      elderName: text(body.elderName) || '부모님',
      linkedModule,
      fileLabel: text(body.fileLabel) || null,
      uploadedByRole: text(body.uploadedByRole) || 'family',
      uploadedByName: text(body.uploadedByName) || null,
      uploadedByPhone: text(body.uploadedByPhone) || null,
      memo: text(body.memo) || null
    })

    return NextResponse.json({
      ok: true,
      files: [uploaded]
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
