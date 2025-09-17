
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { GeminiEditResult, BoundingBox } from '../types';

// The type for the request parameters is not exported, so we derive it.
type GenerateContentParameters = Parameters<typeof ai.models.generateContent>[0];

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
    } catch (e) { /* Not a JSON string */ }
  }
  return false;
};

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 2000;

/**
 * A wrapper for the Gemini API call that includes robust retry logic for rate limit errors.
 */
async function callGeminiWithRetry(
  request: GenerateContentParameters,
  onRetry?: (attempt: number, delay: number) => void
): Promise<GenerateContentResponse> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      lastError = error as Error;
      if (isRateLimitError(error)) {
        if (attempt === MAX_RETRIES - 1) break;
        const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`API rate limit hit. Retrying in ${Math.round(backoffDelay / 1000)}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
        if (onRetry) onRetry(attempt + 1, backoffDelay);
        await delay(backoffDelay);
      } else {
        // Non-rate-limit error, re-throw immediately.
        throw error;
      }
    }
  }
  throw new Error(`Atingido o limite de taxa da API após ${MAX_RETRIES} tentativas. Erro final: ${lastError?.message}`);
}

/**
 * Step 2: Analyzes the difference between two images to find the bounding box of the added object.
 */
async function getBoundingBoxForDifference(
  originalImageBase64: string,
  generatedImageBase64: string,
  mimeType: string,
  onRetry?: (attempt: number, delay: number) => void
): Promise<BoundingBox | null> {
  const prompt = `Analise estas duas imagens. A segunda imagem é uma versão editada da primeira, com um único objeto adicionado. Sua tarefa é fornecer a caixa delimitadora (bounding box) do objeto recém-adicionado na segunda imagem. Responda APENAS com um bloco de JSON markdown com a seguinte estrutura: \`\`\`json\n{"boundingBox": [x_min, y_min, width, height]}\`\`\` A origem (0,0) é o canto superior esquerdo.`;

  const request: GenerateContentParameters = {
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        { inlineData: { data: originalImageBase64, mimeType } },
        { inlineData: { data: generatedImageBase64, mimeType } },
        { text: prompt },
      ],
    },
  };

  try {
    const response = await callGeminiWithRetry(request, onRetry);
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);

    if (textPart) {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = textPart.text.match(jsonRegex);
      if (match && match[1]) {
        const parsedJson = JSON.parse(match[1]);
        return parsedJson.boundingBox;
      }
    }
    console.warn("Could not find a valid bounding box JSON in the response.", textPart?.text);
    return null;
  } catch (error) {
    console.error("Error getting bounding box:", error);
    return null; // A failed bounding box should not stop the whole process.
  }
}

/**
 * Public function to edit an image. Uses a two-step process for reliability:
 * 1. Generate the image variation with a simple, image-only request.
 * 2. If an obstacle was added, make a second call to get its bounding box.
 */
export async function editImageWithGemini(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  isObstaclePrompt: boolean,
  onRetry?: (attempt: number, delay: number) => void
): Promise<GeminiEditResult> {
  try {
    // Step 1: Generate the image variation with a simple, direct prompt.
    const imageGenRequest: GenerateContentParameters = {
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [{ inlineData: { data: base64ImageData, mimeType } }, { text: prompt }] },
      // Conforme a documentação, é necessário solicitar ambas as modalidades para edição de imagem.
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    };
    
    const imageGenResponse = await callGeminiWithRetry(imageGenRequest, onRetry);
    const imagePart = imageGenResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (!imagePart) {
      const finishReason = imageGenResponse.candidates?.[0]?.finishReason;
      let errorMessage = "A IA não retornou uma imagem. Tente uma solicitação diferente.";
      if (finishReason === 'SAFETY') {
        errorMessage = "A geração foi bloqueada por motivos de segurança. Tente um prompt mais simples.";
      }
      throw new Error(errorMessage);
    }

    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    let boundingBox: BoundingBox | null = null;

    // Step 2: If an obstacle was added, get the bounding box in a separate call.
    if (isObstaclePrompt) {
      boundingBox = await getBoundingBoxForDifference(base64ImageData, imagePart.inlineData.data, mimeType, onRetry);
    }

    return { imageUrl, text: null, boundingBox };

  } catch (error) {
    console.error("Error in editImageWithGemini:", error);
    if (error instanceof Error) {
      throw error; // Re-throw specific errors for the UI to display.
    }
    throw new Error("Falha na comunicação com a API Gemini. Verifique o console para mais detalhes.");
  }
}
