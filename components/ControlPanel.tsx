
import React from 'react';

interface ControlPanelProps {
  obstaclePrompt: string;
  setObstaclePrompt: (value: string) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (value: string) => void;
  uniquePromptsCount: number;
  seed: number;
  setSeed: (value: number) => void;
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
  uniquePromptsCount,
  seed,
  setSeed,
  onGenerate,
  isLoading,
  disabled,
}: ControlPanelProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">2. Definir Variações</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="obstacle-prompt" className="block text-sm font-medium text-gray-700">
              Obstáculos (separados por vírgula)
            </label>
            <textarea
              id="obstacle-prompt"
              rows={3}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
              value={obstaclePrompt}
              onChange={(e) => setObstaclePrompt(e.target.value)}
              placeholder="Ex: um caiaque, um cardume de peixes, rochas na superfície"
            />
          </div>

          <div>
            <label htmlFor="scenario-prompt" className="block text-sm font-medium text-gray-700">
              Cenários (separados por vírgula)
            </label>
            <textarea
              id="scenario-prompt"
              rows={3}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
              value={scenarioPrompt}
              onChange={(e) => setScenarioPrompt(e.target.value)}
              placeholder="Ex: ao amanhecer, com chuva forte, em águas cristalinas"
            />
          </div>
        </div>
      </div>
      
      <div>
         <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">3. Configurações</h2>
         <div>
            <label htmlFor="seed" className="block text-sm font-medium text-gray-700">
                Seed de Geração
            </label>
            <div className="flex items-center mt-1">
                <input
                    type="number"
                    id="seed"
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
                />
                <button 
                    onClick={() => setSeed(Math.floor(Math.random() * 100000))}
                    className="ml-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue"
                    title="Gerar seed aleatório"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M5.52 15.58A9.002 9.002 0 0012 20a9 9 0 10-6.48-15.58L4 4" />
                    </svg>
                </button>
            </div>
            <p className="mt-2 text-xs text-gray-500"><InfoIcon />A mesma seed com as mesmas imagens e prompts irá gerar resultados idênticos.</p>
        </div>
      </div>

      <div className="bg-sky/10 border border-ocean-blue/20 rounded-lg p-3 text-center">
          <p className="text-sm text-ocean-blue">
              Serão geradas <span className="font-bold text-lg">{uniquePromptsCount}</span> variações por imagem original.
          </p>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || disabled}
        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-ocean-blue hover:bg-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Gerando...' : 'Gerar Variações'}
      </button>
    </div>
  );
}
