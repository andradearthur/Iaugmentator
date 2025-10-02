import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { GeminiEditResult, BoundingBox } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

// FIX: Initialize 'ai' before using it to derive types.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The type for the request parameters is not exported, so we derive it.
type GenerateContentParameters = Parameters<typeof ai.models.generateContent>[0];

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

const parseJsonResponse = (responseText: string | undefined): any | null => {
    if (!responseText) return null;
    try {
      // Use response.text directly as responseMimeType: "application/json" is used.
      const jsonStr = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Could not parse JSON from response:", responseText);
      return null;
    }
};

/**
 * Inspired by SafeSea paper: Classifies the sea state of a generated image.
 */
export async function classifySeaState(
    imageBase64: string,
    mimeType: string,
    onRetry?: (attempt: number, delay: number) => void
): Promise<number | null> {
    const prompt = `Classifique o estado do mar nesta imagem de 1 a 4, onde 1 é calmo, 2 é levemente agitado, 3 é moderado e 4 é agitado. Responda APENAS com um bloco de JSON markdown com a estrutura: \`\`\`json\n{"sea_state": N}\`\`\``;
    
    const request: GenerateContentParameters = {
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sea_state: { type: Type.INTEGER }
                }
            }
        }
    };

    try {
        const response = await callGeminiWithRetry(request, onRetry);
        const parsedJson = parseJsonResponse(response.text);
        return parsedJson?.sea_state ?? null;
    } catch (error) {
        console.error("Error classifying sea state:", error);
        return null;
    }
}


/**
 * Inspired by SafeSea paper: Checks if the main object is preserved after editing.
 */
export async function checkObjectPreservation(
    originalImageBase64: string,
    generatedImageBase64: string,
    mimeType: string,
    onRetry?: (attempt: number, delay: number) => void
): Promise<boolean> {
    const prompt = `Compare estas duas imagens. A primeira é a original com um veleiro, a segunda é a versão editada. O veleiro principal da primeira imagem ainda está claramente presente, reconhecível e não significativamente distorcido ou cortado na segunda imagem? Responda APENAS com um bloco JSON markdown com a estrutura: \`\`\`json\n{"preserved": true/false}\`\`\``;

    const request: GenerateContentParameters = {
        model: 'gemini-2.5-flash',
        contents: { parts: [
            { inlineData: { data: originalImageBase64, mimeType } }, 
            { inlineData: { data: generatedImageBase64, mimeType } }, 
            { text: prompt }
        ]},
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    preserved: { type: Type.BOOLEAN }
                }
            }
        }
    };
    
    try {
        const response = await callGeminiWithRetry(request, onRetry);
        const parsedJson = parseJsonResponse(response.text);
        return parsedJson?.preserved ?? false;
    } catch (error) {
        console.error("Error checking object preservation:", error);
        return false; // Assume not preserved on error
    }
}

/**
 * Inspired by Tripathi et al. (2018): Evaluates if an image is a "hard example".
 * A hard example is one where the main sailboat is less prominent or partially occluded.
 */
export async function evaluateHardExample(
    generatedImageBase64: string,
    mimeType: string,
    onRetry?: (attempt: number, delay: number) => void
): Promise<boolean> {
    const prompt = `Nesta imagem, o veleiro é o objeto mais proeminente e claramente detectável, ou ele está parcialmente ocluso, distante ou obscurecido pelo cenário/outros objetos (tornando-o um exemplo de detecção difícil)? Responda APENAS com um bloco JSON markdown com a estrutura: \`\`\`json\n{"is_hard_example": true/false}\`\`\`. Retorne 'true' se for um exemplo difícil.`;

    const request: GenerateContentParameters = {
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { data: generatedImageBase64, mimeType } }, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    is_hard_example: { type: Type.BOOLEAN }
                }
            }
        }
    };

    try {
        const response = await callGeminiWithRetry(request, onRetry);
        const parsedJson = parseJsonResponse(response.text);
        return parsedJson?.is_hard_example ?? false;
    } catch (error) {
        console.error("Error evaluating hard example:", error);
        return false;
    }
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
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: originalImageBase64, mimeType } },
        { inlineData: { data: generatedImageBase64, mimeType } },
        { text: prompt },
      ],
    },
     config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                boundingBox: { 
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER }
                }
            }
        }
    }
  };

  try {
    const response = await callGeminiWithRetry(request, onRetry);
    const parsedJson = parseJsonResponse(response.text);
    return parsedJson?.boundingBox ?? null;
  } catch (error) {
    console.error("Error getting bounding box:", error);
    return null; // A failed bounding box should not stop the whole process.
  }
}

/**
 * Public function to edit an image.
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
      config: { 
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        systemInstruction: 'Você é uma ferramenta de edição de imagem. Sua única tarefa é modificar a imagem de entrada com base no prompt de texto e retornar a imagem modificada. Não retorne nenhum texto, descrição ou conversa. Apenas a imagem.',
      },
    };
    
    const imageGenResponse = await callGeminiWithRetry(imageGenRequest, onRetry);
    const imagePart = imageGenResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (!imagePart) {
        const candidate = imageGenResponse.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const safetyRatings = candidate?.safetyRatings;
        const textResponse = candidate?.content?.parts?.find(p => p.text)?.text;

        console.error("Falha na geração da imagem. Detalhes do candidato:", JSON.stringify(candidate, null, 2));

        let errorMessage = "A IA não retornou uma imagem. Tente uma solicitação diferente.";

        if (finishReason) {
            switch (finishReason) {
                case 'SAFETY':
                    errorMessage = "A geração foi bloqueada por motivos de segurança. Tente um prompt mais simples.";
                    const blockedRating = safetyRatings?.find(r => r.blocked);
                    if (blockedRating) {
                        errorMessage += ` (Categoria: ${blockedRating.category})`;
                    }
                    break;
                case 'RECITATION':
                    errorMessage = "A geração foi bloqueada por violação de política (recitation). Tente um prompt diferente.";
                    break;
                case 'OTHER':
                    errorMessage = `A geração falhou por um motivo não especificado pela API.`;
                    break;
                default:
                     errorMessage = `A geração falhou. (Motivo: ${finishReason})`;
            }
        } else if (textResponse) {
            errorMessage = `A IA retornou apenas texto em vez de uma imagem: "${textResponse}"`;
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


/**
 * Generates a short, animated video from a static image.
 */
export async function generate360Video(
  imageBase64: string,
  mimeType: string,
  onProgressUpdate: (message: string) => void,
): Promise<string> {
  try {
    const prompt = 'Dê vida a esta imagem. Anime sutilmente a água, o movimento do veleiro e as nuvens no céu para criar um vídeo curto e realista.';

    onProgressUpdate("Enviando solicitação de vídeo...");

    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1
      }
    });

    onProgressUpdate("Geração iniciada... (pode levar minutos)");
    
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      await new Promise(resolve => setTimeout(resolve, 10000));
      onProgressUpdate(`Verificando... (${pollCount * 10}s)`);
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
      throw new Error(`Operação de vídeo falhou: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Nenhum link de download de vídeo foi retornado.");
    }

    onProgressUpdate("Download do vídeo...");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Falha ao baixar o vídeo: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Erro em generate360Video:", error);
    if (error instanceof Error) throw error;
    throw new Error("Falha na geração do vídeo. Verifique o console.");
  }
}