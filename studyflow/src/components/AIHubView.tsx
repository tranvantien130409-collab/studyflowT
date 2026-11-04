import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  HeartHandshake, GraduationCap, Video, BrainCircuit, Send, Loader2,
  Sparkles, BookOpen, ClipboardList, Layers, Copy, Check, AlertCircle, Shield, Lock,
  Wind, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, ThumbsUp, ThumbsDown,
  Calendar, CloudRain, Waves, Coffee, Radio, Smile, Frown, Meh,
  ArrowUp, ArrowDown, Flower2, HelpCircle, X, ChevronDown, ChevronLeft, ChevronRight,
  Headphones, Presentation, Network, Table, FileText, Plus, SlidersHorizontal, Folder, Trash2, Globe, PanelLeftClose, PanelRightClose, Search, ArrowRight, Share2, FileDown, Edit3,
  Zap, UploadCloud, Timer, CheckCircle2, XCircle, Award, CalendarPlus
} from 'lucide-react';
import type { FlashcardDeck } from '../types';
import { lofiEngine, LofiStationId } from '../utils/lofiAudioEngine';

type Mode = 'mental' | 'mental2' | 'summary' | 'quiz' | 'calendar';
type ChatMessage = { 
  role: 'user' | 'assistant'; 
  content: string; 
  source?: string; 
  error?: string;
  timestamp?: string;
  liked?: boolean | null;
};

type MoodType = 'happy' | 'stable' | 'stressed' | 'exhausted';
type ToneType = 'intimate' | 'casual' | 'formal';

interface AIHubViewProps {
  onAddDeck: (deck: FlashcardDeck) => void;
  onToast?: (message: string) => void;
  onNavigateToCalendar?: () => void;
}

const POSITIVE_AFFIRMATIONS = [
  "Mỗi nỗ lực nhỏ hôm nay đều là nền tảng cho thành công lớn ngày mai. Hãy kiên nhẫn với chính mình!",
  "Điểm số chỉ là một thước đo thời điểm, không định nghĩa giá trị hay tương lai của bạn. Bạn luôn có thể tiến bộ!",
  "Khi thấy mệt mỏi, hãy học cách nghỉ ngơi đúng cách thay vì từ bỏ. Bạn đã làm rất tốt hôm nay rồi!",
  "Hít một hơi thật sâu, thả lỏng đôi vai. Từng bài tập một, từng bước một, bạn sẽ hoàn thành mục tiêu thôi!",
  "Mỗi sai lầm trong bài tập là một cơ hội tuyệt vời để não bộ hiểu sâu và nhớ lâu hơn."
];

const SUGGESTIONS = [
  { label: '👋 Chào bạn!', text: 'Chào bạn! Hôm nay mình muốn chia sẻ một chút về ngày của mình.' },
  { label: '📝 Em thi toán được 4 điểm, chắc em dốt thật', text: 'Em vừa nhận điểm kiểm tra Toán được 4 điểm, em cảm thấy rất thất vọng về bản thân và nghĩ mình dốt thật sự...' },
  { label: '😫 mệt', text: 'Hôm nay bài vở nhiều quá, mình cảm thấy quá tải và kiệt sức.' },
  { label: '❤️ Chẳng ai trong lớp hiểu em cả', text: 'Ở lớp em cảm thấy mình lạc lõng, dường như chẳng có ai thực sự hiểu và lắng nghe em.' }
];

// @ai-studio-protected-block
// This file contains core AI functionality. 
// DO NOT MODIFY AI communication logic or prompt contracts unless explicitly asked.

