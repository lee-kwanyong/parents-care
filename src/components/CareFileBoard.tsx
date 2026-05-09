'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import {
  careFileModuleOptions,
  formatFileSize,
  labelCareFileModule,
  type CareStorageFile
} from '@/lib/file-upload-engine'

type CareStorageFileWithUrl = CareStorageFile & {
  file_url?: string
}

export function CareFileBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [files, setFiles] = useState<CareStorageFileWithUrl[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/file-upload', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '파일 목록을 불러오지 못했습니다.')
      }

      setFiles(data.files || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '파일 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(event.target.files || []).slice(0, 8))
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedFiles.length === 0) {
      setMessage('업로드할 파일을 선택해주세요.')
      return
    }

    const formData = new FormData(event.currentTarget)
    selectedFiles.forEach((file) => formData.append('files', file))

    setUploading(true)
    setMessage('')

    try {
      const response = await fetch('/api/file-upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '파일 업로드 실패')
      }

      setMessage(`파일 ${data.files?.length || 0}개가 업로드됐습니다.`)
      setSelectedFiles([])
      event.currentTarget.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '파일 업로드 실패')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">파일 업로드</h2>
        <p className="mt-2 text-sm leading-6 text-[#63807C]">
          약 봉투, 영수증, 처방전, 예약 문자 캡처, 검사결과지를 Supabase Storage에 저장합니다.
        </p>

        <form onSubmit={upload} className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              name="elderName"
              className="rounded-2xl border border-[#E0EFEC] p-4"
              placeholder="부모님"
              defaultValue="어머니"
            />

            <input
              name="uploadedByName"
              className="rounded-2xl border border-[#E0EFEC] p-4"
              placeholder="업로드한 사람"
            />

            <input
              name="uploadedByPhone"
              className="rounded-2xl border border-[#E0EFEC] p-4"
              placeholder="010-1234-5678"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select name="linkedModule" className="rounded-2xl border border-[#E0EFEC] p-4">
              {careFileModuleOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>

            <select name="uploadedByRole" className="rounded-2xl border border-[#E0EFEC] p-4">
              <option value="family">가족</option>
              <option value="ops">운영실</option>
              <option value="manager">매니저</option>
            </select>

            <input
              name="fileLabel"
              className="rounded-2xl border border-[#E0EFEC] p-4"
              placeholder="예: 약 봉투 사진"
            />
          </div>

          <input
            type="file"
            multiple
            accept="image/*,.pdf,.txt"
            onChange={onFileChange}
            className="block w-full rounded-2xl border border-dashed border-[#D6EAE7] bg-slate-50 p-5"
          />

          {selectedFiles.length > 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="font-black">선택된 파일</div>
              <div className="mt-2 space-y-1">
                {selectedFiles.map((file) => (
                  <p key={`${file.name}-${file.size}`} className="text-sm text-[#63807C]">
                    • {file.name} · {formatFileSize(file.size)}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <textarea
            name="memo"
            rows={3}
            className="w-full rounded-2xl border border-[#E0EFEC] p-4"
            placeholder="메모. 예: 정형외과 진료 후 받은 처방전입니다."
          />

          <button
            disabled={uploading}
            className="w-full rounded-3xl bg-[#8CCFC3] px-6 py-5 text-xl font-black text-[#2E504D] disabled:opacity-50"
          >
            {uploading ? '업로드 중...' : '파일 업로드'}
          </button>
        </form>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8 space-y-4">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            파일 목록을 불러오는 중...
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 업로드된 파일이 없습니다.</div>
          </div>
        ) : (
          files.map((file) => (
            <article key={file.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge text={labelCareFileModule(file.linked_module)} />
                    <Badge text={file.file_kind} />
                    <Badge text={file.status} />
                    <Badge text={formatFileSize(file.size_bytes)} />
                  </div>

                  <h3 className="mt-3 text-2xl font-black">{file.file_label || file.file_name}</h3>
                  <p className="mt-2 text-sm text-[#63807C]">
                    {file.elder_name} · {file.mime_type} · {new Date(file.created_at).toLocaleString('ko-KR')}
                  </p>

                  {file.memo ? (
                    <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-[#4E6D69]">
                      {file.memo}
                    </p>
                  ) : null}

                  {file.mime_type.startsWith('image/') && file.file_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.file_url}
                      alt={file.file_label || file.file_name}
                      className="mt-4 max-h-64 rounded-2xl object-contain"
                    />
                  ) : null}
                </div>

                <div className="grid min-w-[170px] gap-2">
                  {file.file_url ? (
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-[#5F7C92] px-4 py-3 text-center font-black text-[#2E504D]"
                    >
                      파일 열기
                    </a>
                  ) : null}

                  {mode === 'ops' ? (
                    <span className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black">
                      운영실 확인
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}
