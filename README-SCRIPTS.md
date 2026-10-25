# Android and artwork helper scripts

## App icon exports

The approved spy artwork is saved in assets/branding/spy-original.png.
Run `powershell -File scripts/export-app-icons.ps1` to reproduce the existing
web, favicon, Apple touch, maskable, notification, store and Android assets.
This resizes the approved image; it does not redraw it.

## Android release

```powershell
.\build-android.ps1
.\build-android.ps1 -IncludeApk
```

Both commands require the local signing configuration, run release lint, and
build a signed AAB. The second also builds an APK for phone testing.
The helper works from any current directory and prints the output paths.
Generated files are stored under
`%LOCALAPPDATA%\WhoGotWho\android-build\app` outside OneDrive.

`test-build.ps1` calls the same checked build with `-IncludeApk`.
A successful build does not establish Play approval or real-device behavior.

## Website verification

`get-sha256-fingerprint.ps1` reads the **local** signing certificate. It is not
the Play app signing certificate unless the keys are deliberately the same.

Add the public SHA-256 **App signing key certificate** fingerprint from this
app's Play Console:

```powershell
.\scripts\add-play-signing-fingerprint.ps1 -Fingerprint 'AA:BB:...'
```

Supply the complete colon-separated fingerprint. The helper preserves existing
fingerprints in public/.well-known/assetlinks.json. Deploy the website afterward.

Use public/privacy.html as the served privacy policy, not the old template.
See [PLAY_STORE_GUIDE.md](PLAY_STORE_GUIDE.md) for release details and remaining
Play Console steps.
