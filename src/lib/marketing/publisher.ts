import { db } from './supabase';
import { runAutonomousAgent } from './agent';
import { extractMediaJson, stripMediaJson } from './creative';

type MarketingAction = {
  id: string;
  lead_id?: string | null;
  service?: string | null;
  stage: string;
  channel: string;
  status: string;
  subject?: string | null;
  body?: string | null;
  created_at?: string;
};

function baseUrl() {
  return (process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function stageUrl(stage: string) {
  return `${baseUrl()}/blog/${encodeURIComponent(stage)}`;
}

function imageUrl(stage: string) {
  return `${baseUrl()}/api/marketing-card/${encodeURIComponent(stage)}`;
}

function inferTarget(action: MarketingAction) {
  const channel = (action.channel || '').toLowerCase();
  const stage = (action.stage || '').toLowerCase();
  if (channel === 'blog' || stage.startsWith('blog_')) return 'blog';
  if (channel === 'linkedin' || stage.startsWith('linkedin_')) return 'linkedin';
  if (channel === 'youtube' || stage.startsWith('youtube_')) return 'youtube';
  if (channel === 'sns' || channel === 'social' || stage.startsWith('sns_')) return 'sns';
  if (channel === 'email') return 'email';
  return 'ops';
}

async function logEvent(actionId: string | null, event: string, payload: Record<string, unknown>) {
  const supabase = db();
  await supabase.from('marketing_events').insert({ action_id: actionId, event, payload });
}

async function postWebhook(url: string, payload: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`Webhook failed: ${res.status} ${text.slice(0, 500)}`);
  return { status: res.status, response: text.slice(0, 500) };
}

async function sendEmailIfConfigured(action: MarketingAction) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return null;

  const supabase = db();
  const { data: lead } = await supabase
    .from('marketing_leads')
    .select('email,name')
    .eq('id', action.lead_id)
    .single();

  if (!lead?.email) return null;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [lead.email],
      reply_to: process.env.REPLY_TO || undefined,
      subject: action.subject || '부모님 안심케어 안내',
      text: stripMediaJson(action.body || ''),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${JSON.stringify(json).slice(0, 500)}`);
  return json;
}

export async function publishAction(actionId: string, options?: { force?: boolean }) {
  const supabase = db();
  const { data: action, error } = await supabase.from('marketing_actions').select('*').eq('id', actionId).single();
  if (error) throw error;
  if (!action) throw new Error('Action not found');

  const typed = action as MarketingAction;
  const target = inferTarget(typed);
  const dryRun = String(process.env.DRY_RUN || 'true').toLowerCase() !== 'false';
  const cleanText = stripMediaJson(typed.body || '');
  const media = extractMediaJson(typed.body || '');

  const payload = {
    action_id: typed.id,
    target,
    title: typed.subject || '',
    text: cleanText,
    url: target === 'blog' ? stageUrl(typed.stage) : baseUrl(),
    image_url: imageUrl(typed.stage),
    media,
    stage: typed.stage,
    service: typed.service || 'parent-care',
  };

  if (target === 'blog') {
    await supabase
      .from('marketing_actions')
      .update({ status: 'published', approved_at: new Date().toISOString(), sent_at: new Date().toISOString() })
      .eq('id', actionId);
    await logEvent(actionId, 'published_blog', { ...payload, public_url: stageUrl(typed.stage) });
    return { ok: true, action_id: actionId, status: 'published', target, public_url: stageUrl(typed.stage), image_url: imageUrl(typed.stage) };
  }

  if (target === 'ops') {
    await supabase
      .from('marketing_actions')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', actionId);
    await logEvent(actionId, 'approved_ops_action', payload);
    return { ok: true, action_id: actionId, status: 'approved', target };
  }

  if (dryRun) {
    await supabase
      .from('marketing_actions')
      .update({ status: 'sent_dry_run', approved_at: new Date().toISOString(), sent_at: new Date().toISOString() })
      .eq('id', actionId);
    await logEvent(actionId, `dry_run_publish_${target}`, payload);
    return { ok: true, action_id: actionId, status: 'sent_dry_run', target, image_url: imageUrl(typed.stage) };
  }

  let result: unknown = null;

  if (target === 'linkedin' && process.env.LINKEDIN_PUBLISH_WEBHOOK_URL) {
    result = await postWebhook(process.env.LINKEDIN_PUBLISH_WEBHOOK_URL, payload);
  } else if (target === 'sns' && process.env.SNS_PUBLISH_WEBHOOK_URL) {
    result = await postWebhook(process.env.SNS_PUBLISH_WEBHOOK_URL, payload);
  } else if (target === 'youtube' && process.env.YOUTUBE_PUBLISH_WEBHOOK_URL) {
    result = await postWebhook(process.env.YOUTUBE_PUBLISH_WEBHOOK_URL, payload);
  } else if (target === 'email') {
    result = await sendEmailIfConfigured(typed);
  }

  if (!result) {
    await logEvent(actionId, `missing_connector_${target}`, payload);
    return { ok: false, action_id: actionId, status: 'missing_connector', target, image_url: imageUrl(typed.stage) };
  }

  await supabase
    .from('marketing_actions')
    .update({ status: 'published', approved_at: new Date().toISOString(), sent_at: new Date().toISOString() })
    .eq('id', actionId);

  await logEvent(actionId, `published_${target}`, { ...payload, result: result as Record<string, unknown> });
  return { ok: true, action_id: actionId, status: 'published', target, result, image_url: imageUrl(typed.stage) };
}

export async function publishReadyActions() {
  const supabase = db();
  const autoPublish = String(process.env.AUTO_PUBLISH_ENABLED || 'false').toLowerCase() === 'true';

  if (!autoPublish) return { ok: true, published: 0, skipped: 'AUTO_PUBLISH_ENABLED is not true' };

  const rawChannels = process.env.AUTO_PUBLISH_CHANNELS || 'blog,linkedin,sns,youtube';
  const channels = new Set(rawChannels.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));

  const { data, error } = await supabase
    .from('marketing_actions')
    .select('*')
    .is('lead_id', null)
    .eq('status', 'draft')
    .order('created_at', { ascending: true })
    .limit(30);

  if (error) throw error;

  const results = [];
  for (const action of (data || []) as MarketingAction[]) {
    const target = inferTarget(action);
    if (!channels.has(target)) continue;
    results.push(await publishAction(action.id, { force: true }));
  }

  return { ok: true, published: results.filter((r) => r.ok).length, results };
}

export async function fullAutopilot() {
  const autonomous = await runAutonomousAgent();
  const publishing = await publishReadyActions();
  await logEvent(null, 'full_autopilot_tick', { autonomous, publishing });
  return { ok: true, autonomous, publishing };
}
