# Quick Fix: Firebase Database Rules

Your game isn't working because Firebase blocks all access by default. Here's the fastest fix:

## Option 1: Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: "who-got-who"
3. **Click "Realtime Database"** in the left sidebar
4. **Click the "Rules" tab**
5. **Replace the rules** with this:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

6. **Click "Publish"**

## Option 2: Direct URL (Even Faster)

1. Open: https://console.firebase.google.com/u/0/project/who-got-who/database/who-got-who-default-rtdb/rules
2. Replace rules with the code above
3. Click "Publish"

## What This Does

- ✅ Allows anyone to read/write your database
- ✅ Perfect for testing your game
- ⚠️ **NOT secure for production** (but fine for testing)

## Test It

1. Try creating a game again
2. Copy the game link and open in another browser
3. Both should work now! 🎉

## Later: Secure Rules

Once your game works, you can make it more secure with these rules:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**The rules change takes effect immediately - no restart needed!** 