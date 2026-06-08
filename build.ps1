# Build script for Apple System Demo
# Builds Docker images locally and saves them as tar files for VPS deployment

param(
    [string]$ImageTag = "latest",
    [string]$OutputDir = "./build-artifacts"
)

Write-Host "🔨 Building Docker images for VPS deployment..." -ForegroundColor Cyan
Write-Host "Tag: $ImageTag" -ForegroundColor Gray

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✅ Created output directory: $OutputDir" -ForegroundColor Green
}

try {
    # Build backend image
    Write-Host "`n📦 Building backend image..." -ForegroundColor Yellow
    docker build -t "applesystem-backend:$ImageTag" -f ./backend/Dockerfile ./backend
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
    Write-Host "✅ Backend image built" -ForegroundColor Green

    # Build frontend image
    Write-Host "`n📦 Building frontend image..." -ForegroundColor Yellow
    docker build -t "applesystem-frontend:$ImageTag" -f ./frontend/Dockerfile ./frontend
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    Write-Host "✅ Frontend image built" -ForegroundColor Green

    # Save images as tar files
    Write-Host "`n💾 Saving images as tar files..." -ForegroundColor Yellow
    
    docker save "applesystem-backend:$ImageTag" -o "$OutputDir/backend-$ImageTag.tar"
    Write-Host "✅ Saved backend: $OutputDir/backend-$ImageTag.tar" -ForegroundColor Green
    
    docker save "applesystem-frontend:$ImageTag" -o "$OutputDir/frontend-$ImageTag.tar"
    Write-Host "✅ Saved frontend: $OutputDir/frontend-$ImageTag.tar" -ForegroundColor Green

    # Get file sizes
    $backendSize = (Get-Item "$OutputDir/backend-$ImageTag.tar").Length / 1MB
    $frontendSize = (Get-Item "$OutputDir/frontend-$ImageTag.tar").Length / 1MB
    
    Write-Host "`n📊 Build Summary:" -ForegroundColor Cyan
    Write-Host "  Backend:  $([Math]::Round($backendSize, 2)) MB"
    Write-Host "  Frontend: $([Math]::Round($frontendSize, 2)) MB"
    Write-Host "  Total:    $([Math]::Round($backendSize + $frontendSize, 2)) MB"
    
    Write-Host "`n✨ Build complete! Ready for upload to VPS" -ForegroundColor Green
    Write-Host "Next: Run ./upload-to-vps.ps1 to transfer files" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}
