export interface UploadedImage {
  name: string;
  type: string;
  size: number;
  base64: string;
  previewUrl: string;
}

export interface BoundingBox {
    x_min: number;
    y_min: number;
    width: number;
    height: number;
}

export interface GeminiEditResult {
    imageUrl: string | null;
    maskUrl: string | null;
    text: string | null;
    boundingBox: BoundingBox | null;
}

export interface GeneratedResult {
  originalImage: UploadedImage;
  generatedImageUrl: string;
  generatedMaskUrl?: string;
  generatedText: string | null;
  prompt: string;
  boundingBox?: BoundingBox;
}