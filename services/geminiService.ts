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

    Return the result strictly as a valid JSON object with the following structure:
    {
      "foodName": "string",
      "calories": number,
      "macros": {
        "protein": number,
        "carbs": number,
        "fat": number
      },
      "confidence": "high" | "medium" | "low",
      "servingSize": "string"
    }
    Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.
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
            // responseMimeType and responseSchema are incompatible with tools in this model version
        }
    });

    let jsonText = response.text || "{}";
    
    // Clean up potential markdown formatting (```json ... ```)
    jsonText = jsonText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    try {
      const parsedData = JSON.parse(jsonText) as AnalyzedFood;
      
      // Basic validation
      if (!parsedData.foodName) {
          // If parsing succeeded but data is empty/wrong structure
           return {
            foodName: parsedData.foodName || userDescription || "Unknown Food",
            calories: typeof parsedData.calories === 'number' ? parsedData.calories : 0,
            macros: parsedData.macros || { protein: 0, carbs: 0, fat: 0 },
            confidence: "low",
            servingSize: "Unknown"
          };
      }

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
                // Tools not used here, so Schema is safe
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