export const AIHubView: React.FC<AIHubViewProps> = ({ onAddDeck, onToast, onNavigateToCalendar }) => {
  // Active Mode/Tab
  const [mode, setMode] = useState<Mode>('mental');
  const [subject, setSubject] = useState('Toán học');
  const [input, setInput] = useState('');
  
  // Psychological tone and mood state
  const [currentMood, setCurrentMood] = useState<MoodType | null>('stable');
  const [tone, setTone] = useState<ToneType>('intimate');
  const [language, setLanguage] = useState<'auto' | 'vi' | 'en'>('auto');
  const [showHabitProfileModal, setShowHabitProfileModal] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Chat message state for 2 psychology counseling spaces
  const [messages, setMessages] = useState<Record<'mental' | 'mental2', ChatMessage[]>>({
    mental: [{ 
      role: 'assistant', 
      content: 'Chào em 🌿 Mình là Trợ lý Tâm Lý Học Đường (1) ở đây với em nè. Dù hôm nay là một ngày nhiều bài vở, có chuyện ở trường làm em trăn trở, hay chỉ là trong lòng đang thấy hơi mệt... em cứ chậm rãi giãi bày nhé! Ở đây luôn lắng nghe em ✨',
      timestamp: 'Vừa xong'
    }],
    mental2: [{ 
      role: 'assistant', 
      content: 'Chào em 🌸 Mình là Trợ lý Tâm Lý Học Đường (2) luôn ở đây để sẻ chia cùng em. Những áp lực học tập, chuyện bạn bè, gia đình hay bất cứ cảm xúc khó nói nào... em đều có thể thoải mái tâm sự nhé! ✨',
      timestamp: 'Vừa xong'
    }]
  });
  
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Document tools state
  const [docTitle, setDocTitle] = useState('');
  const [docText, setDocText] = useState('');
  const [summary, setSummary] = useState('');
  const [summarySource, setSummarySource] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [quiz, setQuiz] = useState<any[]>([]);
  const [quizSource, setQuizSource] = useState('');
  const [quizError, setQuizError] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [copied, setCopied] = useState(false);

  // --- Exam & Quiz Mode State (Matching image_d7c14f53.png) ---
  const [examMode, setExamMode] = useState<'practice' | 'exam'>('practice');
  const [examTimeLeft, setExamTimeLeft] = useState(450);
  const quizFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examMode === 'exam' && quiz.length > 0 && !quizSubmitted && examTimeLeft > 0) {
      timer = setInterval(() => {
        setExamTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examMode, quiz.length, quizSubmitted, examTimeLeft]);

  useEffect(() => {
    if (examMode === 'exam' && quiz.length > 0 && !quizSubmitted && examTimeLeft <= 0) {
      setQuizSubmitted(true);
      onToast?.('Đã hết thời gian làm bài thi thử!');
    }
  }, [examMode, quiz.length, quizSubmitted, examTimeLeft, onToast]);

  const formatExamTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- AI Architect Calendar State (Matching image_1cc2ed8a.png / image_80249c25.png) ---
  const [calendarStudyGoal, setCalendarStudyGoal] = useState<number>(80);
  const [calendarStartDate, setCalendarStartDate] = useState<string>('2026-11-01');
  const [calendarEndDate, setCalendarEndDate] = useState<string>('2026-11-20');
  const [calendarPrioritySubject, setCalendarPrioritySubject] = useState<string>('Tiếng Anh');
  const [calendarInput, setCalendarInput] = useState<string>('');
  const [calendarBusy, setCalendarBusy] = useState<boolean>(false);
  const [calendarMessages, setCalendarMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Chào bạn! Mình là AI Architect 🎓. Mình ở đây để giúp bạn lập một lộ trình học tập tối ưu, tự động đồng bộ với Google Calendar.\n\nĐể bắt đầu, bạn hãy chia sẻ cho mình một số thông tin nhé:\n\n1. Môn học bạn muốn **ưu tiên** nhất?\n2. Tổng số **giờ mục tiêu** (Study Goal) bạn muốn đạt được?\n3. Thời điểm bạn muốn **bắt đầu và kết thúc**?\n4. Các **khung giờ rảnh** bạn có thể học?\n\nBạn có thể trả lời từng câu hoặc cung cấp tất cả cùng lúc nhé!`,
      timestamp: 'Vừa xong'
    }
  ]);
  const calendarChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'calendar') {
      calendarChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [calendarMessages, mode]);

  const handleSendCalendarMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : calendarInput).trim();
    if (!text || calendarBusy) return;

    const next = [...calendarMessages, { role: 'user' as const, content: text, timestamp: 'Vừa xong' }];
    setCalendarMessages(next);
    setCalendarInput('');
    setCalendarBusy(true);

    try {
      const response = await fetch('/api/ai/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: 'architect',
          subject: calendarPrioritySubject,
          grade: '12',
          messages: next.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể kết nối AI Architect.');
      setCalendarMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'AI Architect chưa có phản hồi.',
          source: data.source,
          error: data.error,
          timestamp: 'Vừa xong'
        }
      ]);
    } catch (err: any) {
      setCalendarMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Không thể hoàn tất phản hồi: ${err.message || 'Lỗi kết nối'}. Bạn hãy thử lại nhé!`,
          source: 'fallback',
          error: err.message,
          timestamp: 'Vừa xong'
        }
      ]);
    } finally {
      setCalendarBusy(false);
    }
  };

  const handleStartProfessionalSurvey = () => {
    setCalendarMessages([
      {
        role: 'assistant',
        content: `Chào bạn! Mình là AI Architect 🎓. Bắt đầu phiên khảo sát chuyên nghiệp để thiết kế lộ trình học tập cá nhân hóa & xếp lịch tự động.\n\nHãy cho mình biết:\n\n1. Môn học bạn muốn **ưu tiên** nhất?\n2. Tổng số **giờ mục tiêu** (Study Goal) bạn muốn đạt được?\n3. Thời điểm bạn muốn **bắt đầu và kết thúc**?\n4. Các **khung giờ rảnh** bạn có thể học?\n\nBạn có thể gõ câu trả lời bên dưới hoặc dùng khung Cài đặt thủ công bên phải nhé!`,
        timestamp: 'Vừa xong'
      }
    ]);
    onToast?.('Đã bắt đầu bài khảo sát chuyên nghiệp cùng AI Architect 🎓');
  };

  const handlePlanFromSettings = () => {
    const prompt = `Lập kế hoạch học tập chi tiết từ ngày ${calendarStartDate} đến ngày ${calendarEndDate}, với tổng mục tiêu ${calendarStudyGoal} giờ học (Study Goal), tập trung ưu tiên môn ${calendarPrioritySubject}. Hãy phân bổ các ca học cụ thể trong ngày, thời gian biểu thông minh và gợi ý đồng bộ lên Calendar.`;
    handleSendCalendarMessage(prompt);
  };

  // --- NotebookLM State (Matching image_75d1d318.png / image_fc97fe93.png) ---
  const [notebookTitle, setNotebookTitle] = useState('Untitled notebook');
  const [sources, setSources] = useState<{
    id: string;
    name: string;
    type: 'file' | 'youtube' | 'text' | 'web';
    content: string;
    charCount: number;
    url?: string;
  }[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [addSourceTab, setAddSourceTab] = useState<'text' | 'file' | 'youtube'>('text');
  const [sourceTextInput, setSourceTextInput] = useState('');
  const [sourceNameInput, setSourceNameInput] = useState('');
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState<{
    id: string;
    title: string;
    sourcesCount: number;
    summary: string;
    createdAt: string;
  }[]>([
    {
      id: 'proj-1',
      title: 'Untitled notebook',
      sourcesCount: 0,
      summary: '',
      createdAt: 'Hôm nay'
    }
  ]);
  const [studioActiveProduct, setStudioActiveProduct] = useState<string | null>(null);
  const [studioOutput, setStudioOutput] = useState<{
    type: string;
    title: string;
    content: string;
  } | null>(null);
  const [isAudioOverviewPlaying, setIsAudioOverviewPlaying] = useState(false);
  const [notebookChatInput, setNotebookChatInput] = useState('');
  const [notebookMessages, setNotebookMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  // --- 4-7-8 Breathing Technique State ---
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [breathCount, setBreathCount] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play gentle bell for breath phase shift
  const playBreathBell = (freq = 440) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  // Breathing loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathing) {
      if (breathPhase === 'idle' || breathPhase === 'exhale') {
        setBreathPhase('inhale');
        setBreathCount(4);
        playBreathBell(523.25); // C5
      }

      timer = setInterval(() => {
        setBreathCount((prev) => {
          if (prev > 1) {
            return prev - 1;
          }
          // Transition to next phase
          if (breathPhase === 'inhale') {
            setBreathPhase('hold');
            playBreathBell(659.25); // E5
            return 7;
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            playBreathBell(392.00); // G4
            return 8;
          } else {
            setBreathPhase('inhale');
            playBreathBell(523.25); // C5
            return 4;
          }
        });
      }, 1000);
    } else {
      setBreathPhase('idle');
      setBreathCount(4);
    }
    return () => clearInterval(timer);
  }, [isBreathing, breathPhase]);

  // --- Ambient Relaxation Sounds ---
  const [activeSound, setActiveSound] = useState<'rain' | 'ocean' | 'cafe' | 'white-noise' | null>(null);
  const whiteNoiseCtxRef = useRef<AudioContext | null>(null);
  const whiteNoiseSrcRef = useRef<AudioBufferSourceNode | null>(null);

  const toggleSound = (soundType: 'rain' | 'ocean' | 'cafe' | 'white-noise') => {
    // Stop white noise if running
    if (whiteNoiseSrcRef.current) {
      try {
        whiteNoiseSrcRef.current.stop();
        whiteNoiseSrcRef.current.disconnect();
      } catch {}
      whiteNoiseSrcRef.current = null;
    }

    if (activeSound === soundType) {
      lofiEngine.pause();
      setActiveSound(null);
      return;
    }

    if (soundType === 'white-noise') {
      lofiEngine.pause();
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          whiteNoiseCtxRef.current = ctx;
          const bufferSize = ctx.sampleRate * 2;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.05;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1000;
          whiteNoise.connect(filter);
          filter.connect(ctx.destination);
          whiteNoise.start();
          whiteNoiseSrcRef.current = whiteNoise;
        }
      } catch {}
      setActiveSound('white-noise');
    } else {
      const stationMap: Record<string, LofiStationId> = {
        rain: 'rain',
        ocean: 'ocean',
        cafe: 'cafe'
      };
      lofiEngine.play(stationMap[soundType]);
      setActiveSound(soundType);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      lofiEngine.pause();
      if (whiteNoiseSrcRef.current) {
        try {
          whiteNoiseSrcRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const chatMode = mode === 'mental' || mode === 'mental2';

  const appendChat = (kind: 'mental' | 'mental2', message: ChatMessage) => {
    setMessages((prev) => ({ ...prev, [kind]: [...prev[kind], message] }));
  };

  const sendChat = async (overrideText?: string) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text || busy || !chatMode) return;
    const kind = mode as 'mental' | 'mental2';
    const next = [...messages[kind], { role: 'user' as const, content: text, timestamp: 'Vừa xong' }];
    setMessages((prev) => ({ ...prev, [kind]: next }));
    setInput('');
    setBusy(true);

    try {
      const response = await fetch('/api/ai/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: 'psy',
          session: kind,
          tone,
          language,
          autonomousResearch: false,
          messages: next.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể kết nối AI.');
      appendChat(kind, {
        role: 'assistant',
        content: data.reply || data.answer || 'AI chưa có phản hồi.',
        source: data.source,
        error: data.error,
        timestamp: 'Vừa xong'
      });
    } catch (error: any) {
      appendChat(kind, {
        role: 'assistant',
        content: `Không thể hoàn tất phản hồi: ${error.message || 'Lỗi kết nối máy chủ'}. Hãy thử lại bạn nhé 🌷`,
        source: 'fallback',
        error: error.message || 'Lỗi kết nối',
        timestamp: 'Vừa xong'
      });
    } finally {
      setBusy(false);
    }
  };

  const handleResetChat = () => {
    const isMental2 = mode === 'mental2';
    const roomTitle = isMental2 ? 'Tâm lí học đường (2)' : 'Tâm lí học đường';
    if (window.confirm(`Bạn có muốn bắt đầu lại cuộc trò chuyện với ${roomTitle} từ đầu không?`)) {
      setMessages((prev) => ({
        ...prev,
        [mode as 'mental' | 'mental2']: [{
          role: 'assistant',
          content: isMental2
            ? 'Chào em 🌸 Mình là Trợ lý Tâm Lý Học Đường (2) luôn ở đây để sẻ chia cùng em. Những áp lực học tập, chuyện bạn bè, gia đình hay bất cứ cảm xúc khó nói nào... em đều có thể thoải mái tâm sự nhé! ✨'
            : 'Chào em 🌿 Mình là Trợ lý Tâm Lý Học Đường ở đây với em nè. Dù hôm nay là một ngày nhiều bài vở, có chuyện ở trường làm em trăn trở, hay chỉ là trong lòng đang thấy hơi mệt... em cứ chậm rãi giãi bày nhé! Ở đây luôn lắng nghe em ✨',
          timestamp: 'Vừa xong'
        }]
      }));
      onToast?.(`Đã làm mới cuộc trò chuyện với ${roomTitle}!`);
    }
  };

  const handleCopyMessage = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 1800);
      onToast?.('Đã sao chép nội dung!');
    } catch {
      onToast?.('Trình duyệt không hỗ trợ sao chép tự động.');
    }
  };

  const handleReaction = (msgIndex: number, isLiked: boolean) => {
    setMessages(prev => {
      const kind = mode as 'mental' | 'mental2';
      const currentList = [...prev[kind]];
      currentList[msgIndex] = { ...currentList[msgIndex], liked: isLiked };
      return { ...prev, [kind]: currentList };
    });
    onToast?.(isLiked ? 'Cảm ơn bạn đã thích phản hồi này! 💖' : 'Đã ghi nhận, AI sẽ lắng nghe và trả lời tốt hơn.');
  };

  const handleMoodSelect = (mood: MoodType) => {
    setCurrentMood(mood);
    const messagesByMood: Record<MoodType, string> = {
      happy: 'Tuyệt vời quá! Hãy cùng giữ năng lượng tích cực này để đạt hiệu suất học tập cao nhất nhé! 🌟',
      stable: 'Tâm trạng ổn định là trạng thái lý tưởng để tập trung học sâu và ghi nhớ bền bỉ! 🍀',
      stressed: 'Mình cảm nhận được áp lực của bạn. Hãy thử hít thở theo bài 4-7-8 ở khung bên phải hoặc chia sẻ với mình nhé 🌿',
      exhausted: 'Bạn đã rất cố gắng rồi. Hãy tạm rời sách vở 10 phút, uống nước ấm và nghe tiếng mưa rơi để hồi phục nhé ☕'
    };
    onToast?.(messagesByMood[mood]);
  };

  const getCombinedSourceText = () => {
    if (sources.length > 0) {
      return sources.map(s => `=== [Nguồn: ${s.name}] ===\n${s.content}`).join('\n\n');
    }
    return docText;
  };

  const readFile = async (file?: File) => {
    if (!file) return;
    const allowed = /\.(txt|md|csv)$/i.test(file.name) || ['text/plain', 'text/markdown', 'text/csv'].includes(file.type);
    if (!allowed) {
      onToast?.('Hiện tại hãy tải tệp TXT, MD hoặc CSV. Với PDF/DOCX, hãy sao chép phần văn bản vào ô nội dung.');
      return;
    }
    const text = await file.text();
    setDocText(text);
    const cleanName = file.name.replace(/\.[^.]+$/, '');
    if (!docTitle) setDocTitle(cleanName);
    setNotebookTitle(cleanName);
    setSources(prev => [
      ...prev,
      {
        id: `file-${Date.now()}`,
        name: file.name,
        type: 'file',
        content: text,
        charCount: text.length
      }
    ]);
    onToast?.(`Đã nạp tệp "${file.name}" vào danh sách nguồn!`);
  };

  const runSummary = async (overrideContent?: string, overrideTitle?: string) => {
    const content = (overrideContent !== undefined ? overrideContent : (getCombinedSourceText() || docText)).trim();
    const title = overrideTitle || notebookTitle || docTitle || 'Bài giảng tổng hợp';
    if (!content) {
      onToast?.('Hãy nhập hoặc tải nội dung bài giảng trước.');
      setShowAddSourceModal(true);
      return;
    }
    setBusy(true); setSummary(''); setSummarySource(''); setSummaryError('');
    try {
      const response = await fetch('/api/ai/document-tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize', documentTitle: title, documentContent: content })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tóm tắt tài liệu.');
      setSummary(data.summary || 'Chưa tạo được bản tóm tắt.');
      setSummarySource(data.source || '');
      setSummaryError(data.error || '');
      onToast?.('Đã tạo bản tóm tắt thành công!');
    } catch (error: any) { onToast?.(error.message || 'Có lỗi khi tóm tắt.'); }
    finally { setBusy(false); }
  };

  const runQuiz = async () => {
    if (!docText.trim()) return onToast?.('Hãy nhập nội dung kiến thức trước khi tạo câu hỏi.');
    setBusy(true); setQuiz([]); setAnswers({}); setQuizSubmitted(false); setQuizSource(''); setQuizError('');
    try {
      const response = await fetch('/api/ai/document-tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_quiz', documentTitle: docTitle, documentContent: docText, numQuestions, difficulty, subject })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tạo trắc nghiệm.');
      setQuizSource(data.source || '');
      setQuizError(data.error || '');
      const questions = data.questions || data.quiz || [];
      setQuiz(questions.map((q: any) => ({
        questionText: q.questionText || q.question || q.text || 'Câu hỏi',
        options: q.options || [],
        correctOption: Number.isInteger(q.correctOption) ? q.correctOption : Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
        explanation: q.explanation || '',
        sourceCitation: q.sourceCitation || ''
      })));
      if (!(data.questions || data.quiz || []).length) onToast?.('AI chưa trả về câu hỏi đúng định dạng. Hãy thử lại với nội dung rõ hơn.');
    } catch (error: any) { onToast?.(error.message || 'Có lỗi khi tạo câu hỏi.'); }
    finally { setBusy(false); }
  };

  const runFlashcards = async () => {
    if (!docText.trim()) return onToast?.('Hãy nhập nội dung kiến thức trước khi tạo Flashcard.');
    setBusy(true);
    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: docText, subject, title: docTitle || `Flashcard ${subject}` })
      });
      const data = await response.json();
      if (!response.ok || !data.deck) throw new Error(data.error || 'Không thể tạo Flashcard.');
      const now = new Date().toISOString();
      const cards = (data.deck.cards || []).map((card: any, index: number) => ({
        id: String(card.id || `ai-${Date.now()}-${index}`), front: card.front || card.term || '', back: card.back || card.definition || '',
        hint: card.hint || '', status: 'new' as const, interval: 0, easiness: 2.5, repetitions: 0
      })).filter((card: any) => card.front && card.back);
      const deck: FlashcardDeck = {
        id: `ai-deck-${Date.now()}`, title: data.deck.title || docTitle || `Flashcard ${subject}`, subject: data.deck.subject || subject,
        description: 'Được tạo bởi AI StudyFlow từ tài liệu học tập.', cardCount: cards.length, remainingCount: cards.length,
        goodCount: 0, againCount: 0, createdAt: now, cards, streak: 0
      };
      if (!cards.length) throw new Error('AI không tạo được thẻ ghi nhớ hợp lệ.');
      onAddDeck(deck);
      if (data.source === 'fallback') {
        onToast?.(`Đã thêm Flashcard (AI đang ở chế độ dự phòng: ${data.error || 'Nội dung dự phòng'})`);
      } else {
        onToast?.(`Đã thêm bộ ${cards.length} Flashcard vào thư viện.`);
      }
    } catch (error: any) { onToast?.(error.message || 'Có lỗi khi tạo Flashcard.'); }
    finally { setBusy(false); }
  };

  const copySummary = async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { onToast?.('Trình duyệt không cho phép sao chép tự động.'); }
  };

  const handleAddNewProject = () => {
    const newTitle = `Dự án mới #${savedProjects.length + 1}`;
    setNotebookTitle(newTitle);
    setSources([]);
    setSummary('');
    setDocText('');
    setDocTitle(newTitle);
    setNotebookMessages([]);
    setStudioOutput(null);
    setStudioActiveProduct(null);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAudioOverviewPlaying(false);
    setSavedProjects(prev => [
      ...prev,
      {
        id: `proj-${Date.now()}`,
        title: newTitle,
        sourcesCount: 0,
        summary: '',
        createdAt: 'Vừa tạo'
      }
    ]);
    onToast?.(`Đã tạo dự án mới: "${newTitle}"`);
  };

  const handleSelectProject = (proj: typeof savedProjects[0]) => {
    setNotebookTitle(proj.title);
    setDocTitle(proj.title);
    setSummary(proj.summary || '');
    setShowProjectsModal(false);
    onToast?.(`Đã mở dự án "${proj.title}"`);
  };

  const handleAddSourceSubmit = () => {
    if (addSourceTab === 'text') {
      if (!sourceTextInput.trim()) {
        onToast?.('Vui lòng nhập nội dung bản chép lời hoặc ghi chú.');
        return;
      }
      const title = sourceNameInput.trim() || `Tài liệu #${sources.length + 1}`;
      setSources(prev => [
        ...prev,
        {
          id: `src-${Date.now()}`,
          name: title,
          type: 'text',
          content: sourceTextInput,
          charCount: sourceTextInput.length
        }
      ]);
      setDocText(prev => prev ? `${prev}\n\n${sourceTextInput}` : sourceTextInput);
      setSourceTextInput('');
      setSourceNameInput('');
      setShowAddSourceModal(false);
      onToast?.(`Đã thêm nguồn "${title}"`);
    } else if (addSourceTab === 'youtube') {
      if (!youtubeUrlInput.trim()) {
        onToast?.('Vui lòng nhập đường dẫn YouTube hoặc bài giảng web.');
        return;
      }
      const title = sourceNameInput.trim() || `Video YouTube (${youtubeUrlInput.slice(0, 25)}...)`;
      const content = `[Nội dung phân tích từ liên kết]: ${youtubeUrlInput}\nĐã nạp đường dẫn bài giảng và kích hoạt trích xuất bản chép lời (transcript).`;
      setSources(prev => [
        ...prev,
        {
          id: `src-${Date.now()}`,
          name: title,
          type: 'youtube',
          content,
          charCount: content.length,
          url: youtubeUrlInput
        }
      ]);
      setDocText(prev => prev ? `${prev}\n\n${content}` : content);
      setYoutubeUrlInput('');
      setSourceNameInput('');
      setShowAddSourceModal(false);
      onToast?.(`Đã thêm nguồn liên kết: "${title}"`);
    }
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    onToast?.('Đã xóa nguồn.');
  };

  const handleNotebookSubmit = async (customPrompt?: string) => {
    const text = (customPrompt || notebookChatInput).trim();
    if (!text && sources.length === 0 && !docText.trim()) {
      onToast?.('Hãy nhập câu hỏi hoặc thêm nguồn tài liệu trước.');
      setShowAddSourceModal(true);
      return;
    }
    if (text) {
      setNotebookMessages(prev => [...prev, { role: 'user', content: text }]);
      setNotebookChatInput('');
    }
    await runSummary(text || undefined);
  };

  const handleAudioOverview = () => {
    const textToRead = summary || getCombinedSourceText();
    if (!textToRead.trim()) {
      onToast?.('Vui lòng thêm nguồn tài liệu hoặc tạo tóm tắt trước.');
      setShowAddSourceModal(true);
      return;
    }
    if ('speechSynthesis' in window) {
      if (isAudioOverviewPlaying) {
        window.speechSynthesis.cancel();
        setIsAudioOverviewPlaying(false);
        onToast?.('Đã dừng phát Audio Overview.');
      } else {
        window.speechSynthesis.cancel();
        const snippet = textToRead.slice(0, 1500);
        const utterance = new SpeechSynthesisUtterance(snippet);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.onend = () => setIsAudioOverviewPlaying(false);
        utterance.onerror = () => setIsAudioOverviewPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsAudioOverviewPlaying(true);
        setStudioActiveProduct('audio');
        setStudioOutput({
          type: 'audio',
          title: '🎧 Audio Overview (Bản tóm tắt bằng giọng đọc AI)',
          content: `Đang phát bản đọc tổng quan bằng giọng nói AI cho bài: "${notebookTitle}".\n\nNội dung đọc:\n${snippet.slice(0, 400)}...`
        });
        onToast?.('Đang phát Audio Overview bằng giọng nói AI...');
      }
    } else {
      onToast?.('Trình duyệt không hỗ trợ SpeechSynthesis.');
    }
  };

  const handleSlideDeck = () => {
    const content = summary || getCombinedSourceText();
    if (!content.trim()) {
      onToast?.('Vui lòng thêm nguồn tài liệu hoặc tạo tóm tắt trước.');
      setShowAddSourceModal(true);
      return;
    }
    setStudioActiveProduct('slide');
    setStudioOutput({
      type: 'slide',
      title: '📺 Slide Deck (Dàn ý trình chiếu)',
      content: `### Slide 1: ${notebookTitle}\n- Giới thiệu tổng quan bài học & mục tiêu kiến thức trọng tâm.\n\n### Slide 2: Kiến Thức Trọng Tâm\n- Các định nghĩa, định lý và nguyên lý cốt lõi cần ghi nhớ.\n\n### Slide 3: Công Thức & Phương Pháp Giải\n- Các bước giải tiêu biểu và ví dụ mẫu minh họa từng bước.\n\n### Slide 4: Bẫy Thường Gặp & Lưu Ý\n- Điểm dễ nhầm lẫn trong đề thi và bí quyết ghi điểm tuyệt đối.\n\n### Slide 5: Tổng Kết & Kế Hoạch Ôn Tập\n- Checklist kiểm tra kiến thức trước kỳ thi.`
    });
    onToast?.('Đã tạo Slide Deck từ tài liệu!');
  };

  const handleVideoOverview = () => {
    const content = summary || getCombinedSourceText();
    if (!content.trim()) {
      onToast?.('Vui lòng thêm nguồn tài liệu trước.');
      setShowAddSourceModal(true);
      return;
    }
    setStudioActiveProduct('video');
    setStudioOutput({
      type: 'video',
      title: '🎥 Video Overview (Mốc thời gian & Phân cảnh)',
      content: `**Kế hoạch phân cảnh video & Mốc thời gian (Timestamps):**\n\n- **00:00 - 02:30**: Đặt vấn đề và giới thiệu mục tiêu bài học\n- **02:30 - 08:45**: Giải thích chi tiết lý thuyết và công thức trọng tâm\n- **08:45 - 15:20**: Bài tập mẫu có lời giải chi tiết từng bước\n- **15:20 - 18:00**: Tổng kết, lưu ý các lỗi sai và bài tập tự luyện`
    });
    onToast?.('Đã tạo Video Overview!');
  };

  const handleMindMap = () => {
    const content = summary || getCombinedSourceText();
    if (!content.trim()) {
      onToast?.('Vui lòng thêm nguồn tài liệu trước.');
      setShowAddSourceModal(true);
      return;
    }
    setStudioActiveProduct('mindmap');
    setStudioOutput({
      type: 'mindmap',
      title: '🔀 Mind Map (Sơ đồ tư duy)',
      content: `**Sơ đồ tư duy chủ đề: ${notebookTitle}**\n\n- 🌳 **Gốc:** ${notebookTitle}\n  - 🌿 **Nhánh 1: Khái niệm & Cơ sở lý thuyết**\n    - Định nghĩa cốt lõi\n    - Phạm vi áp dụng & Điều kiện xác định\n  - 🌿 **Nhánh 2: Công thức & Thuật toán**\n    - Công thức thuận & biến đổi tương đương\n    - Quy tắc giải nhanh\n  - 🌿 **Nhánh 3: Dạng bài tập kinh điển**\n    - Dạng 1: Nhận biết & Thông hiểu\n    - Dạng 2: Vận dụng & Vận dụng cao\n  - 🌿 **Nhánh 4: Kỹ thuật kiểm tra kết quả**\n    - Thay số thử đáp án\n    - Ước lượng giới hạn`
    });
    onToast?.('Đã tạo Mind Map sơ đồ tư duy!');
  };

  const handleInfographic = () => {
    const content = summary || getCombinedSourceText();
    if (!content.trim()) {
      onToast?.('Vui lòng thêm nguồn tài liệu trước.');
      setShowAddSourceModal(true);
      return;
    }
    setStudioActiveProduct('infographic');
    setStudioOutput({
      type: 'infographic',
      title: '✨ Infographic Tổng Hợp Nhanh',
      content: `📊 **3 Chỉ số ghi nhớ nhanh:**\n- 💡 1 Khái niệm then chốt\n- ⚡ 3 Công thức bắt buộc nhớ\n- 🎯 5 Dạng bẫy đề thi hay gặp\n\n📌 **Bí kíp thực chiến:**\n1. Luôn kiểm tra điều kiện xác định trước khi tính toán.\n2. Rút gọn biểu thức trước khi thế số.\n3. Đọc kỹ yêu cầu đề bài (hỏi "đúng" hay "không đúng").`
    });
    onToast?.('Đã tạo Infographic!');
  };

  const handleDataTable = () => {
    const content = summary || getCombinedSourceText();
    if (!content.trim()) {
      onToast?.('Vui lòng thêm nguồn tài liệu trước.');
      setShowAddSourceModal(true);
      return;
    }
    setStudioActiveProduct('datatable');
    setStudioOutput({
      type: 'datatable',
      title: '▦ Data Table (Bảng so sánh kiến thức)',
      content: `| Tiêu chí | Dạng cơ bản | Dạng nâng cao |\n| :--- | :--- | :--- |\n| **Độ khó** | Mức 1 - 2 (THPT) | Mức 3 - 4 (Vận dụng cao) |\n| **Phương pháp** | Áp dụng công thức trực tiếp | Đổi biến, đạo hàm, đánh giá bđt |\n| **Thời gian giải** | 1 - 2 phút | 4 - 6 phút |\n| **Tỉ lệ ra thi** | 70% | 30% |`
    });
    onToast?.('Đã tạo bảng Data Table!');
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    setNotes(prev => [...prev, newNoteInput.trim()]);
    setNewNoteInput('');
    setShowAddNoteModal(false);
    onToast?.('Đã lưu ghi chú vào sổ tay!');
  };



  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER (LUXURY NAVY & AMBIENT NEON GLOW) */}
      <div className="rounded-[28px] p-6 sm:p-7 text-white bg-gradient-to-r from-[#070e1b] via-[#0c172a] to-[#091122] border border-cyan-500/25 shadow-[0_20px_50px_rgba(2,6,23,0.85)] relative overflow-hidden">
        {/* Subtle decorative neon glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1527] border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> AI STUDY & MENTAL WELLNESS SUITE
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Trung Tâm Trợ Lý AI Học Tập & Bạn Đồng Hành
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
              Tối ưu hiệu suất ghi nhớ, tóm tắt video bài giảng, tự tạo trắc nghiệm thông minh, lập lộ trình học chuẩn và là góc dịu êm giải tỏa áp lực học đường.
            </p>
          </div>

          {/* Right Mood Widget Box */}
          <div className="flex flex-col gap-2 rounded-2xl border border-cyan-500/20 bg-[#080f1d]/85 backdrop-blur-md p-4 min-w-[280px] sm:min-w-[320px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black tracking-wider text-cyan-300/90 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                HÔM NAY TÂM TRẠNG BẠN THẾ NÀO?
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              <button
                onClick={() => handleMoodSelect('happy')}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 border ${
                  currentMood === 'happy'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-[#06241a]/80 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/60 hover:bg-[#073022]'
                }`}
              >
                <span>😊</span>
                <span>Tươi vui</span>
              </button>

              <button
                onClick={() => handleMoodSelect('stable')}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 border ${
                  currentMood === 'stable'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : 'bg-[#0a1f38]/80 border-cyan-500/30 text-cyan-300 hover:border-cyan-400/60 hover:bg-[#0e2a4a]'
                }`}
              >
                <span>😐</span>
                <span>Ổn định</span>
              </button>

              <button
                onClick={() => handleMoodSelect('stressed')}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 border ${
                  currentMood === 'stressed'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                    : 'bg-[#2a0e16]/80 border-rose-500/30 text-rose-300 hover:border-rose-400/60 hover:bg-[#3a131f]'
                }`}
              >
                <span>😣</span>
                <span>Căng thẳng</span>
              </button>

              <button
                onClick={() => handleMoodSelect('exhausted')}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 border ${
                  currentMood === 'exhausted'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-[#2b1808]/80 border-amber-500/30 text-amber-300 hover:border-amber-400/60 hover:bg-[#3d220b]'
                }`}
              >
                <span>😫</span>
                <span>Kiệt sức</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION BAR (LUXURY NAVY DOCK WITH SUBTLE NEON FOCUS) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-cyan-500/20 bg-white/95 dark:bg-[#080f1d]/90 backdrop-blur-xl p-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shadow-lg dark:shadow-[0_12px_36px_rgba(2,6,23,0.7)]">
        {/* Tab 1: Tâm lí học đường */}
        <button
          onClick={() => setMode('mental')}
          className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300 cursor-pointer ${
            mode === 'mental'
              ? 'bg-gradient-to-r from-[#0d1e3d] via-[#1e3260] to-[#1e40af] text-white shadow-lg shadow-blue-950/50 border border-cyan-400/40 ring-1 ring-cyan-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0e1a30] hover:text-cyan-400'
          }`}
        >
          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
            mode === 'mental' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-100 dark:bg-[#13223f] text-slate-400'
          }`}>
            🧘
          </span>
          <span>Tâm lí học đường</span>
        </button>

        {/* Tab 2: AI Gia sư */}
        <button
          onClick={() => setMode('mental2')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300 cursor-pointer ${
            mode === 'mental2'
              ? 'bg-gradient-to-r from-[#201035] via-[#4c1d95] to-[#7c3aed] text-white shadow-lg shadow-purple-950/50 border border-purple-400/40 ring-1 ring-purple-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0e1a30] hover:text-purple-400'
          }`}
        >
          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
            mode === 'mental2' ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-100 dark:bg-[#13223f] text-slate-400'
          }`}>
            🎓
          </span>
          <span>AI Gia sư</span>
        </button>

        {/* Tab 3: Tóm Tắt Video */}
        <button
          onClick={() => setMode('summary')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300 cursor-pointer ${
            mode === 'summary'
              ? 'bg-gradient-to-r from-[#1c152a] via-[#78350f] to-[#b45309] text-white shadow-lg shadow-amber-950/50 border border-amber-400/40 ring-1 ring-amber-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0e1a30] hover:text-amber-400'
          }`}
        >
          <span className={`w-5 h-5 rounded-md flex items-center justify-center ${mode === 'summary' ? 'bg-amber-400/30 text-amber-200' : 'text-amber-500'}`}>
            <Video className="w-3.5 h-3.5" />
          </span>
          <span>Tóm Tắt Video</span>
        </button>

        {/* Tab 4: Tạo Trắc Nghiệm */}
        <button
          onClick={() => setMode('quiz')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300 cursor-pointer ${
            mode === 'quiz'
              ? 'bg-gradient-to-r from-[#0a182c] via-[#1e3a8a] to-[#2563eb] text-white shadow-lg shadow-blue-950/50 border border-cyan-400/40 ring-1 ring-cyan-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0e1a30] hover:text-blue-400'
          }`}
        >
          <span className={`w-5 h-5 rounded-md flex items-center justify-center ${mode === 'quiz' ? 'bg-cyan-400/30 text-cyan-200' : 'text-blue-500'}`}>
            <Zap className="w-3.5 h-3.5 fill-current" />
          </span>
          <span>Tạo Trắc Nghiệm</span>
        </button>

        {/* Tab 5: Lập Lịch Calendar */}
        <button
          onClick={() => setMode('calendar')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-300 cursor-pointer ${
            mode === 'calendar'
              ? 'bg-gradient-to-r from-[#1d102c] via-[#701a75] to-[#a21caf] text-white shadow-lg shadow-fuchsia-950/50 border border-fuchsia-400/40 ring-1 ring-fuchsia-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0e1a30] hover:text-fuchsia-400'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
            mode === 'calendar' ? 'bg-fuchsia-400/30 text-fuchsia-200' : 'text-fuchsia-400'
          }`}>
            <CalendarPlus className="w-3.5 h-3.5" />
          </span>
          <span>Lập Lịch Calendar</span>
        </button>
      </div>

      {/* 3. MAIN CONTENT: TÂM LÝ HỌC ĐƯỜNG 1 & 2 */}
      {(mode === 'mental' || mode === 'mental2') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: CHAT INTERFACE (~65% width) - LUXURY NAVY & AMBIENT NEON GLOW */}
          <section className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-slate-200/90 dark:border-cyan-500/20 bg-white/95 dark:bg-gradient-to-b dark:from-[#0d1627] dark:via-[#0a1120] dark:to-[#070c18] p-5 sm:p-6 shadow-xl dark:shadow-[0_20px_50px_rgba(2,6,23,0.85)] space-y-4 relative overflow-hidden backdrop-blur-xl">
            {/* Ambient decorative glowing neon orbs */}
            <div className={`absolute -top-28 -right-28 w-80 h-80 ${mode === 'mental2' ? 'bg-purple-500/10 dark:bg-purple-500/15' : 'bg-cyan-500/10 dark:bg-cyan-500/15'} rounded-full blur-3xl pointer-events-none`} />
            <div className={`absolute -bottom-28 -left-28 w-80 h-80 ${mode === 'mental2' ? 'bg-indigo-600/10 dark:bg-indigo-600/15' : 'bg-blue-600/10 dark:bg-blue-600/15'} rounded-full blur-3xl pointer-events-none`} />

            {/* Top Chat Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-cyan-500/15 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${mode === 'mental2' ? 'bg-gradient-to-br from-purple-500 via-indigo-600 to-pink-600 ring-purple-300/40 shadow-purple-500/25' : 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 ring-cyan-300/40 shadow-cyan-500/25'} text-white flex items-center justify-center shadow-lg shrink-0 text-xl ring-1`}>
                  {mode === 'mental2' ? '🌸' : '🧘'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{mode === 'mental2' ? 'AI Gia sư – Trợ Lý Học Tập & Sẻ Chia' : 'Tâm lí học đường – AI School Counselor'}</span>
                    </h2>
                    <span className={`w-2.5 h-2.5 rounded-full ${mode === 'mental2' ? 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.9)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]'} inline-block animate-pulse`} title="Trực tuyến" />
                  </div>
                  {mode !== 'mental2' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Không gian lắng nghe thấu cảm, thích ứng theo từng hoàn cảnh
                    </p>
                  )}
                  {mode !== 'mental2' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30 text-[10px] font-bold mt-1.5 shadow-xs">
                      <Shield className="w-3 h-3" /> Mã hóa E2EE • Lắng nghe không phán xét
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Habit Profile & Refresh */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {mode !== 'mental2' && (
                  <button
                    onClick={() => setShowHabitProfileModal(true)}
                    className="px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-50/70 dark:bg-[#0c1f36] text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all active:scale-95"
                  >
                    <span>📜</span>
                    <span>Hồ sơ Thói quen AI (15)</span>
                  </button>
                )}

                <button
                  onClick={handleResetChat}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0e192c] text-slate-700 dark:text-slate-300 hover:text-cyan-400 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-[#13223c] transition-all active:scale-95"
                  title="Xoá làm mới đoạn trò chuyện"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Options Bar: Văn phong & Ngôn ngữ */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs py-1 relative z-10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>⚙️</span> Văn phong:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070e1b] p-0.5 rounded-full border border-slate-200/80 dark:border-cyan-500/20">
                  <button
                    onClick={() => setTone('intimate')}
                    className={`px-3 py-1 rounded-full font-bold transition-all text-xs flex items-center gap-1 cursor-pointer ${
                      tone === 'intimate'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-cyan-400'
                    }`}
                  >
                    <span>🌿</span> Thân mật
                  </button>
                  <button
                    onClick={() => setTone('casual')}
                    className={`px-3 py-1 rounded-full font-bold transition-all text-xs flex items-center gap-1 cursor-pointer ${
                      tone === 'casual'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-cyan-400'
                    }`}
                  >
                    <span>💬</span> Đời thường
                  </button>
                  <button
                    onClick={() => setTone('formal')}
                    className={`px-3 py-1 rounded-full font-bold transition-all text-xs flex items-center gap-1 cursor-pointer ${
                      tone === 'formal'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-cyan-400'
                    }`}
                  >
                    <span>🎓</span> Trang trọng
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Ngôn ngữ:</span>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="bg-slate-100 dark:bg-[#081223] border border-slate-200 dark:border-cyan-500/20 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-full px-3 py-1 outline-none pr-6 cursor-pointer hover:border-cyan-400/40 transition"
                  >
                    <option value="auto">🌐 Tự động phát hiện</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Suggestions Row (GỢI Ý CHỦ ĐỀ - LUXURY NAVY PILLS) */}
            {mode !== 'mental2' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar relative z-10">
                <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> GỢI Ý CHỦ ĐỀ:
                </span>
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(s.text);
                      sendChat(s.text);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0d192e] hover:bg-cyan-50 dark:hover:bg-[#132646] text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-cyan-500/20 text-xs font-semibold whitespace-nowrap transition-all duration-200 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] active:scale-95 shrink-0 cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Messages Area - FROSTED DEPTH SHADOWS & NEON ACCENTS */}
            <div className="h-[380px] sm:h-[420px] overflow-y-auto rounded-2xl bg-slate-50/80 dark:bg-[#060b15]/90 p-4 sm:p-5 space-y-4 border border-slate-100 dark:border-cyan-500/15 custom-scrollbar shadow-inner relative z-10">
              {messages[mode as 'mental' | 'mental2'].map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 items-start`}>
                  {m.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-full ${mode === 'mental2' ? 'bg-gradient-to-tr from-purple-500 to-indigo-600' : 'bg-gradient-to-tr from-cyan-500 to-indigo-600'} text-white flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50 font-bold text-sm`}>
                      {mode === 'mental2' ? '🌸' : '🌱'}
                    </div>
                  )}

                  <div className="max-w-[88%] sm:max-w-[80%] space-y-1.5">
                    <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? mode === 'mental2'
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 text-white rounded-tr-xs shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/30 whitespace-pre-wrap'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-lg shadow-indigo-950/40 ring-1 ring-cyan-400/30 whitespace-pre-wrap'
                        : 'bg-white dark:bg-gradient-to-br dark:from-[#0d172a] dark:to-[#091120] border border-slate-200/90 dark:border-cyan-500/20 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-md dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] prose dark:prose-invert max-w-none'
                    }`}>
                      {m.role === 'user' ? (
                        m.content
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {m.content}
                        </ReactMarkdown>
                      )}
                    </div>

                    {/* Assistant Message Actions: Timestamp, Thumbs, Copy with Micro-animations */}
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400 dark:text-slate-400">
                        <span>{m.timestamp || 'Vừa xong'}</span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => handleReaction(i, true)}
                            className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-cyan-950/60 transition active:scale-90 ${
                              m.liked === true ? 'text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 hover:text-cyan-400'
                            }`}
                            title="Hữu ích"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReaction(i, false)}
                            className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-rose-950/60 transition active:scale-90 ${
                              m.liked === false ? 'text-rose-400 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-400 hover:text-rose-400'
                            }`}
                            title="Chưa hài lòng"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyMessage(i, m.content)}
                            className="flex items-center gap-1 p-1 hover:text-cyan-400 dark:hover:text-cyan-300 transition active:scale-95"
                            title="Sao chép câu trả lời"
                          >
                            {copiedId === i ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className={copiedId === i ? 'text-cyan-400 font-bold' : ''}>
                              {copiedId === i ? 'Đã sao chép' : 'Sao chép'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2.5 text-xs text-cyan-600 dark:text-cyan-400 font-semibold p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Bạn đồng hành đang lắng nghe và suy ngẫm giải pháp...</span>
                </div>
              )}
            </div>

            {/* Bottom Safety Disclaimer */}
            <div className="flex items-start gap-2 rounded-xl bg-amber-50/80 dark:bg-[#1a1208] p-2.5 text-xs text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-500/30 relative z-10 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                AI đóng vai trò người bạn lắng nghe và định hướng cảm xúc học đường. Nếu bạn cảm thấy kiệt sức hoặc không an toàn, hãy chia sẻ trực tiếp với cha mẹ, thầy cô hoặc chuyên viên tâm lý tại trường nhé.
              </span>
            </div>

            {/* Bottom Input Area - FLOATING GLASS DOCK WITH NEON FOCUS */}
            <div className="flex items-center gap-2 pt-1 relative z-10">
              <button
                onClick={() => setInput('')}
                className="w-11 h-11 rounded-2xl border border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-[#0c1626] hover:bg-slate-100 dark:hover:bg-[#12233c] text-slate-500 hover:text-cyan-400 flex items-center justify-center transition active:scale-95 shrink-0"
                title="Xóa nội dung nhập"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                placeholder="Chia sẻ khúc mắc, nỗi lòng hay bất cứ điều gì bạn đang cảm thấy... Mình luôn ở đây để lắng nghe."
                className="flex-1 rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#060b14] px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 text-slate-800 dark:text-slate-100 shadow-inner transition-all"
              />

              <button
                onClick={() => sendChat()}
                disabled={busy || !input.trim()}
                className={`px-5 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer ${
                  mode === 'mental2'
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-600 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/30'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/30'
                }`}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi tâm sự</span>
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN: 3 RELAXATION & WELLNESS WIDGETS (~35% width) */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* WIDGET 1: KỸ THUẬT THỞ ĐIỀU HÒA 4-7-8 */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0e1e38] text-cyan-400 flex items-center justify-center font-bold">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight">
                      KỸ THUẬT THỞ ĐIỀU HÒA 4-7-8
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Giảm nhịp tim, tan biến căng thẳng chỉ sau 2 phút
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition"
                    title={soundEnabled ? 'Tắt tiếng chuông thở' : 'Bật tiếng chuông thở'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-500" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setIsBreathing(!isBreathing)}
                    className="w-9 h-9 rounded-full bg-[#0e1e38] hover:bg-slate-800 text-white flex items-center justify-center transition active:scale-90 shadow-md"
                    title={isBreathing ? 'Tạm dừng thở' : 'Bắt đầu bài tập thở'}
                  >
                    {isBreathing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>

              {/* Interactive Breathing Circle */}
              <div className="py-3 flex flex-col items-center justify-center">
                <div
                  onClick={() => setIsBreathing(!isBreathing)}
                  className={`w-40 h-40 rounded-full flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all duration-700 relative ${
                    isBreathing
                      ? breathPhase === 'inhale'
                        ? 'scale-115 border-4 border-cyan-400 bg-cyan-50/60 dark:bg-cyan-950/40 shadow-[0_0_25px_rgba(34,211,238,0.45)]'
                        : breathPhase === 'hold'
                        ? 'scale-110 border-4 border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-[0_0_25px_rgba(129,140,248,0.45)]'
                        : 'scale-90 border-4 border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                      : 'border-4 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-sans">
                    {isBreathing ? breathCount : '4-7-8'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                    {isBreathing
                      ? breathPhase === 'inhale'
                        ? 'HÍT MŨI SÂU...'
                        : breathPhase === 'hold'
                        ? 'GIỮ HƠI THỞ...'
                        : 'THỞ TỪ TỪ RA...'
                      : '▶ BẤM NÚT ĐỂ THỞ'}
                  </span>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className={`p-1.5 rounded-xl transition ${breathPhase === 'inhale' ? 'bg-cyan-50 dark:bg-cyan-950/30' : ''}`}>
                  <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-0.5">
                    <ArrowUp className="w-3 h-3 stroke-[3]" /> 1. Hít mũi (4s)
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Nạp đầy oxy</p>
                </div>

                <div className={`p-1.5 rounded-xl transition ${breathPhase === 'hold' ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}>
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> 2. Giữ hơi (7s)
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Tĩnh tâm sâu</p>
                </div>

                <div className={`p-1.5 rounded-xl transition ${breathPhase === 'exhale' ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}`}>
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                    <ArrowDown className="w-3 h-3 stroke-[3]" /> 3. Thở miệng (8s)
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Xả căng thẳng</p>
                </div>
              </div>
            </div>

            {/* WIDGET 2: ÂM THANH THƯ GIÃN & TẬP TRUNG */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-tight">
                    ÂM THANH THƯ GIÃN & TẬP TRUNG
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Web Audio tổng hợp tự nhiên, giúp định tâm
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => toggleSound('rain')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                    activeSound === 'rain'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/40'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">🌧️</span>
                  <div className="min-w-0">
                    <p className="truncate">Mưa rơi nhẹ</p>
                    <span className="text-[9px] font-normal text-slate-400 block">{activeSound === 'rain' ? '● Đang phát' : 'Nhấp để bật'}</span>
                  </div>
                </button>

                <button
                  onClick={() => toggleSound('ocean')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                    activeSound === 'ocean'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-400/40'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">🌊</span>
                  <div className="min-w-0">
                    <p className="truncate">Sóng biển dạt dào</p>
                    <span className="text-[9px] font-normal text-slate-400 block">{activeSound === 'ocean' ? '● Đang phát' : 'Nhấp để bật'}</span>
                  </div>
                </button>

                <button
                  onClick={() => toggleSound('cafe')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                    activeSound === 'cafe'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/40'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">☕</span>
                  <div className="min-w-0">
                    <p className="truncate">Quán cà phê ấm</p>
                    <span className="text-[9px] font-normal text-slate-400 block">{activeSound === 'cafe' ? '● Đang phát' : 'Nhấp để bật'}</span>
                  </div>
                </button>

                <button
                  onClick={() => toggleSound('white-noise')}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                    activeSound === 'white-noise'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-400/40'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">📻</span>
                  <div className="min-w-0">
                    <p className="truncate">Tiếng ồn trắng</p>
                    <span className="text-[9px] font-normal text-slate-400 block">{activeSound === 'white-noise' ? '● Đang phát' : 'Nhấp để bật'}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* WIDGET 3: LỜI NHẮC NHỞ TÍCH CỰC HÔM NAY */}
            <div className="rounded-3xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/20 p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-black text-xs uppercase tracking-wider">
                  <Smile className="w-4 h-4 text-amber-600" />
                  <span>LỜI NHẮC NHỞ TÍCH CỰC HÔM NAY</span>
                </div>
                <button
                  onClick={() => setQuoteIndex((prev) => (prev + 1) % POSITIVE_AFFIRMATIONS.length)}
                  className="p-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                  title="Xem câu nhắc nhở khác"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm font-medium italic text-slate-700 dark:text-slate-300 leading-relaxed">
                "{POSITIVE_AFFIRMATIONS[quoteIndex]}"
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* 5. TÓM TẮT VIDEO & BÀI GIẢNG (MODE: summary) - NOTEBOOKLM STUDIO DESIGN */}
      {mode === 'summary' && (
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
          {/* Top Bar: Play Icon, Editable Title, Project Buttons (Matching image_75d1d318.png / image_fc97fe93.png) */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
              <input
                type="text"
                value={notebookTitle}
                onChange={(e) => {
                  setNotebookTitle(e.target.value);
                  setDocTitle(e.target.value);
                }}
                placeholder="Untitled notebook"
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 rounded-xl px-2.5 py-1 outline-none transition w-52 sm:w-80"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAddNewProject}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Thêm dự án</span>
              </button>

              <button
                onClick={() => setShowProjectsModal(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95"
              >
                <Folder className="w-4 h-4 text-slate-500" />
                <span>Dự án đã tạo ({savedProjects.length})</span>
              </button>
            </div>
          </div>

          {/* 3-Column NotebookLM Grid Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 min-h-[640px]">
            {/* COLUMN 1: SOURCES (25% on desktop) */}
            <div className="lg:col-span-3 p-4 flex flex-col justify-between space-y-4 bg-slate-50/40 dark:bg-slate-900/40">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                      SOURCES
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black">
                      {sources.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onToast?.('Hiển thị đầy đủ danh sách nguồn tài liệu.')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    title="Thu gọn / Mở rộng"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>

                {/* + Add sources Button */}
                <button
                  onClick={() => setShowAddSourceModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-200/80 dark:border-blue-800/60 transition active:scale-98 shadow-2xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add sources</span>
                </button>

                {/* Web Search Input Bar */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 flex items-center gap-2 shadow-2xs">
                  <span className="text-xs text-slate-500 flex items-center gap-0.5 shrink-0">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px]">▾</span>
                  </span>
                  <input
                    type="text"
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && webSearchQuery.trim()) {
                        setSources(prev => [
                          ...prev,
                          {
                            id: `web-${Date.now()}`,
                            name: webSearchQuery.trim(),
                            type: 'web',
                            content: `Nguồn tìm kiếm web: "${webSearchQuery.trim()}". Hệ thống AI hỗ trợ đối chiếu thông tin và tóm tắt kiến thức chuẩn xác.`,
                            charCount: 220
                          }
                        ]);
                        onToast?.(`Đã thêm nguồn: "${webSearchQuery}"`);
                        setWebSearchQuery('');
                      }
                    }}
                    placeholder="Search the web for new sources"
                    className="flex-1 text-xs bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => {
                      if (!webSearchQuery.trim()) return;
                      setSources(prev => [
                        ...prev,
                        {
                          id: `web-${Date.now()}`,
                          name: webSearchQuery.trim(),
                          type: 'web',
                          content: `Nguồn tìm kiếm web: "${webSearchQuery.trim()}". Hệ thống AI hỗ trợ đối chiếu thông tin và tóm tắt kiến thức chuẩn xác.`,
                          charCount: 220
                        }
                      ]);
                      onToast?.(`Đã thêm nguồn: "${webSearchQuery}"`);
                      setWebSearchQuery('');
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sources List or Empty State */}
                {sources.length === 0 ? (
                  <div className="pt-10 pb-6 flex flex-col items-center justify-center text-center space-y-3 px-2">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Saved sources will appear here
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Add files, websites, or more. Then ask questions or create things based on these sources.
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2">
                      Drop files here or{' '}
                      <button
                        onClick={() => setShowAddSourceModal(true)}
                        className="text-blue-600 dark:text-blue-400 font-bold underline hover:opacity-80"
                      >
                        add a source
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                    {sources.map((src) => (
                      <div
                        key={src.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start justify-between gap-2 shadow-2xs group hover:border-blue-400 transition"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {src.type === 'youtube' ? '🎥' : src.type === 'file' ? '📄' : '🌐'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {src.name}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {src.charCount ? `${src.charCount} ký tự` : 'Tài liệu học tập'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSource(src.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition shrink-0"
                          title="Xóa nguồn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick source actions */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Hỗ trợ TXT, MD, CSV, YouTube</span>
                <label className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
                  Tải tệp
                  <input
                    type="file"
                    accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
                    className="hidden"
                    onChange={(e) => readFile(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* COLUMN 2: NOTEBOOK CANVAS / WORKSPACE (50% on desktop) */}
            <div className="lg:col-span-6 p-6 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900">
              {/* If no summary or messages, show the "Let's start your notebook..." Welcome Canvas */}
              {!summary && notebookMessages.length === 0 ? (
                <div className="space-y-6 my-auto max-w-xl">
                  <div>
                    <span className="text-4xl block mb-3">👋</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      Let's start your notebook...
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2.5">
                      This is your blank canvas to understand, create, or make progress on something new. I can help you get started or you can go ahead and add your own sources.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      What would you like this notebook to help you do?
                    </p>
                    <div className="flex flex-col gap-2.5 items-start">
                      <button
                        onClick={() => setShowAddSourceModal(true)}
                        className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition active:scale-98 shadow-2xs"
                      >
                        Learn about a new topic
                      </button>

                      <button
                        onClick={() => {
                          setNotebookChatInput('Lập lộ trình ôn tập và tóm tắt dàn ý kiến thức mới');
                          handleNotebookSubmit('Lập lộ trình ôn tập và tóm tắt dàn ý kiến thức mới');
                        }}
                        className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition active:scale-98 shadow-2xs"
                      >
                        Create something new
                      </button>

                      <button
                        onClick={() => {
                          if (sources.length > 0 || docText.trim()) {
                            runSummary();
                          } else {
                            setAddSourceTab('youtube');
                            setShowAddSourceModal(true);
                          }
                        }}
                        className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition active:scale-98 shadow-2xs"
                      >
                        Tóm tắt bài học & video YouTube
                      </button>

                      <button
                        onClick={() => {
                          if (sources.length > 0 || docText.trim()) {
                            runSummary(undefined, `${notebookTitle} - Công thức & Bẫy đề thi`);
                          } else {
                            setShowAddSourceModal(true);
                          }
                        }}
                        className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition active:scale-98 shadow-2xs"
                      >
                        Trích xuất công thức & bẫy đề thi
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Display Active Summary & Notes */
                <div className="space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {notebookTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {sources.length} nguồn tài liệu • Tóm tắt AI thông minh
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copySummary}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSummary('');
                          setNotebookMessages([]);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
                        title="Quay lại Canvas trống"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rendered Summary */}
                  {summary && (
                    <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {summary}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Notebook Chat History */}
                  {notebookMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {busy && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold p-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI đang trích xuất dữ liệu và tạo sản phẩm...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Ask a Question / Create Summary Bar */}
              <div className="pt-2">
                <div className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 flex items-center gap-2 shadow-xs">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={notebookChatInput}
                    onChange={(e) => setNotebookChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNotebookSubmit();
                    }}
                    placeholder="Ask a question or create summary..."
                    className="flex-1 bg-transparent text-xs sm:text-sm outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    {sources.length} sources
                  </span>
                  <button
                    onClick={() => handleNotebookSubmit()}
                    disabled={busy}
                    className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center hover:bg-slate-700 dark:hover:bg-white transition active:scale-90 disabled:opacity-40 shrink-0"
                    title="Gửi câu hỏi / Tạo tóm tắt"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMN 3: STUDIO (25% on desktop) */}
            <div className="lg:col-span-3 p-4 flex flex-col justify-between space-y-4 bg-slate-50/40 dark:bg-slate-900/40">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onToast?.('Hiển thị bảng sản phẩm Studio.')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    title="Thu gọn / Mở rộng"
                  >
                    <PanelRightClose className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                    STUDIO
                  </span>
                </div>

                <p className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  TẠO SẢN PHẨM TỪ NGUỒN:
                </p>

                {/* 8 Product Tiles Grid (2 columns) */}
                <div className="grid grid-cols-2 gap-2">
                  {/* 1. Audio Overview */}
                  <button
                    onClick={handleAudioOverview}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      studioActiveProduct === 'audio'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/40'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Headphones className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">Audio Overview</span>
                  </button>

                  {/* 2. Slide Deck */}
                  <button
                    onClick={handleSlideDeck}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      studioActiveProduct === 'slide'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/40'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Presentation className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">Slide Deck</span>
                  </button>

                  {/* 3. Video Overview */}
                  <button
                    onClick={handleVideoOverview}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      studioActiveProduct === 'video'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/40'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Video className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">Video Overview</span>
                  </button>

                  {/* 4. Mind Map */}
                  <button
                    onClick={handleMindMap}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      studioActiveProduct === 'mindmap'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400/40'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Network className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="truncate">Mind Map</span>
                  </button>

                  {/* 5. Flashcards with NEW! badge */}
                  <button
                    onClick={() => {
                      if (!sources.length && !docText.trim()) {
                        onToast?.('Vui lòng thêm nguồn tài liệu để tạo Flashcard.');
                        setShowAddSourceModal(true);
                        return;
                      }
                      runFlashcards();
                    }}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-left text-xs font-bold transition-all active:scale-95 flex items-center justify-between gap-1"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">Flashcards</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[9px] font-black shrink-0">
                      NEW!
                    </span>
                  </button>

                  {/* 6. Quiz */}
                  <button
                    onClick={() => {
                      if (!sources.length && !docText.trim()) {
                        onToast?.('Vui lòng thêm nguồn tài liệu để tạo Quiz.');
                        setShowAddSourceModal(true);
                        return;
                      }
                      setMode('quiz');
                      runQuiz();
                    }}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="truncate">Quiz</span>
                  </button>

                  {/* 7. Infographic */}
                  <button
                    onClick={handleInfographic}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      studioActiveProduct === 'infographic'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/40'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">Infographic</span>
                  </button>

                  {/* 8. Data Table */}
                  <button
                    onClick={handleDataTable}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                      studioActiveProduct === 'datatable'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/40'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <Table className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">Data Table</span>
                  </button>
                </div>

                {/* Studio Output Placeholder or Result */}
                {studioOutput ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {studioOutput.title}
                      </h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(studioOutput.content);
                          onToast?.('Đã sao chép sản phẩm Studio!');
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline shrink-0"
                      >
                        Sao chép
                      </button>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                      {studioOutput.content}
                    </div>
                  </div>
                ) : (
                  <div className="pt-8 pb-4 flex flex-col items-center justify-center text-center space-y-2 px-2">
                    <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Studio output will be saved here.
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      After adding sources, click to add Audio Overview, Slide Deck, Mind Map, and more.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action: Add note */}
              <div>
                <button
                  onClick={() => setShowAddNoteModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Add note {notes.length > 0 && `(${notes.length})`}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. TẠO TRẮC NGHIỆM & FLASHCARD (MODE: quiz - REDESIGNED MATCHING image_d7c14f53.png) */}
      {mode === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Hidden File Input for quiz documents */}
          <input
            type="file"
            ref={quizFileInputRef}
            accept=".txt,.md,.csv,.pdf,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
            }}
            className="hidden"
          />

          {/* LEFT COLUMN: CẤU HÌNH & TẢI TÀI LIỆU (lg:col-span-5) */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            {/* Header: squircle Zap icon, title, subtitle */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Tạo Đề Trắc Nghiệm & Flashcard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Biến tài liệu học và ghi chú thành bài kiểm tra tương tác
                </p>
              </div>
            </div>

            {/* SỐ LƯỢNG CÂU HỎI */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                SỐ LƯỢNG CÂU HỎI
              </label>
              <div className="flex items-center gap-3">
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 flex items-center justify-between font-bold text-sm bg-white dark:bg-slate-950 w-36 shadow-2xs">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-16 bg-transparent outline-none font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-400 font-medium select-none">câu</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNumQuestions(20);
                    onToast?.('Đã chọn chế độ tối đa tất cả câu hỏi (20 câu)');
                  }}
                  className={`border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 font-bold text-xs sm:text-sm transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    numQuestions >= 20
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300'
                      : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>ALL (TẤT CẢ)</span>
                </button>
              </div>
            </div>

            {/* CHỌN CHẾ ĐỘ LUYỆN THI */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Chọn Chế Độ Luyện Thi
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Luyện Tập */}
                <div
                  onClick={() => setExamMode('practice')}
                  className={`rounded-2xl p-3.5 cursor-pointer transition-all ${
                    examMode === 'practice'
                      ? 'border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Luyện Tập</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Xem ngay đáp án & lời giải.
                  </p>
                </div>

                {/* Thi Thử */}
                <div
                  onClick={() => setExamMode('exam')}
                  className={`rounded-2xl p-3.5 cursor-pointer transition-all ${
                    examMode === 'exam'
                      ? 'border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Thi Thử</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Tính giờ, chấm điểm tổng quát.
                  </p>
                </div>
              </div>
            </div>

            {/* TẢI TÀI LIỆU */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-blue-500">☁</span>
                <span>Tải tài liệu (PDF, Word, Ảnh...)</span>
              </label>
              <div
                onClick={() => quizFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-blue-500 mb-1.5 transition">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Bấm để tải tệp lên
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                  Hỗ trợ TXT, MD, CSV (với PDF/Word, có thể sao chép & dán vào ô dưới)
                </p>
              </div>
            </div>

            {/* TEXTAREA GHI CHÚ */}
            <div className="space-y-2">
              <textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                rows={4}
                placeholder="Hoặc dán ghi chú học tập vào đây..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner resize-y placeholder:text-slate-400"
              />
            </div>

            {/* ACTION BUTTON: Bắt đầu Luyện tập / Thi thử */}
            <button
              onClick={runQuiz}
              disabled={busy || !docText.trim()}
              className="bg-[#009668] hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-98 w-full text-sm sm:text-base cursor-pointer disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI đang soạn đề thi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {examMode === 'practice' ? 'Bắt đầu Luyện tập' : 'Bắt đầu Thi thử'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: ARENA / STANDBY OR ACTIVE EXAM (lg:col-span-7) */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col justify-center min-h-[520px]">
            {quiz.length === 0 ? (
              /* STANDBY STATE (EXACTLY AS IN image_d7c14f53.png) */
              <div className="text-center py-6 sm:py-8 max-w-lg mx-auto">
                <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shadow-inner mx-auto mb-5">
                  <BrainCircuit className="w-12 h-12" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Hệ Thống Luyện Thi Thông Minh
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                  Tải tài liệu hoặc dán ghi chú ở cột bên trái để AI tự động soạn đề thi.
                  Sau khi chuẩn bị xong, bạn sẽ được chuyển sang giao diện thi cử chuyên nghiệp.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
                    <GraduationCap className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Luyện tập</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Giải đến đâu biết đáp án đến đó, có giải thích.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
                    <Timer className="w-5 h-5 text-amber-500 mb-2" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Thi thử</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Mô phỏng phòng thi, đếm ngược thời gian.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE QUIZ & EXAM RUNNER */
              <div className="space-y-5">
                {/* Header bar of quiz */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      examMode === 'practice'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {examMode === 'practice' ? '🎓 Chế độ Luyện tập' : '⏱ Chế độ Thi thử'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {quiz.length} câu hỏi
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {examMode === 'exam' && !quizSubmitted && (
                      <div className={`px-3 py-1 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5 ${
                        examTimeLeft <= 60
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}>
                        <Timer className="w-4 h-4 text-amber-500" />
                        <span>{formatExamTime(examTimeLeft)}</span>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setAnswers({});
                        setQuizSubmitted(false);
                        if (examMode === 'exam') setExamTimeLeft(numQuestions * 90);
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Làm lại
                    </button>

                    <button
                      onClick={() => {
                        setQuiz([]);
                        setAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                    >
                      Bộ câu hỏi mới
                    </button>
                  </div>
                </div>

                {/* Score Summary if submitted */}
                {quizSubmitted && (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          Kết quả: {quiz.filter((q, i) => answers[i] === q.correctOption).length}/{quiz.length} câu đúng ({Math.round((quiz.filter((q, i) => answers[i] === q.correctOption).length / quiz.length) * 100)}%)
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {Math.round((quiz.filter((q, i) => answers[i] === q.correctOption).length / quiz.length) * 100) >= 80
                            ? 'Xuất sắc! Bạn đã nắm rất vững kiến thức phần này 🌟'
                            : 'Cố gắng lên nhé! Hãy xem lại các câu giải thích chi tiết phía dưới 🍀'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={runFlashcards}
                      disabled={busy}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Lưu làm Flashcard</span>
                    </button>
                  </div>
                )}

                {/* Question List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {quiz.map((q, i) => {
                    const isAnswered = answers[i] !== undefined;
                    const isCorrect = answers[i] === q.correctOption;
                    const showFeedback = examMode === 'practice' ? isAnswered : quizSubmitted;

                    return (
                      <div
                        key={i}
                        className={`rounded-2xl border p-4 transition-all ${
                          showFeedback
                            ? isCorrect
                              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/10'
                              : 'border-rose-300 dark:border-rose-800 bg-rose-50/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 mb-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {q.questionText}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="grid gap-2">
                          {q.options.map((option: string, j: number) => {
                            const isSelected = answers[i] === j;
                            const isOptionCorrect = j === q.correctOption;

                            let optionClasses = 'bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100';

                            if (showFeedback) {
                              if (isOptionCorrect) {
                                optionClasses = 'bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                              } else if (isSelected && !isCorrect) {
                                optionClasses = 'bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 text-rose-900 dark:text-rose-200 font-bold';
                              } else {
                                optionClasses = 'opacity-60 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
                              }
                            } else if (isSelected) {
                              optionClasses = 'bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-600 text-blue-900 dark:text-blue-100 font-bold';
                            }

                            return (
                              <label
                                key={j}
                                onClick={() => {
                                  if (!quizSubmitted) {
                                    setAnswers(prev => ({ ...prev, [i]: j }));
                                  }
                                }}
                                className={`flex items-center gap-3 rounded-xl p-3 text-xs sm:text-sm cursor-pointer transition select-none ${optionClasses}`}
                              >
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {String.fromCharCode(65 + j)}
                                </span>
                                <span className="flex-1">
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {option}
                                  </ReactMarkdown>
                                </span>
                                {showFeedback && isOptionCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {showFeedback && isSelected && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Explanation & citation */}
                        {showFeedback && (
                          <div className="mt-3 text-xs p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              {isCorrect ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Chính xác
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Đáp án đúng là {String.fromCharCode(65 + q.correctOption)}
                                </span>
                              )}
                            </div>
                            {q.explanation && (
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {q.explanation}
                              </p>
                            )}
                            {q.sourceCitation && (
                              <p className="text-[11px] text-slate-400 italic">
                                Trích dẫn: {q.sourceCitation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action */}
                {!quizSubmitted && examMode === 'exam' && (
                  <button
                    onClick={() => {
                      setQuizSubmitted(true);
                      onToast?.('Đã nộp bài thi! Xem kết quả và đáp án chi tiết bên dưới.');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#009668] hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Nộp bài & Chấm điểm</span>
                  </button>
                )}

                {quizSubmitted && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setAnswers({});
                        setQuizSubmitted(false);
                        if (examMode === 'exam') setExamTimeLeft(numQuestions * 90);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                    >
                      Làm lại bài thi này
                    </button>

                    <button
                      onClick={runFlashcards}
                      disabled={busy}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Tạo Flashcard từ đề thi</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* 7. AI ARCHITECT CALENDAR (MODE: calendar - MATCHING image_1cc2ed8a.png / image_80249c25.png) */}
      {mode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI: AI ARCHITECT CHAT (lg:col-span-7 xl:col-span-8) */}
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between min-h-[580px] space-y-4">
            {/* Header: Avatar, title, subtitle & button Bắt đầu khảo sát */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      AI Architect Chat
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block"></span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                    KHẢO SÁT & LẬP KẾ HOẠCH CÁ NHÂN HÓA
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartProfessionalSurvey}
                className="border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-2xl px-3.5 py-1.5 font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:bg-purple-100 transition active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>🎯</span>
                <span>BẮT ĐẦU KHẢO SÁT CHUYÊN NGHIỆP</span>
              </button>
            </div>

            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[460px] custom-scrollbar">
              {calendarMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 text-xs">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[88%] sm:max-w-[82%] space-y-1">
                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                          : 'bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className={`text-[10px] text-slate-400 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp || 'Vừa xong'}
                    </div>
                  </div>
                </div>
              ))}

              {calendarBusy && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-purple-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Architect đang tính toán và xây dựng kế hoạch học tập...</span>
                  </div>
                </div>
              )}

              <div ref={calendarChatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCalendarMessage();
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1.5 pl-4 flex items-center gap-2 shadow-inner"
            >
              <input
                type="text"
                value={calendarInput}
                onChange={(e) => setCalendarInput(e.target.value)}
                placeholder="Trả lời khảo sát của AI Architect..."
                disabled={calendarBusy}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={calendarBusy || !calendarInput.trim()}
                className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: CÀI ĐẶT THỦ CÔNG & GỢI Ý HÀNH ĐỘNG (lg:col-span-5 xl:col-span-4) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* CARD 1: CÀI ĐẶT THỦ CÔNG (MANUAL) */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white pb-1">
                <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wide uppercase">
                  CÀI ĐẶT THỦ CÔNG (MANUAL)
                </h3>
              </div>

              {/* STUDY GOAL */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 bg-white dark:bg-slate-950 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    STUDY GOAL
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {calendarStudyGoal}h
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCalendarStudyGoal(prev => Math.max(10, prev - 5))}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition active:scale-90 select-none cursor-pointer"
                  >
                    -
                  </button>

                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={5}
                    value={calendarStudyGoal}
                    onChange={(e) => setCalendarStudyGoal(Number(e.target.value))}
                    className="flex-1 accent-purple-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setCalendarStudyGoal(prev => Math.min(200, prev + 5))}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition active:scale-90 select-none cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* BẮT ĐẦU & KẾT THÚC */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    BẮT ĐẦU
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={calendarStartDate}
                      onChange={(e) => setCalendarStartDate(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-medium bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    KẾT THÚC
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={calendarEndDate}
                      onChange={(e) => setCalendarEndDate(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-medium bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* MÔN HỌC ƯU TIÊN */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  MÔN HỌC ƯU TIÊN
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Toán', 'Vật Lý', 'Hóa Học', 'Ngữ Văn', 'Tiếng Anh', 'Sinh Học', 'Lịch Sử', 'Tin Học'].map((s) => {
                    const isSelected = calendarPrioritySubject === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCalendarPrioritySubject(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                          isSelected
                            ? 'bg-[#9333ea] text-white shadow-xs ring-1 ring-purple-300'
                            : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTON: LẬP KẾ HOẠCH TỪ CÀI ĐẶT NÀY */}
              <button
                type="button"
                onClick={handlePlanFromSettings}
                disabled={calendarBusy}
                className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm w-full shadow-md active:scale-98 transition cursor-pointer disabled:opacity-50 mt-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Lập kế hoạch từ cài đặt này</span>
              </button>
            </div>

            {/* CARD 2: GỢI Ý HÀNH ĐỘNG */}
            <div className="rounded-3xl p-5 bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2.5">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                <Zap className="w-4 h-4 fill-current text-purple-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  GỢI Ý HÀNH ĐỘNG
                </h4>
              </div>

              <p className="text-xs text-purple-900 dark:text-purple-200 leading-normal">
                Hãy yêu cầu AI Architect bằng câu lệnh:
              </p>

              <div
                onClick={() => {
                  const sampleText = "Lập kế hoạch học Toán và Lý trong 2 tuần tới, mình rảnh buổi tối.";
                  setCalendarInput(sampleText);
                  handleSendCalendarMessage(sampleText);
                }}
                className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-purple-200/80 dark:border-purple-800/50 text-xs italic text-purple-700 dark:text-purple-300 font-semibold cursor-pointer hover:bg-white hover:border-purple-300 transition active:scale-98 shadow-2xs"
              >
                "Lập kế hoạch học Toán và Lý trong 2 tuần tới, mình rảnh buổi tối."
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HỒ SƠ THÓI QUEN AI (15) */}
      {showHabitProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📜</span>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Hồ Sơ Thói Quen & Cảm Xúc AI</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng hợp 15 phiên lắng nghe & hỗ trợ</p>
                </div>
              </div>
              <button
                onClick={() => setShowHabitProfileModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Số phiên hỗ trợ</p>
                  <p className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-0.5">15 phiên</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Trạng thái chủ đạo</p>
                  <p className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">Ổn định & Nỗ lực</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Phân tích cảm xúc học đường:</p>
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Áp lực điểm số & kỳ vọng:</span>
                    <span className="font-bold text-rose-500">40%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[40%]" />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span>Mệt mỏi vì khối lượng bài tập:</span>
                    <span className="font-bold text-amber-500">35%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[35%]" />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span>Hưng phấn khi vượt mục tiêu:</span>
                    <span className="font-bold text-emerald-500">25%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[25%]" />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-900/40 text-[11px] text-violet-900 dark:text-violet-200 space-y-1">
                <p className="font-black flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Lời khuyên thói quen từ AI:</span>
                </p>
                <p className="leading-relaxed">
                  Bạn thường cảm thấy căng thẳng nhiều hơn vào các buổi tối ôn thi. Hãy dành 3 phút thở 4-7-8 trước khi bắt đầu bàn học để tâm trí tĩnh lại và tiếp thu bài nhanh gấp đôi!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHabitProfileModal(false)}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Đóng hồ sơ
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SOURCES (NotebookLM) */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Thêm nguồn tài liệu vào Notebook</h3>
                  <p className="text-[10px] text-slate-400">Hỗ trợ trích xuất bản chép lời video, tệp văn bản và liên kết</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                onClick={() => setAddSourceTab('text')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  addSourceTab === 'text' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                📝 Dán văn bản / Transcript
              </button>
              <button
                onClick={() => setAddSourceTab('file')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  addSourceTab === 'file' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                📁 Tải tệp
              </button>
              <button
                onClick={() => setAddSourceTab('youtube')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  addSourceTab === 'youtube' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                🎥 YouTube / Web
              </button>
            </div>

            {/* Tab 1 Content: Paste Text */}
            {addSourceTab === 'text' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={sourceNameInput}
                  onChange={(e) => setSourceNameInput(e.target.value)}
                  placeholder="Tiêu đề nguồn (ví dụ: Bản chép lời bài giảng Lịch Sử 12)..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={sourceTextInput}
                  onChange={(e) => setSourceTextInput(e.target.value)}
                  rows={6}
                  placeholder="Dán nội dung bài học, bản ghi âm hoặc bản chép lời video (transcript) tại đây..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>
            )}

            {/* Tab 2 Content: Upload File */}
            {addSourceTab === 'file' && (
              <div className="py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
                <FileText className="w-10 h-10 text-blue-500 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Kéo thả tệp hoặc bấm để chọn từ thiết bị
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hỗ trợ định dạng .TXT, .MD, .CSV
                  </p>
                </div>
                <label className="inline-flex px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition active:scale-95">
                  <span>Chọn tệp văn bản</span>
                  <input
                    type="file"
                    accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      readFile(e.target.files?.[0]);
                      setShowAddSourceModal(false);
                    }}
                  />
                </label>
              </div>
            )}

            {/* Tab 3 Content: YouTube / Web */}
            {addSourceTab === 'youtube' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={sourceNameInput}
                  onChange={(e) => setSourceNameInput(e.target.value)}
                  placeholder="Tên video hoặc chủ đề bài giảng..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... hoặc liên kết bài viết"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  AI sẽ tự động nhận diện liên kết và lập dàn ý bài học theo thời gian thực.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            {addSourceTab !== 'file' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowAddSourceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddSourceSubmit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  Xác nhận thêm nguồn
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: DỰ ÁN ĐÃ TẠO (NotebookLM Saved Projects) */}
      {showProjectsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Dự án Notebook đã tạo</h3>
                  <p className="text-[10px] text-slate-400">Quản lý và chuyển đổi nhanh giữa các cuốn sổ tay</p>
                </div>
              </div>
              <button
                onClick={() => setShowProjectsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {savedProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    notebookTitle === p.title
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {p.title}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {p.sourcesCount} nguồn • {p.createdAt}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 font-bold shrink-0">Mở</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowProjectsModal(false);
                handleAddNewProject();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo thêm dự án mới</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NOTE (NotebookLM Personal Notes) */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Thêm ghi chú cá nhân</h3>
              </div>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={newNoteInput}
              onChange={(e) => setNewNoteInput(e.target.value)}
              rows={4}
              placeholder="Ghi lại công thức cần chú ý, mốc thời gian hoặc bẫy đề thi vừa học được..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                Hủy
              </button>
              <button
                onClick={handleAddNote}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-400 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-indigo-500" />
        <span>Nội dung AI tạo ra được thiết kế để hỗ trợ học tập và cảm xúc. Vui lòng đối chiếu với sách giáo khoa và các nguồn chính thống.</span>
      </p>
    </div>
  );
};
