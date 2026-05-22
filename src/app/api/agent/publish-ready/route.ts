import { publishReadyActions } from '@/lib/marketing/publisher';

export const dynamic = 'force-dynamic';

function allowed(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const manualKey = url.searchParams.get('key');
  return authHeader === `Bearer ${process.env.CRON_SECRET}` || Boolean(manualKey && manualKey === process.env.ADMIN_SECRET);
}

export async function GET(request: Request) {
  if (!allowed(request)) return Response.json({ ok: false, detail: 'Unauthorized' }, { status: 401 });
  try {
    const result = await publishReadyActions();
    return Response.json(result);
  } catch (err) {
    return Response.json({ ok: false, detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
