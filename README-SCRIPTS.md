# 📜 Helper Scripts Documentation

These PowerShell scripts help automate common tasks for publishing your Android app.

## 🔨 build-android.ps1

**Purpose**: Builds the Android App Bundle (AAB) file for Google Play Store submission.

**Usage**:
```powershell
.\build-android.ps1
```

**What it does**:
1. Checks if `keystore.properties` exists
2. Checks if `android.keystore` exists
3. Builds the release AAB bundle
4. Shows the file location and size
5. Confirms readiness for Play Store upload

**Output**: `app\build\outputs\bundle\release\app-release.aab`

---

## 🧪 test-build.ps1

**Purpose**: Builds an APK file for testing on your device before submitting to Play Store.

**Usage**:
```powershell
.\test-build.ps1
```

**What it does**:
1. Checks if `keystore.properties` exists
2. Checks if `android.keystore` exists
3. Builds the release APK
4. Shows installation instructions

**Output**: `app\build\outputs\apk\release\app-release.apk`

**Next Steps**: Transfer APK to your phone and install for testing.

---

## 🔐 get-sha256-fingerprint.ps1

**Purpose**: Extracts the SHA256 fingerprint from your keystore for Digital Asset Links verification.

**Usage**:
```powershell
.\get-sha256-fingerprint.ps1
```

**What it does**:
1. Checks if `android.keystore` exists
2. Prompts for keystore password
3. Extracts SHA256 fingerprint
4. Shows formatted `assetlinks.json` example with your fingerprint

**Output**: SHA256 fingerprint string and example JSON

**Next Steps**: 
1. Copy the fingerprint
2. Use it in `assetlinks.json.example`
3. Upload to your website at `/.well-known/assetlinks.json`

---

## 📝 Template Files

### keystore.properties.example
Template for your signing configuration. Copy to `keystore.properties` and fill in passwords.

### assetlinks.json.example
Template for Digital Asset Links file. Fill in your SHA256 fingerprint and upload to your website.

### privacy-policy-template.html
HTML template for your privacy policy. Customize and upload to your website.

---

## ⚠️ Troubleshooting

### Script won't run
- Make sure you're in PowerShell (not Command Prompt)
- Run from project root directory
- Check execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Build fails
- Verify `keystore.properties` has correct passwords
- Check that `android.keystore` exists in project root
- Ensure Android SDK is properly configured in `local.properties`

### Fingerprint extraction fails
- Make sure you enter the correct keystore password
- Verify the alias `who-got-who` exists in your keystore

---

## 🚀 Quick Workflow

1. **First time setup**: Create `keystore.properties` from example
2. **Test build**: Run `.\test-build.ps1` and test on device
3. **Get fingerprint**: Run `.\get-sha256-fingerprint.ps1` for asset links
4. **Production build**: Run `.\build-android.ps1` for Play Store
5. **Upload**: Upload AAB to Google Play Console

---

**Need more help?** See `PLAY_STORE_GUIDE.md` for detailed instructions!

