import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  Play, 
  MapPin, 
  CalendarDays, 
  Hourglass, 
  FileText, 
  ExternalLink, 
  Smile, 
  Target, 
  Sparkles, 
  Award, 
  Check, 
  Lock, 
  Flame, 
  Crown, 
  RotateCcw, 
  Plus, 
  Compass, 
  Trophy, 
  X, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft,
  Bot, 
  LayoutDashboard, 
  Users, 
  Video, 
  Mic, 
  MessageSquare, 
  Copy, 
  Settings2, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Heart,
  Snowflake,
  BookOpen,
  GraduationCap,
  BarChart3
} from 'lucide-react';
import { CalendarEvent, TaskItem, LibraryItem, DayFocusSession, UserRole, ViewTab, CountdownItem, MoodLogEntry, MoodType, StudyGoal, GoalMilestone, StudentProfile, ExamSubmission } from '../types';
import { formatDate, formatHours, pad, DOW_FULL_LABELS, EVENT_TYPE_MAP, getMonday } from '../data/initialData';
import { GroupStudyModal } from './GroupStudyModal';
import { getWeeklyMoodLogs, saveDayMood, DayMoodData, MOOD_LEVELS } from '../utils/studyBalanceUtils';
import { GameQuestMap } from './GameQuestMap';
import { Avatar } from './Avatar';
import { StudySurveyModal, SurveyData } from './StudySurveyModal';
import { Zap } from 'lucide-react';

interface OverviewViewProps {
  events: CalendarEvent[];
  tasks: TaskItem[];
  library: LibraryItem[];
  sessions: DayFocusSession;
  countdowns: CountdownItem[];
  role: UserRole;
  onNavigate: (tab: ViewTab) => void;
  onToggleTask: (taskId: number) => void;
  moodLogs?: MoodLogEntry[];
  onAddMoodLog?: (entry: Omit<MoodLogEntry, 'id'>) => void;
  searchQuery?: string;
  studentProfile?: StudentProfile;
  submissions?: ExamSubmission[];
}

