export type EventType = 'class' | 'exam' | 'act' | 'due';

export interface CalendarEvent {
  id: number;
  t: string;          // Title / Subject name
  type: EventType;   // Event category
  dow?: number;      // Day of week: 0 (T2) to 6 (CN) for recurring
  date?: string;     // Specific date: YYYY-MM-DD
  h: number;         // Hour: e.g. 7, 7.5, 9
  d: number;         // Duration in hours: e.g. 1.4, 2
  room?: string;     // Classroom / Location
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface TaskSubtask {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskItem {
  id: number;
  t: string;          // Task title / description
  sub: string;        // Subject
  due: string;        // Due date: YYYY-MM-DD
  dueTime?: string;   // Due time: HH:mm (optional)
  done: boolean;      // Completed state (sync with status === 'done')
  status?: TaskStatus; // 'todo' | 'in_progress' | 'done'
  priority?: TaskPriority; // 'high' | 'medium' | 'low'
  hi?: boolean;       // High priority / urgent
  note?: string;      // Guidance / notes / instructions
  subtasks?: TaskSubtask[];
  quadrant?: 1 | 2 | 3 | 4;
  weight?: string;
  deadlineLabel?: string;
  aiReason?: string;
  actionBadge?: string;
  targetGap?: string;
}

export interface LibraryItem {
  id: number;
  t: string;          // Title
  sub: string;        // Subject
  type: string;       // 'Ghi chú' | 'Tài liệu' | 'Đề thi' | 'Mẫu bài' | 'Video' | etc.
  d: string;          // Description
  url?: string;       // Web link or data URL
  fav?: boolean;      // Favorite bookmark
  fileId?: string;
  fileName?: string;
  fileType?: 'pdf' | 'image' | 'text' | 'video' | 'audio' | 'link';
  fileContent?: string; // Text content for notes / summaries
}

export interface CountdownItem {
  id: number;
  title: string;              // e.g. "Kỳ thi Tốt nghiệp THPT Quốc gia"
  targetDate: string;         // YYYY-MM-DD
  targetTime?: string;        // HH:mm (default '07:30')
  category: 'thpt' | 'hsg' | 'term' | 'cert' | 'other';
  color?: string;             // Theme color: 'rose' | 'emerald' | 'amber' | 'blue' | 'purple'
  targetScore?: string;       // e.g. "Mục tiêu 28.5 điểm Khối A00"
  note?: string;              // Lời nhắn động lực
  createdAt?: string;
}

export interface DayFocusSession {
  [date: string]: number; // date (YYYY-MM-DD) -> minutes
}

export interface QuestionItem {
  id: number;
  questionText: string;
  options: string[]; // Array of 4 options
  correctOption: number; // 0: A, 1: B, 2: C, 3: D
  explanation?: string;
}

export interface ExamItem {
  id: number;
  title: string;              // e.g. "vantien1304-SỬ"
  subject: string;            // e.g. "Lịch sử"
  durationMinutes: number;    // e.g. 90
  submissionsCount: number;   // e.g. 7
  status: 'published' | 'draft' | 'closed'; // "Đã xuất bản" | "Bản nháp"
  assignedTo: string;         // "Tất cả mọi người" | "Lớp 12A1"
  assignedAt?: string;
  createdAt: string;          // "27/10/2026 19:13"
  price: string;              // "Miễn phí"
  folderId?: string;          // "azota_pool" or custom
  questions: QuestionItem[];
  description?: string;
  isRecommended?: boolean;
  fileUrl?: string;
  fileName?: string;
}

export interface ExamFolder {
  id: string;
  name: string;
  tag?: string;
  examCount?: number;
}

export interface ExamSubmission {
  id: number;
  examId: number;
  examTitle: string;
  studentName: string;
  score: number;             // out of 10
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  timeSpentSeconds: number;
  answers: Record<number, number>; // questionId -> chosenOptionIndex
}

export interface Flashcard {
  id: string;
  front: string;    // Question
  back: string;     // Answer
  hint?: string;    // Hint
  explanation?: string; // Detailed explanation for AI Tutor
  example?: string;     // Real-world example
  image?: string;       // Data URL or Image URL
  difficulty?: 'easy' | 'medium' | 'hard';
  status: 'new' | 'learning' | 'mastered' | 'again';
  isStarred?: boolean;  // Starred / flagged for review
  
  // Spaced Repetition (SM-2 algorithm)
  lastReviewed?: string;
  nextReview?: string;
  interval: number;      // Days
  easiness: number;      // E-Factor (default 2.5)
  repetitions: number;   // Number of successful reviews
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  description?: string;
  cardCount: number;
  remainingCount: number;
  goodCount: number;
  againCount: number;
  createdAt: string;
  cards: Flashcard[];
  
  // Dashboard & Stats
  streak: number;
  lastStudyDate?: string;
  totalTimeSpent?: number; // minutes
  category?: string;
}

export type ViewTab = 'overview' | 'countdown' | 'exams' | 'calendar' | 'tasks' | 'stats' | 'focus' | 'library' | 'notices' | 'flashcards' | 'ai_studio' | 'group_study';

export type UserRole = 'teacher' | 'student';

export interface StudentProfile {
  name: string;        // e.g. "Văn An"
  className: string;   // e.g. "12A1"
  schoolName: string;  // e.g. "THPT Chuyên"
  avatar: string;      // e.g. "VA"
  subjects?: Array<{
    name: string;
    currentScore: number;
    targetScore: number;
  }>;
}

export interface TeacherProfile {
  name: string;        // e.g. "Cô Phượng"
  username: string;    // e.g. "cophuong"
  backupCode: string;  // e.g. "cophuong"
  subject: string;     // e.g. "Vật lí"
  password: string;    // e.g. "123456"
  avatar?: string;     // image data URL or initials
}

export interface TeacherStudent {
  id: string;
  name: string;
  rollNumber: string;
  avgScore: number;
  completedTasks: number;
  totalTasks: number;
  status: 'good' | 'average' | 'needs_attention';
  weaknesses?: string[];
  avatar?: string;
}

export interface TeacherClass {
  id: string;
  number: number;
  name: string;         // e.g. "12A2 - ( Vật Lí Cơ Bản )"
  code?: string;        // e.g. "12A2-PHYS"
  subject: string;      // e.g. "Vật lí"
  grade: number;        // e.g. 12
  studentsCount: number;
  lessonsCount: number;
  examsCount: number;
  avgScore: number;
  students: TeacherStudent[];
  schedule?: string;
  room?: string;
}

export interface ClassJoinRequest {
  id: string;
  classId: string;
  className: string;
  studentName: string;
  studentClass: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export type TeacherTab = 
  | 'overview' 
  | 'classes' 
  | 'materials' 
  | 'ai_material' 
  | 'exams' 
  | 'assign' 
  | 'ai_assistant' 
  | 'settings'
  | 'notices';

export interface Notice {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  reactions: {
    [reaction: string]: number;
  };
}

export type MoodType = 'great' | 'good' | 'okay' | 'stressed' | 'tired';

export interface MoodLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mood: MoodType;
  emoji: string; // '😄' | '🙂' | '😐' | '😰' | '😫'
  label: string; // 'Tuyệt vời' | 'Vui vẻ' | 'Bình thường' | 'Căng thẳng' | 'Mệt mỏi'
  note: string; // Quick note
}

export interface GoalMilestone {
  id: string;
  title: string;          // e.g. "Mốc 1: Hoàn thành lượng giác"
  description?: string;   // e.g. "Nắm vững công thức biến đổi tích thành tổng & phương trình cơ bản"
  status: 'completed' | 'in_progress' | 'locked';
  rewardBadge?: string;   // e.g. "🏆 Bậc thầy Lượng giác"
  rewardPoints?: number;  // e.g. 100
  tasks?: Array<{ id: string; text: string; done: boolean }>; // Specific tasks/requirements for this milestone
}

export interface StudyGoal {
  id: string;
  title: string;          // e.g. "Hoàn thành chương trình Toán 11"
  subject: string;        // e.g. "Toán học"
  targetDate?: string;    // YYYY-MM-DD
  milestones: GoalMilestone[];
  createdAt: string;
}




