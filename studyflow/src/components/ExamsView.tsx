import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  FolderPlus, 
  Library, 
  Folder, 
  FileText, 
  MoreVertical, 
  Play, 
  Edit3, 
  Trash2, 
  Clock, 
  Users, 
  CheckCircle, 
  Calendar, 
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  UploadCloud,
  GraduationCap,
  Layers,
  Zap,
  Star
} from 'lucide-react';
import { ExamItem, ExamFolder, ExamSubmission, UserRole } from '../types';
import { TakeExamModal } from './TakeExamModal';
import { CreateExamModal } from './CreateExamModal';

interface ExamsViewProps {
  exams: ExamItem[];
  folders: ExamFolder[];
  submissions: ExamSubmission[];
  role: UserRole;
  onSaveExam: (exam: ExamItem) => void;
  onDeleteExam: (id: number) => void;
  onDeleteFolder?: (id: string) => void;
  onAddFolder: (folder: ExamFolder) => void;
  onSubmitResult: (submission: ExamSubmission) => void;
  onBackToOverview: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  folders,
  submissions,
  role,
  onSaveExam,
  onDeleteExam,
  onDeleteFolder,
  onAddFolder,
  onSubmitResult,
  onBackToOverview,
  searchQuery = '',
  onSearchChange
}) => {
  const isTeacher = role === 'teacher';

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<number[]>([]);

  // Modals
  const [activeExamTaking, setActiveExamTaking] = useState<ExamItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<'upload' | 'manual'>('upload');
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Filter exams
  const filteredExams = exams.filter((e) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedFolder) {
      return e.folderId === selectedFolder;
    }
    return true;
  });

  // Recommended exams (e.g. vantien1304-SỬ)
  const recommendedExams = exams.filter((e) => e.isRecommended || e.submissionsCount > 5).slice(0, 4);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExamIds(filteredExams.map((e) => e.id));
    } else {
      setSelectedExamIds([]);
    }
  };

  const handleToggleSelectExam = (id: number) => {
    if (selectedExamIds.includes(id)) {
      setSelectedExamIds(selectedExamIds.filter((item) => item !== id));
    } else {
      setSelectedExamIds([...selectedExamIds, id]);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    onAddFolder({
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      examCount: 0
    });
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  return (
    <div className="space-y-6 select-none relative">
      {/* Background Ambient Neon Orbs */}
      <div className="fixed top-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Header & Search Bar */}
      <div className="relative z-10 bg-gradient-to-br from-white via-slate-50 to-cyan-50/30 dark:from-[#091830] dark:via-[#071328] dark:to-[#040c1a] border border-slate-200/80 dark:border-cyan-500/25 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-[0_15px_40px_rgba(2,6,23,0.7)] space-y-4">
        {/* Title & Quick Stats Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-cyan-500/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
              <GraduationCap className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Quản Lý Đề Thi & Khóa Học (Courses)
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Kho lưu trữ & luyện thi trắc nghiệm thông minh theo chuẩn Bộ GD&ĐT
              </p>
            </div>
          </div>

          <button
            onClick={onBackToOverview}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-cyan-200 bg-slate-100 dark:bg-[#081b36] hover:bg-slate-200 dark:hover:bg-[#0d264a] border border-slate-200 dark:border-cyan-500/30 rounded-xl transition-all interactive-spring self-start sm:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Quay lại Dashboard</span>
          </button>
        </div>

        {/* Action Controls & Search Input */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Tìm kiếm đề thi, môn học, tác giả..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#051124] border border-slate-200 dark:border-cyan-500/30 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-inner transition-all"
            />
            <Search className="w-4 h-4 text-cyan-500 dark:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-cyan-300 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Button: Tạo đề từ ngân hàng chung */}
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 rounded-xl shadow-[0_4px_16px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_22px_rgba(6,182,212,0.45)] border border-cyan-400/40 transition-all interactive-spring cursor-pointer"
            >
              <Library className="w-4 h-4 text-cyan-200 stroke-[2.3]" />
              <span>Ngân hàng chung</span>
            </button>

            {/* Button: Tạo thư mục */}
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 rounded-xl shadow-[0_4px_16px_rgba(99,102,241,0.35)] border border-indigo-400/40 transition-all interactive-spring cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-indigo-200 stroke-[2.3]" />
              <span>Tạo thư mục</span>
            </button>
          </div>
        </div>
      </div>

      {/* Azota Quick Drag & Drop Banner - LUXURY HIGH-TECH GLASS */}
      <div 
        onClick={() => {
          setEditingExam(null);
          setCreateModalMode('upload');
          setIsCreateModalOpen(true);
        }}
        className="relative z-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#061e38]/90 via-[#08294a]/85 to-[#051428]/90 border border-emerald-400/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:border-emerald-400/70 hover:shadow-[0_15px_40px_rgba(16,185,129,0.35)] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer transition-all duration-300 group overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-700" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform duration-300 shrink-0 border border-emerald-200/50">
            <UploadCloud className="w-7 h-7 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white tracking-tight">
                Kéo thả file dữ liệu đề thi tự động chuẩn Azota AI
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)] uppercase tracking-wider">
                Bóc tách tự động
              </span>
            </div>
            <p className="text-xs text-cyan-100/80 font-medium mt-1 leading-relaxed">
              Hỗ trợ file Word (.docx), PDF (.pdf), TXT, JSON. Tự động phân tích từng câu hỏi, các lựa chọn A-B-C-D và tạo đáp án chi tiết.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 rounded-xl transition shadow-lg shadow-emerald-500/40 shrink-0 self-start sm:self-center interactive-spring border border-emerald-200/60 uppercase tracking-wider"
        >
          Kéo thả file lên ngay 🚀
        </button>
      </div>

      {/* Được đề xuất (Recommended Exams Section) - LUXURY NEON CARDS */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400 animate-pulse" />
            </div>
            <span>Đề Thi Được Đề Xuất Nổi Bật</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedExams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => setActiveExamTaking(exam)}
              className="bg-gradient-to-br from-white via-slate-50 to-orange-50/20 dark:from-[#08172c] dark:via-[#0b1e38] dark:to-[#050f1f] border border-slate-200/80 dark:border-orange-500/30 rounded-3xl p-4 sm:p-5 shadow-xs dark:shadow-[0_10px_30px_rgba(249,115,22,0.15)] hover:border-orange-400 dark:hover:border-orange-400/80 hover:shadow-[0_15px_35px_rgba(249,115,22,0.3)] transition-all duration-300 cursor-pointer interactive-spring relative group overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-500" />

              <div>
                {/* Header Icon & Subject */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500/20 via-amber-500/20 to-orange-400/30 text-orange-400 flex items-center justify-center shrink-0 border border-orange-400/40 shadow-[0_0_12px_rgba(249,115,22,0.3)] group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-400/30 uppercase tracking-wider">
                    {exam.subject}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-orange-300 transition-colors">
                  {exam.title}
                </h3>
                
                <div className="mt-2 space-y-1 text-[11px] text-slate-700 dark:text-cyan-200 font-semibold">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Thời gian: <strong className="text-slate-900 dark:text-white font-extrabold">{exam.durationMinutes} phút</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Ngày tạo: <strong className="text-slate-800 dark:text-cyan-200 font-bold">{exam.createdAt}</strong></span>
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-3 border-t border-slate-200 dark:border-cyan-500/15 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/30 flex items-center gap-1">
                  Lượt nộp: <strong className="text-emerald-900 dark:text-emerald-300 font-extrabold">{exam.submissionsCount}</strong>
                </span>
                
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-[0_0_12px_rgba(249,115,22,0.4)] interactive-spring"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Vào thi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tất cả (All Exams & Directory Table) - LUXURY GLASS TABLE */}
      <div className="space-y-4 pt-2 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Tất Cả Đề Thi & Thư Mục Thống Kê</span>
          </h2>
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-xs text-cyan-700 dark:text-cyan-400 font-extrabold hover:text-cyan-900 dark:hover:text-cyan-300 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-300 dark:border-cyan-500/30 transition cursor-pointer"
            >
              ← Xem tất cả thư mục
            </button>
          )}
        </div>

        {/* Bulk Action Bar if items selected */}
        {selectedExamIds.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-rose-950/80 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-in fade-in duration-200">
            <span className="font-extrabold text-rose-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              Đã chọn {selectedExamIds.length} đề thi
            </span>
            <button
              onClick={() => {
                selectedExamIds.forEach((id) => onDeleteExam(id));
                setSelectedExamIds([]);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-md shadow-rose-600/40 cursor-pointer interactive-spring"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa đề thi đã chọn ({selectedExamIds.length})</span>
            </button>
          </div>
        )}

        {/* Modern Table Container */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#071426] dark:via-[#0a1c36] dark:to-[#050e1c] border border-slate-200/90 dark:border-cyan-500/25 rounded-3xl shadow-sm dark:shadow-[0_15px_40px_rgba(2,6,23,0.8)] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-cyan-500/20 text-[11px] font-black uppercase text-slate-700 dark:text-cyan-300 tracking-wider select-none bg-slate-100/90 dark:bg-[#071830]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedExamIds.length === filteredExams.length && filteredExams.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded-md text-cyan-600 focus:ring-0 border-slate-300 dark:border-cyan-500/40 bg-slate-800 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3">Tên đề thi / Thư mục</th>
                <th className="py-3.5 px-3 text-center">Số bài đã nộp</th>
                <th className="py-3.5 px-3">Trạng Thái</th>
                <th className="py-3.5 px-3">Đã Giao Cho</th>
                <th className="py-3.5 px-3">Thời gian tạo</th>
                <th className="py-3.5 px-3">Giá đề thi</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-cyan-500/10 text-xs">
              {/* Folders List Row */}
              {!selectedFolder && folders.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  className="hover:bg-slate-50 dark:hover:bg-[#091f3a]/50 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-md text-cyan-600 focus:ring-0 border-slate-300 opacity-30"
                      disabled
                    />
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-300 dark:border-blue-400/40 shadow-xs group-hover:scale-110 transition-transform">
                        <Folder className="w-4 h-4 fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400" />
                      </div>
                      <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors font-black text-sm">{f.name}</span>
                      {f.tag && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-400/40">
                          {f.tag}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-400 font-bold">-</td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-cyan-300/80 font-semibold">Thư mục tổng hợp</td>
                  <td className="py-3.5 px-3 text-slate-400">-</td>
                  <td className="py-3.5 px-3 text-slate-400">-</td>
                  <td className="py-3.5 px-3 text-slate-400">-</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedFolder(f.id)}
                        className="text-[11px] text-cyan-700 dark:text-cyan-300 font-extrabold hover:underline bg-cyan-50 dark:bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/30"
                      >
                        Mở thư mục
                      </button>
                      {onDeleteFolder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFolder(f.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Xóa thư mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Exam Rows */}
              {filteredExams.map((exam) => {
                const isChecked = selectedExamIds.includes(exam.id);
                return (
                  <tr
                    key={exam.id}
                    className={`hover:bg-slate-50/90 dark:hover:bg-[#091f3a]/60 transition ${
                      isChecked ? 'bg-cyan-50 dark:bg-cyan-950/50 border-l-4 border-l-cyan-500' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectExam(exam.id)}
                        className="w-4 h-4 rounded-md text-cyan-600 focus:ring-0 border-slate-300 dark:border-cyan-500/40 bg-slate-800 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-3">
                      <div 
                        onClick={() => setActiveExamTaking(exam)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-gradient-to-tr dark:from-orange-500/20 dark:to-amber-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-400/40 shadow-xs group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4 stroke-[2.3]" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition block truncate max-w-xs text-sm">
                            {exam.title}
                          </span>
                          <span className="text-[11px] text-sky-600 dark:text-cyan-300 font-bold block mt-0.5">
                            {exam.subject} • {exam.durationMinutes} phút
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-cyan-950/80 text-sky-900 dark:text-cyan-200 border border-sky-300 dark:border-cyan-500/40 font-black text-xs inline-block">
                        {exam.submissionsCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/40 shadow-2xs">
                        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {exam.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200 font-bold">
                      {exam.assignedTo}
                    </td>
                    <td className="py-3.5 px-3 text-blue-700 dark:text-cyan-200 font-bold font-mono text-[11px]">
                      {exam.createdAt}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-amber-600 dark:text-amber-300">
                      {exam.price}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveExamTaking(exam);
                          }}
                          className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-xl font-black text-xs transition shadow-xs cursor-pointer interactive-spring border border-emerald-300/50 uppercase tracking-wider"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Vào thi</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingExam(exam);
                            setIsCreateModalOpen(true);
                          }}
                          className="p-2 text-slate-500 dark:text-cyan-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-cyan-950/60 transition cursor-pointer"
                          title="Sửa đề thi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteExam(exam.id);
                            setSelectedExamIds((prev) => prev.filter((i) => i !== exam.id));
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Xóa đề thi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredExams.length === 0 && (
            <div className="py-12 text-center text-cyan-200/60 text-xs font-semibold">
              Không tìm thấy đề thi nào phù hợp với từ khóa tìm kiếm.
            </div>
          )}
        </div>
      </div>

      {/* Online Test Taking Modal */}
      {activeExamTaking && (
        <TakeExamModal
          exam={activeExamTaking}
          onClose={() => setActiveExamTaking(null)}
          onSubmitResult={(sub) => {
            onSubmitResult(sub);
            onSaveExam({
              ...activeExamTaking,
              submissionsCount: activeExamTaking.submissionsCount + 1
            });
          }}
        />
      )}

      {/* Create / Edit Exam Modal */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaveExam={onSaveExam}
        editingExam={editingExam}
        initialMode={createModalMode}
      />

      {/* Create Folder Modal - LUXURY CRYSTAL NAVY */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#091830] via-[#071328] to-[#040c1a] border border-cyan-500/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/40">
                <FolderPlus className="w-4 h-4 stroke-[2.3]" />
              </div>
              <span>Tạo Thư Mục Đề Thi Mới</span>
            </h3>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-cyan-300 mb-1.5">
                  Tên thư mục mới
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="VD: Đề Lịch Sử 12 THPT QG 2026..."
                  className="w-full px-4 py-3 text-xs bg-[#051024] border border-cyan-500/30 rounded-2xl text-white placeholder:text-cyan-300/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl shadow-lg shadow-blue-600/30 border border-blue-300/40 interactive-spring cursor-pointer"
                >
                  Tạo thư mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Bank Common Selection Modal - LUXURY CRYSTAL NAVY */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-gradient-to-b from-[#091830] via-[#071328] to-[#040c1a] border border-cyan-500/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <h3 className="text-base font-black text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/40">
                  <Library className="w-4 h-4 stroke-[2.3]" />
                </div>
                <span>Kho Ngân Hàng Đề Thi Chuẩn Hóa Quốc Gia</span>
              </h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-cyan-100/80 font-medium">
              Chọn đề thi từ thư viện câu hỏi mẫu đã được thẩm định để thêm trực tiếp vào hệ thống:
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
              {[
                { title: 'Bộ đề thi Tốt nghiệp THPT Lịch sử - Chuyên đề Cách mạng 1930 - 1945', questions: 20, time: 50, subject: 'Lịch sử' },
                { title: 'Đề khảo sát năng lực Toán học 12 - Tích phân & Hình học không gian', questions: 25, time: 60, subject: 'Toán' },
                { title: 'Đề luyện thi chứng chỉ Tiếng Anh B2 / THPT Quốc Gia - Test 03', questions: 30, time: 60, subject: 'Tiếng Anh' },
                { title: 'Đề thi chọn Học sinh giỏi Vật lý - Cơ học & Nhiệt động lực học', questions: 15, time: 90, subject: 'Vật lý' }
              ].map((bankItem, bIdx) => (
                <div
                  key={bIdx}
                  className="p-4 rounded-2xl border border-cyan-500/30 bg-[#06142a]/80 hover:border-cyan-400/60 transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider mb-1 inline-block">
                      {bankItem.subject}
                    </span>
                    <h4 className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition line-clamp-1">
                      {bankItem.title}
                    </h4>
                    <p className="text-[11px] text-cyan-200/70 font-medium mt-0.5">
                      {bankItem.questions} câu hỏi • Thời gian làm bài: {bankItem.time} phút
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onSaveExam({
                        id: Date.now() + bIdx,
                        title: bankItem.title,
                        subject: bankItem.subject,
                        durationMinutes: bankItem.time,
                        submissionsCount: 0,
                        status: 'published',
                        assignedTo: 'Tất cả mọi người',
                        createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        price: 'Miễn phí',
                        questions: [
                          {
                            id: 1,
                            questionText: `Câu hỏi mẫu trích từ ${bankItem.title}?`,
                            options: ['A. Khẳng định 1', 'B. Khẳng định 2', 'C. Khẳng định 3', 'D. Khẳng định 4'],
                            correctOption: 0,
                            explanation: 'Đáp án chuẩn theo ngân hàng câu hỏi Quốc gia.'
                          }
                        ]
                      });
                      setIsBankModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs shrink-0 shadow-md shadow-teal-500/30 interactive-spring border border-teal-200/50"
                  >
                    Nhập đề này
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
