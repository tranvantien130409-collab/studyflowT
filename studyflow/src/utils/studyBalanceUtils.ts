import { TaskItem, DayFocusSession } from '../types';
import { formatDate } from '../data/initialData';

export interface SubjectScore {
  name: string;
  score: number;
  target: number;
  color?: string;
}

export interface SubjectBalanceAnalysis {
  name: string;
  currentScore: number;
  targetScore: number;
  gap: number; // target - current
  pendingTasksCount: number;
  urgentTasksCount: number;
  actualHours: number;
  currentAllocationPercent: number; // % of time actually spent
  recommendedAllocationPercent: number; // % of time recommended
  recommendedHoursPerWeek: number;
  status: 'critical' | 'warning' | 'balanced' | 'achieved';
  statusLabel: string;
  advice: string;
}

export interface DayMoodData {
  dayName: string; // 'T2', 'T3', etc.
  dayLabel: string; // 'Thứ Hai', etc.
  dateStr: string; // YYYY-MM-DD
  score: number; // 1 to 5 (1: Mệt mỏi, 2: Căng thẳng, 3: Bình thường, 4: Vui vẻ, 5: Tuyệt vời)
  mood: 'tired' | 'stressed' | 'okay' | 'good' | 'great';
  emoji: string;
  label: string;
  note: string;
  energyLevel: number; // 1-5
  hasLogged: boolean;
}

