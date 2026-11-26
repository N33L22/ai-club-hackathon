# Runs ClaimTrace on this PC from a copy outside OneDrive.
#
#   npm run local            (http://localhost:3000)
#   npm run local -- -Port 3100
#
# Why: OneDrive locks Next.js's build folder (.next) while it syncs it, which
# crashes `npm run dev` with EPERM errors. This copies the project (code and
# .env.local; never node_modules) to %LOCALAPPDATA%\claimtrace-run, installs
# dependencies there on the first run, builds, and starts the app. Run it again
# after editing code: only changed files are copied.
param([int]$Port = 3000, [switch]$NoBrowser)
$ErrorActionPreference = "Stop"

$src = Split-Path -Parent $PSScriptRoot
$dst = Join-Path $env:LOCALAPPDATA "claimtrace-run"
$stamp = ".deps-hash"

Write-Host "1/4 Copying the project to $dst (outside OneDrive)..." -ForegroundColor Cyan
robocopy $src $dst /MIR /XD node_modules .next /XF tsconfig.tsbuildinfo $stamp /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Copying failed (robocopy exit code $LASTEXITCODE)." }
Set-Location $dst

$lock = (Get-FileHash package-lock.json).Hash
if (-not (Test-Path node_modules) -or -not (Test-Path $stamp) -or ((Get-Content $stamp -Raw).Trim() -ne $lock)) {
  Write-Host "2/4 Installing dependencies (first run or after a dependency change, about a minute)..." -ForegroundColor Cyan
  npm ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
  Set-Content $stamp $lock
} else {
  Write-Host "2/4 Dependencies are up to date." -ForegroundColor Cyan
}

$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($busy) { throw "Port $Port is already in use (process $($busy.OwningProcess)). Stop it, or run: npm run local -- -Port 3100" }

Write-Host "3/4 Building (about a minute)..." -ForegroundColor Cyan
npx next build
if ($LASTEXITCODE -ne 0) { throw "The build failed; see the errors above." }

Write-Host "4/4 Starting ClaimTrace at http://localhost:$Port (press Ctrl+C or close this window to stop)" -ForegroundColor Green
if (-not $NoBrowser) {
  # open the browser only once the app answers, so nobody sees "failed to load" while it starts
  $url = "http://localhost:$Port"
  Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-Command", "for (`$i = 0; `$i -lt 120; `$i++) { try { if ((Invoke-WebRequest -UseBasicParsing '$url/api/health' -TimeoutSec 2).StatusCode -eq 200) { Start-Process '$url'; break } } catch {}; Start-Sleep -Milliseconds 500 }"
}
npx next start -p $Port
