import React, { useState, useEffect } from 'react';
import { 
  Hourglass, 
  Plus, 
  Trash2, 
  Edit3, 
  Target, 
  Sparkles, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Check,
  Flame,
  GraduationCap
} from 'lucide-react';
import { CountdownItem } from '../types';
import { pad, formatDate } from '../data/initialData';

interface CountdownViewProps {
  countdowns: CountdownItem[];
  onAddCountdown: (item: Omit<CountdownItem, 'id'>) => void;
  onUpdateCountdown: (item: CountdownItem) => void;
  onDeleteCountdown: (id: number) => void;
  embedded?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

function calculateTimeRemaining(targetDateStr: string, targetTimeStr = '07:30'): TimeRemaining {
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const [hour, min] = targetTimeStr.split(':').map(Number);
  const target = new Date(year, month - 1, day, hour || 7, min || 30, 0, 0).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, totalMs: diff, isPast: false };
}

const CATEGORY_MAP: Record<string, { label: string; icon: typeof GraduationCap }> = {
  thpt: { label: 'Thi THPT Quốc Gia', icon: GraduationCap },
  hsg: { label: 'Thi Học Sinh Giỏi (HSG)', icon: Award },
  term: { label: 'Thi Học Kỳ / Giữa Kỳ', icon: Calendar },
  cert: { label: 'Chứng Chỉ Quốc Tế', icon: Target },
  other: { label: 'Mục Tiêu Khác', icon: Sparkles }
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; heroGradient: string; glow: string }> = {
  rose: {
    bg: 'bg-gradient-to-br from-rose-50/90 via-pink-50/70 to-rose-100/50 dark:from-[#210915] dark:via-[#16050e] dark:to-[#071328]',
    text: 'text-rose-900 dark:text-rose-200',
    border: 'border-rose-300 dark:border-rose-700/50',
    heroGradient: 'from-[#0a142e] via-[#1c0f2b] to-[#2d0e1f]',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]'
  },
  emerald: {
    bg: 'bg-gradient-to-br from-cyan-50/90 via-sky-50/70 to-blue-50/50 dark:from-[#061e2a] dark:via-[#041620] dark:to-[#071328]',
    text: 'text-cyan-900 dark:text-cyan-200',
    border: 'border-cyan-300 dark:border-cyan-700/50',
    heroGradient: 'from-[#040e24] via-[#082238] to-[#041829]',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]'
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-amber-100/50 dark:from-[#261605] dark:via-[#1a0e03] dark:to-[#071328]',
    text: 'text-amber-900 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-700/50',
    heroGradient: 'from-[#061026] via-[#1f150a] to-[#2b1703]',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-sky-100/50 dark:from-[#091738] dark:via-[#061026] dark:to-[#071328]',
    text: 'text-blue-900 dark:text-cyan-200',
    border: 'border-blue-300 dark:border-cyan-700/50',
    heroGradient: 'from-[#030a1b] via-[#091a42] to-[#05244b]',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)]'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50/90 via-violet-50/70 to-purple-100/50 dark:from-[#1b092e] dark:via-[#11051e] dark:to-[#071328]',
    text: 'text-purple-900 dark:text-purple-200',
    border: 'border-purple-300 dark:border-purple-700/50',
    heroGradient: 'from-[#060c22] via-[#1a1036] to-[#280d42]',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
  }
};

