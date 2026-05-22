import { runAutonomousAgent } from '@/lib/marketing/agent';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const manualKey = url.searchParams.get('key');

  const allowedByCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const allowedByAdmin = manualKey && manualKey === process.env.ADMIN_SECRET;

  if (!allowedByCron && !allowedByAdmin) {
    return Response.json({ ok: false, detail: 'Unauthorized' }, { status: 401 });
  }

  const result = await runAutonomousAgent();
  return Response.json(result);
}
