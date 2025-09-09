export interface UploadedImage {
  name: string;
  type: string;
  size: number;
  base64: string;
  previewUrl: string;
}

export interface GeminiEditResult {
    imageUrl: string | null;
    text: string | null;
}

export interface GeneratedResult {
  originalImage: UploadedImage;
  generatedImageUrl: string;
  generatedText: string | null;
  prompt: string;
}
