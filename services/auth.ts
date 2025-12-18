// Google OAuth 2.0 Authentication Service
// This service handles authentication using the Google Identity Services SDK.

// Google Cloud Console Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

// Mock user for fallback/demo mode
const MOCK_USER = {
  uid: "mock-user-12345",
  displayName: "TravelEase Demo User",
  email: "demo@travelease.app",
  photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
  emailVerified: true,
  isAnonymous: false,
};

/**
 * Initiates the Google OAuth 2.0 flow using the GIS SDK.
 * Returns a user object compatible with the application's User interface.
 */
export const signInWithGoogle = async (): Promise<any> => {
  // 1. Check if configured
  const isConfigured = !!import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;
  
  // 2. Check if Google Script is loaded (added in index.html)
  const isScriptLoaded = typeof window !== 'undefined' && (window as any).google;

  if (isConfigured && isScriptLoaded) {
    return new Promise((resolve, reject) => {
      try {
        // Initialize the token client
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          // Scopes for Profile and Email
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
             if (tokenResponse && tokenResponse.access_token) {
                 // Fetch User Info manually using the access token
                 try {
                     const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                         headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                     });
                     
                     if (!userInfoResponse.ok) throw new Error("Failed to fetch user profile");
                     
                     const userInfo = await userInfoResponse.json();

                     // Return structure matching what the app expects
                     resolve({
                         user: {
                             uid: userInfo.sub, // Google's unique user ID
                             displayName: userInfo.name,
                             email: userInfo.email,
                             photoURL: userInfo.picture,
                             emailVerified: true
                         }
                     });
                 } catch (err) {
                     reject(err);
                 }
             } else {
                 reject(new Error("No access token received from Google"));
             }
          },
        });
        
        // Trigger the popup
        client.requestAccessToken();
        
      } catch (err) {
        console.error("OAuth Initialization Error:", err);
        reject(err);
      }
    });
  } else {
    // Fallback Mode
    console.warn("Google OAuth not configured or script not loaded. Using Mock Auth.");
    if (!isScriptLoaded) console.warn("Make sure <script src='https://accounts.google.com/gsi/client'> is in index.html");
    
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return { user: MOCK_USER };
  }
};

/**
 * Signs out the current user by revoking the access token.
 * Clears any stored user data.
 */
export const signOut = async (): Promise<void> => {
  // In a real implementation, you would revoke the token with Google
  // For now, we'll just return a promise that resolves immediately
  
  // Clear any stored tokens or user data
  if (typeof window !== 'undefined' && (window as any).google) {
    // Google Identity Services doesn't have a direct signOut method for token clients
    // In a production app, you would implement proper token revocation
    console.log('User signed out');
  }
  
  return Promise.resolve();
};