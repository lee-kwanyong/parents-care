"use client";

import { useEffect, useState } from "react";

type Lead = { name?: string | null; email?: string | null; phone?: string | null; situation?: string | null; opt_in?: boolean | null };
type Action = { id: string; stage?: string | null; channel?: string | null; subject?: string | null; body?: string | null; status?: string | null; marketing_leads?: Lead | null };
type ActionsResponse = { ok: boolean; actions: Action[]; detail?: string };
type AutopilotResponse = { ok: boolean; autonomous?: { content?: { created?: number } }; publishing?: { published?: number }; detail?: string };
type PublishResponse = { ok: boolean; status?: string; public_url?: string; image_url?: string; detail?: string };

function stripMediaJson(body?: string | null) {
  const text = body || "";
  const start = text.indexOf("---MEDIA_JSON_START---");
  const end = text.indexOf("---MEDIA_JSON_END---");
  if (start < 0 || end < 0 || end <= start) return text;
  return `${text.slice(0, start)}${text.slice(end + "---MEDIA_JSON_END---".length)}`.trim();
}

function extractMediaJson(body?: string | null) {
  const text = body || "";
  const start = text.indexOf("---MEDIA_JSON_START---");
  const end = text.indexOf("---MEDIA_JSON_END---");
  if (start < 0 || end < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start + "---MEDIA_JSON_START---".length, end).trim());
  } catch {
    return null;
  }
}

export default function AgentAdminPage() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("준비 중...");
  const [actions, setActions] = useState<Action[]>([]);
  const [filter, setFilter] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("key") || "";
    setKey(k);
    if (!k) {
      setStatus("오류: URL에 관리자 key가 없습니다.");
      return;
    }
    void loadActions("draft", k);
  }, []);

  function withKey(path: string, k = key) {
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}key=${encodeURIComponent(k)}`;
  }

  async function api<T>(path: string, options?: RequestInit, k = key): Promise<T> {
    const res = await fetch(withKey(path, k), options);
    const json = (await res.json().catch(() => ({}))) as T & { detail?: string };
    if (!res.ok) throw new Error(json.detail || "요청 실패");
    return json;
  }

  async function loadActions(statusValue = filter, k = key) {
    if (!k) return;
    setLoading(true);
    try {
      setStatus(`${statusValue} 목록을 불러오는 중...`);
      const data = await api<ActionsResponse>(`/api/agent/actions?status=${encodeURIComponent(statusValue)}`, undefined, k);
      setActions(data.actions || []);
      setFilter(statusValue);
      setStatus(`${statusValue} ${data.actions?.length || 0}건`);
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function fullAutopilot() {
    setLoading(true);
    try {
      setStatus("이미지/영상 브리프 포함 자율 마케팅 실행 중...");
      const result = await api<AutopilotResponse>("/api/agent/full-autopilot");
      setStatus(`생성 ${result.autonomous?.content?.created ?? 0}건 / 자동게시 ${result.publishing?.published ?? 0}건`);
      await loadActions("draft");
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function publishOne(id: string) {
    setBusyId(id);
    try {
      const result = await api<PublishResponse>("/api/agent/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setStatus(`처리 완료: ${result.status || "ok"}${result.public_url ? ` / ${result.public_url}` : ""}`);
      await loadActions(filter);
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>부모님 안심케어 AI 마케팅 에이전트</h1>
      <p style={{ lineHeight: 1.6, color: "#555" }}>
        이제 문구만 만드는 단계가 아니라 이미지 카드, 카드뉴스 구성, YouTube Shorts 대본과 장면 구성까지 같이 생성합니다.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={fullAutopilot} disabled={loading} style={btnPrimary}>완전 자동 마케팅 실행</button>
        <button onClick={() => loadActions("draft")} disabled={loading} style={btn}>초안</button>
        <button onClick={() => loadActions("published")} disabled={loading} style={btn}>게시됨</button>
        <button onClick={() => loadActions("sent_dry_run")} disabled={loading} style={btn}>DRY RUN</button>
        <a href="/blog" target="_blank" style={{ ...btn, textDecoration: "none", color: "#111" }}>블로그 보기</a>
      </div>

      <div style={{ marginBottom: 16, fontWeight: 700, padding: 12, borderRadius: 8, background: "#f5f5f5" }}>{status}</div>

      {actions.length === 0 ? <p style={{ color: "#666" }}>표시할 항목이 없습니다.</p> : null}

      <div style={{ display: "grid", gap: 14 }}>
        {actions.map((action) => {
          const lead = action.marketing_leads || {};
          const media = extractMediaJson(action.body);
          const cleanBody = stripMediaJson(action.body);
          const imageUrl = action.stage ? `/api/marketing-card/${encodeURIComponent(action.stage)}` : "";

          return (
            <section key={action.id} style={{ border: "1px solid #ddd", borderRadius: 14, padding: 16, background: "#fff" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={pill}>{action.status || "-"}</span>
                <span style={pill}>{action.channel || "-"}</span>
                <span style={pill}>{action.stage || "-"}</span>
              </div>

              {lead.name || lead.email || lead.phone ? (
                <div style={{ color: "#666", marginBottom: 8 }}>{lead.name || "이름 없음"} · {lead.email || "이메일 없음"} · {lead.phone || "연락처 없음"}</div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 0.8fr)", gap: 16 }}>
                <div>
                  <h2 style={{ marginTop: 0 }}>{action.subject || "제목 없음"}</h2>
                  <pre style={{ whiteSpace: "pre-wrap", background: "#f8fafc", padding: 12, borderRadius: 10, lineHeight: 1.55, maxHeight: 420, overflow: "auto" }}>{cleanBody}</pre>

                  {media?.video ? (
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 700 }}>영상 구성 보기</summary>
                      <pre style={{ whiteSpace: "pre-wrap", background: "#fff7ed", padding: 12, borderRadius: 10, lineHeight: 1.5 }}>{JSON.stringify(media.video, null, 2)}</pre>
                    </details>
                  ) : null}

                  {media?.carousel ? (
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 700 }}>카드뉴스 구성 보기</summary>
                      <pre style={{ whiteSpace: "pre-wrap", background: "#eff6ff", padding: 12, borderRadius: 10, lineHeight: 1.5 }}>{JSON.stringify(media.carousel, null, 2)}</pre>
                    </details>
                  ) : null}
                </div>

                <div>
                  {imageUrl ? <img src={imageUrl} alt="마케팅 이미지" style={{ width: "100%", borderRadius: 12, border: "1px solid #e5e7eb" }} /> : null}
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {imageUrl ? <a href={imageUrl} target="_blank" style={{ ...btn, textDecoration: "none", color: "#111" }}>이미지 열기</a> : null}
                    <button onClick={() => publishOne(action.id)} disabled={busyId === action.id} style={btnPrimary}>{busyId === action.id ? "처리 중..." : action.channel === "blog" ? "블로그 게시" : "승인/발행"}</button>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

const btn: React.CSSProperties = { padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { padding: "10px 14px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" };
const pill: React.CSSProperties = { display: "inline-block", background: "#eef2ff", color: "#3730a3", padding: "4px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
