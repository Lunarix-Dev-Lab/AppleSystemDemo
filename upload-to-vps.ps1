# Upload script for transferring built artifacts to VPS
# Requires: SSH key-based auth configured, or will prompt for password

param(
    [string]$VpsHost = $(Read-Host "Enter VPS hostname/IP"),
    [string]$VpsUser = $(Read-Host "Enter VPS username"),
    [int]$VpsPort = 22,
    [string]$VpsPath = "/home/$VpsUser/applesystem",
    [string]$ImageTag = "latest",
    [string]$InputDir = "./build-artifacts"
)

Write-Host "🚀 Uploading to VPS..." -ForegroundColor Cyan
Write-Host "Target: $VpsUser@$VpsHost`:$VpsPath" -ForegroundColor Gray

# Check if files exist
$backendTar = "$InputDir/backend-$ImageTag.tar"
$frontendTar = "$InputDir/frontend-$ImageTag.tar"

if (!(Test-Path $backendTar) -or !(Test-Path $frontendTar)) {
    Write-Host "❌ Build artifacts not found. Run ./build.ps1 first" -ForegroundColor Red
    exit 1
}

try {
    # Create remote directory
    Write-Host "`n📁 Creating remote directory..." -ForegroundColor Yellow
    ssh -p $VpsPort "$VpsUser@$VpsHost" "mkdir -p $VpsPath"
    Write-Host "✅ Remote directory ready" -ForegroundColor Green

    # Upload tar files
    Write-Host "`n⬆️  Uploading backend image..." -ForegroundColor Yellow
    scp -P $VpsPort $backendTar "$VpsUser@$VpsHost`:$VpsPath/"
    Write-Host "✅ Backend uploaded" -ForegroundColor Green

    Write-Host "`n⬆️  Uploading frontend image..." -ForegroundColor Yellow
    scp -P $VpsPort $frontendTar "$VpsUser@$VpsHost`:$VpsPath/"
    Write-Host "✅ Frontend uploaded" -ForegroundColor Green

    # Upload docker-compose and config files
    Write-Host "`n⬆️  Uploading docker-compose and configs..." -ForegroundColor Yellow
    scp -P $VpsPort docker-compose.prod.yml "$VpsUser@$VpsHost`:$VpsPath/"
    scp -P $VpsPort .env "$VpsUser@$VpsHost`:$VpsPath/" 2>$null || Write-Host "⚠️  .env not found (will need to create on VPS)" -ForegroundColor Yellow
    scp -P $VpsPort -r nginx/ "$VpsUser@$VpsHost`:$VpsPath/"
    Write-Host "✅ Config files uploaded" -ForegroundColor Green

    Write-Host "`n✨ Upload complete!" -ForegroundColor Green
    Write-Host "`nNext steps on VPS:" -ForegroundColor Cyan
    Write-Host "  1. ssh $VpsUser@$VpsHost" -ForegroundColor Gray
    Write-Host "  2. cd $VpsPath" -ForegroundColor Gray
    Write-Host "  3. ./deploy.sh" -ForegroundColor Gray

} catch {
    Write-Host "❌ Upload failed: $_" -ForegroundColor Red
    exit 1
}
