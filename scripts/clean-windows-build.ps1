$ErrorActionPreference = "SilentlyContinue"
Remove-Item .next -Recurse -Force
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
npm run typecheck
npm run build
