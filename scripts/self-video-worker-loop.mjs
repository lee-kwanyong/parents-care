import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { spawn } from "child_process";

const intervalMin = Number(process.env.WORKER_INTERVAL_MINUTES || 60);

function runOnce() {
  return new Promise((resolve) => {
    const p = spawn("node", ["scripts/self-video-autoloop-once.mjs"], { stdio: "inherit" });
    p.on("exit", () => resolve());
  });
}

async function main() {
  console.log(`Parents Care self-video worker 시작. interval=${intervalMin}분`);
  while (true) {
    await runOnce();
    await new Promise((r) => setTimeout(r, intervalMin * 60 * 1000));
  }
}

main();
