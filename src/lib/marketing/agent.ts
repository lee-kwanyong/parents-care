import { db } from './supabase';
import {
  appendMediaJson,
  buildBlogBody,
  buildLeadFollowupBody,
  buildLinkedInBody,
  buildMediaBrief,
  buildOpsReportBody,
  buildSnsBody,
  buildYoutubeBody,
  todayKey,
  topicOfDay,
} from './creative';

export type MarketingChannel = 'blog' | 'sns' | 'linkedin' | 'youtube' | 'ops' | 'email';

type Lead = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  service?: string | null;
  situation?: string | null;
  opt_in?: boolean | null;
  privacy_consent?: boolean | null;
  suppressed?: boolean | null;
  created_at?: string | null;
};

async function logEvent(event: string, payload: Record<string, unknown>, leadId?: string | null, actionId?: string | null) {
  const supabase = db();
  await supabase.from('marketing_events').insert({
    lead_id: leadId || null,
    action_id: actionId || null,
    event,
    payload,
  });
}

export async function insertActionIfMissing(input: {
  leadId?: string | null;
  service?: string;
  stage: string;
  channel: MarketingChannel;
  subject: string;
  body: string;
}) {
  const supabase = db();

  let query = supabase
    .from('marketing_actions')
    .select('id')
    .eq('stage', input.stage)
    .neq('status', 'rejected')
    .limit(1);

  if (input.leadId) query = query.eq('lead_id', input.leadId);
  else query = query.is('lead_id', null);

  const { data: existing, error: findError } = await query;
  if (findError) throw findError;
  if (existing && existing.length > 0) return { created: false, id: existing[0].id as string };

  const { data, error } = await supabase
    .from('marketing_actions')
    .insert({
      lead_id: input.leadId || null,
      service: input.service || 'parent-care',
      stage: input.stage,
      channel: input.channel,
      status: 'draft',
      subject: input.subject,
      body: input.body,
      due_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  await logEvent('action_created', { stage: input.stage, channel: input.channel, subject: input.subject }, input.leadId || null, data?.id || null);
  return { created: true, id: data?.id as string };
}

export async function createDailyContent() {
  const topic = topicOfDay();
  const day = todayKey();
  let created = 0;
  const results = [];

  const items = [
    {
      stage: `blog_${day}_${topic.key}`,
      channel: 'blog' as MarketingChannel,
      subject: topic.title,
      body: appendMediaJson(buildBlogBody(topic), buildMediaBrief(topic, 'blog_hero')),
    },
    {
      stage: `sns_${day}_${topic.key}`,
      channel: 'sns' as MarketingChannel,
      subject: `카드뉴스/SNS: ${topic.shortTitle}`,
      body: appendMediaJson(buildSnsBody(topic), buildMediaBrief(topic, 'sns_carousel')),
    },
    {
      stage: `linkedin_${day}_${topic.key}`,
      channel: 'linkedin' as MarketingChannel,
      subject: `LinkedIn: ${topic.focus}이 가족 돌봄 운영에 필요한 이유`,
      body: appendMediaJson(buildLinkedInBody(topic), buildMediaBrief(topic, 'linkedin_card')),
    },
    {
      stage: `youtube_${day}_${topic.key}`,
      channel: 'youtube' as MarketingChannel,
      subject: `YouTube Shorts: ${topic.shortTitle}`,
      body: appendMediaJson(buildYoutubeBody(topic), buildMediaBrief(topic, 'youtube_thumbnail')),
    },
    {
      stage: `ops_${day}_app_care`,
      channel: 'ops' as MarketingChannel,
      subject: `앱 케어 리포트: ${topic.shortTitle}`,
      body: buildOpsReportBody(topic),
    },
  ];

  for (const item of items) {
    const result = await insertActionIfMissing({
      service: 'parent-care',
      stage: item.stage,
      channel: item.channel,
      subject: item.subject,
      body: item.body,
    });
    if (result.created) created++;
    results.push({ ...item, ...result });
  }

  return { ok: true, created, topic, results };
}

export async function createLeadFollowups() {
  const supabase = db();
  const { data: leads, error } = await supabase
    .from('marketing_leads')
    .select('*')
    .eq('suppressed', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  let created = 0;
  let checked = 0;

  for (const lead of (leads || []) as Lead[]) {
    checked++;
    if (!lead.privacy_consent) continue;

    if (!lead.opt_in) {
      const result = await insertActionIfMissing({
        leadId: lead.id,
        service: 'parent-care',
        stage: `consult_task_${lead.id}`,
        channel: 'ops',
        subject: `상담 연락 필요: ${lead.name || '이름 없음'}`,
        body: `광고 수신동의가 없는 상담 신청자입니다. 광고성 메시지를 보내지 말고 상담 요청 처리 범위에서만 연락하세요.\n\n이름: ${lead.name || ''}\n연락처: ${lead.phone || ''}\n이메일: ${lead.email || ''}\n상황: ${lead.situation || ''}`,
      });
      if (result.created) created++;
      continue;
    }

    const result = await insertActionIfMissing({
      leadId: lead.id,
      service: 'parent-care',
      stage: `lead_welcome_${lead.id}`,
      channel: 'email',
      subject: '[광고] 부모님 안심케어 상담 안내',
      body: buildLeadFollowupBody({ name: lead.name, situation: lead.situation }),
    });
    if (result.created) created++;
  }

  return { ok: true, checked, created };
}

export async function runAutonomousAgent() {
  const content = await createDailyContent();
  const followups = await createLeadFollowups();
  await logEvent('autonomous_agent_completed', { content, followups });
  return { ok: true, content, followups };
}
