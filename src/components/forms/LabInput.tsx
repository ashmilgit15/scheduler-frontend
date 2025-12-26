'use client';

interface LabInputProps {
  value: string[];
  onChange: (labs: string[]) => void;
}

export default function LabInput({ value, onChange }: LabInputProps) {
  const handleChange = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  const addLab = () => {
    onChange([...value, '']);
  };

  const removeLab = (index: number) => {
    if (value.length > 1) {
      onChange(value.filter((_, i) => i !== index));
    }
  };

  const filledLabs = value.filter(l => l.trim()).length;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Lab Names (optional - defaults will be used if empty)
        </label>
        <button
          type="button"
          onClick={addLab}
          className="px-3 py-1 text-sm bg-university-primary text-white rounded hover:bg-university-secondary"
        >
          + Add Lab
        </button>
      </div>
      <div className="grid gap-2">
        {value.map((lab, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={lab}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={`Lab ${index + 1}`}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
              aria-label={`Lab ${index + 1} name`}
            />
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => removeLab(index)}
                className="px-2 text-red-600 hover:text-red-800"
                aria-label={`Remove lab ${index + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {filledLabs === 0 && (
        <p className="text-gray-500 text-sm">Default labs (Lab 1-5) will be used if none specified</p>
      )}
    </div>
  );
}
