import React, { useRef, useState } from 'react';
import { ShieldCheck, Download, Upload, RotateCcw, X, Check, User, Mail, Calendar, Award } from 'lucide-react';
import studyflowLogoMark from '../assets/images/studyflow_logo_mark.png';
import { COPYRIGHT_INFO } from '../data/initialData';
import { CalendarEvent, TaskItem, LibraryItem, DayFocusSession, CountdownItem, ExamItem } from '../types';

interface CopyrightModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  tasks: TaskItem[];
  library: LibraryItem[];
  sessions: DayFocusSession;
  countdowns: CountdownItem[];
  exams: ExamItem[];
  onRestoreData: (data: { 
    events?: CalendarEvent[]; 
    tasks?: TaskItem[]; 
    library?: LibraryItem[]; 
    sessions?: DayFocusSession;
    countdowns?: CountdownItem[];
    exams?: ExamItem[];
  }) => void;
  onResetToDefault: () => void;
}

export const CopyrightModal: React.FC<CopyrightModalProps> = ({
  isOpen,
  onClose,
  events,
  tasks,
  library,
  sessions,
  countdowns,
  exams,
  onRestoreData,
  onResetToDefault
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const backupData = {
      app: 'StudyFlow',
      version: COPYRIGHT_INFO.version,
      author: COPYRIGHT_INFO.author,
      exportedAt: new Date().toISOString(),
      events,
      tasks,
      library,
      sessions,
      countdowns,
      exams
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.events || parsed.tasks || parsed.library) {
          onRestoreData(parsed);
          setRestoreMessage('Đã khôi phục dữ liệu thành công!');
          setTimeout(() => setRestoreMessage(null), 3500);
        } else {
          setRestoreMessage('Tệp không đúng định dạng sao lưu của StudyFlow.');
        }
      } catch {
        setRestoreMessage('Lỗi đọc tệp JSON. Vui lòng thử lại.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyLicense = () => {
    const text = `${COPYRIGHT_INFO.appName}\nBản quyền: © ${COPYRIGHT_INFO.year} ${COPYRIGHT_INFO.author} (${COPYRIGHT_INFO.email})\nPhiên bản: ${COPYRIGHT_INFO.version}\n${COPYRIGHT_INFO.license}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src={studyflowLogoMark} 
              alt="StudyFlow Logo" 
              className="w-8 h-10 object-contain drop-shadow-md shrink-0" 
            />
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
                <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Study</span>
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Flow</span>
                <span className="text-slate-400 font-normal text-xs ml-2">v{COPYRIGHT_INFO.version}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{COPYRIGHT_INFO.appName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                TVT
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {COPYRIGHT_INFO.author}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    Chủ sở hữu & Bản quyền
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {COPYRIGHT_INFO.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Năm phát hành: {COPYRIGHT_INFO.year} • Phiên bản: {COPYRIGHT_INFO.version}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <p className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Tuyên bố sở hữu trí tuệ
            </p>
            <p>
              Mã nguồn, thiết kế giao diện và cơ sở dữ liệu học tập của ứng dụng StudyFlow đã được xác nhận quyền sở hữu bởi tác giả <strong>{COPYRIGHT_INFO.author}</strong>. 
              Các tính năng bổ sung và sửa đổi sẽ tiếp tục được cập nhật theo đúng yêu cầu của bạn.
            </p>
          </div>

          {/* Backup and restore section */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Sao lưu & Khôi phục dữ liệu
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Xuất tệp JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Nhập từ tệp JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {restoreMessage && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center py-1">
                {restoreMessage}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          <button
            onClick={onResetToDefault}
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Khôi phục dữ liệu mẫu ban đầu
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLicense}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
              {copied ? 'Đã sao chép' : 'Sao chép thông tin'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
