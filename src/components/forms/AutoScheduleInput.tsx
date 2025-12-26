'use client';

import { useState } from 'react';
import { ExamDate, autoSelectDates } from '@/lib/api';

interface AutoScheduleInputProps {
  value: ExamDate[];
  onChange: (dates: ExamDate[]) => void;
  studentCount: number;
}

export default function AutoScheduleInput({ value, onChange, studentCount }: AutoScheduleInputProps) {
  const [inputDate, setInputDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [minGapDays, setMinGapDays] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState<string>('');

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const handleAddAvailableDate = () => {
    if (!inputDate) return;
    const formatted = formatDate(inputDate);
    if (!availableDates.includes(formatted)) {
      const newDates = [...availableDates, formatted].sort((a, b) => {
        const [d1, m1, y1] = a.split('-').map(Number);
        const [d2, m2, y2] = b.split('-').map(Number);
        return (y1 - y2) || (m1 - m2) || (d1 - d2);
      });
      setAvailableDates(newDates);
    }
    setInputDate('');
  };

  const handleRemoveAvailableDate = (date: string) => {
    setAvailableDates(availableDates.filter(d => d !== date));
  };

  const handleAutoSelect = async () => {
    if (availableDates.length === 0 || studentCount === 0) {
      setScheduleInfo('Please add available dates and ensure students are entered');
      return;
    }

    setIsCalculating(true);
    setScheduleInfo('Calculating optimal schedule...');

    try {
      const result = await autoSelectDates({
        available_dates: availableDates,
        student_count: studentCount,
        min_gap_days: minGapDays,
      });

      if (result.success) {
        // Convert to ExamDate format
        const examDates: ExamDate[] = result.selected_dates.map(date => ({
          date,
          subject: undefined,
          register_numbers: [],
        }));
        onChange(examDates);
        setScheduleInfo(
          `✓ ${result.message}\n` +
          `Days needed: ${result.schedule_info.days_needed} | ` +
          `Days selected: ${result.schedule_info.days_selected} | ` +
          `Capacity: ${result.students_per_day}/day`
        );
      } else {
        setScheduleInfo(`✗ ${result.error || 'Failed to calculate schedule'}`);
      }
    } catch (error) {
      setScheduleInfo('✗ Error calculating schedule');
    } finally {
      setIsCalculating(false);
    }
  };

  const requiredDays = Math.ceil(studentCount / 125);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-lg font-medium text-gray-900">
          Auto Schedule - Available Dates
        </label>
        <span className="text-sm text-gray-600">
          Need {requiredDays} day(s) for {studentCount} students
        </span>
      </div>

      {/* Add Available Date */}
      <div className="flex gap-2">
        <input
          type="date"
          value={inputDate}
          onChange={(e) => setInputDate(e.target.value)}
          className="w-40 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
          aria-label="Select available date"
        />
        <button
          type="button"
          onClick={handleAddAvailableDate}
          className="px-4 py-2 bg-university-primary text-white rounded-md hover:bg-university-secondary"
        >
          Add Date
        </button>
      </div>

      {/* Available Dates List */}
      {availableDates.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Available Dates ({availableDates.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {availableDates.map(date => (
              <span
                key={date}
                className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
              >
                {date}
                <button
                  type="button"
                  onClick={() => handleRemoveAvailableDate(date)}
                  className="ml-2 text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gap Configuration */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-700">
          Minimum gap between exam days:
        </label>
        <select
          value={minGapDays}
          onChange={(e) => setMinGapDays(Number(e.target.value))}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value={1}>1 day (consecutive allowed)</option>
          <option value={2}>2 days gap</option>
          <option value={3}>3 days gap</option>
          <option value={4}>4 days gap</option>
          <option value={5}>5 days gap</option>
          <option value={7}>1 week gap</option>
        </select>
      </div>

      {/* Auto Select Button */}
      <button
        type="button"
        onClick={handleAutoSelect}
        disabled={isCalculating || availableDates.length === 0 || studentCount === 0}
        className="w-full px-4 py-3 bg-university-accent text-white rounded-md hover:bg-university-secondary disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isCalculating ? '⏳ Calculating...' : '🤖 Auto-Select Optimal Dates'}
      </button>

      {/* Schedule Info */}
      {scheduleInfo && (
        <div className={`p-3 rounded-lg text-sm whitespace-pre-line ${
          scheduleInfo.startsWith('✓') ? 'bg-green-50 text-green-800' : 
          scheduleInfo.startsWith('✗') ? 'bg-red-50 text-red-800' : 
          'bg-blue-50 text-blue-800'
        }`}>
          {scheduleInfo}
        </div>
      )}

      {/* Selected Dates (from parent) */}
      {value.length > 0 && (
        <div className="p-3 bg-university-light rounded-lg">
          <p className="text-sm font-medium text-university-primary mb-2">
            ✓ Selected Exam Dates ({value.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {value.map((ed, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 bg-university-primary text-white rounded-full text-sm"
              >
                {ed.date}
                {ed.subject && <span className="ml-1 opacity-75">({ed.subject})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        The system will automatically select the best dates from your available dates, 
        ensuring proper gaps and capacity (125 students per day).
      </p>
    </div>
  );
}
