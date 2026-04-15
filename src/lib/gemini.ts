import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TextBlock {
  text: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  fontSize?: number;
  fontWeight?: string;
}

export async function recognizeDocument(base64Image: string): Promise<TextBlock[]> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Reconoce todo el texto de este documento. Para cada bloque de texto, proporciona el texto exacto y sus coordenadas de caja delimitadora (bounding box) en formato [ymin, xmin, ymax, xmax] donde los valores están normalizados de 0 a 1000. 
            También intenta estimar el tamaño de fuente (fontSize) y el peso de la fuente (fontWeight: 'normal' o 'bold').
            Responde estrictamente en formato JSON.`,
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            box_2d: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: "[ymin, xmin, ymax, xmax]",
            },
            fontSize: { type: Type.NUMBER },
            fontWeight: { type: Type.STRING },
          },
          required: ["text", "box_2d"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
}
