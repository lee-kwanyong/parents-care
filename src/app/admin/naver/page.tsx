"use client";

import { useEffect, useMemo, useState } from "react";

type PackageRow = {
  id: string;
  keyword: string;
  title: string;
  body: string;
  tags: string[];
  status: string;
  image_brief: any;
  video_brief: any;
  created_at: string;
};

type ResearchRow = {
  id: string;
  keyword: string;
  result_count: number;
  top_titles: string[];
  insights: any;
  created_at: string;
};

type AdRow = {
  id: string;
  keyword: string;
  headline: string;
  description: string;
  landing_url: string;
  daily_budget: number;
  status: string;
};

export default function NaverMarketingAdminPage() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("준비 중...");
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [research, setResearch] = useState<ResearchRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("key") || "";
    setKey(k);
    if (!k) {
      setStatus("URL에 관리자 key가 없습니다.");
      return;
    }
    void load(k);
  }, []);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selected) || packages[0],
    [packages, selected]
  );

  function withKey(path: string, k = key) {
    return `${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(k)}`;
  }

  async function api(path: string, options?: RequestInit, k = key) {
    const res = await fetch(withKey(path, k), options);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.detail || "요청 실패");
    return json;
  }

  async function load(k = key) {
    if (!k) return;
    setLoading(true);
    try {
      setStatus("네이버 마케팅 패키지를 불러오는 중...");
      const data = await api("/api/naver/packages", undefined, k);
      setPackages(data.packages || []);
      setResearch(data.research || []);
      setAds(data.ads || []);
      setSelected((data.packages || [])[0]?.id || null);
      setStatus(`콘텐츠 패키지 ${data.packages?.length || 0}건 / 키워드 리서치 ${data.research?.length || 0}건 / 광고안 ${data.ads?.length || 0}건`);
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function runAgent() {
    setLoading(true);
    try {
      setStatus("네이버 키워드 분석 + 방대한 원고 + 이미지 카드 + 영상 브리프 생성 중...");
      const data = await api("/api/naver/agent/run?count=3", { method: "POST" });
      setStatus(`생성 완료: 콘텐츠 ${data.created}건 / 리서치 ${data.research}건 / 광고안 ${data.ads}건`);
      await load();
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text || "");
    setStatus("복사 완료");
  }

  function naverBlogCopy(pkg: PackageRow) {
    const tags = (pkg.tags || []).map((t) => `#${t.replace(/^#/, "")}`).join(" ");
    return `${pkg.title}\n\n${pkg.body}\n\n${tags}`;
  }

  return (
    <main style={{ maxWidth: 1240, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>네이버 중심 AI 마케팅 에이전트</h1>
      <p style={{ color: "#555", lineHeight: 1.7 }}>
        네이버 자동 로그인 글쓰기가 아니라, 네이버 검색 결과를 분석해서
        <b> 블로그 원고·카드뉴스 이미지·Shorts/Reels 영상 구성·검색광고안</b>을
        한 번에 만드는 마케팅 패키지입니다. 이 패키지를 운영자 또는 제휴 블로거가 네이버 블로그에 게시합니다.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          onClick={runAgent}
          disabled={loading}
          style={{ padding: "12px 16px", borderRadius: 10, border: 0, background: "#111", color: "#fff", fontWeight: 800 }}
        >
          방대한 마케팅 패키지 생성
        </button>
        <button
          onClick={() => load()}
          disabled={loading}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ccc", background: "#fff", fontWeight: 800 }}
        >
          새로고침
        </button>
      </div>

      <div style={{ padding: 14, borderRadius: 10, background: "#f4f4f5", fontWeight: 800, marginBottom: 20 }}>
        {status}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
        <aside>
          <h2 style={{ fontSize: 18 }}>생성된 패키지</h2>
          {packages.length === 0 ? (
            <p style={{ color: "#666" }}>아직 생성된 패키지가 없습니다.</p>
          ) : (
            packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  marginBottom: 8,
                  borderRadius: 10,
                  border: selectedPackage?.id === pkg.id ? "2px solid #111" : "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800 }}>{pkg.keyword}</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{pkg.title}</div>
              </button>
            ))
          )}

          <h2 style={{ fontSize: 18, marginTop: 24 }}>최근 키워드 리서치</h2>
          {research.slice(0, 5).map((r) => (
            <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <b>{r.keyword}</b>
              <div style={{ fontSize: 12, color: "#555" }}>검색 결과 추정: {r.result_count}</div>
              <ul style={{ paddingLeft: 18, fontSize: 12 }}>
                {(r.top_titles || []).slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          ))}
        </aside>

        <section>
          {!selectedPackage ? (
            <p>패키지를 생성하세요.</p>
          ) : (
            <div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, background: "#fff", marginBottom: 18 }}>
                <div style={{ color: "#0f766e", fontWeight: 800 }}>{selectedPackage.keyword}</div>
                <h2>{selectedPackage.title}</h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => copyText(naverBlogCopy(selectedPackage))} style={btnStyle}>네이버 블로그용 전체 복사</button>
                  <button onClick={() => copyText(selectedPackage.body)} style={btnStyle}>본문만 복사</button>
                  <button onClick={() => copyText((selectedPackage.tags || []).map((t) => "#" + t.replace(/^#/, "")).join(" "))} style={btnStyle}>태그 복사</button>
                </div>

                <h3>1) 네이버 블로그/체험단 게시용 장문 원고</h3>
                <textarea
                  readOnly
                  value={selectedPackage.body}
                  style={{
                    width: "100%",
                    minHeight: 520,
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 14,
                    lineHeight: 1.65,
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, background: "#fff", marginBottom: 18 }}>
                <h3>2) 카드뉴스 이미지 6장</h3>
                <p style={{ color: "#555" }}>이미지는 SVG로 자동 생성됩니다. 우클릭 저장 또는 Webhook에 이미지 URL로 전달할 수 있습니다.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
                  {Array.from({ length: selectedPackage.image_brief?.cards?.length || 0 }).map((_, idx) => (
                    <div key={idx} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
                      <img
                        src={`/api/naver/card/${selectedPackage.id}/${idx}`}
                        alt={`카드뉴스 ${idx + 1}`}
                        style={{ width: "100%", borderRadius: 10, background: "#f8fafc" }}
                      />
                      <button onClick={() => copyText(`${location.origin}/api/naver/card/${selectedPackage.id}/${idx}`)} style={{ ...btnStyle, width: "100%", marginTop: 8 }}>
                        이미지 URL 복사
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, background: "#fff", marginBottom: 18 }}>
                <h3>3) YouTube Shorts / TikTok / Reels 영상 구성</h3>
                <h4>{selectedPackage.video_brief?.shortsTitle}</h4>
                <p><b>썸네일:</b> {selectedPackage.video_brief?.thumbnailText}</p>
                <p><b>후킹:</b> {selectedPackage.video_brief?.hook}</p>
                <div>
                  {(selectedPackage.video_brief?.scenes || []).map((s: any, i: number) => (
                    <div key={i} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                      <b>{s.sec}</b>
                      <div>화면: {s.visual}</div>
                      <div>자막: {s.caption}</div>
                      <div>내레이션: {s.narration}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => copyText(JSON.stringify(selectedPackage.video_brief, null, 2))} style={btnStyle}>
                  영상 브리프 JSON 복사
                </button>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, background: "#fff", marginBottom: 18 }}>
                <h3>4) SNS/카페/지식iN 배포 문구</h3>
                <h4>Instagram/Reels</h4>
                <pre style={preStyle}>{selectedPackage.video_brief?.instagramCaption}</pre>
                <button onClick={() => copyText(selectedPackage.video_brief?.instagramCaption || "")} style={btnStyle}>인스타 문구 복사</button>

                <h4>TikTok</h4>
                <pre style={preStyle}>{selectedPackage.video_brief?.tiktokCaption}</pre>
                <button onClick={() => copyText(selectedPackage.video_brief?.tiktokCaption || "")} style={btnStyle}>틱톡 문구 복사</button>

                <h4>LinkedIn</h4>
                <pre style={preStyle}>{selectedPackage.video_brief?.linkedinPost}</pre>
                <button onClick={() => copyText(selectedPackage.video_brief?.linkedinPost || "")} style={btnStyle}>링크드인 문구 복사</button>

                <h4>네이버 카페 답변 초안</h4>
                <pre style={preStyle}>{selectedPackage.video_brief?.naverCafeAnswer}</pre>
                <button onClick={() => copyText(selectedPackage.video_brief?.naverCafeAnswer || "")} style={btnStyle}>카페 답변 복사</button>

                <h4>지식iN 답변 초안</h4>
                <pre style={preStyle}>{selectedPackage.video_brief?.knowledgeInAnswer}</pre>
                <button onClick={() => copyText(selectedPackage.video_brief?.knowledgeInAnswer || "")} style={btnStyle}>지식iN 답변 복사</button>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, background: "#fff" }}>
                <h3>5) 네이버 검색광고 초안</h3>
                {ads.filter((a) => a.keyword === selectedPackage.keyword).slice(0, 3).map((ad) => (
                  <div key={ad.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <b>{ad.headline}</b>
                    <p>{ad.description}</p>
                    <div>랜딩: {ad.landing_url}</div>
                    <div>일 예산 제안: {ad.daily_budget.toLocaleString()}원</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const preStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  lineHeight: 1.6,
};
