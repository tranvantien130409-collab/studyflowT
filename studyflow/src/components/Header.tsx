import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, ShieldCheck, GraduationCap, School, Bell, Pencil, Check, X, ArrowRight, MessageCircle, Pin } from 'lucide-react';
import studyflowLogoMark from '../assets/images/studyflow_logo_mark.png';
import { UserRole, StudentProfile, Notice } from '../types';
import { COPYRIGHT_INFO } from '../data/initialData';
import { Avatar } from './Avatar';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  role: UserRole;
  onToggleRole: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCopyright: () => void;
  onSearchSubmit?: () => void;
  notices?: Notice[];
  unreadNoticeCount?: number;
  onMarkNoticesRead?: () => void;
  onReactNotice?: (id: number, reaction: string) => void;
  onNavigateToNews?: () => void;
  studentProfile?: StudentProfile;
  onOpenStudentProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  role,
  onToggleRole,
  theme,
  onToggleTheme,
  onOpenCopyright,
  onSearchSubmit,
  notices = [],
  unreadNoticeCount = 0,
  onMarkNoticesRead,
  onReactNotice,
  onNavigateToNews,
  studentProfile,
  onOpenStudentProfile
}) => {
  const isTeacher = role === 'teacher';
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  const togglePopover = () => {
    const nextState = !isPopoverOpen;
    setIsPopoverOpen(nextState);
    if (nextState && onMarkNoticesRead) {
      onMarkNoticesRead();
    }
  };

  const reactionList = ['❤️', '👍', '🔥', '🎉'];

  return (
    <header 
      className="h-16 px-4 sm:px-6 bg-white/85 dark:bg-[#060c19]/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-cyan-500/20 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-[0_4px_20px_-4px_rgba(2,6,23,0.06)] dark:shadow-[0_10px_35px_-5px_rgba(1,6,18,0.7)] transition-all"
    >
      {/* Mobile Brand Mark */}
      <div className="md:hidden flex items-center gap-1.5 shrink-0">
        <img 
          src={studyflowLogoMark} 
          alt="StudyFlow Logo" 
          className="w-7 h-8 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" 
        />
      </div>

      {/* Search Bar with Navy Glass & Subtle Neon Glow */}
      <div className="relative flex-1 max-w-md group">
        <Search className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm bài tập, môn học, tài liệu..."
          className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-100/90 dark:bg-[#0a1529]/90 border border-slate-200/90 dark:border-cyan-500/25 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/25 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden transition-all duration-200 shadow-inner group-hover:border-slate-300 dark:group-hover:border-cyan-500/40"
        />
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Notification Bell Dropdown Button */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={togglePopover}
            className={`relative p-2 rounded-xl border transition-all duration-300 cursor-pointer active:scale-95 ${
              isPopoverOpen
                ? 'border-cyan-500 bg-cyan-50/90 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'border-slate-200/90 dark:border-cyan-500/25 bg-slate-100/80 dark:bg-[#0a1529]/90 text-slate-700 dark:text-cyan-100 hover:border-cyan-400/60 hover:text-cyan-600 dark:hover:text-cyan-300 hover:shadow-[0_0_14px_rgba(6,182,212,0.25)]'
            }`}
            title="Thông báo mới từ Giáo viên"
          >
            <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />
            {unreadNoticeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.7)] ring-2 ring-white dark:ring-[#060c19] animate-pulse">
                {unreadNoticeCount > 9 ? '9+' : unreadNoticeCount}
              </span>
            )}
          </button>

          {/* Floating Notification Popover with Navy Glass & Deep Blur Shadow */}
          {isPopoverOpen && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white/95 dark:bg-[#060e20]/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-500/30 rounded-3xl shadow-[0_25px_70px_-15px_rgba(1,6,18,0.85),0_0_35px_rgba(6,182,212,0.18)] z-50 p-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-cyan-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-cyan-500/30">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      NEWS & Thông báo
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-cyan-200/70">
                      Cập nhật thông tin mới nhất từ Giáo viên
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onMarkNoticesRead && (
                    <button
                      onClick={onMarkNoticesRead}
                      className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline px-2 py-1 rounded-md transition"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setIsPopoverOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="my-2 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-cyan-500/10 pr-1 custom-scrollbar">
                {notices.length > 0 ? (
                  notices.slice(0, 5).map((notice) => (
                    <div key={notice.id} className="py-2.5 space-y-1 hover:bg-slate-50 dark:hover:bg-cyan-950/30 p-2 rounded-xl transition">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1">
                          {notice.pinned && <Pin className="w-3 h-3 text-amber-500 fill-current shrink-0 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />}
                          {notice.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 dark:text-cyan-300/60 shrink-0">
                          {new Date(notice.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {notice.content}
                      </p>

                      {/* Reactions mini row */}
                      {onReactNotice && (
                        <div className="flex items-center gap-1 pt-1">
                          {reactionList.map((icon) => (
                            <button
                              key={icon}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReactNotice(notice.id, icon);
                              }}
                              className="px-2 py-0.5 text-[10px] rounded-lg bg-slate-100 dark:bg-[#0c1933] hover:bg-cyan-50 dark:hover:bg-cyan-900/40 text-slate-600 dark:text-cyan-200 border border-transparent dark:border-cyan-500/20 hover:border-cyan-400/40 transition active:scale-95"
                            >
                              {icon} {notice.reactions?.[icon] || 0}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-cyan-300/60">
                    Chưa có thông báo mới.
                  </div>
                )}
              </div>

              {/* Popover Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-cyan-500/20">
                <button
                  onClick={() => {
                    setIsPopoverOpen(false);
                    if (onNavigateToNews) onNavigateToNews();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 dark:from-cyan-950/60 dark:to-blue-950/60 text-cyan-700 dark:text-cyan-300 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-400/20 dark:border-cyan-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition duration-200 active:scale-98"
                >
                  <span>Xem tất cả trang NEWS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role toggle button: Luxury Navy & Neon Sapphire Gradient */}
        <button
          onClick={onToggleRole}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer shadow-md active:scale-95 ${
            isTeacher
              ? 'bg-gradient-to-r from-[#064e3b] via-[#059669] to-[#0d9488] hover:from-[#047857] hover:to-[#14b8a6] text-white border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6)]'
              : 'bg-gradient-to-r from-[#0b1b4f] via-[#1d4ed8] to-[#0284c7] hover:from-[#0f256e] hover:via-[#2563eb] hover:to-[#06b6d4] text-white border-cyan-400/50 shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_0_28px_rgba(6,182,212,0.6)]'
          }`}
          title={isTeacher ? 'Chuyển sang chế độ Học sinh' : 'Chuyển sang chế độ Giáo viên'}
        >
          {isTeacher ? (
            <>
              <GraduationCap className="w-3.5 h-3.5 drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
              <span>Học sinh</span>
            </>
          ) : (
            <>
              <School className="w-3.5 h-3.5 drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
              <span>Giáo viên</span>
            </>
          )}
        </button>

        {/* Theme toggle with Navy Glass & Neon Glow */}
        <button
          onClick={onToggleTheme}
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-cyan-500/25 bg-slate-100/80 dark:bg-[#0a1529]/90 text-slate-700 dark:text-amber-300 hover:border-amber-400/60 hover:shadow-[0_0_16px_rgba(251,191,36,0.3)] transition-all duration-300 cursor-pointer active:scale-95 shadow-2xs"
          aria-label={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:text-indigo-600 transition-colors" />
          )}
        </button>

        {/* Student Profile Quick Edit Button: Luxury Navy Frosted Glass with Glowing Avatar Ring */}
        {studentProfile && onOpenStudentProfile && (
          <button
            onClick={onOpenStudentProfile}
            className="flex items-center gap-1.5 p-1 pr-2.5 rounded-xl border border-emerald-400/40 dark:border-cyan-400/35 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 dark:from-[#09172e] dark:to-[#0a233c] hover:border-cyan-400 dark:hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(6,182,212,0.35)] shadow-xs transition-all duration-300 cursor-pointer group active:scale-95"
            title="Chỉnh sửa thông tin cá nhân Học sinh"
          >
            <div className="relative">
              <Avatar
                src={studentProfile.avatar}
                fallbackText={studentProfile.name || 'VA'}
                sizeClassName="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform ring-2 ring-emerald-500/60 dark:ring-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                bgClassName="bg-gradient-to-tr from-emerald-600 to-cyan-600"
                textClassName="text-white text-[10px] font-black"
              />
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="block text-[11px] font-bold text-slate-800 dark:text-cyan-200 truncate max-w-[90px] group-hover:text-cyan-600 dark:group-hover:text-cyan-100 transition-colors">
                {studentProfile.name}
              </span>
            </div>
            <Pencil className="w-3 h-3 text-emerald-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>
    </header>
  );
};
