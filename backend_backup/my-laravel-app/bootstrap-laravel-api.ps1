Param(
  [string]$TargetDir = "..\\laravel-api"
)

$ErrorActionPreference = "Stop"

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$name'. Install it and ensure it's on PATH."
  }
}

Require-Command "php"
Require-Command "composer"

$targetPath = Resolve-Path -Path $TargetDir -ErrorAction SilentlyContinue
if (-not $targetPath) {
  $targetPath = (Resolve-Path -Path (Split-Path -Parent $TargetDir) -ErrorAction SilentlyContinue)
  if (-not $targetPath) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $TargetDir) | Out-Null
  }
}

if (Test-Path $TargetDir) {
  throw "Target directory already exists: $TargetDir"
}

Write-Host "Creating Laravel project in $TargetDir ..."
composer create-project laravel/laravel $TargetDir

Push-Location $TargetDir

Write-Host "Installing Sanctum ..."
composer require laravel/sanctum

Write-Host "Publishing Sanctum assets ..."
php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"

Write-Host "Copying stubs (routes/middleware/controllers) ..."
$stubsRoot = Join-Path $PSScriptRoot "laravel-api-stubs"
if (-not (Test-Path $stubsRoot)) {
  throw "Stubs folder not found: $stubsRoot"
}
Copy-Item -Force -Recurse (Join-Path $stubsRoot "*") "."

Write-Host "Generating app key ..."
php artisan key:generate

Write-Host "Done. Next: configure .env DB, then run: php artisan migrate"
Pop-Location
