# PowerShell script to build and test Android APK
# Run this from PowerShell in your project root

Write-Host "Building test APK for device testing..." -ForegroundColor Cyan

# Check if keystore.properties exists
if (-Not (Test-Path "keystore.properties")) {
    Write-Host "ERROR: keystore.properties file not found!" -ForegroundColor Red
    Write-Host "Please create keystore.properties file first (see keystore.properties.example)" -ForegroundColor Yellow
    exit 1
}

# Build the release APK
Write-Host ""
Write-Host "Building release APK..." -ForegroundColor Green
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your APK file is located at:" -ForegroundColor Cyan
    Write-Host "   app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
    
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        $fileSize = (Get-Item $apkPath).Length / 1MB
        Write-Host ""
        Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To install on your Android device:" -ForegroundColor Yellow
        Write-Host "   1. Transfer the APK to your phone" -ForegroundColor White
        Write-Host "   2. Enable 'Install from Unknown Sources' in Settings" -ForegroundColor White
        Write-Host "   3. Open the APK file and install" -ForegroundColor White
        Write-Host "   4. Test the app thoroughly before uploading to Play Store" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "Build failed! Check the errors above." -ForegroundColor Red
    exit 1
}
