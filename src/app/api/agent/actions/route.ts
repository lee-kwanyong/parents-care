import { db } from '@/lib/marketing/supabase';

export const dynamic = 'force-dynamic';

function allowed(request: Request) {
  const url = new URL(request.url);
  const manualKey = url.searchParams.get('key');
  return Boolean(manualKey && manualKey === process.env.ADMIN_SECRET);
}

export async function GET(request: Request) {
  if (!allowed(request)) return Response.json({ ok: false, detail: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'draft';
  const supabase = db();

  const { data, error } = await supabase
    .from('marketing_actions')
    .select('*, marketing_leads(*)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return Response.json({ ok: false, detail: error.message }, { status: 500 });
  return Response.json({ ok: true, actions: data || [] });
}
