// Unsplash Service for fetching travel-related images
// Using official Unsplash API with credentials from environment variables

// Get API credentials from environment variables
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';

/**
 * Fetches a high-quality travel image from Unsplash Search API
 * @param query - Search term
 * @returns Promise resolving to image URL
 */
export const fetchUnsplashImage = async (query: string): Promise<string | null> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error("Unsplash Access Key missing");
    return null;
  }

  try {
    const cleanQuery = query.trim() || 'travel';
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error("Unsplash API error");

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    return null;
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
};

/**
 * Get a travel-related image from Unsplash (Legacy/Direct approach)
 * Note: source.unsplash.com is legacy. Use fetchUnsplashImage for better results.
 */
export const getTravelImage = (query: string, width: number = 800, height: number = 600): string => {
  const cleanQuery = encodeURIComponent(query.trim());
  // Using a more reliable "images.unsplash.com" patterns if possible, 
  // but for now keeping the source fallback as a placeholder
  return `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=${width}&auto=format&fit=crop`; // Beautiful default travel image
};

export const getRandomTravelImage = (width: number = 800, height: number = 1200): string => {
  return `https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=${width}&auto=format&fit=crop`;
};
