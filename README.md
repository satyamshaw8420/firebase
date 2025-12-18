# TravelEase - AI-Powered Travel Planning Application

TravelEase is an innovative travel planning application that leverages AI to create personalized itineraries for users. Built with React, TypeScript, and Vite, it offers a seamless experience for planning trips with AI-generated recommendations.

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Environment Setup

To run the application, you need to set up the required environment variables:

1. Create a `.env` file in the root directory
2. Add the following variables:

```env
VITE_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_AUTH_CLIENT_ID=your_google_auth_client_id_here
```

#### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key (Important: If you see a message that your previous key was leaked, create a completely new one)
4. Copy the API key and paste it as the value for `VITE_API_KEY` in your `.env` file

#### Getting a Google OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials > OAuth 2.0 Client IDs
5. Create a new OAuth client ID for a web application
6. Add your domain to the authorized origins
7. Copy the client ID and paste it as the value for `VITE_GOOGLE_AUTH_CLIENT_ID` in your `.env` file

### Running the Application

To start the development server:
```
npm run dev
```

To build for production:
```
npm run build
```

To preview the production build:
```
npm run preview
```

## Features

- AI-powered trip planning using Google's Gemini API
- Google authentication
- Trip creation and management
- Destination exploration
- Community guides and comparisons

## Technologies Used

- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Google Gemini API for AI capabilities
- Google OAuth for authentication
- React Router for navigation
- Framer Motion for animations

## Deployment

The application can be deployed to Vercel:

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy:
   ```
   vercel --prod
   ```

## Troubleshooting

### API Key Issues

If you encounter API key errors:
1. Verify that your `.env` file contains the correct API key
2. Ensure the API key hasn't been revoked or expired
3. Check that the API key has the necessary permissions
4. **Important**: If you get a "leaked key" error, you must create a completely new API key as Google has permanently blocked the compromised key

### Authentication Issues

If Google authentication isn't working:
1. Verify that your Google OAuth Client ID is correct
2. Ensure your domain is added to the authorized origins
3. Check the browser console for any CORS-related errors

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License.