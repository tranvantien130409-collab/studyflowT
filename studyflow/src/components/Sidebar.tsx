import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Clock, 
  BookOpen, 
  Lightbulb, 
  ShieldCheck,
  Sparkles,
  Hourglass,
  GraduationCap,
  Users,
  MessageCircle,
  Pencil,
  X,
  Globe,
  ExternalLink,
  Layers,
  Maximize2,
  LogOut,
  Moon,
  Sun,
  Zap,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import studyflowLogoMark from '/assets/aistudio/logo_studyflow_clean.png';
import { ViewTab, StudentProfile } from '../types';
import { STUDY_TIPS, COPYRIGHT_INFO } from '../data/initialData';
import { Avatar } from './Avatar';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  pendingTasksCount: number;
  todayEventsCount: number;
  onOpenCopyright: () => void;
  onOpenJoinClass: () => void;
  onOpenAiTutor?: () => void;
  studentProfile?: StudentProfile;
  onOpenStudentProfile?: () => void;
  unreadNoticeCount?: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingTasksCount,
  todayEventsCount,
  onOpenCopyright,
  onOpenJoinClass,
  onOpenAiTutor,
  studentProfile,
  onOpenStudentProfile,
  unreadNoticeCount = 0,
  theme,
  onToggleTheme,
  onLogout
}) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [isTipOpen, setIsTipOpen] = useState(false);

  useEffect(() => {
    // Random tip on load or daily
    const daySeed = new Date().getDate() % STUDY_TIPS.length;
    setTipIndex(daySeed);
  }, []);

  const mainNavItems = [
    { id: 'overview' as ViewTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'focus' as ViewTab, label: 'Sessions', icon: Clock },
    { id: 'tasks' as ViewTab, label: 'Tasks', icon: CheckSquare, badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : undefined, badgeColor: 'bg-[#1e293b] text-slate-300' },
    { id: 'exams' as ViewTab, label: 'Courses', icon: GraduationCap },
    { id: 'calendar' as ViewTab, label: 'Calendar', icon: Calendar },
    { id: 'flashcards' as ViewTab, label: 'Flashcards', icon: Layers },
    { id: 'ai_studio' as ViewTab, label: 'AI Assistant', icon: Sparkles, badge: 'AI', badgeColor: 'bg-[#6366f1] text-white' },
    { id: 'stats' as ViewTab, label: 'Reports', icon: BarChart3 },
  ];

  const toolsNavItems = [
    { id: 'group_study' as ViewTab, label: 'Phòng học nhóm', icon: Users, badge: 'Live' },
    { id: 'notices' as ViewTab, label: 'News & Alerts', icon: MessageCircle, badge: unreadNoticeCount > 0 ? 'Mới' : undefined },
    { id: 'library' as ViewTab, label: 'Library', icon: BookOpen },
    { id: 'countdown' as ViewTab, label: 'Exam Countdown', icon: Hourglass }
  ];

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isGoalExpanded, setIsGoalExpanded] = useState(false);
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);

  return (
    <aside className="w-64 bg-gradient-to-b from-[#030713] via-[#060e20] to-[#02050e] border-r border-cyan-500/15 flex flex-col h-screen sticky top-0 shrink-0 select-none text-slate-300 relative overflow-hidden shadow-[4px_0_30px_rgba(2,6,23,0.8)] z-30">
      {/* Ambient Neon Atmosphere Orbs */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header - Full Logo Image with Neon Running Light Border */}
      <div className="p-3 border-b border-cyan-500/15 relative z-10">
        <div 
          onClick={() => onSelectTab('overview')}
          className="relative h-24 rounded-3xl cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden group shadow-[0_8px_25px_-5px_rgba(6,182,212,0.25)]"
        >
          {/* Animated Running Light Border */}
          <div className="absolute inset-0 z-0 bg-[#020617]">
            <div className="absolute inset-[-150%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,transparent_35%,#06b6d4_65%,#6366f1_85%,#06b6d4_100%)] opacity-90 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* Inner Content Area with Luxury Pearl Badge */}
          <div className="absolute inset-[2.5px] bg-gradient-to-b from-white via-[#fcfdff] to-[#f0f4f9] rounded-[22px] z-10 flex items-center justify-center overflow-hidden ring-1 ring-cyan-500/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.15)]">
            <img 
              src="/assets/aistudio/image_01a75996.png" 
              alt="StudyFlow" 
              className="w-full h-auto max-h-24 object-contain brightness-[1.05] contrast-[1.05] drop-shadow-sm scale-[1.1] origin-center group-hover:scale-[1.18] transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* Navigation Links - Scrollable without visible scrollbar */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3 space-y-1 relative z-10">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isAiTab = item.id === 'ai_studio';

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[11px] font-bold transition-all duration-300 group active:scale-[0.98] ${
                  isActive
                    ? item.id === 'tasks' || item.id === 'flashcards' || item.id === 'focus'
                      ? 'bg-gradient-to-r from-[#031428] via-[#051c38] to-[#041428] text-cyan-300 border border-cyan-400/50 shadow-[0_4px_20px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                      : isAiTab
                      ? 'bg-gradient-to-r from-[#07243c] via-[#0c3154] to-[#081f37] text-cyan-200 border border-cyan-400/50 shadow-[0_4px_20px_rgba(6,182,212,0.28),inset_0_1px_1px_rgba(255,255,255,0.1)]'
                      : 'bg-gradient-to-r from-[#091a32] via-[#0b1f3c] to-[#071324] text-cyan-300 border border-cyan-500/30 shadow-[0_4px_16px_rgba(6,182,212,0.18),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                    : isAiTab
                    ? 'bg-gradient-to-r from-[#061527]/90 to-[#091f38]/80 text-cyan-300/90 border border-cyan-500/25 hover:border-cyan-400/50 hover:bg-[#0c2847] hover:text-cyan-100 shadow-[0_2px_12px_rgba(6,182,212,0.12)]'
                    : 'text-slate-400 hover:text-cyan-200 hover:bg-gradient-to-r hover:from-cyan-950/40 hover:via-[#09182d]/50 hover:to-transparent border border-transparent hover:border-cyan-500/20 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-7 rounded-r-md shadow-[0_0_12px_#06b6d4] ${
                    item.id === 'tasks' || item.id === 'flashcards' || item.id === 'focus'
                      ? 'bg-gradient-to-b from-cyan-300 via-cyan-400 to-blue-500'
                      : isAiTab 
                      ? 'bg-gradient-to-b from-cyan-300 to-indigo-400' 
                      : 'bg-gradient-to-b from-cyan-400 to-blue-500'
                  }`} />
                )}

                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-all duration-300 ${
                    isActive 
                      ? item.id === 'tasks' || item.id === 'flashcards' || item.id === 'focus'
                        ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] stroke-[2.3]'
                        : isAiTab 
                        ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse' 
                        : 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.7)]'
                      : isAiTab
                      ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                      : 'text-slate-500 group-hover:text-cyan-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                  }`} />
                  <span className={`tracking-wide ${isActive && (item.id === 'tasks' || item.id === 'flashcards' || item.id === 'focus') ? 'font-extrabold text-cyan-200' : ''}`}>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 min-w-[22px] text-center rounded-full transition-all duration-300 ${
                      item.id === 'tasks'
                        ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(34,211,238,0.85)] border border-cyan-200/80'
                        : isAiTab
                        ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)] border border-cyan-300/40 tracking-wider font-extrabold'
                        : isActive
                        ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                        : item.badgeColor || 'bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Combined Tools Item - Grouped */}
          <div className="pt-2">
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                isToolsOpen 
                  ? 'text-cyan-300 bg-[#07152b] border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-[#07152b]/60 border border-transparent hover:border-cyan-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <MoreHorizontal className="w-4 h-4 text-cyan-400" />
                <span>Tiện ích mở rộng</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isToolsOpen ? 'rotate-90 text-cyan-400' : 'text-slate-500'}`} />
            </button>

            {isToolsOpen && (
              <div className="mt-1.5 ml-3 border-l border-cyan-500/20 pl-2.5 space-y-1 animate-in slide-in-from-top-1 duration-200">
                {toolsNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer active:scale-95 group ${
                        isActive 
                          ? 'bg-gradient-to-r from-[#07243c] via-[#0c3154] to-[#081f37] text-cyan-200 border border-cyan-400/50 shadow-[0_4px_18px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                          : 'text-slate-400 hover:text-cyan-200 hover:bg-gradient-to-r hover:from-cyan-950/40 hover:via-[#09182d]/50 hover:to-transparent border border-transparent hover:border-cyan-500/20 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-300 filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]' : 'text-cyan-400/80'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300/40 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button onClick={onOpenJoinClass} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition-all duration-300">
                  <Users className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Gia nhập lớp học</span>
                </button>
                <button onClick={onOpenCopyright} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all duration-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>Bản quyền & HD</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom Section: Weekly Goal & Study Tips */}
      <div className="px-3 py-3 space-y-2 relative z-10 border-t border-cyan-500/15 bg-gradient-to-t from-[#02050e] to-transparent">
        {/* Weekly Goal Card - Luxury Navy with Emerald Neon */}
        <div className={`bg-gradient-to-br from-[#061426] via-[#091e36] to-[#040c18] border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.12)] relative overflow-hidden group ${
          isGoalExpanded ? 'p-3 space-y-2.5' : 'p-2.5'
        }`}>
          {/* Subtle Ambient Glow */}
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />

          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsGoalExpanded(!isGoalExpanded)}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-emerald-400 to-teal-300 rounded-full shadow-[0_0_10px_#10b981]" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Mục tiêu tuần</h3>
            </div>
            <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isGoalExpanded ? '' : '-rotate-90 text-emerald-400'}`} />
          </div>

          {isGoalExpanded && (
            <div className="space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">3.5h</span>
                    <span className="text-[9px] font-bold text-slate-400">/ 25h</span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">14%</span>
                </div>
                <div className="h-1.5 w-full bg-[#030914] border border-emerald-500/20 rounded-full overflow-hidden p-[1px]">
                  <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]" style={{ width: '14%' }} />
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onSelectTab('focus'); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-emerald-500/20 hover:from-emerald-500/30 hover:to-teal-500/40 border border-emerald-400/50 text-emerald-300 font-black text-[9.5px] uppercase tracking-wider shadow-[0_0_16px_rgba(16,185,129,0.25)] transition-all active:scale-95"
              >
                <Zap className="w-3 h-3 fill-current animate-pulse" />
                <span>Học ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* Study Tips Card - Luxury Navy with Indigo/Amber Neon */}
        <div className={`bg-gradient-to-br from-[#07132a] via-[#0d2042] to-[#050e1f] border border-indigo-500/30 hover:border-indigo-400/60 rounded-2xl relative overflow-hidden group transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(99,102,241,0.12)] ${
          isTipsExpanded ? 'p-3 space-y-2' : 'p-2.5'
        }`}>
          {/* Subtle Ambient Glow */}
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />

          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsTipsExpanded(!isTipsExpanded)}>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse" />
              <h3 className="text-[10px] font-black text-indigo-100 uppercase tracking-wider">Mẹo học tập</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {isTipsExpanded && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setTipIndex((prev) => (prev + 1) % STUDY_TIPS.length); }}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition duration-300 active:rotate-180"
                  title="Xem mẹo khác"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              )}
              <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isTipsExpanded ? '' : '-rotate-90 text-indigo-400'}`} />
            </div>
          </div>
          
          {isTipsExpanded && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200 relative z-10">
              <div className="bg-[#030814]/70 border border-indigo-500/20 rounded-xl p-2.5">
                <p className="text-[9px] leading-relaxed text-indigo-200/90 font-medium italic relative z-10">
                  "{STUDY_TIPS[tipIndex]}"
                </p>
              </div>
            </div>
          )}
          
          <div className="absolute -bottom-2 -right-2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
        </div>

      </div>
    </aside>
  );
};
