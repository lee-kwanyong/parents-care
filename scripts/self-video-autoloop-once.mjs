import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { spawn } from "child_process";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: false, ...opts });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function callAutoloop() {
  const base = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const key = process.env.CRON_SECRET || process.env.ADMIN_SECRET || "";
  if (!base || !key) {
    console.log("BASE_URL 또는 CRON_SECRET/ADMIN_SECRET이 없어 API 자동루프 호출은 건너뜁니다.");
    return;
  }

  const url = `${base.replace(/\/$/, "")}/api/autoloop/run?key=${encodeURIComponent(key)}`;
  console.log(`자동루프 API 호출: ${url}`);
  const res = await fetch(url, { method: "POST" }).catch((e) => null);
  if (!res) {
    console.log("자동루프 API 호출 실패. 로컬 npm run dev 또는 Vercel 배포 URL을 확인하세요.");
    return;
  }
  const json = await res.json().catch(() => ({}));
  console.log("자동루프 API 결과:", json);
}

async function main() {
  await callAutoloop();
  await run("node", ["scripts/render-autoloop-videos.mjs"]);

  if ((process.env.PUBLISH_AFTER_VIDEO || "true").toLowerCase() === "true") {
    await callAutoloop();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
