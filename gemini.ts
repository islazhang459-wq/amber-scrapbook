import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeDesignImage(base64Image: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/png", data: base64Image.split(',')[1] || base64Image } },
            { text: "Analyze this design screenshot and provide 5-10 professional design terminology keywords that describe its style, layout, typography, or UI elements. Return ONLY a JSON array of strings." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["Design", "UI", "Layout"];
  }
}
