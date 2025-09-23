import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { UploadedImage, GeneratedResult } from './types';
import { editImageWithGemini, classifySeaState, checkObjectPreservation, evaluateHardExample } from './services/geminiService';
import { applyPerturbations, PerturbationConfig } from './utils/imageProcessor';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ControlPanel from './components/ControlPanel';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import TheoryPage from './components/TheoryPage';

declare var JSZip: any;

const COST_PER_IMAGE_USD = 0.0025;
const REQUEST_COOLDOWN_MS = 1500; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sizeAndLocationModifiers = [
    'a uma distância crível, parecendo pequeno e integrado ao horizonte',
    'surgindo de forma natural à meia-distância, com reflexos na água',
    'parcialmente visível na borda esquerda do quadro, como se estivesse passando',
    'parcialmente visível na borda direita do quadro, como se estivesse passando',
    'em um tamanho e posição que pareçam realistas e não chamem atenção excessiva',
    'próximo ao veleiro, em uma escala que sugira perigo de colisão iminente, mantendo o realismo',
    'muito ao longe, quase imperceptível, para testar a detecção a longa distância'
];


export default function App(): React.ReactElement {
  const [originalImages, setOriginalImages] = useState<UploadedImage[]>([]);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [obstaclePrompt, setObstaclePrompt] = useState<string>('');
  const [scenarioPrompt, setScenarioPrompt] = useState<string>('');
  const [seaStatePrompt, setSeaStatePrompt] = useState<string>('');
  const [verifyPreservation, setVerifyPreservation] = useState<boolean>(true);
  const [hardenExamples, setHardenExamples] = useState<boolean>(false);
  const [perturbationConfig, setPerturbationConfig] = useState<PerturbationConfig>({});

  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 100000));
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const [view, setView] = useState<'main' | 'theory'>('main');

  const isObstaclePrompt = useMemo(() => obstaclePrompt.split(',').map(s => s.trim()).filter(Boolean).length > 0, [obstaclePrompt]);

  const { 
    totalVariations, 
    estimatedCost, 
    obstaclePrompts, 
    allBasePrompts
  } = useMemo(() => {
    const obstacles = obstaclePrompt.split(',').map(s => s.trim()).filter(Boolean);
    const scenarios = scenarioPrompt.split(',').map(s => s.trim()).filter(Boolean);
    
    const obsPrompts: string[] = [];
    if (obstacles.length > 0) {
      for (const obstacle of obstacles) {
        for (const modifier of sizeAndLocationModifiers) {
            obsPrompts.push(`Integre realisticamente um(a) "${obstacle}" na cena. A adição deve ser perfeitamente mesclada, considerando a iluminação, sombras, e reflexos na água para que pareça completamente natural e parte da foto original. Posicione o obstáculo ${modifier}.`);
        }
      }
    }

    const baseScnPrompts: string[] = [];
    if (seaStatePrompt) {
        if (scenarios.length > 0) {
            scenarios.forEach(s => baseScnPrompts.push(`${seaStatePrompt} Adicionalmente, o cenário deve ser "${s}".`));
        } else {
            baseScnPrompts.push(seaStatePrompt);
        }
    } else {
         if (scenarios.length > 0) {
            scenarios.forEach(s => baseScnPrompts.push(`Mude o cenário da imagem para "${s}".`));
         }
    }
    
    const finalScenarioPrompts = baseScnPrompts.length > 0 ? baseScnPrompts : [""];
    const hasObstacles = obsPrompts.length > 0;
    
    let variationsPerImage = 0;
    if (hasObstacles) {
        variationsPerImage = finalScenarioPrompts.length * (1 + obsPrompts.length);
    } else {
        variationsPerImage = finalScenarioPrompts.length;
    }
    if(obsPrompts.length > 0 && finalScenarioPrompts.length === 1 && finalScenarioPrompts[0] === "") {
        variationsPerImage = obsPrompts.length;
    }

    const totalVars = originalImages.length * variationsPerImage;

    // Cost calculation
    let apiCallCount = totalVars; // Base generation
    if (isObstaclePrompt) apiCallCount += totalVars; // Bbox
    if (verifyPreservation) apiCallCount += originalImages.length * finalScenarioPrompts.length;
    if (seaStatePrompt) apiCallCount += originalImages.length * finalScenarioPrompts.length;
    if (hardenExamples) apiCallCount += totalVars; // Hardness evaluation

    const cost = apiCallCount * COST_PER_IMAGE_USD;

    return { 
        totalVariations: totalVars, 
        estimatedCost: cost,
        obstaclePrompts: obsPrompts,
        allBasePrompts: finalScenarioPrompts
    };
  }, [obstaclePrompt, scenarioPrompt, seaStatePrompt, originalImages, verifyPreservation, hardenExamples, isObstaclePrompt]);
  

  const handleImageUpload = (images: UploadedImage[]) => {
    setOriginalImages(images);
    setGeneratedResults([]);
    setError(null);
    setCompletionMessage(null);
  };

  const processAndSetResult = async (result: GeneratedResult) => {
    if (isStoppingRef.current) return;
    
    let finalResult = result;
    const needsPerturbation = perturbationConfig.jpegQuality || perturbationConfig.gaussianBlur || perturbationConfig.gaussianNoise;

    if (needsPerturbation) {
        setStatusMessage("Aplicando perturbações...");
        const parts = result.generatedImageUrl.split(',');
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const base64 = parts[1];
        try {
            const perturbedBase64 = await applyPerturbations(base64, mimeType, perturbationConfig);
            finalResult = { ...result, generatedImageUrl: perturbedBase64 };
        } catch (e) {
            console.error("Falha ao aplicar perturbação", e);
        }
    }
    setGeneratedResults(prev => [...prev, finalResult]);
  };


  const handleGenerateClick = useCallback(async () => {
    if (originalImages.length === 0) {
      setError('Por favor, carregue pelo menos uma imagem.');
      return;
    }

    if (obstaclePrompts.length === 0 && allBasePrompts.every(p => !p)) {
      setError('Por favor, forneça pelo menos um obstáculo, cenário ou condição do mar.');
      return;
    }

    setIsLoading(true);
    isStoppingRef.current = false;
    setError(null);
    setGeneratedResults([]);
    setStatusMessage(null);
    setCompletionMessage(null);
    
    let failedJobsCount = 0;
    let discardedByPreservation = 0;
    const totalJobs = totalVariations;
    setProgress({ current: 0, total: totalJobs });
    let currentJob = 0;

    const onRetryCallback = (attempt: number, delay: number) => {
        if(isStoppingRef.current) return;
        setStatusMessage(`Limite da API atingido. Tentando novamente em ${Math.ceil(delay / 1000)}s... (Tentativa ${attempt} de 5)`);
    };
    
    for (const image of originalImages) {
        for (const basePrompt of allBasePrompts) {
            if (isStoppingRef.current) break;

            let currentBaseImage = { base64: image.base64, type: image.type };
            let classifiedSeaState : number | undefined = undefined;

            if(basePrompt){
                currentJob++;
                setProgress({ current: currentJob, total: totalJobs });
                setStatusMessage(`Gerando cenário base...`);

                try {
                    const sceneryResult = await editImageWithGemini(image.base64, image.type, basePrompt, false, onRetryCallback);
                    await delay(REQUEST_COOLDOWN_MS);

                    if (!sceneryResult?.imageUrl) {
                        failedJobsCount++;
                        currentJob += obstaclePrompts.length;
                        continue;
                    }
                    
                    const sceneryImageParts = sceneryResult.imageUrl.split(',');
                    const sceneryMimeType = sceneryImageParts[0].split(':')[1].split(';')[0];
                    const sceneryBase64 = sceneryImageParts[1];

                    if (verifyPreservation) {
                        setStatusMessage('Verificando preservação...');
                        const isPreserved = await checkObjectPreservation(image.base64, sceneryBase64, image.type, onRetryCallback);
                        await delay(REQUEST_COOLDOWN_MS);
                        if (!isPreserved) {
                            discardedByPreservation++;
                            currentJob += obstaclePrompts.length;
                            continue;
                        }
                    }

                    if (seaStatePrompt) {
                        setStatusMessage('Classificando estado do mar...');
                        const state = await classifySeaState(sceneryBase64, sceneryMimeType, onRetryCallback);
                        await delay(REQUEST_COOLDOWN_MS);
                        if (state) classifiedSeaState = state;
                    }
                    
                    await processAndSetResult({
                        originalImage: image,
                        generatedImageUrl: sceneryResult.imageUrl,
                        generatedText: sceneryResult.text,
                        prompt: basePrompt,
                        seaState: classifiedSeaState
                    });
                    
                    currentBaseImage = { base64: sceneryBase64, type: sceneryMimeType };

                } catch (e) {
                    console.error(e);
                    failedJobsCount++;
                    currentJob += obstaclePrompts.length;
                    continue;
                }
            }

            for (const obstacleP of obstaclePrompts) {
                if (isStoppingRef.current) break;
                
                currentJob++;
                setProgress({ current: currentJob, total: totalJobs });
                setStatusMessage(`Adicionando obstáculo: ${obstacleP.substring(29, 50)}...`);

                try {
                  const finalResult = await editImageWithGemini(currentBaseImage.base64, currentBaseImage.type, obstacleP, true, onRetryCallback);
                  await delay(REQUEST_COOLDOWN_MS);
                  
                  if (finalResult?.imageUrl) {
                    let isHard = false;
                    const resultParts = finalResult.imageUrl.split(',');
                    const resultMimeType = resultParts[0].split(':')[1].split(';')[0];
                    const resultBase64 = resultParts[1];

                    if (hardenExamples) {
                        setStatusMessage('Avaliando dificuldade do exemplo...');
                        isHard = await evaluateHardExample(resultBase64, resultMimeType, onRetryCallback);
                        await delay(REQUEST_COOLDOWN_MS);
                    }

                    await processAndSetResult({
                      originalImage: image,
                      generatedImageUrl: finalResult.imageUrl,
                      generatedText: finalResult.text,
                      prompt: `${obstacleP} (${basePrompt || 'Cenário Original'})`,
                      boundingBox: finalResult.boundingBox ?? undefined,
                      seaState: classifiedSeaState,
                      isHardExample: isHard,
                    });
                  } else { failedJobsCount++; }
                } catch(e) {
                    console.error(e);
                    failedJobsCount++;
                }
            }
             if (isStoppingRef.current) break;
        }
        if (isStoppingRef.current) break;
    }

    setIsLoading(false);
    setProgress(null);
    setStatusMessage(null);
    
    const finalGeneratedCount = (await new Promise<number>(resolve => {
        setGeneratedResults(currentResults => {
            resolve(currentResults.length);
            return currentResults;
        });
    }));

    const successCount = finalGeneratedCount;
    let summary;
    if (isStoppingRef.current && !error) {
      summary = `Geração parada pelo usuário. ${successCount} imagens criadas com sucesso.`;
    } else if (!error) {
       summary = `Geração concluída! ${successCount} de ${totalJobs} imagens foram criadas com sucesso.`;
       if (failedJobsCount > 0) summary += ` ${failedJobsCount} falharam.`;
       if (discardedByPreservation > 0) summary += ` ${discardedByPreservation} foram descartadas.`;
    }
    if (summary) {
        setCompletionMessage(summary);
    }
    isStoppingRef.current = false;
  }, [originalImages, obstaclePrompts, allBasePrompts, totalVariations, seed, verifyPreservation, seaStatePrompt, hardenExamples, perturbationConfig]);


  const handleStopClick = () => {
    isStoppingRef.current = true;
    setStatusMessage("Parando a geração após a tarefa atual...");
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

        if (result.boundingBox) annotationData.bounding_box = result.boundingBox;
        if (result.seaState) annotationData.sea_state = result.seaState;
        if (result.isHardExample) annotationData.is_hard_example = result.isHardExample;
        
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
      <Header 
        estimatedCost={estimatedCost} 
        totalVariations={totalVariations}
        onViewChange={setView}
      />
      {view === 'main' ? (
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
                    seaStatePrompt={seaStatePrompt}
                    setSeaStatePrompt={setSeaStatePrompt}
                    verifyPreservation={verifyPreservation}
                    setVerifyPreservation={setVerifyPreservation}
                    hardenExamples={hardenExamples}
                    setHardenExamples={setHardenExamples}
                    perturbationConfig={perturbationConfig}
                    setPerturbationConfig={setPerturbationConfig}
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
                            {progress ? `${statusMessage || `Gerando variação ${progress.current} de ${progress.total}...`}` : 'Iniciando...'}
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
      ) : (
        <TheoryPage onViewChange={setView} />
      )}
    </div>
  );
}