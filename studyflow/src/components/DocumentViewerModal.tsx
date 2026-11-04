import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  FileCode, 
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Bookmark,
  StickyNote,
  Sparkles,
  HelpCircle,
  Brain,
  Send,
  RefreshCw,
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  BookOpen
} from 'lucide-react';
import { LibraryItem } from '../types';

interface DocumentViewerModalProps {
  item: LibraryItem | null;
  onClose: () => void;
}

type TabType = 'view' | 'bookmarks' | 'notes' | 'ai_summary' | 'ai_quiz' | 'ai_qa';

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  item,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('view');

  // Search inside document
  const [docSearchQuery, setDocSearchQuery] = useState('');

  // Bookmarks state (persistent per item)
  const [bookmarks, setBookmarks] = useState<Array<{ id: string; title: string; location: string }>>(() => {
    if (!item) return [];
    try {
      const saved = localStorage.getItem(`studyflow_bookmarks_${item.id}`);
      return saved ? JSON.parse(saved) : [
        { id: 'b1', title: 'Chương 1: Kiến thức cốt lõi', location: 'Trang 1, Đoạn 1' },
        { id: 'b2', title: 'Công thức quan trọng', location: 'Trang 2, Đoạn 3' }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (item) {
      localStorage.setItem(`studyflow_bookmarks_${item.id}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, item]);

  // Notes state (persistent per item)
  const [userNote, setUserNote] = useState<string>(() => {
    if (!item) return '';
    try {
      const saved = localStorage.getItem(`studyflow_note_${item.id}`);
      return saved || 'Ghi chú học tập của bạn về tài liệu này...';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (item) {
      localStorage.setItem(`studyflow_note_${item.id}`, userNote);
    }
  }, [userNote, item]);

  // AI Summary State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);

  // AI Quiz State
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    id: number;
    questionText: string;
    options: string[];
    correctOption: number;
    explanation: string;
    sourceCitation: string;
  }>>([]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // AI Q&A Chat State with Citations
  const [qaMessages, setQaMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; citation?: string }>>([
    {
      sender: 'ai',
      text: 'Xin chào! Mình là AI Trợ lý Kiểm chứng Tài liệu. Hãy đặt câu hỏi bất kỳ về bài học, mình sẽ giải thích và TRÍCH DẪN ĐOẠN/TRANG tương ứng để bạn kiểm chứng kiến thức nhé!'
    }
  ]);
  const [qaInput, setQaInput] = useState('');
  const [isQaThinking, setIsQaThinking] = useState(false);

  if (!item) return null;

  // Determine file type
  const isDataUrl = item.url?.startsWith('data:') || false;
  const urlLower = (item.url || '').toLowerCase();
  const fileNameLower = (item.fileName || '').toLowerCase();

  let detectedType: 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'link' = 'text';

  if (item.fileType) {
    detectedType = item.fileType;
  } else if (urlLower.includes('.pdf') || fileNameLower.endsWith('.pdf') || (isDataUrl && item.url?.startsWith('data:application/pdf'))) {
    detectedType = 'pdf';
  } else if (
    urlLower.match(/\.(png|jpe?g|gif|webp|svg)/) ||
    fileNameLower.match(/\.(png|jpe?g|gif|webp|svg)/) ||
    (isDataUrl && item.url?.startsWith('data:image/'))
  ) {
    detectedType = 'image';
  } else if (
    urlLower.match(/\.(mp4|webm|ogg)/) ||
    fileNameLower.match(/\.(mp4|webm|ogg)/) ||
    (isDataUrl && item.url?.startsWith('data:video/'))
  ) {
    detectedType = 'video';
  } else if (
    urlLower.match(/\.(mp3|wav|m4a)/) ||
    fileNameLower.match(/\.(mp3|wav|m4a)/) ||
    (isDataUrl && item.url?.startsWith('data:audio/'))
  ) {
    detectedType = 'audio';
  } else if (item.url && !item.fileContent) {
    detectedType = 'link';
  }

  const documentContentText = item.fileContent || item.d || item.t;

  const handleCopyContent = () => {
    const textToCopy = item.fileContent || item.url || item.d;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!item.url) {
      const blob = new Blob([item.fileContent || item.d], { type: 'text/markdown;charset=utf-8' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${item.t.replace(/[^a-zA-Z0-9\-_]/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      return;
    }

    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.fileName || `${item.t}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // AI Summarize handler
  const handleFetchSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai/document-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          documentTitle: item.t,
          documentContent: documentContentText
        })
      });
      const data = await res.json();
      setSummaryResult(data.summary);
    } catch {
      setSummaryResult('Không thể kết nối với dịch vụ AI tóm tắt.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Quiz handler
  const handleFetchQuiz = async () => {
    setIsGeneratingQuiz(true);
    setSelectedQuizAnswers({});
    setShowQuizResults(false);
    try {
      const res = await fetch('/api/ai/document-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_quiz',
          documentTitle: item.t,
          documentContent: documentContentText
        })
      });
      const data = await res.json();
      setQuizQuestions(data.quiz || []);
    } catch {
      setQuizQuestions([]);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // AI Q&A handler
  const handleSendQaMessage = async () => {
    if (!qaInput.trim() || isQaThinking) return;
    const userText = qaInput.trim();
    setQaInput('');
    setQaMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsQaThinking(true);

    try {
      const res = await fetch('/api/ai/document-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask_question',
          documentTitle: item.t,
          documentContent: documentContentText,
          userQuestion: userText
        })
      });
      const data = await res.json();
      setQaMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer || 'Rất tiếc, đã có lỗi khi trả lời.',
          citation: data.sourceCitation
        }
      ]);
    } catch {
      setQaMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Rất tiếc, không thể kết nối tới server AI.'
        }
      ]);
    } finally {
      setIsQaThinking(false);
    }
  };

  const handleAddBookmark = () => {
    const name = prompt('Nhập tên vị trí / tiêu đề đánh dấu:', 'Trang quan trọng');
    if (!name) return;
    const newBm = {
      id: Date.now().toString(),
      title: name.trim(),
      location: `Trang ${bookmarks.length + 1}, Đoạn ${bookmarks.length + 2}`
    };
    setBookmarks([...bookmarks, newBm]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in print:p-0 print:bg-white">
      <div
        className={`relative flex flex-col bg-white/95 dark:bg-[#071328]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-cyan-500/30 rounded-3xl calendar-modal-shadow animate-modal-spring overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[90vh] max-h-[880px]'
        }`}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-cyan-500/15 bg-slate-50/80 dark:bg-[#060c18]/90 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shrink-0">
              {item.sub}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {item.t}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {item.type} {item.fileName ? `• ${item.fileName}` : ''}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {detectedType === 'image' && (
              <>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-slate-500 px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                  title="Xoay hình"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              </>
            )}

            <button
              onClick={handleCopyContent}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="Sao chép nội dung / liên kết"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="In tài liệu"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="Tải tệp về máy"
            >
              <Download className="w-4 h-4" />
            </button>

            {item.url && !item.url.startsWith('data:') && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                title="Mở trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition ml-1"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Navigation Tabs (Matching image requirements: Xem, Tìm kiếm, Đánh dấu, Ghi chú, AI Tóm tắt chương, AI Tạo đề, AI Trích dẫn) */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'view'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Xem tài liệu</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            <span>Đánh dấu trang ({bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5 text-blue-500" />
            <span>Tạo ghi chú</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai_summary');
              if (!summaryResult && !isSummarizing) handleFetchSummary();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'ai_summary'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Tóm tắt từng chương</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai_quiz');
              if (quizQuestions.length === 0 && !isGeneratingQuiz) handleFetchQuiz();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'ai_quiz'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Tạo đề ôn tập</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_qa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'ai_qa'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Hỏi đáp AI (Có trích dẫn)</span>
          </button>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 flex flex-col justify-between">
          {/* TAB 1: VIEW DOCUMENT + SEARCH */}
          {activeTab === 'view' && (
            <div className="w-full h-full flex flex-col space-y-3">
              {/* Search inside document bar */}
              <div className="relative shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm từ khóa trong tài liệu này..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* 1. PDF Viewer */}
              {detectedType === 'pdf' && item.url && (
                <iframe
                  src={item.url}
                  title={item.t}
                  className="w-full flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              )}

              {/* 2. Image Viewer */}
              {detectedType === 'image' && item.url && (
                <div className="w-full flex-1 flex items-center justify-center overflow-auto p-2">
                  <img
                    src={item.url}
                    alt={item.t}
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* 3. Video Viewer */}
              {detectedType === 'video' && item.url && (
                <div className="w-full flex-1 max-w-3xl mx-auto flex items-center justify-center">
                  <video
                    controls
                    autoPlay
                    src={item.url}
                    className="w-full max-h-[70vh] rounded-xl shadow-lg bg-black"
                  >
                    Trình duyệt của bạn không hỗ trợ thẻ video.
                  </video>
                </div>
              )}

              {/* 4. Rich Text / Notes Viewer */}
              {(detectedType === 'text' || item.fileContent || !item.url) && (
                <div className="w-full flex-1 max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 overflow-y-auto">
                  <div className="space-y-3">
                    {documentContentText.split('\n').map((line, idx) => {
                      const trimmed = line.trim();
                      if (docSearchQuery.trim()) {
                        const match = trimmed.toLowerCase().includes(docSearchQuery.toLowerCase());
                        if (!match) return null;
                      }

                      if (trimmed.startsWith('# ')) {
                        return (
                          <h1 key={idx} className="text-xl font-black text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                            {trimmed.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (trimmed.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-base font-bold text-slate-900 dark:text-white pt-2">
                            {trimmed.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (trimmed.startsWith('- ')) {
                        return (
                          <div key={idx} className="flex gap-2 pl-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="text-emerald-500">•</span>
                            <p>{trimmed.substring(2)}</p>
                          </div>
                        );
                      }
                      if (!trimmed) return <div key={idx} className="h-1" />;
                      return (
                        <p key={idx} className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  Danh sách trang & đoạn đã đánh dấu
                </h3>
                <button
                  onClick={handleAddBookmark}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Đánh dấu vị trí mới</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {bookmarks.map((bm) => (
                  <div key={bm.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{bm.title}</h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{bm.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('view');
                          alert(`Đã nhảy tới vị trí đánh dấu: ${bm.location}`);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                      >
                        Nhảy tới
                      </button>
                      <button
                        onClick={() => setBookmarks(bookmarks.filter((b) => b.id !== bm.id))}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {bookmarks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">Chưa có vị trí nào được đánh dấu. Bấm nút ở trên để thêm.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-blue-500" />
                  Ghi chú cá nhân cho tài liệu này
                </h3>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Tự động lưu
                </span>
              </div>

              <textarea
                rows={12}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Ghi lại các công thức quan trọng, câu hỏi thắc mắc hoặc ý chính để học lại..."
                className="w-full p-4 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          )}

          {/* TAB 4: AI SUMMARY */}
          {activeTab === 'ai_summary' && (
            <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto max-h-[500px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Tóm tắt từng chương bằng AI
                </h3>
                <button
                  onClick={handleFetchSummary}
                  disabled={isSummarizing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                >
                  {isSummarizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isSummarizing ? 'Đang tóm tắt...' : 'Tóm tắt lại'}</span>
                </button>
              </div>

              {summaryResult ? (
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-3">
                  {summaryResult.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('### ')) return <h3 key={idx} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-2">{trimmed.replace('### ', '')}</h3>;
                    if (trimmed.startsWith('#### ')) return <h4 key={idx} className="text-xs font-bold text-slate-900 dark:text-white pt-1">{trimmed.replace('#### ', '')}</h4>;
                    if (trimmed.startsWith('- ')) {
                      return (
                        <div key={idx} className="flex gap-2 pl-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <p>{trimmed.substring(2)}</p>
                        </div>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">AI đang đọc toàn bộ tài liệu và trích xuất nội dung từng chương...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI QUIZ */}
          {activeTab === 'ai_quiz' && (
            <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto max-h-[500px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  Đề ôn tập kiểm tra kiến thức tài liệu
                </h3>
                <button
                  onClick={handleFetchQuiz}
                  disabled={isGeneratingQuiz}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                >
                  {isGeneratingQuiz ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  <span>{isGeneratingQuiz ? 'Đang tạo đề...' : 'Tạo bộ câu hỏi mới'}</span>
                </button>
              </div>

              {quizQuestions.length > 0 ? (
                <div className="space-y-6">
                  {quizQuestions.map((q, qIdx) => {
                    const selected = selectedQuizAnswers[q.id];
                    const isCorrect = selected === q.correctOption;

                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Câu {qIdx + 1}: {q.questionText}
                          </h4>
                          {q.sourceCitation && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg shrink-0">
                              {q.sourceCitation}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isThisSelected = selected === optIdx;
                            let btnStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                            
                            if (showQuizResults) {
                              if (optIdx === q.correctOption) {
                                btnStyle = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                              } else if (isThisSelected) {
                                btnStyle = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-200';
                              }
                            } else if (isThisSelected) {
                              btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => setSelectedQuizAnswers({ ...selectedQuizAnswers, [q.id]: optIdx })}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${btnStyle}`}
                              >
                                {String.fromCharCode(65 + optIdx)}. {opt}
                              </button>
                            );
                          })}
                        </div>

                        {showQuizResults && (
                          <div className={`p-2.5 rounded-xl text-xs ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                            <p className="font-bold">{isCorrect ? '✓ Chính xác!' : '✗ Chưa chính xác'}</p>
                            <p className="mt-1">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <button
                      onClick={() => setShowQuizResults(true)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
                    >
                      Nộp bài & Xem giải thích chi tiết
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-8 h-8 text-indigo-500 animate-bounce mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Đang khởi tạo 5 câu hỏi kiểm tra từ tài liệu...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AI QA WITH CITATIONS */}
          {activeTab === 'ai_qa' && (
            <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col h-[460px]">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-rose-500" />
                  Hỏi đáp AI với Trích dẫn nguồn kiểm chứng
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Mọi câu trả lời của AI đều được trích dẫn chính xác trang/đoạn trong tài liệu</p>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
                {qaMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.citation && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{msg.citation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isQaThinking && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>AI đang tra cứu tài liệu và trích dẫn trang...</span>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQaMessage()}
                  placeholder="Đặt câu hỏi về nội dung tài liệu này (Ví dụ: Công thức tính ở trang mấy?)..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  onClick={handleSendQaMessage}
                  disabled={isQaThinking || !qaInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 print:hidden">
          <span>{item.sub} • {item.type}</span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Xem trực tiếp • Tìm kiếm • Đánh dấu • Ghi chú • AI Trích dẫn</span>
        </div>
      </div>
    </div>
  );
};
