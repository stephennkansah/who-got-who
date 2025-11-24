# 🚀 Quick Start - Get Your App on Play Store

## Step 1: Get Your Keystore Passwords

**First, test if you remember your keystore password:**
```powershell
.\test-keystore-password.ps1
```

**If you don't remember the password:**
- If you **haven't published** to Play Store yet: Run `.\create-new-keystore.ps1`
- If you **have published**: You MUST find the original password (check notes/password manager)

**Once you have the password, create keystore.properties:**
```powershell
Copy-Item keystore.properties.example keystore.properties
# Then edit keystore.properties with your actual passwords
```

**📖 See `KEYSTORE_PASSWORD_GUIDE.md` for detailed help!**

## Step 2: Build Your App (5 minutes)

**Option A: Build for Play Store (AAB file)**
```powershell
.\build-android.ps1
```

**Option B: Build for Testing (APK file)**
```powershell
.\test-build.ps1
```

## Step 3: Get SHA256 Fingerprint (1 minute)

Run this to get your fingerprint for Digital Asset Links:
```powershell
.\get-sha256-fingerprint.ps1
```

Copy the fingerprint and use it in `assetlinks.json.example` → save as `assetlinks.json` on your website at `/.well-known/assetlinks.json`

## Step 4: Set Up Privacy Policy (10 minutes)

1. Open `privacy-policy-template.html`
2. Replace `[DATE]` with today's date
3. Replace `[YOUR_EMAIL]` with your contact email
4. Upload to your website at `https://whogotwho.club/privacy-policy.html`

## Step 5: Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console/)
2. Pay $25 registration fee
3. Create new app
4. Upload your AAB file from `app\build\outputs\bundle\release\app-release.aab`
5. Complete store listing (use screenshots, descriptions, etc.)
6. Submit for review

## 📋 Files Created for You

- ✅ `build-android.ps1` - Builds AAB for Play Store
- ✅ `test-build.ps1` - Builds APK for testing
- ✅ `get-sha256-fingerprint.ps1` - Gets fingerprint for asset links
- ✅ `privacy-policy-template.html` - Privacy policy template
- ✅ `assetlinks.json.example` - Digital Asset Links template
- ✅ `keystore.properties.example` - Signing config template

## 🆘 Need Help?

See `PLAY_STORE_GUIDE.md` for detailed instructions!

