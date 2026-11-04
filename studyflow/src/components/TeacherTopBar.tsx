import { Sun, Moon, GraduationCap } from 'lucide-react';
import studyflowLogoMark from '../assets/images/studyflow_logo_mark.png';
import { TeacherProfile } from '../types';
import { Avatar } from './Avatar';

interface TeacherTopBarProps {
  profile: TeacherProfile;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSwitchToStudent: () => void;
  onOpenCopyright: () => void;
  onOpenProfileModal: () => void;
}

export const TeacherTopBar: React.FC<TeacherTopBarProps> = ({
  profile,
  theme,
  onToggleTheme,
  onSwitchToStudent,
  onOpenCopyright,
  onOpenProfileModal
}) => {
  return (
    <header className="bg-gradient-to-r from-[#2054f7] via-[#2f63ff] to-[#4574ff] text-white px-5 py-2.5 shadow-md flex items-center justify-between sticky top-0 z-20">
      {/* Left Title - SF Logo + Name */}
      <div className="flex items-center gap-2.5">
        <img 
          src={studyflowLogoMark} 
          alt="StudyFlow Logo" 
          className="h-8 w-auto object-contain drop-shadow-md shrink-0" 
        />
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight leading-none flex items-center">
            <span className="text-[#fed7aa]">Study</span>
            <span className="text-white">Flow</span>
          </h1>
          <span className="text-[10px] font-semibold text-blue-100 opacity-90">
            Chế độ Giáo viên
          </span>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Switch to Student Mode button */}
        <button
          onClick={onSwitchToStudent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
          title="Chuyển sang chế độ Học sinh"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Học sinh</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          type="button"
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition border border-white/20 cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
        </button>

        {/* Teacher Profile */}
        <button 
          onClick={onOpenProfileModal}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 transition text-white border border-white/20 cursor-pointer"
          title="Thông tin Giáo viên"
        >
          <Avatar
            src={profile.avatar}
            fallbackText={profile.name || 'CP'}
            sizeClassName="w-7 h-7 rounded-lg shadow-xs"
            bgClassName="bg-white"
            textClassName="text-blue-700 font-black text-xs"
          />
          <span className="hidden sm:inline text-xs font-semibold truncate max-w-[120px]">
            {profile.name}
          </span>
        </button>
      </div>
    </header>
  );
};
