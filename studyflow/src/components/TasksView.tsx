import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar, 
  BookMarked, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Search, 
  AlertTriangle,
  Workflow,
  ChevronDown,
  Maximize2,
  MoreHorizontal,
  GraduationCap,
  Flame,
  FileText,
  MousePointer2,
  Target,
  RefreshCw,
  Clock,
  Sparkles,
  ListPlus,
  ArrowRight,
  Layout,
  Layers,
  Sparkle,
  Settings2,
  Grid,
  List,
  BarChart2,
  Download,
  RotateCcw,
  CheckSquare,
  TrendingUp,
  BrainCircuit,
  Zap,
  Target as TargetIcon,
  BookOpen,
  Image as ImageIcon,
  Cloud,
  Award,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Bell,
  Moon,
  Star,
  Users,
  Archive,
  Play,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskItem, TaskPriority, TaskStatus, TaskSubtask, UserRole, ViewTab, DayFocusSession, StudentProfile } from '../types';
import { formatDate, addDays } from '../data/initialData';
import { SUBJECT_ROADMAPS, SubjectRoadmap, RoadmapBranch } from '../data/subjectRoadmaps';
import { SmartBalanceModal } from './SmartBalanceModal';
import { calculateSmartTaskPriority } from '../utils/studyBalanceUtils';
import { StudyRoadmapMilestoneBar } from './StudyRoadmapMilestoneBar';

interface TasksViewProps {
  tasks: TaskItem[];
  role: UserRole;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
  onUpdateTask?: (task: TaskItem) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectTab?: (tab: ViewTab) => void;
  sessions?: DayFocusSession;
  studentProfile?: StudentProfile;
}

