// Unsplash Service for fetching travel-related images
// Using Unsplash API with credentials from environment variables

// Get API credentials from environment variables
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'OGgsFFNWcHKNQZcYVRrsf6Zsziy35l1wqRbraybhjs4';

/**
 * Get a travel-related image from Unsplash based on destination or trip name
 * @param query - Search term (destination name, trip name, etc.)
 * @param width - Desired image width
 * @param height - Desired image height
 * @returns URL to Unsplash image
 */
export const getTravelImage = (query: string, width: number = 800, height: number = 600): string => {
  // Clean the query string for URL safety but preserve spaces and common destination characters
  const cleanQuery = encodeURIComponent(query.trim());
  
  // Use Unsplash API with access key for better reliability
  // Include both the specific query and a general travel term for better results
  return `https://api.unsplash.com/photos/random?query=${cleanQuery},travel&orientation=landscape&w=${width}&h=${height}&client_id=${UNSPLASH_ACCESS_KEY}`;
};

/**
 * Get a random travel image when no specific query is available
 * @param width - Desired image width
 * @param height - Desired image height
 * @returns URL to random Unsplash travel image
 */
export const getRandomTravelImage = (width: number = 800, height: number = 600): string => {
  // Use Unsplash API with access key for random travel images
  return `https://api.unsplash.com/photos/random?query=travel,nature,landscape&orientation=landscape&w=${width}&h=${height}&client_id=${UNSPLASH_ACCESS_KEY}`;
};

/**
 * Fallback to Unsplash Source API if the main API fails
 * @param query - Search term (destination name, trip name, etc.)
 * @param width - Desired image width
 * @param height - Desired image height
 * @returns URL to Unsplash image
 */
export const getFallbackTravelImage = (query: string, width: number = 800, height: number = 600): string => {
  const cleanQuery = encodeURIComponent(query.trim());
  return `https://source.unsplash.com/featured/${width}x${height}/?${cleanQuery},travel`;
};