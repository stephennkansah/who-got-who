# 🔐 Keystore Password vs Key Password - Explained

## Quick Answer

**Most of the time, they're the SAME password.** You can use the same password for both.

## Detailed Explanation

### Store Password (`storePassword`)
- **What it is**: The password that protects the entire keystore file (`android.keystore`)
- **What it does**: Locks/unlocks the entire keystore file
- **When you need it**: When opening the keystore file itself

### Key Password (`keyPassword`)
- **What it is**: The password that protects a specific key (alias) inside the keystore
- **What it does**: Locks/unlocks the specific key alias (`who-got-who`)
- **When you need it**: When accessing or using that specific key

## Real-World Analogy

Think of it like a safe:
- **Store Password** = The combination to open the safe (the keystore file)
- **Key Password** = The combination to open a specific drawer inside the safe (the key alias)

## Common Setup

**99% of the time**, people use the **same password** for both:
- `storePassword` = `MyPassword123`
- `keyPassword` = `MyPassword123`

This is simpler and perfectly secure for most apps.

## When Creating Your Keystore

When `keytool` asks you:

1. **"Enter keystore password:"** → This is your `storePassword`
2. **"Re-enter password:"** → Type the same password again
3. **"Enter key password for <alias>:"** → You can:
   - Press **Enter** to use the same password as the keystore (recommended)
   - OR type a different password if you want extra security

## In Your keystore.properties File

```properties
storeFile=android.keystore
storePassword=MyPassword123          # Password for the keystore file
keyAlias=who-got-who
keyPassword=MyPassword123            # Password for the key (usually same)
```

## Recommendation

**Use the same password for both** - it's simpler and you're less likely to forget!

Just make sure:
- ✅ It's a STRONG password (at least 8 characters, mix of letters/numbers)
- ✅ You WRITE IT DOWN somewhere safe
- ✅ You'll remember it (or have it saved securely)

## What Happens If They're Different?

If you set different passwords:
- You'll need to remember TWO passwords
- Both must be correct for the build to work
- More complex, but slightly more secure (not really necessary for most apps)

## Bottom Line

**Just use the same password for both!** It's easier and works perfectly fine. 🎯

