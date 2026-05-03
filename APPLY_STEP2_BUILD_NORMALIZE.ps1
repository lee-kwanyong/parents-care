$ErrorActionPreference = "Stop"

Write-Host "[parents-care] STEP 2: 로컬 프로젝트 구조 정리 + 빌드 안정화 시작" -ForegroundColor Cyan

$projectRoot = Get-Location
$patchRoot = Join-Path $PSScriptRoot "patch"

if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
  Write-Host "현재 위치에 package.json이 없습니다." -ForegroundColor Red
  Write-Host "먼저 C:\work\parents-care-complete 로 이동한 뒤 다시 실행하세요." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $patchRoot)) {
  Write-Host "patch 폴더를 찾지 못했습니다." -ForegroundColor Red
  Write-Host "이 ZIP을 프로젝트 루트에 압축해제한 뒤 실행하세요." -ForegroundColor Yellow
  exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $projectRoot ".legacy-before-step2-$stamp"
New-Item -ItemType Directory -Path $backupDir | Out-Null
Write-Host "백업 폴더: $backupDir" -ForegroundColor DarkGray

# Next.js가 루트 app을 우선 잡아 빌드하는 문제를 막기 위해, 중복/구버전 구조를 백업으로 이동합니다.
$legacyItems = @(
  "app",
  "components",
  "lib",
  "src",
  "middleware.ts",
  "next.config.ts",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "tsconfig.tsbuildinfo"
)

foreach ($item in $legacyItems) {
  $path = Join-Path $projectRoot $item
  if (Test-Path $path) {
    Write-Host "백업 이동: $item" -ForegroundColor DarkGray
    Move-Item -Path $path -Destination (Join-Path $backupDir $item) -Force
  }
}

# 빌드 캐시 제거
$cacheItems = @(".next", ".turbo")
foreach ($item in $cacheItems) {
  $path = Join-Path $projectRoot $item
  if (Test-Path $path) {
    Write-Host "캐시 삭제: $item" -ForegroundColor DarkGray
    Remove-Item -Recurse -Force $path
  }
}

# clean src 기반 프로젝트를 덮어씁니다. .env.local은 건드리지 않습니다.
Write-Host "clean src 기반 프로젝트 파일 적용" -ForegroundColor Cyan
Copy-Item -Path (Join-Path $patchRoot "*") -Destination $projectRoot -Recurse -Force

# 로컬 환경변수 파일이 없으면 예시를 복사합니다.
$envLocal = Join-Path $projectRoot ".env.local"
$envExample = Join-Path $projectRoot ".env.example"
if (-not (Test-Path $envLocal) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envLocal
  Write-Host ".env.local 생성됨: Supabase URL/key를 입력하세요." -ForegroundColor Yellow
}

Write-Host "npm install 실행" -ForegroundColor Cyan
npm install

Write-Host "typecheck 실행" -ForegroundColor Cyan
npm run typecheck

Write-Host "build 실행" -ForegroundColor Cyan
npm run build

Write-Host "완료: 이제 npm run dev 로 확인하세요." -ForegroundColor Green
