#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

RESTORE_TAG="admin-unified-hub-before-20260615-152220"

if [ -n "$RESTORE_TAG" ]; then
  echo "관리자 통합 허브 수정 전 상태로 되돌립니다."
  echo "되돌릴 기준: $RESTORE_TAG"
  git reset --hard "$RESTORE_TAG"
else
  echo "admin-unified-hub-before-* 롤백 태그를 찾지 못했습니다."
  echo "수동으로 git log를 확인한 뒤 되돌려야 합니다."
  exit 1
fi
