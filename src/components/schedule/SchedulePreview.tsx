'use client';

import { ScheduleResponse } from '@/lib/api';
import ScheduleTable from './ScheduleTable';

interface SchedulePreviewProps {
  schedule: ScheduleResponse;
}

export default function SchedulePreview({ schedule }: SchedulePreviewProps) {
  // Group schedules by date
  const schedulesByDate = schedule.schedule.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof schedule.schedule>);

  const dates = Object.keys(schedulesByDate).sort((a, b) => {
    const [d1, m1, y1] = a.split('-').map(Number);
    const [d2, m2, y2] = b.split('-').map(Number);
    return (y1 - y2) || (m1 - m2) || (d1 - d2);
  });

  const totalStudents = schedule.schedule.reduce(
    (sum, s) => sum + s.slots.reduce((slotSum, slot) => slotSum + slot.register_numbers.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 print:border-none">
        <h2 className="text-2xl font-bold text-university-primary text-center mb-4">
          {schedule.exam_metadata.exam_name}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Department:</span>
            <span className="ml-2">{schedule.exam_metadata.department}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Semester:</span>
            <span className="ml-2">{schedule.exam_metadata.semester}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Academic Year:</span>
            <span className="ml-2">{schedule.exam_metadata.academic_year}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Total Students:</span>
            <span className="ml-2">{totalStudents}</span>
          </div>
        </div>
      </div>

      {/* Examiners */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 print:border-none">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Examiners</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Internal Examiners</h4>
            <ul className="space-y-1 text-sm">
              {schedule.examiners.internal.map((e, i) => (
                <li key={i}>{e.id} - {e.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">External Examiners</h4>
            <ul className="space-y-1 text-sm">
              {schedule.examiners.external.map((e, i) => (
                <li key={i}>{e.id} - {e.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Schedule by Date */}
      {dates.map(date => (
        <div key={date} className="print-break">
          <h3 className="text-xl font-semibold text-university-primary mb-4 border-b pb-2">
            Date: {date}
          </h3>
          {schedulesByDate[date].map((labSchedule, index) => (
            <ScheduleTable key={index} schedule={labSchedule} />
          ))}
        </div>
      ))}
    </div>
  );
}
