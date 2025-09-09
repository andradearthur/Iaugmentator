import React from 'react';
import type { GeneratedResult } from '../types';

interface ResultDisplayProps {
  results: GeneratedResult[];
  onDownloadZip: () => void;
}

const ResultCard = ({ result }: { result: GeneratedResult }) => {
  return (
    <div className="group relative aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
      <img 
        src={result.generatedImageUrl} 
        alt={`Generated variation for ${result.originalImage.name}`} 
        className="w-full h-full object-contain" 
      />
      <div className="absolute inset-0 bg-black bg-opacity-70 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <p className="text-center">{result.prompt}</p>
      </div>
    </div>
  );
};

export default function ResultDisplay({
  results,
  onDownloadZip,
}: ResultDisplayProps): React.ReactElement {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-navy">Resultados Gerados ({results.length})</h2>
        <button
          onClick={onDownloadZip}
          className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Todas (ZIP)
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((result, index) => (
          <ResultCard key={`${result.originalImage.name}-${index}`} result={result} />
        ))}
      </div>
    </div>
  );
}
