#!/usr/bin/env node
/*
  STEP 5: Supabase Auth + real worry intake persistence.
  Run from project root:
    node APPLY_STEP5_AUTH_REAL_INTAKE.js
*/
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const projectRoot = process.cwd()
const patchRoot = path.join(projectRoot, 'patch_project')

function log(message) { console.log(`[parents-care-step5] ${message}`) }
function exists(p) { return fs.existsSync(p) }
function mkdir(p) { fs.mkdirSync(p, { recursive: true }) }
function backupFile(src, backupRoot) {
  if (!exists(src)) return
  const rel = path.relative(projectRoot, src)
  const dest = path.join(backupRoot, rel)
  mkdir(path.dirname(dest))
  fs.copyFileSync(src, dest)
}
function copyRecursive(src, dest, backupRoot) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    mkdir(dest)
    for (const entry of fs.readdirSync(src)) copyRecursive(path.join(src, entry), path.join(dest, entry), backupRoot)
    return
  }
  backupFile(dest, backupRoot)
  mkdir(path.dirname(dest))
  fs.copyFileSync(src, dest)
  log(`copy ${path.relative(projectRoot, dest)}`)
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
  console.error('patch_project folder is missing. Extract STEP5 zip into the project root first.')
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const backup = path.join(projectRoot, `.backup-before-step5-${stamp}`)
mkdir(backup)
log(`backup folder: ${path.relative(projectRoot, backup)}`)

copyRecursive(patchRoot, projectRoot, backup)

const pkgPath = path.join(projectRoot, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
pkg.dependencies = pkg.dependencies || {}
pkg.devDependencies = pkg.devDependencies || {}
pkg.dependencies['@supabase/ssr'] = pkg.dependencies['@supabase/ssr'] || '^0.7.0'
pkg.dependencies['@supabase/supabase-js'] = pkg.dependencies['@supabase/supabase-js'] || '^2.49.4'
pkg.dependencies['zod'] = pkg.dependencies['zod'] || '^3.24.2'
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

try {
  run('npm', ['install'])
  run('npm', ['run', 'typecheck'])
  run('npm', ['run', 'build'])
  log('done. Next: run 010_AUTH_REAL_INTAKE.sql in Supabase, then npm run dev')
} catch (error) {
  console.error('\nSTEP5 files were copied, but install/typecheck/build failed. Check the log above. Your previous files are backed up.')
  process.exit(error.status || 1)
}
