#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "부모님 안부 앱 수정 전 상태로 되돌립니다."
echo "되돌릴 기준: mobile-parent-before-20260614-213643"
echo ""

git reset --hard "mobile-parent-before-20260614-213643"

echo ""
echo "로컬 롤백 완료."
echo "Vercel 배포까지 되돌리려면 아래 명령을 실행하세요."
echo "git push --force-with-lease origin main"
