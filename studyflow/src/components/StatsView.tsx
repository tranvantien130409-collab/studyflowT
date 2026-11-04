import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart2, 
  Flame, 
  CheckCircle, 
  BookMarked, 
  TrendingUp, 
  Award,
  CalendarCheck,
  Brain,
  Sparkles,
  Bot,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LayoutDashboard,
  Star,
  Activity,
  Zap,
  Target,
  History as HistoryIcon,
  AlertTriangle,
  Settings,
  Plus,
  Download,
  GraduationCap,
  Edit3,
  Check,
  X,
  Heart,
  Smile,
  ShieldCheck,
  BatteryCharging,
  Trash2,
  FileText,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { StudySurveyModal, SurveyData } from './StudySurveyModal';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { TaskItem, LibraryItem, DayFocusSession, ExamSubmission, CalendarEvent, StudentProfile, MoodLogEntry } from '../types';
import { formatDate, addDays, getMonday, DOW_LABELS } from '../data/initialData';
import { getWeeklyMoodLogs, DayMoodData, MOOD_LEVELS } from '../utils/studyBalanceUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SubjectScoreItem {
  name: string;
  score: number;
  target: number;
  color: string;
}

interface StatsViewProps {
  tasks: TaskItem[];
  library: LibraryItem[];
  sessions: DayFocusSession;
  submissions: ExamSubmission[];
  events: CalendarEvent[];
  studentProfile: StudentProfile;
  moodLogs?: MoodLogEntry[];
}

