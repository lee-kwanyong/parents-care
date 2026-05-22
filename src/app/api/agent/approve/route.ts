import { db } from '@/lib/marketing/supabase';

export const dynamic = 'force-dynamic';

function allowed(request: Request) {
  const url = new URL(request.url);
  const manualKey = url.searchParams.get('key');
  return Boolean(manualKey && manualKey === process.env.ADMIN_SECRET);
}

export async function POST(request: Request) {
  if (!allowed(request)) return Response.json({ ok: false, detail: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.id) return Response.json({ ok: false, detail: 'id is required' }, { status: 400 });

  const supabase = db();
  const { error } = await supabase
    .from('marketing_actions')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) return Response.json({ ok: false, detail: error.message }, { status: 500 });
  return Response.json({ ok: true, status: 'approved' });
}
