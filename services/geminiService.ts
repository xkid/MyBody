import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface AnalyzedFood {
  foodName: string;
  calories: number;
  confidence: string;
  servingSize?: string;
}

export const analyzeFood = async (
  imageBase64: string | null, 
  userDescription?: string
): Promise<AnalyzedFood> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const model = "gemini-2.5-flash";
  
  // Construct the prompt
  let promptText = `
    Analyze this food item.
    Identify the food item and estimate the total calories.
    If the food is packaged or looks like a specific brand/restaurant item, use the search tool to find accurate nutritional information.
    
    Return the response as a RAW JSON object (no markdown formatting, no code blocks) with the following keys:
    - "foodName": A short descriptive name of the food.
    - "calories": A number representing the estimated total calories (Kcal).
    - "confidence": "high", "medium", or "low".
    - "servingSize": A string describing the estimated portion (e.g., "1 bowl", "2 slices").
  `;

  if (userDescription) {
    promptText += `\nThe user provided this description: "${userDescription}". Use this to refine your search and estimation.`;
  }
  
  if (!imageBase64 && !userDescription) {
      throw new Error("Please provide an image or a description.");
  }

  const parts: any[] = [{ text: promptText }];
  
  if (imageBase64) {
      parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64
          }
      });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        // We use googleSearch to ground the data, especially if specific brands are mentioned or detected
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "{}";
    
    // Attempt to clean markdown if present (e.g., ```json ... ```)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const data = JSON.parse(cleanedText) as AnalyzedFood;
      return data;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return {
        foodName: userDescription || "Unknown Food",
        calories: 0,
        confidence: "low",
        servingSize: "Unknown"
      };
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze food. Please try again.");
  }
};