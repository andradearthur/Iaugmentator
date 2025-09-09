import React, { useState, useCallback } from 'react';
import type { UploadedImage, GeneratedResult } from './types';
import { editImageWithGemini } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ControlPanel from './components/ControlPanel';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';

// Declara JSZip para TypeScript, pois é carregado via CDN
declare var JSZip: any;

export default function App(): React.ReactElement {
  const [originalImages, setOriginalImages] = useState<UploadedImage[]>([]);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [obstaclePrompt, setObstaclePrompt] = useState<string>('um pequeno barco de pesca vermelho, um navio cargueiro, uma boia de navegação amarela');
  const [scenarioPrompt, setScenarioPrompt] = useState<string>('um dia nublado com neblina leve, pôr do sol com céu alaranjado, mar agitado com ondas altas');
  const [variationsPerImage, setVariationsPerImage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (images: UploadedImage[]) => {
    setOriginalImages(images);
    setGeneratedResults([]);
    setError(null);
  };

  const handleGenerateClick = useCallback(async () => {
    if (originalImages.length === 0) {
      setError('Por favor, carregue pelo menos uma imagem.');
      return;
    }

    const obstacles = obstaclePrompt.split(',').map(s => s.trim()).filter(Boolean);
    const scenarios = scenarioPrompt.split(',').map(s => s.trim()).filter(Boolean);

    if (obstacles.length === 0 || scenarios.length === 0) {
      setError('Por favor, forneça pelo menos um obstáculo e um cenário.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedResults([]);
    const totalJobs = originalImages.length * variationsPerImage;
    setProgress({ current: 0, total: totalJobs });

    let currentJob = 0;

    for (const image of originalImages) {
      for (let i = 0; i < variationsPerImage; i++) {
        currentJob++;
        setProgress({ current: currentJob, total: totalJobs });

        const randomObstacle = obstacles[Math.floor(Math.random() * obstacles.length)];
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const fullPrompt = `Adicione o seguinte obstáculo à imagem: "${randomObstacle}". Altere o cenário para: "${randomScenario}".`;

        try {
          const result = await editImageWithGemini(image.base64, image.type, fullPrompt);
          if (result.imageUrl) {
            const newResult: GeneratedResult = {
              originalImage: image,
              generatedImageUrl: result.imageUrl,
              generatedText: result.text,
              prompt: fullPrompt,
            };
            setGeneratedResults(prevResults => [...prevResults, newResult]);
          }
        } catch (e) {
          console.error(`Falha ao gerar a imagem ${currentJob}/${totalJobs} para ${image.name}:`, e);
          // Opcional: Adicionar um estado para rastrear erros individuais
        }
      }
    }

    setIsLoading(false);
    setProgress(null);
  }, [originalImages, obstaclePrompt, scenarioPrompt, variationsPerImage]);

  const handleDownloadZip = async () => {
    if (generatedResults.length === 0 || typeof JSZip === 'undefined') {
        console.error("JSZip não está carregado ou não há resultados para download.");
        return;
    }

    const zip = new JSZip();
    
    for (const [index, result] of generatedResults.entries()) {
        try {
            const response = await fetch(result.generatedImageUrl);
            const blob = await response.blob();
            
            const originalName = result.originalImage.name.split('.').slice(0, -1).join('.') || `image_${index}`;
            const fileExtension = blob.type.split('/')[1] || 'png';
            const fileName = `${originalName}_variation_${index + 1}.${fileExtension}`;
            
            zip.file(fileName, blob);
        } catch(e) {
            console.error("Falha ao buscar ou adicionar imagem ao zip:", result.generatedImageUrl, e);
        }
    }
    
    zip.generateAsync({ type: "blob" })
        .then(function(content: Blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "augmented_images.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-200 h-fit">
            <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">1. Carregar Imagens Base</h2>
            <ImageUploader onImageUpload={handleImageUpload} />
            
            {originalImages.length > 0 && (
              <div className="mt-6">
                <ControlPanel
                  obstaclePrompt={obstaclePrompt}
                  setObstaclePrompt={setObstaclePrompt}
                  scenarioPrompt={scenarioPrompt}
                  setScenarioPrompt={setScenarioPrompt}
                  variationsPerImage={variationsPerImage}
                  setVariationsPerImage={setVariationsPerImage}
                  onGenerate={handleGenerateClick}
                  isLoading={isLoading}
                  disabled={originalImages.length === 0}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-lg border border-gray-200 min-h-[400px]">
                <Spinner />
                <p className="mt-4 text-navy text-lg font-medium">
                  {progress ? `Gerando variação ${progress.current} de ${progress.total}...` : 'Iniciando...'}
                </p>
                {progress && progress.total > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div className="bg-ocean-blue h-2.5 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                    </div>
                )}
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                {generatedResults.length > 0 ? (
                  <ResultDisplay
                    results={generatedResults}
                    onDownloadZip={handleDownloadZip}
                  />
                ) : (
                   <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-lg border border-gray-200 min-h-[400px] text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-ocean-blue mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-2xl font-bold text-navy">Bem-vindo ao Augmentor de Imagens</h3>
                      <p className="mt-2 text-gray-500 max-w-md">Carregue uma ou mais imagens e defina os parâmetros para criar variações para o seu dataset.</p>
                   </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}