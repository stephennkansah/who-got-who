# Firebase Setup for Who Got Who

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" 
3. Project name: `who-got-who`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Realtime Database

1. In your Firebase project, go to **Build** → **Realtime Database**
2. Click "Create Database"
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

## Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click **Web app** icon (`</>`)
4. App nickname: `who-got-who-web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. **Copy the config object** - you'll need this!

## Step 4: Configure Environment Variables

1. Create a `.env` file in your project root
2. Add your Firebase configuration:

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Step 5: Update Database Rules (Later)

For production, update your database rules in Firebase Console:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['id', 'status', 'players'])"
      }
    }
  }
}
```

## Step 6: Test Your Setup

1. Restart your development server: `npm start`
2. Create a new game
3. Check Firebase Console → Realtime Database to see data appearing
4. Test with multiple browser tabs to see real-time sync!

## What You Get

✅ **Real-time multiplayer** - All players see updates instantly  
✅ **Secret tasks** - Each player only sees their own tasks  
✅ **Auto-rejoin** - Players can refresh and rejoin automatically  
✅ **Cross-device** - Play on different phones/devices  
✅ **Scalable** - Firebase handles any number of concurrent games  

## Development vs Production

- **Development**: Use test mode rules for easy testing
- **Production**: Implement proper security rules and authentication

Ready to test real multiplayer! 🎮🔥 