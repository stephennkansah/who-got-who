# Script to safely delete the old keystore
# Use this if you want to start fresh

Write-Host "Deleting old keystore..." -ForegroundColor Yellow

if (Test-Path "android.keystore") {
    # Backup first
    $backupName = "android.keystore.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item "android.keystore" $backupName
    Write-Host "Backed up to: $backupName" -ForegroundColor Green
    
    # Delete
    Remove-Item "android.keystore" -Force
    Write-Host "Old keystore deleted." -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: .\create-new-keystore.ps1" -ForegroundColor Cyan
} else {
    Write-Host "No keystore found to delete." -ForegroundColor Yellow
}

