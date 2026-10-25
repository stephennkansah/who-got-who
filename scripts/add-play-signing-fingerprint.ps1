# Adds the PUBLIC app signing certificate fingerprint supplied by Play Console.
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^(?:[0-9a-fA-F]{2}:){31}[0-9a-fA-F]{2}$')]
    [string]$Fingerprint
)
$ErrorActionPreference = 'Stop'
$assetLinksPath = Join-Path $PSScriptRoot '../public/.well-known/assetlinks.json'
$statements = @(Get-Content -LiteralPath $assetLinksPath -Raw | ConvertFrom-Json)
$target = @($statements | Where-Object { $_.target.package_name -eq 'club.whogotwho.twa' })
if ($target.Count -ne 1) { throw 'Expected one Who Got Who Android asset link statement.' }
$target[0].target.sha256_cert_fingerprints = @(
    @($target[0].target.sha256_cert_fingerprints) + $Fingerprint.ToUpperInvariant() |
        Select-Object -Unique
)
$json = ConvertTo-Json -InputObject $statements -Depth 8
[IO.File]::WriteAllText($assetLinksPath, $json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
Write-Host 'Public signing fingerprint added. Deploy the website, then test a Play-installed build.'
