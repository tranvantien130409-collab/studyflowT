import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Flame, 
  Sparkles, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  Headphones, 
  Bell, 
  Hourglass, 
  Zap, 
  Calculator, 
  X,
  Trophy,
  CheckCircle2,
  Check,
  Smile,
  Coffee,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { DayFocusSession } from '../types';
import { formatDate, pad } from '../data/initialData';
import { playAlarmSound } from '../utils/audio';
import { lofiEngine } from '../utils/lofiAudioEngine';

interface FocusViewProps {
  sessions: DayFocusSession;
  onUpdateSessions: (newSessions: DayFocusSession) => void;
}

interface SessionLogItem {
  id: string;
  name: string;
  subject: string;
  subjectIcon: string;
  subjectColor: string;
  durationStr: string;
  durationSec: number;
  startedAt: string;
  stoppedAt: string;
}

interface CompletedSessionInfo {
  name: string;
  subject: string;
  subjectIcon: string;
  subjectColor: string;
  durationStr: string;
  durationSec: number;
  earnedExp: number;
  stoppedAt: string;
}

const PRESET_DURATIONS = [
  { label: '15 giây', totalSec: 15, h: 0, m: 0, s: 15, lightColor: 'bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-400', darkColor: 'dark:bg-[#071933] dark:border-sky-500/30 dark:text-sky-300 dark:hover:border-sky-400 dark:hover:shadow-[0_0_15px_rgba(56,189,248,0.35)]' },
  { label: '45 giây', totalSec: 45, h: 0, m: 0, s: 45, lightColor: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400', darkColor: 'dark:bg-[#1f1707] dark:border-amber-500/30 dark:text-amber-300 dark:hover:border-amber-400 dark:hover:shadow-[0_0_15px_rgba(251,191,36,0.35)]' },
  { label: '1 phút', totalSec: 60, h: 0, m: 1, s: 0, lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400', darkColor: 'dark:bg-[#071f16] dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:shadow-[0_0_15px_rgba(52,211,153,0.35)]' },
  { label: '2 phút', totalSec: 120, h: 0, m: 2, s: 0, lightColor: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400', darkColor: 'dark:bg-[#091a38] dark:border-blue-500/30 dark:text-blue-300 dark:hover:border-blue-400 dark:hover:shadow-[0_0_15px_rgba(96,165,250,0.35)]' },
  { label: '3 phút', totalSec: 180, h: 0, m: 3, s: 0, lightColor: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400', darkColor: 'dark:bg-[#200913] dark:border-rose-500/30 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:shadow-[0_0_15px_rgba(251,113,133,0.35)]' },
  { label: '5 phút', totalSec: 300, h: 0, m: 5, s: 0, lightColor: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400', darkColor: 'dark:bg-[#201007] dark:border-orange-500/30 dark:text-orange-300 dark:hover:border-orange-400 dark:hover:shadow-[0_0_15px_rgba(251,146,60,0.35)]' },
  { label: '10 phút', totalSec: 600, h: 0, m: 10, s: 0, lightColor: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400', darkColor: 'dark:bg-[#180a29] dark:border-purple-500/30 dark:text-purple-300 dark:hover:border-purple-400 dark:hover:shadow-[0_0_15px_rgba(192,132,252,0.35)]' },
  { label: '15 phút', totalSec: 900, h: 0, m: 15, s: 0, lightColor: 'bg-pink-50 text-pink-700 border-pink-200 hover:border-pink-400', darkColor: 'dark:bg-[#23091e] dark:border-pink-500/30 dark:text-pink-300 dark:hover:border-pink-400 dark:hover:shadow-[0_0_15px_rgba(244,114,182,0.35)]' },
  { label: '20 phút', totalSec: 1200, h: 0, m: 20, s: 0, lightColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:border-cyan-400', darkColor: 'dark:bg-[#061e27] dark:border-cyan-500/30 dark:text-cyan-300 dark:hover:border-cyan-400 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.35)]' },
  { label: '25 phút', totalSec: 1500, h: 0, m: 25, s: 0, lightColor: 'bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400', darkColor: 'dark:bg-[#061f1c] dark:border-teal-500/30 dark:text-teal-300 dark:hover:border-teal-400 dark:hover:shadow-[0_0_15px_rgba(45,212,191,0.35)]' },
  { label: '30 phút', totalSec: 1800, h: 0, m: 30, s: 0, lightColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400', darkColor: 'dark:bg-[#0c1236] dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:border-indigo-400 dark:hover:shadow-[0_0_15px_rgba(129,140,248,0.35)]' },
  { label: '45 phút', totalSec: 2700, h: 0, m: 45, s: 0, lightColor: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:border-fuchsia-400', darkColor: 'dark:bg-[#210729] dark:border-fuchsia-500/30 dark:text-fuchsia-300 dark:hover:border-fuchsia-400 dark:hover:shadow-[0_0_15px_rgba(232,121,249,0.35)]' },
  { label: '60 phút', totalSec: 3600, h: 1, m: 0, s: 0, lightColor: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400', darkColor: 'dark:bg-[#081836] dark:border-blue-500/30 dark:text-blue-300 dark:hover:border-blue-400 dark:hover:shadow-[0_0_15px_rgba(96,165,250,0.35)]' },
  { label: '90 phút', totalSec: 5400, h: 1, m: 30, s: 0, lightColor: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400', darkColor: 'dark:bg-[#1d1506] dark:border-amber-500/30 dark:text-amber-300 dark:hover:border-amber-400 dark:hover:shadow-[0_0_15px_rgba(251,191,36,0.35)]' },
  { label: '120 phút', totalSec: 7200, h: 2, m: 0, s: 0, lightColor: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400', darkColor: 'dark:bg-[#240813] dark:border-rose-500/30 dark:text-rose-300 dark:hover:border-rose-400 dark:hover:shadow-[0_0_15px_rgba(251,113,133,0.35)]' },
];

const ALARM_SOUND_OPTIONS = [
  { id: 'classic', label: '🔔 Đồng hồ báo thức cổ điển' },
  { id: 'bell', label: '🔔 Tiếng chuông ngân thanh' },
  { id: 'horns', label: '🔔 Tiếng kèn hiệu chiến thắng' },
  { id: 'digital', label: '🔔 Kính coong điện tử' },
  { id: 'birds', label: '🔔 Tiếng chim hót sớm mai' },
];

const SUBJECT_CONFIGS: Record<string, { label: string; icon: string; badgeClass: string }> = {
  'Toán': { label: 'Toán', icon: '📐', badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-cyan-300 border-blue-200 dark:border-cyan-500/30 dark:bg-cyan-950/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]' },
  'Hóa Học': { label: 'Hóa Học', icon: '🧪', badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 dark:bg-rose-950/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]' },
  'Tiếng Anh': { label: 'Tiếng Anh', icon: '🇬🇧', badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30 dark:bg-teal-950/40 shadow-[0_0_10px_rgba(20,184,166,0.15)]' },
  'Vật Lý': { label: 'Vật Lý', icon: '⚛️', badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 dark:bg-purple-950/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]' },
  'Tin Học': { label: 'Tin Học', icon: '💻', badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30 dark:bg-cyan-950/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]' },
  'Sinh Học': { label: 'Sinh Học', icon: '🧬', badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-950/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]' },
  'Ngữ Văn': { label: 'Ngữ Văn', icon: '📖', badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 dark:bg-amber-950/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]' },
  'Lịch Sử': { label: 'Lịch Sử', icon: '📜', badgeClass: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30 dark:bg-yellow-950/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]' },
  'Địa Lý': { label: 'Địa Lý', icon: '🗺️', badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 dark:bg-sky-950/40 shadow-[0_0_10px_rgba(14,165,233,0.15)]' },
  'Khác': { label: 'Khác', icon: '🎨', badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 dark:bg-slate-900/40' },
};

const AMBIENT_SOUND_OPTIONS = [
  { id: 'none', label: 'Tắt âm', icon: '' },
  { id: 'binaural', label: 'Sóng não 40Hz', icon: '🧠' },
  { id: 'lofi', label: 'Giai điệu Lofi', icon: '🎵' },
  { id: 'rain', label: 'Mưa rào', icon: '🌧️' },
  { id: 'whitenoise', label: 'Tiếng ồn trắng', icon: '🎧' },
  { id: 'ocean', label: 'Sóng biển', icon: '🌊' },
  { id: 'cafe', label: 'Quán cà phê', icon: '☕' },
];

const INITIAL_LOGS: SessionLogItem[] = [
  { id: '1', name: 'Deep Learning', subject: 'Toán', subjectIcon: '📐', subjectColor: 'bg-blue-500/10 text-blue-700 dark:text-cyan-300 border-blue-200 dark:border-cyan-500/30 dark:bg-cyan-950/40', durationStr: '00:00:02', durationSec: 2, startedAt: '03/11/2026 - 21:45', stoppedAt: '03/11/2026 - 21:45' },
  { id: '2', name: 'Deep Learning – Toán Đạo hàm', subject: 'Toán', subjectIcon: '📐', subjectColor: 'bg-blue-500/10 text-blue-700 dark:text-cyan-300 border-blue-200 dark:border-cyan-500/30 dark:bg-cyan-950/40', durationStr: '02:30:00', durationSec: 9000, startedAt: '14/10/2026 - 20:25', stoppedAt: '14/10/2026 - 22:55' },
  { id: '3', name: 'Ôn tập Este Hóa học', subject: 'Hóa Học', subjectIcon: '🧪', subjectColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 dark:bg-rose-950/40', durationStr: '01:45:00', durationSec: 6300, startedAt: '12/10/2026 - 19:30', stoppedAt: '12/10/2026 - 21:15' },
  { id: '4', name: 'Viết bài luận IELTS', subject: 'Tiếng Anh', subjectIcon: '🇬🇧', subjectColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30 dark:bg-teal-950/40', durationStr: '00:50:00', durationSec: 3000, startedAt: '10/10/2026 - 15:00', stoppedAt: '10/10/2026 - 15:50' },
  { id: '5', name: 'Luyện đề Vật Lý Chuyên', subject: 'Vật Lý', subjectIcon: '⚛️', subjectColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 dark:bg-purple-950/40', durationStr: '02:00:00', durationSec: 7200, startedAt: '08/10/2026 - 20:14', stoppedAt: '08/10/2026 - 22:14' },
  { id: '6', name: 'Luyện tập Tin học Python', subject: 'Tin Học', subjectIcon: '💻', subjectColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30 dark:bg-cyan-950/40', durationStr: '01:15:00', durationSec: 4500, startedAt: '06/10/2026 - 19:40', stoppedAt: '06/10/2026 - 20:55' },
];

export const FocusView: React.FC<FocusViewProps> = ({ sessions, onUpdateSessions }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDate(today);

  // Configuration inputs
  const [hours, setHours] = useState<number>(2);
  const [minutes, setMinutes] = useState<number>(30);
  const [seconds, setSeconds] = useState<number>(0);
  const [alarmSound, setAlarmSound] = useState<string>('classic');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [sessionName, setSessionName] = useState<string>('Deep Learning');
  const [ambientSound, setAmbientSound] = useState<string>('none');
  const [isLoggingEnabled, setIsLoggingEnabled] = useState<boolean>(true);

  // Timer execution state
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [totalDurationSec, setTotalDurationSec] = useState<number>(9000); // 2h 30m
  const [timeLeftSec, setTimeLeftSec] = useState<number>(9000);
  const [sessionStartTimeStr, setSessionStartTimeStr] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [progressMode, setProgressMode] = useState<'remaining' | 'elapsed'>('remaining');
  const containerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Dialog States ("khung hội thoại với đổ bóng mờ tạo chiều sâu")
  const [completedSessionData, setCompletedSessionData] = useState<CompletedSessionInfo | null>(null);
  const [sessionRating, setSessionRating] = useState<'super' | 'productive' | 'normal' | 'tired'>('super');
  const [sessionNote, setSessionNote] = useState<string>('');
  const [logToDelete, setLogToDelete] = useState<SessionLogItem | null>(null);

  // History logs
  const [logs, setLogs] = useState<SessionLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('studyflow_session_timer_logs');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('studyflow_session_timer_logs', JSON.stringify(logs));
  }, [logs]);

  // Today Focus Stats for "HÔM NAY CỦA BẠN" widget
  const todayFocusMins = Math.round((sessions && sessions[todayKey]) || 0);
  const todayDateStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
  const todaySessionsCount = useMemo(() => {
    return logs.filter(l => l.startedAt?.includes(todayDateStr) || l.stoppedAt?.includes(todayDateStr)).length;
  }, [logs, todayDateStr]);

  // Audio Handler for Ambient Sounds
  useEffect(() => {
    if (isTimerActive && !isTimerPaused && ambientSound !== 'none') {
      if (ambientSound === 'lofi') lofiEngine.play('lofi-beats');
      else if (ambientSound === 'rain') lofiEngine.play('rain');
      else if (ambientSound === 'ocean') lofiEngine.play('ocean');
      else if (ambientSound === 'cafe') lofiEngine.play('cafe');
      else if (ambientSound === 'whitenoise' || ambientSound === 'binaural') lofiEngine.play('lofi-beats');
    } else {
      lofiEngine.stop();
    }
  }, [isTimerActive, isTimerPaused, ambientSound]);

  // Timer countdown loop
  useEffect(() => {
    if (isTimerActive && !isTimerPaused) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeftSec((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTimerActive, isTimerPaused]);

  // Handle timer natural completion
  useEffect(() => {
    if (isTimerActive && timeLeftSec <= 0) {
      handleCompleteSession();
    }
  }, [isTimerActive, timeLeftSec]);

  // Format Helper: Seconds to HH:MM:SS
  const formatSecondsToHms = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Preset Selection Click
  const handleSelectPreset = (preset: typeof PRESET_DURATIONS[0]) => {
    setHours(preset.h);
    setMinutes(preset.m);
    setSeconds(preset.s);
  };

  // Current selected duration in seconds
  const currentConfiguredSec = useMemo(() => {
    return hours * 3600 + minutes * 60 + seconds;
  }, [hours, minutes, seconds]);

  // Start Session
  const handleStartSession = () => {
    const totalSec = currentConfiguredSec > 0 ? currentConfiguredSec : 60;
    setTotalDurationSec(totalSec);
    setTimeLeftSec(totalSec);
    setIsTimerActive(true);
    setIsTimerPaused(false);

    const now = new Date();
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setSessionStartTimeStr(formattedDate);
  };

  // Pause / Resume
  const handleTogglePause = () => {
    setIsTimerPaused((prev) => !prev);
  };

  // Complete / Finish
  const handleCompleteSession = () => {
    setIsTimerActive(false);
    setIsTimerPaused(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    lofiEngine.stop();
    playAlarmSound(alarmSound);

    const elapsedSec = Math.max(0, totalDurationSec - timeLeftSec);
    const elapsedMinutes = Math.max(1, Math.round(elapsedSec / 60));

    // Update parent sessions safely
    onUpdateSessions({
      ...sessions,
      [todayKey]: (sessions[todayKey] || 0) + elapsedMinutes
    });

    const now = new Date();
    const stoppedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const subCfg = SUBJECT_CONFIGS[selectedSubject] || SUBJECT_CONFIGS['Toán'];
    const actualSec = elapsedSec > 0 ? elapsedSec : totalDurationSec;
    const earnedExp = Math.max(30, Math.round(actualSec / 60) * 5);

    // Record session if enabled
    if (isLoggingEnabled) {
      const newLog: SessionLogItem = {
        id: Date.now().toString(),
        name: sessionName || 'Phiên học tập',
        subject: selectedSubject,
        subjectIcon: subCfg.icon,
        subjectColor: subCfg.badgeClass,
        durationStr: formatSecondsToHms(actualSec),
        durationSec: actualSec,
        startedAt: sessionStartTimeStr || stoppedDate,
        stoppedAt: stoppedDate
      };
      setLogs((prev) => [newLog, ...prev]);
    }

    // Trigger celebratory reflection dialogue with depth shadow
    setCompletedSessionData({
      name: sessionName || 'Phiên học tập',
      subject: selectedSubject,
      subjectIcon: subCfg.icon,
      subjectColor: subCfg.badgeClass,
      durationStr: formatSecondsToHms(actualSec),
      durationSec: actualSec,
      earnedExp,
      stoppedAt: stoppedDate
    });
  };

  // Stop Timer Early
  const handleStopTimer = () => {
    handleCompleteSession();
  };

  // Delete log item confirmed
  const confirmDeleteLog = () => {
    if (logToDelete) {
      setLogs((prev) => prev.filter((item) => item.id !== logToDelete.id));
      setLogToDelete(null);
    }
  };

  // Quick 5-minute break trigger from dialogue
  const handleTake5MinBreak = () => {
    setCompletedSessionData(null);
    setHours(0);
    setMinutes(5);
    setSeconds(0);
    setSessionName('Nghỉ giải lao tái tạo năng lượng');
    setTotalDurationSec(300);
    setTimeLeftSec(300);
    setIsTimerActive(true);
    setIsTimerPaused(false);
    const now = new Date();
    setSessionStartTimeStr(`${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  // Test Alarm Sound
  const handleTestAlarm = () => {
    playAlarmSound(alarmSound);
  };

  // Toggle Full Screen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // ==========================================
  // VIEW 2: ACTIVE TIMER SCREEN (Luxury Neon Dial)
  // ==========================================
  if (isTimerActive) {
    const remainingRatio = totalDurationSec > 0 ? (timeLeftSec / totalDurationSec) : 0;
    const elapsedRatio = totalDurationSec > 0 ? ((totalDurationSec - timeLeftSec) / totalDurationSec) : 0;
    const currentRatio = Math.min(1, Math.max(0, progressMode === 'remaining' ? remainingRatio : elapsedRatio));

    const radius = 126;
    const circumference = 2 * Math.PI * radius; // ~791.68
    const strokeDashoffset = circumference * (1 - currentRatio);

    const angleDeg = -90 + currentRatio * 360;
    const angleRad = (angleDeg * Math.PI) / 180;
    const beadX = 160 + radius * Math.cos(angleRad);
    const beadY = 160 + radius * Math.sin(angleRad);

    const dialTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {
      const angle = (min * 6 - 90) * (Math.PI / 180);
      const isMajor = min % 15 === 0;
      const rInner = isMajor ? 140 : 144;
      const rOuter = 148;
      return {
        key: min,
        x1: 160 + rInner * Math.cos(angle),
        y1: 160 + rInner * Math.sin(angle),
        x2: 160 + rOuter * Math.cos(angle),
        y2: 160 + rOuter * Math.sin(angle),
        isMajor,
      };
    });

    const subCfg = SUBJECT_CONFIGS[selectedSubject] || SUBJECT_CONFIGS['Toán'];

    return (
      <div 
        ref={containerRef}
        className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 transition-all duration-300"
      >
        <div className="bg-white/95 dark:bg-gradient-to-b dark:from-[#08152c] dark:via-[#061122] dark:to-[#030914] border border-slate-200/90 dark:border-cyan-500/30 rounded-[38px] p-6 sm:p-10 shadow-2xl dark:shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.18)] backdrop-blur-xl flex flex-col items-center justify-between min-h-[600px] relative overflow-hidden transition-all duration-300">
          
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top Bar: Subject Badge (Left) & Fullscreen (Right) */}
          <div className="w-full flex items-center justify-between z-10">
            <span className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border shadow-xs interactive-spring ${subCfg.badgeClass}`}>
              <span>{subCfg.icon}</span>
              <span>Môn {subCfg.label}</span>
            </span>

            <button
              onClick={toggleFullScreen}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-cyan-950/60 dark:hover:border-cyan-500/40 border border-transparent dark:border-cyan-900/40 text-slate-500 hover:text-slate-900 dark:text-cyan-300 interactive-spring cursor-pointer shadow-xs"
              title="Toàn màn hình"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Center Title */}
          <div className="text-center space-y-1 my-3 z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              {sessionName || 'Deep Learning'}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-cyan-300/70 flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTimerPaused ? 'bg-amber-400' : 'bg-cyan-400 animate-ping'}`} />
              <span>{isTimerPaused ? 'Đang tạm dừng phiên học' : 'Đang diễn ra phiên tập trung'}</span>
            </p>
          </div>

          {/* Circular Countdown Ring - Perfectly circular, unclipped, elegant chronograph dial */}
          <div className="relative my-4 sm:my-6 flex items-center justify-center z-10">
            <svg 
              className="w-72 h-72 sm:w-84 sm:h-84 overflow-visible select-none drop-shadow-md" 
              viewBox="0 0 320 320"
            >
              <defs>
                <linearGradient id="timerNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="40%" stopColor="#06b6d4" />
                  <stop offset="75%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="timerNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Chronograph Dial Minute Ticks */}
              {dialTicks.map((tick) => (
                <line
                  key={tick.key}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke="currentColor"
                  strokeWidth={tick.isMajor ? 2.5 : 1.5}
                  strokeLinecap="round"
                  className={tick.isMajor ? 'text-slate-400 dark:text-cyan-400/60' : 'text-slate-200 dark:text-slate-700/70'}
                />
              ))}

              {/* Outer Subtle Dashed Accent Circle */}
              <circle
                cx="160"
                cy="160"
                r="148"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="3 4"
                className="text-slate-200/80 dark:text-cyan-500/20"
              />

              {/* Inner Subtle Depth Accent Circle */}
              <circle
                cx="160"
                cy="160"
                r="104"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-100 dark:text-cyan-500/15"
              />

              {/* Full Background Track */}
              <circle
                cx="160"
                cy="160"
                r={radius}
                stroke="currentColor"
                strokeWidth="14"
                fill="none"
                className="text-slate-100 dark:text-slate-800/90"
              />

              {/* Active Glowing Progress Ring */}
              <circle
                cx="160"
                cy="160"
                r={radius}
                stroke="url(#timerNeonGrad)"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 160 160)"
                className="transition-all duration-1000 ease-linear"
                filter="url(#timerNeonGlow)"
              />

              {/* Moving Glowing Bead Indicator at tip */}
              {currentRatio > 0.003 && (
                <g className="transition-all duration-1000 ease-linear">
                  <circle cx={beadX} cy={beadY} r="11" className="fill-cyan-400/30 animate-ping opacity-70" />
                  <circle cx={beadX} cy={beadY} r="9" className="fill-cyan-400/40" />
                  <circle cx={beadX} cy={beadY} r="6" className="fill-white dark:fill-[#08152c] stroke-2 stroke-cyan-400" />
                  <circle cx={beadX} cy={beadY} r="2.5" className="fill-cyan-400" />
                </g>
              )}
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-auto">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight select-none drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                {formatSecondsToHms(timeLeftSec)}
              </span>

              {/* Interactive Progress Mode Pill */}
              <button
                type="button"
                onClick={() => setProgressMode(prev => prev === 'remaining' ? 'elapsed' : 'remaining')}
                className="mt-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#071933] dark:hover:bg-[#0c284e] text-slate-600 dark:text-cyan-200 border border-slate-200/60 dark:border-cyan-500/30 interactive-spring flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Nhấn để đổi cách tính: Thời gian còn lại / Thời gian đã học"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{progressMode === 'remaining' ? 'Còn lại:' : 'Đã học:'}</span>
                <span className="font-mono font-black text-cyan-600 dark:text-cyan-300">
                  {(currentRatio * 100).toFixed(0)}%
                </span>
              </button>

              {/* Status Pill */}
              <div className="mt-2.5">
                {isTimerPaused ? (
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300 dark:bg-[#201407] dark:text-amber-300 dark:border-amber-500/40 flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
                    <Pause className="w-3 h-3 fill-current" />
                    <span>TẠM DỪNG</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 border border-emerald-400/40">
                    <span className="w-2 h-2 rounded-full bg-white block animate-ping" />
                    <span>ĐANG TẬP TRUNG</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Control Buttons (Neon Gradient) */}
          <div className="flex items-center gap-4 w-full max-w-md justify-center z-10 my-2">
            <button
              onClick={handleTogglePause}
              className="flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 border border-amber-300/30 interactive-spring cursor-pointer"
            >
              {isTimerPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              <span>{isTimerPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
            </button>

            <button
              onClick={handleStopTimer}
              className="flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 shadow-lg shadow-rose-500/25 border border-rose-300/30 interactive-spring flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Dừng đồng hồ</span>
            </button>
          </div>

          {/* Bottom Ambient Sound Control Dropdown */}
          <div className="w-full max-w-xs flex items-center justify-center gap-2.5 pt-2 z-10 text-xs">
            <span className="text-slate-500 dark:text-cyan-300/80 font-bold flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-cyan-400" />
              <span>Âm thanh nền:</span>
            </span>

            <select
              value={ambientSound}
              onChange={(e) => setAmbientSound(e.target.value)}
              className="bg-slate-100 dark:bg-[#071328] border border-slate-200 dark:border-cyan-800/60 rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-cyan-200 cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="none">Tắt</option>
              <option value="binaural">Sóng não 40Hz 🧠</option>
              <option value="lofi">Giai điệu Lofi 🎵</option>
              <option value="rain">Mưa rào 🌧️</option>
              <option value="whitenoise">Tiếng ồn trắng 🎧</option>
              <option value="ocean">Sóng biển 🌊</option>
              <option value="cafe">Quán cà phê ☕</option>
            </select>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: CONFIGURATION & HISTORY VIEW
  // ==========================================
  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 space-y-8 select-none transition-all duration-300">
      
      {/* 1. Main Configuration Card */}
      <div className="bg-white/95 dark:bg-gradient-to-b dark:from-[#09152b] dark:via-[#071324] dark:to-[#040a16] border border-slate-200/90 dark:border-cyan-500/30 rounded-[36px] p-6 sm:p-10 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(6,182,212,0.12)] space-y-8 backdrop-blur-xl relative overflow-hidden transition-all duration-300">
        
        {/* Subtle Ambient Decorative Spots */}
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300/40 mx-auto interactive-spring hover:scale-105">
            <Clock className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Đồng hồ đếm ngược Sessions
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Cài đặt thời gian đếm ngược tập trung theo nhu cầu học tập cá nhân với hiệu ứng nhịp độ trực quan
          </p>
        </div>

        {/* "HÔM NAY CỦA BẠN" Card Widget (Upgraded to luxury dark navy glass & glowing stats) */}
        <div className="w-full max-w-xs sm:max-w-sm mx-auto p-4 sm:p-5 rounded-[26px] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1c38] dark:via-[#08162c] dark:to-[#050e1c] border border-slate-200/90 dark:border-cyan-500/40 shadow-md dark:shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.15)] text-center transition-all duration-300 interactive-spring hover:scale-[1.02] relative overflow-hidden group">
          
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/15 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-400/25 transition-all" />

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <h4 className="text-[11px] font-black tracking-wider text-slate-500 dark:text-cyan-300 uppercase">
              HÔM NAY CỦA BẠN
            </h4>
          </div>
          
          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-cyan-900/60 mt-1">
            {/* Phút học */}
            <div className="px-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-cyan-300 tracking-tight font-sans drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                {todayFocusMins}
              </span>
              <p className="text-[10px] font-bold text-slate-400 dark:text-cyan-400/80 uppercase tracking-widest mt-1">
                PHÚT HỌC
              </p>
            </div>

            {/* Phiên */}
            <div className="px-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                {todaySessionsCount}
              </span>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1">
                PHIÊN
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Cấu hình phiên hẹn giờ */}
        <div className="space-y-4 pt-2 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 fill-cyan-400/30" />
            <h3 className="text-xs font-black text-slate-900 dark:text-cyan-200 uppercase tracking-wider">
              Cấu hình phiên hẹn giờ
            </h3>
          </div>

          {/* 3 Select dropdowns: Số giờ, Số phút, Số giây */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Giờ */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Số giờ</span>
              </label>
              <select
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value, 10))}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-cyan-100 font-bold text-sm cursor-pointer outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all"
              >
                {Array.from({ length: 13 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')} giờ
                  </option>
                ))}
              </select>
            </div>

            {/* Phút */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Số phút</span>
              </label>
              <select
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-cyan-100 font-bold text-sm cursor-pointer outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all"
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')} phút
                  </option>
                ))}
              </select>
            </div>

            {/* Giây */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Số giây</span>
              </label>
              <select
                value={seconds}
                onChange={(e) => setSeconds(parseInt(e.target.value, 10))}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-cyan-100 font-bold text-sm cursor-pointer outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all"
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')} giây
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Chọn nhanh thời gian mẫu */}
        <div className="space-y-3.5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500/30" />
              <h3 className="text-xs font-black text-slate-900 dark:text-cyan-200 uppercase tracking-wider">
                CHỌN NHANH THỜI GIAN MẪU
              </h3>
            </div>
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20">
              Đã chọn: {hours > 0 ? `${hours}h ` : ''}{minutes}p{seconds > 0 ? ` ${seconds}s` : ''}
            </span>
          </div>

          {/* 15 Colored Preset Buttons with Luxury Neon Rings */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {PRESET_DURATIONS.map((preset) => {
              const isSelected = currentConfiguredSec === preset.totalSec;
              return (
                <button
                  key={preset.label}
                  onClick={() => handleSelectPreset(preset)}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 interactive-spring cursor-pointer ${preset.lightColor} ${preset.darkColor} ${
                    isSelected ? 'ring-2 ring-cyan-400 dark:ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105 font-black' : ''
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 opacity-80" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Âm thanh báo thức & Môn học áp dụng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {/* Âm thanh báo thức */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
                <span>Âm thanh báo thức</span>
              </label>

              <button
                onClick={handleTestAlarm}
                className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer interactive-spring hover:underline"
              >
                <Volume2 className="w-3 h-3" />
                <span>Nghe thử âm</span>
              </button>
            </div>

            <select
              value={alarmSound}
              onChange={(e) => setAlarmSound(e.target.value)}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-cyan-100 font-bold text-sm cursor-pointer outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all"
            >
              {ALARM_SOUND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Môn học áp dụng */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Môn học áp dụng</span>
            </label>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-cyan-100 font-bold text-sm cursor-pointer outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all"
            >
              {Object.keys(SUBJECT_CONFIGS).map((subKey) => (
                <option key={subKey} value={subKey}>
                  {SUBJECT_CONFIGS[subKey].icon} {SUBJECT_CONFIGS[subKey].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 4: Tên phiên học tập (Session Name) */}
        <div className="space-y-1.5 relative z-10">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Tên phiên học tập (Session Name)
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Deep Learning..."
            className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all placeholder-slate-400"
          />
        </div>

        {/* Section 5: Âm thanh nền tăng tập trung (Web Audio) */}
        <div className="space-y-2.5 relative z-10">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            <span>Âm thanh nền tăng tập trung (Web Audio Engine)</span>
          </label>

          <div className="flex flex-wrap gap-2">
            {AMBIENT_SOUND_OPTIONS.map((item) => {
              const isSelected = ambientSound === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAmbientSound(item.id)}
                  className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all duration-200 interactive-spring cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/60 scale-105'
                      : 'bg-slate-50 dark:bg-[#071933]/70 text-slate-700 dark:text-cyan-200/80 border border-slate-200 dark:border-cyan-900/50 hover:border-cyan-500/40 hover:bg-cyan-500/5'
                  }`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Start Button */}
        <button
          onClick={handleStartSession}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_10px_35px_rgba(6,182,212,0.4),0_0_25px_rgba(37,99,235,0.3)] border border-cyan-300/40 flex items-center justify-center gap-2 transition-all interactive-spring hover:scale-[1.01] active:scale-[0.99] cursor-pointer relative z-10"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Bắt đầu hẹn giờ phiên ({formatSecondsToHms(currentConfiguredSec)})</span>
        </button>

      </div>

      {/* 2. Dữ liệu nhật ký hẹn giờ Table Card */}
      <div className="bg-white/95 dark:bg-gradient-to-b dark:from-[#09152b] dark:via-[#071324] dark:to-[#040a16] border border-slate-200/90 dark:border-cyan-500/30 rounded-[36px] p-6 sm:p-8 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(6,182,212,0.1)] space-y-6 backdrop-blur-xl relative overflow-hidden transition-all duration-300">
        
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-cyan-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Dữ liệu nhật ký hẹn giờ
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tự động lưu và cộng dồn vào tổng số giờ học tuần này
              </p>
            </div>
          </div>

          {/* Toggle Ghi nhật ký */}
          <div 
            onClick={() => setIsLoggingEnabled(!isLoggingEnabled)}
            className="flex items-center gap-2 cursor-pointer self-start sm:self-auto interactive-spring"
          >
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ghi nhật ký
            </span>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
              isLoggingEnabled 
                ? 'bg-cyan-500 border border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                : 'bg-slate-200 dark:bg-slate-700 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 dark:text-cyan-300/60 font-bold border-b border-slate-100 dark:border-cyan-950/80 pb-3 uppercase tracking-wider text-[10px]">
                <th className="pb-3">Tên phiên</th>
                <th className="pb-3">Môn học</th>
                <th className="pb-3">Thời lượng</th>
                <th className="pb-3">Đã bắt đầu</th>
                <th className="pb-3">Đã dừng</th>
                <th className="pb-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-cyan-950/60 font-semibold text-slate-800 dark:text-slate-200">
              {logs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-[#0b1c38]/50 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">{item.name}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center gap-1.5 border ${item.subjectColor}`}>
                      <span>{item.subjectIcon}</span>
                      <span>{item.subject}</span>
                    </span>
                  </td>
                  <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-cyan-300">
                    {item.durationStr}
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                    {item.startedAt}
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                    {item.stoppedAt}
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      onClick={() => setLogToDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 interactive-spring cursor-pointer"
                      title="Xóa nhật ký"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    Chưa có nhật ký phiên học nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ======================================================== */}
      {/* KHUNG HỘI THOẠI 1: HOÀN THÀNH PHIÊN HỌC TẬP & REFLECTION */}
      {/* Áp dụng .dialog-depth-shadow, dark navy, neon accents & spring physics */}
      {/* ======================================================== */}
      {completedSessionData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gradient-to-b dark:from-[#091730] dark:via-[#071326] dark:to-[#040914] border border-slate-200 dark:border-cyan-500/40 rounded-[32px] w-full max-w-lg overflow-hidden dialog-depth-shadow relative shadow-2xl transition-all duration-300">
            
            {/* Top Neon Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            
            <button 
              onClick={() => setCompletedSessionData(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-300 interactive-spring cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-7 space-y-6">
              
              {/* Header with Trophy & EXP */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-400 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <div className="w-full h-full bg-[#051124] rounded-2xl flex items-center justify-center text-amber-400">
                    <Trophy className="w-7 h-7 animate-bounce" />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-black tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
                    PHIÊN HỌC HOÀN THÀNH
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    Xuất sắc! Bạn đã tập trung cao độ
                  </h3>
                </div>
              </div>

              {/* Session Stat Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0c1f3c]/60 border border-slate-200 dark:border-cyan-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tên phiên:</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{completedSessionData.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Môn học:</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${completedSessionData.subjectColor}`}>
                    {completedSessionData.subjectIcon} {completedSessionData.subject}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-cyan-950/80 pt-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Thời lượng ghi nhận:</span>
                  <span className="text-sm font-black font-mono text-cyan-600 dark:text-cyan-300">
                    {completedSessionData.durationStr}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Phần thưởng đạt được:
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    +{completedSessionData.earnedExp} EXP • +15 Streak Point
                  </span>
                </div>
              </div>

              {/* Feeling / Reflection Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-cyan-300/80">
                  Cảm xúc của bạn sau phiên học?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'super', label: 'Siêu tập trung', icon: '🔥', color: 'border-orange-500 text-orange-400 bg-orange-500/10' },
                    { id: 'productive', label: 'Hiệu quả cao', icon: '💡', color: 'border-cyan-500 text-cyan-400 bg-cyan-500/10' },
                    { id: 'normal', label: 'Ổn định', icon: '🙂', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                    { id: 'tired', label: 'Hơi mệt mỏi', icon: '☕', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSessionRating(item.id as any)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all interactive-spring text-center flex flex-col items-center gap-1 cursor-pointer ${
                        sessionRating === item.id 
                          ? `${item.color} shadow-md scale-105 ring-2 ring-cyan-400/40 font-black`
                          : 'bg-slate-50 dark:bg-[#071933]/50 border-slate-200 dark:border-cyan-950 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[10px] leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Quick Reflection Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Ghi chú nhanh bài học (tùy chọn)
                </label>
                <input
                  type="text"
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="Ví dụ: Đã giải xong 5 bài đạo hàm khó..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-[#071328] border border-slate-200 dark:border-cyan-900/60 text-slate-900 dark:text-white text-xs outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleTake5MinBreak}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0c2448] dark:hover:bg-[#102e5c] border border-slate-200 dark:border-cyan-700/40 text-slate-700 dark:text-cyan-200 font-black text-xs uppercase tracking-wider interactive-spring flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Nghỉ 5 phút</span>
                </button>

                <button
                  onClick={() => setCompletedSessionData(null)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 border border-emerald-300/40 interactive-spring flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu kết quả & Đóng</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* KHUNG HỘI THOẠI 2: XÁC NHẬN XÓA NHẬT KÝ PHIÊN HỌC */}
      {/* Áp dụng .dialog-depth-shadow, dark navy, neon red/cyan accents */}
      {/* ======================================================== */}
      {logToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gradient-to-b dark:from-[#091730] dark:via-[#071326] dark:to-[#040914] border border-slate-200 dark:border-rose-500/30 rounded-[30px] w-full max-w-sm overflow-hidden dialog-depth-shadow relative shadow-2xl p-6 space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(244,63,94,0.25)]">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Xóa nhật ký phiên học?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phiên "<strong className="text-slate-800 dark:text-cyan-300">{logToDelete.name}</strong>" ({logToDelete.durationStr}) sẽ bị xóa khỏi lịch sử.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setLogToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs interactive-spring cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                onClick={confirmDeleteLog}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/30 border border-rose-400/30 interactive-spring cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
