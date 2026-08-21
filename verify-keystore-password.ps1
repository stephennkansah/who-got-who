# Quick script to verify keystore password
Write-Host "Testing keystore password from keystore.properties..." -ForegroundColor Cyan
Write-Host ""

$props = Get-Content "keystore.properties" | Where-Object { $_ -notmatch '^#' -and $_ -match '=' }
$storePassword = ($props | Where-Object { $_ -match 'storePassword' }).Split('=')[1].Trim()
$keyPassword = ($props | Where-Object { $_ -match 'keyPassword' }).Split('=')[1].Trim()

Write-Host "Attempting to access keystore with password from properties file..." -ForegroundColor Yellow
Write-Host ""

# Try to list the keystore using the password from properties
$result = echo $storePassword | keytool -list -v -keystore android.keystore -alias who-got-who -storepass $storePassword 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Password is correct!" -ForegroundColor Green
} else {
    Write-Host "FAILED! Password is incorrect." -ForegroundColor Red
    Write-Host ""
    Write-Host "The password in keystore.properties doesn't match your keystore." -ForegroundColor Yellow
    Write-Host "Please check your keystore.properties file and update the passwords." -ForegroundColor Yellow
}

