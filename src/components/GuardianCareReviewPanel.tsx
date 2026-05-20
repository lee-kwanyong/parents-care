'use client'

import { FormEvent, useState } from 'react'

const reviewTags = [
  '시간 약속',
  '친절한 설명',
  '부모님 응대',
  '진행 공유',
  '리포트 만족',
  '다시 이용'
]

export function GuardianCareReviewPanel({
  reportId,
  assignmentId,
  managerName,
  elderName
}: {
  reportId?: string | null
  assignmentId?: string | null
  managerName?: string | null
  elderName?: string | null
}) {
  const [rating, setRating] = useState(5)
  const [tags, setTags] = useState<string[]>(['친절한 설명'])
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/care-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          assignmentId,
          managerName,
          elderName,
          rating,
          tags,
          comment
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '평가 저장 중 오류가 발생했습니다.')
      }

      setDone(true)
      setMessage('평가가 저장됐습니다. 케어파트너 신뢰카드에 반영됩니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '평가 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="mt-5 rounded-[1.5rem] bg-[#EAFBF6] p-5 text-[#2F756B] ring-1 ring-[#CBEAE4]">
        <div className="text-xl font-black">평가가 저장됐습니다.</div>
        <p className="mt-2 text-sm font-bold leading-6">
          보호자 평가가 쌓이면 케어파트너 신뢰카드에 반영됩니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-5 rounded-[1.5rem] bg-[#F8FCFB] p-5 ring-1 ring-[#E3EFEC]">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#2F756B] ring-1 ring-[#CBEAE4]">
          보호자 평가
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
          신뢰카드 반영
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-black">
        {managerName || '케어파트너'}님 케어는 어떠셨나요?
      </h3>

      <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
        {elderName || '부모님'} 안심케어 경험을 간단히 남겨주세요.
      </p>

      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={
              'h-11 w-11 rounded-2xl text-xl font-black ring-1 ' +
              (rating >= value
                ? 'bg-[#19B99A] text-white ring-[#19B99A]'
                : 'bg-white text-[#8AA29E] ring-[#DCEEEA]')
            }
          >
            ★
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {reviewTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={
              'rounded-full px-3 py-2 text-xs font-black ring-1 ' +
              (tags.includes(tag)
                ? 'bg-[#EAFBF6] text-[#2F756B] ring-[#CBEAE4]'
                : 'bg-white text-[#5B7774] ring-[#E2EFEC]')
            }
          >
            {tag}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        className="mt-4 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-[#19B99A]"
        placeholder="예: 어머니께 천천히 설명해주셔서 안심됐어요."
      />

      {message ? (
        <div className="mt-4 rounded-2xl bg-[#FFF5DF] p-4 text-sm font-black text-[#886B35]">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 w-full rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
      >
        {saving ? '저장 중...' : '평가 저장하기'}
      </button>
    </form>
  )
}
