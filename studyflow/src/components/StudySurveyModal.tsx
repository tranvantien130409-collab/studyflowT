import React, { useState } from 'react';
import { 
  X, 
  Target, 
  Clock, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Brain,
  Zap
} from 'lucide-react';

interface StudySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SurveyData) => void;
}

export interface SurveyData {
  focusSubject: string;
  targetHours: number;
  durationWeeks: number;
  freeTimeSlots: string[];
}

const SUBJECTS = ['Toán học', 'Vật lý', 'Hóa học', 'Ngữ văn', 'Tiếng Anh', 'Sinh học', 'Lịch sử', 'Địa lý'];
const TIME_SLOTS = [
  '05:00 - 07:00 (Sáng sớm)',
  '08:00 - 11:00 (Sáng)',
  '14:00 - 17:00 (Chiều)',
  '19:00 - 21:00 (Tối)',
  '21:00 - 23:00 (Khuya)'
];

export const StudySurveyModal: React.FC<StudySurveyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SurveyData>({
    focusSubject: 'Toán học',
    targetHours: 20,
    durationWeeks: 4,
    freeTimeSlots: []
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const toggleTimeSlot = (slot: string) => {
    setData(prev => ({
      ...prev,
      freeTimeSlots: prev.freeTimeSlots.includes(slot)
        ? prev.freeTimeSlots.filter(s => s !== slot)
        : [...prev.freeTimeSlots, slot]
    }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#071328] border border-slate-200 dark:border-cyan-500/30 rounded-[32px] w-full max-w-lg overflow-hidden dialog-depth-shadow relative shadow-2xl transition-all duration-300">
        
        {/* Neon Gradient Header Glow Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-300 interactive-spring"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Progress Indicator with Neon Glow */}
          <div className="flex items-center gap-2.5 mb-8">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === step 
                    ? 'w-10 bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' 
                    : i < step 
                    ? 'w-5 bg-cyan-600/60 dark:bg-cyan-500/40' 
                    : 'w-4 bg-slate-200 dark:bg-slate-800'
                }`} 
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Môn học bạn muốn tập trung nhất?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">StudyFlow AI sẽ ưu tiên phân bổ thời gian & lộ trình cho môn học này.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setData({ ...data, focusSubject: sub })}
                    className={`px-4 py-3.5 rounded-2xl text-xs font-black transition-all duration-200 border interactive-spring ${
                      data.focusSubject === sub 
                        ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 text-white border-cyan-400/60 shadow-[0_4px_16px_rgba(6,182,212,0.35)] scale-[1.02]' 
                        : 'bg-slate-50 dark:bg-[#0c1e3d]/60 border-slate-200 dark:border-cyan-900/40 text-slate-700 dark:text-slate-300 hover:border-cyan-500/40 hover:bg-cyan-500/5'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Clock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Mục tiêu thời gian của bạn?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chúng tôi sẽ tính toán lộ trình học tập tối ưu theo tuần.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">Tổng số giờ mục tiêu</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      step="5"
                      value={data.targetHours}
                      onChange={(e) => setData({ ...data, targetHours: parseInt(e.target.value) })}
                      className="flex-1 accent-cyan-500 cursor-pointer"
                    />
                    <span className="w-16 text-center font-black text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 py-2 rounded-xl border border-cyan-200 dark:border-cyan-800/60 shadow-inner">
                      {data.targetHours}h
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">Thời gian thực hiện dự kiến (tuần)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 8].map(w => (
                      <button
                        key={w}
                        onClick={() => setData({ ...data, durationWeeks: w })}
                        className={`py-3 rounded-2xl text-xs font-black transition-all duration-200 border interactive-spring ${
                          data.durationWeeks === w 
                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-indigo-400/60 shadow-[0_4px_16px_rgba(99,102,241,0.35)] scale-[1.03]' 
                            : 'bg-slate-50 dark:bg-[#0c1e3d]/60 border-slate-200 dark:border-indigo-900/40 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40'
                        }`}
                      >
                        {w} Tuần
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Các khung giờ rảnh hàng tuần?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI sẽ tự động phân bổ lịch học vào các khung giờ này.</p>
              </div>

              <div className="space-y-2.5">
                {TIME_SLOTS.map(slot => {
                  const isSelected = data.freeTimeSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleTimeSlot(slot)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 rounded-[20px] transition-all duration-200 border interactive-spring ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-cyan-900/20 dark:from-cyan-950/60 dark:to-indigo-950/40 border-cyan-400/60 shadow-[0_0_14px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-50 dark:bg-[#0c1e3d]/50 border-slate-200 dark:border-cyan-950 hover:border-cyan-500/30'
                      }`}
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-cyan-700 dark:text-cyan-300 font-extrabold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {slot}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 flex items-center gap-3">
            {step > 1 && (
              <button 
                onClick={handlePrev}
                className="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider interactive-spring"
              >
                Quay lại
              </button>
            )}
            
            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 interactive-spring"
              >
                <span>Tiếp tục</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => onSubmit(data)}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 group interactive-spring"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Gửi cho AI phân tích</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Branding Footnote with Deep Navy Glass */}
        <div className="px-8 py-3.5 bg-slate-50 dark:bg-[#050e1e]/80 flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800/80">
          <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-cyan-400/80">Powered by Gemini AI Engine</span>
        </div>
      </div>
    </div>
  );
};
