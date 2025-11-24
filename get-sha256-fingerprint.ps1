# PowerShell script to get SHA256 fingerprint for Digital Asset Links
# Run this from PowerShell in your project root

Write-Host "🔐 Getting SHA256 fingerprint from your keystore..." -ForegroundColor Cyan
Write-Host ""

# Check if keystore exists
if (-Not (Test-Path "android.keystore")) {
    Write-Host "❌ ERROR: android.keystore file not found!" -ForegroundColor Red
    exit 1
}

# Get the fingerprint
Write-Host "Enter your keystore password when prompted:" -ForegroundColor Yellow
Write-Host ""

$fingerprint = keytool -list -v -keystore android.keystore -alias who-got-who 2>&1 | Select-String "SHA256:"

if ($fingerprint) {
    Write-Host "`n✅ SHA256 Fingerprint found:" -ForegroundColor Green
    Write-Host ""
    $sha256 = ($fingerprint -split "SHA256:")[1].Trim()
    Write-Host $sha256 -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Copy this fingerprint to your assetlinks.json file" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Example assetlinks.json content:" -ForegroundColor Yellow
    Write-Host @"
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "club.whogotwho.twa",
    "sha256_cert_fingerprints": ["$sha256"]
  }
}]
"@ -ForegroundColor Gray
} else {
    Write-Host "❌ Could not extract fingerprint. Make sure:" -ForegroundColor Red
    Write-Host "   1. You entered the correct keystore password" -ForegroundColor Yellow
    Write-Host "   2. The alias 'who-got-who' exists in the keystore" -ForegroundColor Yellow
}

