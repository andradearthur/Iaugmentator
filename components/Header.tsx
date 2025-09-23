import React from 'react';
import SailboatIcon from './icons/SailboatIcon';

interface HeaderProps {
  estimatedCost: number;
  totalVariations: number;
  onViewChange: (view: 'main' | 'theory') => void;
}

export default function Header({ estimatedCost, totalVariations, onViewChange }: HeaderProps): React.ReactElement {
  return (
    <header className="bg-navy shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SailboatIcon className="h-10 w-10 text-sky" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">AI Sailboat Image Augmentor</h1>
            <p className="hidden md:block text-sm text-gray-300">Expandindo datasets para sistemas anticolisão</p>
          </div>
           <button 
                onClick={() => onViewChange('theory')}
                className="ml-4 px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-navy bg-sky hover:bg-sky/80"
            >
                Revisão Teórica
            </button>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 bg-ocean-blue/20 p-2 rounded-lg">
            <div className="text-right">
                <p className="text-xs text-gray-300 whitespace-nowrap">Custo do Lote (Estimado)</p>
                <p className="text-base md:text-lg font-bold text-white">${estimatedCost.toFixed(4)}</p>
                <p className="text-xs text-gray-400">{totalVariations} variações</p>
            </div>
             <div className="text-right border-l border-gray-500 pl-2 md:pl-4">
                <p className="text-xs text-gray-300 whitespace-nowrap">Custo por Imagem</p>
                <p className="text-base md:text-lg font-bold text-white">$0.0025</p>
                <p className="text-xs text-gray-400">(estimado)</p>
            </div>
        </div>
      </div>
    </header>
  );
}