import { CalendarEvent } from '../types';
import { pad, formatDate, addDays, getMonday } from '../data/initialData';

export function generateICal(events: CalendarEvent[], currentWeekMonday: Date): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyFlow//Study Management//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach((e) => {
    const eventDate = e.date || formatDate(addDays(currentWeekMonday, e.dow ?? 0));
    const cleanDate = eventDate.replace(/-/g, '');
    
    const startHour = Math.floor(e.h);
    const startMin = Math.round((e.h % 1) * 60);
    const endH = e.h + e.d;
    const endHour = Math.floor(endH);
    const endMin = Math.round((endH % 1) * 60);

    const dtStart = `${cleanDate}T${pad(startHour)}${pad(startMin)}00`;
    const dtEnd = `${cleanDate}T${pad(endHour)}${pad(endMin)}00`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:studyflow-${e.id}-${cleanDate}@studyflow.app`,
      `DTSTAMP:${formatDate(new Date()).replace(/-/g, '')}T120000Z`,
      `SUMMARY:${e.t}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `LOCATION:${e.room || ''}`,
      `DESCRIPTION:Sự kiện học tập quản lý bởi StudyFlow`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICalFile(events: CalendarEvent[], currentWeekMonday: Date) {
  const content = generateICal(events, currentWeekMonday);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `studyflow-schedule-${formatDate(new Date())}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
