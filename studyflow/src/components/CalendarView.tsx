import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Download, 
  MapPin, 
  Clock, 
  X, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle, 
  Sparkles,
  Layers,
  CalendarDays
} from 'lucide-react';
import { CalendarEvent, EventType, UserRole, CountdownItem, StudentProfile, TaskItem } from '../types';
import { Avatar } from './Avatar';
import { 
  pad, 
  formatDate, 
  addDays, 
  getMonday, 
  formatHours, 
  DOW_LABELS, 
  DOW_FULL_LABELS,
  EVENT_TYPE_MAP 
} from '../data/initialData';
import { downloadICalFile, generateICal } from '../utils/calendarExport';
import { CountdownView } from './CountdownView';

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks: TaskItem[];
  role: UserRole;
  onSaveEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: number) => void;
  countdowns: CountdownItem[];
  onAddCountdown: (item: Omit<CountdownItem, 'id'>) => void;
  onUpdateCountdown: (item: CountdownItem) => void;
  onDeleteCountdown: (id: number) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  studentProfile?: StudentProfile;
  onOpenStudentProfile?: () => void;
  onSaveStudentProfile?: (profile: StudentProfile) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  tasks,
  role,
  onSaveEvent,
  onDeleteEvent,
  countdowns,
  onAddCountdown,
  onUpdateCountdown,
  onDeleteCountdown,
  searchQuery = '',
  onSearchChange,
  studentProfile,
  onOpenStudentProfile,
  onSaveStudentProfile
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [studentInfo, setStudentInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('studyflow_student_info');
      return saved ? JSON.parse(saved) : { name: 'Văn An', className: '12A1', school: 'THPT Chuyên' };
    } catch {
      return { name: 'Văn An', className: '12A1', school: 'THPT Chuyên' };
    }
  });

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempName, setTempName] = useState(studentInfo.name);
  const [tempClass, setTempClass] = useState(studentInfo.className);
  const [tempSchool, setTempSchool] = useState(studentInfo.school);

  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(getMonday(today));
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formDate, setFormDate] = useState(formatDate(today));
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EventType>('class');
  const [formHour, setFormHour] = useState('08:00');
  const [formDuration, setFormDuration] = useState('1.5');
  const [formRoom, setFormRoom] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedICal, setCopiedICal] = useState(false);

  // --- AI Schedule Suggestion State ---
  const [isGeneratingAiSchedule, setIsGeneratingAiSchedule] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<CalendarEvent[]>([]);
  const [isAiSuggestModalOpen, setIsAiAiSuggestModalOpen] = useState(false);

  const handleGenerateAiSchedule = async () => {
    try {
      setIsGeneratingAiSchedule(true);
      const res = await fetch('/api/ai/suggest-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          tasks,
          countdowns,
          startDate: formatDate(currentWeekMonday)
        })
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
        setIsAiAiSuggestModalOpen(true);
      } else {
        alert(data.message || 'Không thể tạo gợi ý lúc này. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('AI suggest error:', err);
      alert('Lỗi kết nối máy chủ AI.');
    } finally {
      setIsGeneratingAiSchedule(false);
    }
  };

  const handleApplyAiSuggestions = () => {
    aiSuggestions.forEach((s) => {
      onSaveEvent({
        ...s,
        id: Date.now() + Math.random(),
        dow: (new Date(s.date || '').getDay() + 6) % 7
      });
    });
    setAiSuggestions([]);
    setIsAiAiSuggestModalOpen(false);
    setSyncNotice(`Đã tự động phân bổ ${aiSuggestions.length} buổi học thông minh vào lịch!`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // 7 days of current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekMonday, i));

  const matchesFilters = (e: CalendarEvent) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (subjectFilter !== 'all' && !e.t.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return e.t.toLowerCase().includes(query) || (e.room || '').toLowerCase().includes(query);
  };

  const getEventsForDay = (d: Date) => {
    if (!d) return [];
    const dStr = formatDate(d);
    return (events || [])
      .filter((e) => e && e.date === dStr && matchesFilters(e))
      .sort((a, b) => (a.h || 0) - (b.h || 0));
  };

  const handleOpenAddModal = (dateStr?: string, defaultHour = 8) => {
    setEditingEvent(null);
    setFormDate(dateStr || formatDate(today));
    setFormTitle('');
    setFormType('class');
    setFormHour(`${pad(defaultHour)}:00`);
    setFormDuration('1.5');
    setFormRoom('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: CalendarEvent, dateStr?: string) => {
    setEditingEvent(e);
    setFormDate(e.date || dateStr || formatDate(today));
    setFormTitle(e.t);
    setFormType(e.type);
    setFormHour(formatHours(e.h));
    setFormDuration(String(e.d));
    setFormRoom(e.room || '');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const [h, m] = formHour.split(':').map(Number);
    const parsedH = Math.min(23, Math.max(0, (h || 8) + (m || 0) / 60));
    const parsedDur = Math.max(0.5, Math.min(6, parseFloat(formDuration) || 1.5));

    const selectedDate = new Date(formDate);
    const dow = (selectedDate.getDay() + 6) % 7;

    const updated: CalendarEvent = {
      id: editingEvent ? editingEvent.id : Date.now(),
      t: formTitle.trim(),
      type: formType,
      date: formDate,
      dow,
      h: parsedH,
      d: parsedDur,
      room: formRoom.trim()
    };

    onSaveEvent(updated);
    setIsModalOpen(false);
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentWeekMonday(new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth() - 1, 1));
    } else {
      setCurrentWeekMonday(addDays(currentWeekMonday, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentWeekMonday(new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth() + 1, 1));
    } else {
      setCurrentWeekMonday(addDays(currentWeekMonday, 7));
    }
  };

  const handleToday = () => {
    setCurrentWeekMonday(getMonday(today));
  };

  const currentStudentName = studentProfile?.name || studentInfo.name;
  const currentStudentClass = studentProfile?.className || studentInfo.className;
  const currentStudentSchool = studentProfile?.schoolName || studentInfo.school;

  const handleSaveStudentInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      name: tempName.trim() || 'Văn An',
      className: tempClass.trim() || '12A1',
      school: tempSchool.trim() || 'THPT Chuyên'
    };
    setStudentInfo(updated);
    if (onSaveStudentProfile && studentProfile) {
      onSaveStudentProfile({
        ...studentProfile,
        name: updated.name,
        className: updated.className,
        schoolName: updated.school
      });
    }
    try {
      localStorage.setItem('studyflow_student_info', JSON.stringify(updated));
    } catch {}
    setIsEditingInfo(false);
  };

  const startD = weekDays[0];
  const endD = weekDays[6];
  const formattedRange = `${startD.getDate()}/${startD.getMonth() + 1} – ${endD.getDate()}/${endD.getMonth() + 1}/${endD.getFullYear()}`;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. TOP HEADER - Modern Luxury Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3.5">
          {studentProfile && (
            <div className="relative group cursor-pointer" onClick={onOpenStudentProfile}>
              <Avatar
                src={studentProfile.avatar}
                fallbackText={currentStudentName}
                sizeClassName="w-12 h-12 rounded-2xl shadow-md border-2 border-cyan-400/50 shadow-cyan-500/20 shrink-0 group-hover:scale-105 transition-transform duration-200"
                bgClassName="bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-600"
                textClassName="text-white text-xs font-black"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white dark:border-slate-900 shadow-[0_0_8px_#22d3ee]" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-white dark:via-cyan-100 dark:to-blue-200 bg-clip-text text-transparent tracking-tight">
              Lịch học & Thời gian biểu
            </h1>
          </div>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-50/95 via-sky-50/80 to-blue-50/90 dark:from-cyan-950/60 dark:via-blue-950/40 dark:to-slate-900/80 border border-cyan-500/35 text-cyan-900 dark:text-cyan-100 text-xs font-medium flex items-center gap-2.5 shadow-sm shadow-cyan-500/10 animate-modal-spring">
          <CheckCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 2. MAIN CARD - Masterpiece Glass Card with Subtle Ambient Halos */}
      <div className="calendar-glass-card rounded-[28px] p-5 sm:p-6 space-y-5 relative overflow-hidden">
        {/* Ambient background soft light orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Card Header Row */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          {/* Title & Pill View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 via-cyan-500/20 to-indigo-600/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.2)]">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Thời gian biểu & Lịch học
              </h2>
            </div>

            {/* Pill Container: Tuần | Tháng | Danh sách */}
            <div className="flex items-center bg-slate-100/90 dark:bg-[#060e22]/90 backdrop-blur-md p-1 rounded-full border border-slate-200/80 dark:border-cyan-500/25 shadow-inner">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/35 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/35 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
              >
                Tháng
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/35 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
              >
                Danh sách
              </button>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateAiSchedule}
              disabled={isGeneratingAiSchedule}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 hover:shadow-[0_0_22px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>{isGeneratingAiSchedule ? 'Đang phân bổ...' : 'AI Tự động phân bổ'}</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-cyan-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-cyan-950/40 hover:border-cyan-400 text-blue-700 dark:text-cyan-300 text-xs font-bold shadow-xs hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất sang iCal</span>
            </button>

            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-cyan-600/30 hover:shadow-[0_0_22px_rgba(6,182,212,0.45)] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm sự kiện</span>
            </button>
          </div>
        </div>

        {/* Filter & Navigation Bar */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* Navigation: < Hôm nay > 26/10 – 1/11/2026 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#071328]/80 backdrop-blur-xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-500/40 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              title="Khoảng thời gian trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#071328]/80 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 transition-all active:scale-95 cursor-pointer shadow-2xs hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              Hôm nay
            </button>

            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#071328]/80 backdrop-blur-xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-500/40 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              title="Khoảng thời gian sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-sm sm:text-base font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 dark:from-cyan-300 dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent ml-2 tracking-tight">
              {viewMode === 'month'
                ? `Tháng ${currentWeekMonday.getMonth() + 1}/${currentWeekMonday.getFullYear()}`
                : formattedRange}
            </span>
          </div>

          {/* Right Filters: Tìm kiếm | Tất cả môn | Tất cả loại */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Tìm môn, phòng, GV..."
                className="w-full pl-8 pr-3 py-1.5 rounded-full border border-slate-200/80 dark:border-cyan-500/20 bg-white/70 dark:bg-[#071328]/80 backdrop-blur-xs text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all shadow-2xs"
              />
            </div>

            {/* Loại sự kiện Select */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-cyan-500/20 bg-white/70 dark:bg-[#071328]/80 backdrop-blur-xs text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all cursor-pointer shadow-2xs"
            >
              <option value="all">Tất cả loại</option>
              <option value="class">📚 Lịch học</option>
              <option value="exam">📝 Thi / Kiểm tra</option>
              <option value="act">🎯 Hoạt động</option>
              <option value="due">⏳ Hạn nộp</option>
            </select>
          </div>
        </div>

        {/* 3. VIEW 1: LƯỚI TUẦN 7 CỘT (PROFESSIONAL LUXURY WEEK GRID) */}
        {viewMode === 'week' && (
          <div className="relative z-10 border border-slate-200/80 dark:border-cyan-500/20 rounded-3xl p-3 sm:p-4 bg-slate-50/50 dark:bg-[#030919]/70 backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {weekDays.map((d, idx) => {
                const isToday = formatDate(d) === formatDate(today);
                const dayEvents = getEventsForDay(d);
                const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
                const dowLabel = DOW_LABELS[idx];

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3 flex flex-col min-h-[380px] transition-all duration-200 ${
                      isToday
                        ? 'cal-today-glow relative'
                        : 'border border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-[#071328]/70 backdrop-blur-xs hover:border-cyan-500/40 dark:hover:border-cyan-500/40 hover:shadow-[0_4px_22px_rgba(6,182,212,0.1)]'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-start justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block uppercase tracking-wider">
                            {dowLabel}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm font-black block tabular-nums mt-0.5 ${
                            isToday
                              ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 dark:from-cyan-300 dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {dateLabel}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenAddModal(formatDate(d))}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                          isToday
                            ? 'bg-cyan-500/10 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-400 dark:hover:text-slate-950 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-100/80 dark:bg-slate-800 text-slate-400 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-400 dark:hover:text-slate-950 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        }`}
                        title={`Thêm sự kiện cho ${dowLabel} (${dateLabel})`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Column Body: Event Cards or Elegant Placeholder */}
                    <div className="flex-1 py-2.5 space-y-2 flex flex-col justify-start">
                      {dayEvents.length > 0 ? (
                        dayEvents.map((e) => {
                          const conf = EVENT_TYPE_MAP[e.type] || EVENT_TYPE_MAP.class;
                          return (
                            <div
                              key={e.id}
                              onClick={() => handleOpenEditModal(e, formatDate(d))}
                              className={`${conf.gradientClass} p-3 rounded-xl cursor-pointer group select-none`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0 drop-shadow-xs">{conf.icon}</span>
                                  <span className="px-1.5 py-0.5 rounded-md bg-white/85 dark:bg-[#040c1a]/90 font-mono text-[10px] font-black text-slate-800 dark:text-cyan-200 border border-black/5 dark:border-cyan-500/25 tabular-nums shrink-0">
                                    {formatHours(e.h)}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold opacity-60 shrink-0 tabular-nums">
                                  {e.d}h
                                </span>
                              </div>

                              <h3 className="font-bold text-xs leading-snug line-clamp-2 text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                                {e.t}
                              </h3>

                              {e.room && (
                                <div className="flex items-center gap-1 mt-1.5 text-[10px] opacity-75 truncate text-slate-600 dark:text-slate-300">
                                  <MapPin className="w-2.5 h-2.5 shrink-0 text-cyan-500" />
                                  <span className="truncate">{e.room}</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="my-auto py-12 flex flex-col items-center justify-center text-center opacity-40 select-none">
                          <div className="w-7 h-7 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center mb-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 italic">Trống</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. VIEW 2: THÁNG (Month View with Vibrant Event Chips) */}
        {viewMode === 'month' && (
          <div className="relative z-10 border border-slate-200/80 dark:border-cyan-500/20 rounded-3xl p-4 bg-white/80 dark:bg-[#071328]/80 backdrop-blur-xs">
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              {DOW_LABELS.map((d) => (
                <div key={d} className="py-1 tracking-wider uppercase">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 pt-3">
              {Array.from({ length: 35 }, (_, i) => {
                const cellDate = addDays(currentWeekMonday, i - 7);
                const isToday = formatDate(cellDate) === formatDate(today);
                const dayEvs = getEventsForDay(cellDate);
                return (
                  <div
                    key={i}
                    onClick={() => handleOpenAddModal(formatDate(cellDate))}
                    className={`min-h-[85px] p-2 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isToday
                        ? 'border-2 border-cyan-400 bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        : 'border-slate-100 dark:border-slate-800/80 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 bg-slate-50/40 dark:bg-[#071328]/50 hover:bg-white dark:hover:bg-[#091833]/80 hover:shadow-[0_0_16px_rgba(6,182,212,0.15)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-black tabular-nums ${
                          isToday ? 'text-cyan-600 dark:text-cyan-300 font-extrabold' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cellDate.getDate()}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvs.slice(0, 2).map((e) => {
                        const conf = EVENT_TYPE_MAP[e.type] || EVENT_TYPE_MAP.class;
                        return (
                          <div
                            key={e.id}
                            className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded-md ${conf.gradientBadge} flex items-center gap-1 shadow-2xs`}
                          >
                            <span>{conf.icon}</span>
                            <span className="font-mono tabular-nums">{formatHours(e.h)}</span>
                            <span className="truncate">{e.t}</span>
                          </div>
                        );
                      })}
                      {dayEvs.length > 2 && (
                        <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-extrabold block">
                          +{dayEvs.length - 2} sự kiện
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. VIEW 3: DANH SÁCH (List View with Luxury Card Layering) */}
        {viewMode === 'list' && (
          <div className="relative z-10 space-y-3">
            {weekDays.map((d, idx) => {
              const dayEvs = getEventsForDay(d);
              const isToday = formatDate(d) === formatDate(today);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isToday
                      ? 'border-2 border-cyan-500/70 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent dark:from-cyan-950/40 dark:via-[#071328] dark:to-blue-950/20 shadow-md shadow-cyan-500/15'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#071328]/60 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 hover:shadow-[0_4px_20px_rgba(6,182,212,0.1)]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        {DOW_FULL_LABELS[idx]}
                      </span>
                      <span
                        className={`text-xs font-black tabular-nums ${
                          isToday
                            ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 dark:from-cyan-300 dark:via-sky-200 dark:to-blue-200 bg-clip-text text-transparent'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.35)]">
                          Hôm nay
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenAddModal(formatDate(d))}
                      className="text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm sự kiện</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
                    {dayEvs.length > 0 ? (
                      dayEvs.map((e) => {
                        const conf = EVENT_TYPE_MAP[e.type] || EVENT_TYPE_MAP.class;
                        return (
                          <div
                            key={e.id}
                            onClick={() => handleOpenEditModal(e, formatDate(d))}
                            className="py-3 px-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0b1b36]/60 rounded-xl transition-all duration-150 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg drop-shadow-xs">{conf.icon}</span>
                              <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#040c1a] text-slate-800 dark:text-cyan-200 border border-slate-200/60 dark:border-cyan-500/25 tabular-nums shrink-0">
                                {formatHours(e.h)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                                  {e.t}
                                </p>
                                {e.room && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0 text-cyan-500" />
                                    <span className="truncate">{e.room}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 shadow-2xs ${conf.gradientBadge}`}>
                              {conf.label}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-400 italic">
                        Không có lịch học hoặc lịch thi trong ngày này
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. PHẦN ĐẾM NGƯỢC KỲ THI & MỤC TIÊU QUAN TRỌNG */}
      <div id="countdown-section" className="pt-8 pb-4 border-t border-slate-200/80 dark:border-slate-800">
        <CountdownView
          countdowns={countdowns}
          onAddCountdown={onAddCountdown}
          onUpdateCountdown={onUpdateCountdown}
          onDeleteCountdown={onDeleteCountdown}
          embedded
        />
      </div>

      {/* MODAL 1: Thêm / Sửa Sự kiện (Depth Shadow & Spring Entrance) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl">
          <div className="calendar-modal-shadow animate-modal-spring bg-white/95 dark:bg-[#071328]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-cyan-500/30 rounded-3xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-blue-600/20 via-cyan-500/15 to-indigo-600/10">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <span>{editingEvent ? 'Chỉnh sửa lịch' : 'Thêm lịch học / thi mới'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:bg-cyan-500/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên môn học / Hoạt động *
                </label>
                <input
                  type="text"
                  placeholder="VD: Sinh học, Thi giữa kỳ Toán, Họp Đoàn..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Loại sự kiện
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as EventType)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all cursor-pointer"
                  >
                    <option value="class">📚 Lịch học</option>
                    <option value="exam">📝 Thi / Kiểm tra</option>
                    <option value="act">🎯 Hoạt động</option>
                    <option value="due">⏳ Hạn nộp bài</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ngày
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={formHour}
                    onChange={(e) => setFormHour(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phòng học / Ghi chú
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Phòng 204 – Dãy B"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEvent(editingEvent.id);
                      setIsModalOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa sự kiện</span>
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 hover:shadow-[0_0_22px_rgba(6,182,212,0.45)] active:scale-95 transition-all cursor-pointer"
                  >
                    Lưu sự kiện
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Chỉnh sửa thông tin học sinh */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl">
          <div className="calendar-modal-shadow animate-modal-spring bg-white/95 dark:bg-[#071328]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-cyan-500/30 rounded-3xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Cập nhật thông tin học sinh
            </h3>
            <form onSubmit={handleSaveStudentInfo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Lớp học
                </label>
                <input
                  type="text"
                  value={tempClass}
                  onChange={(e) => setTempClass(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Trường học
                </label>
                <input
                  type="text"
                  value={tempSchool}
                  onChange={(e) => setTempSchool(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-cyan-500/25 bg-slate-50/70 dark:bg-[#040c1a]/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Xuất iCal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl">
          <div className="calendar-modal-shadow animate-modal-spring bg-white/95 dark:bg-[#071328]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-cyan-500/30 rounded-3xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  <Download className="w-4 h-4" />
                </div>
                <span>Xuất thời khóa biểu sang iCal (.ics)</span>
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tải tệp .ics để nhập trực tiếp vào Google Calendar, Apple Calendar hoặc Microsoft Outlook trên điện thoại và máy tính.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  downloadICalFile(events, currentWeekMonday);
                  setIsExportModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition text-center cursor-pointer"
              >
                Tải tệp .ics về máy
              </button>
              <button
                onClick={() => {
                  const ical = generateICal(events, currentWeekMonday);
                  navigator.clipboard.writeText(ical);
                  setCopiedICal(true);
                  setTimeout(() => setCopiedICal(false), 2000);
                }}
                className="px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-50/50 dark:bg-[#040c1a] text-xs font-bold text-cyan-800 dark:text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] transition active:scale-95 cursor-pointer"
              >
                {copiedICal ? '✓ Đã sao chép' : 'Sao chép mã'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Gợi ý Lịch học AI (Deep Violet Glow & Glassy Cards) */}
      {isAiSuggestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl">
          <div className="calendar-ai-modal-shadow animate-modal-spring bg-white/95 dark:bg-[#071328]/95 backdrop-blur-2xl border border-indigo-500/35 rounded-3xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-indigo-500/25 flex items-center justify-between bg-gradient-to-r from-indigo-600/25 via-purple-600/20 to-cyan-600/15 shrink-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-cyan-400 flex items-center justify-center border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                </div>
                <span>AI Phân bổ Lịch học Thông minh</span>
              </h2>
              <button
                onClick={() => setIsAiAiSuggestModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-400 dark:hover:text-cyan-300 hover:bg-white/50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-cyan-50/80 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-[#040c1a]/80 border border-indigo-500/25 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed shadow-2xs">
                ✨ <strong>Trí tuệ nhân tạo</strong> đã phân tích <strong>{tasks.filter((t) => !t.done).length} bài tập</strong> và <strong>{countdowns.length} kỳ thi</strong> sắp tới để tìm ra các khoảng trống tối ưu nhất cho bạn.
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Danh sách buổi học đề xuất:
                  </h3>
                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800 shadow-2xs">
                    Sắp xếp theo thứ tự tối ưu
                  </span>
                </div>
                
                {aiSuggestions.length > 0 ? (
                  aiSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-cyan-50/40 dark:from-[#09152e] dark:via-[#071228] dark:to-[#050e20] flex items-center justify-between gap-3 group hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#030919] border border-cyan-500/30 dark:border-cyan-500/40 flex flex-col items-center justify-center shrink-0 shadow-xs">
                          <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 leading-none tabular-nums">
                            {s.date?.split('-')[2]}
                          </span>
                          <span className="text-[8px] font-black text-slate-400 uppercase leading-none mt-1">
                            Th {new Date(s.date || '').getMonth() + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                            {s.t}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 tabular-nums font-mono font-bold">
                              <Clock className="w-3 h-3 text-cyan-500" /> {formatHours(s.h)} ({s.d}h)
                            </span>
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold truncate">
                              • {s.room}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Không tìm thấy khoảng trống phù hợp trong tuần này.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-[#040c1a]/50">
              <button
                onClick={() => setIsAiAiSuggestModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              >
                Để sau
              </button>
              <button
                onClick={handleApplyAiSuggestions}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Áp dụng toàn bộ lịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
