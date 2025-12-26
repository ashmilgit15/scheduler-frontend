'use client';

import { useState, useEffect } from 'react';
import { ExamDate } from '@/lib/api';

interface DateBasedInputProps {
  value: ExamDate[];
  onChange: (dates: ExamDate[]) => void;
  requiredDates?: number;
}

export default function DateBasedInput({ value, onChange, requiredDates }: DateBasedInputProps) {
  const [inputDate, setInputDate] = useState('');
  const [inputSubject, setInputSubject] = useState('');
  const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(null);
  const [registerText, setRegisterText] = useState<Record<number, string>>({});

  // Initialize register text from value
  useEffect(() => {
    const newTexts: Record<number, string> = {};
    value.forEach((ed, idx) => {
      if (!(idx in registerText)) {
        newTexts[idx] = ed.register_numbers.join('\n');
      }
    });
    if (Object.keys(newTexts).length > 0) {
      setRegisterText(prev => ({ ...prev, ...newTexts }));
    }
  }, [value.length]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const handleAddDate = () => {
    if (!inputDate) return;
    const formatted = formatDate(inputDate);
    if (!value.some(d => d.date === formatted)) {
      const newDate: ExamDate = { 
        date: formatted, 
        subject: inputSubject.trim() || undefined, 
        register_numbers: [] 
      };
      const newDates = [...value, newDate].sort((a, b) => {
        const [d1, m1, y1] = a.date.split('-').map(Number);
        const [d2, m2, y2] = b.date.split('-').map(Number);
        return (y1 - y2) || (m1 - m2) || (d1 - d2);
      });
      onChange(newDates);
      // Select the newly added date
      const newIndex = newDates.findIndex(d => d.date === formatted);
      setSelectedDateIndex(newIndex);
      setRegisterText(prev => ({ ...prev, [newIndex]: '' }));
    }
    setInputDate('');
    setInputSubject('');
  };

  const handleRemoveDate = (index: number) => {
    const newDates = value.filter((_, i) => i !== index);
    onChange(newDates);
    if (selectedDateIndex === index) {
      setSelectedDateIndex(newDates.length > 0 ? 0 : null);
    } else if (selectedDateIndex !== null && selectedDateIndex > index) {
      setSelectedDateIndex(selectedDateIndex - 1);
    }
  };

  const handleRegisterNumbersChange = (index: number, text: string) => {
    setRegisterText(prev => ({ ...prev, [index]: text }));
    
    const numbers = text
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const updated = [...value];
    updated[index] = { ...updated[index], register_numbers: numbers };
    onChange(updated);
  };

  const getRegisterText = (index: number): string => {
    if (index in registerText) {
      return registerText[index];
    }
    return value[index]?.register_numbers.join('\n') || '';
  };

  const getTotalStudents = () => {
    return value.reduce((sum, ed) => sum + ed.register_numbers.length, 0);
  };

  const getStudentsForDate = (index: number) => {
    return value[index]?.register_numbers.length || 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-lg font-medium text-gray-900">
          Exam Dates & Register Numbers
        </label>
        <span className="text-sm text-gray-600">
          Total Students: {getTotalStudents()}
        </span>
      </div>

      {/* Add Date */}
      <div className="flex gap-2">
        <input
          type="date"
          value={inputDate}
          onChange={(e) => setInputDate(e.target.value)}
          className="w-40 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
          aria-label="Select exam date"
        />
        <input
          type="text"
          value={inputSubject}
          onChange={(e) => setInputSubject(e.target.value)}
          placeholder="Subject (optional)"
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
          aria-label="Subject name"
          onKeyDown={(e) => e.key === 'Enter' && handleAddDate()}
        />
        <button
          type="button"
          onClick={handleAddDate}
          className="px-4 py-2 bg-university-primary text-white rounded-md hover:bg-university-secondary"
        >
          Add Date
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-gray-500 text-sm">Add exam dates first, then enter register numbers for each date.</p>
      )}

      {/* Date Tabs */}
      {value.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Tab Headers */}
          <div className="flex flex-wrap bg-gray-100 border-b border-gray-200">
            {value.map((examDate, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedDateIndex(index)}
                className={`px-4 py-2 text-sm font-medium border-r border-gray-200 transition-colors ${
                  selectedDateIndex === index
                    ? 'bg-university-primary text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {examDate.date}
                {examDate.subject && <span className="ml-1 opacity-75">({examDate.subject})</span>}
                <span className="ml-2 text-xs opacity-75">({getStudentsForDate(index)})</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {selectedDateIndex !== null && value[selectedDateIndex] && (
            <div className="p-4 bg-white">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-medium text-gray-900">
                    {value[selectedDateIndex].date}
                  </span>
                  {value[selectedDateIndex].subject && (
                    <span className="ml-2 text-gray-600">- {value[selectedDateIndex].subject}</span>
                  )}
                  <span className="ml-2 text-sm text-gray-500">
                    ({getStudentsForDate(selectedDateIndex)} students)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDate(selectedDateIndex)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove Date
                </button>
              </div>
              <textarea
                value={getRegisterText(selectedDateIndex)}
                onChange={(e) => handleRegisterNumbersChange(selectedDateIndex, e.target.value)}
                placeholder="Enter register numbers (one per line or comma-separated)"
                className="w-full h-48 p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent font-mono"
                aria-label={`Register numbers for ${value[selectedDateIndex].date}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter register numbers separated by new lines or commas. Max 125 students per date.
              </p>
            </div>
          )}
        </div>
      )}

      {requiredDates && requiredDates > value.length && (
        <p className="text-amber-600 text-sm">
          Need at least {requiredDates} dates for the number of students. Currently: {value.length}
        </p>
      )}

      {getTotalStudents() > 0 && getTotalStudents() < 25 && (
        <p className="text-red-600 text-sm">
          Minimum 25 register numbers required. Currently: {getTotalStudents()}
        </p>
      )}
    </div>
  );
}
