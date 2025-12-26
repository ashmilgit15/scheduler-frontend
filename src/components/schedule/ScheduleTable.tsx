'use client';

import { LabSchedule } from '@/lib/api';

interface ScheduleTableProps {
  schedule: LabSchedule;
}

export default function ScheduleTable({ schedule }: ScheduleTableProps) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
      <div className="bg-university-primary text-white px-4 py-2">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold">{schedule.lab}</span>
            <span className="mx-2">|</span>
            <span>{schedule.date}</span>
            {schedule.subject && (
              <>
                <span className="mx-2">|</span>
                <span className="bg-white/30 px-2 py-0.5 rounded text-sm font-medium">{schedule.subject}</span>
              </>
            )}
            {schedule.batch && (
              <>
                <span className="mx-2">|</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{schedule.batch}</span>
              </>
            )}
          </div>
          <div className="text-sm">
            {schedule.internal_examiner && (
              <span className="mr-4">Int: {schedule.internal_examiner.name}</span>
            )}
            {schedule.external_examiner && (
              <span>Ext: {schedule.external_examiner.name}</span>
            )}
          </div>
        </div>
      </div>
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-40">
              Time
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-24">
              Session
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-20">
              Count
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
              Register Numbers
            </th>
          </tr>
        </thead>
        <tbody>
          {schedule.slots.map((slot, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 text-sm text-gray-900">{slot.time}</td>
              <td className="px-4 py-2 text-sm text-gray-900 capitalize">{slot.session}</td>
              <td className="px-4 py-2 text-sm text-gray-900">{slot.register_numbers.length}</td>
              <td className="px-4 py-2 text-sm text-gray-700">
                <div className="flex flex-wrap gap-1">
                  {slot.register_numbers.map((regNo, i) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-0.5 bg-university-light text-university-primary rounded text-xs"
                    >
                      {regNo}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
