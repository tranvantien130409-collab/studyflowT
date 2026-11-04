import React, { useState } from 'react';
import { X, Users, CheckCircle2, Clock, Send, KeyRound } from 'lucide-react';
import { TeacherClass } from '../types';

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableClasses: TeacherClass[];
  onSendJoinRequest: (classId: string, className: string) => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({
  isOpen,
  onClose,
  availableClasses = [],
  onSendJoinRequest
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(availableClasses[0]?.id || '');
  const [classCode, setClassCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetClass = availableClasses.find((c) => c.id === selectedClassId);

    if (classCode.trim()) {
      const matchByCode = availableClasses.find(
        (c) =>
          c.code?.toLowerCase() === classCode.trim().toLowerCase() ||
          c.name.toLowerCase().includes(classCode.trim().toLowerCase())
      );
      if (matchByCode) {
        targetClass = matchByCode;
      }
    }

    const classId = targetClass ? targetClass.id : `custom_${Date.now()}`;
    const className = targetClass ? targetClass.name : classCode.trim() || 'Lớp học mới';

    onSendJoinRequest(classId, className);
    setClassCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-emerald-600/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Gia nhập lớp học
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gửi yêu cầu tham gia lớp để giáo viên phê duyệt
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {availableClasses.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn lớp từ danh sách của Giáo viên:
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {availableClasses.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setClassCode('');
                    }}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      selectedClassId === cls.id && !classCode
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{cls.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Môn: {cls.subject} • MHS: {cls.code || cls.id} • Sĩ số: {cls.studentsCount} học sinh
                      </p>
                    </div>
                    {selectedClassId === cls.id && !classCode && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hoặc nhập Mã lớp do Giáo viên cung cấp:
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="VD: 12A2-PHYS / 12A1"
                className="w-full pl-9 pr-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Lưu ý: Sau khi gửi, yêu cầu tham gia của bạn sẽ chờ Giáo viên bộ môn duyệt trước khi bạn chính thức vào lớp.
            </span>
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
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Yêu Cầu Tham Gia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
