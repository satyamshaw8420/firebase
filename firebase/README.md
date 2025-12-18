# Firebase Integration

This directory contains all Firebase-related services and configuration for the TravelEase application.

## Files

- `firebaseConfig.ts`: Firebase initialization and configuration
- `authService.ts`: Authentication service functions
- `dbService.ts`: Generic database service functions
- `tripService.ts`: Trip-specific database operations

## Setup Instructions

1. Create a Firebase project at https://console.firebase.google.com/
2. Register a web app in your Firebase project
3. Copy the Firebase configuration values to your `.env` file
4. Enable Google Authentication in the Firebase Console
5. Set up Firestore database in the Firebase Console

## Environment Variables

The following environment variables need to be set in your `.env` file:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Testing

To test Firebase integration, navigate to `/test` in your application.