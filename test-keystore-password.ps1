# PowerShell script to test if your keystore password works
# Run this to verify you have the correct password before building

Write-Host "🔐 Testing keystore password..." -ForegroundColor Cyan
Write-Host ""

# Check if keystore exists
if (-Not (Test-Path "android.keystore")) {
    Write-Host "❌ ERROR: android.keystore file not found!" -ForegroundColor Red
    Write-Host "📝 You need to create a keystore first. See create-new-keystore.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Enter your keystore password to test:" -ForegroundColor Yellow
Write-Host "(The password will be hidden as you type)" -ForegroundColor Gray
Write-Host ""

# Try to list the keystore (this will prompt for password)
$result = keytool -list -v -keystore android.keystore -alias who-got-who 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Your password is correct!" -ForegroundColor Green
    Write-Host "`n📋 Keystore Details:" -ForegroundColor Cyan
    Write-Host "   Alias: who-got-who" -ForegroundColor White
    Write-Host "   File: android.keystore" -ForegroundColor White
    Write-Host "`n✅ You can now create keystore.properties with this password!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Password incorrect or keystore error!" -ForegroundColor Red
    Write-Host "`n💡 Options:" -ForegroundColor Yellow
    Write-Host "   1. Try again with a different password" -ForegroundColor White
    Write-Host "   2. If you don't remember the password, create a new keystore:" -ForegroundColor White
    Write-Host "      Run: .\create-new-keystore.ps1" -ForegroundColor Cyan
    Write-Host "`n⚠️  WARNING: If you create a new keystore, you'll need to use it for ALL future updates!" -ForegroundColor Yellow
}

