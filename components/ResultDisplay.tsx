import React from 'react';
import type { GeneratedResult } from '../types';

interface ResultDisplayProps {
  results: GeneratedResult[];
  onDownloadZip: () => void;
}

const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> );
const MaskIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> );
const JsonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> );


const ResultCard = ({ result, index }: { result: GeneratedResult; index: number }) => {
  const handleDownload = (url: string, suffix: string, extension?: string) => {
    const link = document.createElement('a');
    link.href = url;
    const originalName = result.originalImage.name.split('.').slice(0, -1).join('.') || `image_${index}`;
    const fileExtension = extension || (url.startsWith('data:image/png') ? 'png' : 'jpeg');
    link.download = `${originalName}_variation_${index + 1}${suffix}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
      <div className="flex-shrink-0">
        <img src={result.generatedImageUrl} alt={`Generated variation for ${result.originalImage.name}`} className="w-24 h-24 object-cover rounded-md bg-gray-100" />
      </div>
      {result.generatedMaskUrl && (
        <div className="flex-shrink-0">
          <img src={result.generatedMaskUrl} alt="Segmentation Mask" className="w-24 h-24 object-cover rounded-md bg-gray-800 border-2 border-white shadow-md" />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate" title={result.originalImage.name}>
                Original: {result.originalImage.name}
            </p>
            {result.boundingBox && (
                <span className="flex items-center text-xs text-purple-700 bg-purple-100 rounded-full px-2 py-0.5 ml-2" title={`Bounding Box: ${JSON.stringify(result.boundingBox)}`}>
                    <JsonIcon />
                    <span className="ml-1">JSON</span>
                </span>
            )}
        </div>
        <p className="text-sm font-medium text-gray-800 break-words mt-1">
          {result.prompt}
        </p>
      </div>
      <div className="flex-shrink-0 flex flex-col space-y-2">
        <button onClick={() => handleDownload(result.generatedImageUrl, '')} className="inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-ocean-blue bg-sky/20 hover:bg-sky/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue transition-colors" title="Download Imagem" aria-label="Download Imagem" >
          <DownloadIcon />
        </button>
        {result.generatedMaskUrl && (
           <button onClick={() => handleDownload(result.generatedMaskUrl, '_mask', 'png')} className="inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors" title="Download Máscara" aria-label="Download Máscara" >
             <MaskIcon />
           </button>
        )}
      </div>
    </div>
  );
};

export default function ResultDisplay({ results, onDownloadZip }: ResultDisplayProps): React.ReactElement {
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
        {results.map((result, index) => (
          <ResultCard key={`${result.originalImage.name}-${index}`} result={result} index={index} />
        )).reverse()}
      </div>
    </div>
  );
}