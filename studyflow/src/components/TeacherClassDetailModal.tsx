import React, { useState } from 'react';
import { X, Users, Plus, Award, AlertCircle, BookOpen, CheckCircle, GraduationCap, Trash2 } from 'lucide-react';
import { TeacherClass, TeacherStudent } from '../types';

interface TeacherClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: TeacherClass | null;
  onAddStudent: (classId: string, student: Omit<TeacherStudent, 'id'>) => void;
  onOpenAiExam: () => void;
  onEditStudent: (student: TeacherStudent) => void;
  onDeleteClass?: (classId: string) => void;
}

export const TeacherClassDetailModal: React.FC<TeacherClassDetailModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onAddStudent,
  onOpenAiExam,
  onEditStudent,
  onDeleteClass
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newRollNumber, setNewRollNumber] = useState('');

  if (!isOpen || !selectedClass) return null;

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    onAddStudent(selectedClass.id, {
      name: newStudentName.trim(),
      rollNumber: newRollNumber.trim() || `${selectedClass.name.slice(0, 4)}-${selectedClass.students.length + 1}`,
      avgScore: 7.5,
      completedTasks: 0,
      totalTasks: 5,
      status: 'average'
    });

    setNewStudentName('');
    setNewRollNumber('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/60 dark:bg-blue-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-600/30">
              {selectedClass.number}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {selectedClass.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedClass.room || 'Phòng học chính'} • {selectedClass.schedule || 'Lịch học tiêu chuẩn'} • Sĩ số: {selectedClass.studentsCount} học sinh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats for this class */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 bg-slate-50/40 dark:bg-slate-900">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-center">
            <span className="text-[11px] text-slate-500">Điểm TB Lớp</span>
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {selectedClass.avgScore}/10
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-center">
            <span className="text-[11px] text-slate-500">Bài giảng đã dạy</span>
            <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {selectedClass.lessonsCount}
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-center">
            <span className="text-[11px] text-slate-500">Đề thi đã giao</span>
            <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
              {selectedClass.examsCount}
            </p>
          </div>
        </div>

        {/* Body: Student List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Danh sách học sinh ({selectedClass.students.length})</span>
            </h3>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm học sinh</span>
            </button>
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleSaveStudent} className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Thêm học sinh mới vào lớp</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Họ và tên học sinh *"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Mã số học sinh (VD: 12A2-15)"
                  value={newRollNumber}
                  onChange={(e) => setNewRollNumber(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-xs rounded-lg text-slate-600 dark:text-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white"
                >
                  Lưu học sinh
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {selectedClass.students.map((st, idx) => (
              <div 
                key={st.id || idx} 
                onClick={() => onEditStudent(st)}
                className="py-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-slate-400 font-mono text-[11px] text-right">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {st.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      MSHS: {st.rollNumber} • Nộp bài: {st.completedTasks}/{st.totalTasks}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {st.weaknesses && st.weaknesses.length > 0 && (
                    <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                      Cần bồi dưỡng: {st.weaknesses.join(', ')}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      st.status === 'good'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : st.status === 'needs_attention'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    TB: {st.avgScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenAiExam();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              ✨ Tạo đề thi riêng cho lớp {selectedClass.name}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteClass && (
              <button
                onClick={() => {
                  onDeleteClass(selectedClass.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition shadow-2xs cursor-pointer"
                title="Giải tán / Xóa lớp học này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Giải tán lớp</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
