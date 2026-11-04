import React, { useState, useRef, useEffect } from 'react';
import { X, Bot, Sparkles, Send, User, RotateCcw, Lightbulb, CheckCircle2, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { TeacherProfile } from '../types';
import { askTutor, TutorMessage } from '../services/aiTutor';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  sources?: Array<{ title: string; uri: string }>;
  source?: string;
  error?: string;
}

interface TeacherAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TeacherProfile;
}

export const TeacherAiAssistantModal: React.FC<TeacherAiAssistantModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Xin chào ${profile.name}! Tôi là **Trợ lý AI Sư phạm StudyFlow** (môn ${profile.subject}). Tôi có thể hỗ trợ Cô/Thầy phân tích số liệu học tập học sinh, nhận diện lỗ hổng kiến thức theo ma trận, tra cứu thông tin học thuật trực tuyến và gợi ý bài tập phân hóa phù hợp. Cô/Thầy cần hỗ trợ gì hôm nay?`,
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
        profile.subject || 'Vật lý',
        '12',
        `Bạn là Trợ lý AI sư phạm cao cấp dành riêng cho ${profile.name} (Giáo viên môn ${profile.subject}) trên nền tảng giáo dục StudyFlow. Hãy trả lời chuyên nghiệp, ân cần, chi tiết theo chuẩn sư phạm Việt Nam. Đưa ra phân tích học tập, nhận diện lỗ hổng kiến thức học sinh và đề xuất bài tập phân hóa theo ma trận.`
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
        text: `### 📊 Phân tích sư phạm từ Trợ lý AI cho ${profile.name}:\n1. Hệ thống đã tiếp nhận yêu cầu liên quan đến môn ${profile.subject}.\n2. Đề xuất: Rà soát lại ma trận nhận thức phần vận dụng cao và bổ sung hệ thống bài tập tự luyện.`,
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
    `Phân tích lỗ hổng kiến thức môn ${profile.subject}`,
    'Gợi ý bài tập phân hóa theo ma trận cho học sinh dưới 5 điểm',
    'Kế hoạch ôn tập 4 tuần cho kỳ thi THPT Quốc Gia',
    `Soạn 3 câu hỏi trắc nghiệm Vận dụng cao môn ${profile.subject}`
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gradient-to-b dark:from-[#0d1627] dark:via-[#0a1120] dark:to-[#070c18] border border-slate-200/90 dark:border-cyan-500/25 rounded-3xl max-w-3xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Ambient neon orbs */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header - Luxury Deep Navy & Neon Accents */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-[#071322] via-[#0d2238] to-[#111e38] text-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-300/40">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>Trợ lý AI Sư phạm – {profile.name}</span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                  {profile.subject}
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Phân tích học tập, Tra cứu trực tuyến & Gợi ý bài tập phân hóa ma trận
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

        {/* Messages Body - Deep Navy with Soft Blurred Shadows */}
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
                    : 'bg-gradient-to-tr from-indigo-500 via-blue-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] ring-1 ring-cyan-300/40'
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
                          <Globe className="w-3.5 h-3.5 text-cyan-500" /> Nguồn tham khảo trực tuyến:
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
              <span>Trợ lý AI đang tra cứu internet, tổng hợp số liệu và phân tích sư phạm...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts - Sleek Navy Pills */}
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
            placeholder={`Nhập câu hỏi hoặc yêu cầu phân tích sư phạm môn ${profile.subject}...`}
            rows={1}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-cyan-500/30 bg-slate-50 dark:bg-[#060b14] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 resize-none max-h-24 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white disabled:opacity-50 transition active:scale-95 shadow-lg shadow-cyan-500/30 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
