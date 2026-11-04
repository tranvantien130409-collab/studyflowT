import React, { useState, useRef, useEffect } from 'react';
import { X, Bot, Sparkles, Send, User, Lightbulb, Globe, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { askTutor, TutorMessage } from '../services/aiTutor';
import { StudentProfile } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  sources?: Array<{ title: string; uri: string }>;
  source?: string;
  error?: string;
}

interface StudentAiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentProfile?: StudentProfile;
}

const SUBJECTS = [
  'Toán học',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Ngữ văn',
  'Tiếng Anh',
  'Lịch sử',
  'Địa lý',
  'GDCD',
  'Tin học'
];

export const StudentAiTutorModal: React.FC<StudentAiTutorModalProps> = ({
  isOpen,
  onClose,
  studentProfile
}) => {
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState(studentProfile?.className?.includes('10') ? '10' : studentProfile?.className?.includes('11') ? '11' : '12');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Xin chào ${studentProfile?.name || 'bạn'}! Mình là **Gia sư AI StudyFlow**, chuyên gia giải đáp học tập môn **${subject}** (Lớp ${grade}) theo chương trình GDPT 2018. Mình có thể giải thích lý thuyết sâu sắc, hướng dẫn giải bài tập từng bước và tra cứu thông tin thực tế khi bạn cần. Bạn muốn hỏi gì hôm nay?`,
      time: 'Vừa xong'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputVal).trim();
    if (!prompt || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: prompt,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      const tutorMessages: TutorMessage[] = nextMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await askTutor(
        tutorMessages,
        subject,
        grade,
        `Bạn là Gia sư AI cao cấp của StudyFlow, dạy học sinh lớp ${grade} môn ${subject} theo chương trình GDPT 2018. Hãy trả lời trực tiếp, chính xác tuyệt đối, giải thích sâu sắc cả lý thuyết và bài tập từng bước, sử dụng LaTeX cho công thức ($...$ và $$...$$).`
      );

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: response.reply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
        source: response.source
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: `### 🤖 Hướng dẫn từ Gia sư AI:\n1. Đã tiếp nhận câu hỏi môn ${subject}.\n2. Đang kết nối trực tiếp đến mô hình Gemini & Google Search. Vui lòng gửi lại câu hỏi hoặc thử lại sau giây lát.`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
        error: err?.message || 'Gián đoạn kết nối mạng'
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    `Giải thích bản chất và công thức môn ${subject}`,
    'Hướng dẫn giải bài tập vận dụng cao từng bước',
    'Tóm tắt kiến thức trọng tâm ôn thi 8.5+',
    'Cho một ví dụ thực tế và bài tập mẫu'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gradient-to-b dark:from-[#0d1627] dark:via-[#0a1120] dark:to-[#070c18] border border-slate-200/90 dark:border-cyan-500/25 rounded-3xl max-w-3xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        {/* Ambient neon decorative background light */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header - Luxury Navy Gradient with Ambient Neon Highlights */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-[#071322] via-[#0d2238] to-[#091a2e] text-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-300/40">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>Gia sư AI StudyFlow</span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                  Lớp {grade}
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Giải đáp lý thuyết, Bài tập từng bước & Tra cứu Google Search
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Subject & Grade selector - Navy Glass Style */}
        <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-[#081223]/90 border-b border-slate-200/80 dark:border-cyan-500/15 flex items-center gap-3 flex-wrap relative z-10 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <BookOpen className="w-4 h-4 text-cyan-500" />
            <span>Môn học:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-1 rounded-xl bg-white dark:bg-[#0c192e] border border-slate-200 dark:border-cyan-500/20 text-xs font-bold text-slate-900 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Khối lớp:</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="px-3 py-1 rounded-xl bg-white dark:bg-[#0c192e] border border-slate-200 dark:border-cyan-500/20 text-xs font-bold text-slate-900 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer"
            >
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
            </select>
          </div>
        </div>

        {/* Messages Body - Depth Drop Shadows & Frosted Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-slate-50/70 dark:bg-[#060b15]/95 relative z-10">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] ring-1 ring-cyan-300/40'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-lg shadow-indigo-950/40 ring-1 ring-cyan-400/30'
                    : 'bg-white dark:bg-gradient-to-br dark:from-[#0d172a] dark:to-[#091120] border border-slate-200/90 dark:border-cyan-500/20 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-md dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] prose dark:prose-invert max-w-none'
                }`}
              >
                {m.sender === 'user' ? (
                  m.text
                ) : (
                  <div className="space-y-2">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {m.text}
                    </ReactMarkdown>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-cyan-500/20 text-[11px] text-slate-500">
                        <div className="font-bold flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 mb-1.5">
                          <Globe className="w-3.5 h-3.5 text-cyan-500" /> Nguồn tra cứu Google Search:
                        </div>
                        <ul className="space-y-1">
                          {m.sources.map((s, idx) => (
                            <li key={idx}>
                              <a
                                href={s.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-600 dark:text-cyan-300 hover:underline truncate block font-medium"
                              >
                                • {s.title} ({new URL(s.uri).hostname})
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`text-[10px] mt-2 text-right ${
                    m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-cyan-600 dark:text-cyan-400 pl-11 font-semibold animate-pulse p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 w-fit">
              <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span>Gia sư AI đang tra cứu Google Search và tổng hợp lời giải chi tiết...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts - Sleek Pills */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-cyan-500/15 bg-white dark:bg-[#091120] flex items-center gap-2 overflow-x-auto custom-scrollbar relative z-10">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-[11px] whitespace-nowrap px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0c182a] hover:bg-cyan-50 dark:hover:bg-[#12233c] text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200/80 dark:border-cyan-500/20 transition-all active:scale-95 shadow-2xs hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar - FLOATING NAVY DOCK */}
        <div className="p-3.5 border-t border-slate-100 dark:border-cyan-500/20 bg-white dark:bg-[#080f1d] flex items-center gap-2.5 relative z-10">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Nhập câu hỏi lý thuyết hoặc bài tập môn ${subject}...`}
            rows={1}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-slate-50 dark:bg-[#060b14] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 resize-none max-h-24 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white disabled:opacity-50 transition active:scale-95 shadow-lg shadow-cyan-500/30 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
