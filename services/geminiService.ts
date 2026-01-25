import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AnalyzedFood {
  foodName: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: string;
  servingSize?: string;
}

export const analyzeFood = async (
  imageBase64: string | null, 
  userDescription?: string
): Promise<AnalyzedFood> => {
  const model = "gemini-2.5-flash";
  
  const promptText = `
    Analyze this food item.
    Identify the food item and estimate the total calories AND macronutrients (protein, carbs, fat in grams).
    If the food is packaged or looks like a specific brand/restaurant item, use the search tool to find accurate nutritional information.
    ${userDescription ? `\nThe user provided this description: "${userDescription}". Use this to refine your search and estimation.` : ''}
  `;
  
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
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    foodName: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    macros: {
                        type: Type.OBJECT,
                        properties: {
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER }
                        },
                        required: ["protein", "carbs", "fat"]
                    },
                    confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
                    servingSize: { type: Type.STRING }
                },
                required: ["foodName", "calories", "macros", "confidence"]
            }
        }
    });

    const jsonText = response.text || "{}";
    try {
      const parsedData = JSON.parse(jsonText) as AnalyzedFood;
      return parsedData;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", jsonText);
      return {
        foodName: userDescription || "Unknown Food",
        calories: 0,
        macros: { protein: 0, carbs: 0, fat: 0 },
        confidence: "low",
        servingSize: "Unknown"
      };
    }

  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw new Error("Failed to analyze food. Please try again.");
  }
};

export const estimateExercise = async (
    activityName: string, 
    durationMinutes: number
): Promise<{ calories: number }> => {
    const model = "gemini-2.5-flash";
    
    const promptText = `
        Estimate the calories burned for a person performing the following activity:
        Activity: "${activityName}"
        Duration: ${durationMinutes} minutes.
        Assume average intensity and an average adult body weight if specific data isn't known.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER }
                    },
                    required: ["calories"]
                }
            }
        });
        
        const jsonText = response.text || "{}";
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Exercise Estimate Error:", error);
        // Fallback calculation
        return { calories: Math.round(durationMinutes * 5) };
    }
};
