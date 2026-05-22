import { db } from '@/lib/marketing/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const leadId = url.searchParams.get('lead_id');
  const supabase = db();

  if (leadId) {
    await supabase.from('marketing_leads').update({ suppressed: true, opt_in: false, status: 'unsubscribed' }).eq('id', leadId);
  } else if (email) {
    await supabase.from('marketing_leads').update({ suppressed: true, opt_in: false, status: 'unsubscribed' }).eq('email', email);
  } else {
    return new Response('<h1>수신거부 대상 정보가 없습니다.</h1>', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  await supabase.from('marketing_events').insert({ event: 'unsubscribed', payload: { email, lead_id: leadId } });

  return new Response('<h1>수신거부가 처리되었습니다.</h1><p>앞으로 해당 연락처로 광고성 정보를 보내지 않습니다.</p>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
