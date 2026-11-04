import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  Flame, 
  Lock, 
  Sparkles, 
  Plus, 
  RotateCcw, 
  Trash2, 
  X, 
  CheckCircle2, 
  Circle, 
  ChevronRight,
  ListPlus,
  Compass,
  Trophy,
  ExternalLink
} from 'lucide-react';
import { GoalMilestone, StudyGoal, StudentProfile, TaskItem } from '../types';

interface StudyRoadmapMilestoneBarProps {
  activeSubject?: string;
  studentProfile?: StudentProfile;
  onAddTask?: (task: Omit<TaskItem, 'id'>) => void;
  onNavigateToStats?: () => void;
}

export const DEFAULT_GOALS_LIST: StudyGoal[] = [
  {
    id: 'g1',
    title: 'Hoàn thành chương trình Toán 11',
    subject: 'Toán',
    createdAt: new Date().toISOString(),
    milestones: [
      { 
        id: 'm0', 
        title: 'Mốc 1: Củng cố nền tảng', 
        description: 'Chuẩn bị sách giáo khoa và tài liệu ôn tập Toán 11', 
        status: 'completed', 
        rewardBadge: '🌱 Khởi đầu', 
        rewardPoints: 50,
        tasks: [
          { id: 't0_1', text: 'Ôn tập công thức biến đổi cơ bản', done: true },
          { id: 't0_2', text: 'Tổng hợp sơ đồ tư duy đầu năm', done: true }
        ]
      },
      { 
        id: 'm1', 
        title: 'Mốc 2: Hoàn thành lượng giác', 
        description: 'Nắm chắc công thức biến đổi tích thành tổng và phương trình lượng giác cơ bản', 
        status: 'completed', 
        rewardBadge: '📐 Bậc thầy Lượng giác', 
        rewardPoints: 100,
        tasks: [
          { id: 't1_1', text: 'Phương trình lượng giác cơ bản', done: true },
          { id: 't1_2', text: 'Công thức nhân đôi, nhân ba', done: true },
          { id: 't1_3', text: 'Giải 20 bài toán biến đổi nâng cao', done: true }
        ]
      },
      { 
        id: 'm2', 
        title: 'Mốc 3: Hoàn thành dãy số', 
        description: 'Làm chủ cấp số cộng và cấp số nhân trong các bài toán thực tế', 
        status: 'completed', 
        rewardBadge: '🔢 Chuyên gia Dãy số', 
        rewardPoints: 150,
        tasks: [
          { id: 't2_1', text: 'Công thức số hạng tổng quát CSC & CSN', done: true },
          { id: 't2_2', text: 'Bài toán thực tế lãi suất ngân hàng', done: true }
        ]
      },
      { 
        id: 'm3', 
        title: 'Mốc 4: Hoàn thành giới hạn', 
        description: 'Tính thành thạo giới hạn dãy số, giới hạn hàm số và tính liên tục', 
        status: 'completed', 
        rewardBadge: '📈 Bậc thầy Giới hạn', 
        rewardPoints: 200,
        tasks: [
          { id: 't3_1', text: 'Khử dạng vô định 0/0 và vô cùng / vô cùng', done: true },
          { id: 't3_2', text: 'Xét tính liên tục của hàm số tại 1 điểm', done: true }
        ]
      },
      { 
        id: 'm4', 
        title: 'Mốc 5: Kiểm tra tổng hợp', 
        description: 'Đạt từ 8.5 điểm trở lên trong bài thi khảo sát tổng hợp toàn bộ chương trình', 
        status: 'in_progress', 
        rewardBadge: '👑 Quán quân Toán 11', 
        rewardPoints: 300,
        tasks: [
          { id: 't4_1', text: 'Làm đề kiểm tra tổng hợp 50 câu trắc nghiệm', done: false },
          { id: 't4_2', text: 'Xem lại các câu sai và phương pháp giải nhanh', done: false }
        ]
      }
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
  },
  {
    id: 'g3',
    title: 'Bứt phá 9+ Vật lý 12',
    subject: 'Vật lý',
    createdAt: new Date().toISOString(),
    milestones: [
      { id: 'p1', title: 'Mốc 1: Dao động cơ học', description: 'Khảo sát con lắc lò xo và con lắc đơn', status: 'completed', rewardBadge: '⚡ Khởi đầu Vật lý', rewardPoints: 80 },
      { id: 'p2', title: 'Mốc 2: Sóng cơ & Sóng âm', description: 'Giao thoa sóng và sóng dừng trên dây', status: 'in_progress', rewardBadge: '🌊 Chuyên gia Sóng cơ', rewardPoints: 120 },
      { id: 'p3', title: 'Mốc 3: Dòng điện xoay chiều', description: 'Mạch RLC nối tiếp và công suất tiêu thụ', status: 'locked', rewardBadge: '💡 Bậc thầy RLC', rewardPoints: 200 }
    ]
  }
];

// Audio feedback helper
const playUiSound = (type: 'complete' | 'click') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'complete') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        const start = ctx.currentTime + i * 0.07;
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.2, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(start);
        o.stop(start + 0.3);
      });
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {
    // ignore
  }
};

