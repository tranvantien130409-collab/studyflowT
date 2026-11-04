import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { TeacherStudent } from '../types';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: TeacherStudent;
  onSave: (student: TeacherStudent) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave
}) => {
  const [name, setName] = useState(student.name);
  const [avgScore, setAvgScore] = useState(student.avgScore);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...student, name, avgScore: Number(avgScore) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4">
        <h2 className="text-sm font-bold">Chỉnh sửa học sinh</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border"
            placeholder="Tên học sinh"
          />
          <input
            type="number"
            step="0.1"
            value={avgScore}
            onChange={(e) => setAvgScore(parseFloat(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border"
            placeholder="Điểm TB"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded-lg">Hủy</button>
            <button type="submit" className="px-3 py-1 rounded-lg bg-blue-600 text-white flex items-center gap-1">
              <Save className="w-3 h-3" /> Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
