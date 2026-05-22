import { db } from '@/lib/marketing/supabase';

export const dynamic = 'force-dynamic';

function allowed(request: Request) {
  const url = new URL(request.url);
  const manualKey = url.searchParams.get('key');
  return Boolean(manualKey && manualKey === process.env.ADMIN_SECRET);
}

export async function POST(request: Request) {
  if (!allowed(request)) return Response.json({ ok: false, detail: 'Unauthorized' }, { status: 401 });

  const supabase = db();
  const { data, error } = await supabase
    .from('marketing_leads')
    .insert({
      name: '테스트 보호자',
      email: 'test@example.com',
      phone: '010-0000-0000',
      service: 'parent-care',
      situation: '어머니 혼자 거주, 복약 체크와 안부 확인 필요',
      opt_in: true,
      privacy_consent: true,
      consent_proof: 'local admin seed',
      status: 'new',
      suppressed: false,
    })
    .select('id')
    .single();

  if (error) return Response.json({ ok: false, detail: error.message }, { status: 500 });
  return Response.json({ ok: true, lead_id: data.id });
}
