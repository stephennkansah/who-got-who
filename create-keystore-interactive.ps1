# Interactive keystore creation script with clear instructions
# This version provides better feedback during password entry

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating New Android Keystore" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "IMPORTANT: Password Entry Instructions" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "When keytool asks for passwords:" -ForegroundColor Yellow
Write-Host "  - Type your password (you WON'T see anything as you type - this is normal!)" -ForegroundColor White
Write-Host "  - Just type and press Enter" -ForegroundColor White
Write-Host "  - If asked twice, type the same password both times" -ForegroundColor White
Write-Host ""
Write-Host "You will be asked for:" -ForegroundColor Cyan
Write-Host "  1. Keystore password (choose a STRONG password!)" -ForegroundColor White
Write-Host "  2. Key password (can be same as keystore password - just press Enter)" -ForegroundColor White
Write-Host "  3. Your name" -ForegroundColor White
Write-Host "  4. Organizational Unit (can be anything or press Enter)" -ForegroundColor White
Write-Host "  5. Organization (can be anything or press Enter)" -ForegroundColor White
Write-Host "  6. City" -ForegroundColor White
Write-Host "  7. State" -ForegroundColor White
Write-Host "  8. Country code (2 letters, e.g., US, GB, CA)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$ready = Read-Host "Ready to start? Press Enter to begin (or type 'n' to cancel)"
if ($ready -eq 'n' -or $ready -eq 'N') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting keystore creation..." -ForegroundColor Green
Write-Host "Follow the prompts below. Remember: passwords are hidden when you type!" -ForegroundColor Yellow
Write-Host ""

# Create the keystore
keytool -genkey -v -keystore android.keystore -alias who-got-who -keyalg RSA -keysize 2048 -validity 10000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Keystore created!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Create keystore.properties file:" -ForegroundColor White
    Write-Host "     Copy-Item keystore.properties.example keystore.properties" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Edit keystore.properties and add your passwords:" -ForegroundColor White
    Write-Host "     storePassword=YOUR_KEYSTORE_PASSWORD" -ForegroundColor Gray
    Write-Host "     keyPassword=YOUR_KEY_PASSWORD" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Test the build:" -ForegroundColor White
    Write-Host "     .\test-build.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "IMPORTANT: Write down your passwords!" -ForegroundColor Yellow
    Write-Host "You will need them for every build and update!" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Keystore creation failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Passwords didn't match (if asked twice)" -ForegroundColor White
    Write-Host "  - Password too short (must be at least 6 characters)" -ForegroundColor White
    Write-Host "  - Invalid country code (must be 2 letters)" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running the script again." -ForegroundColor Cyan
}

