import { publishAction } from '@/lib/marketing/publisher';

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

  try {
    const result = await publishAction(body.id, { force: Boolean(body.force) });
    return Response.json(result);
  } catch (err) {
    return Response.json({ ok: false, detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
