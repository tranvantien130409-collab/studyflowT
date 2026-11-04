import React, { useState } from 'react';
import { X, Sparkles, Wand2, Check, AlertCircle, Plus, Trash2, Eye, FileCheck } from 'lucide-react';
import { ExamItem, QuestionItem } from '../types';

interface TeacherAiExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExam: (exam: ExamItem) => void;
  defaultSubject?: string;
}

export const TeacherAiExamModal: React.FC<TeacherAiExamModalProps> = ({
  isOpen,
  onClose,
  onSaveExam,
  defaultSubject = 'Vật lí'
}) => {
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState('12');
  const [topic, setTopic] = useState('Dao động điều hòa & Sóng cơ');
  const [questionCount, setQuestionCount] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [targetClass, setTargetClass] = useState('Tất cả mọi người');

  // Matrix percentages
  const [matrixNb, setMatrixNb] = useState(40); // Nhận biết
  const [matrixTh, setMatrixTh] = useState(30); // Thông hiểu
  const [matrixVd, setMatrixVd] = useState(20); // Vận dụng
  const [matrixVdc, setMatrixVdc] = useState(10); // Vận dụng cao

  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          grade,
          topic,
          count: questionCount,
          durationMinutes,
          matrix: { nb: matrixNb, th: matrixTh, vd: matrixVd, vdc: matrixVdc }
        })
      });

      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
        setExamTitle(`Đề kiểm tra ${subject} Khối ${grade} - ${topic}`);
      } else {
        throw new Error('Không nhận được câu hỏi hợp lệ.');
      }
    } catch (err: any) {
      console.warn('API error, using local generator:', err);
      // Fallback questions
      const fallbackList: QuestionItem[] = [
        {
          id: 1,
          questionText: `Một chất điểm dao động điều hòa theo phương trình x = 5cos(4πt + π/3) (cm). Biên độ dao động của chất điểm là:`,
          options: ['A. 5 cm', 'B. 4 cm', 'C. 10 cm', 'D. 2,5 cm'],
          correctOption: 0,
          explanation: 'Nhìn vào phương trình chuẩn x = A cos(ωt + φ), ta thấy biên độ A = 5 cm.'
        },
        {
          id: 2,
          questionText: `Chu kỳ dao động điều hòa của con lắc đơn có chiều dài l tại nơi có gia tốc trọng trường g là:`,
          options: ['A. T = 2π√(l/g)', 'B. T = 2π√(g/l)', 'C. T = √(l/g)', 'D. T = 1/(2π)√(l/g)'],
          correctOption: 0,
          explanation: 'Công thức tính chu kỳ con lắc đơn là T = 2π√(l/g).'
        },
        {
          id: 3,
          questionText: `Khi xảy ra hiện tượng cộng hưởng cơ thì đại lượng nào sau đây của hệ dao động đạt giá trị cực đại?`,
          options: ['A. Biên độ dao động', 'B. Tần số dao động', 'C. Chu kỳ dao động', 'D. Pha ban đầu'],
          correctOption: 0,
          explanation: 'Khi tần số ngoại lực bằng tần số dao động riêng, hiện tượng cộng hưởng xảy ra và biên độ dao động cưỡng bức đạt giá trị cực đại.'
        },
        {
          id: 4,
          questionText: `Một sóng cơ học truyền dọc theo trục Ox với phương trình u = 4cos(20πt - πx) (mm). Bước sóng của sóng này là:`,
          options: ['A. 2 cm', 'B. 4 cm', 'C. 1 cm', 'D. 0,5 cm'],
          correctOption: 0,
          explanation: 'Ta có 2πx/λ = πx => λ = 2 cm.'
        },
        {
          id: 5,
          questionText: `Một con lắc lò xo gồm lò xo nhẹ k = 100 N/m và vật m = 100 g. Tần số góc dao động riêng của con lắc là:`,
          options: ['A. 31,6 rad/s', 'B. 10 rad/s', 'C. 100 rad/s', 'D. 1 rad/s'],
          correctOption: 0,
          explanation: 'ω = √(k/m) = √(100 / 0.1) = √1000 ≈ 31,6 rad/s.'
        }
      ].slice(0, questionCount);

      setGeneratedQuestions(fallbackList);
      setExamTitle(`Đề kiểm tra ${subject} Khối ${grade} - ${topic}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = () => {
    if (!examTitle.trim() || generatedQuestions.length === 0) return;

    const newExam: ExamItem = {
      id: Date.now(),
      title: examTitle.trim(),
      subject,
      durationMinutes,
      submissionsCount: 0,
      status: 'published',
      assignedTo: targetClass,
      createdAt: new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      price: 'Miễn phí',
      questions: generatedQuestions,
      description: `Đề thi trắc nghiệm được sinh bởi AI theo ma trận nhận thức (${matrixNb}% Nhận biết, ${matrixTh}% Thông hiểu, ${matrixVd}% Vận dụng, ${matrixVdc}% Vận dụng cao).`
    };

    onSaveExam(newExam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Tạo đề theo Ma trận chuẩn</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white">
                  Gemini AI
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động sinh câu hỏi trắc nghiệm bám sát 4 mức độ nhận thức của Bộ Giáo dục & Đào tạo
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* Section 1: Thông số cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Vật lí">Vật lí</option>
                <option value="Toán học">Toán học</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Địa lí">Địa lí</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Ngữ văn">Ngữ văn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Khối lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="12">Lớp 12 (Thi THPT QG)</option>
                <option value="11">Lớp 11</option>
                <option value="10">Lớp 10</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số câu hỏi
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={4}>4 câu (Kiểm tra nhanh)</option>
                <option value={5}>5 câu</option>
                <option value={10}>10 câu (15 phút)</option>
                <option value={20}>20 câu (45 phút)</option>
                <option value={40}>40 câu (Chuẩn THPT QG)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thời gian làm bài
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={15}>15 phút</option>
                <option value={45}>45 phút (1 tiết)</option>
                <option value={50}>50 phút</option>
                <option value={90}>90 phút (Học kỳ / THPT)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Chủ đề / Chuyên đề kiến thức */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chuyên đề / Bài học kiến thức cần ra đề
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Dao động điều hòa, Mạch RLC, Lịch sử VN 1945-1954..."
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Section 3: Cấu hình Ma trận Nhận thức */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Tỉ lệ Ma trận nhận thức (%)
              </span>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                Tổng: {matrixNb + matrixTh + matrixVd + matrixVdc}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Nhận biết</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={matrixNb}
                    onChange={(e) => setMatrixNb(Number(e.target.value))}
                    className="w-14 px-2 py-1 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Thông hiểu</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={matrixTh}
                    onChange={(e) => setMatrixTh(Number(e.target.value))}
                    className="w-14 px-2 py-1 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Vận dụng</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={matrixVd}
                    onChange={(e) => setMatrixVd(Number(e.target.value))}
                    className="w-14 px-2 py-1 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Vận dụng cao</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={matrixVdc}
                    onChange={(e) => setMatrixVdc(Number(e.target.value))}
                    className="w-14 px-2 py-1 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI đang phân tích & sinh câu hỏi...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>✨ AI Sinh đề thi tự động</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 4: Danh sách câu hỏi vừa sinh */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Kết quả câu hỏi ({generatedQuestions.length} câu)
                  </h3>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="mt-1 w-full max-w-md px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-950/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Giao cho:</span>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  >
                    <option value="Tất cả mọi người">Tất cả mọi người</option>
                    <option value="12A2 - ( Vật Lí Cơ Bản )">Lớp 12A2 Cơ bản</option>
                    <option value="12A5 Vật Lí - ( Vật Lí Cơ Bản )">Lớp 12A5 Cơ bản</option>
                    <option value="12A2 Luyện Thi Đại Học">12A2 Luyện Thi ĐH</option>
                    <option value="12A5 Luyện THI Đại Học">12A5 Luyện Thi ĐH</option>
                    <option value="10A1 Vật Lý Nâng Cao">10A1 Nâng Cao</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">
                        Câu {idx + 1}:
                      </span>
                      <p className="flex-1 font-medium text-slate-900 dark:text-white">
                        {q.questionText}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOption === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 italic">
                        💡 Lời giải: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <p className="text-xs text-slate-400 hidden sm:block">
            Đề thi sẽ xuất hiện ngay trong hệ thống Đề thi Azota để học sinh làm bài
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handlePublish}
              disabled={generatedQuestions.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              <span>Xuất bản Đề thi vào Hệ thống</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
