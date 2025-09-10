// FIX: Removed unused 'Type' import.
import { GoogleGenAI, Modality } from "@google/genai";
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

const getPrompt = (originalPrompt: string): string => {
    const baseInstruction = `You are an expert image editor. Your task is to seamlessly edit the provided image based on the user's request: "${originalPrompt}".`;

    const outputInstructions = `
After editing the image, your response MUST contain two parts:
1. The edited image.
2. A text part containing ONLY a markdown JSON block.

The JSON object must specify the bounding box of the primary obstacle you added.
- The bounding box must be precise and tightly enclose ONLY the newly added obstacle.
- The coordinates must be in COCO format: [x_min, y_min, width, height], where (x_min, y_min) is the top-left corner of the box.

Example of the required JSON format:
\`\`\`json
{
  "boundingBox": [120, 250, 80, 150]
}
\`\`\`
Do not add any other text, explanation, or confirmation fields. Your text response must strictly contain only the JSON block.`;

    return `${baseInstruction}\n\n${outputInstructions}`;
};


// FIX: Removed unused 'seed' parameter.
export async function editImageWithGemini(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  onRetry?: (attempt: number, delay: number) => void
): Promise<GeminiEditResult> {
  const MAX_RETRIES = 5;
  const INITIAL_BACKOFF_MS = 2000;
  
  let lastError: Error | null = null;
  const finalPrompt = getPrompt(prompt);

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
        },
      });

      if (
        !response.candidates ||
        response.candidates.length === 0 ||
        !response.candidates[0].content ||
        !response.candidates[0].content.parts ||
        response.candidates[0].content.parts.length === 0
      ) {
        const finishReason = response.candidates?.[0]?.finishReason;
        console.error("Geração bloqueada ou resposta vazia da API.", { finishReason, response });
        
        let errorMessage = "A IA retornou uma resposta vazia.";
        if (finishReason === 'SAFETY') {
            errorMessage = "A geração foi bloqueada por motivos de segurança. Tente um prompt mais simples ou diferente.";
        } else if (finishReason) {
            errorMessage = `A geração falhou com o motivo: ${finishReason}.`;
        }
        
        throw new Error(errorMessage);
      }

      const result: GeminiEditResult = { imageUrl: null, text: null, boundingBox: null };
      const parts = response.candidates[0].content.parts;
      const imageParts = parts.filter(p => p.inlineData);
      const textPart = parts.find(p => p.text);

      if (textPart) {
          try {
              const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
              const match = textPart.text.match(jsonRegex);
              if (match && match[1]) {
                  const parsedJson = JSON.parse(match[1]);
                  result.boundingBox = parsedJson.boundingBox as BoundingBox;
              } else {
                 console.warn("Could not find a JSON markdown block in the response:", textPart.text);
                 result.text = textPart.text;
              }
          } catch (e) {
              console.warn("Could not parse bounding box JSON from text part:", textPart.text, e);
              result.text = textPart.text; // Fallback
          }
      }

      if (imageParts.length > 0) {
          result.imageUrl = `data:${imageParts[0].inlineData.mimeType};base64,${imageParts[0].inlineData.data}`;
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
        // Re-throw the original error if it's one of our specific ones, otherwise wrap it.
        if (error.message.includes("A IA retornou uma resposta vazia") || error.message.includes("A geração foi bloqueada")) {
            throw error;
        }
        throw new Error("Falha na comunicação com a API Gemini. Verifique o console para mais detalhes.");
      }
    }
  }

  throw new Error(`Atingido o limite de taxa da API após ${MAX_RETRIES} tentativas. Tente novamente mais tarde. Erro final: ${lastError?.message}`);
}