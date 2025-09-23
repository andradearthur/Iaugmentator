// Inspired by Amarantidou et al. (2025) on robustness against real-world perturbations.
// This utility applies post-processing filters to generated images on the client-side.

export interface PerturbationConfig {
  jpegQuality?: number;   // 0.0 to 1.0
  gaussianBlur?: number;  // blur radius in pixels
  gaussianNoise?: number; // noise intensity (0-255)
}

/**
 * Applies a series of perturbations to an image using an HTML5 canvas.
 * @param base64Image The base64 string of the source image.
 * @param mimeType The MIME type of the source image.
 * @param config The perturbation configuration object.
 * @returns A promise that resolves to the new base64 string of the perturbed image.
 */
export function applyPerturbations(
  base64Image: string,
  mimeType: string,
  config: PerturbationConfig
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // Apply Gaussian Blur
      if (config.gaussianBlur && config.gaussianBlur > 0) {
        ctx.filter = `blur(${config.gaussianBlur}px)`;
      }
      
      ctx.drawImage(img, 0, 0);

      // Apply Gaussian Noise after drawing the image
      if (config.gaussianNoise && config.gaussianNoise > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * config.gaussianNoise;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Handle JPEG Compression
      if (config.jpegQuality && mimeType.includes('jpeg')) {
        resolve(canvas.toDataURL('image/jpeg', config.jpegQuality));
      } else {
        // For PNG or if no specific JPEG quality is set, export as original type
        resolve(canvas.toDataURL(mimeType));
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = `data:${mimeType};base64,${base64Image}`;
  });
}
