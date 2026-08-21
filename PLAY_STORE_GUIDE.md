# 📱 Publishing to Google Play Store - Complete Guide

Your app is already set up as a **Trusted Web Activity (TWA)** - a wrapper that makes your React web app work as a native Android app!

## ✅ What You Already Have

- ✅ Android project configured (TWA)
- ✅ App icons and splash screens
- ✅ Keystore file (`android.keystore`)
- ✅ App pointing to `whogotwho.club`

## 🚀 Step-by-Step Publishing Process

### Step 1: Set Up Signing Configuration

1. **Create `keystore.properties` file** in the project root (same level as `build.gradle`):

```properties
storeFile=android.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=who-got-who
keyPassword=YOUR_KEY_PASSWORD
```

⚠️ **IMPORTANT**: 
- Replace `YOUR_KEYSTORE_PASSWORD` and `YOUR_KEY_PASSWORD` with your actual passwords
- **NEVER commit this file to git** (it's already in `.gitignore`)
- Keep these passwords safe - you'll need them for all future updates!

2. **Verify your keystore details** match what's in `twa-manifest.json`:
   - Key alias: `who-got-who`
   - Keystore path: `android.keystore`

### Step 2: Build Your Release App Bundle (AAB)

Google Play requires an **Android App Bundle (.aab)** file, not an APK.

**Easy Way (Recommended):**
```powershell
# Use the helper script - it checks everything for you!
.\build-android.ps1
```

**Manual Way:**
```powershell
# Navigate to your project root
cd "C:\Users\super\OneDrive\Desktop\React progams\who got who"

# Build the release bundle
.\gradlew.bat bundleRelease
```

**Your AAB file will be created at:**
```
app\build\outputs\bundle\release\app-release.aab
```

### Step 3: Test Your Build (Optional but Recommended)

Before uploading to Play Store, test the APK:

**Easy Way:**
```powershell
# Use the helper script
.\test-build.ps1
```

**Manual Way:**
```powershell
# Build APK for testing
.\gradlew.bat assembleRelease
```

**APK location:**
```
app\build\outputs\apk\release\app-release.apk
```

Install it on your Android device:
1. Transfer the APK to your phone
2. Enable "Install from Unknown Sources" in Settings
3. Install and test the app

### Step 4: Create Google Play Console Account

1. Go to [Google Play Console](https://play.google.com/console/)
2. Pay the **one-time $25 registration fee**
3. Complete your developer account setup

### Step 5: Create Your App Listing

1. **Click "Create app"** in Play Console
2. **Fill in app details:**
   - App name: "Who Got Who"
   - Default language: English
   - App or game: Game
   - Free or paid: Free
   - Declare that your app follows Google Play policies

### Step 6: Set Up App Content

#### 6.1 Store Listing
- **App name**: Who Got Who
- **Short description**: "Perfect for parties, dinner guests, trips away, and family gatherings. The ultimate party game of stealth tasks and social challenges."
- **Full description**: Write a detailed description of your game
- **App icon**: Upload `logo512.png` (512x512px)
- **Feature graphic**: Create a 1024x500px banner
- **Screenshots**: Take screenshots of your app (minimum 2, recommended 4-8)
  - Phone: 16:9 or 9:16 aspect ratio
  - Tablet (optional): 16:9 or 9:16
- **Category**: Games → Party
- **Tags**: Party game, social, multiplayer

#### 6.2 Content Rating
- Complete the questionnaire about your app's content
- Get your rating (likely "Everyone" for a party game)

#### 6.3 Privacy Policy
- **Required**: You need a privacy policy URL
- The AWS-backed game stores temporary gameplay data, so publish a privacy policy page on your website
- **Template provided**: Use `privacy-policy-template.html` as a starting point
- Publish the served policy at: `https://whogotwho.club/privacy.html`

#### 6.4 Target Audience
- Select appropriate age groups
- Answer content questions

### Step 7: Upload Your App Bundle

1. Go to **"Production"** (or "Internal testing" for testing first)
2. Click **"Create new release"**
3. **Upload your AAB file**: `app\build\outputs\bundle\release\app-release.aab`
4. **Release name**: "1.0.0" (or "Initial Release")
5. **Release notes**: What's new in this version

### Step 8: Complete Store Listing

Make sure all required sections show ✅:
- ✅ Store listing
- ✅ Content rating
- ✅ Privacy policy
- ✅ Target audience
- ✅ App access (if applicable)

### Step 9: Review and Submit

1. Review all information
2. Click **"Send for review"**
3. Wait for Google's review (usually 1-3 days)

## 🔄 Updating Your App Later

When you want to release an update:

1. **Update version numbers** in `app/build.gradle`:
```gradle
versionCode 2  // Increment by 1 each time
versionName "1.0.1"  // Your version string
```

2. **Also update** `twa-manifest.json`:
```json
"appVersionCode": 2,
"appVersionName": "1.0.1"
```

3. **Rebuild**:
```powershell
.\gradlew bundleRelease
```

4. **Upload new AAB** to Play Console

## ⚠️ Important Notes

### Domain Verification
Your TWA points to `whogotwho.club`. Make sure:
- ✅ Your website is live and accessible
- ✅ Your `manifest.json` is accessible at `https://whogotwho.club/manifest.json`
- ✅ Your domain has proper SSL certificate (HTTPS)

### Digital Asset Links
Google Play requires **Digital Asset Links** verification. You need to add a file to your website:

1. Create file: `/.well-known/assetlinks.json` on your website
2. Content should verify your app's package name: `club.whogotwho.twa`

**Example assetlinks.json:**
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "club.whogotwho.twa",
    "sha256_cert_fingerprints": ["YOUR_APP_SHA256_FINGERPRINT"]
  }
}]
```

**Easy Way to Get Your SHA256 Fingerprint:**
```powershell
# Use the helper script - it formats everything for you!
.\get-sha256-fingerprint.ps1
```

**Manual Way:**
```powershell
keytool -list -v -keystore android.keystore -alias who-got-who
```

**Template File:**
- Use `assetlinks.json.example` as a template
- Replace `YOUR_SHA256_FINGERPRINT_HERE` with your actual fingerprint

### Testing Before Release

**Internal Testing Track** (Recommended):
1. Create an internal testing release
2. Add testers (email addresses)
3. Test thoroughly before going to production

## 🐛 Troubleshooting

### Build Errors
- **"SDK location not found"**: Check `local.properties` has correct `sdk.dir` path
- **"Keystore not found"**: Make sure `android.keystore` is in project root
- **Signing errors**: Verify `keystore.properties` passwords are correct

### Play Console Errors
- **"App bundle validation failed"**: Check that your AAB was built correctly
- **"Missing privacy policy"**: Add privacy policy URL to your website
- **"Digital Asset Links verification failed"**: Ensure `assetlinks.json` is accessible

## 📚 Additional Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [App Bundle Guide](https://developer.android.com/guide/app-bundle)

## ✅ Checklist Before Submitting

- [ ] `keystore.properties` created with correct passwords
- [ ] AAB file built successfully
- [ ] App tested on real device
- [ ] Store listing complete (description, screenshots, icons)
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Digital Asset Links file on website
- [ ] Version numbers updated
- [ ] App works correctly when installed

---

**Good luck with your Play Store submission! 🎉**
