import React, { useState, useCallback } from 'react';
import type { UploadedImage } from '../types';

interface ImageUploaderProps {
  onImageUpload: (images: UploadedImage[]) => void;
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps): React.ReactElement {
  const [previews, setPreviews] = useState<Array<{ url: string, name: string }>>([]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // FIX: Add explicit type for 'file' parameter to resolve 'unknown' type errors.
      const imageFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        alert('Nenhum ficheiro de imagem válido selecionado.');
        return;
      }
      
      // FIX: Add explicit type for 'file' parameter to ensure correct type inference downstream.
      const uploadedImagesPromises = imageFiles.map((file: File) => {
        return new Promise<UploadedImage>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            const previewUrl = URL.createObjectURL(file);
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              base64: base64String,
              previewUrl: previewUrl
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const uploadedImages = await Promise.all(uploadedImagesPromises);
        setPreviews(uploadedImages.map(img => ({ url: img.previewUrl, name: img.name })));
        onImageUpload(uploadedImages);
      } catch (error) {
        console.error("Error reading files:", error);
        alert("Ocorreu um erro ao ler um ou mais ficheiros.");
      }
    }
  }, [onImageUpload]);

  const handleClear = () => {
    setPreviews([]);
    onImageUpload([]);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-ocean-blue hover:text-navy focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ocean-blue">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-ocean-blue transition-colors duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="mt-2 block text-sm font-medium text-gray-600">
            Clique para carregar imagens
          </span>
          <p className="text-xs text-gray-500">PNG, JPG, WEBP, etc. (Múltiplos ficheiros permitidos)</p>
        </div>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
      </label>

      {previews.length > 0 && (
        <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">{previews.length} imagem(s) selecionada(s):</p>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                {previews.map((p, index) => (
                    <div key={index} className="relative">
                        <img src={p.url} alt={`Preview ${p.name}`} className="h-20 w-full rounded-md object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">{p.name}</div>
                    </div>
                ))}
            </div>
          <button 
            onClick={handleClear}
            className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center"
          >
            Remover todas as imagens
          </button>
        </div>
      )}
    </div>
  );
}