import { db } from '@/lib/marketing/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (!body.name || !body.privacy_consent) {
    return Response.json({ ok: false, detail: 'name and privacy_consent are required' }, { status: 400 });
  }

  if (!body.email && !body.phone) {
    return Response.json({ ok: false, detail: 'email or phone is required' }, { status: 400 });
  }

  const supabase = db();
  const { data, error } = await supabase
    .from('marketing_leads')
    .insert({
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      service: 'parent-care',
      situation: body.situation || body.message || null,
      opt_in: Boolean(body.opt_in),
      privacy_consent: Boolean(body.privacy_consent),
      consent_proof: body.consent_proof || 'parents-care form',
      status: 'new',
      suppressed: false,
    })
    .select('id')
    .single();

  if (error) return Response.json({ ok: false, detail: error.message }, { status: 500 });
  return Response.json({ ok: true, lead_id: data.id });
}