const DEFAULT_STUDY_GOALS: StudyGoal[] = [
  {
    id: 'g1',
    title: 'Hoàn thành chương trình Toán 11',
    subject: 'Toán học',
    createdAt: new Date().toISOString(),
    milestones: [
      { id: 'm0', title: 'Khởi đầu: Củng cố nền tảng', description: 'Chuẩn bị sách giáo khoa và tài liệu ôn tập Toán 11', status: 'completed', rewardBadge: '🌱 Khởi đầu', rewardPoints: 50 },
      { id: 'm1', title: 'Mốc 1: Hoàn thành lượng giác', description: 'Nắm chắc công thức biến đổi tích thành tổng và phương trình lượng giác cơ bản', status: 'completed', rewardBadge: '📐 Bậc thầy Lượng giác', rewardPoints: 100 },
      { id: 'm2', title: 'Mốc 2: Hoàn thành dãy số', description: 'Làm chủ cấp số cộng và cấp số nhân trong các bài toán thực tế', status: 'completed', rewardBadge: '🔢 Chuyên gia Dãy số', rewardPoints: 150 },
      { id: 'm3', title: 'Mốc 3: Hoàn thành giới hạn', description: 'Tính thành thạo giới hạn dãy số, giới hạn hàm số và tính liên tục', status: 'completed', rewardBadge: '📈 Bậc thầy Giới hạn', rewardPoints: 200 },
      { id: 'm4', title: 'Mốc 4: Kiểm tra tổng hợp', description: 'Đạt từ 8.5 điểm trở lên trong bài thi khảo sát tổng hợp toàn bộ chương trình', status: 'in_progress', rewardBadge: '👑 Quán quân Toán 11', rewardPoints: 300 }
    ]
  },
  {
    id: 'g2',
    title: 'Chinh phục 8.5+ Tiếng Anh THPT',
    subject: 'Tiếng Anh',
    createdAt: new Date().toISOString(),
    milestones: [
      { id: 'e1', title: 'Mốc 1: 1000 Từ vựng trọng tâm', description: 'Luyện 1000 từ vựng theo chủ đề SGK GDPT 2018', status: 'completed', rewardBadge: '🔤 Thần từ vựng', rewardPoints: 100 },
      { id: 'e2', title: 'Mốc 2: 12 Thì & Ngữ pháp nâng cao', description: 'Thành thạo câu điều kiện, câu bị động và mệnh đề quan hệ', status: 'in_progress', rewardBadge: '✍️ Bậc thầy Ngữ pháp', rewardPoints: 150 },
      { id: 'e3', title: 'Mốc 3: Luyện 20 đề thi thử', description: 'Giải trọn vẹn 20 đề thi mẫu đúng thời gian quy định', status: 'locked', rewardBadge: '🏆 Thợ săn điểm 9+', rewardPoints: 250 }
    ]
  }
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  events,
  tasks,
  library,
  sessions,
  countdowns,
  role,
  onNavigate,
  onToggleTask,
  moodLogs = [],
  onAddMoodLog,
  searchQuery = '',
  studentProfile,
  submissions = []
}) => {
  const [isGroupStudyOpen, setIsGroupStudyOpen] = useState(false);
  const isTeacher = role === 'teacher';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);
  const todayDow = (today.getDay() + 6) % 7;

  // Filters & Calculations
  const todayEvents = useMemo(() => (events || []).filter((e) => e && e.date === todayStr).sort((a, b) => (a.h || 0) - (b.h || 0)), [events, todayStr]);
  const openTasks = useMemo(() => (tasks || []).filter((t) => t && !t.done).sort((a, b) => (a.due || '').localeCompare(b.due || '')), [tasks]);
  
  const filteredEvents = useMemo(() => {
    if (!searchQuery?.trim()) return todayEvents;
    const q = searchQuery.toLowerCase();
    return todayEvents.filter((e) => e && (e.t?.toLowerCase().includes(q) || (e.room || '').toLowerCase().includes(q)));
  }, [todayEvents, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery?.trim()) return openTasks;
    const q = searchQuery.toLowerCase();
    return openTasks.filter((t) => t && (t.t?.toLowerCase().includes(q) || (t.sub || '').toLowerCase().includes(q)));
  }, [openTasks, searchQuery]);

  const todayFocusMins = Math.round((sessions && sessions[todayStr]) || 0);
  const totalFocusMins = Math.round(Object.values(sessions || {}).reduce((a: number, b: number) => a + b, 0));

  const sortedFutureCountdowns = [...(countdowns || [])]
    .map((c) => {
      const targetMs = new Date(`${c.targetDate || '2026-12-31'}T${c.targetTime || '07:30'}`).getTime();
      return { ...c, targetMs, diff: targetMs - Date.now() };
    })
    .filter((c) => c.diff > 0)
    .sort((a, b) => a.diff - b.diff);

  const nearestExam = sortedFutureCountdowns[0];
  const nearestDays = nearestExam ? Math.floor(nearestExam.diff / (1000 * 60 * 60 * 24)) : null;
  const formattedTodayDate = `${DOW_FULL_LABELS[todayDow] || 'Hôm nay'}, ${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;

  // Weekly Emotion Accumulation State
  const currentMonday = useMemo(() => getMonday(today), [todayStr]);
  const [weeklyMoods, setWeeklyMoods] = useState<DayMoodData[]>(() => getWeeklyMoodLogs(currentMonday));
  const [selectedDayMood, setSelectedDayMood] = useState<DayMoodData | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [inputMoodType, setInputMoodType] = useState<DayMoodData['mood']>('good');
  const [inputMoodNote, setInputMoodNote] = useState('');
  const [inputEnergy, setInputEnergy] = useState<number>(4);
  const [isEmotionChartExpanded, setIsEmotionChartExpanded] = useState(false);
  const [streakYear, setStreakYear] = useState<number>(2026);
  const [freezeCount, setFreezeCount] = useState<number>(1);
  const [freezeNotice, setFreezeNotice] = useState<string | null>(null);

  // Heatmap Cells definition matching image_7a95391d.png (Jul to Dec, 24 cols x 7 rows = 168 cells)
  const heatmapCells = useMemo(() => {
    const cells: { className: string; title: string; hasMilestoneDot?: boolean }[] = [];
    for (let c = 0; c < 24; c++) {
      for (let r = 0; r < 7; r++) {
        let className = 'bg-slate-200/80 dark:bg-slate-800/60';
        let title = `Tuần ${c + 1}, Thứ ${r + 2}: Nghỉ ngơi`;
        let hasMilestoneDot = false;

        // November columns (c === 16, 17)
        if (c === 16) {
          if (r === 1) { className = 'bg-emerald-500 text-white'; title = 'Thứ 3: 45 phút học tập'; }
          if (r === 2) { className = 'bg-emerald-500 text-white'; title = 'Thứ 4: 60 phút học tập'; }
          if (r === 4) { className = 'bg-emerald-700 dark:bg-emerald-600 text-white'; title = 'Thứ 6: 90 phút học tập'; }
          if (r === 6) { className = 'bg-emerald-500 text-white'; title = 'Chủ nhật: 50 phút học tập'; }
        } else if (c === 17) {
          if (r === 3) { className = 'bg-emerald-700 dark:bg-emerald-600 text-white'; title = 'Thứ 5: 80 phút học tập'; }
        } else if (c === 20) {
          // December columns (c === 20, 21)
          if (r === 0) { className = 'bg-purple-600 text-white'; hasMilestoneDot = true; title = 'Cột mốc: Đạt 100% mục tiêu'; }
          if (r === 1) { className = 'bg-emerald-600 text-white'; hasMilestoneDot = true; title = 'Hoàn thành 25 câu hỏi'; }
          if (r === 2) { className = 'bg-purple-600 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900'; hasMilestoneDot = true; title = 'Hôm nay: Chuỗi 7 ngày liên tiếp!'; }
          if (r === 3) { className = 'bg-purple-600 text-white'; hasMilestoneDot = true; title = 'Phiên học sâu 60 phút'; }
          if (r === 4) { className = 'bg-purple-600 text-white'; hasMilestoneDot = true; title = 'Phiên học sâu 45 phút'; }
        } else if (c === 21) {
          if (r === 3) { className = 'bg-purple-600 text-white'; hasMilestoneDot = true; title = 'Hoàn thành bài kiểm tra'; }
          if (r === 4) { className = 'bg-purple-600 text-white'; hasMilestoneDot = true; title = 'Hoàn thành nhiệm vụ tuần'; }
          if (r === 5) { className = 'bg-purple-600 text-white'; hasMilestoneDot = true; title = 'Đạt 150 EXP'; }
        } else if ((c * 7 + r) % 17 === 0 && c > 8) {
          className = 'bg-emerald-300 dark:bg-emerald-800/60';
          title = 'Phiên tập trung';
        }

        cells.push({ className, title, hasMilestoneDot });
      }
    }
    return cells;
  }, []);

  // Synchronize weekly moods with storage and custom events
  useEffect(() => {
    const handleUpdate = () => {
      setWeeklyMoods(getWeeklyMoodLogs(currentMonday));
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('studyflow_weekly_mood_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('studyflow_weekly_mood_updated', handleUpdate);
    };
  }, [currentMonday]);

  const handleOpenDayCheckIn = (day: DayMoodData) => {
    setSelectedDayMood(day);
    setInputMoodType(day.mood);
    setInputMoodNote(day.note || '');
    setInputEnergy(day.energyLevel || 4);
    setIsCheckInModalOpen(true);
  };

  const handleSaveDayMood = () => {
    if (!selectedDayMood) return;
    saveDayMood(currentMonday, {
      dateStr: selectedDayMood.dateStr,
      mood: inputMoodType,
      note: inputMoodNote.trim() || 'Học tập tập trung & giữ nhịp tốt',
      energyLevel: inputEnergy
    });
    setWeeklyMoods(getWeeklyMoodLogs(currentMonday));
    if (onAddMoodLog) {
      const mCfg = MOOD_LEVELS[inputMoodType] || MOOD_LEVELS.good;
      onAddMoodLog({
        date: selectedDayMood.dateStr,
        time: `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`,
        mood: inputMoodType,
        emoji: mCfg.emoji,
        label: mCfg.label,
        note: inputMoodNote.trim() || 'Học tập tập trung & giữ nhịp tốt'
      });
    }
    setIsCheckInModalOpen(false);
  };

  const positiveDaysCount = (weeklyMoods || []).filter(m => m && m.score >= 4).length;
  const positiveRate = Math.round((positiveDaysCount / 7) * 100);
  const avgWeeklyEnergy = ((weeklyMoods || []).reduce((sum, m) => sum + ((m && m.energyLevel) || 3), 0) / 7).toFixed(1);
  const loggedDaysStreak = (weeklyMoods || []).filter(m => m && m.hasLogged).length;

  // ----------------------------------------------------
  // STUDY GOAL QUEST MAP STATE
  // ----------------------------------------------------
  const [isFlippedToGoals, setIsFlippedToGoals] = useState<boolean>(false);
  const [goals, setGoals] = useState<StudyGoal[]>(() => {
    try {
      const saved = localStorage.getItem('studyflow_study_goals');
      if (!saved) return DEFAULT_STUDY_GOALS;
      const parsed = JSON.parse(saved);
      return (Array.isArray(parsed) && parsed.length > 0) ? parsed : DEFAULT_STUDY_GOALS;
    } catch { return DEFAULT_STUDY_GOALS; }
  });

  const [activeGoalId, setActiveGoalId] = useState<string>(() => (goals && goals[0]?.id) || 'g1');
  const [selectedMilestone, setSelectedMilestone] = useState<GoalMilestone | null>(null);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('studyflow_study_goals', JSON.stringify(goals));
  }, [goals]);

  // EXP & Level
  const completedMilestonesExp = useMemo(() => (goals || []).reduce((acc, g) => 
    acc + ((g && g.milestones) || []).filter(m => m && m.status === 'completed').reduce((sum, m) => sum + (m.rewardPoints || 100), 0)
  , 0), [goals]);
  const focusExp = useMemo(() => Math.round(Object.values(sessions || {}).reduce((a: number, b: number) => a + b, 0)) * 2, [sessions]);
  const taskExp = useMemo(() => (tasks || []).filter(t => t && t.done).length * 25, [tasks]);
  const examExp = useMemo(() => (submissions || []).length * 50, [submissions]);
  const totalExp = completedMilestonesExp + focusExp + taskExp + examExp;

  const getLevelInfo = (exp: number) => {
    if (exp < 500) return { level: 1, currentExp: exp, nextLevelExp: 500, percent: Math.round((exp / 500) * 100) };
    let lvl = 1, accumulated = 0, gap = 500;
    while (exp >= accumulated + gap) { accumulated += gap; gap += 500; lvl++; }
    const currentExp = exp - accumulated;
    return { level: lvl, currentExp, nextLevelExp: gap, percent: Math.min(100, Math.round((currentExp / gap) * 100)) };
  };
  const levelInfo = getLevelInfo(totalExp);

  const activeGoal = useMemo(() => (goals || []).find((g) => g && g.id === activeGoalId) || (goals && goals[0]) || DEFAULT_STUDY_GOALS[0], [goals, activeGoalId]);
  const completedMilestonesCount = useMemo(() => ((activeGoal && activeGoal.milestones) || []).filter((m) => m && m.status === 'completed').length, [activeGoal]);
  const totalMilestonesCount = useMemo(() => ((activeGoal && activeGoal.milestones) || []).length || 1, [activeGoal]);
  const goalProgressPercent = useMemo(() => Math.round((completedMilestonesCount / totalMilestonesCount) * 100), [completedMilestonesCount, totalMilestonesCount]);

  const handleToggleMilestone = (milestoneId: string) => {
    if (!activeGoal) return;
    setGoals((prev) => prev.map((g) => {
      if (g.id !== activeGoal.id) return g;
      const updatedMs = [...(g.milestones || [])];
      const idx = updatedMs.findIndex((m) => m.id === milestoneId);
      if (idx === -1) return g;
      const curStatus = updatedMs[idx].status;
      if (curStatus === 'completed') {
        updatedMs[idx].status = 'in_progress';
      } else {
        updatedMs[idx].status = 'completed';
        if (idx + 1 < updatedMs.length && updatedMs[idx + 1].status === 'locked') {
          updatedMs[idx + 1].status = 'in_progress';
        }
      }
      return { ...g, milestones: updatedMs };
    }));
    if (selectedMilestone?.id === milestoneId) {
      setSelectedMilestone(prev => prev ? { ...prev, status: prev.status === 'completed' ? 'in_progress' : 'completed' } : null);
    }
  };

  const handleUpdateMilestoneTasks = (milestoneId: string, updatedTasks: Array<{ id: string; text: string; done: boolean }>) => {
    if (!activeGoal) return;
    setGoals((prev) => prev.map((g) => {
      if (g.id !== activeGoal.id) return g;
      const updatedMs = (g.milestones || []).map((m) => {
        if (m.id === milestoneId) {
          const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.done);
          return {
            ...m,
            tasks: updatedTasks,
            status: allDone ? 'completed' : (m.status === 'completed' && !allDone ? 'in_progress' : m.status)
          };
        }
        return m;
      });
      return { ...g, milestones: updatedMs };
    }));
  };

  // Roadmap Management
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newGoalData, setNewGoalData] = useState({ title: '', subject: '' });
  const [newMilestoneData, setNewMilestoneData] = useState({ title: '', description: '' });

  const handleAddNewGoal = () => {
    if (!newGoalData.title.trim()) return;
    const newGoal: StudyGoal = {
      id: 'g_' + Date.now(),
      title: newGoalData.title.trim(),
      subject: newGoalData.subject.trim() || 'Tổng hợp',
      createdAt: new Date().toISOString(),
      milestones: [{ id: 'm_1', title: 'Mốc 1: Khởi động nền tảng', description: 'Nắm vững lý thuyết cơ bản', status: 'in_progress', rewardBadge: '🌱 Khởi đầu', rewardPoints: 100 }]
    };
    setGoals(p => [newGoal, ...p]);
    setActiveGoalId(newGoal.id);
    setIsAddingGoal(false);
    setNewGoalData({ title: '', subject: '' });
  };

  const handleAddMilestone = () => {
    if (!activeGoal || !newMilestoneData.title.trim()) return;
    setGoals(p => p.map(g => {
      if (g.id !== activeGoal.id) return g;
      const newMs: GoalMilestone = { id: 'm_' + Date.now(), title: newMilestoneData.title.trim(), description: newMilestoneData.description.trim() || 'Hoàn thành nhiệm vụ', status: (g.milestones || []).length === 0 ? 'in_progress' : 'locked', rewardBadge: '🏅 Chuyên gia', rewardPoints: 150 };
      return { ...g, milestones: [...(g.milestones || []), newMs] };
    }));
    setIsAddingMilestone(false);
    setNewMilestoneData({ title: '', description: '' });
  };

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const handleAiSynthesizeRoadmap = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/ai/synthesize-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentProfile, subjects: studentProfile?.subjects || [], sessions, tasks, currentGoals: goals })
      });
      const data = await res.json();
      if (data.goal && Array.isArray(data.goal.milestones)) {
        const newGoal: StudyGoal = { ...data.goal, id: 'g_syn_' + Date.now(), createdAt: new Date().toISOString(), milestones: data.goal.milestones.map((m: any, idx: number) => ({ ...m, id: 'ms_' + Date.now() + '_' + idx, status: idx === 0 ? 'in_progress' : 'locked' })) };
        setGoals(p => [newGoal, ...p]);
        setActiveGoalId(newGoal.id);
      }
    } catch (err) { console.error('AI roadmap synthesis failed', err); }
    finally { setIsSynthesizing(false); }
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!activeGoal) return;
    setGoals((prev) => prev.map((g) => {
      if (g.id !== activeGoal.id) return g;
      const remaining = (g.milestones || []).filter(m => m.id !== milestoneId);
      const hasInProgress = remaining.some(m => m.status === 'in_progress');
      if (!hasInProgress && remaining.length > 0) {
        const firstLocked = remaining.findIndex(m => m.status === 'locked');
        if (firstLocked !== -1) {
          remaining[firstLocked].status = 'in_progress';
        }
      }
      return { ...g, milestones: remaining };
    }));
    if (selectedMilestone?.id === milestoneId) {
      setSelectedMilestone(null);
    }
  };

  const [goalToDelete, setGoalToDelete] = useState<StudyGoal | null>(null);

  const confirmDeleteGoal = () => {
    if (!goalToDelete) return;
    const targetId = goalToDelete.id;
    setGoals((prev) => {
      const remaining = prev.filter(g => g.id !== targetId);
      if (remaining.length === 0) {
        const fresh: StudyGoal = {
          id: 'g_' + Date.now(),
          title: 'Lộ trình ôn tập trọng tâm',
          subject: 'Toán học',
          createdAt: new Date().toISOString(),
          milestones: [
            { id: 'm_' + Date.now(), title: 'Mốc 1: Khởi động nền tảng', description: 'Nắm vững kiến thức trọng tâm', status: 'in_progress', rewardBadge: '🌱 Khởi đầu', rewardPoints: 100 }
          ]
        };
        setActiveGoalId(fresh.id);
        return [fresh];
      }
      if (activeGoalId === targetId) {
        setActiveGoalId(remaining[0].id);
      }
      return remaining;
    });
    setGoalToDelete(null);
  };

  const handleDeleteActiveGoal = () => {
    if (activeGoal) {
      setGoalToDelete(activeGoal);
    }
  };

  const [subjectScores, setSubjectScores] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('studyflow_subject_scores');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const autoPrioritySubjects = useMemo(() => {
    if (!subjectScores || subjectScores.length === 0) return [];
    return [...subjectScores]
      .map(s => ({
        ...s,
        gap: (s.target || 9.0) - (s.score || 8.0),
      }))
      .sort((a, b) => b.gap - a.gap)
      .filter(s => s.gap > 0.2)
      .slice(0, 3);
  }, [subjectScores]);

  const handleSurveySubmit = async (data: SurveyData) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          events,
          studentProfile,
          gpaGoal: 8.8,
          currentAvg: 8.5,
          subjects: subjectScores,
          surveyData: data,
          currentDate: new Date().toISOString()
        })
      });
      const resData = await res.json();
      setAnalysisResult(resData.reply);
      setShowSurvey(false);
      // If AI generated events, sync them
      const jsonMatch = resData.reply?.match(/```json_calendar_events\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const eventsToAdd = Array.isArray(parsed) ? parsed : (parsed.events || []);
          if (eventsToAdd.length > 0) {
            window.dispatchEvent(new CustomEvent('studyflow_add_events', { detail: eventsToAdd }));
          }
        } catch {}
      }
    } catch (err) {
      console.error('Survey analysis failed', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto perspective-1000">
      <div className={`w-full flip-card-transition transform-style-3d ${isFlippedToGoals ? 'rotate-y-180' : ''}`}>
        
        {/* FRONT: Overview Dashboard */}
        <div className={`w-full backface-hidden ${isFlippedToGoals ? 'pointer-events-none absolute inset-0 opacity-0' : 'relative'}`}>
          <div className="w-full bg-gradient-to-b from-white via-[#f8faff] to-[#eef4ff] dark:bg-gradient-to-b dark:from-[#060c18] dark:via-[#081328] dark:to-[#040812] border border-slate-200/90 dark:border-cyan-500/25 rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.08)] dark:shadow-[0_25px_65px_-15px_rgba(2,6,23,0.95)] space-y-6 relative overflow-hidden">
            
            {/* Ambient Background Radial Glows for Luxury Depth */}
            <div className="pointer-events-none absolute -top-32 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/12 rounded-full blur-3xl" />
            
            {/* Header */}
            <div className="relative z-10 bg-white/95 dark:bg-gradient-to-r dark:from-[#0b162c] dark:via-[#0d1d3a] dark:to-[#071122] border border-slate-200/90 dark:border-cyan-500/30 rounded-[28px] p-5 shadow-lg dark:shadow-[0_15px_40px_rgba(2,6,23,0.8)] backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{isTeacher ? 'Bảng điều khiển Giảng dạy' : 'Xin chào bạn 👋'}</h1>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-300/40 uppercase tracking-wider">{isTeacher ? 'GIÁO VIÊN' : 'HỌC SINH'}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-bold">
                    <CalendarDays className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>{formattedTodayDate}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => onNavigate('focus')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0b182d] hover:bg-slate-50 dark:hover:bg-[#102340] hover:border-cyan-400 dark:hover:border-cyan-400 text-slate-700 dark:text-slate-200 text-xs font-black shadow-xs interactive-spring hover:shadow-[0_0_18px_rgba(6,182,212,0.25)]">
                    <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" /><span>Pomodoro</span>
                  </button>
                  <button onClick={() => onNavigate('exams')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-orange-500/30 bg-white dark:bg-[#0b182d] hover:bg-slate-50 dark:hover:bg-[#102340] hover:border-orange-400 dark:hover:border-orange-400 text-slate-700 dark:text-slate-200 text-xs font-black shadow-xs interactive-spring hover:shadow-[0_0_18px_rgba(249,115,22,0.25)]">
                    <FileText className="w-3.5 h-3.5 text-orange-500" /><span>Đề thi</span>
                  </button>
                  <button onClick={() => onNavigate('countdown')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-rose-500/30 bg-white dark:bg-[#0b182d] hover:bg-slate-50 dark:hover:bg-[#102340] hover:border-rose-400 dark:hover:border-rose-400 text-slate-700 dark:text-slate-200 text-xs font-black shadow-xs interactive-spring hover:shadow-[0_0_18px_rgba(244,63,94,0.25)]">
                    <Hourglass className="w-3.5 h-3.5 text-rose-500" /><span>Đếm ngược</span>
                  </button>
                  {!isTeacher && (
                    <button onClick={() => onNavigate('group_study')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/90 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:border-indigo-400 text-indigo-600 dark:text-indigo-300 text-xs font-black interactive-spring shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]">
                      <Users className="w-3.5 h-3.5" /><span>Phòng học nhóm</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Priority Subjects Highlight (User Requested) */}
            {autoPrioritySubjects.length > 0 && (
              <div className="relative z-10 bg-gradient-to-r from-amber-50/90 via-sky-50/30 to-amber-50/90 dark:from-[#131c36] dark:via-[#192446] dark:to-[#0f152a] border border-amber-300 dark:border-amber-400/35 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md dark:shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0 ring-1 ring-amber-300/40">
                    <Zap className="w-5 h-5 fill-current animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                      ✨ Môn cần ưu tiên bứt phá
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {autoPrioritySubjects.map(s => (
                        <span key={s.name} className="px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-[#091325] text-[9px] font-bold text-slate-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-400/40 shadow-xs">
                          {s.name} (Cách mục tiêu {s.gap.toFixed(1)}đ)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSurvey(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black interactive-spring shadow-md shadow-amber-500/30 cursor-pointer shrink-0"
                >
                  Lên lộ trình
                </button>
              </div>
            )}

            {/* Ô NỔI BẬT: BẢN ĐỒ MỤC TIÊU HỌC TẬP (GAMIFIED PREVIEW) - LUXURY CELESTIAL NAVY & NEON GRADIENT */}
            <div
              onClick={() => setIsFlippedToGoals(true)}
              className="relative z-10 bg-gradient-to-br from-[#061530] via-[#0b2552] to-[#12386e] dark:from-[#051126] dark:via-[#092042] dark:to-[#0e2c56] rounded-3xl p-5 sm:p-6 text-white shadow-[0_20px_50px_-10px_rgba(6,182,212,0.3)] hover:shadow-[0_25px_60px_-5px_rgba(6,182,212,0.45)] border border-cyan-400/35 hover:border-cyan-300/60 transition-all duration-300 cursor-pointer group overflow-hidden interactive-spring"
            >
              {/* Luminous Neon Cyan Progress Bar */}
              <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden mb-4 border border-cyan-400/30 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(6,182,212,0.9)]"
                  style={{ width: `${Math.max(goalProgressPercent, 8)}%` }}
                />
              </div>

              {/* Background Decorative Cosmic Glows */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-700" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-cyan-100 tracking-wide drop-shadow-xs">
                      Cột mốc hoàn thành
                    </p>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/40 backdrop-blur-md text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                      {goalProgressPercent}%
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-cyan-200 transition-colors flex items-center gap-2 drop-shadow-sm">
                    <span>{activeGoal?.title}</span>
                  </h2>

                  <div className="flex items-center gap-3 py-1">
                    {/* Current Milestone Mini-Badge with Avatar */}
                    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-black/40 backdrop-blur-md border border-cyan-400/30 shadow-inner group-hover:bg-black/50 transition-colors">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-emerald-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                          <Avatar
                            src={studentProfile?.avatar}
                            fallbackText={studentProfile?.name || 'HS'}
                            sizeClassName="w-full h-full rounded-full"
                            bgClassName="bg-cyan-700"
                            textClassName="text-white font-black text-[10px]"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black text-[8px] border border-white shadow-xs">
                          L{studentProfile?.className || '5'}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-cyan-200 uppercase tracking-wide opacity-80">Bạn đang ở</p>
                        <p className="text-xs font-black text-white flex items-center gap-1">
                          <Target className="w-3 h-3 text-cyan-300" />
                          <span>Mốc {completedMilestonesCount + 1}: {activeGoal?.milestones?.[completedMilestonesCount]?.title?.split(':')?.[1]?.trim() || activeGoal?.milestones?.[completedMilestonesCount]?.title || 'Bắt đầu'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="shrink-0 flex items-center gap-3 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-slate-950 px-5 py-4 rounded-[24px] font-black text-xs shadow-[0_0_25px_rgba(6,182,212,0.45)] group-hover:scale-105 transition-all duration-300 self-start md:self-center">
                  <div className="w-8 h-8 rounded-xl bg-slate-950/15 flex items-center justify-center">
                    <Play className="w-4 h-4 text-slate-950 fill-current animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-800 uppercase tracking-widest font-black opacity-80">Tiếp tục hành trình</span>
                    <span className="text-sm font-black">LẬT BẢN ĐỒ ➔</span>
                  </div>
                </div>
              </div>
              
              {/* Massive Decorative Trophy in background */}
              <Trophy className="absolute -bottom-10 -right-10 w-48 h-48 text-cyan-300/10 rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700" />
            </div>

            {/* Quick Stats Grid - LUXURY NAVY TILES WITH NEON ACCENTS */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div onClick={() => onNavigate('calendar')} className="bg-gradient-to-br from-white via-[#f8faff] to-[#edf4fe] dark:bg-gradient-to-br dark:from-[#0b1730] dark:via-[#081225] dark:to-[#050c18] border border-slate-200/80 dark:border-cyan-500/20 rounded-2xl p-4 hover:border-emerald-400 dark:hover:border-emerald-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_12px_30px_-5px_rgba(16,185,129,0.35)] interactive-spring group">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 dark:text-cyan-200/60 uppercase tracking-widest">Lịch học</span><Calendar className="w-4 h-4 text-emerald-500 group-hover:scale-110 group-hover:text-emerald-400 transition-transform" /></div>
                <div className="mt-3 flex items-baseline gap-1"><span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{todayEvents.length}</span><span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold">BUỔI</span></div>
              </div>
              <div onClick={() => onNavigate('tasks')} className="bg-gradient-to-br from-white via-[#f8faff] to-[#edf4fe] dark:bg-gradient-to-br dark:from-[#0b1730] dark:via-[#081225] dark:to-[#050c18] border border-slate-200/80 dark:border-cyan-500/20 rounded-2xl p-4 hover:border-amber-400 dark:hover:border-amber-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_12px_30px_-5px_rgba(245,158,11,0.35)] interactive-spring group">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 dark:text-cyan-200/60 uppercase tracking-widest">Bài tập</span><AlertCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 group-hover:text-amber-400 transition-transform" /></div>
                <div className="mt-3 flex items-baseline gap-1"><span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{openTasks.length}</span><span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold">BÀI</span></div>
              </div>
              <div onClick={() => onNavigate('countdown')} className="bg-gradient-to-br from-white via-[#f8faff] to-[#edf4fe] dark:bg-gradient-to-br dark:from-[#0b1730] dark:via-[#081225] dark:to-[#050c18] border border-slate-200/80 dark:border-cyan-500/20 rounded-2xl p-4 hover:border-rose-400 dark:hover:border-rose-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_12px_30px_-5px_rgba(244,63,94,0.35)] interactive-spring group">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 dark:text-cyan-200/60 uppercase tracking-widest">Kỳ thi</span><Hourglass className="w-4 h-4 text-rose-500 group-hover:scale-110 group-hover:text-rose-400 transition-transform" /></div>
                <div className="mt-3 flex items-baseline gap-1"><span className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{nearestDays || 0}</span><span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold">NGÀY</span></div>
              </div>
              <div onClick={() => onNavigate('focus')} className="bg-gradient-to-br from-white via-[#f8faff] to-[#edf4fe] dark:bg-gradient-to-br dark:from-[#0b1730] dark:via-[#081225] dark:to-[#050c18] border border-slate-200/80 dark:border-cyan-500/20 rounded-2xl p-4 hover:border-cyan-400 dark:hover:border-cyan-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_12px_30px_-5px_rgba(6,182,212,0.35)] interactive-spring group">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-400 dark:text-cyan-200/60 uppercase tracking-widest">Tập trung</span><Clock className="w-4 h-4 text-cyan-500 group-hover:scale-110 group-hover:text-cyan-400 transition-transform" /></div>
                <div className="mt-3 flex items-baseline gap-1"><span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{todayFocusMins}</span><span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold">PHÚT</span></div>
              </div>
            </div>

            {/* 1. Biểu Đồ Tiến Độ Học Tập & Day Streak - LUXURY NAVY CANVAS */}
            <div className="relative z-10 bg-gradient-to-br from-white via-slate-50 to-sky-50/20 dark:from-[#08142a] dark:via-[#0c1f3f] dark:to-[#061022] border border-slate-200/80 dark:border-cyan-500/25 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-[0_15px_40px_rgba(2,6,23,0.8)] space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      Biểu Đồ Tiến Độ Học Tập & Day Streak
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Theo dõi tần suất tập trung & tích lũy kinh nghiệm mỗi ngày
                    </p>
                  </div>
                </div>

                {/* Year Selector */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-[#071326] border border-slate-200/80 dark:border-cyan-500/30 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <button 
                    onClick={() => setStreakYear(prev => prev - 1)}
                    className="p-1 hover:text-cyan-400 transition cursor-pointer"
                    title="Năm trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 text-slate-900 dark:text-white font-black tabular-nums">{streakYear}</span>
                  <button 
                    onClick={() => setStreakYear(prev => prev + 1)}
                    className="p-1 hover:text-cyan-400 transition cursor-pointer"
                    title="Năm sau"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid 2 Columns: Heatmap Matrix + Day Streak Box */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Heatmap Matrix */}
                <div className="lg:col-span-8 overflow-x-auto no-scrollbar space-y-3">
                  {/* Month labels */}
                  <div className="flex justify-between pl-8 pr-2 text-[11px] font-bold text-slate-400 dark:text-slate-400 min-w-[420px]">
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>

                  {/* Heatmap Row & Days */}
                  <div className="flex gap-2 min-w-[420px]">
                    {/* Day labels on left */}
                    <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 py-0.5 w-6">
                      <span className="h-3 leading-3"></span>
                      <span className="h-3 leading-3">Tue</span>
                      <span className="h-3 leading-3"></span>
                      <span className="h-3 leading-3">Thu</span>
                      <span className="h-3 leading-3"></span>
                      <span className="h-3 leading-3">Sat</span>
                      <span className="h-3 leading-3"></span>
                    </div>

                    {/* 24 Weeks x 7 Days Grid */}
                    <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1.5">
                      {heatmapCells.map((cell, idx) => (
                        <div
                          key={idx}
                          title={cell.title}
                          className={`w-3.5 h-3.5 rounded-[4px] transition-all cursor-pointer hover:scale-125 flex items-center justify-center relative ${cell.className}`}
                        >
                          {cell.hasMilestoneDot && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white block shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Freeze Streak Pill */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setFreezeNotice("🧊 Khiên Băng Bảo Lưu: Đang kích hoạt 1 lượt bảo vệ chuỗi streak tự động khi bạn vắng mặt!");
                        setTimeout(() => setFreezeNotice(null), 4000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/50 border border-sky-300/80 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition shadow-xs interactive-spring cursor-pointer"
                    >
                      <span>Đông 🧊 x {freezeCount}</span>
                      <Snowflake className="w-3.5 h-3.5 text-sky-500 animate-spin-slow" />
                    </button>
                    {freezeNotice && (
                      <span className="text-[11px] text-sky-500 font-medium animate-in fade-in">
                        {freezeNotice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Streak Callout Box - LUXURY NAVY CRYSTAL */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-gradient-to-br from-[#0e1f3d] via-[#09172e] to-[#040c1a] border border-amber-400/50 shadow-[0_10px_35px_rgba(245,158,11,0.25)] relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/30 transition-all duration-700" />
                  
                  {/* Flame Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/25 via-orange-500/25 to-amber-400/30 text-amber-300 flex items-center justify-center text-3xl shadow-[0_0_22px_rgba(245,158,11,0.5)] border border-amber-400/60 group-hover:scale-110 transition-transform duration-300">
                    🔥
                  </div>

                  {/* Big Number */}
                  <div className="mt-3">
                    <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.85)] tracking-tight tabular-nums block">
                      7
                    </span>
                    <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-widest mt-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                      DAY STREAK
                    </h3>
                  </div>

                  {/* Footnote */}
                  <p className="text-[11px] text-cyan-100/90 font-medium max-w-[220px] leading-relaxed italic my-3 drop-shadow-xs">
                    *Mỗi ngày trả lời đủ 25 câu hoặc hoàn thành 1 phiên học để giữ streak, ngày mới tính từ 0h giờ VN*
                  </p>

                  {/* Action Button */}
                  <button
                    onClick={() => onNavigate('focus')}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/40 flex items-center justify-center gap-1.5 interactive-spring cursor-pointer border border-emerald-200/60"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-slate-950" />
                    <span>DUY TRÌ STREAK NGAY</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Xu Hướng Tâm Trạng Tuần (AI Sentiment Analytics) - LUXURY NAVY & NEON WAVE */}
            <div className="relative z-10 bg-gradient-to-br from-white via-slate-50 to-pink-50/20 dark:from-[#09152b] dark:via-[#0e1d3d] dark:to-[#071124] border border-slate-200/80 dark:border-pink-500/25 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-[0_15px_40px_rgba(244,63,94,0.15)] space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        Xu Hướng Tâm Trạng Tuần
                      </h2>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                        AI SENTIMENT ANALYTICS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Phân tích từ tương tác với Trợ lý AI Tâm lý Học đường
                    </p>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#071326] border border-slate-200/80 dark:border-cyan-500/30 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs">
                    <span>😊</span>
                    <span>Chủ đạo: <strong className="text-emerald-600 dark:text-emerald-400 font-black">Tươi vui & Tích cực</strong></span>
                  </div>

                  <button
                    onClick={() => onNavigate('ai_studio')}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs shadow-md shadow-pink-500/30 flex items-center gap-1.5 interactive-spring cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tâm sự AI</span>
                  </button>
                </div>
              </div>

              {/* Area Wave Chart */}
              <div className="w-full relative pt-2">
                <div className="h-44 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sentimentWaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#a855f7" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="waveGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#f43f5e" floodOpacity="0.5" />
                      </filter>
                    </defs>

                    {/* Horizontal Reference Gridlines */}
                    <line x1="40" y1="20" x2="680" y2="20" stroke="currentColor" className="text-slate-200 dark:text-cyan-900/30" strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="40" y1="65" x2="680" y2="65" stroke="currentColor" className="text-slate-200 dark:text-cyan-900/30" strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="40" y1="110" x2="680" y2="110" stroke="currentColor" className="text-slate-200 dark:text-cyan-900/30" strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="40" y1="145" x2="680" y2="145" stroke="currentColor" className="text-slate-200 dark:text-cyan-900/30" strokeWidth="1" />

                    {/* Y Axis Labels */}
                    <text x="25" y="24" textAnchor="end" className="text-[10px] fill-slate-400 font-bold tabular-nums">10</text>
                    <text x="25" y="69" textAnchor="end" className="text-[10px] fill-slate-400 font-bold tabular-nums">6</text>
                    <text x="25" y="114" textAnchor="end" className="text-[10px] fill-slate-400 font-bold tabular-nums">3</text>
                    <text x="25" y="148" textAnchor="end" className="text-[10px] fill-slate-400 font-bold tabular-nums">0</text>

                    {/* Filled Wave Area */}
                    <path
                      d="M 50 20 C 120 20, 180 20, 240 20 C 280 20, 310 65, 350 65 C 390 65, 420 20, 470 20 C 530 20, 590 20, 670 20 L 670 145 L 50 145 Z"
                      fill="url(#sentimentWaveGrad)"
                    />

                    {/* Glowing Wave Stroke Line */}
                    <path
                      d="M 50 20 C 120 20, 180 20, 240 20 C 280 20, 310 65, 350 65 C 390 65, 420 20, 470 20 C 530 20, 590 20, 670 20"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                      filter="url(#waveGlow)"
                    />
                  </svg>
                </div>

                {/* X Axis Day Labels */}
                <div className="flex justify-between pl-10 pr-4 pt-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span>CN</span>
                </div>
              </div>

              {/* 4 Mood Metric Cards matching Image 1 - LUXURY NAVY GLASS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {/* 1. Tươi vui / Tích cực */}
                <div 
                  onClick={() => {
                    const todayEntry = weeklyMoods.find(m => m.dateStr === todayStr) || weeklyMoods[0];
                    handleOpenDayCheckIn(todayEntry);
                  }}
                  className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-gradient-to-br dark:from-[#071c26] dark:to-[#05141e] border border-emerald-200 dark:border-emerald-500/35 flex items-center justify-between interactive-spring shadow-xs hover:border-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.25)] cursor-pointer group"
                >
                  <div>
                    <h4 className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      TƯƠI VUI / TÍCH CỰC
                    </h4>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-1 block">
                      32 từ khóa
                    </span>
                  </div>
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">😊</span>
                </div>

                {/* 2. Bình thản / Cân bằng */}
                <div 
                  onClick={() => {
                    const todayEntry = weeklyMoods.find(m => m.dateStr === todayStr) || weeklyMoods[0];
                    handleOpenDayCheckIn(todayEntry);
                  }}
                  className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-gradient-to-br dark:from-[#071e2e] dark:to-[#041320] border border-cyan-200 dark:border-cyan-500/35 flex items-center justify-between interactive-spring shadow-xs hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(6,182,212,0.25)] cursor-pointer group"
                >
                  <div>
                    <h4 className="text-[10px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                      BÌNH THẢN / CÂN BẰNG
                    </h4>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-1 block">
                      29 từ khóa
                    </span>
                  </div>
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">😌</span>
                </div>

                {/* 3. Căng thẳng / Lo âu */}
                <div 
                  onClick={() => {
                    const todayEntry = weeklyMoods.find(m => m.dateStr === todayStr) || weeklyMoods[0];
                    handleOpenDayCheckIn(todayEntry);
                  }}
                  className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-gradient-to-br dark:from-[#1c1815] dark:to-[#130f0d] border border-amber-200 dark:border-amber-500/35 flex items-center justify-between interactive-spring shadow-xs hover:border-amber-400 hover:shadow-[0_0_18px_rgba(245,158,11,0.25)] cursor-pointer group"
                >
                  <div>
                    <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      CĂNG THẲNG / LO ÂU
                    </h4>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-1 block">
                      11 từ khóa
                    </span>
                  </div>
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">😰</span>
                </div>

                {/* 4. Mệt mỏi / Mất sức */}
                <div 
                  onClick={() => {
                    const todayEntry = weeklyMoods.find(m => m.dateStr === todayStr) || weeklyMoods[0];
                    handleOpenDayCheckIn(todayEntry);
                  }}
                  className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-gradient-to-br dark:from-[#21111d] dark:to-[#150a12] border border-rose-200 dark:border-rose-500/35 flex items-center justify-between interactive-spring shadow-xs hover:border-rose-400 hover:shadow-[0_0_18px_rgba(244,63,94,0.25)] cursor-pointer group"
                >
                  <div>
                    <h4 className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                      MỆT MỎI / MẤT SỨC
                    </h4>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-1 block">
                      6 từ khóa
                    </span>
                  </div>
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">😫</span>
                </div>
              </div>
            </div>

            {/* 3. Cặp Cổng Tra Cứu Liên Kết - LUXURY MIDNIGHT NAVY & VIOLET */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Trường Học Việt */}
              <div className="relative rounded-3xl p-5 bg-gradient-to-br from-[#06142a] via-[#091e3e] to-[#040e1f] border border-cyan-400/35 text-white shadow-[0_15px_40px_-5px_rgba(6,182,212,0.25)] overflow-hidden group hover:border-cyan-400/70 interactive-spring flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                      ACADEMIC PORTAL
                    </span>
                    <div className="flex items-center -space-x-1.5 opacity-80">
                      <div className="w-4 h-4 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      <div className="w-4 h-4 rounded-full bg-blue-500/80" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-white">
                        TRƯỜNG HỌC VIỆT
                      </h3>
                      <p className="text-[11px] text-cyan-100/70 mt-1 leading-relaxed">
                        Hệ thống quản lý học tập chính thức. Tra cứu thời khóa biểu & thông báo từ nhà trường.
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href="https://truonghocviet.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 hover:border-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition duration-200 mt-5 interactive-spring cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <span>Truy cập Hệ thống</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Card 2: Cổng Tra Cứu VNEDU */}
              <div className="relative rounded-3xl p-5 bg-gradient-to-br from-[#18113c] via-[#120c2e] to-[#0a071c] border border-indigo-400/40 text-white shadow-[0_15px_40px_-5px_rgba(99,102,241,0.28)] overflow-hidden group hover:border-indigo-400/70 interactive-spring flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                      GRADES & REPORTS
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-indigo-200" />
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                      <span className="text-sm font-black text-indigo-950 tracking-tight font-sans">vnE</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-white">
                        CỔNG TRA CỨU VNEDU
                      </h3>
                      <p className="text-[11px] text-indigo-100/70 mt-1 leading-relaxed">
                        Xem kết quả học tập, điểm thi định kỳ và sổ liên lạc điện tử của bạn.
                      </p>
                    </div>
                  </div>
                </div>

                <a
                  href="https://user.vnedu.vn/sso//?use_cache=0&continue=tracuu.vnedu.vn/kqht/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs flex items-center justify-center gap-2 transition duration-200 shadow-md mt-5 interactive-spring cursor-pointer"
                >
                  <span>Mở Sổ Liên Lạc</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-950" />
                </a>
              </div>
            </div>

            {/* Today Schedule & Tasks - DEEP NAVY CARDS */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white/95 dark:bg-gradient-to-br dark:from-[#09162e] dark:via-[#071225] dark:to-[#040c19] border border-slate-200/80 dark:border-cyan-500/20 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-cyan-950/60 mb-2">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /><h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Lịch hôm nay</h2></div>
                  <button onClick={() => onNavigate('calendar')} className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">Tất cả <ArrowRight className="w-3 h-3 inline" /></button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto custom-scrollbar">
                  {filteredEvents.map((e) => {
                    const conf = EVENT_TYPE_MAP[e.type] || EVENT_TYPE_MAP.class;
                    return (
                      <div key={e.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#0c1a35]/40 px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#08152c] text-slate-700 dark:text-cyan-300 border border-transparent dark:border-cyan-500/20 shrink-0 tabular-nums">{formatHours(e.h)}</span>
                          <div className="min-w-0"><p className="text-xs font-semibold truncate text-slate-900 dark:text-white">{e.t}</p>{e.room && <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{e.room}</p>}</div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${conf.bgClass}`}>{conf.label}</span>
                      </div>
                    );
                  })}
                  {filteredEvents.length === 0 && <div className="py-8 text-center text-xs text-slate-400">Không có lịch hôm nay.</div>}
                </div>
              </div>

              <div className="bg-white/95 dark:bg-gradient-to-br dark:from-[#09162e] dark:via-[#071225] dark:to-[#040c19] border border-slate-200/80 dark:border-cyan-500/20 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-cyan-950/60 mb-2">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /><h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Bài tập cần làm</h2></div>
                  <button onClick={() => onNavigate('tasks')} className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">Quản lý <ArrowRight className="w-3 h-3 inline" /></button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto custom-scrollbar">
                  {filteredTasks.map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-[#0c1a35]/40 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => onToggleTask(t.id)} className="text-slate-400 hover:text-emerald-500 transition shrink-0"><span className="w-4 h-4 rounded-full border border-slate-300 dark:border-cyan-500/40 hover:border-emerald-400 block" /></button>
                        <div className="min-w-0"><p className="text-xs font-semibold truncate text-slate-900 dark:text-white">{t.t}</p><p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">{t.sub}</p></div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 tabular-nums ${t.due < todayStr ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30' : 'bg-slate-100 dark:bg-[#08152c] text-slate-600 dark:text-slate-300 border border-transparent dark:border-cyan-500/20'}`}>{t.due.split('-').reverse().slice(0, 2).join('/')}</span>
                    </div>
                  ))}
                  {filteredTasks.length === 0 && <div className="py-8 text-center text-xs text-slate-400">Bạn đã xong hết bài tập!</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK: Goals & Quest Map (COMPACT 1-FRAME LUXURY NAVY DESIGN) */}
        <div className={`w-full backface-hidden rotate-y-180 ${!isFlippedToGoals ? 'pointer-events-none absolute inset-0 opacity-0' : 'relative'}`}>
          <div className="w-full bg-gradient-to-b from-white via-[#f8faff] to-[#eef4ff] dark:bg-gradient-to-b dark:from-[#060c18] dark:via-[#081328] dark:to-[#040812] border border-slate-200/90 dark:border-cyan-500/25 rounded-3xl p-4 sm:p-5 shadow-[0_25px_65px_-15px_rgba(2,6,23,0.95)] space-y-4 relative overflow-hidden">
            
            {/* Top Navigation & Status Bar - Compact */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-cyan-900/30">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsFlippedToGoals(false)} 
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[10px] rounded-xl transition shadow-md flex items-center gap-1.5 interactive-spring shrink-0 uppercase tracking-wider"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>

                <div>
                  <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-500" />
                    <span>Lộ trình của bạn</span>
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {activeGoal?.subject} • {activeGoal?.milestones.length} Cột mốc
                  </p>
                </div>
              </div>

              {/* Stats & Progress Pills - Slimmer */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div onClick={() => setIsAchievementModalOpen(true)} className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#09152b] border border-slate-200/80 dark:border-amber-400/30 cursor-pointer hover:border-amber-400 transition shadow-xs interactive-spring">
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black text-[9px]">
                    L{levelInfo.level}
                  </div>
                  <span className="text-[10px] font-black text-slate-800 dark:text-amber-200 tabular-nums">
                    {totalExp} EXP
                  </span>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-[#071a2e] border border-cyan-200 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-black tabular-nums">
                    {goalProgressPercent}%
                  </span>
                </div>

                <button 
                  onClick={() => setIsAddingGoal(true)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-cyan-100 dark:bg-[#09152b] text-slate-600 hover:text-cyan-700 dark:text-slate-300 transition border border-transparent dark:border-cyan-500/20 hover:border-cyan-400 interactive-spring"
                  title="Thêm mục tiêu mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Goal Switcher Tabs: Slimmer Scrollable List */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
              {goals.map((g) => {
                const isActive = activeGoalId === g.id;
                const completedCount = (g.milestones || []).filter(m => m.status === 'completed').length;
                const totalCount = (g.milestones || []).length || 1;
                const pct = Math.round((completedCount / totalCount) * 100);

                return (
                  <div key={g.id} className="flex items-center group/tab shrink-0">
                    <button
                      onClick={() => {
                        setActiveGoalId(g.id);
                        setSelectedMilestone(null);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-l-xl text-[10px] font-bold transition border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black border-cyan-400 shadow-sm z-10'
                          : 'bg-slate-50 dark:bg-[#081326] text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-cyan-500/20 hover:bg-slate-100 dark:hover:bg-[#0d1e3d]'
                      }`}
                    >
                      <span className="max-w-[100px] truncate">{g.title}</span>
                      <span className={`text-[8px] px-1 py-0.2 rounded-full font-black tabular-nums ${
                        isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        {pct}%
                      </span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGoalToDelete(g);
                      }}
                      className={`p-1 rounded-r-xl border border-l-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95 ${
                        isActive 
                          ? 'bg-blue-700 text-cyan-100 border-cyan-400' 
                          : 'bg-slate-50 dark:bg-[#081326] border-slate-200/80 dark:border-cyan-500/20'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* BẢN ĐỒ MỤC TIÊU HỌC TẬP DẠNG GAME RPG (GAME QUEST MAP) */}
            <div className="overflow-hidden rounded-[32px] border border-slate-200/50 dark:border-cyan-500/25 shadow-inner bg-slate-50 dark:bg-[#040812]">
              {activeGoal && activeGoal.milestones ? (
                <GameQuestMap
                  milestones={activeGoal.milestones || []}
                  subject={activeGoal.subject}
                  goalTitle={activeGoal.title}
                  studentProfile={studentProfile}
                  selectedMilestoneId={selectedMilestone?.id || null}
                  onSelectMilestone={(m) => setSelectedMilestone(m)}
                  onToggleMilestone={handleToggleMilestone}
                  onUpdateMilestoneTasks={handleUpdateMilestoneTasks}
                  onDeleteMilestone={handleDeleteMilestone}
                  onAddMilestoneClick={() => setIsAddingMilestone(true)}
                  onDeleteGoalClick={() => setGoalToDelete(activeGoal)}
                />
              ) : (
                <div className="p-12 text-center">
                  <p className="text-sm font-bold text-slate-500">Chưa có lộ trình học tập nào.</p>
                  <button
                    onClick={() => setIsAddingGoal(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs interactive-spring"
                  >
                    Tạo lộ trình mới
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Bar: AI Advisor & Quick Actions - LUXURY NAVY GLOW */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#06152f] via-[#0c244c] to-[#12386e] border border-cyan-400/40 text-white shadow-[0_15px_40px_rgba(6,182,212,0.3)] relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/30 transition-all duration-700"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-teal-300 to-blue-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white tracking-wide">AI Cố vấn lộ trình học tập</h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-400/25 text-cyan-200 border border-cyan-300/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">Pro AI</span>
                  </div>
                  <p className="text-[10px] text-cyan-100/80 leading-tight mt-0.5">
                    Tự động phân tích điểm số thực tế & Pomodoro để tạo lộ trình tối ưu với mô hình AI
                  </p>
                </div>
              </div>

              <button 
                onClick={handleAiSynthesizeRoadmap} 
                disabled={isSynthesizing}
                className="relative z-10 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300 flex items-center gap-1.5 shrink-0 disabled:opacity-50 interactive-spring cursor-pointer"
              >
                {isSynthesizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Tổng hợp lộ trình mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENT MODAL - LUXURY NAVY DIALOG */}
      {isAchievementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border border-slate-200 dark:border-cyan-500/35 rounded-[32px] p-6 sm:p-8 dialog-depth-shadow space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-cyan-900/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-2xl shadow-xl shadow-amber-500/30">🏆</div>
                <div><h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Thành tích học tập</h3><p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">Bảng thăng cấp tài khoản StudyFlow</p></div>
              </div>
              <button onClick={() => setIsAchievementModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-cyan-300 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 p-6 rounded-3xl text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div><span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20">Level hiện tại</span><h4 className="text-3xl font-black mt-1">Level {levelInfo.level} 👑</h4></div>
                <div className="text-right"><span className="text-xs font-bold text-amber-100">Tổng EXP</span><p className="text-2xl font-mono font-black tabular-nums">{totalExp}</p></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-amber-100"><span>Tiến độ lên Level {levelInfo.level + 1}</span><span className="tabular-nums">{levelInfo.currentExp} / {levelInfo.nextLevelExp} EXP ({levelInfo.percent}%)</span></div>
                <div className="h-3 w-full bg-black/25 rounded-full overflow-hidden p-0.5"><div className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: `${levelInfo.percent}%` }} /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-100 dark:border-cyan-500/20 flex flex-col gap-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Mục tiêu & Cột mốc</span><span className="font-black text-emerald-600 dark:text-emerald-400 text-lg tabular-nums">+{completedMilestonesExp} EXP</span></div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-100 dark:border-cyan-500/20 flex flex-col gap-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Tập trung (Pomodoro)</span><span className="font-black text-cyan-600 dark:text-cyan-400 text-lg tabular-nums">+{focusExp} EXP</span></div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-100 dark:border-cyan-500/20 flex flex-col gap-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Bài tập hoàn thành</span><span className="font-black text-blue-600 dark:text-blue-400 text-lg tabular-nums">+{taskExp} EXP</span></div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-100 dark:border-cyan-500/20 flex flex-col gap-1"><span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px]">Kỳ thi & Kiểm tra</span><span className="font-black text-purple-600 dark:text-purple-400 text-lg tabular-nums">+{examExp} EXP</span></div>
            </div>
            <button onClick={() => setIsAchievementModalOpen(false)} className="w-full py-4 bg-slate-900 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-500 text-white dark:text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition hover:scale-[1.02] interactive-spring shadow-xl">Đóng bảng thành tích</button>
          </div>
        </div>
      )}

      {/* Add Goal Modal - LUXURY NAVY DIALOG */}
      {isAddingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border border-slate-200 dark:border-cyan-500/35 rounded-[32px] w-full max-w-md p-8 dialog-depth-shadow space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tạo mục tiêu học tập mới</h2>
            <div className="space-y-4">
              <div><label className="block text-[10px] font-black uppercase text-slate-400 dark:text-cyan-300 mb-2">Tên lộ trình</label><input type="text" value={newGoalData.title} onChange={e => setNewGoalData({ ...newGoalData, title: e.target.value })} placeholder="VD: Ôn thi Học kỳ I Toán 12" className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-cyan-500/30 text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-[10px] font-black uppercase text-slate-400 dark:text-cyan-300 mb-2">Môn học</label><input type="text" value={newGoalData.subject} onChange={e => setNewGoalData({ ...newGoalData, subject: e.target.value })} placeholder="VD: Toán học" className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-cyan-500/30 text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-cyan-500" /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsAddingGoal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-[#09152b] text-slate-500 dark:text-slate-300 font-black text-xs uppercase interactive-spring">Hủy</button>
              <button onClick={handleAddNewGoal} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase shadow-lg shadow-cyan-500/30 interactive-spring">Tạo lộ trình</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Modal - LUXURY NAVY DIALOG */}
      {isAddingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border border-slate-200 dark:border-cyan-500/35 rounded-[32px] w-full max-w-md p-6 sm:p-8 dialog-depth-shadow space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-cyan-900/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Thêm Cột Mốc Mới
                  </h3>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                    Lộ trình: {activeGoal?.subject} • {activeGoal?.title}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingMilestone(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-cyan-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-cyan-300 mb-1.5">
                  Tên cột mốc nhiệm vụ
                </label>
                <input
                  type="text"
                  value={newMilestoneData.title}
                  onChange={e => setNewMilestoneData({ ...newMilestoneData, title: e.target.value })}
                  placeholder="VD: Mốc 5: Luyện 10 đề thi thử"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-cyan-500/30 text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-cyan-300 mb-1.5">
                  Mô tả chi tiết / Yêu cầu
                </label>
                <textarea
                  value={newMilestoneData.description}
                  onChange={e => setNewMilestoneData({ ...newMilestoneData, description: e.target.value })}
                  placeholder="VD: Đạt điểm từ 8.0 trở lên trong các đề kiểm tra thử..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-cyan-500/30 text-slate-900 dark:text-white font-medium text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setIsAddingMilestone(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-[#09152b] text-slate-600 dark:text-slate-300 font-bold text-xs interactive-spring"
              >
                Hủy
              </button>
              <button
                onClick={handleAddMilestone}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/30 interactive-spring"
              >
                Thêm vào Bản đồ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Goal Confirmation Modal (USER REQUESTED: Nút sọt rác xoá lộ trình) */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border border-slate-200 dark:border-rose-500/35 rounded-3xl p-6 dialog-depth-shadow space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Xoá lộ trình học tập?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  "{goalToDelete.title}"
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc muốn xoá toàn bộ lộ trình này cùng tất cả các cột mốc bên trong không? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-cyan-900/40">
              <button
                onClick={() => setGoalToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#09152b] transition interactive-spring"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDeleteGoal}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition active:scale-95 flex items-center gap-1.5 interactive-spring"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá lộ trình</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Mood Day Check-in Modal - LUXURY NAVY DIALOG */}
      {isCheckInModalOpen && selectedDayMood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border border-slate-200 dark:border-cyan-500/35 rounded-3xl w-full max-w-md p-6 dialog-depth-shadow space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-cyan-900/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center font-bold">
                  <Smile className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Ghi Nhận Cảm Xúc • {selectedDayMood.dayLabel} ({selectedDayMood.dateStr})
                  </h3>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                    Tích lũy vào biểu đồ đánh giá tâm lý tuần
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCheckInModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-cyan-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mood Options */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-cyan-300 tracking-wider">
                Tâm trạng hôm đó thế nào?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['great', 'good', 'okay', 'stressed', 'tired'] as const).map((type) => {
                  const cfg = MOOD_LEVELS[type];
                  const isSelected = inputMoodType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInputMoodType(type)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer interactive-spring ${
                        isSelected 
                          ? 'ring-2 ring-cyan-400 bg-cyan-50 dark:bg-cyan-950/70 border-cyan-400 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                          : 'bg-slate-50 dark:bg-[#071326] border-slate-200 dark:border-cyan-500/20 hover:bg-slate-100 dark:hover:bg-[#0d1e3d]'
                      }`}
                    >
                      <span className="text-2xl">{cfg.emoji}</span>
                      <span className="text-[9px] font-black truncate w-full text-slate-900 dark:text-white">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy Level (1-5) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 dark:text-cyan-300">
                <span>Mức độ năng lượng học tập</span>
                <span className="text-amber-400 font-black">{inputEnergy} / 5 Sao</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 dark:bg-[#071326] rounded-2xl border border-slate-100 dark:border-cyan-500/20">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setInputEnergy(lvl)}
                    className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${
                      lvl <= inputEnergy ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-cyan-300 tracking-wider">
                Ghi chú ngắn về ngày học (áp lực, cảm hứng, nguyên nhân)
              </label>
              <textarea
                value={inputMoodNote}
                onChange={(e) => setInputMoodNote(e.target.value)}
                placeholder="VD: Làm xong đề Toán 12 cảm giác rất tự tin..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-cyan-500/30 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#09152b] text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition interactive-spring"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveDayMood}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/30 flex items-center gap-1.5 interactive-spring cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Ghi Nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <GroupStudyModal isOpen={isGroupStudyOpen} onClose={() => setIsGroupStudyOpen(false)} studentProfile={studentProfile} />

      <StudySurveyModal 
        isOpen={showSurvey} 
        onClose={() => setShowSurvey(false)} 
        onSubmit={handleSurveySubmit} 
      />

      {isAnalyzing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="p-8 bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border border-slate-200 dark:border-cyan-500/35 rounded-3xl dialog-depth-shadow flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">AI đang phân tích lộ trình của bạn...</p>
          </div>
        </div>
      )}
    </div>
  );
};
