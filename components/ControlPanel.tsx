import React from 'react';

interface ControlPanelProps {
  obstaclePrompt: string;
  setObstaclePrompt: (value: string) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (value: string) => void;
  variationsPerImage: number;
  setVariationsPerImage: (value: number) => void;
  annotationType: 'none' | 'mask' | 'bbox';
  setAnnotationType: (value: 'none' | 'mask' | 'bbox') => void;
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
  obstaclePrompt, setObstaclePrompt,
  scenarioPrompt, setScenarioPrompt,
  variationsPerImage, setVariationsPerImage,
  annotationType, setAnnotationType,
  seed, setSeed,
  onGenerate, isLoading, disabled,
}: ControlPanelProps): React.ReactElement {

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">2. Descrever Modificações</h2>
        <div className="space-y-4">
            <div>
                <label htmlFor="obstacle-prompt" className="block text-sm font-medium text-gray-700">Adicionar Obstáculos</label>
                <textarea id="obstacle-prompt" rows={3} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue" value={obstaclePrompt} onChange={(e) => setObstaclePrompt(e.target.value)} placeholder="Ex: um caiaque amarelo, um navio de carga..." />
                <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Liste os objetos que deseja adicionar, separados por vírgula.</p>
            </div>
            <div>
                <label htmlFor="scenario-prompt" className="block text-sm font-medium text-gray-700">Mudar Cenários</label>
                <textarea id="scenario-prompt" rows={3} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue" value={scenarioPrompt} onChange={(e) => setScenarioPrompt(e.target.value)} placeholder="Ex: chuva forte, noite com luar, pôr do sol..." />
                <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Liste as condições ambientais, separadas por vírgula.</p>
            </div>
            <div>
              <label htmlFor="seed" className="block text-sm font-medium text-gray-700">Semente de Geração (Seed)</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                  <input type="number" id="seed" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-ocean-blue focus:border-ocean-blue sm:text-sm border-gray-300" value={seed} onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)} />
                  <button onClick={handleRandomSeed} type="button" className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-ocean-blue focus:border-ocean-blue">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201-4.42 5.5 5.5 0 011.023-2.113 3.5 3.5 0 014.624 0 5.5 5.5 0 011.023 2.113 5.5 5.5 0 01-2.43 6.045c.874.12 1.696.394 2.454.813zM4.343 14.343a3.5 3.5 0 010-4.95l1.06-1.06a3.5 3.5 0 014.95 0l1.06 1.06a3.5 3.5 0 010 4.95l-1.06 1.06a3.5 3.5 0 01-4.95 0l-1.06-1.06z" clipRule="evenodd" /></svg>
                      <span>Aleatória</span>
                  </button>
              </div>
              <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Garante resultados reproduzíveis.</p>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Anotação</label>
                <fieldset className="mt-2">
                    <div className="space-y-2">
                        {(['none', 'mask', 'bbox'] as const).map((option) => (
                            <label key={option} className="flex items-center">
                                <input type="radio" className="focus:ring-ocean-blue h-4 w-4 text-ocean-blue border-gray-300" name="annotation-type" value={option} checked={annotationType === option} onChange={(e) => setAnnotationType(e.target.value as any)} />
                                <span className="ml-3 block text-sm text-gray-700">
                                    {option === 'none' && 'Nenhuma'}
                                    {option === 'mask' && 'Apenas Máscara de Segmentação'}
                                    {option === 'bbox' && 'Máscara e Bounding Box (JSON)'}
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Bounding box requer saída JSON (experimental).</p>
            </div>
            <div>
                <label htmlFor="variations-per-image" className="block text-sm font-medium text-gray-700">Variações por Imagem</label>
                 <input type="number" id="variations-per-image" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue" value={variationsPerImage} onChange={(e) => setVariationsPerImage(Math.max(1, parseInt(e.target.value, 10)) || 1)} min="1" />
                <p className="mt-1 text-xs text-gray-500"><InfoIcon/>Quantas variações gerar para cada imagem carregada.</p>
            </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">3. Gerar Variações</h2>
        <button onClick={onGenerate} disabled={isLoading || disabled} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-ocean-blue hover:bg-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300">
          {isLoading ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Gerando...</> ) : ( 'Gerar Imagens Aumentadas' )}
        </button>
      </div>
    </div>
  );
}