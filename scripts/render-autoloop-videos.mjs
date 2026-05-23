import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { execFile as execFileCb } from "child_process";
import { promisify } from "util";

const execFile = promisify(execFileCb);

const PROJECT_ROOT = process.cwd();
const OUT_DIR = path.join(PROJECT_ROOT, "tmp", "rendered-videos");
const BUCKET = process.env.MARKETING_VIDEO_BUCKET || "marketing-videos";

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} 환경변수가 없습니다.`);
  return v;
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function xml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function existsCommand(cmd) {
  try {
    await execFile("bash", ["-lc", `command -v ${cmd}`]);
    return true;
  } catch {
    return false;
  }
}

function wrapLines(text, max = 13) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function verticalSvg({ headline, body, footer }, idx, campaignTitle) {
  const backgrounds = ["#172554", "#1e3a8a", "#2563eb", "#0f766e", "#7c3aed", "#be123c"];
  const bg = backgrounds[idx % backgrounds.length];
  const headlineLines = wrapLines(headline || campaignTitle || "부모님 안심케어", 11);
  const bodyLines = wrapLines(body || "부모님 하루는 놓치지 않게", 15);

  const headlineTspans = headlineLines
    .map((line, i) => `<tspan x="90" dy="${i === 0 ? 0 : 92}">${xml(line)}</tspan>`)
    .join("");
  const bodyTspans = bodyLines
    .map((line, i) => `<tspan x="90" dy="${i === 0 ? 0 : 62}">${xml(line)}</tspan>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="${bg}"/>
  <circle cx="900" cy="210" r="260" fill="rgba(255,255,255,0.12)"/>
  <circle cx="110" cy="1700" r="320" fill="rgba(255,255,255,0.10)"/>
  <rect x="64" y="70" width="952" height="1780" rx="54" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.20)" stroke-width="4"/>
  <text x="90" y="170" fill="#dbeafe" font-size="38" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-weight="800">부모님 안심케어</text>
  <text x="90" y="620" fill="#ffffff" font-size="82" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-weight="900">${headlineTspans}</text>
  <text x="90" y="1040" fill="#eff6ff" font-size="54" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-weight="800">${bodyTspans}</text>
  <rect x="90" y="1510" width="760" height="88" rx="44" fill="rgba(255,255,255,0.18)"/>
  <text x="130" y="1568" fill="#ffffff" font-size="36" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-weight="800">${xml(footer || "parents-care.net")}</text>
  <text x="90" y="1740" fill="#bfdbfe" font-size="34" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-weight="700">상담 신청 parents-care.net</text>
