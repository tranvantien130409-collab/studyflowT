import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Layers, 
  Sparkles, 
  Database, 
  ClipboardList, 
  Send, 
  Flame, 
  BarChart2, 
  TrendingUp, 
  Bot, 
  Settings, 
  GraduationCap, 
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Globe,
  ExternalLink
} from 'lucide-react';
// import removed
import { TeacherTab, TeacherProfile } from '../types';
import { Avatar } from './Avatar';

interface TeacherSidebarProps {
  currentTab: TeacherTab;
  onSelectTab: (tab: TeacherTab) => void;
  profile: TeacherProfile;
  onSwitchToStudent: () => void;
  onOpenCopyright: () => void;
  onOpenProfileModal: () => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  onSwitchToStudent,
  onOpenCopyright,
  onOpenProfileModal
}) => {
  const teacherNavItems = [
    { id: 'overview' as TeacherTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'classes' as TeacherTab, label: 'Lớp & Học sinh', icon: Users },
    { id: 'notices' as TeacherTab, label: 'NEWS', icon: MessageCircle },
    { id: 'materials' as TeacherTab, label: 'Học liệu', icon: BookOpen },
    { id: 'ai_material' as TeacherTab, label: 'AI tạo học liệu', icon: Sparkles, badge: 'AI', isAi: true },
    { id: 'exams' as TeacherTab, label: 'Thi cử', icon: ClipboardList },
    { id: 'assign' as TeacherTab, label: 'Giao nhiệm vụ', icon: Send },
    { id: 'ai_assistant' as TeacherTab, label: 'Trợ lý AI', icon: Bot, badge: 'Pro', isAi: true },
    { id: 'vnedu' as any, label: 'VNEDU', icon: Globe, isExternal: true, externalUrl: 'https://user.vnedu.vn/sso//?use_cache=0&continue=tracuu.vnedu.vn/kqht/' },
    { id: 'settings' as TeacherTab, label: 'Cài đặt & Đổi MK', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-[#030713] via-[#060e20] to-[#02050e] text-slate-100 flex flex-col h-screen sticky top-0 shrink-0 select-none border-r border-cyan-500/15 z-30 shadow-[4px_0_30px_rgba(2,6,23,0.8)]">
      {/* Brand Header - Full Logo Image */}
      <div className="p-3 border-b border-cyan-500/15">
        <div 
          onClick={() => {
            onSelectTab('overview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="relative h-24 rounded-3xl cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden group shadow-[0_8px_25px_-5px_rgba(255,51,102,0.25)]"
        >
          {/* Animated Running Light Border */}
          <div className="absolute inset-0 z-0 bg-[#020617]">
            <div className="absolute inset-[-150%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,transparent_35%,#ff3366_65%,#06b6d4_85%,#ff3366_100%)] opacity-90 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* Inner Content Area */}
          <div className="absolute inset-[2.5px] bg-gradient-to-b from-white via-[#fcfdff] to-[#f0f4f9] rounded-[22px] z-10 flex items-center justify-center overflow-hidden ring-1 ring-cyan-500/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.15)]">
            <img 
              src="/assets/aistudio/image_01a75996.png" 
              alt="StudyFlow" 
              className="w-full h-auto max-h-24 object-contain brightness-[1.05] contrast-[1.05] drop-shadow-sm scale-[1.1] origin-center group-hover:scale-[1.18] transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* Teacher Profile Card */}
      <div 
        onClick={onOpenProfileModal}
        className="px-4 py-3 flex items-center gap-3 border-b border-cyan-500/15 bg-gradient-to-r from-[#071324] to-[#0a1b32] hover:from-[#0a1c35] hover:to-[#0f2444] transition-all cursor-pointer group"
      >
        <Avatar
          src={profile.avatar}
          fallbackText={profile.name || 'CP'}
          sizeClassName="w-10 h-10 rounded-xl shadow-md shadow-rose-900/30 shrink-0 ring-1 ring-rose-500/40"
          bgClassName="bg-gradient-to-tr from-[#ff3366] to-[#ff5b79]"
          textClassName="text-white font-black text-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
              {profile.name}
            </h2>
            <KeyRound className="w-3 h-3 text-amber-400 shrink-0 opacity-80" />
          </div>
          <p className="text-[11px] text-cyan-300 font-mono truncate">
            Tên ĐN: <span className="underline">{profile.username}</span>
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto no-scrollbar">
        {teacherNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isExternal) {
            return (
              <a
                key={item.id}
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-cyan-950/40 hover:text-cyan-200 border border-transparent hover:border-cyan-500/20 transition-all duration-300 group"
                title="Dẫn liên kết trực tiếp tới VNEDU"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  <span className="truncate">{item.label}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-cyan-300 shrink-0 transition-opacity" />
              </a>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 active:scale-[0.98] ${
                isActive
                  ? 'bg-gradient-to-r from-rose-600/30 via-[#2a0e22] to-[#0d162b] text-white border border-rose-500/50 shadow-[0_4px_20px_rgba(244,63,94,0.25)]'
                  : 'text-slate-400 hover:bg-cyan-950/30 hover:text-cyan-200 border border-transparent hover:border-cyan-500/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : item.isAi ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                      : item.isAi
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      : 'bg-[#09172c] text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Switcher */}
      <div className="p-3 border-t border-cyan-500/15 space-y-2 bg-[#02050e]">
        <button
          onClick={onSwitchToStudent}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Chuyển về Học sinh</span>
        </button>

        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <span className="truncate">GV: {profile.name}</span>
          <button 
            onClick={onOpenCopyright}
            className="hover:text-cyan-300 transition flex items-center gap-0.5"
          >
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>StudyFlow</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
