import React from 'react';

interface ChecklistInputProps {
  label: string;
  predefinedOptions: string[];
  value: string;
  onChange: (newValue: string) => void;
  placeholder: string;
}

export default function ChecklistInput({ label, predefinedOptions, value, onChange, placeholder }: ChecklistInputProps): React.ReactElement {
  // Deriva o estado da UI diretamente das props em cada renderização
  // para garantir consistência e evitar bugs de sincronização.
  const allValues = value.split(',').map(s => s.trim()).filter(Boolean);
  const checkedItems = new Set(allValues.filter(v => predefinedOptions.includes(v)));
  const customValue = allValues.filter(v => !predefinedOptions.includes(v)).join(', ');

  const handleCheckboxChange = (option: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(option)) {
      newCheckedItems.delete(option);
    } else {
      newCheckedItems.add(option);
    }
    
    const checkedArray = Array.from(newCheckedItems);
    const customArray = customValue.split(',').map(s => s.trim()).filter(Boolean);
    const combined = [...checkedArray, ...customArray];
    onChange(combined.join(', '));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomValue = e.target.value;
    const checkedArray = Array.from(checkedItems);
    const customArray = newCustomValue.split(',').map(s => s.trim()).filter(Boolean);
    const combined = [...checkedArray, ...customArray];
    onChange(combined.join(', '));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 bg-gray-50 space-y-2">
        {predefinedOptions.map((option) => (
          <div key={option} className="flex items-center">
            <input
              id={`checkbox-${label}-${option}`}
              name={option}
              type="checkbox"
              checked={checkedItems.has(option)}
              onChange={() => handleCheckboxChange(option)}
              className="h-4 w-4 text-ocean-blue border-gray-300 rounded focus:ring-ocean-blue"
            />
            <label htmlFor={`checkbox-${label}-${option}`} className="ml-2 block text-sm text-gray-900 cursor-pointer">
              {option}
            </label>
          </div>
        ))}
      </div>
      <input
        type="text"
        className="mt-2 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ocean-blue focus:border-ocean-blue"
        value={customValue}
        onChange={handleCustomChange}
        placeholder={placeholder}
      />
    </div>
  );
}