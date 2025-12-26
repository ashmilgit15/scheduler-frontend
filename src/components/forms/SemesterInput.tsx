'use client';

import { useState, useEffect, useRef } from 'react';
import { Semester, parseUploadedFile, analyzeImageWithAI, ExtractedData, ExamMetadata, Examiner } from '@/lib/api';

interface SemesterInputProps {
  value: Semester[];
  onChange: (semesters: Semester[]) => void;
  onExtractedData?: (data: ExtractedData) => void;
}

export default function SemesterInput({ value, onChange, onExtractedData }: SemesterInputProps) {
  const [newSemesterName, setNewSemesterName] = useState('');
  // Store raw text for each batch textarea to allow free typing
  const [batchTexts, setBatchTexts] = useState<Record<string, string>>({});
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showAIUpload, setShowAIUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize batch texts from value when component mounts or value changes externally
  useEffect(() => {
    const newTexts: Record<string, string> = {};
    value.forEach((sem, semIdx) => {
      sem.batches.forEach((batch, batchIdx) => {
        const key = `${semIdx}-${batchIdx}`;
        // Only set if not already in batchTexts (preserve user typing)
        if (!(key in batchTexts) || batch.register_numbers.length === 0) {
          newTexts[key] = batch.register_numbers.join('\n');
        } else {
          newTexts[key] = batchTexts[key];
        }
      });
    });
    // Only update if there are new keys
    const hasNewKeys = Object.keys(newTexts).some(k => !(k in batchTexts));
    if (hasNewKeys) {
      setBatchTexts(prev => ({ ...prev, ...newTexts }));
    }
  }, [value.length]);

  const addSemester = () => {
    if (!newSemesterName.trim()) return;
    const semName = newSemesterName.toUpperCase().startsWith('S') 
      ? newSemesterName.toUpperCase() 
      : `S${newSemesterName}`;
    
    if (value.some(s => s.name === semName)) {
      alert('Semester already exists');
      return;
    }
    
    const newSemIdx = value.length;
    setBatchTexts(prev => ({ ...prev, [`${newSemIdx}-0`]: '' }));
    onChange([...value, { name: semName, batches: [{ name: 'A', register_numbers: [] }] }]);
    setNewSemesterName('');
  };

  const removeSemester = (index: number) => {
    // Clean up batch texts for removed semester
    const newTexts = { ...batchTexts };
    Object.keys(newTexts).forEach(key => {
      if (key.startsWith(`${index}-`)) {
        delete newTexts[key];
      }
    });
    setBatchTexts(newTexts);
    onChange(value.filter((_, i) => i !== index));
  };

  const addBatch = (semesterIndex: number) => {
    const updated = [...value];
    const semester = updated[semesterIndex];
    const nextBatchLetter = String.fromCharCode(65 + semester.batches.length);
    const newBatchIdx = semester.batches.length;
    semester.batches.push({ name: nextBatchLetter, register_numbers: [] });
    setBatchTexts(prev => ({ ...prev, [`${semesterIndex}-${newBatchIdx}`]: '' }));
    onChange(updated);
  };

  const removeBatch = (semesterIndex: number, batchIndex: number) => {
    const updated = [...value];
    if (updated[semesterIndex].batches.length > 1) {
      updated[semesterIndex].batches = updated[semesterIndex].batches.filter((_, i) => i !== batchIndex);
      // Clean up batch text
      const newTexts = { ...batchTexts };
      delete newTexts[`${semesterIndex}-${batchIndex}`];
      setBatchTexts(newTexts);
      onChange(updated);
    }
  };

  const handleTextChange = (semesterIndex: number, batchIndex: number, text: string) => {
    const key = `${semesterIndex}-${batchIndex}`;
    setBatchTexts(prev => ({ ...prev, [key]: text }));
    
    // Parse register numbers from text (newline, comma, or multiple spaces separated)
    const numbers = text
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const updated = [...value];
    updated[semesterIndex].batches[batchIndex].register_numbers = numbers;
    onChange(updated);
  };

  const getBatchText = (semesterIndex: number, batchIndex: number): string => {
    const key = `${semesterIndex}-${batchIndex}`;
    if (key in batchTexts) {
      return batchTexts[key];
    }
    return value[semesterIndex]?.batches[batchIndex]?.register_numbers.join('\n') || '';
  };

  const getTotalStudents = () => {
    return value.reduce((sum, sem) => 
      sum + sem.batches.reduce((bSum, batch) => bSum + batch.register_numbers.length, 0), 0
    );
  };

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadMessage('');
    
    try {
      const result = await parseUploadedFile(file);
      
      if (result.success && result.semesters.length > 0) {
        // Merge with existing semesters
        const merged = mergeSemesters(value, result.semesters);
        onChange(merged);
        setUploadMessage(`✓ ${result.message}`);
      } else {
        setUploadMessage(`✗ ${result.error || 'No data found in file'}`);
      }
    } catch (error) {
      setUploadMessage('✗ Failed to parse file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    
    setIsUploading(true);
    setUploadMessage('Analyzing image with AI...');
    
    try {
      // API key is now handled server-side, no need to pass it
      const result = await analyzeImageWithAI(file);
      
      if (result.success && result.semesters.length > 0) {
        const merged = mergeSemesters(value, result.semesters);
        onChange(merged);
        setUploadMessage(`✓ ${result.message}`);
        
        // Pass extracted data to parent for auto-populating other fields
        if (result.extracted_data && onExtractedData) {
          onExtractedData(result.extracted_data);
        }
      } else {
        setUploadMessage(`✗ ${result.error || 'Could not extract data from image'}`);
      }
    } catch (error) {
      setUploadMessage('✗ Failed to analyze image');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const mergeSemesters = (existing: Semester[], newData: Semester[]): Semester[] => {
    const result = [...existing];
    
    for (const newSem of newData) {
      const existingIdx = result.findIndex(s => s.name === newSem.name);
      
      if (existingIdx >= 0) {
        // Merge batches
        for (const newBatch of newSem.batches) {
          const existingBatchIdx = result[existingIdx].batches.findIndex(b => b.name === newBatch.name);
          
          if (existingBatchIdx >= 0) {
            // Merge register numbers
            const existingNums = new Set(result[existingIdx].batches[existingBatchIdx].register_numbers);
            newBatch.register_numbers.forEach(n => existingNums.add(n));
            result[existingIdx].batches[existingBatchIdx].register_numbers = Array.from(existingNums);
          } else {
            result[existingIdx].batches.push(newBatch);
          }
        }
      } else {
        result.push(newSem);
      }
    }
    
    return result;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-lg font-medium text-gray-900">
          Semesters & Batches
        </label>
        <span className="text-sm text-gray-600">
          Total Students: {getTotalStudents()}
        </span>
      </div>

      {/* Add Semester */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newSemesterName}
          onChange={(e) => setNewSemesterName(e.target.value)}
          placeholder="Enter semester (e.g., S1, S2, 3)"
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
          onKeyDown={(e) => e.key === 'Enter' && addSemester()}
        />
        <button
          type="button"
          onClick={addSemester}
          className="px-4 py-2 bg-university-primary text-white rounded-md hover:bg-university-secondary"
        >
          Add Semester
        </button>
      </div>

      {/* File Upload Section */}
      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 text-sm"
          >
            📄 Upload CSV/TXT
          </label>
          
          <button
            type="button"
            onClick={() => setShowAIUpload(!showAIUpload)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-sm"
          >
            🤖 AI Image Extract
          </button>
          
          {isUploading && (
            <span className="text-sm text-gray-500">Processing...</span>
          )}
        </div>
        
        {showAIUpload && (
          <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-block px-4 py-2 rounded-md cursor-pointer text-sm bg-university-accent text-white hover:bg-university-secondary"
            >
              📷 Upload Image
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Uses Groq AI vision to extract register numbers from images
            </p>
          </div>
        )}
        
        {uploadMessage && (
          <p className={`mt-2 text-sm ${uploadMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
            {uploadMessage}
          </p>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          CSV format: semester,batch,register_number (or just register numbers, one per line)
        </p>
      </div>

      {/* Semester List */}
      {value.length === 0 && (
        <p className="text-gray-500 text-sm">No semesters added. Add a semester to input register numbers.</p>
      )}

      {value.map((semester, semIndex) => (
        <div key={semIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-university-primary">
              {semester.name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({semester.batches.reduce((sum, b) => sum + b.register_numbers.length, 0)} students)
              </span>
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addBatch(semIndex)}
                className="px-3 py-1 text-sm bg-university-accent text-white rounded hover:bg-university-secondary"
              >
                + Add Batch
              </button>
              <button
                type="button"
                onClick={() => removeSemester(semIndex)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Batches */}
          <div className="grid gap-4 md:grid-cols-2">
            {semester.batches.map((batch, batchIndex) => (
              <div key={batchIndex} className="bg-white border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">
                    Batch {semester.name}{batch.name}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({batch.register_numbers.length} students)
                    </span>
                  </span>
                  {semester.batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBatch(semIndex, batchIndex)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  value={getBatchText(semIndex, batchIndex)}
                  onChange={(e) => handleTextChange(semIndex, batchIndex, e.target.value)}
                  placeholder={`Enter register numbers (one per line or comma-separated)`}
                  className="w-full h-32 p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent font-mono"
                  aria-label={`Register numbers for ${semester.name}${batch.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {getTotalStudents() === 0 && value.length > 0 && (
        <p className="text-amber-600 text-sm">
          Add register numbers to generate a schedule.
        </p>
      )}
    </div>
  );
}
