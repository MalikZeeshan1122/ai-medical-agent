<#
PowerShell helper to install Supabase CLI, create .env, and set service-role secret.

Usage:
  1. Open PowerShell as Administrator (for global npm installs).
  2. From project root run:
       powershell -ExecutionPolicy Bypass -File .\scripts\setup-supabase.ps1

This script is interactive and will prompt for your project ref and keys.
#>

function Write-Header($text) {
  Write-Host "`n=== $text ===`n" -ForegroundColor Cyan
}

Write-Header "Supabase CLI and env setup helper"

# Check for Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not on PATH. Please install Node.js first: https://nodejs.org/" -ForegroundColor Yellow
  exit 1
}

# Check for npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm not found. Ensure Node.js installation included npm." -ForegroundColor Yellow
  exit 1
}

# Ensure supabase CLI installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host "Supabase CLI not found. Installing globally via npm..." -ForegroundColor Green
  try {
    npm install -g supabase
  } catch {
    Write-Host "Global install failed. Rerun PowerShell as Administrator or install manually: npm i -g supabase" -ForegroundColor Red
    exit 1
  }
  if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI still not found in PATH after install. Restart your terminal and try again." -ForegroundColor Red
    exit 1
  }
}

Write-Host "Supabase CLI is available:" -ForegroundColor Green
supabase --version

Write-Header "Collecting information"
$projectRef = Read-Host "Enter your Supabase project ref (no angle brackets, e.g. abcdefgh)"
if ([string]::IsNullOrWhiteSpace($projectRef)) { Write-Host "Project ref is required." -ForegroundColor Red; exit 1 }

$anonKey = Read-Host "Enter your anon/publishable key (paste it now)"
$serviceRole = Read-Host "Enter your service-role key (paste it now) - will be set as secret (leave blank to skip)"

Write-Header "Creating .env file"
$envPath = Join-Path -Path (Get-Location) -ChildPath ".env"
$envContent = @()
$envContent += "VITE_SUPABASE_URL=https://$projectRef.supabase.co"
if (-not [string]::IsNullOrWhiteSpace($anonKey)) { $envContent += "VITE_SUPABASE_PUBLISHABLE_KEY=$anonKey" }

Set-Content -Path $envPath -Value ($envContent -join "`n") -Encoding UTF8
Write-Host ".env written to $envPath" -ForegroundColor Green

Write-Header "Temporarily exporting env vars into current session"
$env:VITE_SUPABASE_URL = "https://$projectRef.supabase.co"
if (-not [string]::IsNullOrWhiteSpace($anonKey)) { $env:VITE_SUPABASE_PUBLISHABLE_KEY = $anonKey }

Write-Host "Environment variables available for this session." -ForegroundColor Green

if (-not [string]::IsNullOrWhiteSpace($serviceRole)) {
  Write-Header "Setting Supabase secret (may require you to be logged in to supabase CLI)"
  try {
    # Use single quotes around the key to avoid PowerShell parsing issues
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY='$serviceRole' --project-ref $projectRef
    Write-Host "Secret set. If this failed, run 'supabase login' then re-run this script." -ForegroundColor Green
  } catch {
    Write-Host "Failed to set secret via CLI. You may need to run 'supabase login' first, then re-run this script." -ForegroundColor Yellow
    Write-Host "Alternatively, set the secret from the Supabase dashboard." -ForegroundColor Yellow
  }
} else {
  Write-Host "Service-role key skipped. You can set it later with: supabase secrets set SUPABASE_SERVICE_ROLE_KEY='your-key' --project-ref your-ref" -ForegroundColor Yellow
}

Write-Header "Deployment (optional)"
if ((Read-Host "Deploy the function 'upload-medical-document' now? (y/N)") -match '^[Yy]') {
  try {
    supabase functions deploy upload-medical-document --project-ref $projectRef
    Write-Host "Function deploy command issued. Check logs with: supabase functions logs upload-medical-document --project-ref $projectRef" -ForegroundColor Green
  } catch {
    Write-Host "Function deploy failed. Make sure you're logged in (supabase login) and that the function folder exists." -ForegroundColor Red
  }
}

Write-Header "Done"
Write-Host "If you see any errors, copy/paste the exact output and I will help diagnose." -ForegroundColor Cyan
