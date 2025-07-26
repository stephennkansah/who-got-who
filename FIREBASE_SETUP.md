# Firebase Setup Guide

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "who-got-who" 
4. Disable Google Analytics for now
5. Click "Create project"

## Step 2: Enable Realtime Database
1. In your Firebase project, go to "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose your location (e.g., "United States (us-central1)")
4. Start in **test mode** for now (we'll secure it later)

## Step 3: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon `</>`
4. Register app with nickname "who-got-who-web"
5. Copy the `firebaseConfig` object

## Step 4: Set Up Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Step 5: Set Up Database Rules for Testing

**IMPORTANT**: For testing purposes, you need to allow public read/write access:

1. Go to Firebase Console → Realtime Database → Rules tab
2. Replace the default rules with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. Click **"Publish"**

⚠️ **Warning**: These rules allow anyone to read/write your database. Only use for testing!

## Step 6: Test Your Setup

1. Run `npm start` locally
2. Try creating a game
3. Try joining from another browser/device using the game link

## Step 7: Production Security (Later)

Before deploying to production, update your rules to be more secure:

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

## Common Issues

### Environment Variables Not Loading
- Make sure `.env` is in the project root (same level as `package.json`)
- Restart your development server after adding `.env`
- Variables must start with `REACT_APP_`

### "Game not found" Error
- Check that database rules allow public access
- Verify the database URL is correct
- Check browser dev tools for network errors

### Permission Denied
- Database rules are too restrictive
- Use the test rules above for initial testing 