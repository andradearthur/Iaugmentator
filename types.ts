export interface UploadedImage {
  name: string;
  type: string;
  size: number;
  base64: string;
  previewUrl: string;
}

/**
 * Bounding box in COCO format: [x_min, y_min, width, height].
 */
export type BoundingBox = [number, number, number, number];

export interface GeminiEditResult {
    imageUrl: string | null;
    text: string | null;
    boundingBox: BoundingBox | null;
}

export interface GeneratedResult {
  originalImage: UploadedImage;
  generatedImageUrl: string;
  generatedText: string | null;
  prompt: string;
  boundingBox?: BoundingBox;
  seaState?: number;
  isHardExample?: boolean;
  generatedVideoUrl?: string;
}

export interface ObstacleConfig {
  name: string;
  variations: number;
  modifiers: {
    proximity: boolean;
    size: boolean;
    edge: boolean;
    horizon: boolean;
  };
}
