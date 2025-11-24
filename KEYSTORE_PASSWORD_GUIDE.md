# 🔐 Keystore Password Guide

## Where Do the Passwords Come From?

The passwords for your `keystore.properties` file are the **passwords you set when you created the `android.keystore` file**. 

Since you already have `android.keystore` in your project, it was created at some point (possibly when you set up the TWA with Bubblewrap or manually).

## Two Scenarios:

### ✅ Scenario 1: You Remember the Password

If you remember the password you used when creating the keystore:

1. **Test your password**:
   ```powershell
   .\test-keystore-password.ps1
   ```

2. **If it works**, create `keystore.properties`:
   ```powershell
   Copy-Item keystore.properties.example keystore.properties
   ```
   
3. **Edit `keystore.properties`** and fill in:
   - `storePassword` = Your keystore password
   - `keyPassword` = Your key password (usually same as keystore password)

### ❌ Scenario 2: You Don't Remember the Password

If you don't remember the password, you have two options:

#### Option A: Create a New Keystore (Recommended if you haven't published yet)

**⚠️ IMPORTANT**: Only do this if you haven't published your app to Play Store yet!

```powershell
.\create-new-keystore.ps1
```

This will:
- Create a new `android.keystore` file
- Let you set new passwords
- You'll use these passwords going forward

#### Option B: Try to Remember/Find the Password

- Check any notes or password managers you use
- Check if you saved it in a document
- Try common passwords you use
- Use `.\test-keystore-password.ps1` to test different passwords

**⚠️ CRITICAL**: If you've already published your app to Play Store, you **MUST** use the same keystore! Creating a new one will prevent you from updating your published app.

## What Are the Two Passwords?

When creating a keystore, you set:

1. **Keystore Password** (`storePassword`): Password for the entire keystore file
2. **Key Password** (`keyPassword`): Password for the specific key alias (`who-got-who`)

**Most of the time**, these are the same password. You can set them to be different for extra security, but it's common to use the same password for both.

## Quick Test

Run this to see if you can access your keystore:

```powershell
.\test-keystore-password.ps1
```

If it works, you're good to go! If not, you'll need to create a new keystore (if you haven't published yet).

## After You Have the Passwords

1. Create `keystore.properties`:
   ```powershell
   Copy-Item keystore.properties.example keystore.properties
   ```

2. Edit `keystore.properties` and replace:
   - `YOUR_KEYSTORE_PASSWORD_HERE` → Your actual keystore password
   - `YOUR_KEY_PASSWORD_HERE` → Your actual key password (usually same)

3. Test the build:
   ```powershell
   .\test-build.ps1
   ```

## 🔒 Security Reminders

- **NEVER** commit `keystore.properties` to git (it's already in `.gitignore`)
- **NEVER** share your keystore passwords
- **BACKUP** your `android.keystore` file securely
- **WRITE DOWN** your passwords in a secure password manager
- If you lose the keystore/password after publishing, you **cannot update your app**

---

**Need help?** Run `.\test-keystore-password.ps1` to test if your password works!

