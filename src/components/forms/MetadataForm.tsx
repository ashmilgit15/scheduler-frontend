'use client';

import { ExamMetadata } from '@/lib/api';

interface MetadataFormProps {
  value: ExamMetadata;
  onChange: (metadata: ExamMetadata) => void;
}

export default function MetadataForm({ value, onChange }: MetadataFormProps) {
  const handleChange = (field: keyof ExamMetadata, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Exam Details (Optional)</h3>
      <p className="text-sm text-gray-500">Fill in exam details for the schedule header. All fields are optional.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Name
          </label>
          <input
            type="text"
            value={value.exam_name}
            onChange={(e) => handleChange('exam_name', e.target.value)}
            placeholder="e.g., Computer Science Lab Exam"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
            aria-label="Exam name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semester
          </label>
          <input
            type="text"
            value={value.semester}
            onChange={(e) => handleChange('semester', e.target.value)}
            placeholder="e.g., S6"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
            aria-label="Semester"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            value={value.department}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="e.g., Computer Science & Engineering"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
            aria-label="Department"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <input
            type="text"
            value={value.academic_year}
            onChange={(e) => handleChange('academic_year', e.target.value)}
            placeholder="e.g., 2024-25"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-university-accent"
            aria-label="Academic year"
          />
        </div>
      </div>
    </div>
  );
}
