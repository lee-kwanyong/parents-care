"use client";

import { useEffect, useState } from "react";

type Job = {
  id: string;
  channel: string;
  status: string;
  external_url?: string | null;
  error_message?: string | null;
};

type Campaign = {
  id: string;
  campaign_date: string;
  slot: number;
  keyword: string;
  title: string;
  long_body: string;
  cards: any[];
  video_script: any;
  status: string;
  video_status: string;
  video_url?: string | null;
  auto_marketing_publish_jobs?: Job[];
};

export default function AutoLoopPage() {
  const [key, setKey] = useState("");
  const [items, setItems] = useState<Campaign[]>([]);
  const [status, setStatus] = useState("준비 중");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const k = new URLSearchParams(location.search).get("key") || "";
    setKey(k);
    if (k) void load(k);
    else setStatus("key가 없습니다.");
  }, []);

  function withKey(path: string, k = key) {
    return `${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(k)}`;
  }

  async function api(path: string, options?: RequestInit, k = key) {
    const res = await fetch(withKey(path, k), options);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.detail || "요청 실패");
    return json;
  }

  async function runLoop() {
    setBusy(true);
    try {
      setStatus("자동루프 실행 중: 캠페인 생성 → 큐 생성 → 승인된 작업 게시 시도");
      const r = await api("/api/autoloop/run", { method: "POST" });
      setStatus(`자동루프 완료: 캠페인 ${r.campaigns}, 승인 ${r.approved}, 큐 ${r.jobs}`);
      await load();
    } catch (e) {
      setStatus(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function load(k = key) {
    setBusy(true);
    try {
      const r = await api("/api/autoloop/list", undefined, k);
      setItems(r.campaigns || []);
      setStatus(`캠페인 ${r.campaigns?.length || 0}개`);
    } catch (e) {
      setStatus(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    setBusy(true);
    try {
      await api("/api/autoloop/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setStatus("승인 완료. 자동루프 실행을 누르면 영상 생성/게시를 시도합니다.");
      await load();
    } catch (e) {
      setStatus(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Parents Care 자동마케팅 루프</h1>
      <p style={{ color: "#555", lineHeight: 1.6 }}>
        매일 캠페인 5개 생성 → 승인된 캠페인 영상 렌더링 → YouTube/TikTok/Instagram/LinkedIn/WordPress/Webhook 게시를 자동 시도합니다.
        네이버 블로그 자동 로그인 게시 기능은 포함하지 않습니다. 네이버는 검색광고/콘텐츠 패키지로 처리합니다.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={runLoop} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8, background: "#111", color: "#fff" }}>
          자동루프 1회 실행
        </button>
        <button onClick={() => load()} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8 }}>
          새로고침
        </button>
      </div>

      <div style={{ background: "#f3f4f6", padding: 12, borderRadius: 10, fontWeight: 700, marginBottom: 20 }}>
        {status}
      </div>

      {items.map((c) => (
        <article key={c.id} style={{ border: "1px solid #ddd", borderRadius: 14, padding: 18, marginBottom: 18 }}>
          <div style={{ color: "#666" }}>{c.campaign_date} · #{c.slot} · {c.keyword}</div>
          <h2>{c.title}</h2>
          <p>상태: <b>{c.status}</b> · 영상: <b>{c.video_status}</b> {c.video_url ? <a href={c.video_url} target="_blank">영상 보기</a> : null}</p>

          <details>
            <summary>장문 원고 보기</summary>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 12, borderRadius: 8, maxHeight: 300, overflow: "auto" }}>{c.long_body}</pre>
          </details>

          <details>
            <summary>카드/영상 스크립트 보기</summary>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 12, borderRadius: 8 }}>
              {JSON.stringify({ cards: c.cards, video_script: c.video_script }, null, 2)}
            </pre>
          </details>

          <h3>게시 작업</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(c.auto_marketing_publish_jobs || []).map((j) => (
              <span key={j.id} style={{ padding: "6px 10px", borderRadius: 999, background: "#eef2ff", fontSize: 13 }}>
                {j.channel}: {j.status}{j.external_url ? " ✅" : ""}{j.error_message ? " ⚠️" : ""}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            {c.status !== "approved" ? (
              <button onClick={() => approve(c.id)} style={{ padding: "8px 12px", borderRadius: 8, background: "#2563eb", color: "#fff" }}>
                검증 완료/승인
              </button>
            ) : (
              <b>승인됨</b>
            )}
          </div>
        </article>
      ))}
    </main>
  );
}
