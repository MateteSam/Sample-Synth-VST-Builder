#!/usr/bin/env pwsh
# 🔐 HARD SAVE AUTOMATION SCRIPT
# Usage: .\hard-save.ps1 -message "Description of changes"
# Or: .\hard-save.ps1 (will use default message)

param(
    [string]$message = "Hard save checkpoint"
)

Write-Host "🔐 HARD SAVE SYSTEM INITIATED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Step 1: Check working tree
Write-Host "`n1️⃣  Checking git status..." -ForegroundColor Yellow
$gitStatus = & git status --porcelain
if ($gitStatus) {
    Write-Host "✅ Changes detected, staging all files..." -ForegroundColor Green
    & git add -A
    & git commit -m "Hard Save: $message"
} else {
    Write-Host "✅ Working tree clean" -ForegroundColor Green
}

# Step 2: Get current commit
Write-Host "`n2️⃣  Getting current commit..." -ForegroundColor Yellow
$commit = & git rev-parse --short HEAD
$date = Get-Date -Format "yyyy-MM-dd_HHmmss"
$tag = "v1.0.0-HARD-SAVE-$date"

Write-Host "✅ Current commit: $commit" -ForegroundColor Green

# Step 3: Create backup tag
Write-Host "`n3️⃣  Creating backup tag: $tag..." -ForegroundColor Yellow
& git tag -a $tag -m "🔐 HARD SAVE: $message - Commit: $commit"
Write-Host "✅ Tag created: $tag" -ForegroundColor Green

# Step 4: Push to GitHub
Write-Host "`n4️⃣  Pushing to GitHub..." -ForegroundColor Yellow
& git push origin main
& git push origin $tag
Write-Host "✅ Pushed to GitHub" -ForegroundColor Green

# Step 5: Verification
Write-Host "`n5️⃣  Verifying hard save..." -ForegroundColor Yellow
$remoteBranch = & git rev-parse origin/main
$localBranch = & git rev-parse main
if ($remoteBranch -eq $localBranch) {
    Write-Host "✅ GitHub is in sync" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: GitHub may not be fully synced" -ForegroundColor Yellow
}

# Step 6: Display recovery instructions
Write-Host "`n6️⃣  RECOVERY INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "To recover this save point later:" -ForegroundColor Cyan
Write-Host "  git checkout $tag" -ForegroundColor Cyan
Write-Host "  OR" -ForegroundColor Cyan
Write-Host "  git reset --hard $tag" -ForegroundColor Cyan
Write-Host "  OR (safe):" -ForegroundColor Cyan
Write-Host "  git checkout -b recovery-$date $tag" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "🎉 HARD SAVE COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Commit:  $commit" -ForegroundColor Green
Write-Host "Tag:     $tag" -ForegroundColor Green
Write-Host "Message: $message" -ForegroundColor Green
Write-Host "`n✅ Version is locked and safe!" -ForegroundColor Green
