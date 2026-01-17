param([switch]$UseRailwayUp)

# One-command deploy to Railway (HomeStagePro / production)

$ErrorActionPreference = "Stop"

function Require-Cmd($cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "Missing command: $cmd. Install it first."
  }
}

Require-Cmd "git"
Require-Cmd "railway"

Write-Host "== HomeStagePro deploy =="

# 1) Ensure railway auth
try {
  $who = railway whoami 2>$null
  if ($LASTEXITCODE -ne 0) { throw "not authed" }
} catch {
  Write-Host "Railway not authenticated. Running: railway login"
  railway login
}

# 2) Ensure repo is linked to correct project/service
# (This will fail if not linked; we prompt to link.)
try {
  $status = railway status 2>$null
  if ($LASTEXITCODE -ne 0) { throw "not linked" }
  Write-Host $status
} catch {
  Write-Host "Repo not linked to Railway project/service. Running: railway link"
  railway link
  railway status
}

# 3) Optional: commit & push if there are changes
$gitStatus = git status --porcelain
if ($gitStatus) {
  Write-Host "Uncommitted changes detected."
  $msg = Read-Host "Enter commit message (or leave blank to skip commit/push)"
  if ($msg) {
    git add -A
    git commit -m $msg
    git push
  } else {
    Write-Host "Skipping commit/push. (Railway will deploy the last pushed commit.)"
  }
} else {
  Write-Host "Working tree clean."
}

# 4) Deploy
# This triggers a deploy in the linked project/environment/service.
if ($UseRailwayUp) {
  Write-Host "Triggering Railway deploy..."
  railway up --detach
} else {
  Write-Host "Skipping railway up. Push to main will deploy via Railway GitHub integration."
}

Write-Host "Deploy triggered. Check Railway logs for runtime confirmation."
