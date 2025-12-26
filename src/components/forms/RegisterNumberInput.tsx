'use client';

import { useState, useRef } from 'react';

interface RegisterNumberInputProps {
  value: string[];
  onChange: (numbers: string[]) => void;
  duplicatesWarning?: string;
}

export default function RegisterNumberInput({ 
  value, 
  onChange, 
  duplicatesWarning 
}: RegisterNumberInputProps) {
  const [textValue, setTextValue] = useState(value.join('\n'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseNumbers = (text: string): string[] => {
    if (!text.trim()) return [];
    return text
      .split(/[\n,]+|\s{2,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTextValue(text);
    onChange(parseNumbers(text));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const numbers = content
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().includes('register'));
      
      setTextValue(numbers.join('\n'));
      onChange(numbers);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Register Numbers
      </label>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 text-sm bg-university-primary text-white rounded hover:bg-university-secondary"
        >
          Upload CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <span className="text-sm text-gray-500 self-center">
          {value.length} register numbers
        </span>
      </div>
      <textarea
        value={textValue}
        onChange={handleTextChange}
        placeholder="Enter register numbers (one per line or comma-separated)"
        className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent focus:border-transparent"
        aria-label="Register numbers input"
      />
      {duplicatesWarning && (
        <p className="text-amber-600 text-sm">{duplicatesWarning}</p>
      )}
      {value.length > 0 && value.length < 25 && (
        <p className="text-red-600 text-sm">
          Minimum 25 register numbers required. Currently: {value.length}
        </p>
      )}
    </div>
  );
}
