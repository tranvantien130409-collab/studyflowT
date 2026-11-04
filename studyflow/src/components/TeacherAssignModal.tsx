import React, { useState } from 'react';
import { X, Send, Calendar, CheckSquare, AlertCircle } from 'lucide-react';
import { TeacherClass, TaskItem } from '../types';

interface TeacherAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: TeacherClass[];
  onAssignTask: (task: Omit<TaskItem, 'id'>, targetClassId: string) => void;
  defaultClassId?: string;
}

export const TeacherAssignModal: React.FC<TeacherAssignModalProps> = ({
  isOpen,
  onClose,
  classes,
  onAssignTask,
  defaultClassId
}) => {
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId || 'all');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Vật lí');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [isHighPriority, setIsHighPriority] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAssignTask(
      {
        t: title.trim(),
        sub: subject,
        due: dueDate,
        done: false,
        hi: isHighPriority
      },
      selectedClassId
    );

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Giao nhiệm vụ & Bài tập cho lớp
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bài tập sẽ được gửi trực tiếp đến danh sách bài tập của học sinh
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chọn Lớp học nhận nhiệm vụ
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Tất cả 5 lớp đang quản lý</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number}. {c.name} ({c.studentsCount} học sinh)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề nhiệm vụ / Bài tập *
            </label>
            <input
              type="text"
              placeholder="VD: Làm 10 câu trắc nghiệm Dao động điều hòa phần Vận dụng..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Vật lí">Vật lí</option>
                <option value="Toán">Toán</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hạn chót nộp bài
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="urgentCheck"
              checked={isHighPriority}
              onChange={(e) => setIsHighPriority(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="urgentCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Đánh dấu mức độ quan trọng / Bài kiểm tra lấy điểm hệ số 2
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
            >
              <Send className="w-4 h-4" />
              <span>Giao nhiệm vụ ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
