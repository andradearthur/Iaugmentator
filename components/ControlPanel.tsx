import React from 'react';

interface ControlPanelProps {
  obstaclePrompt: string;
  setObstaclePrompt: (value: string) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (value: string) => void;
  variationsPerImage: number;
  setVariationsPerImage: (value: number) => void;
  onGenerate: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function ControlPanel({
  obstaclePrompt,
  setObstaclePrompt,
  scenarioPrompt,
  setScenarioPrompt,
  variationsPerImage,
  setVariationsPerImage,
  onGenerate,
  isLoading,
  disabled,
}: ControlPanelProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">2. Descrever Modificações</h2>
        <div className="space-y-4">
            <div>
                <label htmlFor="obstacle-prompt" className="block text-sm font-medium text-gray-700">Adicionar Obstáculos</label>
                <textarea
                    id="obstacle-prompt"
                    rows={3}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
                    value={obstaclePrompt}
                    onChange={(e) => setObstaclePrompt(e.target.value)}
                    placeholder="Ex: um caiaque amarelo, um navio de carga..."
                />
                <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Liste os objetos que deseja adicionar, separados por vírgula.</p>
            </div>
            <div>
                <label htmlFor="scenario-prompt" className="block text-sm font-medium text-gray-700">Mudar Cenários</label>
                <textarea
                    id="scenario-prompt"
                    rows={3}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
                    value={scenarioPrompt}
                    onChange={(e) => setScenarioPrompt(e.target.value)}
                    placeholder="Ex: chuva forte, noite com luar, pôr do sol..."
                />
                <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Liste as condições ambientais, separadas por vírgula.</p>
            </div>
            <div>
                <label htmlFor="variations-per-image" className="block text-sm font-medium text-gray-700">Variações por Imagem</label>
                 <input
                    type="number"
                    id="variations-per-image"
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
                    value={variationsPerImage}
                    onChange={(e) => setVariationsPerImage(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                    min="1"
                />
                <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Quantas variações gerar para cada imagem carregada.</p>
            </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">3. Gerar Variações</h2>
        <button
          onClick={onGenerate}
          disabled={isLoading || disabled}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-ocean-blue hover:bg-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gerando...
            </>
          ) : (
            'Gerar Imagens Aumentadas'
          )}
        </button>
      </div>
    </div>
  );
}