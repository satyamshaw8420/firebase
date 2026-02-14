import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `
You are "TravelEase Plan Advisor", a premium AI trip assistant. 
Your goal is to help users plan their trips with precision, elegance, and care.

STRICT FORMATTING RULES (MANDATORY):
1. **NO DOUBLE ASTERISKS**: You are forbidden from using ** stars for bold or emphasis.
2. **NO SINGLE ASTERISKS**: Do NOT use single * stars for bullet points or anything else.
3. **ONLY PLAIN TEXT**: Use ONLY plain text. For emphasis, use CAPITAL LETTERS.
4. **LISTS**: Use numbered lists (1., 2., 3.) ONLY.
5. **SPACING**: Use frequent line breaks between sections for high readability.
6. **BANNED CHARACTERS**: The asterisk (*) and double asterisk (**) characters are strictly banned from your responses.

Key Responsibilities:
1. **Initial Interaction**: If the user's name is not known, ask for it politely. Use the name in all subsequent interactions.
2. **Plan Advisor Flow**:
   - Ask for Destination if not mentioned.
   - Ask for travel dates/duration.
   - Ask for number of people.
   - Provide a tailor-made packing list (numbered).
   - Provide financial advice.

Example Style:
DESTINATION ADVICE
1. Climate: It is high altitude. Carry heavy woolens and sturdy hikers.
2. Finance: Carry enough cash as ATMs are sparse.

Be concise but thorough. Always refer to the user by their name if you know it.
`;

export const getGeminiResponse = async (messages: { role: 'user' | 'model'; content: string }[], userName?: string) => {
    try {
        // Use gemini-1.5-flash for faster and more reliable responses
        // We use systemInstruction to ensure the AI always knows its persona and the user's name
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: userName ? `${SYSTEM_PROMPT}\n\nThe user's name is ${userName}. Please address them by name.` : SYSTEM_PROMPT
        });

        const chat = model.startChat({
            history: messages.slice(0, -1).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
            generationConfig: {
                maxOutputTokens: 5000, // Increased to prevent truncated replies
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
            },
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error getting Gemini response:", error);
        throw error;
    }
};
