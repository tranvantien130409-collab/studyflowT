import React from 'react';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  Sparkles, 
  Plus, 
  UploadCloud, 
  Send, 
  Bot, 
  Settings, 
  KeyRound, 
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { TeacherProfile, TeacherClass, TeacherTab } from '../types';
import { Avatar } from './Avatar';

interface TeacherDashboardViewProps {
  profile: TeacherProfile;
  classes: TeacherClass[];
  totalExamsCount: number;
  totalMaterialsCount: number;
  onOpenProfileModal: () => void;
  onOpenAiExamModal: () => void;
  onOpenAiMaterialModal: () => void;
  onOpenAiAssistantModal: () => void;
  onOpenAssignModal: () => void;
  onSelectClass: (c: TeacherClass) => void;
  onNavigateTab: (tab: TeacherTab) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  profile,
  classes,
  totalExamsCount,
  totalMaterialsCount,
  onOpenProfileModal,
  onOpenAiExamModal,
  onOpenAiMaterialModal,
  onOpenAiAssistantModal,
  onOpenAssignModal,
  onSelectClass,
  onNavigateTab
}) => {
  const totalStudents = classes.reduce((sum, c) => sum + c.studentsCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Professional & Clean Teacher Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Cổng Giảng Viên & Quản Trị Học Tập</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Avatar
                src={profile.avatar}
                fallbackText={profile.name || 'CP'}
                sizeClassName="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl shadow-lg border-2 border-emerald-500/30"
                bgClassName="bg-emerald-600"
                textClassName="text-white font-black text-lg"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Xin chào, <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{profile.name}</span>!
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Môn giảng dạy: <span className="font-bold text-slate-700 dark:text-slate-300">{profile.subject || 'Toàn diện'}</span>
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Trang quản lý chuyên nghiệp dành cho giảng viên StudyFlow. Theo dõi sĩ số lớp học, biên soạn đề thi thông minh và quản lý học liệu nhanh chóng.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Tên đăng nhập:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{profile.username}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Mã dự phòng:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{profile.backupCode}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={onOpenAiExamModal}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" style={{ animationDuration: '8s' }} />
              <span>AI Tạo đề trắc nghiệm</span>
            </button>

            <button
              onClick={onOpenProfileModal}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700"
            >
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Đổi Mật Khẩu</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Clean Modern Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div 
          onClick={() => onNavigateTab('classes')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-emerald-500 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TỔNG SỐ HỌC SINH ({classes.length} LỚP)
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {totalStudents || 58}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => onNavigateTab('materials')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-teal-500 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              HỌC LIỆU GIẢNG DẠY
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {totalMaterialsCount || 26}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => onNavigateTab('exams')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-cyan-500 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              ĐỀ THI & KHẢO THÍ
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {Math.max(10, totalExamsCount)}
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => onNavigateTab('assign')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-indigo-500 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              NHIỆM VỤ ĐÃ GIAO
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              12
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left & Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Thao tác nhanh cho Giảng viên
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Hệ thống AI tích hợp</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Action 1 */}
              <button
                onClick={() => onNavigateTab('classes')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 transition text-center group shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs mb-2.5 group-hover:scale-110 transition">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Quản lý 5 lớp
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Danh sách & điểm</span>
              </button>

              {/* Action 2 */}
              <button
                onClick={onOpenAiMaterialModal}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-400 transition text-center group shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs mb-2.5 group-hover:scale-110 transition">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Soạn học liệu AI
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Tóm tắt & giáo án</span>
              </button>

              {/* Action 3 */}
              <button
                onClick={onOpenAiExamModal}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:from-emerald-100 hover:to-teal-100 transition text-center group relative overflow-hidden shadow-xs"
              >
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-bl-xl bg-emerald-600 text-white text-[9px] font-black uppercase">
                  AI Pro
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 mb-2.5 group-hover:scale-110 transition">
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                </div>
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                  Tạo đề theo Ma trận
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">Chuẩn Bộ GD&ĐT</span>
              </button>

              {/* Action 4 */}
              <button
                onClick={onOpenAssignModal}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-400 transition text-center group shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs mb-2.5 group-hover:scale-110 transition">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Giao nhiệm vụ
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Bài tập & deadline</span>
              </button>
            </div>
          </div>

          {/* Classes Management Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Danh sách lớp học đang quản lý
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chọn lớp để xem chi tiết học sinh, phổ điểm và giao bài tập
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('classes')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => onSelectClass(cls)}
                  className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition flex items-center justify-between gap-3 cursor-pointer group shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition shadow-xs">
                      {cls.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                        {cls.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{cls.studentsCount} học sinh</span>
                        <span>•</span>
                        <span>Điểm TB: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{cls.avgScore}</strong></span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): AI Assistant & System Settings */}
        <div className="space-y-6">
          {/* AI Assistant Widget */}
          <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden border border-emerald-700/30">
            <div className="absolute right-0 bottom-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-white">
                  Trợ lý AI {profile.name}
                </h3>
                <span className="text-[10px] text-emerald-200 font-medium">Phân tích chuyên sâu & Ma trận</span>
              </div>
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed font-normal relative z-10">
              Hệ thống AI tự động phân tích phổ điểm lớp học, nhận diện lỗ hổng kiến thức từng học sinh và gợi ý đề xuất bài tập phân hóa.
            </p>

            <button
              onClick={onOpenAiAssistantModal}
              className="w-full py-3 px-4 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs shadow-lg transition text-center flex items-center justify-center gap-2 relative z-10"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Mở trợ lý phân tích học tập</span>
            </button>
          </div>

          {/* Quick Schedule & Teaching Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Lịch dạy trong tuần</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                Đang trực tuyến
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Lớp 12A1 • Vật lí</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">Tiết 1-2 (07:15 - 08:45) • Phòng 302</div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Đã dạy</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Lớp 12A2 • Vật lí</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">Tiết 3-4 (09:00 - 10:30) • Phòng 302</div>
                </div>
                <span className="px-2 py-1 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold text-[10px]">Hôm nay</span>
              </div>
            </div>
          </div>

          {/* System Settings Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Cài đặt hệ thống & Tài khoản</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Quản lý thông tin giáo viên, thay đổi mật khẩu đăng nhập và tuỳ chỉnh bảo mật tài khoản.
            </p>

            <button
              onClick={onOpenProfileModal}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition text-center flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cài đặt & Đổi mật khẩu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
