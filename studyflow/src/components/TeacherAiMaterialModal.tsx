import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Wand2, Download, Save, Check } from 'lucide-react';
import { LibraryItem } from '../types';

interface TeacherAiMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveResource: (item: Omit<LibraryItem, 'id'>) => void;
  defaultSubject?: string;
}

export const TeacherAiMaterialModal: React.FC<TeacherAiMaterialModalProps> = ({
  isOpen,
  onClose,
  onSaveResource,
  defaultSubject = 'Vật lí'
}) => {
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState('12');
  const [topic, setTopic] = useState('Dao động điều hòa & Các đại lượng đặc trưng');
  const [materialType, setMaterialType] = useState('Tóm tắt lý thuyết & Sơ đồ tư duy');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/generate-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          grade,
          topic,
          materialType
        })
      });

      const data = await res.json();
      if (data.content) {
        setGeneratedContent(data.content);
        setTitle(`Học liệu: ${topic} (${subject} ${grade})`);
      } else {
        throw new Error('Lỗi dữ liệu.');
      }
    } catch {
      // Fallback content
      const fallback = `# 📖 HỌC LIỆU TRỌNG TÂM: ${topic.toUpperCase()}
**Môn:** ${subject} | **Khối:** ${grade} | **Phân loại:** ${materialType}
**Đơn vị biên soạn:** Tổ chuyên môn THPT - Giáo viên: Cô Phượng

---

## 1. MỤC TIÊU CẦN ĐẠT
- Nắm chắc bản chất vật lý của dao động điều hòa.
- Thuộc và hiểu các công thức tính chu kỳ T, tần số f, tần số góc ω.
- Phân biệt độ lệch pha giữa li độ, vận tốc và gia tốc.

---

## 2. HỆ THỐNG CÔNG THỨC VÀNG
1. Li độ: x = A cos(ωt + φ)  (-A ≤ x ≤ A)
2. Vận tốc: v = x' = -ωA sin(ωt + φ)  (v sớm pha π/2 so với x)
3. Gia tốc: a = v' = -ω²x  (a ngược pha so với x, luôn hướng về VTCB)
4. Công thức độc lập: x² + (v/ω)² = A²

---

## 3. LƯU Ý PHÂN HÓA HỌC SINH
- **Học sinh cơ bản:** Luyện tính toán 1 bước, xác định biên độ và pha ban đầu.
- **Học sinh khá - giỏi:** Rèn luyện đọc đồ thị theo thời gian và bài toán tìm thời điểm vật qua vị trí x lần thứ n.`;
      setGeneratedContent(fallback);
      setTitle(`Học liệu: ${topic} (${subject} ${grade})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!generatedContent.trim()) return;

    onSaveResource({
      t: title || `Tài liệu ${topic}`,
      sub: subject,
      type: 'Tài liệu',
      d: `${materialType} dành cho học sinh khối ${grade}, biên soạn bởi AI và giáo viên bộ môn.`,
      fileType: 'text',
      fileContent: generatedContent,
      fav: true
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Tạo học liệu theo Chương</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Gemini Pro
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Soạn bài giảng, đề cương và phiếu bài tập phân hóa tự động
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Vật lí">Vật lí</option>
                <option value="Toán học">Toán học</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Khối lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="12">Lớp 12</option>
                <option value="11">Lớp 11</option>
                <option value="10">Lớp 10</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Định dạng học liệu
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Tóm tắt lý thuyết & Sơ đồ tư duy">Tóm tắt lý thuyết & Sơ đồ</option>
                <option value="Bảng công thức & Bài tập ví dụ mẫu">Bảng công thức & Bài mẫu</option>
                <option value="Phiếu bài tập phân hóa 3 mức độ">Phiếu bài tập phân hóa</option>
                <option value="Giáo án & Câu hỏi phát vấn">Giáo án & Câu hỏi phát vấn</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên bài học / Chuyên đề
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Dao động điều hòa, Định luật vạn vật hấp dẫn..."
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI đang biên soạn tài liệu...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>✨ AI Biên soạn học liệu</span>
                </>
              )}
            </button>
          </div>

          {generatedContent && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Bản xem trước tài liệu:
              </label>
              <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={10}
                className="w-full p-3 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <p className="text-xs text-slate-400">
            Học liệu sau khi lưu sẽ có thể xem trực tiếp hoặc tải về
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Đóng
            </button>
            <button
              onClick={handleSaveToLibrary}
              disabled={!generatedContent}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Lưu vào Thư viện học liệu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
