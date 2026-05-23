"use client";

import { useEffect, useMemo, useState } from "react";

type Job = {
  id: string;
  channel: string;
  title: string;
  body: string;
  tags?: string[];
  image_urls?: string[];
  video_brief?: any;
  status: string;
  manual_reason?: string | null;
  external_url?: string | null;
  error_message?: string | null;
  created_at?: string;
};

const channelLabels: Record<string, string> = {
  naver_blog: "네이버 블로그",
  naver_cafe: "네이버 카페",
  naver_kin: "지식iN",
  youtube: "YouTube Shorts",
  tiktok: "TikTok",
  instagram: "Instagram/Reels",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  wordpress: "WordPress",
};

function copy(text: string) {
  navigator.clipboard.writeText(text || "");
}

function naverWriteUrl(channel: string) {
  if (channel === "naver_blog") return "https://blog.naver.com/PostWriteForm.naver";
  if (channel === "naver_cafe") return "https://section.cafe.naver.com/";
  if (channel === "naver_kin") return "https://kin.naver.com/";
  return "";
}

export default function PublishAdminPage() {
  const [key, setKey] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState("준비 중...");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("key") || "";
    setKey(k);
    if (!k) {
      setStatus("URL에 key가 없습니다.");
      return;
    }
    void loadJobs(k);
  }, []);

  const grouped = useMemo(() => {
    const obj: Record<string, Job[]> = {};
    for (const job of jobs) {
      obj[job.channel] ||= [];
      obj[job.channel].push(job);
    }
    return obj;
  }, [jobs]);

  function withKey(path: string, k = key) {
    return `${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(k)}`;
  }

  async function api(path: string, options?: RequestInit, k = key) {
    const res = await fetch(withKey(path, k), options);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.detail || "요청 실패");
    return json;
  }

  async function createQueue() {
    setBusy(true);
    try {
      setStatus("발행 큐 생성 중...");
      const r = await api("/api/publish/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setStatus(`발행 큐 생성 완료: ${r.created || 0}건`);
      await loadJobs();
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadJobs(k = key) {
    setBusy(true);
    try {
      const r = await api(`/api/publish/jobs?status=${encodeURIComponent(filter)}`, undefined, k);
      setJobs(r.jobs || []);
      setStatus(`작업 ${r.jobs?.length || 0}건`);
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function runJob(id: string) {
    setBusy(true);
    try {
      const r = await api("/api/publish/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: id }),
      });
      setStatus(`처리 결과: ${r.status} · ${r.detail || ""}`);
      await loadJobs();
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  function buildNaverBody(job: Job) {
    const tags = (job.tags || []).map((t) => `#${t.replace(/^#/, "")}`).join(" ");
    const images = (job.image_urls || []).map((url) => `[이미지 삽입] ${url}`).join("\n");
    return `${job.body}\n\n${images ? images + "\n\n" : ""}${tags}`;
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>채널 발행 센터</h1>
      <p style={{ color: "#555", lineHeight: 1.6 }}>
        네이버는 자동 로그인/자동 게시가 아니라 게시 패키지 복사 방식으로 운영합니다.
        YouTube, TikTok, Instagram, Facebook, LinkedIn, WordPress는 Webhook/OAuth 연결 후 자동 발행할 수 있습니다.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={createQueue} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8, background: "#111", color: "#fff" }}>
          마케팅 패키지를 발행 큐로 변환
        </button>
        <button onClick={() => loadJobs()} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8 }}>
          새로고침
        </button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8 }}>
          <option value="all">전체</option>
          <option value="ready_manual">네이버 수동 게시 준비</option>
          <option value="draft">자동 발행 대기</option>
          <option value="sent_dry_run">DRY RUN</option>
          <option value="published">게시 완료</option>
          <option value="failed">실패</option>
        </select>
      </div>

      <div style={{ background: "#f3f4f6", padding: 12, borderRadius: 10, fontWeight: 700, marginBottom: 20 }}>
        {status}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p>작업이 없습니다. 먼저 /admin/naver에서 방대한 마케팅 패키지를 생성한 뒤 큐로 변환하세요.</p>
      ) : (
        Object.entries(grouped).map(([channel, list]) => (
          <section key={channel} style={{ marginBottom: 32 }}>
            <h2>{channelLabels[channel] || channel}</h2>
            {list.map((job) => {
              const isNaver = ["naver_blog", "naver_cafe", "naver_kin"].includes(job.channel);
              const openUrl = naverWriteUrl(job.channel);
              return (
                <article key={job.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ color: "#666", marginBottom: 6 }}>
                    상태: <b>{job.status}</b>
                    {job.manual_reason ? ` · ${job.manual_reason}` : ""}
                  </div>
                  <h3>{job.title}</h3>
                  <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 12, borderRadius: 8, maxHeight: 240, overflow: "auto" }}>
                    {job.body}
                  </pre>

                  {job.image_urls && job.image_urls.length > 0 ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
                      {job.image_urls.map((url, idx) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                          이미지 {idx + 1}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => copy(job.title)}>제목 복사</button>
                    <button onClick={() => copy(isNaver ? buildNaverBody(job) : job.body)}>본문 복사</button>
                    <button onClick={() => copy((job.tags || []).map((t) => `#${t.replace(/^#/, "")}`).join(" "))}>태그 복사</button>
                    {openUrl ? (
                      <a href={openUrl} target="_blank" rel="noreferrer">
                        <button>네이버 작성 화면 열기</button>
                      </a>
                    ) : (
                      <button onClick={() => runJob(job.id)}>공식 채널 발행 시도</button>
                    )}
                  </div>

                  {job.external_url ? (
                    <p><a href={job.external_url} target="_blank" rel="noreferrer">게시 URL 보기</a></p>
                  ) : null}
                  {job.error_message ? <p style={{ color: "crimson" }}>{job.error_message}</p> : null}
                </article>
              );
            })}
          </section>
        ))
      )}
    </main>
  );
}
