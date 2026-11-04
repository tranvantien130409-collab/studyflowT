import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Headphones, 
  Sparkles,
  ChevronDown,
  Music,
  Radio
} from 'lucide-react';
import { lofiEngine, LOFI_STATIONS, LofiStationId } from '../utils/lofiAudioEngine';

interface LofiPlayerProps {
  isPomodoroRunning?: boolean;
  compact?: boolean;
}

export const LofiPlayer: React.FC<LofiPlayerProps> = ({ isPomodoroRunning = false, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStation, setCurrentStation] = useState<LofiStationId>('lofi-beats');
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('studyflow_lofi_volume');
      return saved ? parseFloat(saved) : 0.65;
    } catch {
      return 0.65;
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoPlayWithTimer, setAutoPlayWithTimer] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('studyflow_lofi_autoplay');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  // Sync volume with engine
  useEffect(() => {
    lofiEngine.setVolume(isMuted ? 0 : volume);
    localStorage.setItem('studyflow_lofi_volume', volume.toString());
  }, [volume, isMuted]);

  useEffect(() => {
    localStorage.setItem('studyflow_lofi_autoplay', JSON.stringify(autoPlayWithTimer));
  }, [autoPlayWithTimer]);

  // Handle auto-play when Pomodoro starts
  useEffect(() => {
    if (autoPlayWithTimer) {
      if (isPomodoroRunning && !isPlaying) {
        lofiEngine.play(currentStation);
        setIsPlaying(true);
      }
    }
  }, [isPomodoroRunning, autoPlayWithTimer, currentStation, isPlaying]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      lofiEngine.pause();
      setIsPlaying(false);
    } else {
      lofiEngine.play(currentStation);
      setIsPlaying(true);
    }
  };

  const handleSelectStation = (stationId: LofiStationId) => {
    setCurrentStation(stationId);
    if (isPlaying) {
      lofiEngine.switchStation(stationId);
    }
  };

  const activeStationObj = LOFI_STATIONS.find(s => s.id === currentStation) || LOFI_STATIONS[0];

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900/40 dark:from-indigo-950/70 dark:via-purple-950/50 dark:to-slate-950/80 border border-indigo-200/50 dark:border-indigo-800/40 rounded-3xl p-5 shadow-lg backdrop-blur-sm transition-all text-slate-800 dark:text-slate-100">
      {/* Player Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/40' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <Headphones className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1.5">
                <span>Trình phát Lo-fi & Âm thanh Tập trung</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Live
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{activeStationObj.icon}</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeStationObj.name}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="truncate max-w-[180px] sm:max-w-none">{activeStationObj.tagline}</span>
            </p>
          </div>
        </div>

        {/* Quick Play & Expand Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow-md active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Phát nhạc</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? 'Thu gọn bộ phát' : 'Mở rộng tùy chỉnh'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Station Selectors & Volume */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 space-y-4">
          {/* Equalizer Visualizer Bars when playing */}
          <div className="flex items-center justify-between px-3 py-2 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isPlaying ? 'text-indigo-500 animate-spin' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isPlaying ? 'Đang phát không gian âm thanh:' : 'Sẵn sàng phát:'}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {activeStationObj.name}
              </span>
            </div>

            {/* Sound Wave Animation */}
            <div className="flex items-center gap-1 h-4">
              <span className={`w-1 rounded-full bg-indigo-500 transition-all ${isPlaying ? 'h-4 animate-bounce' : 'h-1.5'}`} style={{ animationDelay: '0ms' }} />
              <span className={`w-1 rounded-full bg-indigo-500 transition-all ${isPlaying ? 'h-3 animate-bounce' : 'h-2'}`} style={{ animationDelay: '150ms' }} />
              <span className={`w-1 rounded-full bg-indigo-500 transition-all ${isPlaying ? 'h-5 animate-bounce' : 'h-1'}`} style={{ animationDelay: '300ms' }} />
              <span className={`w-1 rounded-full bg-indigo-500 transition-all ${isPlaying ? 'h-2 animate-bounce' : 'h-2.5'}`} style={{ animationDelay: '75ms' }} />
              <span className={`w-1 rounded-full bg-indigo-500 transition-all ${isPlaying ? 'h-4 animate-bounce' : 'h-1.5'}`} style={{ animationDelay: '220ms' }} />
            </div>
          </div>

          {/* Stations Selector Grid */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
              Chọn kênh âm thanh thư giãn:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {LOFI_STATIONS.map((station) => {
                const isSelected = station.id === currentStation;
                return (
                  <button
                    key={station.id}
                    onClick={() => handleSelectStation(station.id)}
                    className={`p-2.5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{station.icon}</span>
                      <span className="text-xs font-extrabold truncate">{station.name}</span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {station.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls: Volume Slider & Auto-play switch */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Volume Control */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={isMuted ? 'Bật âm lượng' : 'Tắt tiếng'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-24 sm:w-32 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-[36px]">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Auto Play Option */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPlayWithTimer}
                onChange={(e) => setAutoPlayWithTimer(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:border-slate-700 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tự động phát khi bấm bắt đầu Pomodoro
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
