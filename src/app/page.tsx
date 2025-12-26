'use client';

import { useState } from 'react';
import { 
  ScheduleRequest, 
  ScheduleResponse, 
  ExamMetadata, 
  Examiner,
  Semester,
  ExamDate,
  ValidationError,
  ExtractedData,
  generateSchedule 
} from '@/lib/api';

import RegisterNumberInput from '@/components/forms/RegisterNumberInput';
import SemesterInput from '@/components/forms/SemesterInput';
import DateBasedInput from '@/components/forms/DateBasedInput';
import AutoScheduleInput from '@/components/forms/AutoScheduleInput';
import DatePicker from '@/components/forms/DatePicker';
import ExaminerForm from '@/components/forms/ExaminerForm';
import LabInput from '@/components/forms/LabInput';
import MetadataForm from '@/components/forms/MetadataForm';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import JSONExport from '@/components/export/JSONExport';
import PDFExport from '@/components/export/PDFExport';

const initialMetadata: ExamMetadata = {
  exam_name: '',
  semester: '',
  department: '',
  academic_year: '',
};

type InputMode = 'simple' | 'semester' | 'byDate' | 'autoSchedule';

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('autoSchedule');
  const [registerNumbers, setRegisterNumbers] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [simpleDates, setSimpleDates] = useState<ExamDate[]>([]);
  const [autoSelectedDates, setAutoSelectedDates] = useState<ExamDate[]>([]);
  const [labs, setLabs] = useState<string[]>(['']);
  const [internalExaminers, setInternalExaminers] = useState<Examiner[]>([]);
  const [externalExaminers, setExternalExaminers] = useState<Examiner[]>([]);
  const [metadata, setMetadata] = useState<ExamMetadata>(initialMetadata);
  
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicatesWarning, setDuplicatesWarning] = useState<string>('');

  // Handle extracted data from AI image analysis
  const handleExtractedData = (data: ExtractedData) => {
    // Auto-populate metadata
    if (data.exam_name || data.department || data.semester || data.academic_year) {
      setMetadata(prev => ({
        exam_name: data.exam_name || prev.exam_name,
        semester: data.semester || prev.semester,
        department: data.department || prev.department,
        academic_year: data.academic_year || prev.academic_year,
      }));
    }
    
    // Auto-populate labs
    if (data.labs && data.labs.length > 0) {
      setLabs(data.labs);
    }
    
    // Auto-populate internal examiners
    if (data.internal_examiners && data.internal_examiners.length > 0) {
      setInternalExaminers(data.internal_examiners);
    }
    
    // Auto-populate external examiners
    if (data.external_examiners && data.external_examiners.length > 0) {
      setExternalExaminers(data.external_examiners);
    }
    
    // Auto-populate dates if available
    if (data.dates && data.dates.length > 0) {
      const newDates: ExamDate[] = data.dates.map((date, idx) => ({
        date,
        subject: data.subjects?.[idx] || undefined,
        register_numbers: [],
      }));
      setAutoSelectedDates(newDates);
      setSimpleDates(newDates);
    } else if (data.register_numbers && data.register_numbers.length > 0) {
      // If we have students but no dates, auto-generate dates starting from tomorrow
      const studentCount = data.register_numbers.length;
      const requiredDays = Math.ceil(studentCount / 125);
      const generatedDates: ExamDate[] = [];
      
      const today = new Date();
      for (let i = 0; i < requiredDays; i++) {
        const examDate = new Date(today);
        examDate.setDate(today.getDate() + 1 + i); // Start from tomorrow
        const day = String(examDate.getDate()).padStart(2, '0');
        const month = String(examDate.getMonth() + 1).padStart(2, '0');
        const year = String(examDate.getFullYear()).slice(-2);
        generatedDates.push({
          date: `${day}-${month}-${year}`,
          subject: data.subjects?.[i] || undefined,
          register_numbers: [],
        });
      }
      
      setAutoSelectedDates(generatedDates);
      setSimpleDates(generatedDates);
      
      // Show a warning that dates were auto-generated
      setWarnings(prev => [...prev, `Auto-generated ${requiredDays} exam date(s) starting from tomorrow. You can modify these in the date picker.`]);
    }
  };

  // Calculate total students based on input mode
  const getTotalStudents = () => {
    if (inputMode === 'byDate') {
      return examDates.reduce((sum, ed) => sum + ed.register_numbers.length, 0);
    }
    if (inputMode === 'semester' || inputMode === 'autoSchedule') {
      return semesters.reduce((sum, sem) => 
        sum + sem.batches.reduce((bSum, batch) => bSum + batch.register_numbers.length, 0), 0
      );
    }
    return registerNumbers.length;
  };

  const requiredDates = Math.ceil(getTotalStudents() / 125);

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrors([]);
    setWarnings([]);
    setSchedule(null);

    let allRegisterNumbers: string[] = [];
    let requestExamDates: ExamDate[] = [];
    let requestDates: string[] = [];

    if (inputMode === 'byDate') {
      // Date-based input - register numbers are in examDates
      allRegisterNumbers = examDates.flatMap(ed => ed.register_numbers);
      requestExamDates = examDates;
      requestDates = examDates.map(ed => ed.date);
    } else if (inputMode === 'autoSchedule') {
      // Auto-schedule mode - students from semesters, dates auto-selected
      allRegisterNumbers = semesters.flatMap(sem => sem.batches.flatMap(batch => batch.register_numbers));
      requestExamDates = autoSelectedDates;
      requestDates = autoSelectedDates.map(ed => ed.date);
    } else if (inputMode === 'semester') {
      allRegisterNumbers = semesters.flatMap(sem => sem.batches.flatMap(batch => batch.register_numbers));
      requestExamDates = simpleDates;
      requestDates = simpleDates.map(ed => ed.date);
    } else {
      allRegisterNumbers = registerNumbers;
      requestExamDates = simpleDates;
      requestDates = simpleDates.map(ed => ed.date);
    }

    // Validation: Check if we have students
    if (allRegisterNumbers.length === 0) {
      setErrors([{ field: 'register_numbers', message: 'No students found. Please add register numbers or upload an image with student data.' }]);
      setIsLoading(false);
      return;
    }

    // Validation: Check if we have dates
    if (requestDates.length === 0) {
      setErrors([{ field: 'dates', message: 'No exam dates selected. Please select dates in the calendar or use Auto Schedule to select dates automatically.' }]);
      setIsLoading(false);
      return;
    }

    const request: ScheduleRequest = {
      exam_metadata: metadata,
      register_numbers: allRegisterNumbers,
      semesters: (inputMode === 'semester' || inputMode === 'autoSchedule') ? semesters : [],
      dates: requestDates,
      exam_dates: requestExamDates,
      labs: labs.filter(l => l.trim()),
      internal_examiners: internalExaminers.filter(e => e.id && e.name),
      external_examiners: externalExaminers.filter(e => e.id && e.name),
    };

    try {
      const response = await generateSchedule(request);
      
      if (response.warnings) {
        setWarnings(response.warnings);
        const dupWarning = response.warnings.find(w => w.includes('Duplicate'));
        if (dupWarning) setDuplicatesWarning(dupWarning);
      }

      if (response.success && response.data) {
        setSchedule(response.data);
      } else if (response.errors) {
        setErrors(response.errors);
      }
    } catch (error) {
      setErrors([{ field: 'general', message: 'Failed to connect to server. Please ensure the backend is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-university-primary text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">
            Practical Exam Scheduler
          </h1>
          <p className="text-center text-university-light mt-2">
            AI-Driven Schedule Generator for Engineering Colleges
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!schedule ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium mb-2">Validation Errors</h3>
                <ul className="list-disc list-inside text-red-700 text-sm">
                  {errors.map((error, i) => (
                    <li key={i}>{error.field}: {error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-800 font-medium mb-2">Warnings</h3>
                <ul className="list-disc list-inside text-amber-700 text-sm">
                  {warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Form Sections */}
            <section className="bg-white rounded-lg shadow-md p-6">
              <MetadataForm value={metadata} onChange={setMetadata} />
            </section>

            {/* Input Mode Toggle */}
            <section className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Student Register Numbers</h3>
                <div className="flex bg-gray-100 rounded-lg p-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setInputMode('autoSchedule')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      inputMode === 'autoSchedule' 
                        ? 'bg-university-accent text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🤖 Auto Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('byDate')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      inputMode === 'byDate' 
                        ? 'bg-university-primary text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    By Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('semester')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      inputMode === 'semester' 
                        ? 'bg-university-primary text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    By Semester
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('simple')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      inputMode === 'simple' 
                        ? 'bg-university-primary text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Simple List
                  </button>
                </div>
              </div>

              {inputMode === 'autoSchedule' ? (
                <SemesterInput
                  value={semesters}
                  onChange={setSemesters}
                  onExtractedData={handleExtractedData}
                />
              ) : inputMode === 'byDate' ? (
                <DateBasedInput
                  value={examDates}
                  onChange={setExamDates}
                  requiredDates={requiredDates > 0 ? requiredDates : undefined}
                />
              ) : inputMode === 'semester' ? (
                <SemesterInput
                  value={semesters}
                  onChange={setSemesters}
                  onExtractedData={handleExtractedData}
                />
              ) : (
                <RegisterNumberInput
                  value={registerNumbers}
                  onChange={setRegisterNumbers}
                  duplicatesWarning={duplicatesWarning}
                />
              )}
            </section>

            {/* Auto Schedule Date Selection */}
            {inputMode === 'autoSchedule' && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <AutoScheduleInput
                  value={autoSelectedDates}
                  onChange={setAutoSelectedDates}
                  studentCount={getTotalStudents()}
                />
              </section>
            )}

            {/* Date Picker - only show for semester and simple modes */}
            {(inputMode === 'semester' || inputMode === 'simple') && (
              <section className="bg-white rounded-lg shadow-md p-6">
                <DatePicker
                  value={simpleDates}
                  onChange={setSimpleDates}
                  requiredDates={requiredDates > 0 ? requiredDates : undefined}
                />
              </section>
            )}

            <section className="bg-white rounded-lg shadow-md p-6">
              <LabInput value={labs} onChange={setLabs} />
            </section>

            <section className="bg-white rounded-lg shadow-md p-6">
              <ExaminerForm
                internalExaminers={internalExaminers}
                externalExaminers={externalExaminers}
                onInternalChange={setInternalExaminers}
                onExternalChange={setExternalExaminers}
              />
            </section>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-8 py-3 bg-university-primary text-white text-lg font-semibold rounded-lg hover:bg-university-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate Schedule'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Export Buttons */}
            <div className="flex justify-between items-center no-print">
              <button
                onClick={() => setSchedule(null)}
                className="px-4 py-2 text-university-primary border border-university-primary rounded-md hover:bg-university-light"
              >
                ← Back to Form
              </button>
              <div className="flex gap-4">
                <JSONExport schedule={schedule} />
                <PDFExport schedule={schedule} />
              </div>
            </div>

            {/* Schedule Preview */}
            <SchedulePreview schedule={schedule} />
          </div>
        )}
      </div>

      <footer className="bg-gray-100 py-4 mt-8 no-print">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          Exam Scheduler - Designed for Engineering Colleges
        </div>
      </footer>
    </main>
  );
}
