import React, { useState, useMemo } from 'react';
import { 
  X, 
  BarChart2, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Scale, 
  Clock, 
  Target, 
  BookOpen, 
  ArrowRight, 
  Sliders, 
  Zap, 
  CheckCircle2, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskItem, DayFocusSession, ViewTab } from '../types';
import { calculateStudyBalance, SubjectScore, SubjectBalanceAnalysis } from '../utils/studyBalanceUtils';

interface SmartBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  sessions?: DayFocusSession;
  subjectScores: SubjectScore[];
  gpaGoal: number;
  onSelectTab?: (tab: ViewTab) => void;
}

export const SmartBalanceModal: React.FC<SmartBalanceModalProps> = ({
  isOpen,
  onClose,
  tasks,
  sessions = {},
  subjectScores,
  gpaGoal,
  onSelectTab
}) => {
  const [strategy, setStrategy] = useState<'smart' | 'boost_weak' | 'urgent_deadline'>('smart');
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('studyflow_target_weekly_hours');
      return saved ? parseFloat(saved) : 24;
    } catch {
      return 24;
    }
  });

  const [isApplied, setIsApplied] = useState(false);

  // Compute balance analysis
  const balanceData = useMemo(() => {
    // If boost weak strategy: amplify gaps
    let adjustedScores = [...subjectScores];
    if (strategy === 'boost_weak') {
      adjustedScores = adjustedScores.map(s => {
        const gap = s.target - s.score;
        return gap > 0 ? { ...s, target: s.target + 0.3 } : s;
      });
    }

    return calculateStudyBalance(adjustedScores, tasks, sessions, targetWeeklyHours);
  }, [subjectScores, tasks, sessions, targetWeeklyHours, strategy]);

  const handleApplyAllocation = () => {
    try {
      const allocationMap: Record<string, number> = {};
      balanceData.analyses.forEach(a => {
        allocationMap[a.name] = a.recommendedHoursPerWeek;
      });
      localStorage.setItem('studyflow_study_allocation', JSON.stringify({
        date: new Date().toISOString(),
        weeklyHours: targetWeeklyHours,
        strategy,
        allocation: allocationMap
      }));
      localStorage.setItem('studyflow_target_weekly_hours', targetWeeklyHours.toString());
      window.dispatchEvent(new CustomEvent('studyflow_allocation_applied', { detail: allocationMap }));
      setIsApplied(true);
      setTimeout(() => {
        setIsApplied(false);
      }, 3000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-gradient-to-b dark:from-[#091730] dark:via-[#071326] dark:to-[#040914] border border-slate-200 dark:border-cyan-500/30 rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col dialog-depth-shadow overflow-hidden relative shadow-2xl transition-all duration-300"
      >
        {/* Top Neon Header Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-cyan-950/60 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#071428]/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Tự Động Phân Bổ & Cân Bằng Học Tập
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  Dữ liệu Thống Kê
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-cyan-300/70 mt-0.5">
                Thuật toán tối ưu hóa tỷ trọng thời gian dựa trên điểm số thực tế, bài tập và hạn chót
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-cyan-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 interactive-spring cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Balance Score */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200/80 dark:border-purple-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                  Chỉ Số Cân Bằng Học Tập
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {balanceData.overallBalanceScore}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ 100</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {balanceData.overallBalanceScore >= 80 ? '🟢 Phân bổ rất hài hòa' : balanceData.overallBalanceScore >= 60 ? '🟡 Có độ lệch cục bộ' : '🔴 Cần điều chỉnh gấp'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-purple-500/20">
                {balanceData.overallBalanceScore}%
              </div>
            </div>

            {/* GPA Goal & Gap */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Mục Tiêu GPA & Tải Lượng
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {gpaGoal.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ({balanceData.criticalCount} môn đang lệch điểm)
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                {tasks.filter(t => !t.done).length} bài tập đang chờ xử lý
              </p>
            </div>

            {/* Weekly Target Hours Slider */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Tổng Giờ Học Tuần Này
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {targetWeeklyHours}h / tuần
                </span>
              </div>
              <input 
                type="range"
                min="12"
                max="45"
                step="1"
                value={targetWeeklyHours}
                onChange={(e) => setTargetWeeklyHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>12h (Nhẹ)</span>
                <span>24h (Chuẩn)</span>
                <span>45h (Cao độ)</span>
              </div>
            </div>
          </div>

          {/* Strategy Selector Pills */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-1.5">
            <button
              onClick={() => setStrategy('smart')}
              className={`flex-1 w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                strategy === 'smart' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cân Bằng Thông Minh (Chuẩn)</span>
            </button>

            <button
              onClick={() => setStrategy('boost_weak')}
              className={`flex-1 w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                strategy === 'boost_weak' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Chiến Lược Cứu Môn Yếu</span>
            </button>

            <button
              onClick={() => setStrategy('urgent_deadline')}
              className={`flex-1 w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                strategy === 'urgent_deadline' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Chạy Nước Rút Hạn Chót</span>
            </button>
          </div>

          {/* Top Recommendation Box */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-black block mb-0.5">Phân tích từ Thống kê điểm & Tiến độ:</strong>
              {balanceData.topRecommendation}
            </div>
          </div>

          {/* Detailed Subject Allocation Table / Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider px-1">
              <span>Bảng phân bổ chi tiết 9 môn</span>
              <span className="text-[10px] text-slate-400 normal-case font-bold">
                Tỷ trọng hiện tại vs Tỷ trọng đề xuất
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {balanceData.analyses.map((item) => {
                const isCritical = item.status === 'critical';
                const isWarning = item.status === 'warning';
                const isAchieved = item.status === 'achieved';

                return (
                  <div 
                    key={item.name}
                    className={`p-4 rounded-2xl border transition bg-white dark:bg-slate-800/80 shadow-xs space-y-3 ${
                      isCritical 
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20' 
                        : isWarning 
                        ? 'border-amber-200 dark:border-amber-800' 
                        : isAchieved
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/20'
                        : 'border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {/* Header: Name, Score & Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {item.currentScore.toFixed(1)} / {item.targetScore.toFixed(1)}
                        </span>
                        {item.gap > 0 && (
                          <span className="text-[10px] font-black text-rose-500">
                            (-{item.gap.toFixed(1)}đ)
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                          : isWarning 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
                          : isAchieved 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {item.statusLabel}
                      </span>
                    </div>

                    {/* Progress Bar: Current vs Recommended Allocation */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Đề xuất: <strong className="text-purple-600 dark:text-purple-400 font-black">{item.recommendedHoursPerWeek} giờ ({item.recommendedAllocationPercent}%)</strong></span>
                        <span>Hiện tại: ~{item.actualHours}h ({item.currentAllocationPercent}%)</span>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, item.recommendedAllocationPercent * 3)}%` }}
                        />
                      </div>
                    </div>

                    {/* Advice note & tasks tags */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                      <span className="truncate pr-2">{item.advice}</span>
                      <span className="shrink-0 font-bold text-slate-700 dark:text-slate-300">
                        {item.pendingTasksCount} bài tập {item.urgentTasksCount > 0 ? `(${item.urgentTasksCount} gấp)` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onSelectTab) onSelectTab('stats');
              }}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Xem biểu đồ & sửa điểm tại Trang Thống Kê</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 interactive-spring cursor-pointer"
            >
              Đóng
            </button>

            <button
              onClick={handleApplyAllocation}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-lg interactive-spring flex items-center justify-center gap-2 cursor-pointer ${
                isApplied 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 border border-emerald-400/40' 
                  : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-500/25 border border-cyan-400/30'
              }`}
            >
              {isApplied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã Áp Dụng Cân Bằng!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span>Tự Động Áp Dụng Phân Bổ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
