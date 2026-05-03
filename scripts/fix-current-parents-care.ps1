$ErrorActionPreference = "Stop"

function Write-Utf8File($Path, $Content) {
  $dir = Split-Path $Path -Parent
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

function Backup-IfExists($Path) {
  if (Test-Path $Path) {
    $stamp = Get-Date -Format "yyyyMMddHHmmss"
    Copy-Item $Path "$Path.bak.$stamp" -Force
  }
}

Write-Host "[parents-care hotfix] start"

# 1) src 구조 고정: Next가 root app과 src/app을 동시에 보지 않도록 정리
if (!(Test-Path "src")) { New-Item -ItemType Directory -Force -Path "src" | Out-Null }
foreach ($dir in @("app", "components", "lib")) {
  $rootPath = $dir
  $srcPath = Join-Path "src" $dir
  if ((Test-Path $rootPath) -and !(Test-Path $srcPath)) {
    Move-Item $rootPath $srcPath
    Write-Host "[move] $rootPath -> $srcPath"
  } elseif ((Test-Path $rootPath) -and (Test-Path $srcPath)) {
    $disabled = "_${dir}_legacy_disabled"
    if (Test-Path $disabled) { Remove-Item $disabled -Recurse -Force }
    Move-Item $rootPath $disabled
    Write-Host "[disable duplicate] $rootPath -> $disabled"
  }
}

# Next.js 16 경고 제거: middleware.ts 대신 proxy.ts 사용
if (Test-Path "middleware.ts") {
  if (!(Test-Path "src/proxy.ts")) { Copy-Item "middleware.ts" "src/proxy.ts" }
  Move-Item "middleware.ts" "_middleware_legacy_disabled.ts" -Force
  Write-Host "[proxy] root middleware.ts disabled"
}
if (Test-Path "src/middleware.ts") {
  if (!(Test-Path "src/proxy.ts")) { Copy-Item "src/middleware.ts" "src/proxy.ts" }
  Move-Item "src/middleware.ts" "src/_middleware_legacy_disabled.ts" -Force
  Write-Host "[proxy] src/middleware.ts disabled"
}

# 2) tsconfig alias 고정
Backup-IfExists "tsconfig.json"
Write-Utf8File "tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "_app_legacy_disabled", "_components_legacy_disabled", "_lib_legacy_disabled"]
}
'@

# 3) package.json 의존성 보강
if (Test-Path "package.json") {
  $nodePatch = @'
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.dependencies = p.dependencies || {};
p.devDependencies = p.devDependencies || {};
Object.assign(p.dependencies, {
  clsx: p.dependencies.clsx || 'latest',
  next: p.dependencies.next || 'latest',
  react: p.dependencies.react || 'latest',
  'react-dom': p.dependencies['react-dom'] || 'latest'
});
Object.assign(p.devDependencies, {
  typescript: p.devDependencies.typescript || 'latest',
  '@types/node': p.devDependencies['@types/node'] || 'latest',
  '@types/react': p.devDependencies['@types/react'] || 'latest',
  '@types/react-dom': p.devDependencies['@types/react-dom'] || 'latest',
  tailwindcss: p.devDependencies.tailwindcss || 'latest',
  postcss: p.devDependencies.postcss || 'latest',
  autoprefixer: p.devDependencies.autoprefixer || 'latest'
});
p.scripts = p.scripts || {};
p.scripts.typecheck = p.scripts.typecheck || 'tsc --noEmit';
p.scripts.build = p.scripts.build || 'next build';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
'@
  Write-Utf8File ".hotfix-package.cjs" $nodePatch
  node .hotfix-package.cjs
  Remove-Item .hotfix-package.cjs -Force
  Write-Host "[package] dependencies patched"
}

# 4) 누락된 constants export 보강
if (!(Test-Path "src/lib/constants.ts")) { Write-Utf8File "src/lib/constants.ts" "" }
$constants = Get-Content "src/lib/constants.ts" -Raw
if ($constants -notmatch "pickupModeLabels") {
  Add-Content "src/lib/constants.ts" @'

export const pickupModeLabels: Record<string, string> = {
  hospital_front_meet: '병원 앞 만남',
  home_front_taxi_accompany: '집 앞 만남 후 택시 동행',
  home_front_meet_taxi: '집 앞 만남 후 택시 동행',
  partner_mobility_support: '이동지원 제휴 이용',
  mobility_partner: '이동지원 제휴 연결',
  manager_vehicle_info_only: '매니저 차량 보유 정보 표시',
  direct_transport_partner: '직접 운송 제휴 서비스'
};
'@
}
$constants = Get-Content "src/lib/constants.ts" -Raw
if ($constants -notmatch "vehiclePolicyText") {
  Add-Content "src/lib/constants.ts" @'

export const vehiclePolicyText =
  '차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않으며, 기본 이동은 병원 앞 만남·집 앞 만남 후 택시 동행·이동지원 제휴 기준으로 운영됩니다.';
'@
}

