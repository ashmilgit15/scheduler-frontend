'use client';

import { useState } from 'react';
import { ExamDate } from '@/lib/api';

interface DatePickerProps {
  value: ExamDate[];
  onChange: (dates: ExamDate[]) => void;
  requiredDates?: number;
}

export default function DatePicker({ value, onChange, requiredDates }: DatePickerProps) {
  const [inputDate, setInputDate] = useState('');
  const [inputSubject, setInputSubject] = useState('');

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
    }
    setInputDate('');
    setInputSubject('');
  };

  const handleRemoveDate = (date: string) => {
    onChange(value.filter(d => d.date !== date));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Exam Dates
      </label>
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
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map(examDate => (
            <span
              key={examDate.date}
              className="inline-flex items-center px-3 py-1 bg-university-light text-university-primary rounded-full text-sm"
            >
              {examDate.date}
              {examDate.subject && <span className="ml-1 opacity-75">({examDate.subject})</span>}
              <button
                type="button"
                onClick={() => handleRemoveDate(examDate.date)}
                className="ml-2 text-university-primary hover:text-red-600"
                aria-label={`Remove date ${examDate.date}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {requiredDates && requiredDates > value.length && (
        <p className="text-amber-600 text-sm">
          Need at least {requiredDates} dates for the number of students. Currently: {value.length}
        </p>
      )}
      {value.length === 0 && (
        <p className="text-red-600 text-sm">At least one exam date is required</p>
      )}
    </div>
  );
}
