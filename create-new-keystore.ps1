# PowerShell script to create a new Android keystore
# Use this if you don't remember your keystore password or need a new one

Write-Host "Creating New Android Keystore" -ForegroundColor Cyan
Write-Host ""

# Check if keystore already exists
if (Test-Path "android.keystore") {
    Write-Host "WARNING: android.keystore already exists!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If you create a new keystore, you will need to:" -ForegroundColor Yellow
    Write-Host "  1. Use it for ALL future app updates" -ForegroundColor White
    Write-Host "  2. Keep the password safe (you cannot recover it!)" -ForegroundColor White
    Write-Host "  3. Back up the keystore file securely" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "Do you want to BACKUP the old keystore first? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $backupName = "android.keystore.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item "android.keystore" $backupName
        Write-Host "Old keystore backed up to: $backupName" -ForegroundColor Green
        Write-Host ""
    }
    
    $confirm = Read-Host "Continue creating NEW keystore? (y/n)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    # Delete the old keystore so we can create a new one
    Write-Host ""
    Write-Host "Removing old keystore to create a new one..." -ForegroundColor Yellow
    Remove-Item "android.keystore" -Force
    Write-Host "Old keystore removed." -ForegroundColor Green
    Write-Host ""
}

Write-Host "You will be prompted to enter:" -ForegroundColor Cyan
Write-Host "   1. Keystore password (choose a STRONG password!)" -ForegroundColor White
Write-Host "   2. Key password (can be same as keystore password)" -ForegroundColor White
Write-Host "   3. Your name and organization info" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Write down your passwords! You will need them for:" -ForegroundColor Yellow
Write-Host "   - Building your app" -ForegroundColor White
Write-Host "   - Every future update" -ForegroundColor White
Write-Host "   - If you lose it, you CANNOT update your app on Play Store!" -ForegroundColor Red
Write-Host ""

$ready = Read-Host "Ready to create keystore? (y/n)"
if ($ready -ne 'y' -and $ready -ne 'Y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Creating keystore... (follow the prompts)" -ForegroundColor Green
Write-Host ""

# Create the keystore
keytool -genkey -v -keystore android.keystore -alias who-got-who -keyalg RSA -keysize 2048 -validity 10000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Keystore created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Create keystore.properties file:" -ForegroundColor White
    Write-Host "      Copy-Item keystore.properties.example keystore.properties" -ForegroundColor Gray
    Write-Host "   2. Edit keystore.properties and add your passwords" -ForegroundColor White
    Write-Host "   3. Test the build: .\test-build.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Keep your keystore and passwords SAFE!" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Keystore creation failed. Check the errors above." -ForegroundColor Red
}
