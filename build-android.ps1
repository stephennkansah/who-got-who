# PowerShell script to build Android app bundle for Play Store
# Run this from PowerShell in your project root

Write-Host "Building Android App Bundle for Play Store..." -ForegroundColor Cyan

# Check if keystore.properties exists
if (-Not (Test-Path "keystore.properties")) {
    Write-Host "ERROR: keystore.properties file not found!" -ForegroundColor Red
    Write-Host "Please create keystore.properties file first (see keystore.properties.example)" -ForegroundColor Yellow
    exit 1
}

# Check if android.keystore exists
if (-Not (Test-Path "android.keystore")) {
    Write-Host "ERROR: android.keystore file not found!" -ForegroundColor Red
    exit 1
}

# Build the release bundle
Write-Host ""
Write-Host "Building release bundle..." -ForegroundColor Green
.\gradlew.bat bundleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your AAB file is located at:" -ForegroundColor Cyan
    Write-Host "   app\build\outputs\bundle\release\app-release.aab" -ForegroundColor White
    
    $aabPath = "app\build\outputs\bundle\release\app-release.aab"
    if (Test-Path $aabPath) {
        $fileSize = (Get-Item $aabPath).Length / 1MB
        Write-Host ""
        Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Ready to upload to Google Play Console!" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "Build failed! Check the errors above." -ForegroundColor Red
    exit 1
}
