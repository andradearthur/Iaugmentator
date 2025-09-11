import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { UploadedImage, GeneratedResult } from './types';
import { editImageWithGemini } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ControlPanel from './components/ControlPanel';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';

declare var JSZip: any;

const COST_PER_IMAGE_USD = 0.0025;

// A lista de modificadores foi simplificada para ser mais direta, removendo
// interações complexas como reflexos e oclusão para aumentar a confiabilidade.
const sizeAndLocationModifiers = [
  'em um tamanho e posição aleatórios na imagem',
  'como um objeto pequeno e distante no horizonte',
  'como um objeto grande e próximo em primeiro plano',
  'de tamanho médio e a meia distância',
  'no lado esquerdo da imagem',
  'no lado direito da imagem',
  'no centro da imagem',
  'no horizonte'
];


export default function App(): React.ReactElement {
  const [originalImages, setOriginalImages] = useState<UploadedImage[]>([]);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [obstaclePrompt, setObstaclePrompt] = useState<string>('um pequeno barco de pesca vermelho, um navio cargueiro, uma boia de navegação amarela');
  const [scenarioPrompt, setScenarioPrompt] = useState<string>('um dia nublado com neblina leve, pôr do sol com céu alaranjado, mar agitado com ondas altas');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 100000));
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const { 
    totalVariations, 
    estimatedCost, 
    obstaclePrompts, 
    scenarioPrompts,
    uniquePromptsCount
  } = useMemo(() => {
    const obstacles = obstaclePrompt.split(',').map(s => s.trim()).filter(Boolean);
    const scenarios = scenarioPrompt.split(',').map(s => s.trim()).filter(Boolean);
    
    const obsPrompts: string[] = [];
    if (obstacles.length > 0) {
      for (const obstacle of obstacles) {
        for (const modifier of sizeAndLocationModifiers) {
            obsPrompts.push(`Adicione um(a) "${obstacle}" ${modifier}.`);
        }
      }
    }

    const scnPrompts: string[] = [];
    if (scenarios.length > 0) {
      for (const scenario of scenarios) {
        scnPrompts.push(`Mude o cenário da imagem para "${scenario}".`);
      }
    }

    const hasObstacles = obsPrompts.length > 0;
    const hasScenarios = scnPrompts.length > 0;
    
    let variationsPerImage = 0;
    if (hasObstacles && hasScenarios) {
        // Para cada cenário, geramos 1 imagem de cenário + N imagens de obstáculo
        variationsPerImage = scnPrompts.length * (1 + obsPrompts.length);
    } else {
        variationsPerImage = obsPrompts.length + scnPrompts.length;
    }
    const totalVars = originalImages.length * variationsPerImage;

    let scenarioApiCallCount = 0;
    let obstacleApiCallCount = 0;
    if (hasObstacles && hasScenarios) {
        scenarioApiCallCount = originalImages.length * scnPrompts.length; // para a base de cenário
        obstacleApiCallCount = scenarioApiCallCount * obsPrompts.length; // obstaculos em cada cenário
    } else if (hasObstacles) {
        obstacleApiCallCount = originalImages.length * obsPrompts.length;
    } else if (hasScenarios) {
        scenarioApiCallCount = originalImages.length * scnPrompts.length;
    }
    
    const totalApiCallCount = scenarioApiCallCount + (obstacleApiCallCount * 2);
    const cost = totalApiCallCount * COST_PER_IMAGE_USD;

    return { 
        totalVariations: totalVars, 
        estimatedCost: cost,
        obstaclePrompts: obsPrompts,
        scenarioPrompts: scnPrompts,
        uniquePromptsCount: obsPrompts.length + scnPrompts.length, // Fallback for single-type generation
    };
  }, [obstaclePrompt, scenarioPrompt, originalImages]);

  const handleImageUpload = (images: UploadedImage[]) => {
    setOriginalImages(images);
    setGeneratedResults([]);
    setError(null);
    setCompletionMessage(null);
  };

  const handleGenerateClick = useCallback(async () => {
    if (originalImages.length === 0) {
      setError('Por favor, carregue pelo menos uma imagem.');
      return;
    }

    if (obstaclePrompts.length === 0 && scenarioPrompts.length === 0) {
      setError('Por favor, forneça pelo menos um obstáculo ou um cenário válido.');
      return;
    }

    setIsLoading(true);
    isStoppingRef.current = false;
    setError(null);
    setGeneratedResults([]);
    setStatusMessage(null);
    setCompletionMessage(null);
    
    let failedJobsCount = 0;
    const totalJobs = totalVariations;
    setProgress({ current: 0, total: totalJobs });
    let currentJob = 0;

    const onRetryCallback = (attempt: number, delay: number) => {
        if(isStoppingRef.current) return;
        setStatusMessage(`Limite da API atingido. Tentando novamente em ${Math.ceil(delay / 1000)}s... (Tentativa ${attempt} de 5)`);
    };

    for (const image of originalImages) {
      const hasObstacles = obstaclePrompts.length > 0;
      const hasScenarios = scenarioPrompts.length > 0;

      if (hasObstacles && hasScenarios) {
        // Lógica de geração em cadeia: Cenário -> Obstáculo
        for (const scenarioP of scenarioPrompts) {
          if (isStoppingRef.current) break;

          // Etapa 1: Gerar imagem de cenário
          currentJob++;
          setProgress({ current: currentJob, total: totalJobs });
          setStatusMessage(`Gerando cenário: "${scenarioP.substring(28, scenarioP.length - 2)}"`);
          try {
            const sceneryResult = await editImageWithGemini(image.base64, image.type, scenarioP, onRetryCallback);
            
            if (sceneryResult?.imageUrl) {
              setGeneratedResults(prev => [...prev, {
                originalImage: image,
                generatedImageUrl: sceneryResult.imageUrl,
                generatedText: sceneryResult.text,
                prompt: scenarioP,
                boundingBox: undefined,
              }]);

              const sceneryImageParts = sceneryResult.imageUrl.split(',');
              const sceneryImageMimeType = sceneryImageParts[0].split(':')[1].split(';')[0];
              const sceneryImageBase64 = sceneryImageParts[1];

              // Etapa 2: Gerar variações de obstáculo sobre a imagem de cenário
              for (const obstacleP of obstaclePrompts) {
                if (isStoppingRef.current) break;
                currentJob++;
                setProgress({ current: currentJob, total: totalJobs });
                setStatusMessage(`Adicionando obstáculo...`);
                try {
                  const finalResult = await editImageWithGemini(sceneryImageBase64, sceneryImageMimeType, obstacleP, onRetryCallback);
                  if (finalResult?.imageUrl) {
                    setGeneratedResults(prev => [...prev, {
                      originalImage: image,
                      generatedImageUrl: finalResult.imageUrl,
                      generatedText: finalResult.text,
                      prompt: `${obstacleP} em um cenário de ${scenarioP.substring(28, scenarioP.length - 2)}`,
                      boundingBox: finalResult.boundingBox ?? undefined,
                    }]);
                  } else { failedJobsCount++; }
                } catch(e) { console.error(e); failedJobsCount++; }
              }
            } else {
              // Falha na geração do cenário significa que os sub-jobs também falham
              const skippedJobs = obstaclePrompts.length;
              failedJobsCount += 1 + skippedJobs;
              currentJob += skippedJobs;
            }
          } catch(e) {
            console.error(e);
            const skippedJobs = obstaclePrompts.length;
            failedJobsCount += 1 + skippedJobs;
            currentJob += skippedJobs;
          }
        }
      } else {
        // Lógica original para apenas obstáculos ou apenas cenários
        const promptsToRun = [...obstaclePrompts, ...scenarioPrompts];
        for (const fullPrompt of promptsToRun) {
          if (isStoppingRef.current) break;
          currentJob++;
          setProgress({ current: currentJob, total: totalJobs });
          setStatusMessage(`Gerando variação...`);
          try {
            const result = await editImageWithGemini(image.base64, image.type, fullPrompt, onRetryCallback);
            if (result.imageUrl) {
              setGeneratedResults(prevResults => [...prevResults, {
                originalImage: image,
                generatedImageUrl: result.imageUrl,
                generatedText: result.text,
                prompt: fullPrompt,
                boundingBox: result.boundingBox ?? undefined,
              }]);
            } else { failedJobsCount++; }
          } catch (e) { console.error(e); failedJobsCount++; }
        }
      }
      if (isStoppingRef.current) break;
    }

    setIsLoading(false);
    setProgress(null);
    setStatusMessage(null);
    
    const successCount = currentJob - failedJobsCount;
    let summary;
    if (isStoppingRef.current) {
      summary = `Geração parada pelo usuário. ${successCount} imagens foram criadas com sucesso de ${currentJob} tentativas.`;
    } else {
       summary = `Geração concluída! ${successCount} de ${totalJobs} imagens foram criadas com sucesso.`;
       if (failedJobsCount > 0) summary += ` ${failedJobsCount} falharam.`;
    }
    setCompletionMessage(summary);
    isStoppingRef.current = false;
  }, [originalImages, obstaclePrompts, scenarioPrompts, seed, totalVariations]);

  const handleStopClick = () => {
    isStoppingRef.current = true;
    setStatusMessage("Parando a geração após a imagem atual...");
    const stopButton = document.getElementById('stop-button');
    if (stopButton) {
      stopButton.setAttribute('disabled', 'true');
      stopButton.textContent = 'Parando...';
    }
  };

  const handleDownloadZip = async () => {
    if (generatedResults.length === 0 || typeof JSZip === 'undefined') return;

    const zip = new JSZip();
    const annotations: any[] = [];

    for (const [index, result] of generatedResults.entries()) {
      try {
        const originalName = result.originalImage.name.split('.').slice(0, -1).join('.') || `image_${index}`;
        const variationSuffix = `_variation_${index + 1}`;
        
        const imgResponse = await fetch(result.generatedImageUrl);
        const imgBlob = await imgResponse.blob();
        const imgFileExtension = result.generatedImageUrl.startsWith('data:image/png') ? 'png' : 'jpeg';
        const imgFileName = `${originalName}${variationSuffix}.${imgFileExtension}`;
        zip.file(imgFileName, imgBlob);

        const annotationData: any = {
            image_file: imgFileName,
            original_file: result.originalImage.name,
            prompt: result.prompt,
            generation_seed: seed + index + 1
        };

        if (result.boundingBox) {
          annotationData.bounding_box = result.boundingBox;
        }
        
        annotations.push(annotationData);

      } catch(e) {
        console.error("Falha ao adicionar imagem ao zip:", result.generatedImageUrl, e);
      }
    }
    
    zip.file("annotations.json", JSON.stringify(annotations, null, 2));

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "augmented_images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header estimatedCost={estimatedCost} totalVariations={totalVariations} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-200 h-fit">
            <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">1. Carregar Imagens</h2>
            <ImageUploader onImageUpload={handleImageUpload} />
            
            {originalImages.length > 0 && (
              <div className="mt-6">
                <ControlPanel
                  obstaclePrompt={obstaclePrompt}
                  setObstaclePrompt={setObstaclePrompt}
                  scenarioPrompt={scenarioPrompt}
                  setScenarioPrompt={setScenarioPrompt}
                  uniquePromptsCount={totalVariations / (originalImages.length || 1)}
                  seed={seed}
                  setSeed={setSeed}
                  onGenerate={handleGenerateClick}
                  isLoading={isLoading}
                  disabled={originalImages.length === 0}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
          
            {isLoading && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Spinner />
                        <p className="ml-4 text-navy text-lg font-medium">
                          {progress ? `Gerando variação ${progress.current} de ${progress.total}...` : 'Iniciando...'}
                        </p>
                    </div>
                    <button 
                        id="stop-button"
                        onClick={handleStopClick}
                        className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-wait"
                    >
                        Parar Geração
                    </button>
                </div>
                {statusMessage && <p className="mt-2 text-ocean-blue text-sm text-center">{statusMessage}</p>}
                {progress && progress.total > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div className="bg-ocean-blue h-2.5 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                    </div>
                )}
              </div>
            )}

            {completionMessage && (
               <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6" role="alert">
                <p className="font-bold">Resumo da Geração</p>
                <p>{completionMessage}</p>
              </div>
            )}
            
            {generatedResults.length > 0 ? (
              <ResultDisplay
                results={generatedResults}
                onDownloadZip={handleDownloadZip}
              />
            ) : (
               !isLoading && !completionMessage && (
                <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-lg border border-gray-200 min-h-[400px] text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-ocean-blue mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-navy">Bem-vindo ao Augmentor de Imagens</h3>
                    <p className="mt-2 text-gray-500 max-w-md">Carregue uma ou mais imagens e defina os parâmetros para criar variações para o seu dataset.</p>
                </div>
               )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}