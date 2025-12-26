'use client';

import { ScheduleResponse } from '@/lib/api';

interface PDFExportProps {
  schedule: ScheduleResponse;
}

export default function PDFExport({ schedule }: PDFExportProps) {
  const handleExport = async () => {
    // Dynamic import for client-side only
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(schedule.exam_metadata.exam_name || 'Exam Schedule', pageWidth / 2, 20, { align: 'center' });
    
    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Department: ${schedule.exam_metadata.department || 'N/A'}`, 14, 35);
    doc.text(`Semester: ${schedule.exam_metadata.semester || 'N/A'}`, 14, 42);
    doc.text(`Academic Year: ${schedule.exam_metadata.academic_year || 'N/A'}`, 14, 49);
    
    // Examiners
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Examiners', 14, 62);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let yPos = 70;
    
    doc.text('Internal:', 14, yPos);
    schedule.examiners.internal.forEach((e, i) => {
      doc.text(`${e.id} - ${e.name}`, 35, yPos + (i * 5));
    });
    
    doc.text('External:', 110, yPos);
    schedule.examiners.external.forEach((e, i) => {
      doc.text(`${e.id} - ${e.name}`, 131, yPos + (i * 5));
    });
    
    yPos = 105;
    
    // Group by date
    const schedulesByDate = schedule.schedule.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, typeof schedule.schedule>);
    
    const dates = Object.keys(schedulesByDate).sort();
    
    for (const date of dates) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Get subject for this date (from first lab schedule)
      const dateSubject = schedulesByDate[date][0]?.subject;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const dateHeader = dateSubject ? `Date: ${date} - ${dateSubject}` : `Date: ${date}`;
      doc.text(dateHeader, 14, yPos);
      yPos += 8;
      
      for (const labSchedule of schedulesByDate[date]) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        const tableData = labSchedule.slots.map(slot => [
          slot.time,
          slot.session.charAt(0).toUpperCase() + slot.session.slice(1),
          slot.register_numbers.length.toString(),
          slot.register_numbers.join(', ')
        ]);
        
        // Build header with lab name, batch info, and examiners
        let headerText = labSchedule.lab;
        if (labSchedule.batch) {
          headerText += ` | ${labSchedule.batch}`;
        }
        if (labSchedule.internal_examiner || labSchedule.external_examiner) {
          const examiners = [];
          if (labSchedule.internal_examiner) {
            examiners.push(`Int: ${labSchedule.internal_examiner.name}`);
          }
          if (labSchedule.external_examiner) {
            examiners.push(`Ext: ${labSchedule.external_examiner.name}`);
          }
          headerText += ` | ${examiners.join(' | ')}`;
        }
        
        autoTable(doc, {
          startY: yPos,
          head: [[headerText, '', '', '']],
          body: [
            ['Time', 'Session', 'Count', 'Register Numbers'],
            ...tableData
          ],
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 95], fontSize: 10 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 25 },
            2: { cellWidth: 15 },
            3: { cellWidth: 'auto' }
          },
          margin: { left: 14, right: 14 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    }
    
    doc.save(`exam-schedule-${(schedule.exam_metadata.exam_name || 'schedule').replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-university-primary text-white rounded-md hover:bg-university-secondary flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      Export PDF
    </button>
  );
}