# 5) 오래된 화면과 최신 타입이 섞여도 깨지지 않는 호환 컴포넌트 작성
Write-Utf8File "src/components/AppShell.tsx" @'
import Link from 'next/link';
import type { ReactNode } from 'react';

const nav = [
  ['/', '홈'],
  ['/child', '자녀앱'],
  ['/parent/today', '부모님'],
  ['/manager/today', '매니저'],
  ['/ops', '운영실']
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">부모님 케어 플랫폼</Link>
          <nav className="flex flex-wrap gap-2 text-sm font-bold text-slate-700">
            {nav.map(([href, label]) => <Link key={href} href={href} className="rounded-full bg-slate-100 px-3 py-2">{label}</Link>)}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
'@

Write-Utf8File "src/components/Card.tsx" @'
import type { ReactNode } from 'react';

type CardProps = { children: ReactNode; className?: string };

export function Card({ children, className = '' }: CardProps) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function CardTitle({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-4">
      {eyebrow ? <p className="text-sm font-bold text-blue-700">{eyebrow}</p> : null}
      <h2 className="text-xl font-black tracking-tight text-slate-950">{children}</h2>
    </div>
  );
}
'@

Write-Utf8File "src/components/BigButton.tsx" @'
import type { ReactNode } from 'react';

export function BigButton({ children, href, danger = false }: { children: ReactNode; href?: string; danger?: boolean }) {
  const className = `flex min-h-16 items-center justify-center rounded-3xl px-5 text-center text-xl font-black shadow-sm ${danger ? 'bg-red-600 text-white' : 'bg-blue-700 text-white'}`;
  if (href) return <a className={className} href={href}>{children}</a>;
  return <button className={className} type="button">{children}</button>;
}
'@

Write-Utf8File "src/components/StatusTimeline.tsx" @'
type TimelineLike = {
  id?: string;
  title: string;
  description?: string;
  status?: string;
  time?: string;
  scheduledAt?: string;
  actualAt?: string;
  note?: string;
  actor?: string;
};

export function StatusTimeline({ items }: { items: TimelineLike[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => {
        const time = item.actualAt ?? item.scheduledAt ?? item.time ?? '시간 미정';
        const note = item.note ?? item.description;
        return (
          <li key={item.id ?? `${item.title}-${index}`} className="grid grid-cols-[28px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</div>
              {index !== items.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h3 className="font-semibold text-slate-950">{item.title}</h3>
                <span className="text-sm text-slate-500">{time}</span>
              </div>
              {item.status ? <p className="mt-1 text-xs font-bold text-blue-700">{item.status}</p> : null}
              {note ? <p className="mt-2 text-sm text-slate-700">{note}</p> : null}
              {item.actor ? <p className="mt-2 text-xs text-slate-500">업데이트: {item.actor}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
'@

Write-Utf8File "src/components/ReportCard.tsx" @'
type ReportLike = {
  visitSummary: string;
  doctorInstructions: string[];
  tests: string[];
  medications: string[];
  nextAppointment?: string;
  cost: string;
  condition?: string;
  parentCondition?: string;
  nextActions?: string[];
  guardianNextActions?: string[];
};

export function ReportCard({ report }: { report: ReportLike }) {
  const condition = report.condition ?? report.parentCondition ?? '특이사항 없음';
  const nextActions = report.nextActions ?? report.guardianNextActions ?? [];
  return (
    <div className="space-y-4">
      <ReportSection title="진료 진행 내용" items={[report.visitSummary]} />
      <ReportSection title="의료진 안내사항" items={report.doctorInstructions} />
      <ReportSection title="검사/약/다음 예약" items={[...report.tests, ...report.medications, report.nextAppointment ?? '다음 예약 없음']} />
      <ReportSection title="비용" items={[report.cost]} />
      <ReportSection title="부모님 컨디션" items={[condition]} />
      <ReportSection title="가족이 해야 할 다음 액션" items={nextActions.length ? nextActions : ['확인할 다음 액션 없음']} highlight />
    </div>
  );
}

function ReportSection({ title, items, highlight }: { title: string; items: string[]; highlight?: boolean }) {
  return (
    <section className={highlight ? 'rounded-2xl bg-blue-50 p-4' : 'rounded-2xl bg-slate-50 p-4'}>
      <h3 className="font-bold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
        {items.map((item, index) => <li key={`${title}-${index}`}>• {item}</li>)}
      </ul>
    </section>
  );
}
'@

Write-Utf8File "src/components/VehiclePolicyBadge.tsx" @'
import { vehiclePolicyText } from '@/lib/constants';

export function VehiclePolicyBadge({ hasVehicle, directTransportEligible, directTransportAllowed }: { hasVehicle: boolean; directTransportEligible?: boolean; directTransportAllowed?: boolean }) {
  const direct = Boolean(directTransportEligible ?? directTransportAllowed);
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 font-semibold">차량 보유: {hasVehicle ? '있음' : '없음'}</span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold">직접 운송 가능: {direct ? '별도 승인 필요' : '기본 미포함'}</span>
      </div>
      <p className="mt-3 leading-6">{vehiclePolicyText}</p>
    </div>
  );
}
'@

Write-Utf8File "src/components/ManagerTrustCard.tsx" @'
import { demoManager } from '@/lib/mock-data';
import { VehiclePolicyBadge } from './VehiclePolicyBadge';

type ManagerLike = {
  name: string;
  approved?: boolean;
  specialties?: string[];
  regions?: string[];
  completedCount?: number;
  ratingAverage?: number;
  hasVehicle?: boolean;
  directTransportEligible?: boolean;
  directTransportAllowed?: boolean;
  trustScore?: number;
};

export function ManagerTrustCard({ manager = demoManager }: { manager?: ManagerLike }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">매니저 신뢰카드</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{manager.name}</h2>
          <p className="mt-1 text-sm text-slate-600">완료 {manager.completedCount ?? 0}건 · 평균평점 {(manager.ratingAverage ?? 0).toFixed(1)} · 안심도 {manager.trustScore ?? 90}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{manager.approved === false ? '심사 중' : '심사 승인'}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Info label="전문분야" value={(manager.specialties ?? ['병원동행']).join(', ')} />
        <Info label="가능지역" value={(manager.regions ?? ['서울']).join(', ')} />
      </div>
      <VehiclePolicyBadge hasVehicle={Boolean(manager.hasVehicle)} directTransportEligible={manager.directTransportEligible ?? manager.directTransportAllowed} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-900">{value}</p></div>;
}
'@

# 6) 오래된 화면이 기대하는 mock-data 작성
Write-Utf8File "src/lib/mock-data.ts" @'
import { vehiclePolicyText } from './constants';

export const demoTimeline = [
  { id: '1', title: '도착 전 연락', scheduledAt: '08:10', actualAt: '08:08', note: '매니저가 어머니께 도착 전 전화를 드렸습니다.', actor: '김안심 매니저', status: '완료' },
  { id: '2', title: '만남 암호 확인', scheduledAt: '08:40', note: '만남 암호 4821 확인 예정입니다.', actor: '김안심 매니저', status: '예정' },
  { id: '3', title: '집 앞 만남 후 택시 동행', scheduledAt: '08:50', note: '매니저 개인차량 직접 유상운송이 아니라 택시 동행 방식입니다.', actor: '운영실', status: '정책 확인' },
  { id: '4', title: '병원 접수', scheduledAt: '09:30', note: '접수와 대기번호를 보호자에게 공유합니다.', actor: '김안심 매니저', status: '대기' },
  { id: '5', title: '리포트 검수·발송', scheduledAt: '12:30', note: '운영실 검수 후 보호자에게 발송합니다.', actor: '운영실', status: '예정' }
];

export const demoManager = {
  name: '김안심 매니저',
  approved: true,
  specialties: ['정형외과', '내과', '검진센터'],
  regions: ['강남구', '서초구', '송파구'],
  completedCount: 148,
  ratingAverage: 4.8,
  trustScore: 94,
  hasVehicle: true,
  directTransportEligible: false,
  directTransportAllowed: false,
  vehiclePolicyText
};

export const demoReport = {
  visitSummary: '무릎 통증 경과 확인을 위해 정형외과 외래 진료를 진행했습니다. 접수와 진료실 이동, 수납, 약국 방문까지 매니저가 동행했습니다.',
  doctorInstructions: ['무릎 사용량 조절', '물리치료 주 2회 권장', '통증이 갑자기 심해지면 조기 내원'],
  tests: ['X-ray 확인: 큰 변화 없음', '혈압 측정: 정상 범위'],
  medications: ['소염진통제 5일분', '위장 보호제 5일분'],
  nextAppointment: '2026-05-20 10:20 정형외과 재진',
  cost: '진료비 8,600원 / 약제비 4,200원 / 택시비 실비 별도',
  condition: '대기 시간이 길어 약간 피곤해하셨으나 귀가 시 보행은 안정적이었습니다.',
  parentCondition: '대기 시간이 길어 약간 피곤해하셨으나 귀가 시 보행은 안정적이었습니다.',
  nextActions: ['물리치료 예약 가능 시간 확인', '저녁 약 복용 여부 전화 확인', '다음 예약일 가족 캘린더 등록'],
  guardianNextActions: ['물리치료 예약 가능 시간 확인', '저녁 약 복용 여부 전화 확인', '다음 예약일 가족 캘린더 등록'],
  status: 'sent'
};
'@

# 7) Tailwind 설정이 남아 있는 프로젝트에서 build가 tailwindcss를 찾도록 설치
Write-Host "[npm] installing dependencies"
npm install

Write-Host "[check] typecheck"
npm run typecheck

Write-Host "[check] build"
npm run build

Write-Host "[parents-care hotfix] done"
