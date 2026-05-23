"use client";

import { useEffect, useState } from "react";

type Pack = {
  id: string;
  campaign_date: string;
  slot: number;
  keyword: string;
  title: string;
  subtitle: string;
  body: string;
  summary: string;
  tags: string[];
  card_news: any[];
  video_brief: any;
  youtube_brief: any;
  tiktok_brief: any;
  instagram_brief: any;
  cafe_answer: string;
  kin_answer: string;
  search_ad: any;
  status: string;
};

function copy(text: string) {
  navigator.clipboard.writeText(text || "");
}

export default function NaverFivePage() {
  const [key, setKey] = useState("");
  const [items, setItems] = useState<Pack[]>([]);
  const [status, setStatus] = useState("준비 중...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const k = new URLSearchParams(location.search).get("key") || "";
    setKey(k);
    if (k) void load(k);
    else setStatus("URL에 관리자 key가 없습니다.");
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

  async function run() {
    setBusy(true);
    try {
      setStatus("하루 5개 마케팅 패키지 생성 중...");
      const r = await api("/api/naver/five/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setStatus(`생성/갱신 완료: ${r.created}개`);
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
      const r = await api("/api/naver/five/list", undefined, k);
      setItems(r.packages || []);
      setStatus(`패키지 ${r.packages?.length || 0}개`);
    } catch (e) {
      setStatus(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    setBusy(true);
    try {
      await api("/api/naver/five/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });
      setStatus("승인 완료");
      await load();
    } catch (e) {
      setStatus(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function blogText(p: Pack) {
    return `${p.body}\n\n${(p.tags || []).map((t) => "#" + String(t).replace(/^#/, "")).join(" ")}\n\n상담 신청: https://parents-care.net`;
  }

  function videoText(p: Pack) {
    return JSON.stringify(
      {
        youtube: p.youtube_brief,
        tiktok: p.tiktok_brief,
        instagram: p.instagram_brief,
      },
      null,
      2
    );
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>네이버 하루 5개 마케팅 패키지</h1>
      <p style={{ color: "#555", lineHeight: 1.6 }}>
        장문 블로그 원고, 카드뉴스 이미지 6장, YouTube/TikTok/Reels 영상 브리프, 카페/지식iN 답변, 검색광고 문구를 하루 5개 단위로 생성합니다.
        네이버는 자동 로그인 게시가 아니라 승인 후 수동 게시 패키지로 운영합니다.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={run} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8, background: "#111", color: "#fff" }}>
          오늘 5개 패키지 생성
        </button>
        <button onClick={() => load()} disabled={busy} style={{ padding: "10px 14px", borderRadius: 8 }}>
          새로고침
        </button>
        <a href="https://blog.naver.com/PostWriteForm.naver" target="_blank" rel="noreferrer">
          <button style={{ padding: "10px 14px", borderRadius: 8 }}>네이버 블로그 작성 화면</button>
        </a>
      </div>

      <div style={{ background: "#f3f4f6", padding: 12, borderRadius: 10, fontWeight: 700, marginBottom: 20 }}>
        {status}
      </div>

      {items.map((p) => (
        <article key={p.id} style={{ border: "1px solid #ddd", borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <div style={{ color: "#666" }}>
            {p.campaign_date} · #{p.slot} · {p.keyword} · 상태 <b>{p.status}</b>
          </div>
          <h2>{p.title}</h2>
          <p><b>{p.subtitle}</b></p>
          <p style={{ color: "#555" }}>{p.summary}</p>

          <h3>카드뉴스 이미지 6장</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <a key={idx} href={`/api/naver/five/card/${p.id}/${idx}`} target="_blank" rel="noreferrer">
                <img src={`/api/naver/five/card/${p.id}/${idx}`} alt={`card ${idx + 1}`} style={{ width: "100%", borderRadius: 12, border: "1px solid #eee" }} />
              </a>
            ))}
          </div>

          <h3>블로그 장문 원고</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 14, borderRadius: 10, maxHeight: 360, overflow: "auto", lineHeight: 1.55 }}>
            {p.body}
          </pre>

          <h3>카페 답변 초안</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 14, borderRadius: 10 }}>{p.cafe_answer}</pre>

          <h3>지식iN 답변 초안</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 14, borderRadius: 10 }}>{p.kin_answer}</pre>

          <h3>YouTube / TikTok / Reels 영상 브리프</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 14, borderRadius: 10, maxHeight: 320, overflow: "auto" }}>
            {videoText(p)}
          </pre>

          <h3>네이버 검색광고 문구</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 14, borderRadius: 10 }}>
            {JSON.stringify(p.search_ad, null, 2)}
          </pre>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <button onClick={() => copy(p.title)}>제목 복사</button>
            <button onClick={() => copy(blogText(p))}>블로그 본문+태그 복사</button>
            <button onClick={() => copy(videoText(p))}>영상 브리프 복사</button>
            <button onClick={() => copy(p.cafe_answer)}>카페 답변 복사</button>
            <button onClick={() => copy(p.kin_answer)}>지식iN 답변 복사</button>
            <button onClick={() => approve(p.id)} style={{ background: "#2563eb", color: "#fff", borderRadius: 8, padding: "8px 12px" }}>
              검증 완료/승인
            </button>
          </div>
        </article>
      ))}
    </main>
  );
}
