'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import { AssistedIntakeBoard } from '@/components/AssistedIntakeBoard'
import { assistedIntakeChannels, type AssistedIntakeAssetInput, type AssistedIntakeChannel } from '@/lib/assisted-intake-engine'
import { formatFileSize } from '@/lib/file-upload-engine'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

export default function CareIntakePage() {
  const [elderName, setElderName] = useState('어머니')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [channel, setChannel] = useState<AssistedIntakeChannel>('photo')
  const [rawText, setRawText] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [socialCareRequested, setSocialCareRequested] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(event.target.files || []).slice(0, 8))
  }

  async function uploadFiles() {
    if (selectedFiles.length === 0) return []

    const formData = new FormData()
    formData.set('elderName', elderName)
    formData.set('uploadedByName', contactName)
    formData.set('uploadedByPhone', contactPhone)
    formData.set('uploadedByRole', 'family')
    formData.set('linkedModule', 'assisted_intake')
    formData.set('fileLabel', '사진·카톡 간편 접수 첨부')
    formData.set('memo', rawText)

    selectedFiles.forEach((file) => {
      formData.append('files', file)
    })

    const response = await fetch('/api/file-upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      throw new Error(data.message || '파일 업로드 중 오류가 발생했습니다.')
    }

    return data.files || []
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const uploadedFiles = await uploadFiles()

      const assets: AssistedIntakeAssetInput[] = uploadedFiles.map((file: any) => ({
        assetKind: file.file_kind === 'document' ? 'document' : file.file_kind === 'image' ? 'image' : 'other',
        fileName: file.file_name,
        mimeType: file.mime_type,
        sizeBytes: file.size_bytes,
        storagePath: file.storage_path,
        storageFileId: file.id,
        fileUrl: file.file_url,
        dataUrl: null
      }))

      const response = await fetch('/api/assisted-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_request',
          elderName,
          contactName,
          contactPhone,
          channel,
          rawText,
          assets,
          socialCareRequested
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '간편 접수 중 오류가 발생했습니다.')
      }

      setMessage('사진·카톡·문자 간편 접수가 완료됐습니다. 운영실이 케어 요청으로 정리합니다.')
      setRawText('')
      setSelectedFiles([])
      event.currentTarget.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '간편 접수 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="사진·카톡으로 맡기기" subtitle="길게 입력하지 않아도 됩니다">
      <SectionHeader
        eyebrow="간편 접수"
        title={
          <>
            사진 한 장이면
            <br />
            시작할 수 있어요.
          </>
        }
        description="병원 예약 문자, 카톡 내용, 약 봉투, 영수증, 처방전 사진만 올려도 운영실이 부모님 걱정을 정리합니다."
        actions={
          <CareButton href="/care-request" tone="soft">
            걱정 선택으로 돌아가기
          </CareButton>
        }
      />

      <form onSubmit={submit} className="mt-8 space-y-6">
        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="1단계" tone="green" />
            <StatusPill text="맡기는 방식" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">어떤 방식이 편하세요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {assistedIntakeChannels.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setChannel(option.code)}
                className={
                  'rounded-3xl border p-5 text-left transition ' +
                  (channel === option.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0EFEC] bg-slate-50 hover:bg-white')
                }
              >
                <div className="text-xl font-black">{option.label}</div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">{option.description}</p>
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="2단계" tone="green" />
            <StatusPill text="사진 또는 내용" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">사진이나 내용을 올려주세요</h2>

          <label className="mt-5 block rounded-[2rem] border-2 border-dashed border-[#D6EAE7] bg-slate-50 p-6">
            <span className="block text-2xl font-black">사진·파일 선택</span>
            <span className="mt-2 block text-sm font-bold leading-6 text-[#63807C]">
              예약증, 약 봉투, 영수증, 처방전, 카톡 캡처를 올릴 수 있습니다.
            </span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.txt"
              onChange={onFilesChange}
              className="mt-5 block w-full rounded-2xl bg-white p-4 font-bold"
            />
          </label>

          {selectedFiles.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {selectedFiles.map((file) => (
                <div key={`${file.name}-${file.size}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-black">{file.name}</div>
                  <p className="mt-1 text-xs font-bold text-[#7A9692]">
                    {file.type || '형식 미확인'} · {formatFileSize(file.size)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-[#4E6D69]">카톡·문자 내용 붙여넣기</span>
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
              placeholder="예: [서울OO병원] 5월 10일 오전 10시 정형외과 예약. 진료 후 영수증과 처방전 필요. 어머니가 무릎이 아프세요."
            />
          </label>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="3단계" tone="green" />
            <StatusPill text="연락 정보" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">연락받을 정보를 남겨주세요</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">부모님</span>
              <input
                value={elderName}
                onChange={(event) => setElderName(event.target.value)}
                className="tap-target w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">보호자 이름</span>
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                className="tap-target w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                placeholder="예: 홍길동"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">연락처</span>
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="tap-target w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                placeholder="010-1234-5678"
              />
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={socialCareRequested}
              onChange={(event) => setSocialCareRequested(event.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span className="text-sm font-bold leading-6 text-[#4E6D69]">
              비용 부담이 있으면 공공지원·후원 쿠폰·지역 복지 연결도 함께 안내받고 싶습니다.
            </span>
          </label>
        </CareCard>

        {message ? (
          <CareCard tone="green">
            <p className="text-lg font-black">{message}</p>
          </CareCard>
        ) : null}

        <CareButton
          type="submit"
          disabled={saving || (!rawText.trim() && selectedFiles.length === 0)}
          size="xl"
          className="md:w-full"
        >
          {saving ? '접수 중...' : '사진·카톡으로 부모님 걱정 맡기기'}
        </CareButton>
      </form>

      <section className="mt-10">
        <AssistedIntakeBoard mode="family" />
      </section>
    </AppFrame>
  )
}
