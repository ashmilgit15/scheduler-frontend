'use client';

import { Examiner } from '@/lib/api';

interface ExaminerFormProps {
  internalExaminers: Examiner[];
  externalExaminers: Examiner[];
  onInternalChange: (examiners: Examiner[]) => void;
  onExternalChange: (examiners: Examiner[]) => void;
}

export default function ExaminerForm({
  internalExaminers,
  externalExaminers,
  onInternalChange,
  onExternalChange,
}: ExaminerFormProps) {
  const handleInternalChange = (index: number, field: 'id' | 'name', value: string) => {
    const updated = [...internalExaminers];
    updated[index] = { ...updated[index], [field]: value };
    onInternalChange(updated);
  };

  const handleExternalChange = (index: number, field: 'id' | 'name', value: string) => {
    const updated = [...externalExaminers];
    updated[index] = { ...updated[index], [field]: value };
    onExternalChange(updated);
  };

  const addInternalExaminer = () => {
    onInternalChange([...internalExaminers, { id: '', name: '' }]);
  };

  const addExternalExaminer = () => {
    onExternalChange([...externalExaminers, { id: '', name: '' }]);
  };

  const removeInternalExaminer = (index: number) => {
    if (internalExaminers.length > 0) {
      onInternalChange(internalExaminers.filter((_, i) => i !== index));
    }
  };

  const removeExternalExaminer = (index: number) => {
    if (externalExaminers.length > 0) {
      onExternalChange(externalExaminers.filter((_, i) => i !== index));
    }
  };

  const filledInternal = internalExaminers.filter(e => e.id && e.name).length;
  const filledExternal = externalExaminers.filter(e => e.id && e.name).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            Internal Examiners ({filledInternal} filled) - Optional
          </h3>
          <button
            type="button"
            onClick={addInternalExaminer}
            className="px-3 py-1 text-sm bg-university-primary text-white rounded hover:bg-university-secondary"
          >
            + Add
          </button>
        </div>
        <div className="grid gap-3">
          {internalExaminers.map((examiner, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={examiner.id}
                onChange={(e) => handleInternalChange(index, 'id', e.target.value)}
                placeholder={`ID ${index + 1}`}
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
                aria-label={`Internal examiner ${index + 1} ID`}
              />
              <input
                type="text"
                value={examiner.name}
                onChange={(e) => handleInternalChange(index, 'name', e.target.value)}
                placeholder={`Internal Examiner ${index + 1} Name`}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
                aria-label={`Internal examiner ${index + 1} name`}
              />
              <button
                type="button"
                onClick={() => removeInternalExaminer(index)}
                className="px-2 text-red-600 hover:text-red-800"
                aria-label={`Remove internal examiner ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {filledInternal === 0 && (
          <p className="text-gray-500 text-sm mt-2">
            No internal examiners added. Schedule will be generated without examiner assignments.
          </p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            External Examiners ({filledExternal} filled) - Optional
          </h3>
          <button
            type="button"
            onClick={addExternalExaminer}
            className="px-3 py-1 text-sm bg-university-primary text-white rounded hover:bg-university-secondary"
          >
            + Add
          </button>
        </div>
        <div className="grid gap-3">
          {externalExaminers.map((examiner, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={examiner.id}
                onChange={(e) => handleExternalChange(index, 'id', e.target.value)}
                placeholder={`ID ${index + 1}`}
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
                aria-label={`External examiner ${index + 1} ID`}
              />
              <input
                type="text"
                value={examiner.name}
                onChange={(e) => handleExternalChange(index, 'name', e.target.value)}
                placeholder={`External Examiner ${index + 1} Name`}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
                aria-label={`External examiner ${index + 1} name`}
              />
              <button
                type="button"
                onClick={() => removeExternalExaminer(index)}
                className="px-2 text-red-600 hover:text-red-800"
                aria-label={`Remove external examiner ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {filledExternal === 0 && (
          <p className="text-gray-500 text-sm mt-2">
            No external examiners added. Schedule will be generated without examiner assignments.
          </p>
        )}
      </div>
    </div>
  );
}
