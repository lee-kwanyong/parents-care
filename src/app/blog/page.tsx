import { db } from '@/lib/marketing/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Post = { id: string; stage: string; subject: string | null; body: string | null; created_at: string; sent_at: string | null };

export default async function BlogIndexPage() {
  const supabase = db();
  const { data, error } = await supabase
    .from('marketing_actions')
    .select('id, stage, subject, body, created_at, sent_at')
    .eq('channel', 'blog')
    .eq('status', 'published')
    .order('sent_at', { ascending: false })
    .limit(30);

  if (error) {
    return <main style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}><h1>블로그</h1><p>게시글을 불러오지 못했습니다.</p></main>;
  }

  const posts = (data || []) as Post[];

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>부모님 안심케어 블로그</h1>
      <p style={{ color: '#555', lineHeight: 1.6 }}>부모님 안부, 복약, 식사, 생활 변화 확인에 관한 정보를 전합니다.</p>
      {posts.length === 0 ? <p>아직 게시된 글이 없습니다. 관리자 화면에서 블로그 글을 게시하세요.</p> : null}
      {posts.map((post) => (
        <article key={post.id} style={{ borderBottom: '1px solid #eee', padding: '18px 0' }}>
          <h2 style={{ marginBottom: 6 }}><Link href={`/blog/${encodeURIComponent(post.stage)}`}>{post.subject || '제목 없음'}</Link></h2>
          <p style={{ color: '#777' }}>{new Date(post.sent_at || post.created_at).toLocaleDateString('ko-KR')}</p>
          <p style={{ color: '#555', lineHeight: 1.6 }}>{(post.body || '').replace(/[#*]/g, '').slice(0, 180)}...</p>
        </article>
      ))}
    </main>
  );
}
