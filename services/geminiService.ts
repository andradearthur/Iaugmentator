
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { GeminiEditResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function editImageWithGemini(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<GeminiEditResult> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const result: GeminiEditResult = { imageUrl: null, text: null };

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        } else if (part.text) {
          result.text = part.text;
        }
      }
    }

    if (!result.imageUrl) {
        throw new Error("A IA não retornou uma imagem. Tente uma solicitação diferente.");
    }
    
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Falha na comunicação com a API Gemini. Verifique o console para mais detalhes.");
  }
}