export const CountdownView: React.FC<CountdownViewProps> = ({
  countdowns,
  onAddCountdown,
  onUpdateCountdown,
  onDeleteCountdown,
  embedded = false
}) => {
  // Live ticking state (updates every second)
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CountdownItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('07:30');
  const [formCategory, setFormCategory] = useState<CountdownItem['category']>('thpt');
  const [formColor, setFormColor] = useState('rose');
  const [formScore, setFormScore] = useState('');
  const [formNote, setFormNote] = useState('');

  // Handle open add modal
  const handleOpenAddModal = (preset?: Partial<CountdownItem>) => {
    setEditingItem(null);
    setFormTitle(preset?.title || '');
    setFormDate(preset?.targetDate || '2027-06-26');
    setFormTime(preset?.targetTime || '07:30');
    setFormCategory(preset?.category || 'thpt');
    setFormColor(preset?.color || 'rose');
    setFormScore(preset?.targetScore || '');
    setFormNote(preset?.note || '');
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (item: CountdownItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDate(item.targetDate);
    setFormTime(item.targetTime || '07:30');
    setFormCategory(item.category);
    setFormColor(item.color || 'rose');
    setFormScore(item.targetScore || '');
    setFormNote(item.note || '');
    setIsModalOpen(true);
  };

  const handleSaveCountdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    if (editingItem) {
      onUpdateCountdown({
        ...editingItem,
        title: formTitle.trim(),
        targetDate: formDate,
        targetTime: formTime || '07:30',
        category: formCategory,
        color: formColor,
        targetScore: formScore.trim() || undefined,
        note: formNote.trim() || undefined
      });
    } else {
      onAddCountdown({
        title: formTitle.trim(),
        targetDate: formDate,
        targetTime: formTime || '07:30',
        category: formCategory,
        color: formColor,
        targetScore: formScore.trim() || undefined,
        note: formNote.trim() || undefined
      });
    }

    setIsModalOpen(false);
  };

  // Sort countdowns by earliest target date
  const sortedCountdowns = [...countdowns].sort((a, b) => {
    const timeA = new Date(`${a.targetDate}T${a.targetTime || '07:30'}`).getTime();
    const timeB = new Date(`${b.targetDate}T${b.targetTime || '07:30'}`).getTime();
    return timeA - timeB;
  });

  // Filter countdowns
  const filteredCountdowns = sortedCountdowns.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  // Nearest future exam for Hero Banner
  const nearestExam = sortedCountdowns.find((c) => {
    const rem = calculateTimeRemaining(c.targetDate, c.targetTime);
    return !rem.isPast;
  }) || sortedCountdowns[0];

  const nearestRem = nearestExam ? calculateTimeRemaining(nearestExam.targetDate, nearestExam.targetTime) : null;
  const nearestColor = nearestExam ? (COLOR_MAP[nearestExam.color || 'rose'] || COLOR_MAP.rose) : COLOR_MAP.rose;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-cyan-500/20">
        <div>
          <h2 className={`${embedded ? 'text-lg sm:text-xl' : 'text-xl md:text-2xl'} font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600/20 via-cyan-500/20 to-indigo-600/20 text-cyan-500 flex items-center justify-center border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Hourglass className="w-4 h-4 text-cyan-400 animate-spin-slow shrink-0" />
            </div>
            <span>{embedded ? 'Đếm ngược Kỳ thi & Mục tiêu quan trọng' : 'Đếm ngược'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi từng ngày, giờ, phút đến các kỳ thi và sự kiện quan trọng trong năm học
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 rounded-xl transition-all shadow-md shadow-cyan-600/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mục tiêu đếm ngược</span>
        </button>
      </div>

      {/* Hero Countdown Banner (Nearest Goal) */}
      {nearestExam && nearestRem && (
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r ${nearestColor.heroGradient} text-white border border-white/20 dark:border-cyan-500/30 shadow-2xl ${nearestColor.glow}`}>
          {/* Ambient cosmic lighting in banner */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-cyan-500/30 text-xs font-bold text-cyan-200">
                <Flame className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                <span>Kỳ thi quan trọng tiếp theo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug drop-shadow-sm">
                {nearestExam.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/90">
                <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-cyan-300" />
                  Ngày thi: {nearestExam.targetDate.split('-').reverse().join('/')} ({nearestExam.targetTime || '07:30'})
                </span>
                {nearestExam.targetScore && (
                  <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 font-semibold text-cyan-200">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    {nearestExam.targetScore}
                  </span>
                )}
              </div>
              {nearestExam.note && (
                <p className="text-xs italic text-white/85 pt-1 border-t border-white/15">
                  "{nearestExam.note}"
                </p>
              )}
            </div>

            {/* Live Big Clock Counters */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center shrink-0">
              <div className="bg-white/10 dark:bg-[#030919]/70 backdrop-blur-md border border-white/20 dark:border-cyan-500/25 rounded-2xl p-2.5 sm:p-3.5 min-w-[64px] sm:min-w-[82px] shadow-sm">
                <span className="block text-2xl sm:text-4xl font-black font-mono tracking-tight leading-none text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  {nearestRem.days}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80 mt-1 block">
                  Ngày
                </span>
              </div>

              <div className="bg-white/10 dark:bg-[#030919]/70 backdrop-blur-md border border-white/20 dark:border-cyan-500/25 rounded-2xl p-2.5 sm:p-3.5 min-w-[64px] sm:min-w-[82px] shadow-sm">
                <span className="block text-2xl sm:text-4xl font-black font-mono tracking-tight leading-none text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  {pad(nearestRem.hours)}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80 mt-1 block">
                  Giờ
                </span>
              </div>

              <div className="bg-white/10 dark:bg-[#030919]/70 backdrop-blur-md border border-white/20 dark:border-cyan-500/25 rounded-2xl p-2.5 sm:p-3.5 min-w-[64px] sm:min-w-[82px] shadow-sm">
                <span className="block text-2xl sm:text-4xl font-black font-mono tracking-tight leading-none text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  {pad(nearestRem.minutes)}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80 mt-1 block">
                  Phút
                </span>
              </div>

              <div className="bg-white/20 dark:bg-[#030919]/90 backdrop-blur-md border border-white/30 dark:border-cyan-400/50 rounded-2xl p-2.5 sm:p-3.5 min-w-[64px] sm:min-w-[82px] shadow-md shadow-cyan-500/25">
                <span className="block text-2xl sm:text-4xl font-black font-mono tracking-tight leading-none text-cyan-300 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                  {pad(nearestRem.seconds)}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-90 mt-1 block text-cyan-200">
                  Giây
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Category Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/30 scale-[1.02]'
              : 'bg-white/80 dark:bg-[#071328]/80 border border-slate-200/80 dark:border-cyan-500/20 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40 hover:text-cyan-600'
          }`}
        >
          Tất cả ({countdowns.length})
        </button>

        {Object.entries(CATEGORY_MAP).map(([catKey, catInfo]) => {
          const count = countdowns.filter((c) => c.category === catKey).length;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/30 scale-[1.02]'
                  : 'bg-white/80 dark:bg-[#071328]/80 border border-slate-200/80 dark:border-cyan-500/20 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40 hover:text-cyan-600'
              }`}
            >
              {catInfo.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Countdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCountdowns.map((item) => {
          const rem = calculateTimeRemaining(item.targetDate, item.targetTime);
          const colorTheme = COLOR_MAP[item.color || 'rose'] || COLOR_MAP.rose;
          const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
          const CatIcon = catInfo.icon;

          return (
            <div
              key={item.id}
              className="bg-white/90 dark:bg-[#071328]/90 backdrop-blur-md border border-slate-200/80 dark:border-cyan-500/20 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-cyan-400/60 dark:hover:border-cyan-400/60 hover:shadow-[0_10px_35px_rgba(6,182,212,0.2)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div>
                {/* Top bar: Category badge & Actions */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-xl border ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border}`}>
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{catInfo.label}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Sửa mục đếm ngược"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCountdown(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Xóa kỳ thi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>

                {/* Target date and score badge */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                    {item.targetDate.split('-').reverse().join('/')} ({item.targetTime || '07:30'})
                  </span>
                  {item.targetScore && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#030919] font-semibold text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/20">
                      <Target className="w-3 h-3 text-cyan-500" />
                      {item.targetScore}
                    </span>
                  )}
                </div>

                {/* Motivational Quote */}
                {item.note && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-3 bg-slate-50 dark:bg-[#040c1a]/80 p-2.5 rounded-xl border border-slate-100 dark:border-cyan-500/20">
                    "{item.note}"
                  </p>
                )}
              </div>

              {/* Countdown Ticker Box */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                {rem.isPast ? (
                  <div className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#030919] text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-500" />
                    <span>Kỳ thi đã diễn ra</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-50 dark:bg-[#030919] p-2 rounded-xl border border-slate-100 dark:border-cyan-500/20">
                      <span className="block text-xl font-black font-mono text-slate-900 dark:text-white">
                        {rem.days}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Ngày
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#030919] p-2 rounded-xl border border-slate-100 dark:border-cyan-500/20">
                      <span className="block text-xl font-black font-mono text-slate-900 dark:text-white">
                        {pad(rem.hours)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Giờ
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#030919] p-2 rounded-xl border border-slate-100 dark:border-cyan-500/20">
                      <span className="block text-xl font-black font-mono text-slate-900 dark:text-white">
                        {pad(rem.minutes)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Phút
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#030919] p-2 rounded-xl border border-slate-100 dark:border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                      <span className="block text-xl font-black font-mono text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                        {pad(rem.seconds)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Giây
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCountdowns.length === 0 && (
        <div className="bg-white/80 dark:bg-[#071328]/80 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-200/80 dark:border-cyan-500/20 text-slate-400 text-xs">
          Không có kỳ thi nào trong danh mục này. Hãy bấm "Thêm mục tiêu đếm ngược" để bắt đầu theo dõi!
        </div>
      )}

      {/* Add / Edit Countdown Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#071328]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-cyan-500/30 rounded-3xl calendar-modal-shadow animate-modal-spring p-6">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4 bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-transparent -mx-6 -mt-6 p-6 rounded-t-3xl">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  <Hourglass className="w-4 h-4 text-cyan-400" />
                </div>
                <span>{editingItem ? 'Chỉnh sửa kỳ thi đếm ngược' : 'Thêm kỳ thi / Mục tiêu mới'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCountdown} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên kỳ thi / Mục tiêu *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Kỳ thi Tốt nghiệp THPT 2027, Thi HSG Toán Cấp Tỉnh..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày thi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giờ thi
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phân loại
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CountdownItem['category'])}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Màu sắc hiển thị
                  </label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="rose">Đỏ hồng (THPT)</option>
                    <option value="emerald">Xanh ngọc / lục (HSG)</option>
                    <option value="amber">Vàng cam (Học kỳ)</option>
                    <option value="blue">Xanh dương (Chứng chỉ)</option>
                    <option value="purple">Tím (Cá nhân)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mục tiêu điểm số / Kết quả mong đợi
                </label>
                <input
                  type="text"
                  value={formScore}
                  onChange={(e) => setFormScore(e.target.value)}
                  placeholder="Ví dụ: 28.5 điểm Khối A00, Giải Nhất Tỉnh, IELTS 7.5..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lời nhắn nhủ / Khẩu hiệu truyền động lực
                </label>
                <textarea
                  rows={3}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Viết lời nhắn gửi cho chính mình để giữ vững ngọn lửa quyết tâm..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 rounded-xl transition-all shadow-md shadow-cyan-600/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Lưu thay đổi' : 'Thêm đếm ngược'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
