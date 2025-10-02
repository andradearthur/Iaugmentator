import React from 'react';
import type { GeneratedResult } from '../types';
import Spinner from './Spinner';
import VideoIcon from './icons/VideoIcon';

interface VideoGenerationStatus {
  isLoading: boolean;
  progressMessage: string;
  error?: string;
}

interface ResultDisplayProps {
  results: GeneratedResult[];
  onDownloadZip: () => void;
  onGenerateVideo: (index: number) => void;
  videoGenerationStatuses: Record<number, VideoGenerationStatus>;
}

const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> );
const JsonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> );
const AlertIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.852-1.21 3.488 0l6.095 11.623c.636 1.21-.472 2.778-1.744 2.778H3.905c-1.272 0-2.38-1.568-1.744-2.778L8.257 3.099zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg> );


interface ResultCardProps {
  result: GeneratedResult;
  index: number;
  onGenerateVideo: (index: number) => void;
  videoGenerationStatus?: VideoGenerationStatus;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, index, onGenerateVideo, videoGenerationStatus }) => {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex-shrink-0">
        <img src={result.generatedImageUrl} alt={`Generated variation for ${result.originalImage.name}`} className="w-24 h-24 object-cover rounded-md bg-gray-100" />
      </div>
      <div className="flex-grow min-w-0 w-full">
        <div className="flex items-center justify-between flex-wrap gap-1">
            <p className="text-xs text-gray-500 truncate" title={result.originalImage.name}>
                Original: {result.originalImage.name}
            </p>
            <div className="flex items-center gap-2">
                {result.isHardExample && (
                    <span className="flex items-center text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full px-2 py-0.5">
                       <AlertIcon /> <span className="ml-1">Exemplo Difícil</span>
                    </span>
                )}
                {result.seaState && (
                    <span className="text-xs font-semibold text-blue-800 bg-blue-100 rounded-full px-2 py-0.5">
                        Sea State {result.seaState}
                    </span>
                )}
                {result.boundingBox && (
                    <span className="flex items-center text-xs text-purple-700 bg-purple-100 rounded-full px-2 py-0.5" title={`Bounding Box: ${JSON.stringify(result.boundingBox)}`}>
                        <JsonIcon />
                        <span className="ml-1">JSON</span>
                    </span>
                )}
            </div>
        </div>
        <p className="text-sm font-medium text-gray-800 break-words mt-1">
          {result.prompt}
        </p>
         { result.generatedVideoUrl && (
            <div className="mt-2">
                <video
                    controls
                    src={result.generatedVideoUrl}
                    className="w-full max-w-xs rounded-md"
                    aria-label="Vídeo gerado"
                />
            </div>
        )}
        { videoGenerationStatus?.isLoading && (
              <div className="mt-2 flex items-center bg-sky-50 p-2 rounded-md">
                <Spinner className="h-6 w-6" />
                <p className="ml-2 text-sm text-ocean-blue">{videoGenerationStatus.progressMessage}</p>
            </div>
        )}
        { videoGenerationStatus?.error && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">Erro: {videoGenerationStatus.error}</p>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
        <a href={result.generatedImageUrl} download={`${result.originalImage.name.split('.').slice(0, -1).join('.')}_variation_${index}.jpg`} className="inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-ocean-blue bg-sky/20 hover:bg-sky/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue transition-colors" title="Download Imagem" aria-label="Download Imagem" >
          <DownloadIcon />
        </a>
        { !result.generatedVideoUrl && (
              <button 
                onClick={() => onGenerateVideo(index)}
                disabled={videoGenerationStatus?.isLoading}
                className="inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50 disabled:cursor-wait" title="Gerar Animação" aria-label="Gerar Animação da Imagem"
              >
                <VideoIcon className="h-5 w-5"/>
              </button>
        )}
      </div>
    </div>
  );
};

export default function ResultDisplay({ results, onDownloadZip, onGenerateVideo, videoGenerationStatuses }: ResultDisplayProps): React.ReactElement {
  const reversedResults = [...results].reverse();
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-navy">Resultados Gerados ({results.length})</h2>
        {results.length > 0 && (
            <button onClick={onDownloadZip} className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download Todas (ZIP)
            </button>
        )}
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {reversedResults.map((result, index) => {
          // The original index is needed for the status map and handler
          const originalIndex = results.length - 1 - index;
          return (
            <ResultCard 
              key={`${result.originalImage.name}-${originalIndex}`} 
              result={result} 
              index={originalIndex}
              onGenerateVideo={onGenerateVideo}
              videoGenerationStatus={videoGenerationStatuses[originalIndex]}
            />
          );
        })}
      </div>
    </div>
  );
}