import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { GeminiEditResult, BoundingBox } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRateLimitError = (error: any): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('resource_exhausted') || message.includes('429')) return true;
    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.status === 'RESOURCE_EXHAUSTED' || parsed?.error?.code === 429) {
        return true;
      }
    } catch (e) {
      // Not a JSON string
    }
  }
  return false;
};

const boundingBoxSchema = {
    type: Type.OBJECT,
    properties: {
        x_min: { type: Type.INTEGER, description: "The top-left X coordinate of the bounding box." },
        y_min: { type: Type.INTEGER, description: "The top-left Y coordinate of the bounding box." },
        width: { type: Type.INTEGER, description: "The width of the bounding box." },
        height: { type: Type.INTEGER, description: "The height of the bounding box." }
    },
    required: ["x_min", "y_min", "width", "height"]
};


const getPrompt = (originalPrompt: string, annotationType: 'mask' | 'bbox' | 'none'): string => {
    const baseInstruction = `You are an expert image editing AI. Your task is to perform an edit on an image according to the user's request: '${originalPrompt}'.`;

    if (annotationType === 'bbox') {
        return `${baseInstruction}
You MUST return two images and one JSON object.

1.  **Edited Image**: The first image should be the original image modified as requested.
2.  **Segmentation Mask**: The second image must be a segmentation mask of ONLY the main obstacle added. The added obstacle must be pure white (#FFFFFF), and all other pixels must be pure black (#000000).
3.  **JSON Response**: You must provide a JSON object with the bounding box of the added obstacle. The coordinates must be integers. The origin (0,0) is the top-left corner.

Strictly follow these output requirements.`;
    }

    if (annotationType === 'mask') {
         return `You are an expert image editing AI. Your task is to perform an edit on an image and also provide a precise segmentation mask for the added object.

You will receive an image and a text prompt. You MUST return two images and one text response.

1.  **Edited Image**: The first image should be the original image modified according to the user's request: '${originalPrompt}'
2.  **Segmentation Mask**: The second image must be a segmentation mask of ONLY the main obstacle added based on the prompt. This mask must be the same dimensions as the edited image. The pixels corresponding to the added obstacle must be pure white (#FFFFFF), and all other pixels must be pure black (#000000).
3.  **Text Response**: Briefly confirm the action, for example: "Image edited and mask generated."

Strictly follow these output requirements.`;
    }

    return originalPrompt; // No annotation
};


export async function editImageWithGemini(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  annotationType: 'mask' | 'bbox' | 'none',
  seed: number,
  onRetry?: (attempt: number, delay: number) => void
): Promise<GeminiEditResult> {
  const MAX_RETRIES = 5;
  const INITIAL_BACKOFF_MS = 2000;
  
  let lastError: Error | null = null;
  const finalPrompt = getPrompt(prompt, annotationType);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
          parts: [
            { inlineData: { data: base64ImageData, mimeType: mimeType }},
            { text: finalPrompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
          ...(annotationType === 'bbox' && {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    boundingBox: boundingBoxSchema,
                    confirmation: { type: Type.STRING }
                },
                required: ["boundingBox", "confirmation"]
            }
          }),
          seed: seed,
        },
      });

      const result: GeminiEditResult = { imageUrl: null, maskUrl: null, text: null, boundingBox: null };
      const parts = response.candidates[0].content.parts;
      const imageParts = parts.filter(p => p.inlineData);
      const textPart = parts.find(p => p.text);

      if (textPart) {
          if (annotationType === 'bbox') {
              try {
                  const parsedJson = JSON.parse(textPart.text);
                  result.boundingBox = parsedJson.boundingBox as BoundingBox;
                  result.text = parsedJson.confirmation as string;
              } catch (e) {
                  console.warn("Could not parse bounding box JSON from text part:", textPart.text);
                  result.text = textPart.text; // Fallback
              }
          } else {
              result.text = textPart.text;
          }
      }

      if (imageParts.length > 0) {
          result.imageUrl = `data:${imageParts[0].inlineData.mimeType};base64,${imageParts[0].inlineData.data}`;
          if ((annotationType === 'mask' || annotationType === 'bbox') && imageParts.length > 1) {
              result.maskUrl = `data:${imageParts[1].inlineData.mimeType};base64,${imageParts[1].inlineData.data}`;
          }
      }

      if (!result.imageUrl) {
          throw new Error("A IA não retornou uma imagem. Tente uma solicitação diferente.");
      }
      
      return result;

    } catch (error) {
      lastError = error as Error;
      if (isRateLimitError(error)) {
        if (attempt === MAX_RETRIES - 1) break;
        const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`API rate limit hit. Retrying in ${Math.round(backoffDelay / 1000)}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
        if (onRetry) onRetry(attempt + 1, backoffDelay);
        await delay(backoffDelay);
      } else {
        console.error("Error calling Gemini API:", error);
        throw new Error("Falha na comunicação com a API Gemini. Verifique o console para mais detalhes.");
      }
    }
  }

  throw new Error(`Atingido o limite de taxa da API após ${MAX_RETRIES} tentativas. Tente novamente mais tarde. Erro final: ${lastError?.message}`);
}