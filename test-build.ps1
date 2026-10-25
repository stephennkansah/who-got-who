# Runs the same release checks and also creates a signed APK for device testing.
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'build-android.ps1') -IncludeApk
