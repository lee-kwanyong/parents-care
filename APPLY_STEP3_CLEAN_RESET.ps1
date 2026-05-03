$ErrorActionPreference = "Stop"

Write-Host "[parents-care] STEP 3 clean reset start" -ForegroundColor Cyan

$projectRoot = (Get-Location).Path
$packageJson = Join-Path $projectRoot "package.json"
$cleanRoot = Join-Path $projectRoot "clean"

if (-not (Test-Path $packageJson)) {
  Write-Host "ERROR: package.json was not found. Run this script inside C:\work\parents-care-complete." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $cleanRoot)) {
  Write-Host "ERROR: clean folder was not found. Unzip STEP3_CLEAN_RESET_AFTER_008.zip into the project root first." -ForegroundColor Red
  exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $projectRoot (".legacy-before-step3-" + $stamp)
New-Item -ItemType Directory -Path $backupRoot | Out-Null
Write-Host "Backup folder: $backupRoot" -ForegroundColor DarkGray

# Preserve local environment file if it exists.
$tempEnv = Join-Path $env:TEMP ("parents-care-env-local-" + $stamp + ".tmp")
$envLocal = Join-Path $projectRoot ".env.local"
if (Test-Path $envLocal) {
  Copy-Item $envLocal $tempEnv -Force
  Write-Host "Preserved .env.local" -ForegroundColor DarkGray
}

# Move mixed old source/config files into backup.
$itemsToMove = @(
  "app",
  "components",
  "lib",
  "docs",
  "public",
  "scripts",
  "src",
  "supabase",
  ".env.example",
  ".gitignore",
  "middleware.ts",
  "proxy.ts",
  "next.config.mjs",
  "next.config.ts",
  "next-env.d.ts",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
  "tsconfig.tsbuildinfo",
  "vercel.json",
  "README.md",
  "RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql",
  "REPAIR_IF_PUBLIC_FAMILIES_MISSING.sql"
)

foreach ($item in $itemsToMove) {
  $path = Join-Path $projectRoot $item
  if (Test-Path $path) {
    Move-Item -Path $path -Destination (Join-Path $backupRoot $item) -Force
  }
}

# Remove old build cache. Keep node_modules to save time, npm install will reconcile packages.
$nextCache = Join-Path $projectRoot ".next"
if (Test-Path $nextCache) {
  Remove-Item $nextCache -Recurse -Force
}

# Copy clean parent-care platform project into current folder.
Copy-Item -Path (Join-Path $cleanRoot "*") -Destination $projectRoot -Recurse -Force

# Remove package clean folder after copy to avoid it being included in typecheck/build.
Remove-Item $cleanRoot -Recurse -Force

# Restore .env.local.
if (Test-Path $tempEnv) {
  Copy-Item $tempEnv (Join-Path $projectRoot ".env.local") -Force
  Remove-Item $tempEnv -Force
}

Write-Host "Clean project files copied." -ForegroundColor Green
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Running typecheck..." -ForegroundColor Cyan
npm run typecheck

Write-Host "Running production build..." -ForegroundColor Cyan
npm run build

Write-Host "STEP 3 complete. Run: npm run dev" -ForegroundColor Green
