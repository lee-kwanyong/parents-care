#!/usr/bin/env node
/*
  STEP 4 clean technology integration patch.
  ASCII-only script to avoid PowerShell encoding issues.
  Usage:
    node APPLY_STEP4_TECH_INTEGRATION.js
*/
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const projectRoot = process.cwd()
const patchRoot = path.join(__dirname, 'patch_project')

function log(message) { console.log(`[parents-care-step4] ${message}`) }
function exists(p) { return fs.existsSync(p) }
function mkdir(p) { fs.mkdirSync(p, { recursive: true }) }
function rm(p) { if (exists(p)) fs.rmSync(p, { recursive: true, force: true }) }
function moveIfExists(src, destDir) {
  if (!exists(src)) return
  mkdir(destDir)
  const dest = path.join(destDir, path.basename(src))
  fs.renameSync(src, dest)
  log(`backed up ${path.basename(src)} -> ${path.relative(projectRoot, dest)}`)
}
function copyDir(src, dest) {
  mkdir(dest)
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}
function copyPatch() {
  for (const entry of fs.readdirSync(patchRoot, { withFileTypes: true })) {
    const s = path.join(patchRoot, entry.name)
    const d = path.join(projectRoot, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else {
      if (entry.name === '.env.example' && exists(path.join(projectRoot, '.env.local'))) {
        fs.copyFileSync(s, d)
      } else {
        fs.copyFileSync(s, d)
      }
    }
  }
}
function run(command, args) {
  log(`running: ${command} ${args.join(' ')}`)
  cp.execFileSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
}

if (!exists(path.join(projectRoot, 'package.json'))) {
  console.error('Run this script from the project root that contains package.json.')
  process.exit(1)
}
if (!exists(patchRoot)) {
  console.error('patch_project folder is missing. Extract the zip into the project root first.')
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const backup = path.join(projectRoot, `.legacy-before-step4-${stamp}`)
mkdir(backup)
log(`backup folder: ${path.relative(projectRoot, backup)}`)

const targets = [
  'app', 'components', 'lib', 'src',
  'middleware.ts', 'middleware.js',
  'next.config.ts', 'next.config.mjs',
  'tailwind.config.ts', 'tailwind.config.js',
  'postcss.config.mjs', 'postcss.config.js',
  'tsconfig.json', 'next-env.d.ts',
  'package.json', 'package-lock.json',
  'vercel.json'
]
for (const target of targets) moveIfExists(path.join(projectRoot, target), backup)

copyPatch()
rm(path.join(projectRoot, '.next'))
log('patch copied. root app/components/lib removed from active build. src/app is now the only app router source.')

try {
  run('npm', ['install'])
  run('npm', ['run', 'typecheck'])
  run('npm', ['run', 'build'])
  log('done. You can now run: npm run dev')
} catch (error) {
  console.error('\nBuild commands failed. Check the log above. The source patch was applied and your old files are in the backup folder.')
  process.exit(error.status || 1)
}