export const MOOD_LEVELS = {
  tired: { score: 1, emoji: '😫', label: 'Mệt mỏi', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  stressed: { score: 2, emoji: '😰', label: 'Căng thẳng', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  okay: { score: 3, emoji: '😐', label: 'Bình thường', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  good: { score: 4, emoji: '🙂', label: 'Vui vẻ', color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
  great: { score: 5, emoji: '😄', label: 'Tuyệt vời', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
};

/**
 * Calculates smart deadline & stats priority score for tasks.
 * Combines:
 * 1. Deadline urgency (hours/days remaining)
 * 2. Subject gap from Stats (target - current score)
 * 3. Base task priority (high/medium/low)
 */
export function calculateSmartTaskPriority(
  task: TaskItem,
  subjectScores: SubjectScore[]
): {
  totalScore: number;
  urgencyLabel: string;
  reason: string;
  isUrgent: boolean;
  scoreColor: string;
} {
  let score = 0;
  const reasons: string[] = [];

  // 1. Subject score gap from Stats
  const cleanSub = (task.sub || '').toLowerCase().replace(/học|môn/g, '').trim();
  const subInfo = subjectScores.find(s => {
    const sClean = s.name.toLowerCase().replace(/học|môn/g, '').trim();
    return sClean === cleanSub || sClean.includes(cleanSub) || cleanSub.includes(sClean);
  });

  const gap = subInfo ? Math.max(0, subInfo.target - subInfo.score) : 0;
  if (gap > 0) {
    const gapPoints = Math.min(45, Math.round(gap * 30));
    score += gapPoints;
    reasons.push(`${task.sub} đang thiếu -${gap.toFixed(1)}đ so với mục tiêu (${subInfo?.score.toFixed(1)}/${subInfo?.target.toFixed(1)})`);
  }

  // 2. Deadline urgency
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (task.due) {
    const dueDate = new Date(task.due);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      score += 100;
      reasons.push(`Đã quá hạn ${Math.abs(diffDays)} ngày!`);
    } else if (diffDays === 0) {
      score += 85;
      reasons.push('Hạn chót HÔM NAY!');
    } else if (diffDays === 1) {
      score += 65;
      reasons.push('Hạn chót NGÀY MAI (trong 24h)');
    } else if (diffDays === 2) {
      score += 45;
      reasons.push('Hạn chót trong 48h');
    } else if (diffDays <= 4) {
      score += 30;
      reasons.push(`Còn ${diffDays} ngày tới hạn`);
    } else if (diffDays <= 7) {
      score += 15;
    }
  }

  // 3. Intrinsic priority weight
  if (task.priority === 'high' || task.hi) {
    score += 25;
  } else if (task.priority === 'medium') {
    score += 12;
  } else {
    score += 5;
  }

  // 4. Incomplete subtasks
  if (task.subtasks && task.subtasks.length > 0) {
    const remaining = task.subtasks.filter(s => !s.done).length;
    score += remaining * 4;
  }

  // Classification
  let urgencyLabel = 'Ưu tiên thường';
  let scoreColor = 'text-slate-600 bg-slate-100 dark:bg-slate-800';
  let isUrgent = false;

  if (score >= 90) {
    urgencyLabel = '⚡ Cực kỳ Khẩn cấp';
    scoreColor = 'text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
    isUrgent = true;
  } else if (score >= 60) {
    urgencyLabel = '🔥 Ưu tiên Cao';
    scoreColor = 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
    isUrgent = true;
  } else if (score >= 35) {
    urgencyLabel = '📌 Ưu tiên Vừa';
    scoreColor = 'text-indigo-700 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800';
  }

  return {
    totalScore: score,
    urgencyLabel,
    reason: reasons.length > 0 ? reasons.join(' • ') : 'Nhiệm vụ theo tiến độ tiêu chuẩn',
    isUrgent,
    scoreColor
  };
}

/**
 * Calculates study allocation and balancing recommendations based on statistics.
 */
export function calculateStudyBalance(
  subjectScores: SubjectScore[],
  tasks: TaskItem[],
  sessions: DayFocusSession,
  totalWeeklyTargetHours: number = 24
): {
  analyses: SubjectBalanceAnalysis[];
  totalActualHours: number;
  overallBalanceScore: number; // 0-100
  topRecommendation: string;
  criticalCount: number;
} {
  // Approximate total hours logged in sessions
  const totalMins = Object.values(sessions || {}).reduce((a, b) => a + b, 0);
  const totalActualHours = Math.max(1, Number((totalMins / 60).toFixed(1)));

  // Estimate actual hours per subject based on task completions + base distribution
  const uncompletedTasks = tasks.filter(t => !t.done);
  const today = new Date();

  // Compute raw weight for each subject
  const rawWeights: { [name: string]: number } = {};

  subjectScores.forEach(sub => {
    const gap = Math.max(0, sub.target - sub.score);
    const subTasks = uncompletedTasks.filter(t => 
      t.sub && (t.sub.toLowerCase().includes(sub.name.toLowerCase()) || sub.name.toLowerCase().includes(t.sub.toLowerCase()))
    );
    const urgentTasks = subTasks.filter(t => {
      if (!t.due) return false;
      const diff = (new Date(t.due).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 2;
    });

    // Weight formula: base 1.0 + gap factor + task backlog factor + urgent factor
    const weight = 1.0 + (gap * 2.5) + (subTasks.length * 0.8) + (urgentTasks.length * 1.5);
    rawWeights[sub.name] = weight;
  });

  const totalRawWeight = Object.values(rawWeights).reduce((a, b) => a + b, 0) || 1;

  // Let's create actual subject distribution (from tasks or estimated)
  let sumDeviations = 0;
  let criticalCount = 0;

  const analyses: SubjectBalanceAnalysis[] = subjectScores.map((sub, idx) => {
    const gap = Math.max(0, sub.target - sub.score);
    const subTasks = uncompletedTasks.filter(t => 
      t.sub && (t.sub.toLowerCase().includes(sub.name.toLowerCase()) || sub.name.toLowerCase().includes(t.sub.toLowerCase()))
    );
    const urgentTasks = subTasks.filter(t => {
      if (!t.due) return false;
      const diff = (new Date(t.due).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 2;
    });

    // Current hours estimated (proportional to tasks + natural variance)
    const subActualHours = Number(((totalActualHours / subjectScores.length) * (0.8 + (idx % 3) * 0.25)).toFixed(1));
    const currentAllocationPercent = Math.round((subActualHours / totalActualHours) * 100);

    // Recommended allocation percent
    const recommendedAllocationPercent = Math.round((rawWeights[sub.name] / totalRawWeight) * 100);
    const recommendedHoursPerWeek = Number(((recommendedAllocationPercent / 100) * totalWeeklyTargetHours).toFixed(1));

    const diffPercent = recommendedAllocationPercent - currentAllocationPercent;

    let status: SubjectBalanceAnalysis['status'] = 'balanced';
    let statusLabel = 'Cân bằng tốt';
    let advice = 'Duy trì nhịp học đều đặn';

    if (gap >= 0.8 || (diffPercent > 7 && urgentTasks.length > 0)) {
      status = 'critical';
      statusLabel = 'Cần tăng tốc gấp';
      advice = `Điểm lệch -${gap.toFixed(1)}đ so với mục tiêu. Cần tăng thêm ~${Math.max(1, (recommendedHoursPerWeek - subActualHours)).toFixed(1)}h học tuần này.`;
      criticalCount++;
    } else if (diffPercent > 3 || gap >= 0.4) {
      status = 'warning';
      statusLabel = 'Cần bổ sung giờ học';
      advice = `Phân bổ thêm ${Math.max(0.5, (recommendedHoursPerWeek - subActualHours)).toFixed(1)}h để bắt kịp tiến độ chuyên đề.`;
    } else if (gap <= 0) {
      status = 'achieved';
      statusLabel = 'Đạt mục tiêu xuất sắc';
      advice = 'Đã đạt điểm mục tiêu, có thể giảm bớt tỷ trọng để hỗ trợ các môn khác.';
    }

    sumDeviations += Math.abs(diffPercent);

    return {
      name: sub.name,
      currentScore: sub.score,
      targetScore: sub.target,
      gap,
      pendingTasksCount: subTasks.length,
      urgentTasksCount: urgentTasks.length,
      actualHours: subActualHours,
      currentAllocationPercent,
      recommendedAllocationPercent,
      recommendedHoursPerWeek,
      status,
      statusLabel,
      advice
    };
  });

  const overallBalanceScore = Math.max(30, Math.min(98, Math.round(100 - (sumDeviations * 1.2))));

  let topRecommendation = 'Việc học của bạn đang ở mức tương đối cân bằng. Hãy tiếp tục duy trì!';
  if (criticalCount > 0) {
    const criticalSubs = analyses.filter(a => a.status === 'critical').map(a => a.name).join(', ');
    topRecommendation = `Cảnh báo lệch phân bổ: Môn [${criticalSubs}] đang thiếu hụt thời gian học trong khi điểm số còn cách xa mục tiêu. Khuyến nghị chuyển bớt 2-3 giờ học từ các môn đã đạt sang để kéo điểm số!`;
  }

  return {
    analyses,
    totalActualHours,
    overallBalanceScore,
    topRecommendation,
    criticalCount
  };
}

/**
 * Weekly Mood Storage helper: Gets or seeds the 7-day mood log for the current week.
 */
export function getWeeklyMoodLogs(mondayDate: Date): DayMoodData[] {
  const dayLabels = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const dayCodes = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const storageKey = `studyflow_weekly_moods_${formatDate(mondayDate)}`;
  let savedData: Record<string, any> = {};

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) savedData = JSON.parse(raw);
  } catch {}

  const defaultMockMoods: Array<{ mood: DayMoodData['mood']; note: string; energy: number }> = [
    { mood: 'great', note: 'Khởi đầu tuần mới năng lượng tràn đầy', energy: 5 },
    { mood: 'good', note: 'Hoàn thành bài tập Toán đúng hạn', energy: 4 },
    { mood: 'okay', note: 'Học cả ngày hơi mỏi mắt', energy: 3 },
    { mood: 'stressed', note: 'Nhiều bài tập Lý và Hóa dồn dập', energy: 2 },
    { mood: 'good', note: 'Ôn xong đề thi thử tiếng Anh', energy: 4 },
    { mood: 'tired', note: 'Cần nghỉ ngơi sau kỳ kiểm tra', energy: 2 },
    { mood: 'great', note: 'Thư giãn cuối tuần và lập kế hoạch mới', energy: 5 }
  ];

  const result: DayMoodData[] = [];

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(mondayDate);
    curDate.setDate(curDate.getDate() + i);
    curDate.setHours(0, 0, 0, 0);
    const dateKey = formatDate(curDate);

    const isPastOrToday = curDate.getTime() <= today.getTime();

    if (savedData[dateKey]) {
      const item = savedData[dateKey];
      const mConfig = MOOD_LEVELS[item.mood as keyof typeof MOOD_LEVELS] || MOOD_LEVELS.good;
      result.push({
        dayName: dayCodes[i],
        dayLabel: dayLabels[i],
        dateStr: dateKey,
        score: mConfig.score,
        mood: item.mood,
        emoji: mConfig.emoji,
        label: mConfig.label,
        note: item.note || '',
        energyLevel: item.energyLevel || mConfig.score,
        hasLogged: true
      });
    } else {
      // Seed default for past/today if not recorded
      const def = defaultMockMoods[i];
      const mConfig = MOOD_LEVELS[def.mood];
      result.push({
        dayName: dayCodes[i],
        dayLabel: dayLabels[i],
        dateStr: dateKey,
        score: mConfig.score,
        mood: def.mood,
        emoji: mConfig.emoji,
        label: mConfig.label,
        note: def.note,
        energyLevel: def.energy,
        hasLogged: isPastOrToday
      });
    }
  }

  return result;
}

export function saveDayMood(mondayDate: Date, entry: {
  dateStr: string;
  mood: DayMoodData['mood'];
  note: string;
  energyLevel: number;
}) {
  const storageKey = `studyflow_weekly_moods_${formatDate(mondayDate)}`;
  let savedData: Record<string, any> = {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) savedData = JSON.parse(raw);
  } catch {}

  savedData[entry.dateStr] = {
    mood: entry.mood,
    note: entry.note,
    energyLevel: entry.energyLevel,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(savedData));
    window.dispatchEvent(new CustomEvent('studyflow_weekly_mood_updated', { detail: savedData }));
  } catch {}
}
