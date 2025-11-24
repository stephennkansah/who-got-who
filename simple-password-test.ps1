# Simple script to test keystore password
# This will prompt you for the password interactively

Write-Host "Testing keystore password..." -ForegroundColor Cyan
Write-Host "Enter your keystore password when prompted:" -ForegroundColor Yellow
Write-Host ""

# Try to list the keystore - this will prompt for password
keytool -list -v -keystore android.keystore -alias who-got-who

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Your password is correct!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now create keystore.properties with this password:" -ForegroundColor Cyan
    Write-Host "  1. Copy keystore.properties.example to keystore.properties" -ForegroundColor White
    Write-Host "  2. Edit keystore.properties and add your password" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Password incorrect or error occurred." -ForegroundColor Red
    Write-Host ""
    Write-Host "If you don't remember the password:" -ForegroundColor Yellow
    Write-Host "  - Check password managers, notes, or documents" -ForegroundColor White
    Write-Host "  - If you haven't published to Play Store yet, create a new keystore" -ForegroundColor White
    Write-Host "  - Run: .\create-new-keystore.ps1" -ForegroundColor Cyan
}