export const StudyRoadmapMilestoneBar: React.FC<StudyRoadmapMilestoneBarProps> = ({
  activeSubject = 'all',
  studentProfile,
  onAddTask,
  onNavigateToStats
}) => {
  // Load goals from shared localStorage
  const [goals, setGoals] = useState<StudyGoal[]>(() => {
    try {
      const saved = localStorage.getItem('studyflow_study_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_GOALS_LIST;
  });

  const [activeGoalId, setActiveGoalId] = useState<string>(() => {
    return goals[0]?.id || 'g1';
  });

  const [selectedMilestone, setSelectedMilestone] = useState<GoalMilestone | null>(null);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync when storage changes
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('studyflow_study_goals');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setGoals(parsed);
        }
      } catch {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('studyflow_goals_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('studyflow_goals_updated', handleSync);
    };
  }, []);

  const saveGoals = (newGoals: StudyGoal[]) => {
    setGoals(newGoals);
    try {
      localStorage.setItem('studyflow_study_goals', JSON.stringify(newGoals));
      window.dispatchEvent(new CustomEvent('studyflow_goals_updated'));
    } catch {}
  };

  // If activeSubject changes, automatically select the goal for that subject if available
  useEffect(() => {
    if (activeSubject !== 'all') {
      const matchedGoal = goals.find(g => 
        g.subject.toLowerCase().includes(activeSubject.toLowerCase()) || 
        activeSubject.toLowerCase().includes(g.subject.toLowerCase())
      );
      if (matchedGoal) {
        setActiveGoalId(matchedGoal.id);
      }
    }
  }, [activeSubject, goals]);

  // Active goal
  const currentGoal = useMemo(() => {
    return goals.find(g => g.id === activeGoalId) || goals[0] || DEFAULT_GOALS_LIST[0];
  }, [goals, activeGoalId]);

  // Ensure milestones exist
  const milestones = currentGoal.milestones || [];

  const handleToggleMilestone = (mId: string) => {
    playUiSound('complete');
    const updatedGoals = goals.map(g => {
      if (g.id !== currentGoal.id) return g;
      const msList = [...(g.milestones || [])];
      const idx = msList.findIndex(m => m.id === mId);
      if (idx === -1) return g;

      const currentStatus = msList[idx].status;
      if (currentStatus === 'completed') {
        msList[idx].status = 'in_progress';
      } else {
        msList[idx].status = 'completed';
        // Auto unlock next milestone
        if (idx + 1 < msList.length && msList[idx + 1].status === 'locked') {
          msList[idx + 1].status = 'in_progress';
        }
      }
      return { ...g, milestones: msList };
    });

    saveGoals(updatedGoals);

    if (selectedMilestone?.id === mId) {
      setSelectedMilestone(prev => prev ? {
        ...prev,
        status: prev.status === 'completed' ? 'in_progress' : 'completed'
      } : null);
    }

    setToastMessage('Đã cập nhật trạng thái cột mốc!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleSubtask = (mId: string, subtaskId: string) => {
    const updatedGoals = goals.map(g => {
      if (g.id !== currentGoal.id) return g;
      const msList = (g.milestones || []).map(m => {
        if (m.id !== mId) return m;
        const currentTasks = m.tasks || [];
        const nextTasks = currentTasks.map(t => t.id === subtaskId ? { ...t, done: !t.done } : t);
        const allDone = nextTasks.length > 0 && nextTasks.every(t => t.done);
        return {
          ...m,
          tasks: nextTasks,
          status: allDone ? 'completed' : (m.status === 'completed' && !allDone ? 'in_progress' : m.status)
        };
      });
      return { ...g, milestones: msList };
    });

    saveGoals(updatedGoals);

    if (selectedMilestone?.id === mId) {
      const activeMs = updatedGoals.find(g => g.id === currentGoal.id)?.milestones.find(m => m.id === mId);
      if (activeMs) setSelectedMilestone(activeMs);
    }
  };

  const handleAddSubtask = (mId: string) => {
    if (!newSubtaskInput.trim()) return;
    const newTask = {
      id: `task_${Date.now()}`,
      text: newSubtaskInput.trim(),
      done: false
    };

    const updatedGoals = goals.map(g => {
      if (g.id !== currentGoal.id) return g;
      const msList = (g.milestones || []).map(m => {
        if (m.id !== mId) return m;
        return {
          ...m,
          tasks: [...(m.tasks || []), newTask]
        };
      });
      return { ...g, milestones: msList };
    });

    saveGoals(updatedGoals);
    setNewSubtaskInput('');

    if (selectedMilestone?.id === mId) {
      const activeMs = updatedGoals.find(g => g.id === currentGoal.id)?.milestones.find(m => m.id === mId);
      if (activeMs) setSelectedMilestone(activeMs);
    }
  };

  const handlePushToTasks = (text: string) => {
    if (onAddTask) {
      onAddTask({
        t: text,
        sub: currentGoal.subject || 'Toán',
        due: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        priority: 'high',
        status: 'todo',
        done: false,
        hi: true,
        note: `Đồng bộ từ Cột mốc Lộ Trình: ${selectedMilestone?.title || currentGoal.title}`
      });
      setToastMessage('Đã thêm bài tập vào danh sách To-do!');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-[#08152b] border border-slate-200/90 dark:border-cyan-500/20 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300">
      {/* Top Header Row matching Reference Image media_1793635601436_91e98c14.jpg */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-cyan-500 fill-cyan-500/20 shrink-0" />
          <h3 className="text-sm sm:text-base font-black tracking-wide text-slate-900 dark:text-white uppercase">
            {currentGoal.title}
          </h3>
          {goals.length > 1 && (
            <select
              value={activeGoalId}
              onChange={(e) => {
                setActiveGoalId(e.target.value);
                setSelectedMilestone(null);
              }}
              className="text-[11px] font-bold px-2 py-1 rounded-xl bg-slate-50 dark:bg-[#0c1e3d] border border-slate-200 dark:border-cyan-900/60 text-slate-700 dark:text-slate-200 outline-none ml-1 cursor-pointer"
            >
              {goals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.subject})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-400">
          <span>Bấm vào từng mốc để xem nhiệm vụ & nhận thưởng</span>
        </div>
      </div>

      {/* 5 Milestone Horizontal Cards Grid matching Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {milestones.map((m, idx) => {
          const isCompleted = m.status === 'completed';
          const isInProgress = m.status === 'in_progress';
          const isLocked = m.status === 'locked';

          // Clean up title and badge
          const displayIndex = String(idx + 1).padStart(2, '0');
          const cleanTitle = m.title.includes(':') ? m.title.split(':')[1].trim() : m.title;
          const badgeText = m.rewardBadge || (isCompleted ? '✓ BẬC THẦY' : '👑 QUÁN QUÂN');

          return (
            <div
              key={m.id}
              onClick={() => {
                playUiSound('click');
                setSelectedMilestone(m);
              }}
              className={`rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer select-none group relative ${
                isInProgress
                  ? 'border-2 border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-400/20 hover:scale-[1.02]'
                  : isCompleted
                  ? 'border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/25 dark:bg-emerald-950/20 shadow-xs hover:border-emerald-500 hover:shadow-md hover:scale-[1.02]'
                  : 'border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70 hover:opacity-100 hover:scale-[1.01]'
              }`}
            >
              {/* Top row: Mốc number + Circular Status Icon */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  MỐC {displayIndex}
                </span>

                {isCompleted ? (
                  <div className="w-7 h-7 rounded-full bg-[#009668] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isInProgress ? (
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs animate-pulse">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-950" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Middle: Subtitle & Title */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                  {badgeText}
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {cleanTitle}
                </h4>
              </div>

              {/* Bottom row: EXP & Status Badge */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  +{m.rewardPoints || 50} EXP
                </span>

                {isCompleted ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    XONG
                  </span>
                ) : isInProgress ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                    ĐANG LÀM
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    CHƯA MỞ
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint row matching reference image */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1 text-center">
        <span>💡</span>
        <span>Nhấp vào bất kỳ cột mốc nào để cập nhật tiến độ hoặc hoàn thành nhiệm vụ</span>
      </div>

      {/* Milestone Detail Interactive Modal / Popover */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#071328] rounded-3xl overflow-hidden dialog-depth-shadow border border-slate-200 dark:border-cyan-500/30 space-y-0 transition-all">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 dark:from-[#0a2550] dark:via-[#0c316c] dark:to-[#08456c] text-white p-5 relative border-b border-cyan-400/20">
              <button
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition interactive-spring cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Cột mốc hoàn thành
              </p>
              <h3 className="text-lg font-black text-white mt-1 leading-snug">
                {selectedMilestone.title}
              </h3>
              <p className="text-xs text-cyan-100/80 dark:text-cyan-200/80 mt-1 leading-relaxed">
                {selectedMilestone.description || 'Chinh phục kiến thức và bài tập để vượt qua mốc này.'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Task list for this milestone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Nhiệm vụ cần hoàn thành:</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    +{selectedMilestone.rewardPoints || 100} EXP
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(selectedMilestone.tasks && selectedMilestone.tasks.length > 0 ? selectedMilestone.tasks : [
                    { id: `${selectedMilestone.id}_1`, text: `Ôn tập lý thuyết chuyên đề ${selectedMilestone.title.split(':')[1]?.trim() || selectedMilestone.title}`, done: selectedMilestone.status === 'completed' },
                    { id: `${selectedMilestone.id}_2`, text: 'Làm 15-20 bài tập tự luyện và khảo sát', done: selectedMilestone.status === 'completed' },
                    { id: `${selectedMilestone.id}_3`, text: 'Kiểm tra lời giải và ghi chú công thức quan trọng', done: selectedMilestone.status === 'completed' }
                  ]).map((task) => (
                    <div 
                      key={task.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2.5 text-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleSubtask(selectedMilestone.id, task.id)}
                          className="shrink-0 text-slate-400 hover:text-emerald-600 transition"
                        >
                          {task.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span className={`font-semibold truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {task.text}
                        </span>
                      </div>

                      {onAddTask && (
                        <button
                          onClick={() => handlePushToTasks(task.text)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-600 transition shrink-0"
                          title="Tạo thành việc cần làm trong To-do List"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Add Subtask Input (Matching media_1793640773431_e09bd497.png) */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(selectedMilestone.id)}
                  placeholder="Thêm bài tập/mục tiêu..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button
                  onClick={() => handleAddSubtask(selectedMilestone.id)}
                  className="px-4 py-2.5 rounded-2xl bg-[#009668] hover:bg-[#008058] text-white font-bold text-xs transition active:scale-95 shadow-xs"
                >
                  Thêm
                </button>
              </div>

              {/* Action Buttons: Pass Milestone ("✓ ✓ Vượt mốc") & Reset/Delete */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleToggleMilestone(selectedMilestone.id)}
                  className={`flex-1 py-3 rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-md ${
                    selectedMilestone.status === 'completed'
                      ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      : 'bg-[#009668] hover:bg-[#008058] text-white shadow-emerald-600/20'
                  }`}
                >
                  {selectedMilestone.status === 'completed' ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đặt lại mốc</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-black tracking-tighter">✓ ✓</span>
                      <span>Vượt mốc</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    handleToggleMilestone(selectedMilestone.id);
                  }}
                  className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800 transition active:scale-95 shrink-0"
                  title="Đặt lại mốc hoặc xoá"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
