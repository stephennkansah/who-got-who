param(
    [string]$Source = (Join-Path $PSScriptRoot '../assets/branding/spy-original.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$artwork = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Source))
$ink = [System.Drawing.ColorTranslator]::FromHtml('#12100c')

function Export-Icon([string]$RelativePath, [int]$Size, [double]$Scale = 1, [bool]$Monochrome = $false) {
    $destination = Join-Path $projectRoot $RelativePath
    [void][System.IO.Directory]::CreateDirectory((Split-Path -Parent $destination))
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear($ink)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $edge = [int][Math]::Round($Size * $Scale)
        $inset = [int][Math]::Round(($Size - $edge) / 2)
        $graphics.DrawImage($artwork, $inset, $inset, $edge, $edge)
        if ($Monochrome) {
            # Notification badges use alpha, not colour. Keep the approved silhouette.
            for ($y = 0; $y -lt $Size; $y++) {
                for ($x = 0; $x -lt $Size; $x++) {
                    $pixel = $bitmap.GetPixel($x, $y)
                    $brightness = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
                    $alpha = [int][Math]::Min(255, [Math]::Max(0, ($brightness - 30) * 255 / 150))
                    $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
                }
            }
        }
        $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    foreach ($size in @(48, 180, 192, 512, 1024)) {
        Export-Icon "public/icons/spy-$size.png" $size
    }
    # PWA safe zone: a circle of radius 40% of the canvas width.
    Export-Icon 'public/icons/spy-maskable-512.png' 512 0.9
    Export-Icon 'public/icons/spy-badge-96.png' 96 1 $true
    Export-Icon 'public/logo192.png' 192
    Export-Icon 'public/logo512.png' 512
    Export-Icon 'store_icon.png' 512

    # A PNG-backed ICO with native 16, 32 and 48 pixel entries.
    $frames = @()
    foreach ($size in @(16, 32, 48)) {
        $bitmap = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $stream = New-Object System.IO.MemoryStream
        try {
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($artwork, 0, 0, $size, $size)
            $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
            $frames += @{ Size = $size; Bytes = $stream.ToArray() }
        } finally {
            $graphics.Dispose()
            $bitmap.Dispose()
            $stream.Dispose()
        }
    }
    $file = [System.IO.File]::Create((Join-Path $projectRoot 'public/favicon.ico'))
    $writer = New-Object System.IO.BinaryWriter($file)
    try {
        $writer.Write([uint16]0)
        $writer.Write([uint16]1)
        $writer.Write([uint16]$frames.Count)
        $offset = 6 + 16 * $frames.Count
        foreach ($frame in $frames) {
            $writer.Write([byte]$frame.Size)
            $writer.Write([byte]$frame.Size)
            $writer.Write([uint16]0)
            $writer.Write([uint16]1)
            $writer.Write([uint16]32)
            $writer.Write([uint32]$frame.Bytes.Length)
            $writer.Write([uint32]$offset)
            $offset += $frame.Bytes.Length
        }
        foreach ($frame in $frames) { $writer.Write([byte[]]$frame.Bytes) }
    } finally { $writer.Dispose() }

    if (Test-Path -LiteralPath (Join-Path $projectRoot 'app/src/main/res')) {
        $densities = @{ mdpi = 1; hdpi = 1.5; xhdpi = 2; xxhdpi = 3; xxxhdpi = 4 }
        foreach ($density in $densities.GetEnumerator()) {
            $name = $density.Key
            $factor = $density.Value
            Export-Icon "app/src/main/res/mipmap-$name/ic_launcher.png" ([int](48 * $factor))
            # Adaptive layers are 108dp, with the mark safely inside the central 66dp circle.
            Export-Icon "app/src/main/res/mipmap-$name/ic_launcher_foreground.png" ([int](108 * $factor)) 0.68
            Export-Icon "app/src/main/res/drawable-$name/splash.png" ([int](128 * $factor))
            Export-Icon "app/src/main/res/drawable-$name/ic_notification_icon.png" ([int](24 * $factor)) 1 $true
        }
        Copy-Item -LiteralPath (Join-Path $projectRoot 'public/manifest.json') -Destination (Join-Path $projectRoot 'app/src/main/res/raw/web_app_manifest.json')
    }
} finally { $artwork.Dispose() }

Write-Output 'Exported web, home-screen, notification, store, and Android icons from the approved artwork.'
