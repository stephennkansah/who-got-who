# Builds and checks the signed Android release without publishing it.
param([switch]$IncludeApk)

$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (-not (Test-Path -LiteralPath 'keystore.properties')) {
        throw 'Create the local keystore.properties from keystore.properties.example first.'
    }
    if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        throw 'Java 17 is required. Set JAVA_HOME and add its bin directory to PATH.'
    }
    # OneDrive can lock generated Gradle files during a rebuild.
    $buildRoot = Join-Path $env:LOCALAPPDATA 'WhoGotWho/android-build'
    $tasks = @(':app:lintRelease', ':app:bundleRelease')
    if ($IncludeApk) { $tasks += ':app:assembleRelease' }
    Write-Host 'Checking and building the signed Android release...' -ForegroundColor Cyan
    & .\gradlew.bat @tasks "-PandroidBuildDir=$buildRoot" --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android release checks or build failed.' }

    $aabPath = Join-Path $buildRoot 'app/outputs/bundle/release/app-release.aab'
    if (-not (Test-Path -LiteralPath $aabPath)) { throw 'Gradle did not produce the expected AAB.' }
    Write-Host "App bundle: $aabPath" -ForegroundColor Green
    Write-Host ("Size: {0:N2} MB" -f ((Get-Item -LiteralPath $aabPath).Length / 1MB))
    if ($IncludeApk) {
        $apkPath = Join-Path $buildRoot 'app/outputs/apk/release/app-release.apk'
        if (-not (Test-Path -LiteralPath $apkPath)) { throw 'Gradle did not produce the expected APK.' }
        Write-Host "Device test APK: $apkPath" -ForegroundColor Green
    }
    Write-Host 'Next: verify the Play signing fingerprint, then test through Play Console. See PLAY_STORE_GUIDE.md.'
} finally {
    Pop-Location
}