</svg>`;
}

function fallbackCards(campaign) {
  return [
    { headline: "매일 전화하지 못해도", body: "부모님 하루는 놓치지 않게", footer: "부모님 안심케어" },
    { headline: "혼자 계신 부모님", body: "식사·복약·컨디션 변화가 걱정된다면", footer: campaign.keyword || "안부 확인" },
    { headline: "확인해야 할 4가지", body: "안부 · 식사 · 복약 · 외출", footer: "생활 루틴 체크" },
    { headline: "자녀에게 필요한 건", body: "막연한 걱정보다 확인 기록", footer: "안심 리포트" },
    { headline: "부모님 안심케어", body: "정기 확인과 요약 리포트", footer: "상황별 케어 주기" },
    { headline: "상담 신청", body: "부모님 상황에 맞는 확인 주기 안내", footer: "parents-care.net" },
  ];
}

function narrationFromCampaign(campaign) {
  const scenes = campaign.video_script?.scenes || campaign.video_brief?.scenes || [];
  const lines = scenes.map((s) => s.narration || s.caption).filter(Boolean);
  if (lines.length > 0) return lines.join(" ");
  return `부모님을 매일 챙기고 싶지만 쉽지 않다면, 부모님 안심케어가 안부, 식사, 복약, 생활 변화를 정기적으로 확인합니다. 상담 신청은 parents-care.net 입니다.`;
}

async function createTtsAudio(text, workDir) {
  const hasSay = await existsCommand("say");
  if (!hasSay) return null;

  const aiff = path.join(workDir, "narration.aiff");
  const m4a = path.join(workDir, "narration.m4a");
  const voice = process.env.MAC_TTS_VOICE || "Yuna";

  try {
    await execFile("say", ["-v", voice, "-o", aiff, text], { timeout: 120000 });
  } catch {
    await execFile("say", ["-o", aiff, text], { timeout: 120000 });
  }

  await execFile("ffmpeg", ["-y", "-i", aiff, "-ar", "44100", "-ac", "2", m4a], { timeout: 120000 });
  return m4a;
}

async function renderCampaign(campaign) {
  const hasFfmpeg = await existsCommand("ffmpeg");
  if (!hasFfmpeg) {
    throw new Error("ffmpeg가 없습니다. 맥에서 `brew install ffmpeg` 후 다시 실행하세요.");
  }

  const cards = Array.isArray(campaign.cards) && campaign.cards.length ? campaign.cards : fallbackCards(campaign);
  const workDir = path.join(OUT_DIR, campaign.id);
  await fs.mkdir(workDir, { recursive: true });

  const imageFiles = [];
  for (let i = 0; i < Math.min(cards.length, 6); i += 1) {
    const svg = verticalSvg(cards[i], i, campaign.title);
    const png = path.join(workDir, `slide-${i}.png`);
    await sharp(Buffer.from(svg)).png().toFile(png);
    imageFiles.push(png);
  }

  const concat = ["ffconcat version 1.0"];
  for (const file of imageFiles) {
    concat.push(`file '${file.replaceAll("'", "'\\''")}'`);
    concat.push("duration 5.8");
  }
  concat.push(`file '${imageFiles[imageFiles.length - 1].replaceAll("'", "'\\''")}'`);
  const concatFile = path.join(workDir, "slides.ffconcat");
  await fs.writeFile(concatFile, concat.join("\n"), "utf-8");

  const silent = path.join(workDir, "silent.mp4");
  await execFile(
    "ffmpeg",
    [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatFile,
      "-vf", "scale=1080:1920,format=yuv420p",
      "-r", "30",
      "-movflags", "+faststart",
      silent,
    ],
    { timeout: 300000 }
  );

  const narration = narrationFromCampaign(campaign);
  const audio = await createTtsAudio(narration, workDir).catch(() => null);

  const output = path.join(workDir, "output.mp4");
  if (audio) {
    await execFile(
      "ffmpeg",
      ["-y", "-i", silent, "-i", audio, "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", output],
      { timeout: 300000 }
    );
  } else {
    await fs.copyFile(silent, output);
  }

  return output;
}

async function ensureBucket() {
  try {
    await supabase.storage.createBucket(BUCKET, { public: true });
  } catch {
    // bucket exists or permission issue; upload will reveal if it matters
  }
}

async function uploadVideo(campaign, filePath) {
  await ensureBucket();
  const buffer = await fs.readFile(filePath);
  const storagePath = `autoloop/${campaign.id}.mp4`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) throw new Error(`Supabase Storage 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function mark(campaignId, patch) {
  await supabase
    .from("auto_marketing_campaigns")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
}

async function loadTargets() {
  let q = supabase
    .from("auto_marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Number(process.env.RENDER_VIDEO_LIMIT || 10));

  if (process.env.RENDER_UNAPPROVED === "true") {
    q = q.is("video_url", null);
  } else {
    q = q.eq("status", "approved").is("video_url", null);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const targets = await loadTargets();
  console.log(`렌더링 대상: ${targets.length}개`);

  for (const campaign of targets) {
    console.log(`\n▶ 렌더링 시작: ${campaign.title}`);
    await mark(campaign.id, { video_status: "rendering" });

    try {
      const mp4 = await renderCampaign(campaign);
      const url = await uploadVideo(campaign, mp4);
      await mark(campaign.id, {
        video_status: "rendered_self",
        video_url: url,
      });
      console.log(`✅ 완료: ${url}`);
    } catch (err) {
      await mark(campaign.id, {
        video_status: "render_failed",
      });
      console.error(`❌ 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
