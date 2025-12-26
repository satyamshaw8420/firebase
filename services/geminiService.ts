import { GoogleGenAI, Type } from "@google/genai";
import { TripPreferences, Itinerary } from "../types";

// NOTE: In a real production app, this key should be proxied via backend
// Using VITE_ prefix for Vite environment variables
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Log the API key status for debugging (without exposing the full key)
console.log("Gemini API Key Status:", API_KEY ? `Key present (starts with ${API_KEY.substring(0, 5)}...)` : "No key found");

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateItinerary = async (prefs: TripPreferences): Promise<Itinerary> => {
  // Validate API key before making request
  if (!API_KEY) {
    throw new Error("API key not configured. Please set VITE_API_KEY in your .env file.");
  }
  
  if (API_KEY.length < 10) {
    throw new Error("API key appears to be invalid. Please check your .env file.");
  }

  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    Create a detailed travel itinerary for a trip starting from ${prefs.origin} to ${prefs.destination} 
    ${prefs.additionalDestinations.length > 0 ? `and visiting ${prefs.additionalDestinations.join(', ')}` : ''}.
    
    Trip Details:
    - Dates: ${prefs.startDate} to ${prefs.endDate} (${prefs.durationDays} days)
    - Budget Tier: ${prefs.budgetType} (Approx. Budget: ${prefs.budgetAmount} INR)
    - Traveler Type: ${prefs.travelerType}
    - Join "Strangers United" Group Tour: ${prefs.joinStrangerGroup ? 'Yes (Include group activities)' : 'No'}
    - Group Preferences: ${prefs.groupPreferences ? prefs.groupPreferences.genderPreference.charAt(0).toUpperCase() + prefs.groupPreferences.genderPreference.slice(1) : 'Any'}
    - Travelers: ${prefs.travelers.adults} Adults, ${prefs.travelers.children} Children, ${prefs.travelers.seniors} Seniors, ${prefs.travelers.infants} Infants.
    - Transport Preferences: ${prefs.transportModes.join(', ')}
    - Hire Guide: ${prefs.hireGuide ? 'Yes' : 'No'}
    - Interests: ${prefs.interests.join(', ')}

    Return a strictly structured JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tripName: { type: Type.STRING },
            destinationOverview: { type: Type.STRING },
            totalEstimatedCost: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            packingList: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            dailyItinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        activity: { type: Type.STRING },
                        description: { type: Type.STRING },
                        location: { type: Type.STRING },
                        estimatedCost: { type: Type.NUMBER },
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      // Clean potential markdown code blocks
      const cleanText = response.text.replace(/```json|```/g, '').trim();
      const itinerary = JSON.parse(cleanText) as Itinerary;
      
      // Ensure currency is set to Indian Rupees (₹)
      itinerary.currency = '₹';
      
      return itinerary;
    }
    throw new Error("No response text generated");

  } catch (error) {
    console.error("Gemini API Error:", error);
    // If it's a 400 error related to API key, provide a more specific message
    if (error.message && error.message.includes("API key not valid")) {
      throw new Error("Invalid API key. Please check your VITE_API_KEY in the .env file and ensure it's a valid Gemini API key.");
    }
    throw error;
  }
};

export const getDestinationDetails = async (destination: string) => {
  // Validate API key before making request
  if (!API_KEY) {
    throw new Error("API key not configured. Please set VITE_API_KEY in your .env file.");
  }
  
  if (API_KEY.length < 10) {
    throw new Error("API key appears to be invalid. Please check your .env file.");
  }

  const modelId = "gemini-2.5-flash";
  // Using grounding to get real, up-to-date facts
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Provide a comprehensive travel guide summary for ${destination}. Include: Best time to visit, hidden gems, local festivals, and must-try food.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    // Return the text directly (Markdown) + any grounding metadata if needed
    return {
      text: response.text || "No details available.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Destination Error:", error);
    // If it's a 400 error related to API key, provide a more specific message
    if (error.message && error.message.includes("API key not valid")) {
      throw new Error("Invalid API key. Please check your VITE_API_KEY in the .env file and ensure it's a valid Gemini API key.");
    }
    throw error;
  }
};