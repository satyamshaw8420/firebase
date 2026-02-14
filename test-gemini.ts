import { GoogleGenerativeAI } from "@google/generative-ai";

// Test the Gemini API connection
const API_KEY = import.meta.env.VITE_API_KEY || '';

if (!API_KEY) {
  console.error("API key not found! Make sure VITE_API_KEY is set in your .env file");
  // In browser environment, we don't exit
}

console.log("API Key found:", API_KEY ? "Yes" : "No");

try {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  console.log("Gemini AI initialized successfully!");
  console.log("Model:", model.model);
} catch (error) {
  console.error("Error initializing Gemini AI:", error);
}