#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "스마트링 보호자 리포트 수정 전 상태로 되돌립니다."
echo "되돌릴 기준: guardian-ring-report-before-20260614-205709"
echo ""

git reset --hard "guardian-ring-report-before-20260614-205709"

echo ""
echo "로컬 롤백 완료."
echo "Vercel 배포까지 되돌리려면 아래 명령을 실행하세요."
echo "git push --force-with-lease origin main"
