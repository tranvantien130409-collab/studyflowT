import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Check, 
  Lock, 
  Flame, 
  Crown, 
  Sparkles, 
  Star, 
  Trash2, 
  Plus, 
  RotateCcw,
  Trophy,
  Compass,
  AlertTriangle,
  Volume2,
  VolumeX,
  X,
  ListTodo
} from 'lucide-react';
import { GoalMilestone, StudentProfile } from '../types';
import { Avatar } from './Avatar';

interface GameQuestMapProps {
  milestones: GoalMilestone[];
  subject: string;
  goalTitle: string;
  studentProfile?: StudentProfile;
  selectedMilestoneId?: string | null;
  onSelectMilestone: (m: GoalMilestone | null) => void;
  onToggleMilestone: (milestoneId: string) => void;
  onUpdateMilestoneTasks?: (milestoneId: string, tasks: Array<{ id: string; text: string; done: boolean }>) => void;
  onDeleteMilestone: (milestoneId: string) => void;
  onAddMilestoneClick?: () => void;
  onDeleteGoalClick?: () => void;
}

// Web Audio sound effects (pure browser, zero lag, arcade game feel)
const playSound = (type: 'hop' | 'complete' | 'click' | 'delete') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'hop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'complete') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } else if (type === 'delete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {
    // Audio may fail if blocked by browser autoplay policy
  }
};

// Generates serpentine coordinates matching the visual winding trail in the reference image
const calculateNodeCoordinates = (total: number) => {
  if (total <= 0) return [];
  if (total === 1) return [{ x: 50, y: 50 }];

  // Reference image pattern (adjusted for smaller height and better spacing)
  const standardPattern = [
    { x: 80, y: 15 },
    { x: 20, y: 28 },
    { x: 75, y: 42 },
    { x: 25, y: 56 },
    { x: 75, y: 70 },
    { x: 20, y: 82 },
    { x: 50, y: 92 }
  ];

  if (total <= standardPattern.length) {
    return standardPattern.slice(0, total);
  }

  // Fallback for larger milestone counts: smooth S-zigzag
  return Array.from({ length: total }, (_, i) => {
    const y = 10 + (i / (total - 1)) * 82;
    const isEven = i % 2 === 0;
    const x = isEven ? 75 - (i % 4 === 0 ? 0 : 10) : 25 + (i % 4 === 1 ? 0 : 10);
    return { x, y };
  });
};

