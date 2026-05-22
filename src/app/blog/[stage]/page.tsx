import { db } from '@/lib/marketing/supabase';
import { stripMediaJson } from '@/lib/marketing/creative';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ stage: string }> | { stage: string } };

function renderMarkdownLite(text: string) {
  return text.split('\n').map((line, idx) => {
    if (line.startsWith('# ')) return <h1 key={idx} style={{ fontSize: 36, lineHeight: 1.25 }}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={idx} style={{ marginTop: 28 }}>{line.slice(3)}</h2>;
    if (line.trim() === '') return <br key={idx} />;
    if (line.trim().startsWith('- ')) return <p key={idx} style={{ lineHeight: 1.75, margin: '6px 0' }}>• {line.trim().slice(2)}</p>;
    return <p key={idx} style={{ lineHeight: 1.78, margin: '10px 0', color: '#263244' }}>{line}</p>;
  });
}

export default async function BlogPostPage({ params }: Params) {
  const resolved = await params;
  const stage = decodeURIComponent(resolved.stage);
  const supabase = db();

  const { data, error } = await supabase
    .from('marketing_actions')
    .select('id, stage, subject, body, created_at, sent_at, status')
    .eq('stage', stage)
    .eq('channel', 'blog')
    .eq('status', 'published')
    .single();

  if (error || !data) notFound();

  const cleanBody = stripMediaJson(data.body || data.subject || '');

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <Link href="/blog">← 블로그 목록</Link>
      <article style={{ marginTop: 20 }}>
        <div style={{ color: '#777', marginBottom: 12 }}>{new Date(data.sent_at || data.created_at).toLocaleDateString('ko-KR')}</div>
        <img
          src={`/api/marketing-card/${encodeURIComponent(stage)}`}
          alt={data.subject || '부모님 안심케어'}
          style={{ width: '100%', borderRadius: 18, border: '1px solid #e5e7eb', marginBottom: 28 }}
        />
        <div>{renderMarkdownLite(cleanBody)}</div>
      </article>
      <section style={{ marginTop: 36, padding: 22, background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe' }}>
        <h3>부모님 안심케어 상담이 필요하신가요?</h3>
        <p style={{ lineHeight: 1.7 }}>혼자 계신 부모님의 안부, 식사, 복약, 생활 변화를 정기적으로 확인하고 가족에게 안심 리포트를 전달합니다.</p>
        <Link href="/" style={{ display: 'inline-block', background: '#2563eb', color: 'white', padding: '12px 16px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>상담 신청하러 가기</Link>
      </section>
    </main>
  );
}
