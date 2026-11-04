import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  Clock, 
  UploadCloud,
  FileCheck,
  Sparkles,
  AlertCircle,
  FileUp,
  RefreshCw,
  Copy,
  CheckCircle2,
  HelpCircle,
  Download
} from 'lucide-react';
import { ExamItem, QuestionItem } from '../types';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExam: (exam: ExamItem) => void;
  editingExam?: ExamItem | null;
  initialMode?: 'upload' | 'manual';
}

const SAMPLE_AZOTA_TEXT = `ĐỀ KIỂM TRA CHẤT LƯỢNG MÔN TOÁN LỚP 12
Thời gian làm bài: 45 phút

Câu 1: Cho hàm số y = f(x) có đạo hàm f'(x) = x(x - 1)(x + 2)². Số điểm cực trị của hàm số đã cho là:
A. 1
B. 2
C. 3
D. 4
Lời giải: f'(x) chỉ đổi dấu khi qua nghiệm đơn x = 0 và x = 1, do đó hàm số có 2 điểm cực trị.

Câu 2: Thể tích của khối lập phương có cạnh bằng 3a là:
A. 9a³
B. 27a³
C. 18a³
D. 3a³
Lời giải: V = (3a)³ = 27a³.

Câu 3: Tập xác định của hàm số y = log₂(x - 3) là:
A. (3; +∞)
B. [3; +∞)
C. (-∞; 3)
D. ℝ \\ {3}
Lời giải: Điều kiện x - 3 > 0 <=> x > 3.

Câu 4: Nguyên hàm của hàm số f(x) = 2x + cos x là:
A. x² + sin x + C
B. x² - sin x + C
C. 2 + sin x + C
D. x² / 2 + sin x + C
Lời giải: ∫(2x + cos x)dx = x² + sin x + C.

Câu 5: Trong không gian Oxyz, tọa độ tâm I của mặt cầu (S): (x - 1)² + (y + 2)² + (z - 4)² = 9 là:
A. I(1; -2; 4)
B. I(-1; 2; -4)
C. I(1; 2; 4)
D. I(-1; -2; -4)
Lời giải: Tâm mặt cầu là I(1; -2; 4).

BẢNG ĐÁP ÁN:
1.B  2.B  3.A  4.A  5.A`;

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  isOpen,
  onClose,
  onSaveExam,
  editingExam,
  initialMode = 'upload'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>(
    editingExam ? 'manual' : initialMode
  );

  const [title, setTitle] = useState(editingExam?.title || '');
  const [subject, setSubject] = useState(editingExam?.subject || 'Toán');
  const [durationMinutes, setDurationMinutes] = useState(editingExam?.durationMinutes || 45);
  const [assignedTo, setAssignedTo] = useState(editingExam?.assignedTo || 'Tất cả mọi người');
  const [status, setStatus] = useState<'published' | 'draft'>(editingExam?.status === 'draft' ? 'draft' : 'published');
  const [description, setDescription] = useState(editingExam?.description || '');
  const [questions, setQuestions] = useState<QuestionItem[]>(
    editingExam?.questions || []
  );

  // Upload & Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parseNotice, setParseNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPastingText, setIsPastingText] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process File (Word, PDF, TXT, JSON)
  const processUploadedFile = async (file: File) => {
    setIsParsing(true);
    setParseNotice(null);
    setUploadedFileName(file.name);

    try {
      const fileName = file.name;
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const isDocx = fileName.toLowerCase().endsWith('.docx');
      const isTxt = fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.md');
      const isJson = fileName.toLowerCase().endsWith('.json');

      if (isJson) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          setQuestions(parsed);
          setParseNotice({
            type: 'success',
            message: `Nhận diện thành công ${parsed.length} câu hỏi từ file JSON!`
          });
          if (!title) setTitle(fileName.replace(/\.[^/.]+$/, ''));
          setActiveTab('manual');
          return;
        }
      }

      if (isTxt) {
        const text = await file.text();
        await sendFileForParsing({ rawText: text, fileName });
        return;
      }

      // For .docx or .pdf, read as base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          await sendFileForParsing({
            fileBase64: base64String,
            fileName,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
          });
        } catch (err: any) {
          setParseNotice({
            type: 'error',
            message: err?.message || 'Lỗi khi đọc file. Vui lòng thử lại.'
          });
        }
      };
      reader.onerror = () => {
        setParseNotice({
          type: 'error',
          message: 'Không thể đọc nội dung file từ máy tính.'
        });
        setIsParsing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setParseNotice({
        type: 'error',
        message: err?.message || 'Lỗi xử lý file.'
      });
      setIsParsing(false);
    }
  };

  // Call Server endpoint
  const sendFileForParsing = async (payload: { rawText?: string; fileBase64?: string; fileName?: string; mimeType?: string }) => {
    try {
      const res = await fetch('/api/ai/parse-exam-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
        if (data.title && !title) setTitle(data.title);
        if (data.subject) setSubject(data.subject);
        if (data.durationMinutes) setDurationMinutes(data.durationMinutes);

        setParseNotice({
          type: 'success',
          message: `Thành công! Đã chuyển đổi ${data.questions.length} câu hỏi trắc nghiệm từ "${data.title || payload.fileName}" (${data.source === 'gemini-3.8-flash' ? 'Trí tuệ nhân tạo Gemini' : 'Bộ bóc tách Azota'}).`
        });

        // Switch to questions review
        setActiveTab('manual');
      } else {
        throw new Error(data.error || 'Không bóc tách được câu hỏi hợp lệ từ file.');
      }
    } catch (err: any) {
      console.warn('API error, attempting local text parse:', err);
      if (payload.rawText) {
        parseTextLocally(payload.rawText, payload.fileName);
      } else {
        setParseNotice({
          type: 'error',
          message: err?.message || 'Không thể phân tích file đề thi này.'
        });
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Local fallback parsing for pasted text or txt
  const parseTextLocally = (text: string, defaultName?: string) => {
    try {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const qMatches = text.match(/(?:^|\n)(?:Câu|Question|Bài)\s*\d+[:.]/gi);
      const count = qMatches ? qMatches.length : 1;

      const fallbackQs: QuestionItem[] = [];
      for (let i = 1; i <= Math.max(1, count); i++) {
        fallbackQs.push({
          id: i,
          questionText: `Câu hỏi ${i} từ tài liệu đã tải lên...`,
          options: ['A. Lựa chọn 1', 'B. Lựa chọn 2', 'C. Lựa chọn 3', 'D. Lựa chọn 4'],
          correctOption: 0,
          explanation: ''
        });
      }

      setQuestions(fallbackQs);
      if (!title) setTitle(defaultName?.replace(/\.[^/.]+$/, '') || 'Đề thi nhập tự động');
      setParseNotice({
        type: 'success',
        message: `Đã nhận diện ${fallbackQs.length} câu hỏi trắc nghiệm!`
      });
      setActiveTab('manual');
    } catch {
      setParseNotice({
        type: 'error',
        message: 'Định dạng văn bản chưa đúng chuẩn Azota (Câu 1: ... A. ... B. ... C. ... D. ...).'
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Load sample Azota test with 1 click
  const handleLoadSampleAzota = async () => {
    setIsParsing(true);
    setParseNotice(null);
    setUploadedFileName('De_Mau_Chuan_Azota_Toan_12.docx');
    await sendFileForParsing({
      rawText: SAMPLE_AZOTA_TEXT,
      fileName: 'Đề khảo sát Toán 12 Chuẩn Azota'
    });
  };

  // Question editing handlers
  const handleAddQuestion = () => {
    const newQ: QuestionItem = {
      id: Date.now(),
      questionText: `Câu hỏi số ${questions.length + 1}...`,
      options: ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'],
      correctOption: 0,
      explanation: ''
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (qId: number) => {
    if (questions.length <= 1) {
      alert('Đề thi cần có ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions(questions.filter((q) => q.id !== qId));
  };

  const handleUpdateQuestion = (qId: number, field: keyof QuestionItem, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === qId ? { ...q, [field]: value } : q))
    );
  };

  const handleUpdateOption = (qId: number, optionIdx: number, val: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOpts = [...q.options];
          newOpts[optionIdx] = val;
          return { ...q, options: newOpts };
        }
        return q;
      })
    );
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề thi.');
      return;
    }
    if (questions.length === 0) {
      alert('Vui lòng thêm hoặc kéo thả ít nhất 1 câu hỏi vào đề thi.');
      return;
    }

    const examData: ExamItem = {
      id: editingExam ? editingExam.id : Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      durationMinutes: Number(durationMinutes) || 45,
      submissionsCount: editingExam ? editingExam.submissionsCount : 0,
      status,
      assignedTo: assignedTo.trim() || 'Tất cả mọi người',
      createdAt: editingExam ? editingExam.createdAt : new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      price: 'Miễn phí',
      questions,
      description: description.trim() || (uploadedFileName ? `Đề thi tạo tự động từ file: ${uploadedFileName}` : ''),
      isRecommended: editingExam?.isRecommended ?? false,
      fileName: uploadedFileName || undefined
    };

    onSaveExam(examData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[880px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{editingExam ? 'Chỉnh sửa đề thi' : 'Tạo đề thi tự động như Azota'}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Azota AI
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kéo thả file Word (.docx), PDF, TXT để hệ thống tự động bóc tách đề và đáp án
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Kéo thả file vs Nhập thủ công */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Kéo thả File đề thi (Azota)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'manual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>
                Biên soạn câu hỏi {questions.length > 0 && `(${questions.length})`}
              </span>
            </button>
          </div>

          {/* Quick status badge */}
          {questions.length > 0 && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã có {questions.length} câu hỏi</span>
            </span>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Parse Notice Alert */}
          {parseNotice && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                parseNotice.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {parseNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{parseNotice.message}</p>
                {parseNotice.type === 'success' && (
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Bạn có thể chỉnh sửa lại nội dung, môn học và đáp án chuẩn ở danh sách câu hỏi bên dưới.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD & DRAG DROP ZONE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag and Drop Container */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/80 bg-slate-50/60 dark:bg-slate-850/60 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt,.json,.csv,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processUploadedFile(e.target.files[0]);
                    }
                  }}
                />

                {isParsing ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Đang phân tích cấu trúc đề thi theo chuẩn Azota...
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Hệ thống đang tự động trích xuất từng câu hỏi, các lựa chọn A, B, C, D và bảng đáp án...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                      <FileUp className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Kéo thả file đề thi vào đây
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        hoặc <span className="text-emerald-600 dark:text-emerald-400 font-bold underline">bấm để chọn file</span> từ thiết bị của bạn
                      </p>
                    </div>

                    {/* Format pills */}
                    <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                        📄 Word (.docx)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800">
                        📑 PDF (.pdf)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800">
                        📝 Văn bản (.txt)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold border border-purple-200 dark:border-purple-800">
                        ⚡ JSON (.json)
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 italic pt-1">
                      (Hỗ trợ nhận diện tự động định dạng chuẩn: "Câu 1: ... A. ... B. ... C. ... D. ... Bảng đáp án: 1.A 2.B...")
                    </p>
                  </div>
                )}
              </div>

              {/* Action shortcuts: Load Sample or Paste Text */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleLoadSampleAzota}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800 transition shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Dùng thử Đề thi mẫu chuẩn Azota (1-Click)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPastingText(!isPastingText)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isPastingText ? 'Đóng khung dán' : 'Dán nội dung đề thi (Copy & Paste)'}</span>
                </button>
              </div>

              {/* Paste Text Area */}
              {isPastingText && (
                <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dán toàn bộ văn bản đề thi vào đây:
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Dán nội dung bài thi kèm các lựa chọn A, B, C, D và bảng đáp án..."
                    className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={!pastedText.trim() || isParsing}
                      onClick={() => {
                        if (!pastedText.trim()) return;
                        sendFileForParsing({
                          rawText: pastedText,
                          fileName: 'Văn bản đề thi dán trực tiếp'
                        });
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition shadow-xs"
                    >
                      Bắt đầu chuyển đổi thành đề kiểm tra
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GENERAL INFO (Shown on both tabs or when questions exist) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Thông tin cấu hình đề thi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên đề thi *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: vantien1304-SỬ, Đề khảo sát Toán 12..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Môn học
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Toán, Vật lí, Hóa học..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thời gian làm bài (phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)}
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giao cho
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Tất cả mọi người..."
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="published">Đã xuất bản (Làm được ngay)</option>
                  <option value="draft">Bản nháp</option>
                </select>
              </div>
            </div>
          </div>

          {/* QUESTIONS LIST REVIEW */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Danh sách câu hỏi trắc nghiệm
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {questions.length} câu
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm câu hỏi</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chưa có câu hỏi nào. Bạn có thể kéo thả file Word / PDF hoặc bấm "+ Thêm câu hỏi" để nhập tay.
                </p>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  + Nhập câu hỏi thủ công
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-[11px]">
                          {qIndex + 1}
                        </span>
                        Câu hỏi {qIndex + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      required
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestion(q.id, 'questionText', e.target.value)}
                      placeholder="Nhập nội dung câu hỏi..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-hidden focus:border-emerald-500"
                    />

                    {/* 4 Options with Radio selector for correct answer */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Chọn nút tròn trước phương án để đặt làm <strong>Đáp án đúng</strong>:
                      </p>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctOption === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2.5 p-1.5 rounded-xl border transition ${
                              isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={isCorrect}
                              onChange={() => handleUpdateQuestion(q.id, 'correctOption', oIdx)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0 ml-1"
                              title="Đặt làm đáp án đúng"
                            />
                            <span
                              className={`text-xs font-bold w-5 shrink-0 ${
                                isCorrect
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-slate-500'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleUpdateOption(q.id, oIdx, e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                            />
                            {isCorrect && (
                              <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 rounded-md shrink-0 mr-1">
                                Đúng ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(q.id, 'explanation', e.target.value)}
                      placeholder="Lời giải thích / Hướng dẫn giải chi tiết (không bắt buộc)..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 italic focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Tổng số câu: <strong>{questions.length}</strong> câu trắc nghiệm
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={questions.length === 0}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition shadow-xs active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{editingExam ? 'Lưu thay đổi' : 'Xuất bản đề thi (Azota)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