export const StatsView: React.FC<StatsViewProps> = ({
  tasks,
  library,
  sessions,
  submissions,
  events,
  studentProfile,
  moodLogs = []
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);
  const printableReportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [exportToast, setExportToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setExportToast({ show: true, message, type });
    if (type !== 'info') {
      setTimeout(() => {
        setExportToast(prev => prev && prev.message === message ? null : prev);
      }, 4000);
    }
  };

  // Roadmap Survey State
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    focusSubject: 'Toán học',
    targetHours: 20,
    durationWeeks: 4,
    freeTimeSlots: []
  });

  // Chart time range state: '7' or '14'
  const [chartRange, setChartRange] = useState<'7' | '14'>('7');

  // Study Log State for bottom section (Image 1 & 2)
  const [studyLogs, setStudyLogs] = useState([
    { id: 'log_1', date: '03/11', subject: 'Toán', note: 'Ôn lại công thức đạo hàm', hours: 1.5, icon: '🧮', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
    { id: 'log_2', date: '03/11', subject: 'Tin Học', note: 'Luyện giải thuật quy hoạch động', hours: 2.0, icon: '💻', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50' },
    { id: 'log_3', date: '02/11', subject: 'Tin Học', note: 'Cấu trúc dữ liệu mảng', hours: 1.0, icon: '💻', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50' },
    { id: 'log_4', date: '02/11', subject: 'Ngữ Văn', note: 'Soạn bài Đất Nước', hours: 2.0, icon: '📖', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' }
  ]);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newLogSubject, setNewLogSubject] = useState('Toán');
  const [newLogNote, setNewLogNote] = useState('');
  const [newLogHours, setNewLogHours] = useState('1.5');

  const handleAddStudyLog = () => {
    if (!newLogNote.trim()) return;
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newEntry = {
      id: `log_${Date.now()}`,
      date: formattedDate,
      subject: newLogSubject,
      note: newLogNote.trim(),
      hours: parseFloat(newLogHours) || 1.0,
      icon: newLogSubject === 'Toán' ? '🧮' : newLogSubject === 'Tin Học' ? '💻' : newLogSubject === 'Ngữ Văn' ? '📖' : newLogSubject === 'Vật Lý' ? '⚡' : '📚',
      color: newLogSubject === 'Toán' ? 'text-blue-600 bg-blue-50' : newLogSubject === 'Tin Học' ? 'text-cyan-600 bg-cyan-50' : 'text-purple-600 bg-purple-50'
    };
    setStudyLogs(prev => [newEntry, ...prev]);
    setIsLogModalOpen(false);
    setNewLogNote('');
  };

  const handleDeleteStudyLog = (id: string) => {
    setStudyLogs(prev => prev.filter(l => l.id !== id));
  };

  const subjectAllocations = [
    { name: 'Toán', hours: 7.0, pct: 30, color: 'bg-blue-600', text: 'text-blue-600', icon: '🧮' },
    { name: 'Tin Học', hours: 5.0, pct: 22, color: 'bg-cyan-500', text: 'text-cyan-600', icon: '💻' },
    { name: 'Vật Lý', hours: 4.5, pct: 20, color: 'bg-purple-600', text: 'text-purple-600', icon: '⚡' },
    { name: 'Tiếng Anh', hours: 3.5, pct: 15, color: 'bg-teal-500', text: 'text-teal-600', icon: '🔤' },
    { name: 'Hóa Học', hours: 2.5, pct: 11, color: 'bg-rose-500', text: 'text-rose-600', icon: '🧪' },
    { name: 'Ngữ Văn', hours: 2.0, pct: 9, color: 'bg-amber-500', text: 'text-amber-600', icon: '📖' },
    { name: 'Sinh Học', hours: 1.5, pct: 7, color: 'bg-emerald-500', text: 'text-emerald-600', icon: '🧬' },
    { name: 'Lịch Sử', hours: 1.0, pct: 4, color: 'bg-red-500', text: 'text-red-600', icon: '🏛️' }
  ];

  const stackedDays7 = [
    { day: 'T5', totalHours: '3.5h', active: false, segments: [{ height: '35%', color: 'bg-emerald-500', label: 'Sinh Học: 1.5h' }, { height: '25%', color: 'bg-purple-600', label: 'Vật Lý: 2h' }] },
    { day: 'T6', totalHours: '4.5h', active: false, segments: [{ height: '40%', color: 'bg-purple-600', label: 'Vật Lý: 2.5h' }, { height: '35%', color: 'bg-cyan-500', label: 'Tin Học: 2h' }] },
    { day: 'T7', totalHours: '3.0h', active: false, segments: [{ height: '45%', color: 'bg-rose-500', label: 'Hóa Học: 3h' }] },
    { day: 'CN', totalHours: '4.0h', active: false, segments: [{ height: '38%', color: 'bg-blue-600', label: 'Toán: 2.5h' }, { height: '28%', color: 'bg-emerald-500', label: 'Sinh Học: 1.5h' }] },
    { day: 'T2', totalHours: '3.0h', active: false, segments: [{ height: '25%', color: 'bg-amber-500', label: 'Ngữ Văn: 1.5h' }, { height: '20%', color: 'bg-cyan-500', label: 'Tin Học: 1.5h' }] },
    { day: 'T3', totalHours: '3.5h', active: false, segments: [{ height: '32%', color: 'bg-cyan-500', label: 'Tin Học: 1.5h' }, { height: '22%', color: 'bg-blue-600', label: 'Toán: 2h' }] },
    { day: 'T4', totalHours: '1.5h', active: true, segments: [{ height: '15%', color: 'bg-blue-400', label: 'Toán: 1.5h' }] }
  ];

  const stackedDays14 = [
    { day: 'T5', totalHours: '0.5h', active: false, segments: [{ height: '8%', color: 'bg-blue-300', label: 'Tự học: 0.5h' }] },
    { day: 'T6', totalHours: '0.5h', active: false, segments: [{ height: '8%', color: 'bg-blue-300', label: 'Tự học: 0.5h' }] },
    { day: 'T7', totalHours: '0.5h', active: false, segments: [{ height: '8%', color: 'bg-blue-300', label: 'Tự học: 0.5h' }] },
    { day: 'CN', totalHours: '0.5h', active: false, segments: [{ height: '8%', color: 'bg-blue-300', label: 'Tự học: 0.5h' }] },
    { day: 'T2', totalHours: '0.5h', active: false, segments: [{ height: '8%', color: 'bg-blue-300', label: 'Tự học: 0.5h' }] },
    { day: 'T3', totalHours: '0.5h', active: false, segments: [{ height: '8%', color: 'bg-blue-300', label: 'Tự học: 0.5h' }] },
    { day: 'T4', totalHours: '3.5h', active: false, segments: [{ height: '30%', color: 'bg-blue-600', label: 'Toán: 2h' }, { height: '20%', color: 'bg-emerald-500', label: 'Sinh Học: 1.5h' }] },
    { day: 'T5', totalHours: '3.5h', active: false, segments: [{ height: '35%', color: 'bg-emerald-500', label: 'Sinh Học: 1.5h' }, { height: '25%', color: 'bg-purple-600', label: 'Vật Lý: 2h' }] },
    { day: 'T6', totalHours: '4.5h', active: false, segments: [{ height: '40%', color: 'bg-purple-600', label: 'Vật Lý: 2.5h' }, { height: '35%', color: 'bg-cyan-500', label: 'Tin Học: 2h' }] },
    { day: 'T7', totalHours: '3.0h', active: false, segments: [{ height: '45%', color: 'bg-rose-500', label: 'Hóa Học: 3h' }] },
    { day: 'CN', totalHours: '4.0h', active: false, segments: [{ height: '38%', color: 'bg-blue-600', label: 'Toán: 2.5h' }, { height: '28%', color: 'bg-emerald-500', label: 'Sinh Học: 1.5h' }] },
    { day: 'T2', totalHours: '3.0h', active: false, segments: [{ height: '25%', color: 'bg-amber-500', label: 'Ngữ Văn: 1.5h' }, { height: '20%', color: 'bg-cyan-500', label: 'Tin Học: 1.5h' }] },
    { day: 'T3', totalHours: '3.5h', active: false, segments: [{ height: '32%', color: 'bg-cyan-500', label: 'Tin Học: 1.5h' }, { height: '22%', color: 'bg-blue-600', label: 'Toán: 2h' }] },
    { day: 'T4', totalHours: '1.5h', active: true, segments: [{ height: '15%', color: 'bg-blue-400', label: 'Toán: 1.5h' }] }
  ];

  const currentStackedDays = useMemo(() => {
    return chartRange === '14' ? stackedDays14 : stackedDays7;
  }, [chartRange]);

  // GPA Goal State
  const [gpaGoal, setGpaGoal] = useState<number>(() => {
    const saved = localStorage.getItem('studyflow_gpa_goal');
    return saved ? parseFloat(saved) : 8.8;
  });

  useEffect(() => {
    localStorage.setItem('studyflow_gpa_goal', gpaGoal.toString());
  }, [gpaGoal]);

  // Subject Scores State (Editable)
  const defaultSubjects: SubjectScoreItem[] = [
    { name: 'Toán học', score: 8.5, target: 9.0, color: 'bg-purple-500' },
    { name: 'Vật lý', score: 8.2, target: 8.8, color: 'bg-indigo-500' },
    { name: 'Hóa học', score: 7.8, target: 8.5, color: 'bg-rose-500' },
    { name: 'Ngữ văn', score: 8.0, target: 8.5, color: 'bg-amber-500' },
    { name: 'Tiếng Anh', score: 9.2, target: 9.5, color: 'bg-teal-500' },
    { name: 'Sinh học', score: 8.8, target: 9.0, color: 'bg-emerald-500' },
    { name: 'Lịch sử', score: 8.0, target: 8.5, color: 'bg-red-500' },
    { name: 'Địa lí', score: 8.2, target: 8.8, color: 'bg-blue-500' },
    { name: 'GDCD', score: 8.7, target: 9.0, color: 'bg-orange-500' }
  ];

  const [subjects, setSubjects] = useState<SubjectScoreItem[]>(() => {
    try {
      const saved = localStorage.getItem('studyflow_subject_scores');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingNames = new Set(parsed.map(s => s.name.toLowerCase()));
          const merged = [...parsed];
          defaultSubjects.forEach(def => {
            const normDef = def.name.toLowerCase();
            const hasMatch = Array.from(existingNames).some(n => n.includes(normDef) || normDef.includes(n));
            if (!hasMatch) merged.push(def);
          });
          return merged;
        }
      }
    } catch {}
    return defaultSubjects;
  });

  useEffect(() => {
    localStorage.setItem('studyflow_subject_scores', JSON.stringify(subjects));
    window.dispatchEvent(new CustomEvent('studyflow_scores_updated', { detail: subjects }));
  }, [subjects]);

  const prioritySubjects = useMemo(() => {
    return [...subjects]
      .sort((a, b) => (b.target - b.score) - (a.target - a.score))
      .filter(s => s.target - s.score > 0.3)
      .slice(0, 3);
  }, [subjects]);

  const [isEditingScores, setIsEditingScores] = useState(false);
  const [editingSubjects, setEditingSubjects] = useState<SubjectScoreItem[]>(subjects);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekMonday = getMonday(today);

  // Weekly Mood & Psychological State (Synchronized with Dashboard)
  const [weeklyMoods, setWeeklyMoods] = useState<DayMoodData[]>(() => getWeeklyMoodLogs(currentWeekMonday));

  useEffect(() => {
    const handleSyncMood = () => {
      setWeeklyMoods(getWeeklyMoodLogs(currentWeekMonday));
    };
    window.addEventListener('storage', handleSyncMood);
    window.addEventListener('studyflow_weekly_mood_updated', handleSyncMood);
    return () => {
      window.removeEventListener('storage', handleSyncMood);
      window.removeEventListener('studyflow_weekly_mood_updated', handleSyncMood);
    };
  }, [currentWeekMonday]);

  // 7 days or 14 days of study time
  const daysCount = chartRange === '7' ? 7 : 14;
  const daysArray = Array.from({ length: daysCount }, (_, i) => addDays(currentWeekMonday, i - (daysCount === 14 ? 7 : 0)));
  const weekMinutes = daysArray.map((d) => (sessions?.[formatDate(d)] ?? 0) || (Math.floor(Math.random() * 45) + 30));

  const maxVal = Math.max(180, ...weekMinutes);
  const totalWeekMinutes = Math.round(weekMinutes.reduce((a, b) => a + b, 0));

  const chartData = useMemo(() => {
    if (!daysArray || daysArray.length === 0) return [];
    return daysArray.map((d, idx) => {
      const dateKey = formatDate(d);
      const mins = (sessions && sessions[dateKey] !== undefined) ? sessions[dateKey] : (weekMinutes[idx] || 0);
      const hours = Number((mins / 60).toFixed(1)) || 0;
      const dayOfWeekLabel = DOW_LABELS[((d.getDay() + 6) % 7)] || 'N/A';
      const formattedDate = `${d.getDate()}/${d.getMonth() + 1}`;
      return {
        name: chartRange === '7' ? dayOfWeekLabel : formattedDate,
        dayOfWeek: dayOfWeekLabel,
        fullDate: formattedDate,
        hours: hours,
        mins: mins
      };
    });
  }, [daysArray, sessions, weekMinutes, chartRange]);

  const tasksChartData = useMemo(() => {
    return daysArray.map((d) => {
      const dateKey = formatDate(d);
      const count = (tasks || []).filter(t => t.done && t.due === dateKey).length;
      return {
        name: chartRange === '7' ? DOW_LABELS[((d.getDay() + 6) % 7)] : `${d.getDate()}/${d.getMonth() + 1}`,
        completed: count,
        fullDate: `${d.getDate()}/${d.getMonth() + 1}`
      };
    });
  }, [daysArray, tasks, chartRange]);

  // Thống kê nhiệm vụ
  const completedTasks = (tasks || []).filter((t) => t.done).length;
  const totalTasks = (tasks || []).length;

  // Tự động nhận diện môn cần ưu tiên (Auto-identify priority subjects)
  const autoPrioritySubjects = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];
    return [...subjects]
      .map(s => ({
        ...s,
        gap: s.target - s.score,
        urgency: (s.target - s.score) * 1.5 + ((tasks || []).filter(t => !t.done && t.sub?.includes(s.name)).length * 0.5)
      }))
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 3);
  }, [subjects, tasks]);

  // Tính điểm trung bình (GPA) từ bảng điểm môn học
  const calculatedAvg = subjects.length > 0 
    ? (subjects.reduce((a, b) => a + b.score, 0) / subjects.length)
    : 8.58;

  const avgScore4 = (calculatedAvg / 10) * 4;

  const getClassification = (score: number) => {
    if (score >= 9) return 'Học sinh Xuất sắc';
    if (score >= 8) return 'Học sinh Giỏi';
    if (score >= 6.5) return 'Học sinh Khá';
    return 'Học sinh Trung bình';
  };

  const handleAiAnalyze = async (data?: SurveyData) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSuggestedEvents([]);
    
    const finalSurveyData = data || null;
    if (data) setSurveyData(data);

    try {
      const response = await fetch('/api/ai/analyze-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          events,
          studentProfile,
          gpaGoal,
          currentAvg: calculatedAvg,
          subjects,
          surveyData: finalSurveyData,
          currentDate: new Date().toISOString()
        })
      });
      const resData = await response.json();
      const reply = resData.reply || '';
      setAnalysisResult(reply);
      
      // Parse suggested events from AI response
      const jsonMatch = reply.match(/```json_calendar_events\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const evts = Array.isArray(parsed) ? parsed : (parsed.events || []);
          if (evts.length > 0) {
            setSuggestedEvents(evts);
          }
        } catch (e) {
          console.error('Lỗi parse JSON lịch:', e);
        }
      }

      setShowFullAnalysis(true);
      setShowSurvey(false);
      showToast('✨ Lộ trình học tập cá nhân hóa đã được AI khởi tạo thành công!', 'success');
    } catch (err) {
      console.error('Lỗi phân tích:', err);
      setAnalysisResult('Rất tiếc, đã có lỗi xảy ra trong quá trình phân tích. Bạn hãy thử lại sau nhé!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const syncToCalendar = () => {
    if (suggestedEvents.length === 0) return;
    window.dispatchEvent(new CustomEvent('studyflow_add_events', { detail: suggestedEvents }));
    showToast(`Đã đồng bộ ${suggestedEvents.length} sự kiện vào lịch của bạn!`, 'success');
  };

  const handleSaveScores = () => {
    setSubjects(editingSubjects);
    setIsEditingScores(false);
    showToast('Đã lưu bảng điểm môn học thành công!', 'success');
  };

  const handleExport = async () => {
    setIsExporting(true);
    showToast('Đang kết xuất báo cáo học tập PDF chuẩn A4...', 'info');

    try {
      const element = document.getElementById('studyflow-printable-report');
      if (!element) {
        throw new Error('Không tìm thấy mẫu tài liệu báo cáo');
      }

      // Small delay to ensure all DOM elements are painted
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('studyflow-printable-report');
          if (el) {
            el.style.display = 'block';
            el.style.position = 'static';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const totalPdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

      let heightLeft = totalPdfHeight;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages if report height exceeds standard single page
      while (heightLeft > 5) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
        heightLeft -= pdfHeight;
      }

      const rawName = studentProfile?.name || 'Hoc_Sinh';
      const cleanStudentName = rawName.trim().replace(/\s+/g, '_');
      const filename = `StudyFlow_Bao_Cao_${cleanStudentName}_${formatDate(new Date())}.pdf`;
      pdf.save(filename);

      showToast(`🎉 Đã xuất thành công: ${filename}`, 'success');
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      showToast('❌ Không thể xuất file PDF qua canvas. Đang mở hộp thoại in...', 'error');
      setTimeout(() => {
        window.print();
      }, 700);
    } finally {
      setIsExporting(false);
    }
  };

  const renderMarkdown = (content: string) => {
    const cleanContent = content.replace(/```json_calendar_events[\s\S]*?```/g, '').trim();
    return (
      <div className="space-y-3 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
        {cleanContent.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1" />;
          
          if (trimmed.startsWith('### ')) {
            return <h3 key={i} className="text-xs font-bold text-slate-900 dark:text-white pt-1">{trimmed.replace('### ', '')}</h3>;
          }
          if (trimmed.startsWith('## ')) {
            return <h2 key={i} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-2 border-b border-emerald-100 dark:border-emerald-900/50 pb-1">{trimmed.replace('## ', '')}</h2>;
          }
          if (trimmed.startsWith('# ')) {
            return <h1 key={i} className="text-base font-black text-slate-900 dark:text-white pt-2">{trimmed.replace('# ', '')}</h1>;
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={i} className="flex gap-1.5 pl-1">
                <span className="text-emerald-500 font-bold">•</span>
                <p>{trimmed.substring(2)}</p>
              </div>
            );
          }
          if (/^\d+\./.test(trimmed)) {
            return (
              <div key={i} className="flex gap-1.5 pl-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{trimmed.split('.')[0]}.</span>
                <p>{trimmed.substring(trimmed.indexOf('.') + 1).trim()}</p>
              </div>
            );
          }

          const parts = trimmed.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={i}>
              {parts.map((part, pi) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pi} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12 animate-in fade-in duration-300 text-xs relative" id="stats-export-container" ref={statsRef}>
      {/* Roadmap Survey Modal */}
      <StudySurveyModal 
        isOpen={showSurvey} 
        onClose={() => setShowSurvey(false)} 
        onSubmit={handleAiAnalyze} 
      />

      {/* Ambient floating glows */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-1/3 -right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl -z-10" />
      <div className="pointer-events-none absolute -bottom-10 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl -z-10" />

      {/* Header Section */}
      <div className="reports-card-glass rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-black/50 relative overflow-hidden">
        {/* Subtle accent glow line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600 opacity-90" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Activity className="w-6 h-6 drop-shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Báo Cáo Tiến Độ & Thống Kê Học Tập
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Theo dõi toàn diện thời gian tự học, điểm số GPA, tâm lý cảm xúc và nhận lộ trình tối ưu từ AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto">
            <button
              onClick={() => setShowSurvey(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-50/40 dark:hover:bg-slate-750 transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <BarChart2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Phân bổ & Cân bằng</span>
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-slate-750 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" /> : <Download className="w-4 h-4 text-indigo-500" />}
              <span>{isExporting ? 'Đang xuất...' : 'Xuất PDF'}</span>
            </button>
            
            <button
              onClick={() => handleAiAnalyze()}
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 drop-shadow-xs" />}
              <span>{isAnalyzing ? 'Đang phân tích...' : '✨ AI Phân tích Lộ trình'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FLAGSHIP HERO: MỤC TIÊU ĐIỂM SỐ & BẢNG TIẾN ĐỘ HỌC TẬP (GPA MASTER MATRIX) */}
      <div className="reports-card-glass rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-black/50 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <GraduationCap className="w-5 h-5 drop-shadow-xs" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Mục Tiêu Điểm Số & Xếp Loại Học Lực</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Bảng điểm trung bình tích lũy và mức độ đạt mục tiêu theo từng môn</p>
            </div>
          </div>


        </div>

        {/* GPA & Subject Matrix Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-center">
          {/* Left Column: Overall GPA Dial & Performance Summary */}
          <div className="lg:col-span-4 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/40 border border-indigo-200/70 dark:border-indigo-500/20 rounded-3xl p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                ĐIỂM TRUNG BÌNH TÍCH LŨY (GPA)
              </span>
              <div className="flex items-baseline justify-center gap-1 pt-1">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 font-mono tracking-tight">
                  {calculatedAvg.toFixed(2)}
                </span>
                <span className="text-base text-slate-400 font-bold font-mono">/ 10.0</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
                Quy đổi hệ 4.0: <span className="text-indigo-600 dark:text-indigo-400 font-black">{avgScore4.toFixed(2)}</span>
              </p>
            </div>

            {/* Academic Classification Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-xs shadow-xs">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>{getClassification(calculatedAvg)}</span>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Mục tiêu: {gpaGoal.toFixed(1)}/10</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black">
                  {Math.min(100, Math.round((calculatedAvg / gpaGoal) * 100))}% đạt được
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-700 shadow-xs"
                  style={{ width: `${Math.min(100, (calculatedAvg / gpaGoal) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Quick Subject Score Matrix */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((sub) => {
              const pct = Math.min(100, Math.round((sub.score / sub.target) * 100));
              const isAhead = sub.score >= sub.target;
              return (
                <div 
                  key={sub.name}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[110px]">
                      {sub.name}
                    </span>
                    <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                      {sub.score.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ {sub.target.toFixed(1)}</span>
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAhead ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className={isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                      {isAhead ? '✓ Đạt mục tiêu' : `Còn ${(sub.target - sub.score).toFixed(1)}đ`}
                    </span>
                    <span className="font-mono text-slate-500">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Analysis Report Card - Compact */}
      {analysisResult && (
        <div className="reports-card-glass rounded-3xl overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-black/50 border border-emerald-500/30">
          <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/10 p-3.5 px-5 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Báo cáo Lộ trình Tối ưu từ AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              {suggestedEvents.length > 0 && (
                <button
                  onClick={syncToCalendar}
                  className="text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 rounded-xl hover:brightness-110 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  Đồng bộ Lịch ({suggestedEvents.length})
                </button>
              )}
              <button
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {showFullAnalysis ? 'Thu gọn' : 'Mở rộng'}
              </button>
            </div>
          </div>
          <div className={`p-5 ${showFullAnalysis ? '' : 'max-h-[140px] overflow-hidden relative'}`}>
            {renderMarkdown(analysisResult)}
            {!showFullAnalysis && (
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#0b1426] to-transparent flex items-end justify-center pb-2">
                <button 
                  onClick={() => setShowFullAnalysis(true)} 
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-md cursor-pointer hover:bg-slate-50"
                >
                  Xem toàn bộ lộ trình
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Priority Subjects Banner */}
      {autoPrioritySubjects.length > 0 && (
        <div className="reports-card-glass bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/20 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/10 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <Zap className="w-6 h-6 fill-white drop-shadow-xs" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                ✨ Môn Cần Ưu Tiên Bứt Phá (Hệ thống AI Tự Nhận Diện)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các môn học có khoảng cách lớn nhất so với mục tiêu đặt ra, cần tập trung làm bài tập & ôn tập thêm:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {autoPrioritySubjects.map(s => (
                  <span key={s.name} className="px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-800/90 text-xs font-black text-slate-800 dark:text-slate-200 border border-amber-500/30 shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{s.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">(Cách mục tiêu {s.gap.toFixed(1)}đ)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowSurvey(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black transition active:scale-95 shadow-lg shadow-orange-500/25 whitespace-nowrap cursor-pointer shrink-0"
          >
            Lên Lộ Trình Ôn Tập →
          </button>
        </div>
      )}

      {/* THỐNG KÊ CHI TIẾT (Reorganized Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Biểu đồ thời gian tự học (Bar Chart) */}
        <div className="reports-card-glass rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Clock className="w-5 h-5 drop-shadow-xs" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Thời gian tự học</h2>
                <p className="text-xs text-slate-400">Số giờ ghi nhận trong {chartRange} ngày qua</p>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <button 
                onClick={() => setChartRange('7')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartRange === '7' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                7 Ngày
              </button>
              <button 
                onClick={() => setChartRange('14')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartRange === '14' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                14 Ngày
              </button>
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="barGradNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} unit="h" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-2xl text-xs border border-slate-700/80 space-y-0.5">
                          <p className="font-black text-emerald-400">{data.dayOfWeek} ({data.fullDate})</p>
                          <p className="font-black text-sm text-white font-mono">{data.hours} giờ <span className="text-xs text-slate-400 font-normal">({data.mins} phút)</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} animationDuration={800}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.hours >= 2.0 ? 'url(#barGradHigh)' : 'url(#barGradNormal)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ số lượng bài tập hoàn thành (Line Chart) */}
        <div className="reports-card-glass rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <CheckCircle className="w-5 h-5 drop-shadow-xs" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Tiến độ bài tập</h2>
                <p className="text-xs text-slate-400">Số lượng nhiệm vụ đã hoàn thành ({chartRange} ngày)</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs border border-indigo-200 dark:border-indigo-800">
              {completedTasks}/{totalTasks} đã xong
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tasksChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-2xl text-xs border border-slate-700/80 space-y-0.5">
                          <p className="font-bold text-indigo-300">{payload[0].payload.fullDate}</p>
                          <p className="font-black text-sm text-white font-mono">Đã xong: {payload[0].value} bài tập</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="url(#lineGlow)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Đánh Giá Tâm Lý Học Tập & Sức Khỏe Tinh Thần Tích Lũy */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                <Brain className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Đánh Giá Tâm Lý Học Tập & Sức Khỏe Tinh Thần Tích Lũy
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1">
              Phân tích tương quan giữa khối lượng học tập, hạn chót deadline và cảm xúc từng ngày
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800">
              😄 {Math.round((weeklyMoods.filter(m => m.score >= 4).length / 7) * 100)}% Tích cực
            </span>
            <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-xs border border-amber-200 dark:border-amber-800">
              😰 {Math.round((weeklyMoods.filter(m => m.score <= 2).length / 7) * 100)}% Căng thẳng
            </span>
          </div>
        </div>

        {/* 3 Psychological Wellness Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                Điểm Sức Khỏe Tinh Thần
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {Math.round((weeklyMoods.reduce((a, b) => a + b.score, 0) / (7 * 5)) * 100)}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                Ổn định, giữ vững năng lượng tích cực
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <Heart className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                Mức Độ Áp Lực & Căng Thẳng
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {Math.round((weeklyMoods.filter(m => m.score <= 2).length / 7) * 100)}%
                </span>
                <span className="text-xs text-slate-400 font-bold">(Mức thấp)</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                Kiểm soát tốt trước các đợt deadline
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/60 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                Nguy Cơ Kiệt Sức (Burnout Risk)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  Thấp (An toàn)
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                Nhịp học Pomodoro cân đối với giải lao
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Weekly Emotion & Energy Progression Recharts Chart */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-600" />
              Biểu đồ Diễn Biến Cảm Xúc & Mức Năng Lượng 7 Ngày
            </span>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Điểm Cảm xúc (1-5)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-300">Năng lượng học (1-5)</span>
              </span>
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyMoods.map(m => ({
                  name: m.dayName,
                  fullDay: m.dayLabel,
                  emoji: m.emoji,
                  label: m.label,
                  score: m.score,
                  energy: m.energyLevel || 3,
                  note: m.note
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-black text-amber-300 flex items-center gap-1.5">
                            <span>{data.emoji}</span>
                            <span>{data.fullDay} • {data.label}</span>
                          </p>
                          <p className="text-[11px] text-slate-300">
                            Điểm cảm xúc: <strong className="text-white font-bold">{data.score}/5</strong>
                          </p>
                          <p className="text-[11px] text-slate-300">
                            Năng lượng: <strong className="text-white font-bold">{data.energy}/5 sao</strong>
                          </p>
                          {data.note && (
                            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                              "{data.note}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#emotionGradient)" />
                <Area type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#energyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Mood Tiles Row */}
        <div className="grid grid-cols-7 gap-2">
          {weeklyMoods.map((day) => {
            const mCfg = MOOD_LEVELS[day.mood];
            return (
              <div 
                key={day.dayName} 
                className={`p-2.5 rounded-2xl border text-center transition-all ${mCfg.bg} space-y-1 shadow-xs`}
              >
                <span className="text-[9px] font-black text-slate-400 uppercase block">{day.dayName}</span>
                <span className="text-2xl block my-0.5">{day.emoji}</span>
                <span className="text-[10px] font-bold block truncate text-slate-800 dark:text-slate-200">{day.label}</span>
                <div className="text-[8px] text-amber-500 font-black">
                  {day.energyLevel || 3}★
                </div>
              </div>
            );
          })}
        </div>

        {/* Academic Workload & Psychological Correlation Insight */}
        <div className="bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider text-[11px]">
              Phân Tích Tương Quan Tâm Lý & Tải Lượng Học Tập:
            </span>
          </div>
          <p className="text-xs">
            Dữ liệu tích lũy ghi nhận năng lượng học tập đạt đỉnh vào Thứ Hai và Thứ Ba. Vào các ngày có nhiều bài tập sắp đến hạn (như Thứ Năm và Thứ Sáu), tâm lý có xu hướng căng thẳng hơn. Khuyến nghị bạn duy trì các quãng nghỉ Pomodoro 5 phút và áp dụng kỹ thuật hít thở để tái tạo năng lượng.
          </p>
        </div>
      </div>

      {/* SECTION: BIỂU ĐỒ THỜI GIAN TỰ HỌC & PHÂN BỔ THỜI GIAN THEO MÔN (Image 1 & Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
        {/* Left Column (8 cols on lg): Biểu đồ thời gian tự học & Nhật ký giờ học */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Biểu đồ thời gian tự học
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Số giờ học ghi nhận qua đồng hồ hẹn giờ và nhật ký
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <button 
                    onClick={() => setChartRange('7')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${chartRange === '7' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    7 ngày qua
                  </button>
                  <button 
                    onClick={() => setChartRange('14')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${chartRange === '14' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    14 ngày qua
                  </button>
                </div>

                <button 
                  onClick={() => setIsLogModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black rounded-2xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ghi giờ học</span>
                </button>
              </div>
            </div>

            {/* Stacked Capsule Bar Chart */}
            <div className="relative pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className={`grid gap-2 sm:gap-3 items-end h-56 px-1 ${
                chartRange === '14' ? 'grid-cols-14' : 'grid-cols-7'
              }`}>
                {currentStackedDays.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                    {/* Hover Floating Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-2xl shadow-xl whitespace-nowrap border border-slate-700/80 space-y-1 text-center">
                        <p className="text-blue-400 font-black text-xs flex items-center justify-center gap-1">
                          <span>{d.day}</span>
                          <span>•</span>
                          <span className="text-white">{d.totalHours}</span>
                        </p>
                        <div className="space-y-0.5 pt-1 border-t border-slate-800">
                          {d.segments.map((s, idx) => (
                            <p key={idx} className="text-[10px] text-slate-300 font-medium">
                              {s.label}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-1" />
                    </div>

                    {/* Capsule Bar Container */}
                    <div className={`w-full ${
                      chartRange === '14' ? 'max-w-[28px] sm:max-w-[34px]' : 'max-w-[46px] sm:max-w-[54px]'
                    } h-full bg-slate-100/90 dark:bg-slate-800/60 rounded-full p-1 border border-slate-200/60 dark:border-slate-700/50 shadow-inner flex flex-col justify-end relative overflow-hidden transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-md ${
                      d.active ? 'ring-2 ring-blue-500/90 shadow-md shadow-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 border-blue-400' : ''
                    }`}>
                      {d.segments.map((seg, sIdx) => (
                        <div 
                          key={sIdx}
                          className={`w-full ${seg.color} rounded-xl transition-all duration-500 my-0.5 shadow-xs`}
                          style={{ height: seg.height }}
                        />
                      ))}
                      {/* Base accent pill for empty/low days */}
                      {d.segments.length === 1 && d.segments[0].height.includes('8') && (
                        <div className="w-full h-3 bg-blue-300/50 dark:bg-blue-900/50 rounded-full my-0.5" />
                      )}
                    </div>

                    {/* Day Label */}
                    <span className={`text-[11px] font-extrabold tracking-tight ${
                      d.active 
                        ? 'text-blue-600 dark:text-blue-400 font-black scale-110' 
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Study Log Section */}
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                NHẬT KÝ GIỜ HỌC GẦN ĐÂY
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {studyLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 shrink-0">
                        {log.icon}
                      </span>
                      <div className="truncate text-xs">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {log.date} • Môn {log.subject}
                        </span>
                        {log.note && (
                          <span className="text-slate-400 font-medium ml-1.5">
                            ({log.note})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold text-xs border border-blue-100 dark:border-blue-900/40">
                        {log.hours} giờ
                      </span>
                      <button 
                        onClick={() => handleDeleteStudyLog(log.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Xóa nhật ký"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols on lg): Phân bổ thời gian theo môn & Gợi ý học tập */}
        <div className="lg:col-span-4 space-y-5">
          {/* Top Card: Phân bổ thời gian theo môn */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Phân bổ thời gian theo môn
            </h3>

            <div className="space-y-3.5">
              {subjectAllocations.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      {item.hours.toFixed(1)}h <span className="text-slate-400 font-normal">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Card: Gợi ý học tập thông minh */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black uppercase tracking-wider text-[11px]">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Gợi ý học tập thông minh</span>
            </div>

            <div className="space-y-2.5 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              <p>
                • <strong className="font-bold text-slate-900 dark:text-white">Tất cả các môn đều đang đạt kết quả tốt trên 7.5!</strong> Bạn duy trì thói quen học tập rất đều đặn. Hãy tiếp tục ôn tập trước các kỳ thi lớn.
              </p>
              <p>
                • <strong className="font-bold text-slate-900 dark:text-white">Mẹo quản lý năng lượng:</strong> Hãy chia nhỏ bài luận dài thành danh sách subtasks 15–20 phút để giảm cảm giác quá tải khi deadline đến gần.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal "+ Ghi giờ học" */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Ghi nhận giờ tự học
              </h3>
              <button onClick={() => setIsLogModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Môn học</label>
                <select 
                  value={newLogSubject}
                  onChange={(e) => setNewLogSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="Toán">🧮 Toán</option>
                  <option value="Tin Học">💻 Tin Học</option>
                  <option value="Ngữ Văn">📖 Ngữ Văn</option>
                  <option value="Vật Lý">⚡ Vật Lý</option>
                  <option value="Tiếng Anh">🔤 Tiếng Anh</option>
                  <option value="Hóa Học">🧪 Hóa Học</option>
                  <option value="Sinh Học">🧬 Sinh Học</option>
                  <option value="Lịch Sử">🏛️ Lịch Sử</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Số giờ tự học</label>
                <input 
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={newLogHours}
                  onChange={(e) => setNewLogHours(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nội dung ôn tập / Ghi chú</label>
                <input 
                  type="text"
                  value={newLogNote}
                  onChange={(e) => setNewLogNote(e.target.value)}
                  placeholder="VD: Ôn tập công thức đạo hàm, giải đề..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddStudyLog}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Lưu nhật ký
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HIDDEN / DEDICATED A4 PRINTABLE REPORT CONTAINER (100% standard inline HEX/RGB styles for infallible HTML2Canvas & jsPDF export) */}
      <div 
        id="studyflow-printable-report"
        ref={printableReportRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '800px',
          minHeight: '1120px',
          zIndex: -9999,
          opacity: 0,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '36px 40px',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', backgroundColor: '#2563eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '20px' }}>
              SF
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '-0.5px' }}>
                STUDYFLOW ACADEMIC PERFORMANCE
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                Hệ Thống Quản Lý Tiến Độ & Tối Ưu Kết Quả Học Tập Cá Nhân Hóa
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
              MÃ BÁO CÁO: <span style={{ color: '#2563eb', fontFamily: 'monospace' }}>SF-REP-2026</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              NGÀY XUẤT: {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Báo Cáo Tiến Độ & Kết Quả Học Tập Toàn Diện
          </h1>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0, fontWeight: '500' }}>
            Học Kỳ I - Năm Học 2025 - 2026 • Tổng hợp điểm số, thời gian học tập & phân tích tâm lý AI
          </p>
        </div>

        {/* Student Profile Metadata Box */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px', marginBottom: '22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Họ Và Tên</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>{studentProfile?.name || 'Nguyễn Hoàng Nam'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Lớp / Khối</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>{studentProfile?.className || 'Lớp 11 Tin'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Trường Học</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>{studentProfile?.schoolName || 'THPT Chuyên Hà Nội - Amsterdam'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Niên Khóa</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#2563eb', marginTop: '3px' }}>2025 - 2026 (Kỳ 1)</div>
            </div>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#1d4ed8' }}>GPA Hệ 10</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#1e40af', margin: '4px 0 2px 0' }}>{calculatedAvg.toFixed(2)}</div>
            <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 'bold' }}>Thang điểm 10.0</div>
          </div>
          <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#6d28d9' }}>GPA Hệ 4.0</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#5b21b6', margin: '4px 0 2px 0' }}>{avgScore4.toFixed(2)}</div>
            <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold' }}>Quy đổi quốc tế</div>
          </div>
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#047857' }}>Xếp Loại Học Lực</div>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#065f46', margin: '10px 0 4px 0' }}>{getClassification(calculatedAvg)}</div>
            <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 'bold' }}>Đạt chuẩn chất lượng</div>
          </div>
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#b45309' }}>Mục Tiêu GPA</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#92400e', margin: '4px 0 2px 0' }}>{gpaGoal.toFixed(2)}</div>
            <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold' }}>Tiến độ: {Math.min(100, Math.round((calculatedAvg / gpaGoal) * 100))}%</div>
          </div>
        </div>

        {/* Detailed 9-Subject Score Table */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              1. Bảng Điểm Chi Tiết Từng Môn Học
            </h3>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Cập nhật theo cơ sở dữ liệu học tập</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', fontWeight: '800', color: '#334155', width: '36px' }}>STT</th>
                <th style={{ padding: '8px 12px', fontWeight: '800', color: '#334155' }}>Tên Môn Học</th>
                <th style={{ padding: '8px 12px', fontWeight: '800', color: '#334155', textAlign: 'center' }}>Điểm Hiện Tại</th>
                <th style={{ padding: '8px 12px', fontWeight: '800', color: '#334155', textAlign: 'center' }}>Mục Tiêu</th>
                <th style={{ padding: '8px 12px', fontWeight: '800', color: '#334155', textAlign: 'center' }}>Chênh Lệch</th>
                <th style={{ padding: '8px 12px', fontWeight: '800', color: '#334155', width: '140px' }}>Tiến Độ Đạt</th>
                <th style={{ padding: '8px 12px', fontWeight: '800', color: '#334155', textAlign: 'center' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, idx) => {
                const diff = (s.score - s.target).toFixed(1);
                const isPassed = s.score >= s.target;
                const pct = Math.min(100, Math.round((s.score / s.target) * 100));
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '7px 12px', color: '#64748b', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ padding: '7px 12px', fontWeight: '800', color: '#0f172a' }}>{s.name}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: '900', color: '#2563eb' }}>{s.score.toFixed(1)}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{s.target.toFixed(1)}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 'bold', color: Number(diff) >= 0 ? '#10b981' : '#f59e0b' }}>
                      {Number(diff) > 0 ? `+${diff}` : diff}
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: isPassed ? '#10b981' : '#3b82f6', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', width: '28px' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '9px',
                        fontWeight: '800',
                        backgroundColor: isPassed ? '#dcfce7' : '#fef3c7',
                        color: isPassed ? '#15803d' : '#b45309'
                      }}>
                        {isPassed ? 'Đạt' : 'Cần nỗ lực'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Study Analytics & Mental Health (2 Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '22px' }}>
          {/* Column A: Study Time */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              2. Hoạt Động & Thời Gian Tự Học
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>TỔNG GIỜ HỌC</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#2563eb', marginTop: '3px' }}>
                  {(weekMinutes.reduce((a, b) => a + b, 0) / 60).toFixed(1)}h
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>NHIỆM VỤ</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981', marginTop: '3px' }}>
                  {tasks.filter(t => t.done).length}/{tasks.length}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>BÀI THI ĐÃ NỘP</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#7c3aed', marginTop: '3px' }}>
                  {submissions.length} bài
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
              • Phân bổ cao điểm tập trung vào môn: <strong>Toán, Tin Học & Vật Lý</strong>.<br />
              • Tỷ lệ hoàn thành kế hoạch ôn tập tuần đạt <strong>{tasks.length > 0 ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 100}%</strong>.
            </div>
          </div>

          {/* Column B: Mental Health & Psychology */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              3. Sức Khỏe Tinh Thần & Cân Bằng Cảm Xúc
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>CHỈ SỐ SỨC KHỎE</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669', marginTop: '3px' }}>
                  {Math.round((weeklyMoods.reduce((a, b) => a + b.score, 0) / (7 * 5)) * 100)}/100
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>TÍCH CỰC</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981', marginTop: '3px' }}>
                  {Math.round((weeklyMoods.filter(m => m.score >= 4).length / 7) * 100)}%
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>CĂNG THẲNG</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#d97706', marginTop: '3px' }}>
                  {Math.round((weeklyMoods.filter(m => m.score <= 2).length / 7) * 100)}%
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
              • Năng lượng học tập duy trì ổn định, đạt trạng thái tập trung tốt nhất vào đầu tuần.<br />
              • Khuyến nghị áp dụng phương pháp nghỉ giải lao ngắn (Pomodoro) để tái tạo tinh thần.
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px 20px', marginBottom: '26px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#1e3a8a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
            ✨ Khuyến Nghị Lộ Trình Tối Ưu Từ Trợ Lý AI StudyFlow
          </h3>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
            {autoPrioritySubjects.length > 0 ? (
              <div>
                1. <strong>Tập trung môn ưu tiên:</strong> Ưu tiên cải thiện điểm số môn <strong>{autoPrioritySubjects.map(s => s.name).join(', ')}</strong> thông qua tăng cường giải bài tập tự luyện và kiểm tra thử 30 phút mỗi tuần.<br />
                2. <strong>Tối ưu hóa thời gian:</strong> Duy trì phiên học tập trung liên tục 45 phút, kết hợp 10 phút vận động nhẹ hoặc thư giãn.<br />
                3. <strong>Bám sát mục tiêu:</strong> Tiến độ đạt mục tiêu hiện tại là <strong>{Math.min(100, Math.round((calculatedAvg / gpaGoal) * 100))}%</strong>. Chỉ cần tăng điểm môn Hóa học và Vật lý là sẽ hoàn thành xuất sắc mục tiêu GPA học kỳ!
              </div>
            ) : (
              <div>
                Học sinh đang duy trì thành tích học tập rất tốt trên mọi bộ môn. Hãy tiếp tục giữ vững nhịp độ ôn tập và cân bằng thể chất lành mạnh.
              </div>
            )}
          </div>
        </div>

        {/* Signatures & Certification Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', fontSize: '11px' }}>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Xác Nhận Của Học Sinh</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: '48px' }} />
            <div style={{ fontWeight: '800', color: '#0f172a' }}>{studentProfile?.name || 'Nguyễn Hoàng Nam'}</div>
          </div>

          <div style={{ textAlign: 'center', width: '260px' }}>
            <div style={{ fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Xác Thực Hệ Thống StudyFlow AI</div>
            <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>✓ Đã Kiểm Tra & Chứng Thực Điện Tử</div>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ border: '2px solid #2563eb', padding: '3px 12px', borderRadius: '6px', color: '#2563eb', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                STUDYFLOW VERIFIED
              </span>
            </div>
            <div style={{ fontWeight: '700', color: '#64748b', fontSize: '10px' }}>StudyFlow Academic System v2.5</div>
          </div>
        </div>
      </div>

      {/* FLOATING EXPORT STATUS TOAST */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-slate-700/60 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 text-xs font-bold">
          {exportToast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {exportToast.type === 'info' && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />}
          {exportToast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{exportToast.message}</span>
          {exportToast.type === 'success' && !isPdfModalOpen && (
            <button 
              onClick={() => setIsPdfModalOpen(true)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black cursor-pointer shadow-xs active:scale-95"
            >
              Xem trước
            </button>
          )}
          <button onClick={() => setExportToast(null)} className="ml-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PDF PREVIEW & PRINT MODAL */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-850/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <FileText className="w-5 h-5 drop-shadow-xs" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Xem Trước Báo Cáo Học Tập (Bản In PDF A4)</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Chuẩn A4
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Bản báo cáo tiến độ học kỳ hoàn chỉnh, sẵn sàng xuất file PDF hoặc in ấn trực tiếp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{isExporting ? 'Đang tạo...' : 'Tải File PDF'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="In tài liệu trực tiếp"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span className="hidden sm:inline">In ngay</span>
                </button>

                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable A4 Document Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 max-w-[760px] w-full text-slate-900 text-xs">
                {/* Header in Preview */}
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">SF</div>
                    <div>
                      <div className="font-black text-blue-900 text-sm tracking-tight">STUDYFLOW ACADEMIC PERFORMANCE</div>
                      <div className="text-[10px] text-slate-500">Hệ Thống Quản Lý & Tối Ưu Học Tập Cá Nhân Hóa</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-bold">
                    MÃ: <span className="text-blue-600 font-mono">SF-REP-2026</span><br />
                    NGÀY: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="text-center my-3">
                  <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">Báo Cáo Tiến Độ & Kết Quả Học Tập Toàn Diện</h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Học Kỳ I - Năm Học 2025 - 2026</p>
                </div>

                {/* Profile Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Họ và tên</span><strong className="text-slate-900">{studentProfile?.name || 'Nguyễn Hoàng Nam'}</strong></div>
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Lớp / Khối</span><strong className="text-slate-900">{studentProfile?.className || 'Lớp 11 Tin'}</strong></div>
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Trường học</span><strong className="text-slate-900">{studentProfile?.schoolName || 'THPT Chuyên Hà Nội - Amsterdam'}</strong></div>
                  <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Niên khóa</span><strong className="text-blue-600">2025 - 2026 (Kỳ 1)</strong></div>
                </div>

                {/* 4 KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-black uppercase text-blue-700">GPA Hệ 10</span>
                    <div className="text-xl font-black text-blue-800 my-0.5">{calculatedAvg.toFixed(2)}</div>
                    <span className="text-[9px] text-blue-600 font-bold">/ 10.0</span>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-black uppercase text-purple-700">GPA Hệ 4.0</span>
                    <div className="text-xl font-black text-purple-800 my-0.5">{avgScore4.toFixed(2)}</div>
                    <span className="text-[9px] text-purple-600 font-bold">Quy đổi</span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-black uppercase text-emerald-700">Xếp Loại</span>
                    <div className="text-xs font-black text-emerald-800 my-1.5">{getClassification(calculatedAvg)}</div>
                    <span className="text-[9px] text-emerald-600 font-bold">Đạt chuẩn</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-black uppercase text-amber-700">Mục Tiêu GPA</span>
                    <div className="text-xl font-black text-amber-800 my-0.5">{gpaGoal.toFixed(2)}</div>
                    <span className="text-[9px] text-amber-600 font-bold">Tiến độ: {Math.min(100, Math.round((calculatedAvg / gpaGoal) * 100))}%</span>
                  </div>
                </div>

                {/* Subject Scores Preview Table */}
                <div className="my-3">
                  <div className="text-[11px] font-black uppercase text-slate-800 mb-1.5">Bảng Điểm Môn Học</div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2">STT</th>
                          <th className="p-2">Môn Học</th>
                          <th className="p-2 text-center">Điểm Hiện Tại</th>
                          <th className="p-2 text-center">Mục Tiêu</th>
                          <th className="p-2 text-center">Độ Lệch</th>
                          <th className="p-2 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((s, i) => (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="p-2 text-slate-500">{i + 1}</td>
                            <td className="p-2 font-bold text-slate-800">{s.name}</td>
                            <td className="p-2 text-center font-black text-blue-600">{s.score.toFixed(1)}</td>
                            <td className="p-2 text-center text-slate-500">{s.target.toFixed(1)}</td>
                            <td className={`p-2 text-center font-bold ${s.score >= s.target ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {(s.score - s.target).toFixed(1)}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.score >= s.target ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {s.score >= s.target ? 'Đạt' : 'Cần cố gắng'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Advice Summary */}
                <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3 my-3 text-[10px] leading-relaxed">
                  <div className="font-black text-indigo-900 mb-1 uppercase">Khuyến Nghị Lộ Trình AI:</div>
                  <p className="text-slate-700">
                    Học sinh có thế mạnh nổi bật ở các môn khoa học tự nhiên. Để chạm mốc GPA mục tiêu {gpaGoal.toFixed(2)}, hãy tập trung bổ sung 30 phút luyện đề nâng cao mỗi tuần cho các môn {autoPrioritySubjects.map(s => s.name).join(', ')}.
                  </p>
                </div>

                {/* Footer seal */}
                <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200 text-[9px] text-slate-500 mt-4">
                  <span>Học sinh: <strong>{studentProfile?.name || 'Nguyễn Hoàng Nam'}</strong></span>
                  <span className="font-bold text-blue-600 border border-blue-400 px-2 py-0.5 rounded">STUDYFLOW VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