const COMMON_SUBJECTS = [
  { name: 'Toán', color: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', lightBg: 'bg-purple-50 dark:bg-purple-950/40', icon: '🧮' },
  { name: 'Vật lý', color: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-200', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40', icon: '⚡' },
  { name: 'Hóa học', color: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200', lightBg: 'bg-rose-50 dark:bg-rose-950/40', icon: '🧪' },
  { name: 'Ngữ văn', color: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', lightBg: 'bg-amber-50 dark:bg-amber-950/40', icon: '📖' },
  { name: 'Tiếng Anh', color: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-200', lightBg: 'bg-teal-50 dark:bg-teal-950/40', icon: '🔤' },
  { name: 'Sinh học', color: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', icon: '🧬' },
  { name: 'Lịch sử', color: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', lightBg: 'bg-red-50 dark:bg-red-950/40', icon: '🏛️' },
  { name: 'Địa lí', color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', lightBg: 'bg-blue-50 dark:bg-blue-950/40', icon: '🌍' },
  { name: 'GDCD', color: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200', lightBg: 'bg-orange-50 dark:bg-orange-950/40', icon: '⚖️' }
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  role,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  searchQuery = '',
  onSearchChange,
  onSelectTab,
  sessions = {},
  studentProfile
}) => {
  const [isRoadmapExpanded, setIsRoadmapExpanded] = useState(true);
  const [activeSubject, setActiveSubject] = useState('all');
  const [quickInput, setQuickInput] = useState('');
  const [quickSubject, setQuickSubject] = useState('Toán');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [sortMode, setSortMode] = useState<'deadline-smart' | 'auto' | 'manual'>('auto');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectAll, setSelectAll] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  // Synchronized state with StatsView
  const defaultSubjectScores = [
    { name: 'Toán học', score: 8.5, target: 9.0 },
    { name: 'Vật lý', score: 8.2, target: 8.8 },
    { name: 'Hóa học', score: 7.8, target: 8.5 },
    { name: 'Ngữ văn', score: 8.0, target: 8.5 },
    { name: 'Tiếng Anh', score: 9.2, target: 9.5 },
    { name: 'Sinh học', score: 8.8, target: 9.0 },
    { name: 'Lịch sử', score: 8.0, target: 8.5 },
    { name: 'Địa lí', score: 8.2, target: 8.8 },
    { name: 'GDCD', score: 8.7, target: 9.0 }
  ];

  const [statsScores, setStatsScores] = useState<{ name: string; score: number; target: number }[]>(() => {
    try {
      const saved = localStorage.getItem('studyflow_subject_scores');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSubjectScores;
  });

  const [gpaGoal, setGpaGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('studyflow_gpa_goal');
      return saved ? parseFloat(saved) : 8.8;
    } catch {
      return 8.8;
    }
  });

  // Modal to edit score & target for active subject
  const [scoreEditModal, setScoreEditModal] = useState<{
    isOpen: boolean;
    subjectName: string;
    score: number;
    target: number;
  }>({
    isOpen: false,
    subjectName: '',
    score: 8.5,
    target: 9.0
  });

  // Modal for Delete Confirmation dialogue with depth shadow
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // Sync listener with Stats page updates in real-time
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('studyflow_subject_scores');
        if (saved) setStatsScores(JSON.parse(saved));
        const savedGoal = localStorage.getItem('studyflow_gpa_goal');
        if (savedGoal) setGpaGoal(parseFloat(savedGoal));
      } catch {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('studyflow_scores_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('studyflow_scores_updated', handleSync);
    };
  }, []);

  const getSubjectScore = (subName: string) => {
    const clean = subName.toLowerCase().replace(/học|môn/g, '').trim();
    const found = statsScores.find(s => {
      const sClean = s.name.toLowerCase().replace(/học|môn/g, '').trim();
      return sClean === clean || sClean.includes(clean) || clean.includes(sClean);
    });
    return found || { name: subName, score: 8.0, target: 8.5 };
  };

  const handleSaveSubjectScore = () => {
    const cleanTarget = scoreEditModal.subjectName.toLowerCase().replace(/học|môn/g, '').trim();
    let hasUpdated = false;
    const updated = statsScores.map(s => {
      const sClean = s.name.toLowerCase().replace(/học|môn/g, '').trim();
      if (sClean === cleanTarget || sClean.includes(cleanTarget) || cleanTarget.includes(sClean)) {
        hasUpdated = true;
        return { ...s, score: scoreEditModal.score, target: scoreEditModal.target };
      }
      return s;
    });

    if (!hasUpdated) {
      updated.push({
        name: scoreEditModal.subjectName,
        score: scoreEditModal.score,
        target: scoreEditModal.target
      });
    }

    setStatsScores(updated);
    try {
      localStorage.setItem('studyflow_subject_scores', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('studyflow_scores_updated', { detail: updated }));
    } catch {}
    setScoreEditModal(prev => ({ ...prev, isOpen: false }));
  };

  // Form State for Add Task Modal (image_5e7c9521.png)
  const [formTitle, setFormDataTitle] = useState('');
  const [formSubject, setFormDataSubject] = useState('Toán');
  const [formWeight, setFormDataWeight] = useState('Hệ số 2');
  const [formDeadline, setFormDataDeadline] = useState(formatDate(addDays(new Date(), 1)));
  const [formImportance, setFormDataImportance] = useState(5);
  const [formQuadrant, setFormDataQuadrant] = useState(2);
  const [formNote, setFormDataNote] = useState('');
  const [formEstHours, setFormDataEstHours] = useState('1.5');
  const [aiInsight, setAiInsight] = useState('Nhập nội dung để AI phân loại...');

  const today = new Date();
  
  // Mock NLP Logic
  useEffect(() => {
    if (!formTitle.trim()) {
      setAiInsight('Nhập nội dung để AI phân loại...');
      return;
    }
    const t = formTitle.toLowerCase();
    if (t.includes('mai') || t.includes('ngay lập tức') || t.includes('kiểm tra')) {
      setFormDataQuadrant(1);
      setAiInsight("AI NLP: Nhận diện 'Mai thi' -> Rất khẩn cấp & quyết định điểm số");
    } else if (t.includes('tuần sau') || t.includes('tiểu luận') || t.includes('dự án')) {
      setFormDataQuadrant(2);
      setAiInsight("AI NLP: Nhận diện 'Tuần sau' -> Quan trọng dài hạn, cần lập kế hoạch");
    } else if (t.includes('photo') || t.includes('nhóm') || t.includes('mua')) {
      setFormDataQuadrant(3);
      setAiInsight("AI NLP: Nhận diện 'Photo/Nhóm' -> Khẩn cấp nhưng có thể ủy quyền/phụ trợ");
    } else {
      setFormDataQuadrant(4);
      setAiInsight("AI NLP: Nội dung giải trí/đọc thêm -> Ít ưu tiên hơn");
    }
  }, [formTitle]);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [filterQuadrant, setFilterQuadrant] = useState<number | 'all'>('all');

  const handleOpenAddModal = () => {
    setEditingTaskId(null);
    setFormDataTitle('');
    setFormDataSubject(activeSubject !== 'all' ? activeSubject : 'Toán');
    setFormDataWeight('Hệ số 2');
    setFormDataDeadline(formatDate(addDays(new Date(), 1)));
    setFormDataImportance(5);
    setFormDataQuadrant(2);
    setFormDataNote('');
    setFormDataEstHours('1.5');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setFormDataTitle(task.t);
    setFormDataSubject(task.sub || 'Toán');
    setFormDataWeight(task.weight ? (task.weight.includes('3') ? 'Hệ số 3' : task.weight.includes('1') ? 'Hệ số 1' : 'Hệ số 2') : 'Hệ số 2');
    setFormDataDeadline(task.due || formatDate(addDays(new Date(), 1)));
    setFormDataImportance(task.priority === 'high' ? 9 : task.priority === 'medium' ? 6 : 3);
    setFormDataQuadrant(task.quadrant || (task.priority === 'high' ? 1 : 2));
    setFormDataNote(task.note || '');
    setFormDataEstHours('1.5');
    setIsAddModalOpen(true);
  };

  const handleSaveTaskForm = () => {
    if (!formTitle.trim()) return;
    const priorityVal: TaskPriority = formQuadrant === 1 ? 'high' : formQuadrant === 2 ? 'medium' : 'low';
    const weightVal = formWeight.includes('3') ? 'HS 3' : formWeight.includes('1') ? 'HS 1' : 'HS 2';
    const actionBadgeVal = formQuadrant === 1 ? '⚡ Xử lý ngay' : formQuadrant === 2 ? '🎯 Lên lịch ôn' : formQuadrant === 3 ? '👥 Ủy quyền' : '💡 Ý tưởng';

    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing && onUpdateTask) {
        onUpdateTask({
          ...existing,
          t: formTitle.trim(),
          sub: formSubject,
          due: formDeadline,
          priority: priorityVal,
          hi: formQuadrant === 1,
          quadrant: formQuadrant as 1 | 2 | 3 | 4,
          weight: weightVal,
          actionBadge: actionBadgeVal,
          note: formNote || existing.note,
        });
      }
    } else {
      onAddTask({
        t: formTitle.trim(),
        sub: formSubject,
        due: formDeadline,
        priority: priorityVal,
        status: 'todo',
        done: false,
        hi: formQuadrant === 1,
        quadrant: formQuadrant as 1 | 2 | 3 | 4,
        weight: weightVal,
        actionBadge: actionBadgeVal,
        note: formNote || `Trọng số: ${formWeight}. Ước tính: ${formEstHours}h`,
        subtasks: []
      });
    }
    setIsAddModalOpen(false);
    setEditingTaskId(null);
  };

  const handleAddSubtask = (taskId: number, text: string) => {
    if (!text.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSub: TaskSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      done: false
    };
    const updated: TaskItem = {
      ...task,
      subtasks: [...(task.subtasks || []), newSub]
    };
    if (onUpdateTask) {
      onUpdateTask(updated);
    }
  };

  const handleDeleteSubtask = (taskId: number, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated: TaskItem = {
      ...task,
      subtasks: (task.subtasks || []).filter(s => s.id !== subtaskId)
    };
    if (onUpdateTask) {
      onUpdateTask(updated);
    }
  };

  const subjectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.sub) stats[t.sub] = (stats[t.sub] || 0) + 1;
    });
    return stats;
  }, [tasks]);

  const activeRoadmap = useMemo(() => {
    return SUBJECT_ROADMAPS[activeSubject] || SUBJECT_ROADMAPS['Toán'];
  }, [activeSubject]);

  const currentScoreInfo = useMemo(() => {
    return getSubjectScore(activeSubject === 'all' ? 'Toán' : activeSubject);
  }, [activeSubject, statsScores]);

  const currentSubjectTasks = useMemo(() => {
    if (activeSubject === 'all') return tasks;
    const clean = activeSubject.toLowerCase().replace(/học|môn/g, '').trim();
    return tasks.filter(t => {
      if (!t.sub) return false;
      const subClean = t.sub.toLowerCase().replace(/học|môn/g, '').trim();
      return subClean === clean || subClean.includes(clean) || clean.includes(subClean);
    });
  }, [tasks, activeSubject]);

  const avgOverallScore = useMemo(() => {
    if (statsScores.length === 0) return 8.5;
    return statsScores.reduce((acc, s) => acc + s.score, 0) / statsScores.length;
  }, [statsScores]);

  const sortedAndFilteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      if (activeSubject !== 'all' && t.sub !== activeSubject) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterQuadrant !== 'all' && (t.quadrant || (t.priority === 'high' ? 1 : 2)) !== filterQuadrant) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (t.t || '').toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q);
      }
      return true;
    });

    if (sortMode === 'deadline-smart') {
      result.sort((a, b) => {
        // Unfinished tasks first
        if (a.done !== b.done) return a.done ? 1 : -1;
        const aMeta = calculateSmartTaskPriority(a, statsScores);
        const bMeta = calculateSmartTaskPriority(b, statsScores);
        if (aMeta.totalScore !== bMeta.totalScore) return bMeta.totalScore - aMeta.totalScore;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
      });
    } else if (sortMode === 'auto') {
      result.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const getPoints = (p: TaskPriority | undefined) => {
          if (p === 'high') return 3;
          if (p === 'medium') return 2;
          return 1;
        };
        const aPoints = getPoints(a.priority);
        const bPoints = getPoints(b.priority);
        if (aPoints !== bPoints) return bPoints - aPoints;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
      });
    }
    return result;
  }, [tasks, activeSubject, searchQuery, sortMode, filterPriority, statsScores]);

  // Urgent tasks queue based on Stats score gap and Deadline
  const urgentDeadlineTasks = useMemo(() => {
    return tasks
      .filter(t => !t.done)
      .map(t => ({
        task: t,
        meta: calculateSmartTaskPriority(t, statsScores)
      }))
      .sort((a, b) => b.meta.totalScore - a.meta.totalScore)
      .slice(0, 3);
  }, [tasks, statsScores]);

  const handleAddQuickTask = () => {
    if (!quickInput.trim()) return;
    onAddTask({
      t: quickInput.trim(),
      sub: quickSubject,
      due: formatDate(addDays(today, 2)),
      priority: quickPriority,
      status: 'todo',
      done: false,
      hi: quickPriority === 'high',
      note: 'Được tạo nhanh từ lộ trình',
      subtasks: []
    });
    setQuickInput('');
  };

  const getSubjectIcon = (name: string) => {
    switch (name) {
      case 'Toán': return <CalculatorIcon />;
      case 'Vật lý': return <Flame className="w-3 h-3" />;
      case 'Hóa học': return <Target className="w-3 h-3" />;
      case 'Ngữ văn': return <BookMarked className="w-3 h-3" />;
      case 'Tiếng Anh': return <GlobeIcon />;
      case 'Sinh học': return <Sparkles className="w-3 h-3" />;
      case 'Lịch sử': return <HistoryIcon />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  const handleMoveQuadrant = (taskId: number, newQuad: 1 | 2 | 3 | 4) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated: TaskItem = {
      ...task,
      quadrant: newQuad,
      priority: newQuad === 1 ? 'high' : newQuad === 2 ? 'medium' : 'low',
      hi: newQuad === 1
    };
    if (onUpdateTask) {
      onUpdateTask(updated);
    }
  };

  const handleToggleSubtask = (taskId: number, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks.map(st => 
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    const updated: TaskItem = {
      ...task,
      subtasks: updatedSubtasks
    };
    if (onUpdateTask) {
      onUpdateTask(updated);
    }
  };

  const handleUpdateNote = (taskId: number, newNote: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated: TaskItem = {
      ...task,
      note: newNote
    };
    if (onUpdateTask) {
      onUpdateTask(updated);
    }
  };

  const handleExportTasks = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `studyflow_tasks_${formatDate(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const matrixQuadrants = useMemo(() => {
    const quadrants = {
      q1: [] as TaskItem[], 
      q2: [] as TaskItem[], 
      q3: [] as TaskItem[], 
      q4: [] as TaskItem[]
    };
    tasks.forEach(task => {
      // Filter by subject & priority if selected
      if (activeSubject !== 'all' && task.sub !== activeSubject) return;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.t.toLowerCase().includes(q);
        const matchNote = (task.note || '').toLowerCase().includes(q);
        const matchSub = (task.sub || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNote && !matchSub) return;
      }

      if (task.quadrant === 1) {
        quadrants.q1.push(task);
      } else if (task.quadrant === 2) {
        quadrants.q2.push(task);
      } else if (task.quadrant === 3) {
        quadrants.q3.push(task);
      } else if (task.quadrant === 4) {
        quadrants.q4.push(task);
      } else {
        const isHighPriority = task.priority === 'high' || task.hi;
        const isUrgent = task.due && (new Date(task.due).getTime() - today.getTime()) < 3 * 24 * 60 * 60 * 1000;
        if (isHighPriority && isUrgent) quadrants.q1.push(task);
        else if (isHighPriority && !isUrgent) quadrants.q2.push(task);
        else if (!isHighPriority && isUrgent) quadrants.q3.push(task);
        else quadrants.q4.push(task);
      }
    });
    return quadrants;
  }, [tasks, today, activeSubject, filterPriority, searchQuery]);

  const totalTaskCount = tasks.length || 1;
  const analysis = {
    q1: { pct: Math.round((matrixQuadrants.q1.length / totalTaskCount) * 100), done: matrixQuadrants.q1.filter(t => t.done).length, total: matrixQuadrants.q1.length, hours: (matrixQuadrants.q1.length * 2.2).toFixed(1) },
    q2: { pct: Math.round((matrixQuadrants.q2.length / totalTaskCount) * 100), done: matrixQuadrants.q2.filter(t => t.done).length, total: matrixQuadrants.q2.length, hours: (matrixQuadrants.q2.length * 2.0).toFixed(1) },
    q3: { pct: Math.round((matrixQuadrants.q3.length / totalTaskCount) * 100), done: matrixQuadrants.q3.filter(t => t.done).length, total: matrixQuadrants.q3.length, hours: (matrixQuadrants.q3.length * 0.5).toFixed(1) },
    q4: { pct: Math.round((matrixQuadrants.q4.length / totalTaskCount) * 100), done: matrixQuadrants.q4.filter(t => t.done).length, total: matrixQuadrants.q4.length, hours: (matrixQuadrants.q4.length * 1.0).toFixed(1) }
  };

  return (
    <div className="space-y-5 max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-10">
      {/* Top Header Label */}
      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-cyan-400/70 uppercase tracking-widest px-1">
        <span className="text-cyan-500 font-bold">STUDYFLOW TASKS</span>
      </div>

      {/* Main Title Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30 interactive-spring">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Tasks
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                {tasks.filter(t => !t.done).length} việc cần làm
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button 
              onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 border border-cyan-400/40 interactive-spring cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="text-[10px] font-black uppercase tracking-wider">Tạo mới</span>
              <ChevronDown className={`w-3 h-3 opacity-70 transition-transform ${isCreateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isCreateDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#071328] border border-slate-200 dark:border-cyan-500/30 rounded-2xl shadow-2xl dialog-depth-shadow z-50 p-1.5"
                >
                  <button onClick={handleOpenAddModal} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-cyan-200 hover:bg-slate-50 dark:hover:bg-cyan-950/50 hover:text-cyan-300 transition text-left cursor-pointer">
                    <ListPlus className="w-4 h-4 text-cyan-400" /> Nhiệm vụ mới
                  </button>
                  <button onClick={() => { setIsCreateDropdownOpen(false); setIsRoadmapExpanded(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-cyan-200 hover:bg-slate-50 dark:hover:bg-cyan-950/50 hover:text-cyan-300 transition text-left cursor-pointer">
                    <Workflow className="w-4 h-4 text-indigo-400" /> Lộ trình AI
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => onSelectTab && onSelectTab('focus')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-400/40 interactive-spring cursor-pointer"
          >
             <div className="p-1 rounded-md bg-white/20">
               <ChevronRight className="w-3 h-3 fill-current" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-wider">Bắt đầu học</span>
          </button>
        </div>
      </div>

      {/* Top Study Tasks Horizontal Cards (Elevated Luxury Navy Glass Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {tasks.slice(0, 5).map((task) => {
          const subStr = task.sub || 'Môn học';
          const deadlineBadge = getDeadlineBadge(task.due);

          const priorityBadge = task.priority === 'high' && task.hi ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 flex items-center gap-1 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.2)]">
              ⚡ Khẩn cấp
            </span>
          ) : task.priority === 'high' ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center gap-1 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
              🔥 Ưu tiên Cao
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 flex items-center gap-1 shrink-0">
              📌 Ưu tiên Vừa
            </span>
          );

          return (
            <div
              key={task.id}
              className={`bg-white/95 dark:bg-gradient-to-b dark:from-[#09152b] dark:via-[#071324] dark:to-[#040a16] border border-slate-200/90 dark:border-cyan-500/25 rounded-2xl p-4 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(6,182,212,0.08)] hover:dark:border-cyan-400/50 hover:dark:shadow-[0_12px_35px_rgba(6,182,212,0.18)] transition-all flex flex-col justify-between space-y-3 group interactive-spring hover:-translate-y-1 ${
                task.done ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/40' : ''
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="shrink-0 transition-transform active:scale-90 cursor-pointer"
                      title={task.done ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                    >
                      {task.done ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/40">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-cyan-800 hover:border-cyan-400 transition-colors" />
                      )}
                    </button>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider truncate border ${getSubjectColorBadge(subStr)}`}>
                      {subStr.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {priorityBadge}
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-400 rounded-md transition cursor-pointer"
                      title="Sửa nhiệm vụ"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h4 className={`text-xs sm:text-[13px] font-extrabold leading-snug line-clamp-2 ${
                  task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                }`}>
                  {task.t}
                </h4>

                {(task.targetGap || task.aiReason) && !task.done && (
                  <p className="text-[11px] text-slate-400 dark:text-cyan-300/70 line-clamp-1 leading-tight">
                    {task.targetGap || task.aiReason}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-cyan-950/60">
                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{task.due || deadlineBadge.label}</span>
                </div>
                <button
                  onClick={() => onSelectTab && onSelectTab('focus')}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:underline shrink-0 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> Học
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roadmap Visualization */}
      <div className="bg-white dark:bg-gradient-to-b dark:from-[#09152b] dark:via-[#071324] dark:to-[#040a16] border border-slate-200/90 dark:border-cyan-500/30 rounded-[32px] overflow-hidden shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_25px_rgba(6,182,212,0.1)] transition-all duration-300">
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Lộ Trình Học Tập</h2>
                <p className="text-[10px] text-slate-500 dark:text-cyan-300/70 font-bold mt-0.5">Tự động hóa lộ trình dựa trên lịch học & bài tập</p>
              </div>
            </div>
            <button 
              onClick={() => setIsRoadmapExpanded(!isRoadmapExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-600 dark:text-cyan-300 text-[10px] font-black uppercase hover:bg-slate-100 dark:hover:bg-cyan-950/40 interactive-spring cursor-pointer"
            >
              {isRoadmapExpanded ? 'Thu gọn' : 'Mở rộng'} 
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isRoadmapExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <AnimatePresence>
            {isRoadmapExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Quick Add Bar for Roadmap with Neon Glow Border */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-[#071328] border border-slate-200/80 dark:border-cyan-900/60 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-500/20 transition-all">
                  <div className="flex-1 flex items-center gap-2 px-3">
                    <Plus className="w-4 h-4 text-cyan-400 shrink-0 stroke-[3]" />
                    <input 
                      type="text"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddQuickTask()}
                      placeholder="Nhập nhanh bài tập (VD: Ôn tập Hình học 12) -> Tự động đồng bộ Lộ Trình & To-do..."
                      className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-cyan-500/50 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleAddQuickTask}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 border border-cyan-400/40 interactive-spring cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm vào Lộ trình</span>
                    </button>
                  </div>
                </div>

                {/* Subject Filter Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  <button 
                    onClick={() => setActiveSubject('all')}
                    className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all interactive-spring cursor-pointer shadow-xs ${
                      activeSubject === 'all' 
                        ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 text-white border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105' 
                        : 'bg-slate-100 dark:bg-[#071933] text-slate-600 dark:text-cyan-200 border border-transparent dark:border-cyan-950 hover:border-cyan-500/40'
                    }`}
                  >
                    Tất cả các môn ({COMMON_SUBJECTS.length})
                  </button>
                  {COMMON_SUBJECTS.map(sub => {
                    const count = subjectStats[sub.name] || 0;
                    const isActive = activeSubject === sub.name;
                    return (
                      <button 
                        key={sub.name}
                        onClick={() => setActiveSubject(sub.name)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all border interactive-spring cursor-pointer ${
                          isActive 
                            ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 text-white border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105' 
                            : `${sub.lightBg} ${sub.text} border-slate-200/60 dark:border-cyan-950 hover:border-cyan-500/30 hover:scale-[1.02]`
                        }`}
                      >
                        <span>{sub.icon}</span>
                        <span>{sub.name}</span>
                        {count > 0 && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            isActive ? 'bg-white/30 text-white' : 'bg-white dark:bg-[#071328] text-slate-700 dark:text-cyan-300 border border-slate-200/60 dark:border-cyan-900/50'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Subject Stats & Strategy Header (Data pulled from Statistics page) */}
                {activeSubject !== 'all' && (
                  <div className="bg-gradient-to-r from-cyan-950/40 via-[#071328]/95 to-indigo-950/40 border border-cyan-500/30 rounded-3xl p-5 space-y-4 shadow-[0_8px_30px_rgba(6,182,212,0.12)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{activeRoadmap.icon}</span>
                          <h3 className="text-base font-black text-slate-900 dark:text-cyan-100">
                            Lộ trình môn {activeSubject}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            Dữ liệu Thống Kê
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-cyan-200/70 max-w-2xl leading-relaxed">
                          {activeRoadmap.summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => setShowBalanceModal(true)}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a1935] border border-cyan-500/30 text-xs font-black text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/60 shadow-xs flex items-center gap-1.5 transition interactive-spring cursor-pointer"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Phân bổ & Cân bằng</span>
                          </button>

                          <button
                            onClick={() => setScoreEditModal({
                              isOpen: true,
                              subjectName: activeSubject,
                              score: currentScoreInfo.score,
                              target: currentScoreInfo.target
                            })}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a1935] border border-indigo-500/30 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400/60 shadow-xs flex items-center gap-1.5 transition interactive-spring cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa điểm & mục tiêu</span>
                          </button>

                          <button
                            onClick={() => onSelectTab && onSelectTab('stats')}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition interactive-spring cursor-pointer"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>Mở trang Thống Kê</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4 Real-time Metric Cards from Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="bg-white/90 dark:bg-[#071328]/95 border border-cyan-500/20 hover:border-cyan-400/50 p-3.5 rounded-2xl shadow-xs space-y-1 transition interactive-spring hover:-translate-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 dark:text-cyan-400/70">
                          <span>Điểm Hiện Tại</span>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          {currentScoreInfo.score.toFixed(1)} <span className="text-xs text-slate-400 dark:text-cyan-400/50 font-normal">/ 10</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {currentScoreInfo.score >= 9 ? '🌟 Xuất sắc' : currentScoreInfo.score >= 8 ? '🎯 Giỏi' : '📈 Cần bứt phá'}
                        </div>
                      </div>

                      <div className="bg-white/90 dark:bg-[#071328]/95 border border-rose-500/20 hover:border-rose-400/50 p-3.5 rounded-2xl shadow-xs space-y-1 transition interactive-spring hover:-translate-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 dark:text-rose-400/70">
                          <span>Mục Tiêu Đặt Ra</span>
                          <Target className="w-3.5 h-3.5 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                        </div>
                        <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                          {currentScoreInfo.target.toFixed(1)} <span className="text-xs text-slate-400 dark:text-rose-400/50 font-normal">/ 10</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-cyan-200/60">
                          {currentScoreInfo.target - currentScoreInfo.score > 0 
                            ? `Cần +${(currentScoreInfo.target - currentScoreInfo.score).toFixed(1)} điểm`
                            : 'Đạt hoặc vượt mục tiêu 🎉'}
                        </div>
                      </div>

                      <div className="bg-white/90 dark:bg-[#071328]/95 border border-cyan-500/20 hover:border-cyan-400/50 p-3.5 rounded-2xl shadow-xs space-y-1 transition interactive-spring hover:-translate-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 dark:text-cyan-400/70">
                          <span>Tiến Độ Bài Tập</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                        </div>
                        <div className="text-lg font-black text-cyan-600 dark:text-cyan-300">
                          {currentSubjectTasks.filter(t => t.done).length} / {currentSubjectTasks.length}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-cyan-200/60">
                          {currentSubjectTasks.length > 0 
                            ? `Hoàn thành ${Math.round((currentSubjectTasks.filter(t => t.done).length / currentSubjectTasks.length) * 100)}%`
                            : 'Chưa có bài tập'}
                        </div>
                      </div>

                      <div className="bg-white/90 dark:bg-[#071328]/95 border border-indigo-500/20 hover:border-indigo-400/50 p-3.5 rounded-2xl shadow-xs space-y-1 transition interactive-spring hover:-translate-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 dark:text-indigo-400/70">
                          <span>Mục Tiêu GPA Chung</span>
                          <Award className="w-3.5 h-3.5 text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.5)]" />
                        </div>
                        <div className="text-lg font-black text-indigo-600 dark:text-indigo-300">
                          {gpaGoal.toFixed(1)} <span className="text-xs text-slate-400 dark:text-indigo-400/50 font-normal">GPA</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-cyan-200/60">
                          Đồng bộ Trang Thống Kê
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mind Map Visualization (Dynamic per Subject & All Subjects) */}
                <div className="relative py-8 px-2 overflow-x-auto custom-scrollbar min-h-[350px]">
                  {activeSubject === 'all' ? (
                    /* Master Roadmap Hub connecting all 9 subjects */
                    <div className="space-y-6 min-w-[850px] max-w-5xl mx-auto">
                      {/* Top GPA Cards & vnEdu SSO Portal Banner (Image 2) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Card 1: Khóa học & Bảng điểm GPA (Left 7 cols on lg) */}
                        <div className="lg:col-span-7 bg-white dark:bg-gradient-to-br dark:from-[#091730] dark:via-[#071326] dark:to-[#040914] border border-slate-200/80 dark:border-cyan-500/25 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-[0_8px_30px_rgba(6,182,212,0.1)] flex flex-col justify-between space-y-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
                                  <GraduationCap className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                                  <span>HỌC KỲ 1 • LỚP {studentProfile?.className || '12A1'}</span>
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-cyan-100">
                                  Khóa học & Bảng điểm GPA
                                </h3>
                              </div>
                              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] shrink-0">
                                {avgOverallScore >= 8.0 ? 'Học sinh Giỏi' : avgOverallScore >= 6.5 ? 'Học sinh Khá' : 'Học sinh Xuất sắc'}
                              </span>
                            </div>

                            {/* 3 Metric Box Columns */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-slate-50/80 dark:bg-[#071328]/95 border border-slate-200/60 dark:border-cyan-900/50 rounded-2xl p-3.5 space-y-1 transition interactive-spring hover:-translate-y-0.5">
                                <div className="text-[9px] font-black uppercase text-slate-400 dark:text-cyan-400/60 tracking-wider">
                                  THANG ĐIỂM 10
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-300">
                                  {avgOverallScore.toFixed(2)}
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 dark:text-cyan-200/60 flex items-center gap-1">
                                  <span>📈 GPA Tích lũy</span>
                                </div>
                              </div>

                              <div className="bg-emerald-50/50 dark:bg-[#071328]/95 border border-emerald-200/60 dark:border-emerald-900/50 rounded-2xl p-3.5 space-y-1 transition interactive-spring hover:-translate-y-0.5">
                                <div className="text-[9px] font-black uppercase text-slate-400 dark:text-emerald-400/60 tracking-wider">
                                  THANG ĐIỂM 4
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                  {(avgOverallScore >= 8.5 ? 3.5 : (avgOverallScore / 10) * 4).toFixed(1)}
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 dark:text-cyan-200/60 flex items-center gap-1">
                                  <span>🎓 Quy đổi tín chỉ</span>
                                </div>
                              </div>

                              <div className="bg-indigo-50/50 dark:bg-[#071328]/95 border border-indigo-200/60 dark:border-indigo-900/50 rounded-2xl p-3.5 space-y-1 transition interactive-spring hover:-translate-y-0.5">
                                <div className="text-[9px] font-black uppercase text-slate-400 dark:text-indigo-400/60 tracking-wider">
                                  MỤC TIÊU
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-300">
                                  {gpaGoal.toFixed(1)}
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 dark:text-cyan-200/60 flex items-center gap-1">
                                  <span>🎯 Kỳ học này</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Warning / Progress Banner */}
                          <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium">
                            <AlertTriangle className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] shrink-0" />
                            <span>
                              {gpaGoal > avgOverallScore 
                                ? `Cách mục tiêu ${(gpaGoal - avgOverallScore).toFixed(2)} điểm. Cần cải thiện ở các bài kiểm tra hệ số 2.`
                                : 'Bạn đã hoàn tất vượt chỉ tiêu GPA mong muốn! Hãy tiếp tục duy trì phong độ.'}
                            </span>
                          </div>
                        </div>

                        {/* Card 2: Cài đặt mục tiêu GPA môn học (Right 5 cols on lg) */}
                        <div className="lg:col-span-5 bg-gradient-to-br from-[#0c2048] via-[#091b3d] to-[#050e20] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-cyan-500/30 relative overflow-hidden flex flex-col justify-between space-y-5">
                          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                          <div className="space-y-2 relative z-10">
                            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-300">
                              <Sparkles className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                              <span>GẮN THẺ MỤC TIÊU HỌC TẬP</span>
                            </div>
                            <h3 className="text-lg font-black text-white">
                              Cài đặt mục tiêu GPA môn học
                            </h3>
                            <p className="text-xs text-cyan-100/80 leading-relaxed">
                              Kéo thanh trượt để đặt lại mục tiêu học tập và theo dõi điểm trung bình tối thiểu cần duy trì.
                            </p>
                          </div>

                          {/* Slider Block */}
                          <div className="space-y-3 bg-[#071328]/80 backdrop-blur-md rounded-2xl p-4 border border-cyan-500/20 relative z-10 shadow-inner">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-cyan-200 uppercase tracking-wider">
                                MỨC GPA KỲ VỌNG
                              </span>
                              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                                {gpaGoal.toFixed(1)} / 10
                              </span>
                            </div>
                            <input 
                              type="range"
                              min="6.0"
                              max="10.0"
                              step="0.1"
                              value={gpaGoal}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setGpaGoal(val);
                                try {
                                  localStorage.setItem('studyflow_gpa_goal', val.toString());
                                  window.dispatchEvent(new CustomEvent('studyflow_scores_updated'));
                                } catch {}
                              }}
                              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-cyan-300/80">
                              <span>Khá (6.5)</span>
                              <span>Giỏi (8.0)</span>
                              <span>Xuất sắc (9.0+)</span>
                            </div>
                          </div>

                          {/* Buttons row */}
                          <div className="flex items-center gap-2 pt-1 relative z-10">
                            <button 
                              onClick={() => setScoreEditModal({
                                isOpen: true,
                                subjectName: activeSubject !== 'all' ? activeSubject : 'Toán',
                                score: currentScoreInfo.score,
                                target: currentScoreInfo.target
                              })}
                              className="flex-1 bg-gradient-to-r from-cyan-500 via-indigo-600 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs py-3 px-4 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.35)] transition interactive-spring cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span>Nhập điểm kiểm tra mới</span>
                            </button>
                            <button 
                              onClick={handleExportTasks}
                              className="bg-white/10 hover:bg-white/20 text-cyan-200 p-3 rounded-2xl border border-cyan-500/30 transition interactive-spring cursor-pointer shrink-0"
                              title="Tải xuất báo cáo điểm & nhiệm vụ"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Card 3: vnEdu SSO Portal Banner (Full 12 cols below) */}
                        <div className="lg:col-span-12 bg-gradient-to-r from-[#071328] via-[#0b1c3c] to-[#091730] text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
                          <div className="flex items-start sm:items-center gap-4 relative z-10">
                            {/* vnEdu Branding badge icon */}
                            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black px-4 py-3 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0 flex flex-col items-center justify-center border border-cyan-300/40">
                              <span className="text-xl tracking-tight leading-none font-extrabold font-sans">vnEdu</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  CỔNG THÔNG TIN GIÁO DỤC VIỆT NAM
                                </span>
                                <span className="text-[10px] font-bold text-cyan-300/70">vnEdu SSO Portal</span>
                              </div>
                              <h3 className="text-base sm:text-lg font-black text-white">
                                Tra cứu Kết quả học tập & Sổ điểm VNEDU
                              </h3>
                              <p className="text-xs text-cyan-100/80 max-w-2xl leading-relaxed">
                                Liên kết trực tiếp tới Cổng thông tin Giáo dục VNEDU để tra cứu điểm thi, sổ liên lạc điện tử và điểm trung bình chính thức từ nhà trường.
                              </p>
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              window.open('https://vnedu.vn', '_blank');
                            }}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-[0_0_18px_rgba(6,182,212,0.4)] transition interactive-spring cursor-pointer flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-center relative z-10"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Mở Cổng vnEdu</span>
                          </button>
                        </div>
                      </div>

                      {/* 9 Subject Cards in Mind Map Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {COMMON_SUBJECTS.map((sub) => {
                          const scoreItem = getSubjectScore(sub.name);
                          const subTasks = tasks.filter(t => t.sub && (t.sub.toLowerCase().includes(sub.name.toLowerCase()) || sub.name.toLowerCase().includes(t.sub.toLowerCase())));
                          const subRoadmap = SUBJECT_ROADMAPS[sub.name] || SUBJECT_ROADMAPS['Toán'];
                          const diff = scoreItem.target - scoreItem.score;

                          return (
                            <div 
                              key={sub.name}
                              className="bg-white dark:bg-[#071328]/95 border border-slate-200/80 dark:border-cyan-500/25 rounded-2xl p-4 shadow-sm hover:border-cyan-400/60 hover:shadow-[0_4px_25px_rgba(6,182,212,0.18)] transition-all flex flex-col justify-between group interactive-spring"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl p-2 rounded-xl bg-slate-50 dark:bg-[#0a1b38] border border-slate-100 dark:border-cyan-900/50">{sub.icon}</span>
                                    <div>
                                      <h4 className="text-xs font-black text-slate-900 dark:text-cyan-100 flex items-center gap-1.5">
                                        <span>{sub.name}</span>
                                        {subTasks.length > 0 && (
                                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-400/30">
                                            {subTasks.length} bài
                                          </span>
                                        )}
                                      </h4>
                                      <span className="text-[10px] text-slate-400 dark:text-cyan-300/60 font-bold">
                                        {subRoadmap.branches.length} chuyên đề trọng tâm
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => setScoreEditModal({
                                      isOpen: true,
                                      subjectName: sub.name,
                                      score: scoreItem.score,
                                      target: scoreItem.target
                                    })}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
                                    title="Sửa điểm số"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Score Bar */}
                                <div className="space-y-1 bg-slate-50 dark:bg-[#050e1f] p-2.5 rounded-xl border border-slate-100 dark:border-cyan-950">
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-slate-500 dark:text-cyan-300/70">Điểm hiện tại: <strong className="text-slate-900 dark:text-white font-black">{scoreItem.score.toFixed(1)}</strong></span>
                                    <span className="text-rose-600 dark:text-rose-400">Mục tiêu: <strong className="font-black">{scoreItem.target.toFixed(1)}</strong></span>
                                  </div>
                                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" 
                                      style={{ width: `${Math.min(100, (scoreItem.score / scoreItem.target) * 100)}%` }}
                                    />
                                  </div>
                                  <div className="text-[9px] text-right font-bold text-slate-400 dark:text-cyan-300/60">
                                    {diff > 0 ? `Cần +${diff.toFixed(1)}đ để đạt` : 'Đã đạt mục tiêu 🎉'}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setActiveSubject(sub.name)}
                                className="mt-3 w-full py-2 rounded-xl bg-slate-100 dark:bg-[#0c2044] hover:bg-cyan-500/10 dark:hover:bg-[#102b5c] text-cyan-700 dark:text-cyan-300 border border-slate-200/60 dark:border-cyan-800/40 text-xs font-bold transition flex items-center justify-center gap-1.5 interactive-spring cursor-pointer"
                              >
                                <span>Khám phá lộ trình môn {sub.name}</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-cyan-400" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Detailed Subject Mind Map with 4 Specialized Pillars & Real Tasks */
                    <div className="space-y-8 min-w-[950px] mx-auto relative">
                      {/* Center Node for Selected Subject */}
                      <div className="flex flex-col items-center justify-center relative z-20">
                        <motion.div 
                          layoutId="roadmap-center"
                          className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 text-white px-8 py-4 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.35)] border border-cyan-300/30 text-center mx-auto w-fit"
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-xl">{activeRoadmap.icon}</span>
                            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-100">
                              Lộ trình Học Tập: {activeSubject}
                            </h3>
                          </div>
                          <div className="flex items-center justify-center gap-3 text-xs font-bold text-cyan-100">
                            <span>Điểm đạt: <strong className="text-white font-black">{currentScoreInfo.score.toFixed(1)}</strong></span>
                            <span>•</span>
                            <span>Mục tiêu: <strong className="text-white font-black">{currentScoreInfo.target.toFixed(1)}</strong></span>
                            <span>•</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/40 text-cyan-200 border border-cyan-400/30 text-[10px]">
                              {currentScoreInfo.score >= 9 ? 'Xuất sắc ⭐' : currentScoreInfo.score >= 8 ? 'Vững vàng 🎯' : 'Cần bứt phá 📈'}
                            </span>
                          </div>
                        </motion.div>

                        <div className="mt-2 text-[10px] font-black text-cyan-400/80 uppercase tracking-widest flex items-center gap-1.5">
                          <span>4 Chuyên đề cốt lõi & Cột mốc hoàn thành</span>
                        </div>
                      </div>

                      {/* Mind Map 4 Pillars Grid (Unique to this Subject) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                        {activeRoadmap.branches.map((pillar, pIdx) => {
                          // Find tasks belonging to this subject and distributed/keyword-matched to this pillar
                          const pillarTasks = currentSubjectTasks.filter((t) => {
                            const txt = (t.t + ' ' + (t.note || '')).toLowerCase();
                            const matched = pillar.milestones.some(m => txt.includes(m.title.toLowerCase().slice(0, 7)));
                            if (matched) return true;
                            return currentSubjectTasks.indexOf(t) % 4 === pIdx;
                          });

                          return (
                            <div 
                              key={pillar.id}
                              className="bg-white dark:bg-[#071328]/95 border border-slate-200/80 dark:border-cyan-500/25 rounded-3xl p-4 shadow-sm hover:border-cyan-400/50 hover:shadow-[0_4px_25px_rgba(6,182,212,0.18)] transition-all flex flex-col justify-between space-y-4 interactive-spring relative overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                              <div className="space-y-3">
                                {/* Pillar Header */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                                      {pillar.stageName}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${pillar.tagColor}`}>
                                      {pillar.tag}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-black text-slate-900 dark:text-cyan-100 flex items-center gap-1.5">
                                    <span>{pillar.icon}</span>
                                    <span>{pillar.title}</span>
                                  </h4>
                                  <p className="text-[10px] text-slate-500 dark:text-cyan-200/60 leading-snug line-clamp-2">
                                    {pillar.description}
                                  </p>
                                </div>

                                {/* Milestones Checklist */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-cyan-900/50">
                                  <div className="text-[9px] font-black text-slate-400 dark:text-cyan-400/70 uppercase tracking-wider">
                                    Cột mốc kiến thức cốt lõi:
                                  </div>
                                  <div className="space-y-1">
                                    {pillar.milestones.map((milestone, mIdx) => (
                                      <div key={mIdx} className="flex items-start gap-1.5 text-[10px] text-slate-700 dark:text-cyan-200/80">
                                        <span className="text-cyan-400 font-black mt-0.5 drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]">•</span>
                                        <span className="leading-tight">{milestone.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Real Tasks Created for This Pillar */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-cyan-900/50">
                                  <div className="flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-cyan-400/70 uppercase tracking-wider">
                                    <span>Nhiệm vụ của bạn:</span>
                                    <span className="text-cyan-400 font-bold">{pillarTasks.length} bài</span>
                                  </div>

                                  {pillarTasks.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {pillarTasks.map((t) => (
                                        <div 
                                          key={t.id}
                                          className={`p-2 rounded-xl border text-[10px] flex items-center justify-between gap-2 transition ${
                                            t.done 
                                              ? 'bg-slate-50 dark:bg-[#050e1f]/70 border-slate-200/50 dark:border-slate-800 opacity-60' 
                                              : 'bg-white dark:bg-[#050e1f] border-slate-200 dark:border-cyan-900/40 shadow-xs'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <button 
                                              onClick={() => onToggleTask(t.id)} 
                                              className="shrink-0 text-slate-400 hover:text-cyan-400 transition"
                                            >
                                              {t.done ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                                              ) : (
                                                <Circle className="w-3.5 h-3.5 hover:text-cyan-400" />
                                              )}
                                            </button>
                                            <span className={`font-bold truncate ${t.done ? 'line-through text-slate-400 dark:text-cyan-500/40' : 'text-slate-800 dark:text-cyan-100'}`}>
                                              {t.t}
                                            </span>
                                          </div>
                                          {t.priority === 'high' && (
                                            <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                                              Gấp
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 dark:text-cyan-400/50 italic py-1 text-center bg-slate-50 dark:bg-[#050e1f] rounded-xl border border-dashed border-slate-200 dark:border-cyan-900/40">
                                      Chưa có bài tập riêng
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Quick Add Task button for this pillar */}
                              <button
                                onClick={() => {
                                  onAddTask({
                                    t: `Ôn tập ${pillar.title} (${activeSubject})`,
                                    sub: activeSubject,
                                    due: formatDate(addDays(today, 2)),
                                    priority: 'medium',
                                    status: 'todo',
                                    done: false,
                                    hi: false,
                                    note: `Bài tập thuộc chuyên đề: ${pillar.title}`,
                                    subtasks: []
                                  });
                                }}
                                className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-500/10 dark:bg-[#0a1935] dark:hover:bg-[#0e244d] text-slate-700 dark:text-cyan-200 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200/60 dark:border-cyan-800/40 text-[10px] font-bold transition flex items-center justify-center gap-1 interactive-spring cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-cyan-400" />
                                <span>Thêm bài tập vào chuyên đề này</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Scroll Hint */}
                      <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2">
                        <MousePointer2 className="w-3 h-3" />
                        <span>Kéo ngang để xem toàn bộ các chuyên đề & bài tập</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Eisenhower Matrix Header & Toolbar (Image_9cc1dd66.png) */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#091730] dark:via-[#071326] dark:to-[#040914] border border-slate-200/80 dark:border-cyan-500/25 rounded-[32px] p-6 space-y-5 shadow-sm dark:shadow-[0_10px_35px_rgba(6,182,212,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-cyan-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
              <span>To-do List & Ma trận Eisenhower</span>
            </h2>
            <div className="flex bg-slate-100 dark:bg-[#050e1f] p-1.5 rounded-2xl border border-slate-200/60 dark:border-cyan-900/50 shadow-inner">
              <button 
                onClick={() => setViewMode('matrix')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all interactive-spring cursor-pointer ${
                  viewMode === 'matrix' 
                    ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105' 
                    : 'text-slate-500 dark:text-cyan-300/70 hover:text-slate-900 dark:hover:text-cyan-100 hover:bg-cyan-500/10'
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> 
                <span>Ma trận 4 Ô</span>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all interactive-spring cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105' 
                    : 'text-slate-500 dark:text-cyan-300/70 hover:text-slate-900 dark:hover:text-cyan-100 hover:bg-cyan-500/10'
                }`}
              >
                <List className="w-3.5 h-3.5" /> 
                <span>Danh sách</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowBalanceModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#0a1935] border border-cyan-500/30 rounded-xl text-xs font-black text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/60 shadow-xs transition interactive-spring cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" /> 
              <span>Phân bổ & Cân bằng</span>
            </button>
            <button 
              onClick={handleOpenAddModal} 
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.35)] transition interactive-spring cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> 
              <span>+ Thêm nhiệm vụ mới</span>
            </button>
          </div>
        </div>

        {/* Filter/Sort Bar */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-cyan-900/40 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/50 rounded-xl cursor-pointer hover:border-cyan-400/40 transition interactive-spring">
              <input 
                type="checkbox" 
                checked={selectAll} 
                onChange={(e) => setSelectAll(e.target.checked)} 
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-cyan-700 text-cyan-500 focus:ring-cyan-500 accent-cyan-500" 
              />
              <span className="text-xs font-bold text-slate-700 dark:text-cyan-200">Chọn tất cả</span>
            </label>
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/70" />
              <input 
                type="text" 
                placeholder="Tìm kiếm bài tập, môn học, từ khóa..." 
                value={searchQuery} 
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/50 rounded-xl text-xs font-bold text-slate-800 dark:text-cyan-100 placeholder:text-slate-400 dark:placeholder:text-cyan-400/40 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/60 outline-none transition" 
              />
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/50 rounded-xl">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-cyan-300/70">Sắp xếp:</span>
              <select 
                value={sortMode} 
                onChange={(e) => setSortMode(e.target.value as 'deadline-smart' | 'auto' | 'manual')} 
                className="bg-transparent border-none p-0 pr-6 text-xs font-bold text-cyan-600 dark:text-cyan-300 focus:ring-0 cursor-pointer"
              >
                <option value="auto" className="dark:bg-[#071328]">✨ Tự động (Ưu tiên + Hạn chót)</option>
                <option value="deadline-smart" className="dark:bg-[#071328]">⚡ Ưu tiên Hạn chót & Thống kê điểm (AI)</option>
                <option value="manual" className="dark:bg-[#071328]">Sắp xếp thủ công</option>
              </select>
            </div>
          </div>




        </div>

        {/* Dynamic List/Matrix Rendering */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-4">
              {sortedAndFilteredTasks.map(task => {
                const smartMeta = calculateSmartTaskPriority(task, statsScores);
                const deadlineBadge = getDeadlineBadge(task.due);
                const subtasks = task.subtasks || [];
                const doneSubtasks = subtasks.filter(s => s.done).length;

                return (
                  <div key={task.id} className={`bg-white dark:bg-[#071328]/95 border border-slate-200/80 dark:border-cyan-500/20 p-4 rounded-[24px] hover:border-cyan-400/60 hover:shadow-[0_4px_25px_rgba(6,182,212,0.18)] transition-all duration-300 shadow-sm group relative flex flex-col justify-between space-y-3 interactive-spring ${task.done ? 'opacity-70 bg-slate-50/50 dark:bg-[#050e1f]/70' : ''}`}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button 
                            onClick={() => onToggleTask(task.id)} 
                            className={`transition-all shrink-0 cursor-pointer ${task.done ? 'text-emerald-400' : 'text-slate-300 dark:text-cyan-600 hover:text-cyan-400'}`}
                            title={task.done ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                          >
                            {task.done ? <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${getSubjectColorBadge(task.sub)}`}>
                            <span>{getSubjectEmoji(task.sub)}</span>
                            <span>{task.sub || 'Môn học'}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded shadow-xs ${smartMeta.scoreColor}`}>
                            {smartMeta.urgencyLabel}
                          </span>
                          <button 
                            onClick={() => handleOpenEditModal(task)} 
                            className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
                            title="Sửa nhiệm vụ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setTaskToDelete(task)} 
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition interactive-spring cursor-pointer"
                            title="Xóa nhiệm vụ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className={`text-xs font-bold leading-snug min-h-[28px] ${task.done ? 'line-through text-slate-400 dark:text-cyan-500/40' : 'text-slate-900 dark:text-cyan-100'}`}>
                        {task.t}
                      </h4>
                      
                      {smartMeta.reason && !task.done && (
                        <p className="text-[10px] text-slate-500 dark:text-cyan-200/70 line-clamp-2 bg-slate-50 dark:bg-[#050e1f] p-2 rounded-xl border border-slate-100 dark:border-cyan-950">
                          {smartMeta.reason}
                        </p>
                      )}

                      {subtasks.length > 0 && (
                        <div className="text-[10px] text-cyan-600 dark:text-cyan-300 font-bold flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-cyan-400" />
                          <span>Checklist: {doneSubtasks}/{subtasks.length} bước</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-cyan-900/40">
                      <div className={`flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md ${deadlineBadge.color}`}>
                        <Clock className="w-3 h-3" />
                        <span>{deadlineBadge.label}</span>
                      </div>
                      <button 
                        onClick={() => onSelectTab && onSelectTab('focus')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-600 dark:text-cyan-300 border border-cyan-400/30 rounded-lg text-[9.5px] font-bold transition interactive-spring cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                      >
                        <Play className="w-3 h-3 fill-current text-cyan-400" />
                        <span>Học ngay</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="matrix" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-6 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Ô 1: KHẨN CẤP & QUAN TRỌNG - LÀM NGAY (DO IT NOW) */}
                <EisenhowerQuadrant
                  quadrantNumber={1}
                  title="KHẨN CẤP & QUAN TRỌNG"
                  subtitle="LÀM NGAY (DO IT NOW)"
                  icon={<Zap className="w-5 h-5 text-white fill-current" />}
                  color="rose"
                  tasks={matrixQuadrants.q1}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onMoveQuadrant={handleMoveQuadrant}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onUpdateNote={handleUpdateNote}
                  onSelectTab={onSelectTab}
                  onEditTask={handleOpenEditModal}
                  onQuickAddTaskToQuadrant={(q) => {
                    setEditingTaskId(null);
                    setFormDataTitle('');
                    setFormDataQuadrant(q);
                    setIsAddModalOpen(true);
                  }}
                />

                {/* Ô 2: QUAN TRỌNG, KHÔNG KHẨN CẤP - LÊN LỊCH CHỦ ĐỘNG (PLAN) */}
                <EisenhowerQuadrant
                  quadrantNumber={2}
                  title="QUAN TRỌNG, KHÔNG KHẨN CẤP"
                  subtitle="LÊN LỊCH CHỦ ĐỘNG (PLAN)"
                  icon={<Calendar className="w-5 h-5 text-white" />}
                  color="blue"
                  tasks={matrixQuadrants.q2}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onMoveQuadrant={handleMoveQuadrant}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onUpdateNote={handleUpdateNote}
                  onSelectTab={onSelectTab}
                  onEditTask={handleOpenEditModal}
                  onQuickAddTaskToQuadrant={(q) => {
                    setEditingTaskId(null);
                    setFormDataTitle('');
                    setFormDataQuadrant(q);
                    setIsAddModalOpen(true);
                  }}
                />

                {/* Ô 3: KHẨN CẤP, KHÔNG QUAN TRỌNG - ỦY QUYỀN & TỐI ƯU (DELEGATE) */}
                <EisenhowerQuadrant
                  quadrantNumber={3}
                  title="KHẨN CẤP, KHÔNG QUAN TRỌNG"
                  subtitle="ỦY QUYỀN & TỐI ƯU (DELEGATE)"
                  icon={<Users className="w-5 h-5 text-white" />}
                  color="amber"
                  tasks={matrixQuadrants.q3}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onMoveQuadrant={handleMoveQuadrant}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onUpdateNote={handleUpdateNote}
                  onSelectTab={onSelectTab}
                  onEditTask={handleOpenEditModal}
                  onQuickAddTaskToQuadrant={(q) => {
                    setEditingTaskId(null);
                    setFormDataTitle('');
                    setFormDataQuadrant(q);
                    setIsAddModalOpen(true);
                  }}
                />

                {/* Ô 4: KHÔNG KHẨN CẤP & KHÔNG QUAN TRỌNG - KHO LƯU TRỮ Ý TƯỞNG (ELIMINATE) */}
                <EisenhowerQuadrant
                  quadrantNumber={4}
                  title="KHÔNG KHẨN CẤP & KHÔNG QUAN TRỌNG"
                  subtitle="KHO LƯU TRỮ Ý TƯỞNG (ELIMINATE)"
                  icon={<Archive className="w-5 h-5 text-white" />}
                  color="slate"
                  tasks={matrixQuadrants.q4}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onMoveQuadrant={handleMoveQuadrant}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onUpdateNote={handleUpdateNote}
                  onSelectTab={onSelectTab}
                  onEditTask={handleOpenEditModal}
                  onQuickAddTaskToQuadrant={(q) => {
                    setEditingTaskId(null);
                    setFormDataTitle('');
                    setFormDataQuadrant(q);
                    setIsAddModalOpen(true);
                  }}
                />
              </div>

              {/* Analysis Bars Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <AnalysisBar label="Ô 1: Làm ngay (Do)" data={analysis.q1} color="bg-rose-500" text="text-rose-600" />
                <AnalysisBar label="Ô 2: Lên lịch (Plan)" data={analysis.q2} color="bg-blue-500" text="text-blue-600" />
                <AnalysisBar label="Ô 3: Ủy quyền (Delegate)" data={analysis.q3} color="bg-amber-500" text="text-amber-600" />
                <AnalysisBar label="Ô 4: Lưu trữ (Eliminate)" data={analysis.q4} color="bg-slate-500" text="text-slate-600" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SMART BALANCE MODAL (Powered by Statistics) */}
      <SmartBalanceModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        tasks={tasks}
        sessions={sessions}
        subjectScores={statsScores}
        gpaGoal={gpaGoal}
        onSelectTab={onSelectTab}
      />

      {/* NEW ADD TASK MODAL - Luxury Navy + Depth Shadow */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-[#020617]/75 backdrop-blur-md z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.92, y: 15 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.92, y: 15 }}
               className="bg-white dark:bg-gradient-to-b dark:from-[#091730] dark:via-[#071326] dark:to-[#040914] rounded-[36px] w-full max-w-2xl overflow-hidden dialog-depth-shadow border border-slate-200/80 dark:border-cyan-500/30 relative"
             >
                {/* Top Neon Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400" />

                {/* Modal Header */}
                <div className="p-7 pb-4 flex items-center justify-between">
                   <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/30">
                         <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-slate-900 dark:text-cyan-100 leading-tight">
                            {editingTaskId ? 'Chỉnh sửa nhiệm vụ học tập' : 'Thêm nhiệm vụ học tập mới (Ma trận Eisenhower)'}
                         </h3>
                         <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>Tích hợp Smart Sorting AI & Phân loại ngôn ngữ tự nhiên NLP</span>
                         </p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setIsAddModalOpen(false)} 
                     className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#071328] border border-slate-200/60 dark:border-cyan-900/50 text-slate-600 dark:text-cyan-300 text-xs font-black uppercase hover:bg-slate-200 dark:hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
                   >
                      <X className="w-4 h-4" /> Thoát
                   </button>
                </div>

                <div className="p-7 pt-0 space-y-5 max-h-[72vh] overflow-y-auto no-scrollbar">
                   {/* NLP Samples */}
                   <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.15em]">
                         <Zap className="w-3.5 h-3.5 fill-current text-cyan-400" /> Gõ nhanh hoặc chọn mẫu NLP thông minh
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {[
                           { t: '"Mai thi kiểm tra 1 tiết"', q: 'Ô 1', c: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50', icon: <Flame className="w-3 h-3 text-rose-500" /> },
                           { t: '"Tiểu luận tuần sau"', q: 'Ô 2', c: 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50', icon: <TargetIcon className="w-3 h-3 text-cyan-400" /> },
                           { t: '"Photo tài liệu nhóm"', q: 'Ô 3', c: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50', icon: <Layers className="w-3 h-3 text-amber-400" /> },
                           { t: '"Đọc thêm sách"', q: 'Ô 4', c: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50', icon: <BookOpen className="w-3 h-3 text-indigo-400" /> }
                         ].map((item, idx) => (
                           <button 
                             key={idx} 
                             onClick={() => setFormDataTitle(item.t.replace(/"/g, ''))}
                             className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition interactive-spring cursor-pointer hover:scale-105 active:scale-95 ${item.c}`}
                           >
                              {item.icon} {item.t} ({item.q})
                           </button>
                         ))}
                      </div>
                   </div>

                   {/* Title Input */}
                   <div className="relative">
                      <input 
                        type="text" 
                        value={formTitle}
                        onChange={(e) => setFormDataTitle(e.target.value)}
                        placeholder="Ví dụ: Mai thi kiểm tra 1 tiết Đại số"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 rounded-[20px] text-sm font-bold text-slate-900 dark:text-cyan-100 placeholder:text-slate-400 dark:placeholder:text-cyan-400/40 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/60 outline-none transition-all"
                      />
                   </div>

                   {/* Form Grid */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-black text-slate-500 dark:text-cyan-400/70 uppercase">Danh mục Môn học *</label>
                         <select 
                           value={formSubject}
                           onChange={(e) => setFormDataSubject(e.target.value)}
                           className="w-full px-4 py-2.5 bg-white dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 rounded-xl text-xs font-bold text-slate-800 dark:text-cyan-100 focus:ring-2 focus:ring-cyan-400/50 outline-none"
                         >
                            {COMMON_SUBJECTS.map(s => <option key={s.name} value={s.name} className="dark:bg-[#071328]">{s.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-black text-slate-500 dark:text-cyan-400/70 uppercase">Hệ số điểm môn học *</label>
                         <select 
                           value={formWeight}
                           onChange={(e) => setFormDataWeight(e.target.value)}
                           className="w-full px-4 py-2.5 bg-white dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 rounded-xl text-xs font-bold text-slate-800 dark:text-cyan-100 focus:ring-2 focus:ring-cyan-400/50 outline-none"
                         >
                            <option className="dark:bg-[#071328]">Hệ số 1 (KT Thường xuyên)</option>
                            <option className="dark:bg-[#071328]">Hệ số 2 (KT Định kỳ)</option>
                            <option className="dark:bg-[#071328]">Hệ số 3 (Thi học kỳ / Đồ án)</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-black text-slate-500 dark:text-cyan-400/70 uppercase">Hạn nộp (Deadline) *</label>
                         <input 
                           type="date" 
                           value={formDeadline}
                           onChange={(e) => setFormDataDeadline(e.target.value)}
                           className="w-full px-4 py-2.5 bg-white dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 rounded-xl text-xs font-bold text-slate-800 dark:text-cyan-100 focus:ring-2 focus:ring-cyan-400/50 outline-none" 
                         />
                      </div>
                      <div className="space-y-1.5">
                         <div className="flex justify-between items-center">
                            <label className="text-[11px] font-black text-slate-500 dark:text-cyan-400/70 uppercase">Mức độ quan trọng</label>
                            <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">{formImportance}/10</span>
                         </div>
                         <input 
                           type="range" min="1" max="10" 
                           value={formImportance}
                           onChange={(e) => setFormDataImportance(parseInt(e.target.value))}
                           className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-400 mt-2" 
                         />
                      </div>
                   </div>

                   {/* AI CLASSIFICATION BOX */}
                   <div className="p-5 rounded-[24px] border border-cyan-500/25 bg-cyan-950/20 dark:bg-[#071328]/95 space-y-4">
                      <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]">
                               <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div>
                               <h4 className="text-[9px] font-black text-slate-400 dark:text-cyan-400/70 uppercase tracking-widest">SMART SORTING AI PHÂN LOẠI:</h4>
                               <p className={`text-sm font-black mt-0.5 ${formQuadrant === 1 ? 'text-rose-500' : formQuadrant === 2 ? 'text-cyan-400' : formQuadrant === 3 ? 'text-amber-400' : 'text-indigo-400'}`}>
                                  {formQuadrant === 1 ? 'Ô 1: Khẩn cấp & Quan trọng' : formQuadrant === 2 ? 'Ô 2: Quan trọng, Không khẩn cấp' : formQuadrant === 3 ? 'Ô 3: Khẩn cấp, Không quan trọng' : 'Ô 4: Không khẩn cấp & Không quan trọng'}
                               </p>
                            </div>
                         </div>
                         <div className={`px-3.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${formQuadrant === 1 ? 'border-rose-500/40 text-rose-400 bg-rose-500/10' : 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'}`}>
                            {formQuadrant === 1 ? 'LÀM NGAY (DO)' : formQuadrant === 2 ? 'LẬP KẾ HOẠCH (DECIDE)' : formQuadrant === 3 ? 'ỦY QUYỀN (DELEGATE)' : 'XÓA / GIẢM (DELETE)'}
                         </div>
                      </div>

                      <div className="px-4 py-2.5 bg-white dark:bg-[#050e1f] rounded-xl border border-slate-100 dark:border-cyan-950 flex items-center gap-2.5">
                         <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                         <p className="text-[11px] font-bold text-slate-500 dark:text-cyan-200/80 leading-relaxed italic">{aiInsight}</p>
                      </div>

                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 dark:text-cyan-400/70">Hoặc tự chọn ô:</span>
                         <div className="flex gap-2">
                            {[1, 2, 3, 4].map(num => (
                              <button 
                                key={num} 
                                onClick={() => setFormDataQuadrant(num)}
                                className={`w-11 py-1.5 rounded-xl text-[11px] font-black transition-all interactive-spring cursor-pointer border ${formQuadrant === num ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-white dark:bg-[#050e1f] text-slate-600 dark:text-cyan-300 border-slate-200 dark:border-cyan-900/50 hover:bg-cyan-500/10'}`}
                              >
                                 Ô {num}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Notes & Time */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-black text-slate-500 dark:text-cyan-400/70 uppercase">Ghi chú / Yêu cầu</label>
                         <input 
                           type="text" 
                           value={formNote}
                           onChange={(e) => setFormDataNote(e.target.value)}
                           placeholder="Ghi chú chi tiết hoặc tài liệu đính kèm..."
                           className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 rounded-xl text-xs font-bold text-slate-800 dark:text-cyan-100 outline-none" 
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[11px] font-black text-slate-500 dark:text-cyan-400/70 uppercase">Thời gian ước tính</label>
                         <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              step="0.5"
                              value={formEstHours}
                              onChange={(e) => setFormDataEstHours(e.target.value)}
                              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 rounded-xl text-xs font-bold text-slate-800 dark:text-cyan-100 outline-none" 
                            />
                            <span className="text-[11px] font-black text-slate-400 dark:text-cyan-400/60 uppercase">giờ</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 pt-3 border-t border-slate-100 dark:border-cyan-900/40 flex items-center justify-end gap-3">
                   <button 
                     onClick={() => setIsAddModalOpen(false)} 
                     className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-[#071328] text-slate-600 dark:text-cyan-300 text-xs font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
                   >
                     Hủy
                   </button>
                   <button 
                     onClick={handleSaveTaskForm} 
                     className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.35)] transition interactive-spring cursor-pointer active:scale-95"
                   >
                      {editingTaskId ? 'Cập nhật nhiệm vụ' : 'Lưu bài tập vào Ma trận'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Score & Target Quick Edit Modal (Synchronized with Stats page) */}
      <AnimatePresence>
        {scoreEditModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/75 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gradient-to-b dark:from-[#091730] dark:via-[#071326] dark:to-[#040914] border border-slate-200 dark:border-cyan-500/30 rounded-3xl p-6 dialog-depth-shadow max-w-md w-full space-y-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-400/30">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-cyan-100">
                      Cập nhật Điểm Môn {scoreEditModal.subjectName}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-cyan-300/60">
                      Dữ liệu sẽ đồng bộ ngay lập tức với Trang Thống Kê
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setScoreEditModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 bg-slate-50 dark:bg-[#071328]/80 p-4 rounded-2xl border border-slate-100 dark:border-cyan-900/50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-cyan-400/70">
                    Điểm thực tế hiện tại (Thang điểm 10)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scoreEditModal.score}
                    onChange={(e) => setScoreEditModal(prev => ({ ...prev, score: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#050e1f] border border-slate-200 dark:border-cyan-900/60 rounded-xl text-sm font-black text-slate-900 dark:text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-rose-400/70">
                    Điểm mục tiêu phấn đấu (Thang điểm 10)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scoreEditModal.target}
                    onChange={(e) => setScoreEditModal(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#050e1f] border border-slate-200 dark:border-cyan-900/60 rounded-xl text-sm font-black text-rose-500 dark:text-rose-400 outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <div className="text-[11px] font-bold text-slate-500 dark:text-cyan-200/70 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-cyan-900/40">
                  <span>Chênh lệch mục tiêu:</span>
                  <span className="font-black text-cyan-600 dark:text-cyan-400">
                    {scoreEditModal.target - scoreEditModal.score > 0 
                      ? `Cần +${(scoreEditModal.target - scoreEditModal.score).toFixed(1)} điểm` 
                      : 'Đạt hoặc vượt mục tiêu 🎉'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setScoreEditModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#071328] text-slate-600 dark:text-cyan-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveSubjectScore}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center gap-1.5 transition interactive-spring cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu & Đồng bộ Thống Kê</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Delete Confirmation Modal with Dialog Depth Shadow */}
      <AnimatePresence>
        {taskToDelete !== null && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-gradient-to-b dark:from-[#0f1d38] dark:via-[#0a152a] dark:to-[#050c18] border border-rose-500/30 rounded-3xl p-6 dialog-depth-shadow max-w-sm w-full space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.35)]">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-rose-100">
                    Xác nhận xóa nhiệm vụ
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-cyan-200/60">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-cyan-200/80 leading-relaxed bg-slate-50 dark:bg-[#071328] p-3 rounded-xl border border-slate-200/60 dark:border-cyan-900/40">
                Bạn có chắc chắn muốn xóa bài tập <strong className="text-rose-400">"{taskToDelete.t}"</strong> khỏi To-do List và Ma trận Eisenhower không?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#071328] text-slate-600 dark:text-cyan-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    if (taskToDelete !== null) {
                      onDeleteTask(taskToDelete.id);
                      setTaskToDelete(null);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center gap-1.5 transition interactive-spring cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getDeadlineBadge = (due?: string) => {
  if (!due) return { label: 'Chưa có hạn', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: '🕒' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(due);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Đã quá hạn', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800', icon: '⚠️' };
  }
  if (diffDays === 0) {
    return { label: 'Còn 1 giờ (Hôm nay)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800', icon: '⚡' };
  }
  if (diffDays === 1) {
    return { label: 'Còn 1 ngày (Ngày mai)', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800', icon: '⏳' };
  }
  if (diffDays <= 7) {
    return { label: `Còn ${diffDays} ngày nữa`, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800', icon: '🕒' };
  }
  return { label: due, color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700', icon: '📅' };
};

const getSubjectColorBadge = (subName?: string) => {
  const clean = (subName || '').toLowerCase();
  if (clean.includes('lý')) return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
  if (clean.includes('văn')) return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (clean.includes('toán')) return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (clean.includes('hóa')) return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  if (clean.includes('sử')) return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
  if (clean.includes('anh')) return 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
  if (clean.includes('sinh')) return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (clean.includes('địa')) return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (clean.includes('gdcd')) return 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

const getSubjectEmoji = (subName?: string) => {
  const clean = (subName || '').toLowerCase();
  if (clean.includes('toán')) return '🧮';
  if (clean.includes('lý')) return '⚡';
  if (clean.includes('hóa')) return '🧪';
  if (clean.includes('văn')) return '📖';
  if (clean.includes('anh')) return '🔤';
  if (clean.includes('sinh')) return '🧬';
  if (clean.includes('sử')) return '🏛️';
  if (clean.includes('địa')) return '🌍';
  if (clean.includes('gdcd')) return '⚖️';
  return '📚';
};

const EisenhowerTaskCard: React.FC<{
  task: TaskItem;
  quadrantNumber: 1 | 2 | 3 | 4;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onMoveQuadrant: (taskId: number, newQuad: 1 | 2 | 3 | 4) => void;
  onToggleSubtask: (taskId: number, subtaskId: string) => void;
  onAddSubtask: (taskId: number, text: string) => void;
  onDeleteSubtask?: (taskId: number, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onSelectTab?: (tab: ViewTab) => void;
}> = ({
  task,
  quadrantNumber,
  onToggle,
  onDelete,
  onMoveQuadrant,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onEditTask,
  onSelectTab
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.done).length;
  const deadlineBadge = getDeadlineBadge(task.due);

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    onAddSubtask(task.id, newSubtaskText.trim());
    setNewSubtaskText('');
    setIsAddingSubtask(false);
    setShowSubtasks(true);
  };

  const priorityLabel = task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Vừa' : 'Thấp';
  const priorityColor = task.priority === 'high' 
    ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]' 
    : task.priority === 'medium' 
    ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-cyan-900/40 dark:text-cyan-300';

  const actionBadgeText = task.actionBadge || (
    quadrantNumber === 1 ? '⚡ Xử lý ngay' :
    quadrantNumber === 2 ? (task.priority === 'high' ? '🔥 Ưu tiên cao' : '🎯 Lên lịch ôn') :
    quadrantNumber === 3 ? '👥 Ủy quyền' :
    '💡 Ý tưởng'
  );

  return (
    <div className={`bg-white dark:bg-[#071328]/95 border border-slate-200/90 dark:border-cyan-500/20 rounded-2xl p-4 shadow-xs hover:border-cyan-400/50 hover:shadow-[0_4px_25px_rgba(6,182,212,0.18)] transition-all space-y-3 group interactive-spring ${task.done ? 'opacity-70 bg-slate-50/50 dark:bg-[#050e1f]/70' : ''}`}>
      {/* Top Row: Checkbox, Subject, Priority, Action Badge, Tools */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button 
            onClick={() => onToggle(task.id)} 
            className="shrink-0 transition-transform active:scale-90 cursor-pointer"
            title={task.done ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
          >
            {task.done ? (
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-cyan-700/60 hover:border-cyan-400 transition-colors" />
            )}
          </button>

          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${getSubjectColorBadge(task.sub)}`}>
            <span>{getSubjectEmoji(task.sub)}</span>
            <span>{task.sub || 'Môn học'}</span>
          </span>

          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${priorityColor}`}>
            {priorityLabel}
          </span>

          {actionBadgeText && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
              quadrantNumber === 1 ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 
              quadrantNumber === 2 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 
              quadrantNumber === 3 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 
              'bg-gradient-to-r from-indigo-500 to-slate-700 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
            }`}>
              {actionBadgeText}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <select 
            value={task.quadrant || quadrantNumber} 
            onChange={(e) => onMoveQuadrant(task.id, Number(e.target.value) as 1 | 2 | 3 | 4)}
            className="text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-[#0a1935] border border-slate-200 dark:border-cyan-900/60 rounded-lg px-2 py-1 text-slate-700 dark:text-cyan-200 outline-none cursor-pointer transition interactive-spring"
            title="Chuyển sang Ô khác trong Ma trận"
          >
            <option value="1" className="dark:bg-[#071328]">Ô 1 (Làm ngay)</option>
            <option value="2" className="dark:bg-[#071328]">Ô 2 (Lên lịch)</option>
            <option value="3" className="dark:bg-[#071328]">Ô 3 (Ủy quyền)</option>
            <option value="4" className="dark:bg-[#071328]">Ô 4 (Lưu trữ)</option>
          </select>

          <button 
            onClick={() => onEditTask(task)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
            title="Chỉnh sửa nhiệm vụ"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => onDelete(task.id)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition interactive-spring cursor-pointer"
            title="Xóa nhiệm vụ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className={`text-xs sm:text-[13px] font-extrabold leading-snug ${
        task.done ? 'line-through text-slate-400 dark:text-cyan-500/40' : 'text-slate-900 dark:text-cyan-100'
      }`}>
        {task.t}
      </h4>

      {/* Target gap / AI reason / Note */}
      {(task.targetGap || task.aiReason || task.note) && !task.done && (
        <div className="text-[11px] text-slate-500 dark:text-cyan-200/70 bg-slate-50 dark:bg-[#050e1f] p-2.5 rounded-xl border border-slate-100 dark:border-cyan-950 leading-relaxed space-y-0.5">
          {task.targetGap && (
            <p className="font-semibold text-rose-500 dark:text-rose-400 line-clamp-1">{task.targetGap}</p>
          )}
          {task.aiReason && (
            <p className="line-clamp-2">{task.aiReason}</p>
          )}
          {task.note && !task.aiReason && (
            <p className="line-clamp-2 italic text-slate-400 dark:text-cyan-400/50">{task.note}</p>
          )}
        </div>
      )}

      {/* Subtasks (Checklist) Toggle & List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold">
          {subtasks.length > 0 ? (
            <button 
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckSquare className="w-3 h-3 text-cyan-400" />
              <span>Tiến độ: {completedSubtasks}/{subtasks.length} bước ({Math.round((completedSubtasks / subtasks.length) * 100)}%)</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showSubtasks ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button 
              onClick={() => setIsAddingSubtask(true)}
              className="text-slate-400 dark:text-cyan-400/60 hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm bước nhỏ (Checklist)</span>
            </button>
          )}

          {subtasks.length > 0 && !isAddingSubtask && (
            <button 
              onClick={() => {
                setIsAddingSubtask(true);
                setShowSubtasks(true);
              }}
              className="text-slate-400 dark:text-cyan-400/60 hover:text-cyan-400 transition cursor-pointer"
              title="Thêm bước"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Subtask list */}
        {showSubtasks && subtasks.length > 0 && (
          <div className="space-y-1.5 pl-2 pt-1 border-l-2 border-cyan-400/40 dark:border-cyan-500/30">
            {subtasks.map(st => (
              <div key={st.id} className="flex items-center justify-between gap-2 group/st text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <button 
                    onClick={() => onToggleSubtask(task.id, st.id)}
                    className="text-slate-400 hover:text-emerald-400 transition shrink-0 cursor-pointer"
                  >
                    {st.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 hover:text-cyan-400" />
                    )}
                  </button>
                  <span className={`truncate ${st.done ? 'line-through text-slate-400 dark:text-cyan-500/40' : 'text-slate-700 dark:text-cyan-100'}`}>
                    {st.text}
                  </span>
                </div>
                {onDeleteSubtask && (
                  <button 
                    onClick={() => onDeleteSubtask(task.id, st.id)}
                    className="opacity-0 group-hover/st:opacity-100 p-0.5 text-slate-300 hover:text-rose-400 transition shrink-0 cursor-pointer"
                    title="Xóa bước này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inline Add Subtask Input */}
        {isAddingSubtask && (
          <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-1.5 pt-1">
            <input 
              type="text" 
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="Nhập bước mới (nhấn Enter để lưu)..."
              autoFocus
              className="flex-1 px-2.5 py-1 text-[11px] bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-cyan-100 rounded-lg outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button 
              type="submit" 
              className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              Lưu
            </button>
            <button 
              type="button" 
              onClick={() => setIsAddingSubtask(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-cyan-300 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* Bottom Row: Deadline badge, Weight badge, Start Study button */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-cyan-900/40">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${deadlineBadge.color}`}>
            <span>{deadlineBadge.icon}</span>
            <span>{task.deadlineLabel || deadlineBadge.label}</span>
          </span>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            {task.weight || 'HS 2'}
          </span>
        </div>

        <button 
          onClick={() => onSelectTab && onSelectTab('focus')}
          className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-600 dark:text-cyan-300 border border-cyan-400/30 rounded-lg text-[10px] font-black transition active:scale-95 shrink-0 interactive-spring cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          title="Bắt đầu học phiên Pomodoro cho bài tập này"
        >
          <Play className="w-3 h-3 fill-current text-cyan-400" />
          <span>Học ngay</span>
        </button>
      </div>
    </div>
  );
};

const EisenhowerQuadrant: React.FC<{
  quadrantNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'rose' | 'blue' | 'amber' | 'slate';
  tasks: TaskItem[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onMoveQuadrant: (taskId: number, newQuad: 1 | 2 | 3 | 4) => void;
  onToggleSubtask: (taskId: number, subtaskId: string) => void;
  onAddSubtask: (taskId: number, text: string) => void;
  onDeleteSubtask?: (taskId: number, subtaskId: string) => void;
  onUpdateNote: (taskId: number, newNote: string) => void;
  onSelectTab?: (tab: ViewTab) => void;
  onEditTask: (task: TaskItem) => void;
  onQuickAddTaskToQuadrant?: (quad: 1 | 2 | 3 | 4) => void;
}> = ({
  quadrantNumber,
  title,
  subtitle,
  icon,
  color,
  tasks,
  onToggle,
  onDelete,
  onMoveQuadrant,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateNote,
  onSelectTab,
  onEditTask,
  onQuickAddTaskToQuadrant
}) => {
  const colorStyles = {
    rose: {
      border: 'border-rose-500/30',
      bg: 'bg-white dark:bg-[#071328]/95',
      topLine: 'bg-gradient-to-r from-transparent via-rose-500 to-transparent',
      iconBg: 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
      subText: 'text-rose-500 dark:text-rose-400',
      badge: 'bg-white dark:bg-[#0a1935] text-rose-600 dark:text-rose-300 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
    },
    blue: {
      border: 'border-cyan-500/30',
      bg: 'bg-white dark:bg-[#071328]/95',
      topLine: 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      subText: 'text-cyan-600 dark:text-cyan-400',
      badge: 'bg-white dark:bg-[#0a1935] text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-white dark:bg-[#071328]/95',
      topLine: 'bg-gradient-to-r from-transparent via-amber-400 to-transparent',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      subText: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-white dark:bg-[#0a1935] text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
    },
    slate: {
      border: 'border-indigo-500/25',
      bg: 'bg-white dark:bg-[#071328]/95',
      topLine: 'bg-gradient-to-r from-transparent via-indigo-400 to-transparent',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-slate-700 shadow-[0_0_15px_rgba(99,102,241,0.4)]',
      subText: 'text-indigo-600 dark:text-indigo-400',
      badge: 'bg-white dark:bg-[#0a1935] text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
    }
  }[color];

  return (
    <div className={`border ${colorStyles.border} ${colorStyles.bg} rounded-3xl p-5 space-y-4 shadow-sm dark:shadow-[0_8px_30px_rgba(6,182,212,0.08)] flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colorStyles.topLine} opacity-70`} />
      {/* Quadrant Header matching Image_9cc1dd66.png */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-cyan-900/40 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${colorStyles.iconBg} text-white flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-cyan-100 uppercase tracking-tight">
              {title}
            </h3>
            <p className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${colorStyles.subText}`}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs ${colorStyles.badge}`}>
            {tasks.length} việc
          </span>
          {onQuickAddTaskToQuadrant && (
            <button 
              onClick={() => onQuickAddTaskToQuadrant(quadrantNumber)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition interactive-spring cursor-pointer"
              title={`Thêm bài tập vào Ô ${quadrantNumber}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="space-y-3 flex-1 min-h-[120px] relative z-10">
        {tasks.map(task => (
          <EisenhowerTaskCard
            key={task.id}
            task={task}
            quadrantNumber={quadrantNumber}
            onToggle={onToggle}
            onDelete={onDelete}
            onMoveQuadrant={onMoveQuadrant}
            onToggleSubtask={onToggleSubtask}
            onAddSubtask={onAddSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onEditTask={onEditTask}
            onSelectTab={onSelectTab}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-400 dark:text-cyan-400/50 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-[#050e1f] flex items-center justify-center border border-dashed border-slate-300 dark:border-cyan-900/50 shadow-inner">
              <CheckCircle2 className="w-5 h-5 opacity-40 text-cyan-400" />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-cyan-300/70">Chưa có nhiệm vụ trong ô này</p>
            {onQuickAddTaskToQuadrant && (
              <button 
                onClick={() => onQuickAddTaskToQuadrant(quadrantNumber)}
                className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:underline pt-1 cursor-pointer interactive-spring"
              >
                + Thêm nhiệm vụ vào Ô {quadrantNumber}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisBar: React.FC<{
  label: string;
  data: { pct: number; done: number; total: number; hours: string };
  color: string;
  text: string;
}> = ({ label, data, color, text }) => (
  <div className="bg-white dark:bg-[#071328]/95 p-5 rounded-[28px] shadow-sm border border-slate-100 dark:border-cyan-500/20 space-y-3 interactive-spring hover:-translate-y-0.5 transition">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-slate-900 dark:text-cyan-100 uppercase tracking-tight">{label}</span>
      <span className={`text-[10px] font-black ${text}`}>{data.pct}% ({data.total} việc)</span>
    </div>
    <div className="h-2 bg-slate-100 dark:bg-[#050e1f] rounded-full overflow-hidden shadow-inner border border-slate-200/40 dark:border-cyan-950">
      <motion.div initial={{ width: 0 }} animate={{ width: `${data.pct}%` }} className={`h-full ${color} rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]`}></motion.div>
    </div>
    <div className="flex items-center justify-between text-[8.5px] font-bold text-slate-400 dark:text-cyan-400/60 uppercase tracking-tighter">
      <span>Đã làm xong: {data.done}/{data.total}</span>
      <span>Ước tính: ~{data.hours} giờ</span>
    </div>
  </div>
);

// Custom Icons
const CalculatorIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>);
const GlobeIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" /></svg>);
const HistoryIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>);
