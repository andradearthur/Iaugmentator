import React from 'react';
import ChecklistInput from './ChecklistInput';
import { PREDEFINED_OBSTACLES, PREDEFINED_SEA_STATES, PREDEFINED_TIME_OF_DAY, PREDEFINED_WEATHER } from '../constants';
import type { PerturbationConfig } from '../utils/imageProcessor';
import type { ObstacleConfig } from '../types';


interface ControlPanelProps {
  obstacleConfigs: ObstacleConfig[];
  setObstacleConfigs: (value: ObstacleConfig[]) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (value: string) => void;
  seaStatePrompt: string;
  setSeaStatePrompt: (value: string) => void;
  verifyPreservation: boolean;
  setVerifyPreservation: (value: boolean) => void;
  hardenExamples: boolean;
  setHardenExamples: (value: boolean) => void;
  perturbationConfig: PerturbationConfig;
  setPerturbationConfig: (config: PerturbationConfig) => void;
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
  obstacleConfigs,
  setObstacleConfigs,
  scenarioPrompt,
  setScenarioPrompt,
  seaStatePrompt,
  setSeaStatePrompt,
  verifyPreservation,
  setVerifyPreservation,
  hardenExamples,
  setHardenExamples,
  perturbationConfig,
  setPerturbationConfig,
  uniquePromptsCount,
  seed,
  setSeed,
  onGenerate,
  isLoading,
  disabled,
}: ControlPanelProps): React.ReactElement {
  
  const handleScenarioChange = (group: 'time' | 'weather' | 'custom', values: string) => {
      const scenarios = scenarioPrompt.split(',').map(s => s.trim()).filter(Boolean);
      let time = scenarios.filter(s => PREDEFINED_TIME_OF_DAY.includes(s));
      let weather = scenarios.filter(s => PREDEFINED_WEATHER.includes(s));
      let custom = scenarios.filter(s => !PREDEFINED_TIME_OF_DAY.includes(s) && !PREDEFINED_WEATHER.includes(s));

      if (group === 'time') time = values.split(',').map(s => s.trim()).filter(Boolean);
      if (group === 'weather') weather = values.split(',').map(s => s.trim()).filter(Boolean);
      if (group === 'custom') custom = values.split(',').map(s => s.trim()).filter(Boolean);

      const combined = [...time, ...weather, ...custom];
      setScenarioPrompt(Array.from(new Set(combined)).join(', '));
  }
  
  const handleObstacleToggle = (obstacleName: string, isCurrentlyChecked: boolean) => {
    let newConfigs = [...obstacleConfigs];
    if (isCurrentlyChecked) {
        newConfigs = newConfigs.filter(c => c.name !== obstacleName);
    } else {
        newConfigs.push({
            name: obstacleName,
            variations: 3,
            modifiers: { proximity: true, size: true, edge: false, horizon: true }
        });
        newConfigs.sort((a, b) => PREDEFINED_OBSTACLES.indexOf(a.name) - PREDEFINED_OBSTACLES.indexOf(b.name));
    }
    setObstacleConfigs(newConfigs);
  };

  const handleConfigChange = (obstacleName: string, field: string, value: any) => {
      const newConfigs = obstacleConfigs.map(c => {
          if (c.name === obstacleName) {
              const newConfig = { ...c };
              if (field.startsWith('modifiers.')) {
                  const modKey = field.split('.')[1] as keyof ObstacleConfig['modifiers'];
                  newConfig.modifiers = { ...newConfig.modifiers, [modKey]: value };
              } else if (field === 'variations') {
                  newConfig.variations = Math.max(1, value); // Ensure at least 1 variation
              }
              return newConfig;
          }
          return c;
      });
      setObstacleConfigs(newConfigs);
  };

  const scenarios = scenarioPrompt.split(',').map(s => s.trim()).filter(Boolean);
  const timeOfDayScenarios = scenarios.filter(s => PREDEFINED_TIME_OF_DAY.includes(s));
  const weatherScenarios = scenarios.filter(s => PREDEFINED_WEATHER.includes(s));


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">2. Definir Variações</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Obstáculos</label>
            <div className="mt-1 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-gray-50 space-y-1">
              {PREDEFINED_OBSTACLES.map(obstacle => {
                const config = obstacleConfigs.find(c => c.name === obstacle);
                const isChecked = !!config;
                const modifierOrder: Array<keyof ObstacleConfig['modifiers']> = ['horizon', 'proximity', 'size', 'edge'];

                return (
                  <div key={obstacle} className="py-1">
                    <div className="flex items-center">
                      <input
                        id={`cb-${obstacle}`} type="checkbox" checked={isChecked}
                        onChange={() => handleObstacleToggle(obstacle, isChecked)}
                        className="h-4 w-4 text-ocean-blue border-gray-300 rounded focus:ring-ocean-blue"
                      />
                      <label htmlFor={`cb-${obstacle}`} className="ml-2 block text-sm text-gray-900 cursor-pointer select-none">
                        {obstacle}
                      </label>
                    </div>
                    {isChecked && config && (
                      <div className="pl-6 mt-2 space-y-2 pb-2 animate-fade-in">
                        <div className="flex items-center text-sm">
                          <label htmlFor={`vars-${obstacle}`} className="text-gray-600 mr-2 font-medium">Variações:</label>
                          <input
                            id={`vars-${obstacle}`} type="number" min="1"
                            value={config.variations}
                            onChange={e => handleConfigChange(obstacle, 'variations', parseInt(e.target.value, 10) || 1)}
                            className="w-16 p-1 text-center shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
                          />
                        </div>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="text-gray-600 font-medium">Modificadores:</span>
                          {modifierOrder.map(modKey => {
                            const modLabels = { horizon: 'Pequeno no Horizonte', proximity: 'Proximidade', size: 'Tamanho', edge: 'Borda' };
                            return (
                              <div key={modKey} className="flex items-center">
                                <input
                                  id={`mod-${modKey}-${obstacle}`} type="checkbox"
                                  checked={config.modifiers[modKey]}
                                  onChange={e => handleConfigChange(obstacle, `modifiers.${modKey}`, e.target.checked)}
                                  className="h-4 w-4 text-ocean-blue border-gray-300 rounded focus:ring-ocean-blue"
                                />
                                <label htmlFor={`mod-${modKey}-${obstacle}`} className="ml-1 text-gray-800 cursor-pointer select-none">
                                  {modLabels[modKey]}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
           <div>
              <label className="block text-sm font-medium text-gray-700">Condições do Mar (Sea State)</label>
              <div className="mt-1 border border-gray-300 rounded-md p-2 bg-gray-50 space-y-2">
                <div className="flex items-center">
                   <input
                      id="sea-state-none"
                      name="sea-state"
                      type="radio"
                      checked={!seaStatePrompt}
                      onChange={() => setSeaStatePrompt('')}
                      className="h-4 w-4 text-ocean-blue border-gray-300 focus:ring-ocean-blue"
                    />
                    <label htmlFor="sea-state-none" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                      Nenhum (usar original)
                    </label>
                </div>
                {PREDEFINED_SEA_STATES.map((state) => (
                  <div key={state.label} className="flex items-center">
                    <input
                      id={`sea-state-${state.label}`}
                      name="sea-state"
                      type="radio"
                      checked={seaStatePrompt === state.prompt}
                      onChange={() => setSeaStatePrompt(state.prompt)}
                      className="h-4 w-4 text-ocean-blue border-gray-300 focus:ring-ocean-blue"
                    />
                    <label htmlFor={`sea-state-${state.label}`} className="ml-2 block text-sm text-gray-900 cursor-pointer">
                      {state.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

          <ChecklistInput
            label="Hora do Dia e Iluminação"
            predefinedOptions={PREDEFINED_TIME_OF_DAY}
            value={timeOfDayScenarios.join(', ')}
            onChange={(val) => handleScenarioChange('time', val)}
            placeholder="Adicione cenários de iluminação..."
          />

          <ChecklistInput
            label="Clima"
            predefinedOptions={PREDEFINED_WEATHER}
            value={weatherScenarios.join(', ')}
            onChange={(val) => handleScenarioChange('weather', val)}
            placeholder="Adicione cenários de clima..."
          />

        </div>
      </div>

       <div>
        <h3 className="text-lg font-semibold text-navy mb-3 border-b pb-2">Pós-processamento e Perturbações</h3>
        <div className="space-y-3 p-2 bg-gray-50 rounded-md border">
            <div className="flex items-center justify-between">
                <label htmlFor="jpeg-quality" className="text-sm font-medium text-gray-700">Compressão JPEG</label>
                <input
                    id="jpeg-quality"
                    type="range"
                    min="0.1" max="1" step="0.1"
                    value={perturbationConfig.jpegQuality || 1}
                    onChange={e => setPerturbationConfig({...perturbationConfig, jpegQuality: e.target.valueAsNumber})}
                    className="w-1/2"
                />
            </div>
             <div className="flex items-center justify-between">
                <label htmlFor="gaussian-blur" className="text-sm font-medium text-gray-700">Desfoque Gaussiano (px)</label>
                <input
                    id="gaussian-blur"
                    type="range"
                    min="0" max="5" step="0.5"
                    value={perturbationConfig.gaussianBlur || 0}
                    onChange={e => setPerturbationConfig({...perturbationConfig, gaussianBlur: e.target.valueAsNumber})}
                    className="w-1/2"
                />
            </div>
             <div className="flex items-center justify-between">
                <label htmlFor="gaussian-noise" className="text-sm font-medium text-gray-700">Ruído Gaussiano</label>
                <input
                    id="gaussian-noise"
                    type="range"
                    min="0" max="50" step="5"
                    value={perturbationConfig.gaussianNoise || 0}
                    onChange={e => setPerturbationConfig({...perturbationConfig, gaussianNoise: e.target.valueAsNumber})}
                    className="w-1/2"
                />
            </div>
        </div>
        <p className="mt-2 text-xs text-gray-500"><InfoIcon />Aplica perturbações após a geração da imagem para melhorar a robustez do modelo.</p>
      </div>
      
      <div>
         <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">3. Configurações Avançadas</h2>
         <div className="space-y-4">
            <div className="relative flex items-start">
                <div className="flex items-center h-5">
                    <input id="harden-examples" name="harden-examples" type="checkbox" checked={hardenExamples} onChange={(e) => setHardenExamples(e.target.checked)} className="focus:ring-ocean-blue h-4 w-4 text-ocean-blue border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="harden-examples" className="font-medium text-gray-700">Priorizar Exemplos Difíceis</label>
                    <p className="text-xs text-gray-500">Identifica imagens onde o veleiro é parcialmente ocluso ou menos visível. (Usa mais chamadas de API)</p>
                </div>
            </div>
             <div className="relative flex items-start">
                <div className="flex items-center h-5">
                    <input id="verify-preservation" name="verify-preservation" type="checkbox" checked={verifyPreservation} onChange={(e) => setVerifyPreservation(e.target.checked)} className="focus:ring-ocean-blue h-4 w-4 text-ocean-blue border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="verify-preservation" className="font-medium text-gray-700">Verificar Preservação do Veleiro</label>
                    <p className="text-xs text-gray-500">Descarta imagens onde o veleiro original foi muito distorcido ou removido. (Usa mais chamadas de API)</p>
                </div>
            </div>
             <div>
                <label htmlFor="seed" className="block text-sm font-medium text-gray-700">Seed de Geração</label>
                <div className="flex items-center mt-1">
                    <input type="number" id="seed" className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue" value={seed} onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)} />
                    <button onClick={() => setSeed(Math.floor(Math.random() * 100000))} className="ml-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-blue" title="Gerar seed aleatório" >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M5.52 15.58A9.002 9.002 0 0012 20a9 9 0 10-6.48-15.58L4 4" /></svg>
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500"><InfoIcon />A mesma seed com as mesmas imagens e prompts irá gerar resultados idênticos.</p>
            </div>
        </div>
      </div>

      <div className="bg-sky/10 border border-ocean-blue/20 rounded-lg p-3 text-center">
          <p className="text-sm text-ocean-blue">
              Serão geradas <span className="font-bold text-lg">{uniquePromptsCount.toFixed(0)}</span> variações por imagem original.
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