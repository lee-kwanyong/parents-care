import { db } from '@/lib/marketing/supabase';
import { stripMediaJson } from '@/lib/marketing/creative';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ stage: string }> | { stage: string } };

function esc(input: string) {
  return (input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitLines(text: string, maxLen: number, maxLines: number) {
  const words = (text || '').replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLen && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : ['부모님 안심케어'];
}

export async function GET(_request: Request, { params }: Params) {
  const resolved = await params;
  const stage = decodeURIComponent(resolved.stage);
  let title = '부모님 안심케어';
  let subtitle = '매일 전화하지 못해도 부모님 상태는 놓치지 않도록';
  let channel = 'care';

  try {
    const supabase = db();
    const { data } = await supabase
      .from('marketing_actions')
      .select('subject, body, channel')
      .eq('stage', stage)
      .limit(1)
      .single();

    if (data?.subject) title = data.subject;
    if (data?.body) {
      const cleaned = stripMediaJson(data.body).replace(/[#*\-]/g, '').replace(/\s+/g, ' ').trim();
      subtitle = cleaned.slice(0, 115) || subtitle;
    }
    if (data?.channel) channel = data.channel;
  } catch {
    // fallback SVG is still useful even when DB lookup fails.
  }

  const titleLines = splitLines(title, 22, 3);
  const subtitleLines = splitLines(subtitle, 40, 2);
  const badge = channel === 'youtube' ? 'SHORTS' : channel === 'linkedin' ? 'LINKEDIN' : channel === 'sns' ? 'SNS' : 'BLOG';

  const titleSvg = titleLines
    .map((line, i) => `<text x="72" y="${260 + i * 72}" font-size="56" font-weight="800" fill="#10203a">${esc(line)}</text>`)
    .join('');

  const subtitleSvg = subtitleLines
    .map((line, i) => `<text x="76" y="${520 + i * 42}" font-size="30" font-weight="500" fill="#3f5270">${esc(line)}</text>`)
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7ed"/>
      <stop offset="0.55" stop-color="#eff6ff"/>
      <stop offset="1" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="phone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="1020" cy="120" r="210" fill="#bfdbfe" opacity="0.55"/>
  <circle cx="1080" cy="560" r="260" fill="#fed7aa" opacity="0.45"/>
  <rect x="72" y="72" rx="28" ry="28" width="244" height="56" fill="#1d4ed8"/>
  <text x="96" y="109" font-size="25" font-weight="800" fill="white">부모님 안심케어</text>
  <rect x="336" y="72" rx="28" ry="28" width="130" height="56" fill="white" opacity="0.9"/>
  <text x="371" y="109" font-size="24" font-weight="800" fill="#1d4ed8">${esc(badge)}</text>
  ${titleSvg}
  ${subtitleSvg}
  <g transform="translate(840 205)">
    <rect x="0" y="0" width="225" height="360" rx="36" fill="url(#phone)" opacity="0.97"/>
    <rect x="20" y="42" width="185" height="270" rx="18" fill="#f8fafc"/>
    <rect x="46" y="75" width="133" height="18" rx="9" fill="#bfdbfe"/>
    <rect x="46" y="120" width="133" height="18" rx="9" fill="#dbeafe"/>
    <rect x="46" y="165" width="133" height="18" rx="9" fill="#dbeafe"/>
    <rect x="46" y="210" width="133" height="18" rx="9" fill="#dbeafe"/>
    <circle cx="52" cy="84" r="10" fill="#22c55e"/>
    <circle cx="52" cy="129" r="10" fill="#22c55e"/>
    <circle cx="52" cy="174" r="10" fill="#22c55e"/>
    <circle cx="52" cy="219" r="10" fill="#22c55e"/>
    <text x="46" y="282" font-size="24" font-weight="800" fill="#1e293b">안심 리포트 도착</text>
  </g>
  <text x="76" y="635" font-size="24" font-weight="700" fill="#1d4ed8">parents-care.net</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
