
import React from 'react';
import SailboatIcon from './icons/SailboatIcon';

export default function Header(): React.ReactElement {
  return (
    <header className="bg-navy shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SailboatIcon className="h-10 w-10 text-sky" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Sailboat Image Augmentor</h1>
            <p className="text-sm text-gray-300">Expandindo datasets para sistemas anticolisão de veleiros autônomos</p>
          </div>
        </div>
      </div>
    </header>
  );
}
