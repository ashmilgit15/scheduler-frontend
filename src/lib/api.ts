const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Examiner {
  id: string;
  name: string;
}

export interface Batch {
  name: string;
  register_numbers: string[];
}

export interface Semester {
  name: string;
  batches: Batch[];
}

export interface ExamMetadata {
  exam_name?: string;
  semester?: string;
  department?: string;
  academic_year?: string;
}

export interface ExamDate {
  date: string;
  subject?: string;
  register_numbers: string[];
}

export interface TimeSlot {
  time: string;
  session: string;
  capacity: number;
  register_numbers: string[];
}

export interface LabSchedule {
  date: string;
  subject?: string;
  lab: string;
  slots: TimeSlot[];
  internal_examiner?: Examiner;
  external_examiner?: Examiner;
  semester?: string;
  batch?: string;
}

export interface ScheduleRequest {
  exam_metadata?: ExamMetadata;
  register_numbers?: string[];
  semesters?: Semester[];
  dates?: string[];
  exam_dates?: ExamDate[];
  labs?: string[];
  internal_examiners?: Examiner[];
  external_examiners?: Examiner[];
}

export interface ScheduleResponse {
  exam_metadata: ExamMetadata;
  examiners: {
    internal: Examiner[];
    external: Examiner[];
  };
  schedule: LabSchedule[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: string[];
}

export async function generateSchedule(request: ScheduleRequest): Promise<ApiResponse<ScheduleResponse>> {
  const response = await fetch(`${API_BASE_URL}/api/schedule/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
}

export async function validateSchedule(request: ScheduleRequest): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE_URL}/api/schedule/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return response.json();
}

export interface ParseFileResponse {
  success: boolean;
  semesters: Semester[];
  total_students: number;
  message?: string;
  error?: string;
}

export interface ExtractedData {
  exam_name: string;
  department: string;
  semester: string;
  batch: string;
  academic_year: string;
  dates: string[];
  labs: string[];
  internal_examiners: Examiner[];
  external_examiners: Examiner[];
  subjects: string[];
  register_numbers: string[];
  raw_text: string;
}

export interface AnalyzeImageResponse {
  success: boolean;
  semesters: Semester[];
  total_students: number;
  extracted_data?: ExtractedData;
  raw_response?: string;
  message?: string;
  error?: string;
}

export async function parseUploadedFile(file: File): Promise<ParseFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/api/upload/parse-file`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function analyzeImageWithAI(file: File): Promise<AnalyzeImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  // API key is now handled server-side via GROQ_API_KEY environment variable
  
  const response = await fetch(`${API_BASE_URL}/api/upload/analyze-image`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export interface AutoSelectDatesRequest {
  available_dates: string[];
  student_count: number;
  min_gap_days?: number;
  subjects?: string[];
}

export interface AutoSelectDatesResponse {
  success: boolean;
  selected_dates: string[];
  exam_dates: ExamDate[];
  required_days: number;
  available_days: number;
  students_per_day: number;
  message: string;
  schedule_info: {
    total_students: number;
    days_needed: number;
    days_selected: number;
    min_gap_requested: number;
  };
  error?: string;
}

export interface CalculateRequirementsResponse {
  student_count: number;
  daily_capacity: number;
  required_days: number;
  available_dates: number;
  dates_sufficient: boolean | null;
  additional_dates_needed: number | null;
}

export async function autoSelectDates(request: AutoSelectDatesRequest): Promise<AutoSelectDatesResponse> {
  const params = new URLSearchParams();
  request.available_dates.forEach(d => params.append('available_dates', d));
  params.append('student_count', request.student_count.toString());
  if (request.min_gap_days !== undefined) {
    params.append('min_gap_days', request.min_gap_days.toString());
  }
  if (request.subjects) {
    request.subjects.forEach(s => params.append('subjects', s));
  }
  
  const response = await fetch(`${API_BASE_URL}/api/schedule/auto-select-dates?${params}`, {
    method: 'POST',
  });
  return response.json();
}

export async function calculateRequirements(studentCount: number, availableDates: number = 0): Promise<CalculateRequirementsResponse> {
  const params = new URLSearchParams({
    student_count: studentCount.toString(),
    available_dates: availableDates.toString(),
  });
  
  const response = await fetch(`${API_BASE_URL}/api/schedule/calculate-requirements?${params}`, {
    method: 'POST',
  });
  return response.json();
}