export const GameQuestMap: React.FC<GameQuestMapProps> = ({
  milestones = [], // Default to empty array
  subject,
  goalTitle,
  studentProfile,
  selectedMilestoneId,
  onSelectMilestone,
  onToggleMilestone,
  onUpdateMilestoneTasks,
  onDeleteMilestone,
  onAddMilestoneClick,
  onDeleteGoalClick
}) => {
  const [newSubtaskInput, setNewSubtaskInput] = useState<string>('');

  const getMilestoneTasks = (m: GoalMilestone) => {
    if (m.tasks && m.tasks.length > 0) return m.tasks;
    const cleanTitle = m.title.includes(':') ? m.title.split(':')[1].trim() : m.title;
    return [
      { id: `${m.id}_t1`, text: `Ôn tập lý thuyết & dạng bài về ${cleanTitle}`, done: m.status === 'completed' },
      { id: `${m.id}_t2`, text: `Làm 15-20 bài tập tự luyện chuyên đề này`, done: m.status === 'completed' },
      { id: `${m.id}_t3`, text: `Kiểm tra đáp án & ghi chú phương pháp giải nhanh`, done: m.status === 'completed' }
    ];
  };

  const handleToggleSubtask = (milestoneId: string, taskId: string) => {
    const m = milestones.find(item => item.id === milestoneId);
    if (!m) return;
    const current = getMilestoneTasks(m);
    const updated = current.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    if (onUpdateMilestoneTasks) {
      onUpdateMilestoneTasks(milestoneId, updated);
    }
  };

  const handleAddSubtask = (milestoneId: string) => {
    if (!newSubtaskInput.trim()) return;
    const m = milestones.find(item => item.id === milestoneId);
    if (!m) return;
    const current = getMilestoneTasks(m);
    const newTask = { id: `t_${Date.now()}`, text: newSubtaskInput.trim(), done: false };
    const updated = [...current, newTask];
    if (onUpdateMilestoneTasks) {
      onUpdateMilestoneTasks(milestoneId, updated);
    }
    setNewSubtaskInput('');
  };

  // Current active milestone index where the avatar stands
  const currentMilestoneIndex = useMemo(() => {
    if (!milestones || milestones.length === 0) return 0;
    
    // Stand on the first one that is NOT completed (the target task)
    const firstNotCompleted = milestones.findIndex(m => m.status !== 'completed');
    if (firstNotCompleted === -1) return Math.max(0, milestones.length - 1); // All done, stand on last
    return firstNotCompleted;
  }, [milestones]);

  const [isJumping, setIsJumping] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevIndexRef = useRef(currentMilestoneIndex);

  // Milestone deletion confirmation modal
  const [deletingMilestone, setDeletingMilestone] = useState<GoalMilestone | null>(null);

  // Node coordinates on the map
  const coordinates = useMemo(() => calculateNodeCoordinates(milestones?.length || 0), [milestones?.length]);

  // Hopping animation when active milestone changes
  useEffect(() => {
    const prevIndex = prevIndexRef.current;
    if (prevIndex !== currentMilestoneIndex && coordinates[prevIndex] && coordinates[currentMilestoneIndex]) {
      // Determine direction: if new X is less than old X, face left
      const prevCoord = coordinates[prevIndex];
      const nextCoord = coordinates[currentMilestoneIndex];
      if (prevCoord && nextCoord) {
        setFacingLeft(nextCoord.x < prevCoord.x);
      }

      // Update ref immediately
      prevIndexRef.current = currentMilestoneIndex;

      // Start the "jump" visual effect
      setIsJumping(true);
      if (soundEnabled) playSound('hop');

      const landingTimer = setTimeout(() => {
        setIsJumping(false);
        if (soundEnabled && milestones[currentMilestoneIndex]?.status === 'completed') {
          playSound('complete');
        }
      }, 700);

      return () => clearTimeout(landingTimer);
    } else {
      prevIndexRef.current = currentMilestoneIndex;
    }
  }, [currentMilestoneIndex, soundEnabled, milestones, coordinates]);

  // Generate SVG Bezier Path connecting nodes smoothly
  const svgPathData = useMemo(() => {
    if (!coordinates || coordinates.length < 2) return '';
    let d = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p0 = coordinates[i];
      const p1 = coordinates[i + 1];
      if (!p0 || !p1) continue;
      // Curving handles to create the natural winding road
      const dy = (p1.y - p0.y) * 0.5;
      const cp1x = p0.x + (p1.x > p0.x ? 15 : -15);
      const cp1y = p0.y + dy;
      const cp2x = p1.x + (p1.x > p0.x ? -15 : 15);
      const cp2y = p1.y - dy;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [coordinates]);

  const activeMilestone = milestones[currentMilestoneIndex];
  const selectedMilestone = useMemo(() => {
    if (!selectedMilestoneId || !milestones) return null;
    return milestones.find(m => m.id === selectedMilestoneId) || null;
  }, [selectedMilestoneId, milestones]);

  const avatarPos = coordinates[currentMilestoneIndex] || { x: 50, y: 50 };

  const handleToggle = (id: string) => {
    if (soundEnabled) playSound('complete');
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
    onToggleMilestone(id);
  };

  const confirmDelete = () => {
    if (!deletingMilestone) return;
    if (soundEnabled) playSound('delete');
    onDeleteMilestone(deletingMilestone.id);
    if (selectedMilestoneId === deletingMilestone.id) {
      onSelectMilestone(null);
    }
    setDeletingMilestone(null);
  };

  // Safety Guard: If no milestones, return a fallback empty state to prevent white screen
  if (!milestones || milestones.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Compass className="w-12 h-12 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest">Chưa có cột mốc nào</p>
      </div>
    );
  }

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPct = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-cyan-500/35 shadow-[0_20px_50px_rgba(2,6,23,0.9)] bg-gradient-to-b from-[#050f24] via-[#091a3c] to-[#040a18] select-none">
      
      {/* CUSTOM CSS FOR GAME-LIKE HOP ANIMATION */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes game-hop {
          0%, 100% { transform: translateY(0) scaleX(1) scaleY(1); }
          25% { transform: translateY(-30px) scaleX(0.9) scaleY(1.1); }
          50% { transform: translateY(-45px) scaleX(1) scaleY(1); }
          75% { transform: translateY(-30px) scaleX(1.1) scaleY(0.9); }
        }
        .animate-game-hop {
          animation: game-hop 0.7s cubic-bezier(0.45, 0, 0.55, 1) forwards;
        }
        @keyframes bar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-bar-pulse {
          animation: bar-pulse 2s infinite;
        }
      `}} />

      {/* MAP TOP BAR: Clean Gamified Header in Celestial Navy */}
      <div className="relative z-30 pt-3 px-4 sm:px-6 pb-3 bg-gradient-to-r from-[#06142a] via-[#0b244d] to-[#081734] border-b border-cyan-500/30 text-white shadow-md">
        {/* Luminous Neon Cyan Progress Bar */}
        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-2.5 border border-cyan-400/30 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(6,182,212,0.9)]"
            style={{ width: `${Math.max(progressPct, 6)}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-cyan-200 tracking-wide drop-shadow-xs">
              Cột mốc hoàn thành
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-sm mt-0.5">
              {goalTitle}
            </h3>
          </div>

          {/* Action buttons: Sound, Add milestone, Delete Goal */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md interactive-spring ${
                soundEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30' : 'bg-black/30 text-white/60'
              }`}
              title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onAddMilestoneClick && (
              <button
                onClick={() => {
                  if (soundEnabled) playSound('click');
                  onAddMilestoneClick();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/30 flex items-center gap-1.5 transition active:scale-95 interactive-spring"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Thêm mốc</span>
              </button>
            )}

            {/* SỌT RÁC XOÁ LỘ TRÌNH */}
            {onDeleteGoalClick && (
              <button
                onClick={() => {
                  if (soundEnabled) playSound('click');
                  onDeleteGoalClick();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition active:scale-95 border border-rose-400/40 interactive-spring"
                title="Xoá lộ trình này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xoá lộ trình</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GAME BOARD CANVAS (COSMIC TRAIL & STARRY DEPTH) */}
      <div className="relative w-full min-h-[300px] sm:min-h-[320px] overflow-hidden bg-[#040816]">
        
        {/* SVG Decorative Background: Starway, Glowing Path, Starlight */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Cosmic Slope Gradient */}
            <linearGradient id="cosmicSlopeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0d244c" />
              <stop offset="100%" stopColor="#071329" />
            </linearGradient>

            {/* Neon Path Gradient */}
            <linearGradient id="pathGradientNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Cosmic Space Contour */}
          <path d="M 0,100 L 100,100 L 100,0 Q 50,20 0,0 Z" fill="url(#cosmicSlopeGrad)" opacity="0.3" />

          {/* Winding Luminous Trail */}
          {svgPathData && (
            <>
              {/* Outer Neon Halo */}
              <path
                d={svgPathData}
                fill="none"
                stroke="#0284c7"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
                filter="url(#laserGlow)"
              />
              {/* Inner Glowing Trail Body */}
              <path
                d={svgPathData}
                fill="none"
                stroke="url(#pathGradientNeon)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
              {/* Center Bright Starlight Dash */}
              <path
                d={svgPathData}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeDasharray="2 4"
                strokeLinecap="round"
                opacity="0.75"
              />
            </>
          )}
        </svg>

        {/* CELESTIAL STARRY PARTICLES & ORBS */}
        <div className="absolute top-[8%] left-[10%] pointer-events-none w-2 h-2 rounded-full bg-cyan-400 blur-xs shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
        <div className="absolute top-[22%] right-[12%] pointer-events-none w-1.5 h-1.5 rounded-full bg-indigo-400 blur-xs shadow-[0_0_6px_rgba(99,102,241,0.9)] animate-pulse" />
        <div className="absolute bottom-[18%] left-[15%] pointer-events-none w-2 h-2 rounded-full bg-teal-300 blur-xs shadow-[0_0_8px_rgba(45,212,191,0.9)] animate-pulse" />
        <div className="absolute bottom-[10%] right-[25%] pointer-events-none w-1.5 h-1.5 rounded-full bg-amber-300 blur-xs shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse" />

        {/* MILESTONE NODES (3D Pedestals with Golden Stars) */}
        {milestones.map((m, idx) => {
          const coord = coordinates[idx] || { x: 50, y: 50 };
          const isCompleted = m.status === 'completed';
          const isInProgress = m.status === 'in_progress';
          const isLocked = m.status === 'locked';
          const isSelected = selectedMilestoneId === m.id;
          const stageNumber = idx + 1;

          return (
            <div
              key={m.id}
              style={{
                left: `${coord.x}%`,
                top: `${coord.y}%`
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
            >
              {/* Pedestal Shadow */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-12 sm:w-14 h-4 rounded-full bg-cyan-950/70 blur-[3px] pointer-events-none" />

              {/* 1 GOLDEN STAR ON TOP OF PEDESTAL */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className={`transition-all duration-300 ${
                  isCompleted 
                    ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] scale-110' 
                    : 'text-slate-500/30 scale-75 opacity-30'
                }`}>
                  <Star className="w-5 h-5 fill-current" />
                </div>
              </div>

              {/* 3D CIRCULAR BLUE PEDESTAL BUTTON */}
              <button
                onClick={() => {
                  if (soundEnabled) playSound('click');
                  onSelectMilestone(m);
                }}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 transform active:scale-95 cursor-pointer outline-none ${
                  isSelected ? 'scale-115 ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#040816] shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'hover:scale-110'
                }`}
              >
                {/* Cylinder Side */}
                <div className={`absolute inset-0 rounded-full transition-shadow duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 shadow-[0_3px_0_#064e3b]'
                    : isInProgress
                    ? 'bg-cyan-600 shadow-[0_3px_0_#0369a1]'
                    : 'bg-[#1e293b] shadow-[0_3px_0_#0f172a]'
                }`} />

                {/* Cylinder Top Disk */}
                <div className={`absolute inset-0.5 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-b from-emerald-400 to-teal-500 border-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.7)]'
                    : isInProgress
                    ? 'bg-gradient-to-b from-cyan-300 to-blue-500 border-white shadow-[0_0_18px_rgba(6,182,212,0.8)] animate-pulse'
                    : 'bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-cyan-500/20 text-slate-500'
                }`}>
                  {/* Glossy Reflection Highlight */}
                  <div className="absolute top-1 left-2 right-2 h-2.5 rounded-full bg-white/40 pointer-events-none" />

                  {/* Icon or Stage Number */}
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-white stroke-[4] drop-shadow-sm" />
                  ) : (
                    <span className={`text-xl sm:text-2xl font-black font-sans leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] ${
                      isInProgress
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}>
                      {stageNumber}
                    </span>
                  )}

                  {/* Tiny Lock Icon for Locked stages */}
                  {isLocked && (
                    <Lock className="w-2.5 h-2.5 text-slate-400 absolute bottom-1.5" />
                  )}
                </div>

                {/* Active Stage Pulsing Ring */}
                {isInProgress && (
                  <div className="absolute -inset-2 rounded-full border-2 border-cyan-300 animate-ping opacity-75 pointer-events-none" />
                )}
              </button>

              {/* Title Tooltip on Hover (when not selected) */}
              {!isSelected && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#091730]/95 text-cyan-200 text-[10px] font-bold px-2.5 py-1 rounded-lg pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-40 shadow-lg border border-cyan-500/30 max-w-[160px] truncate">
                  {m.title}
                </div>
              )}

              {/* SỌT RÁC XOÁ CỘT MỐC TRỰC TIẾP */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingMilestone(m);
                }}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg z-30 cursor-pointer active:scale-90 border-2 border-white transition-transform hover:scale-110 interactive-spring"
                title={`Xoá cột mốc "${m.title}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* POPOVER CARD ANCHORED DIRECTLY TO MILESTONE NODE - LUXURY NAVY DIALOG */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    absolute z-[60] w-72 sm:w-80 bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border-2 border-cyan-400 rounded-3xl p-4 dialog-depth-shadow text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200 cursor-default text-left
                    ${coord.y > 60 ? 'bottom-full mb-3' : 'top-full mt-3'}
                    ${coord.x > 65 ? 'right-0' : coord.x < 35 ? 'left-0' : 'left-1/2 -translate-x-1/2'}
                  `}
                >
                  {/* Arrow Tip */}
                  <div className={`absolute w-3.5 h-3.5 bg-white dark:bg-[#0c1a35] border-2 border-cyan-400 rotate-45 z-10 ${
                    coord.y > 60 
                      ? '-bottom-2 border-t-0 border-l-0' 
                      : '-top-2 border-b-0 border-r-0'
                  } ${
                    coord.x > 65 ? 'right-6' : coord.x < 35 ? 'left-6' : 'left-1/2 -translate-x-1/2'
                  }`} />

                  {/* POPOVER HEADER */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-cyan-900/40 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-black text-[9px] uppercase tracking-wider border border-cyan-300/40">
                        Mốc #{stageNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                          : isInProgress 
                          ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {isCompleted ? '✓ Hoàn thành' : isInProgress ? '⚡ Đang làm' : '🔒 Khóa'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMilestone(null);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-[#09152b] transition cursor-pointer"
                      title="Đóng popover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* POPOVER CONTENT */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {/* SUBTASKS & EXERCISES CHECKLIST */}
                    {(() => {
                      const mTasks = getMilestoneTasks(m);
                      const completedCount = mTasks.filter(t => t.done).length;
                      return (
                        <div className="bg-slate-50 dark:bg-[#071326] border border-slate-200/80 dark:border-cyan-500/30 rounded-2xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-cyan-200">
                              <ListTodo className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Nhiệm vụ ({completedCount}/{mTasks.length})</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-400 tabular-nums">+{m.rewardPoints || 100} EXP</span>
                          </div>

                          {/* List of Subtasks */}
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                            {mTasks.map((task) => (
                              <label
                                key={task.id}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#0c1a35] transition cursor-pointer text-xs group/item"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.done}
                                  onChange={() => handleToggleSubtask(m.id, task.id)}
                                  className="mt-0.5 rounded border-slate-300 dark:border-cyan-500/40 text-cyan-500 focus:ring-cyan-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className={`flex-1 text-[11px] leading-tight transition-all ${
                                  task.done 
                                    ? 'line-through text-slate-400 dark:text-slate-500 font-medium' 
                                    : 'text-slate-700 dark:text-slate-200 font-semibold'
                                }`}>
                                  {task.text}
                                </span>
                              </label>
                            ))}
                          </div>

                          {/* Add Subtask Input */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-cyan-900/40">
                            <input
                              type="text"
                              value={newSubtaskInput}
                              onChange={(e) => setNewSubtaskInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddSubtask(m.id);
                                }
                              }}
                              placeholder="Thêm bài tập/mục tiêu..."
                              className="flex-1 bg-white dark:bg-[#09152b] text-xs px-3 py-2 rounded-2xl border border-slate-200 dark:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            <button
                              onClick={() => handleAddSubtask(m.id)}
                              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs transition active:scale-95 shrink-0 interactive-spring"
                            >
                              Thêm
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* POPOVER ACTION BUTTONS */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleToggle(m.id)}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-black shadow-md transition active:scale-95 flex items-center justify-center gap-2 interactive-spring ${
                          isCompleted
                            ? 'bg-slate-100 dark:bg-[#09152b] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            : 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Đặt lại mốc</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-black">✓ ✓</span>
                            <span>Vượt mốc</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setDeletingMilestone(m)}
                        className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-200 dark:border-rose-800 transition active:scale-90 shrink-0 interactive-spring"
                        title="Xoá cột mốc này"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* PLAYER AVATAR TOKEN */}
        {milestones.length > 0 && avatarPos && (
          <div
            style={{
              left: `${avatarPos.x + 5}%`,
              top: `${avatarPos.y - 3}%`,
              transition: 'left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
          >
            {/* Avatar container with hop/jump animation */}
            <div className={`relative flex flex-col items-center ${
              isJumping ? 'animate-game-hop' : 'translate-y-0'
            }`}>
              
              {/* SPEECH BUBBLE: "BẠN ĐANG Ở ĐÂY!" */}
              <div className="mb-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-[8px] shadow-[0_0_10px_rgba(6,182,212,0.6)] border border-white flex items-center gap-1 whitespace-nowrap animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                <span>Bạn đang ở đây!</span>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rotate-45 border-r border-b border-white" />
              </div>

              {/* Avatar Token Ring */}
              <div className="relative">
                {/* Glowing Crown on avatar */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                  <Crown className="w-4 h-4 fill-amber-400 stroke-amber-600" />
                </div>

                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-teal-300 to-indigo-400 shadow-xl border border-white ring-2 ring-cyan-400/80 transition-transform ${facingLeft ? '-scale-x-100' : 'scale-x-100'}`}>
                  <Avatar
                    src={studentProfile?.avatar}
                    fallbackText={studentProfile?.name || 'HS'}
                    sizeClassName="w-full h-full rounded-full"
                    bgClassName="bg-cyan-700"
                    textClassName="text-white font-black text-[10px]"
                  />
                </div>

                {/* Level badge */}
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[9px] shadow-xs border border-white">
                  L{studentProfile?.className?.slice(0, 2) || '12'}
                </div>
              </div>

              {/* Shadow underneath avatar while jumping */}
              <div className={`w-8 h-2 rounded-full bg-cyan-950/80 blur-[2px] transition-all duration-300 mt-1 ${
                isJumping ? 'scale-50 opacity-20' : 'scale-100 opacity-70'
              }`} />
            </div>
          </div>
        )}

        {/* CELEBRATION OVERLAY (When a milestone is completed) */}
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(6,182,212,0.8)] border-2 border-white animate-bounce flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
              <span>CỘT MỐC HOÀN THÀNH! NHẢY SANG MỐC TIẾP THEO! 🚀</span>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER INSPECTOR: Selected Milestone Details - LUXURY NAVY */}
      <div className="relative z-30 p-4 sm:p-5 bg-white/95 dark:bg-[#061226]/95 backdrop-blur-md border-t border-cyan-500/25 text-slate-800 dark:text-slate-100">
        {selectedMilestone ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 font-black shadow-md ${
                selectedMilestone.status === 'completed'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                  : selectedMilestone.status === 'in_progress'
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-cyan-500/30'
                  : 'bg-slate-200 dark:bg-[#09152b] text-slate-500 dark:text-slate-400'
              }`}>
                {selectedMilestone.rewardBadge?.split(' ')[0] || '🎯'}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Mốc {milestones.findIndex(m => m.id === selectedMilestone.id) + 1} / {milestones.length}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedMilestone.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-400/30 tabular-nums">
                    +{selectedMilestone.rewardPoints || 100} EXP
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 leading-snug">
                  {selectedMilestone.description}
                </p>
              </div>
            </div>

            {/* Actions: Toggle Complete & SỌT RÁC XOÁ CỘT MỐC NÀY */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => handleToggle(selectedMilestone.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5 interactive-spring ${
                  selectedMilestone.status === 'completed'
                    ? 'bg-slate-100 dark:bg-[#09152b] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
              >
                {selectedMilestone.status === 'completed' ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại mốc này</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>✓ Vượt qua mốc này!</span>
                  </>
                )}
              </button>

              {/* SỌT RÁC XOÁ MỐC */}
              <button
                onClick={() => setDeletingMilestone(selectedMilestone)}
                className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition active:scale-90 interactive-spring"
                title="Xoá cột mốc này"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectMilestone(null)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-cyan-300 transition interactive-spring"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>
                Nhấp vào bục số để vượt qua mốc hoặc cập nhật nhiệm vụ chi tiết.
              </span>
            </div>

            <div className="text-[10px] font-black uppercase text-cyan-400/80 tracking-widest">
              RPG Quest Map
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM DELETE MODAL - LUXURY NAVY DIALOG */}
      {deletingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-gradient-to-b dark:from-[#0c1a35] dark:via-[#081326] dark:to-[#050b16] border border-slate-200 dark:border-rose-500/35 rounded-3xl p-5 dialog-depth-shadow space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Xoá cột mốc này?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  "{deletingMilestone.title}"
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xoá cột mốc này khỏi bản đồ học tập không? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-cyan-900/40">
              <button
                onClick={() => setDeletingMilestone(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#09152b] transition interactive-spring"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition active:scale-95 flex items-center gap-1.5 interactive-spring"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
