import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarEvent, 
  TaskItem, 
  LibraryItem, 
  DayFocusSession, 
  ViewTab, 
  UserRole,
  CountdownItem,
  ExamItem,
  ExamFolder,
  ExamSubmission,
  TeacherProfile,
  TeacherClass,
  TeacherTab,
  TeacherStudent,
  Notice,
  StudentProfile,
  ClassJoinRequest,
  FlashcardDeck,
  MoodLogEntry
} from './types';
import { 
  INITIAL_EVENTS, 
  INITIAL_TASKS, 
  INITIAL_LIBRARY, 
  INITIAL_COUNTDOWNS,
  INITIAL_EXAMS,
  INITIAL_FOLDERS,
  INITIAL_TEACHER_PROFILE,
  INITIAL_TEACHER_CLASSES,
  INITIAL_STUDENT_PROFILE,
  INITIAL_NOTICES,
  INITIAL_DECKS,
  formatDate,
  formatHours
} from './data/initialData';
import { saveStudentProfileSafe, saveTeacherProfileSafe } from './utils/avatarUtils';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { FocusView } from './components/FocusView';
import { StatsView } from './components/StatsView';
import { LibraryView } from './components/LibraryView';
import { FlashcardsView } from './components/FlashcardsView';
import { ExamsView } from './components/ExamsView';
import { CopyrightModal } from './components/CopyrightModal';
import { TeacherSidebar } from './components/TeacherSidebar';
import { TeacherTopBar } from './components/TeacherTopBar';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { TeacherAiExamModal } from './components/TeacherAiExamModal';
import { TeacherAiMaterialModal } from './components/TeacherAiMaterialModal';
import { TeacherAiAssistantModal } from './components/TeacherAiAssistantModal';
import { TeacherClassDetailModal } from './components/TeacherClassDetailModal';
import { TeacherProfileModal } from './components/TeacherProfileModal';
import { TeacherAssignModal } from './components/TeacherAssignModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { NoticeBoardView } from './components/NoticeBoardView';
import { JoinClassModal } from './components/JoinClassModal';
import { EditStudentModal } from './components/EditStudentModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { CreateClassModal } from './components/CreateClassModal';
import { StudentAiTutorModal } from './components/StudentAiTutorModal';
import { AIHubView } from './components/AIHubView';
import { ChatGptMiniBubble } from './components/ChatGptMiniBubble';
import { GroupStudyModal } from './components/GroupStudyModal';

import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  BarChart3, 
  Timer, 
  BookOpen,
  Hourglass,
  FileCheck2,
  Users,
  ClipboardList,
  Bot,
  MessageCircle,
  Plus,
  Trash2,
  Globe,
  BellRing,
  Sparkles
} from 'lucide-react';

// Ultra-safe LocalStorage reader that handles null, undefined, malformed JSON, and wrong types
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'null' || saved === 'undefined') return fallback;
    const parsed = JSON.parse(saved);
    if (parsed === null || parsed === undefined) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (typeof fallback === 'object' && fallback !== null && typeof parsed !== 'object') return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('studyflow_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('studyflow_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Role state
  const [role, setRole] = useState<UserRole>(() => {
    try {
      return (localStorage.getItem('studyflow_role') as UserRole) || 'student';
    } catch {
      return 'student';
    }
  });

  const [isTeacherLoginModalOpen, setIsTeacherLoginModalOpen] = useState(false);
  const [loginNoticeMessage, setLoginNoticeMessage] = useState<string>('');

  const [switchCount, setSwitchCount] = useState<number>(() => {
    return Number(localStorage.getItem('studyflow_switch_count') || 0);
  });

  const [isTeacherRemembered, setIsTeacherRemembered] = useState<boolean>(() => {
    return localStorage.getItem('studyflow_teacher_remembered') === 'true';
  });

  const toggleRole = () => {
    if (role === 'student') {
      if (isTeacherRemembered) {
        if (switchCount >= 8) {
          setLoginNoticeMessage('Bạn đã chuyển đổi nhanh 8 lần liên tiếp. Vui lòng nhập lại mật khẩu để tiếp tục bảo mật.');
          setIsTeacherLoginModalOpen(true);
        } else {
          const nextCount = switchCount + 1;
          setSwitchCount(nextCount);
          try {
            localStorage.setItem('studyflow_switch_count', String(nextCount));
          } catch {}
          setRole('teacher');
          try {
            localStorage.setItem('studyflow_role', 'teacher');
          } catch {}
          showToast(`Đã chuyển sang chế độ Giáo viên (Lần ${nextCount}/8)`);
        }
      } else {
        setLoginNoticeMessage('');
        setIsTeacherLoginModalOpen(true);
      }
    } else {
      setRole('student');
      try {
        localStorage.setItem('studyflow_role', 'student');
      } catch {}
      showToast('Đã chuyển sang chế độ: Học sinh');
    }
  };

  const handleTeacherLoginSuccess = (remember: boolean) => {
    setRole('teacher');
    setSwitchCount(1);
    setIsTeacherRemembered(remember);
    try {
      localStorage.setItem('studyflow_role', 'teacher');
      localStorage.setItem('studyflow_teacher_remembered', remember ? 'true' : 'false');
      localStorage.setItem('studyflow_switch_count', '1');
    } catch {}
    showToast(remember ? 'Đã đăng nhập Giáo viên (Bật chuyển đổi nhanh)' : 'Đã đăng nhập Giáo viên');
  };

  const handleLockTeacherMode = () => {
    setIsTeacherRemembered(false);
    setSwitchCount(0);
    try {
      localStorage.setItem('studyflow_teacher_remembered', 'false');
      localStorage.setItem('studyflow_switch_count', '0');
    } catch {}
    setRole('student');
    showToast('Đã khóa chế độ Giáo viên. Lần sau sẽ cần nhập lại mật khẩu.');
  };

  // Teacher State & Classes
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => {
    return loadLocal('studyflow_teacher_profile', INITIAL_TEACHER_PROFILE);
  });

  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>(() => {
    return loadLocal('studyflow_teacher_classes', INITIAL_TEACHER_CLASSES);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_teacher_classes', JSON.stringify(teacherClasses));
    } catch {
      // ignore
    }
  }, [teacherClasses]);

  const [teacherTab, setTeacherTab] = useState<TeacherTab>('overview');

  // Teacher Modals state
  const [isAiExamModalOpen, setIsAiExamModalOpen] = useState(false);
  const [isAiMaterialModalOpen, setIsAiMaterialModalOpen] = useState(false);
  const [isAiAssistantModalOpen, setIsAiAssistantModalOpen] = useState(false);
  const [isTeacherProfileModalOpen, setIsTeacherProfileModalOpen] = useState(false);
  const [isTeacherAssignModalOpen, setIsTeacherAssignModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [selectedTeacherClass, setSelectedTeacherClass] = useState<TeacherClass | null>(null);

  const handleCreateClass = (newClass: TeacherClass) => {
    setTeacherClasses((prev) => [...prev, newClass]);
    showToast(`Đã tạo lớp học mới "${newClass.name}" thành công!`);
  };

  const handleDeleteClass = (classId: string) => {
    const cls = teacherClasses.find((c) => c.id === classId);
    setTeacherClasses((prev) => prev.filter((c) => c.id !== classId));
    if (selectedTeacherClass?.id === classId) {
      setSelectedTeacherClass(null);
    }
    showToast(`Đã giải tán lớp "${cls?.name || ''}" thành công!`);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    showToast(`Đã xóa thư mục "${folder?.name || ''}"!`);
  };

  // Class Join Requests
  const [joinRequests, setJoinRequests] = useState<ClassJoinRequest[]>(() => {
    return loadLocal('studyflow_join_requests', [
      {
        id: 'req_1',
        classId: 'class_1',
        className: '12A2 - ( Vật Lí Cơ Bản )',
        studentName: 'Trần Hoàng Nam',
        studentClass: '12A2',
        status: 'pending',
        requestedAt: new Date().toISOString()
      }
    ]);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_join_requests', JSON.stringify(joinRequests));
    } catch {
      // ignore
    }
  }, [joinRequests]);

  const handleSendJoinRequest = (classId: string, className: string) => {
    const newReq: ClassJoinRequest = {
      id: `req_${Date.now()}`,
      classId,
      className,
      studentName: studentProfile?.name || 'Văn An',
      studentClass: studentProfile?.className || '12A1',
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    setJoinRequests((prev) => [newReq, ...prev]);
    showToast(`Đã gửi yêu cầu tham gia lớp "${className}"! Vui lòng chờ Giáo viên duyệt.`);
  };

  const handleApproveJoinRequest = (requestId: string) => {
    const req = joinRequests.find((r) => r.id === requestId);
    if (!req) return;

    setTeacherClasses((prev) =>
      prev.map((c) => {
        if (c.id === req.classId || c.name === req.className) {
          const newStudent: TeacherStudent = {
            id: `s_${Date.now()}`,
            name: req.studentName,
            rollNumber: `${req.studentClass}-${c.students.length + 1}`,
            avgScore: 8.0,
            completedTasks: 0,
            totalTasks: 5,
            status: 'good'
          };
          const updated = [...c.students, newStudent];
          return {
            ...c,
            studentsCount: updated.length,
            students: updated
          };
        }
        return c;
      })
    );

    setJoinRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );

    showToast(`Đã duyệt học sinh ${req.studentName} vào lớp ${req.className}!`);
  };

  const handleRejectJoinRequest = (requestId: string) => {
    setJoinRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
    showToast('Đã từ chối yêu cầu tham gia lớp.');
  };

  const handleSaveTeacherProfile = (newProfile: TeacherProfile) => {
    setTeacherProfile(newProfile);
    saveTeacherProfileSafe(newProfile);
    showToast('Đã lưu thông tin Giáo viên thành công!');
  };

  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<TeacherStudent | null>(null);

  const handleUpdateStudent = (updatedStudent: TeacherStudent) => {
    setTeacherClasses((prev) =>
      prev.map((c) => ({
        ...c,
        students: c.students.map((s) => s.id === updatedStudent.id ? updatedStudent : s)
      }))
    );
    showToast('Đã cập nhật thông tin học sinh!');
  };

  const handleAddStudentToClass = (classId: string, student: Omit<TeacherStudent, 'id'>) => {
    setTeacherClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const newSt: TeacherStudent = { ...student, id: `s_${Date.now()}` };
          const updated = [...c.students, newSt];
          return {
            ...c,
            studentsCount: updated.length,
            students: updated
          };
        }
        return c;
      })
    );
    showToast('Đã thêm học sinh vào lớp!');
  };

  const handleTeacherAssignTask = (task: Omit<TaskItem, 'id'>, targetClassId: string) => {
    const targetClass = teacherClasses.find((c) => c.id === targetClassId);
    const assignedTitle = targetClass ? `[${targetClass.name.slice(0, 4)}] ${task.t}` : task.t;
    handleAddTask({
      ...task,
      t: assignedTitle
    });
    showToast(`Đã giao nhiệm vụ cho ${targetClass ? targetClass.name : 'tất cả các lớp'}!`);
  };

  // Tab State & Hash sync
  const [currentTab, setCurrentTab] = useState<ViewTab>(() => {
    const hash = window.location.hash.replace('#', '') as ViewTab;
    if (hash === 'countdown') return 'calendar';
    const validTabs: ViewTab[] = ['overview', 'exams', 'calendar', 'tasks', 'stats', 'focus', 'library', 'notices', 'flashcards', 'ai_studio', 'group_study'];
    return validTabs.includes(hash) ? hash : 'overview';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewTab;
      if (hash === 'countdown') {
        setCurrentTab('calendar');
        setTimeout(() => {
          document.getElementById('countdown-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return;
      }
      const validTabs: ViewTab[] = ['overview', 'exams', 'calendar', 'tasks', 'stats', 'focus', 'library', 'notices', 'flashcards', 'ai_studio', 'group_study'];
      if (validTabs.includes(hash)) {
        setCurrentTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: ViewTab) => {
    if (tab === 'countdown') {
      setCurrentTab('calendar');
      window.location.hash = '#calendar';
      setTimeout(() => {
        document.getElementById('countdown-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return;
    }
    setCurrentTab(tab);
    window.location.hash = `#${tab}`;
  };

  // Exams State
  const [exams, setExams] = useState<ExamItem[]>(() => {
    return loadLocal('studyflow_exams', INITIAL_EXAMS);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_exams', JSON.stringify(exams));
    } catch {
      // ignore
    }
  }, [exams]);

  // Folders State
  const [folders, setFolders] = useState<ExamFolder[]>(() => {
    return loadLocal('studyflow_folders_v2', []);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_folders_v2', JSON.stringify(folders));
    } catch {
      // ignore
    }
  }, [folders]);

  // Submissions State
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() => {
    return loadLocal('studyflow_submissions', []);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_submissions', JSON.stringify(submissions));
    } catch {
      // ignore
    }
  }, [submissions]);

  // Student Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    return loadLocal('studyflow_student_profile', INITIAL_STUDENT_PROFILE);
  });

  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] = useState(false);


  // Auto-sync student profile whenever it changes
  useEffect(() => {
    saveStudentProfileSafe(studentProfile);
  }, [studentProfile]);

  // Auto-sync teacher profile whenever it changes
  useEffect(() => {
    saveTeacherProfileSafe(teacherProfile);
  }, [teacherProfile]);

  // Fetch persisted profiles from server backup and listen for real-time updates
  useEffect(() => {
    fetch('/api/profile/student')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile && data.profile.name) {
          // If server has a valid profile, it is our master backup
          setStudentProfile(data.profile);
          localStorage.setItem('studyflow_student_profile', JSON.stringify(data.profile));
        }
      })
      .catch(() => {});

    fetch('/api/profile/teacher')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile && data.profile.name) {
          setTeacherProfile(data.profile);
          localStorage.setItem('studyflow_teacher_profile', JSON.stringify(data.profile));
        }
      })
      .catch(() => {});

    const handleProfileSync = (e: any) => {
      const detail = e.detail;
      if (detail?.type === 'student' && detail.profile) {
        setStudentProfile(detail.profile);
      } else if (detail?.type === 'teacher' && detail.profile) {
        setTeacherProfile(detail.profile);
      }
    };
    window.addEventListener('studyflow_profile_updated', handleProfileSync);
    return () => window.removeEventListener('studyflow_profile_updated', handleProfileSync);
  }, []);

  const handleSaveStudentProfile = (newProfile: StudentProfile) => {
    setStudentProfile(newProfile);
    saveStudentProfileSafe(newProfile);
    showToast('Đã lưu thông tin hồ sơ Học sinh thành công!');
  };

  // Notices State
  const [notices, setNotices] = useState<Notice[]>(() => {
    return loadLocal('studyflow_notices', INITIAL_NOTICES);
  });

  const [readNoticeIds, setReadNoticeIds] = useState<number[]>(() => {
    return loadLocal('studyflow_read_notices', []);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_notices', JSON.stringify(notices));
    } catch {
      // ignore
    }
  }, [notices]);

  const handleMarkNoticesRead = () => {
    const allIds = notices.map((n) => n.id);
    setReadNoticeIds(allIds);
    try {
      localStorage.setItem('studyflow_read_notices', JSON.stringify(allIds));
    } catch {
      // ignore
    }
  };

  const unreadNoticeCount = notices.filter((n) => !readNoticeIds.includes(n.id)).length;

  const handleSaveExam = (exam: ExamItem) => {
    setExams((prev) => {
      const exists = prev.some((e) => e.id === exam.id);
      if (exists) {
        return prev.map((e) => (e.id === exam.id ? exam : e));
      }
      return [exam, ...prev];
    });
    showToast('Đã lưu đề thi thành công!');
  };

  const handleDeleteExam = (id: number) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    showToast('Đã xóa đề thi.');
  };

  const handleAddFolder = (folder: ExamFolder) => {
    setFolders((prev) => [...prev, folder]);
    showToast(`Đã tạo thư mục "${folder.name}"!`);
  };

  const handleSubmitExamResult = (sub: ExamSubmission) => {
    setSubmissions((prev) => [sub, ...prev]);
    showToast(`Nộp bài thành công! Bạn đạt ${sub.score}/10 điểm.`);
  };

  const handleAddNotice = (notice: Omit<Notice, 'id' | 'createdAt' | 'reactions'>) => {
    setNotices((prev) => [{
      ...notice,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      reactions: {}
    }, ...prev]);
    showToast('Đã đăng thông báo mới!');
  };

  const handlePinNotice = (id: number) => {
    setNotices((prev) => prev.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const handleDeleteNotice = (id: number) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    showToast('Đã xóa thông báo.');
  };

  const handleReactNotice = (id: number, reaction: string) => {
    setNotices((prev) => prev.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          reactions: {
            ...n.reactions,
            [reaction]: (n.reactions[reaction] || 0) + 1
          }
        };
      }
      return n;
    }));
  };

  // Countdowns State
  const [countdowns, setCountdowns] = useState<CountdownItem[]>(() => {
    return loadLocal('studyflow_countdowns', INITIAL_COUNTDOWNS);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_countdowns', JSON.stringify(countdowns));
    } catch {
      // ignore
    }
  }, [countdowns]);

  const handleAddCountdown = (item: Omit<CountdownItem, 'id'>) => {
    const newItem: CountdownItem = {
      ...item,
      id: Date.now()
    };
    setCountdowns((prev) => [newItem, ...prev]);
    showToast('Đã thêm kỳ thi đếm ngược mới!');
  };

  const handleUpdateCountdown = (item: CountdownItem) => {
    setCountdowns((prev) => prev.map((c) => (c.id === item.id ? item : c)));
    showToast('Đã cập nhật thông tin kỳ thi!');
  };

  const handleDeleteCountdown = (id: number) => {
    setCountdowns((prev) => prev.filter((c) => c.id !== id));
    showToast('Đã xóa kỳ thi.');
  };

  // Mood Logs State
  const [moodLogs, setMoodLogs] = useState<MoodLogEntry[]>(() => {
    return loadLocal('studyflow_mood_logs', [
      { id: 'm1', date: formatDate(new Date()), time: '09:00', mood: 'great', emoji: '😄', label: 'Tuyệt vời', note: 'Sẵn sàng cho ngày học mới!' },
      { id: 'm2', date: formatDate(new Date(Date.now() - 86400000)), time: '15:30', mood: 'good', emoji: '🙂', label: 'Vui vẻ', note: 'Làm xong bài tập Toán' }
    ]);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_mood_logs', JSON.stringify(moodLogs));
    } catch {
      // ignore
    }
  }, [moodLogs]);

  const handleAddMoodLog = (entry: Omit<MoodLogEntry, 'id'>) => {
    const newEntry: MoodLogEntry = { ...entry, id: `m_${Date.now()}` };
    setMoodLogs((prev) => [newEntry, ...prev]);
    showToast(`Đã ghi nhận tâm trạng: ${entry.emoji} ${entry.label}`);
  };

  // Helper to ensure all events are strictly bound to a specific date string (YYYY-MM-DD)
  const sanitizeEvents = (rawEvents: CalendarEvent[]): CalendarEvent[] => {
    if (!Array.isArray(rawEvents)) return INITIAL_EVENTS;
    const thisMonday = new Date();
    thisMonday.setHours(0, 0, 0, 0);
    thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7));

    return rawEvents
      .filter((e) => e && typeof e === 'object')
      .map((e) => {
        if (!e.date) {
          const dow = typeof e.dow === 'number' ? e.dow : 0;
          const d = new Date(thisMonday);
          d.setDate(d.getDate() + dow);
          return {
            ...e,
            date: formatDate(d),
            dow
          };
        }
        return e;
      });
  };

  // Events State
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    return sanitizeEvents(loadLocal('studyflow_events', INITIAL_EVENTS));
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_events', JSON.stringify(events));
    } catch {
      // ignore
    }
  }, [events]);

  useEffect(() => {
    const handleAddEvents = (e: any) => {
      const newEvents = e.detail;
      if (Array.isArray(newEvents)) {
        setEvents((prev) => {
          const sanitized = sanitizeEvents(newEvents);
          return [...prev, ...sanitized];
        });
      }
    };
    window.addEventListener('studyflow_add_events', handleAddEvents);
    return () => window.removeEventListener('studyflow_add_events', handleAddEvents);
  }, []);

  // Tasks State
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    return loadLocal('studyflow_tasks', INITIAL_TASKS);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_tasks', JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  // Library State
  const [library, setLibrary] = useState<LibraryItem[]>(() => {
    return loadLocal('studyflow_library', INITIAL_LIBRARY);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_library', JSON.stringify(library));
    } catch {
      // ignore
    }
  }, [library]);

  // Sessions State
  const [sessions, setSessions] = useState<DayFocusSession>(() => {
    return loadLocal('studyflow_sessions', {});
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_sessions', JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCopyrightOpen, setIsCopyrightOpen] = useState(false);
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeadlineToast, setIsDeadlineToast] = useState(false);

  // Notification logic
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkDeadlines = () => {
      const now = new Date();
      const todayDateStr = formatDate(now);
      const currentHour = now.getHours() + now.getMinutes() / 60;

      // Thresholds in minutes
      const thresholds = [120, 30, 15];

      // Check Tasks
      tasks.forEach((task) => {
        if (task.done || !task.dueTime) return;
        if (task.due === todayDateStr) {
          const [h, m] = task.dueTime.split(':').map(Number);
          const taskHour = h + m / 60;
          const diffMins = Math.round((taskHour - currentHour) * 60);

          thresholds.forEach(threshold => {
            const uniqueId = `task_${task.id}_${threshold}`;
            // If we are within the threshold window but haven't notified for THIS specific threshold yet
            if (diffMins > 0 && diffMins <= threshold && !notifiedIds.current.has(uniqueId)) {
              triggerNotification(
                `Sắp đến hạn: ${task.t}`, 
                `Nhiệm vụ này sẽ đến hạn vào lúc ${task.dueTime} (còn ~${diffMins} phút).`
              );
              notifiedIds.current.add(uniqueId);
            }
          });
        }
      });

      // Check Events
      events.forEach((event) => {
        if (event.date === todayDateStr) {
          const diffMins = Math.round((event.h - currentHour) * 60);
          
          thresholds.forEach(threshold => {
            const uniqueId = `event_${event.id}_${threshold}`;
            if (diffMins > 0 && diffMins <= threshold && !notifiedIds.current.has(uniqueId)) {
              const timeLabel = formatHours(event.h);
              const importance = event.type === 'exam' || event.type === 'due' ? 'quan trọng' : 'sắp diễn ra';
              triggerNotification(
                `Sự kiện ${importance}: ${event.t}`, 
                `Buổi học/Sự kiện sẽ bắt đầu vào lúc ${timeLabel} (còn ~${diffMins} phút).`
              );
              notifiedIds.current.add(uniqueId);
            }
          });
        }
      });
    };

    const triggerNotification = (title: string, body: string) => {
      // 1. Browser Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/assets/aistudio/logo_studyflow_mark.png' });
      }
      
      // 2. Specialized UI Toast
      setToastMessage(`${title}\n${body}`);
      setIsDeadlineToast(true);
      setTimeout(() => {
        setIsDeadlineToast(false);
        setToastMessage(null);
      }, 8000); // Deadlines stay longer
    };

    // Run immediately then every 5 mins
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks, events]);

  const handleJoinClass = (classCode: string) => {
    showToast(`Đang gửi yêu cầu tham gia lớp: ${classCode}...`);
  };

  const showToast = (msg: string) => {
    setIsDeadlineToast(false);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Event handlers
  const handleSaveEvent = (event: CalendarEvent) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === event.id);
      if (exists) {
        return prev.map((e) => (e.id === event.id ? event : e));
      }
      return [...prev, event];
    });
    showToast('Đã lưu sự kiện thành công!');
  };

  const handleDeleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast('Đã xóa sự kiện.');
  };

  // Task handlers
  const handleAddTask = (item: Omit<TaskItem, 'id'>) => {
    const isDone = item.status === 'done' || !!item.done;
    const newTask: TaskItem = {
      ...item,
      id: Date.now(),
      status: item.status || (isDone ? 'done' : 'todo'),
      priority: item.priority || (item.hi ? 'high' : 'medium'),
      done: isDone
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast('Đã thêm bài tập mới!');
  };

  const handleUpdateTask = (task: TaskItem) => {
    const isDone = task.status === 'done' || task.done;
    const updated: TaskItem = {
      ...task,
      done: isDone,
      status: task.status || (isDone ? 'done' : 'in_progress')
    };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    showToast('Đã cập nhật bài tập!');
  };

  const handleToggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextDone = !t.done;
          return {
            ...t,
            done: nextDone,
            status: nextDone ? 'done' : 'in_progress'
          };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Đã xóa bài tập.');
  };

  // Library handlers
  const handleAddResource = (item: Omit<LibraryItem, 'id'>) => {
    const newResource: LibraryItem = {
      ...item,
      id: Date.now()
    };
    setLibrary((prev) => [newResource, ...prev]);
    showToast('Đã lưu tài liệu học tập!');
  };

  const handleUpdateResource = (item: LibraryItem) => {
    setLibrary((prev) => prev.map((l) => (l.id === item.id ? item : l)));
    showToast('Đã cập nhật tài liệu!');
  };

  const handleDeleteResource = (id: number) => {
    setLibrary((prev) => prev.filter((l) => l.id !== id));
    showToast('Đã xóa tài liệu khỏi thư viện.');
  };

  const handleToggleFavoriteResource = (id: number) => {
    setLibrary((prev) =>
      prev.map((l) => (l.id === id ? { ...l, fav: !l.fav } : l))
    );
  };

  // Flashcards State
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => {
    return loadLocal('studyflow_decks', INITIAL_DECKS);
  });

  useEffect(() => {
    try {
      localStorage.setItem('studyflow_decks', JSON.stringify(decks));
    } catch {
      // ignore
    }
  }, [decks]);

  const handleAddDeck = (deck: FlashcardDeck) => {
    setDecks((prev) => [deck, ...prev]);
    showToast(`Đã tạo bộ Flashcard "${deck.title}" thành công!`);
  };

  const handleUpdateDeck = (deck: FlashcardDeck) => {
    setDecks((prev) => prev.map((d) => (d.id === deck.id ? deck : d)));
  };

  const handleDeleteDeck = (id: string) => {
    const deck = decks.find((d) => d.id === id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    showToast(`Đã xóa bộ Flashcard "${deck?.title || ''}".`);
  };

  // Data reset & restore
  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả dữ liệu về mặc định ban đầu không?')) {
      setEvents(INITIAL_EVENTS);
      setTasks(INITIAL_TASKS);
      setLibrary(INITIAL_LIBRARY);
      setCountdowns(INITIAL_COUNTDOWNS);
      setExams(INITIAL_EXAMS);
      setFolders(INITIAL_FOLDERS);
      setDecks(INITIAL_DECKS);
      setSubmissions([]);
      setSessions({});
      localStorage.clear();
      showToast('Đã đặt lại dữ liệu mặc định thành công.');
      setIsCopyrightOpen(false);
    }
  };

  const handleRestoreData = (data: {
    events?: CalendarEvent[];
    tasks?: TaskItem[];
    library?: LibraryItem[];
    sessions?: DayFocusSession;
    countdowns?: CountdownItem[];
    exams?: ExamItem[];
    decks?: FlashcardDeck[];
  }) => {
    if (data.events) setEvents(data.events);
    if (data.tasks) setTasks(data.tasks);
    if (data.library) setLibrary(data.library);
    if (data.sessions) setSessions(data.sessions);
    if (data.countdowns) setCountdowns(data.countdowns);
    if (data.exams) setExams(data.exams);
    if (data.decks) setDecks(data.decks);
    showToast('Đã khôi phục dữ liệu từ bản sao lưu!');
  };

  const todayStr = formatDate(new Date());
  const todayEventsCount = events.filter((e) => e.date === todayStr).length;
  const pendingTasksCount = tasks.filter((t) => !t.done).length;

  if (role === 'teacher') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased transition-colors">
        {/* Teacher Desktop Sidebar */}
        <div className="hidden md:block">
          <TeacherSidebar
            currentTab={teacherTab}
            onSelectTab={(tab) => {
              setTeacherTab(tab);
              if (tab === 'ai_material') setIsAiMaterialModalOpen(true);
              if (tab === 'ai_assistant') setIsAiAssistantModalOpen(true);
              if (tab === 'assign') setIsTeacherAssignModalOpen(true);
              if (tab === 'settings') setIsTeacherProfileModalOpen(true);
            }}
            profile={teacherProfile}
            onSwitchToStudent={toggleRole}
            onOpenCopyright={() => setIsCopyrightOpen(true)}
            onOpenProfileModal={() => setIsTeacherProfileModalOpen(true)}
          />
        </div>

        {/* Teacher Main Container */}
        <div className="flex-1 flex flex-col min-w-0">
          <TeacherTopBar
            profile={teacherProfile}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSwitchToStudent={toggleRole}
            onOpenCopyright={() => setIsCopyrightOpen(true)}
            onOpenProfileModal={() => setIsTeacherProfileModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
            {teacherTab === 'overview' && (
              <TeacherDashboardView
                profile={teacherProfile}
                classes={teacherClasses}
                totalExamsCount={exams.length}
                totalMaterialsCount={library.length}
                onOpenProfileModal={() => setIsTeacherProfileModalOpen(true)}
                onOpenAiExamModal={() => setIsAiExamModalOpen(true)}
                onOpenAiMaterialModal={() => setIsAiMaterialModalOpen(true)}
                onOpenAiAssistantModal={() => setIsAiAssistantModalOpen(true)}
                onOpenAssignModal={() => setIsTeacherAssignModalOpen(true)}
                onSelectClass={(cls) => setSelectedTeacherClass(cls)}
                onNavigateTab={(tab) => {
                  setTeacherTab(tab);
                  if (tab === 'ai_material') setIsAiMaterialModalOpen(true);
                  if (tab === 'ai_assistant') setIsAiAssistantModalOpen(true);
                  if (tab === 'assign') setIsTeacherAssignModalOpen(true);
                  if (tab === 'settings') setIsTeacherProfileModalOpen(true);
                }}
              />
            )}

            {teacherTab === 'exams' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kho đề Thi cử & Kiểm tra</h2>
                    <p className="text-xs text-slate-500">Quản lý và xuất bản đề thi cho học sinh</p>
                  </div>
                  <button
                    onClick={() => setIsAiExamModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition"
                  >
                    <span>✨ AI Tạo đề theo Ma trận</span>
                  </button>
                </div>
                <ExamsView
                  exams={exams}
                  folders={folders}
                  submissions={submissions}
                  role={role}
                  onSaveExam={handleSaveExam}
                  onDeleteExam={handleDeleteExam}
                  onDeleteFolder={handleDeleteFolder}
                  onAddFolder={handleAddFolder}
                  onSubmitResult={handleSubmitExamResult}
                  onBackToOverview={() => setTeacherTab('overview')}
                />
              </div>
            )}

            {(teacherTab === 'materials' || teacherTab === 'ai_material') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Học liệu & Bài giảng giáo viên</h2>
                    <p className="text-xs text-slate-500">Tài liệu, giáo án và bài tập bồi dưỡng</p>
                  </div>
                  <button
                    onClick={() => setIsAiMaterialModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
                  >
                    <span>✨ AI Tạo học liệu theo Chương</span>
                  </button>
                </div>
                <LibraryView
                  library={library}
                  role={role}
                  onAddResource={handleAddResource}
                  onUpdateResource={handleUpdateResource}
                  onDeleteResource={handleDeleteResource}
                  onToggleFavorite={handleToggleFavoriteResource}
                />
              </div>
            )}

            {teacherTab === 'classes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Quản lý {teacherClasses.length} Lớp học & Yêu cầu gia nhập</h2>
                    <p className="text-xs text-slate-500">Tạo lớp học, duyệt học sinh xin tham gia và quản lý sĩ số</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCreateClassModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo lớp học mới</span>
                    </button>
                    <button
                      onClick={() => setIsTeacherAssignModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      + Giao bài tập
                    </button>
                    {isTeacherRemembered && (
                      <button
                        onClick={handleLockTeacherMode}
                        className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Xóa mật khẩu ghi nhớ & Yêu cầu nhập lại mật khẩu lần sau"
                      >
                        🔒 Khóa chế độ GV
                      </button>
                    )}
                  </div>
                </div>

                {/* Pending Join Requests Card */}
                {joinRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>Yêu cầu tham gia lớp chờ duyệt ({joinRequests.filter((r) => r.status === 'pending').length})</span>
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                        Cần Giáo viên duyệt
                      </span>
                    </div>

                    <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60">
                      {joinRequests
                        .filter((r) => r.status === 'pending')
                        .map((req) => (
                          <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                Học sinh: <span className="text-blue-600 dark:text-blue-400">{req.studentName}</span> ({req.studentClass})
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Xin vào lớp: <span className="font-semibold">{req.className}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveJoinRequest(req.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                              >
                                ✓ Duyệt tham gia
                              </button>
                              <button
                                onClick={() => handleRejectJoinRequest(req.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                              >
                                Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Class Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacherClasses.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedTeacherClass(cls)}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 transition cursor-pointer shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 font-black text-xs flex items-center justify-center">
                          {cls.number}
                        </span>
                        <div className="flex items-center gap-2">
                          {cls.code && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Mã: {cls.code}
                            </span>
                          )}
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Điểm TB: {cls.avgScore}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(cls.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Giải tán lớp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cls.name}</h3>
                      <div className="text-xs text-slate-500 flex justify-between">
                        <span>Sĩ số: {cls.studentsCount} học sinh</span>
                        <span>{cls.schedule || 'Lịch học'}</span>
                      </div>
                      <button className="w-full py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-blue-600 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950 transition">
                        Xem chi tiết & Phổ điểm →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teacherTab === 'assign' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Nhiệm vụ & Bài tập giao cho các lớp</h2>
                  <button
                    onClick={() => setIsTeacherAssignModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    + Giao nhiệm vụ mới
                  </button>
                </div>
                <TasksView
                  tasks={tasks}
                  role={role}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            )}

            {teacherTab === 'notices' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Trang NEWS & Thông báo</h2>
                <NoticeBoardView
                  notices={notices}
                  role={role}
                  onAddNotice={handleAddNotice}
                  onPinNotice={handlePinNotice}
                  onDeleteNotice={handleDeleteNotice}
                  onReact={handleReactNotice}
                />
              </div>
            )}
          </main>
        </div>

        {/* Teacher Modals */}
        <TeacherAiExamModal
          isOpen={isAiExamModalOpen}
          onClose={() => setIsAiExamModalOpen(false)}
          onSaveExam={handleSaveExam}
          defaultSubject={teacherProfile.subject}
        />

        <TeacherAiMaterialModal
          isOpen={isAiMaterialModalOpen}
          onClose={() => setIsAiMaterialModalOpen(false)}
          onSaveResource={handleAddResource}
          defaultSubject={teacherProfile.subject}
        />

        <TeacherAiAssistantModal
          isOpen={isAiAssistantModalOpen}
          onClose={() => setIsAiAssistantModalOpen(false)}
          profile={teacherProfile}
        />

        <TeacherClassDetailModal
          isOpen={!!selectedTeacherClass}
          onClose={() => setSelectedTeacherClass(null)}
          selectedClass={selectedTeacherClass}
          onAddStudent={handleAddStudentToClass}
          onOpenAiExam={() => setIsAiExamModalOpen(true)}
          onEditStudent={(student) => {
            setEditingStudent(student);
            setIsEditStudentModalOpen(true);
          }}
          onDeleteClass={handleDeleteClass}
        />

        {editingStudent && (
          <EditStudentModal
            isOpen={isEditStudentModalOpen}
            onClose={() => setIsEditStudentModalOpen(false)}
            student={editingStudent}
            onSave={handleUpdateStudent}
          />
        )}

        <TeacherProfileModal
          isOpen={isTeacherProfileModalOpen}
          onClose={() => setIsTeacherProfileModalOpen(false)}
          profile={teacherProfile}
          onSaveProfile={handleSaveTeacherProfile}
        />

        <TeacherAssignModal
          isOpen={isTeacherAssignModalOpen}
          onClose={() => setIsTeacherAssignModalOpen(false)}
          classes={teacherClasses}
          onAssignTask={handleTeacherAssignTask}
        />

        {/* Mobile Bottom Navigation Bar for Teacher */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#181d38] text-white border-t border-[#242b52] flex items-center justify-around py-2 px-1">
          {[
            { id: 'overview' as TeacherTab, label: 'Tổng quan', icon: LayoutDashboard },
            { id: 'vnedu' as any, label: 'VNEDU', icon: Globe, isExternal: true },
            { id: 'classes' as TeacherTab, label: 'Lớp học', icon: Users },
            { id: 'exams' as TeacherTab, label: 'Thi cử', icon: ClipboardList },
            { id: 'materials' as TeacherTab, label: 'Học liệu', icon: BookOpen },
            { id: 'notices' as TeacherTab, label: 'NEWS', icon: MessageCircle },
            { id: 'ai_assistant' as TeacherTab, label: 'Trợ lý AI', icon: Bot, isAi: true }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = teacherTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.isExternal) {
                    window.open('https://user.vnedu.vn/sso//?use_cache=0&continue=tracuu.vnedu.vn/kqht/', '_blank', 'noopener,noreferrer');
                  } else {
                    setTeacherTab(tab.id as TeacherTab);
                    if (tab.id === 'ai_assistant') setIsAiAssistantModalOpen(true);
                  }
                }}
                className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold relative transition ${
                  isActive ? 'text-amber-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${tab.isExternal ? 'text-sky-400' : tab.isAi ? 'text-amber-400' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>



        {/* Toast Notification / Deadline Alert */}
        {toastMessage && (
          <div className={`fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 w-full max-w-[320px] sm:max-w-md px-4`}>
            {isDeadlineToast ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-4 flex gap-4 items-start ring-4 ring-amber-500/10">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 animate-bounce">
                  <BellRing className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Cảnh báo Deadline</h4>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {toastMessage}
                  </div>
                </div>
                <button 
                  onClick={() => setToastMessage(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mx-auto w-fit px-6 py-3 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold rounded-2xl shadow-xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>{toastMessage}</span>
              </div>
            )}
          </div>
        )}

        <CopyrightModal
          isOpen={isCopyrightOpen}
          onClose={() => setIsCopyrightOpen(false)}
          events={events}
          tasks={tasks}
          library={library}
          sessions={sessions}
          countdowns={countdowns}
          exams={exams}
          onRestoreData={handleRestoreData}
          onResetToDefault={handleResetToDefault}
        />

      </div>
    );
  }

  // Student Role Render
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          pendingTasksCount={pendingTasksCount}
          todayEventsCount={todayEventsCount}
          onOpenCopyright={() => setIsCopyrightOpen(true)}
          onOpenJoinClass={() => setIsJoinClassModalOpen(true)}
  
          studentProfile={studentProfile}
          onOpenStudentProfile={() => setIsStudentProfileModalOpen(true)}
          unreadNoticeCount={unreadNoticeCount}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={() => {
            if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          role={role}
          onToggleRole={toggleRole}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCopyright={() => setIsCopyrightOpen(true)}
          onSearchSubmit={() => {
            if (searchQuery.trim()) {
              handleSelectTab('exams');
            }
          }}
          notices={notices}
          unreadNoticeCount={unreadNoticeCount}
          onMarkNoticesRead={handleMarkNoticesRead}
          onReactNotice={handleReactNotice}
          onNavigateToNews={() => handleSelectTab('notices')}
          studentProfile={studentProfile}
          onOpenStudentProfile={() => setIsStudentProfileModalOpen(true)}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {currentTab === 'overview' && (
            <OverviewView
              events={events}
              tasks={tasks}
              library={library}
              sessions={sessions}
              countdowns={countdowns}
              role={role}
              onNavigate={handleSelectTab}
              onToggleTask={handleToggleTask}
              moodLogs={moodLogs}
              onAddMoodLog={handleAddMoodLog}
              searchQuery={searchQuery}
              studentProfile={studentProfile}
              submissions={submissions}
            />
          )}

          {currentTab === 'exams' && (
            <ExamsView
              exams={exams}
              folders={folders}
              submissions={submissions}
              role={role}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              onDeleteFolder={handleDeleteFolder}
              onAddFolder={handleAddFolder}
              onSubmitResult={handleSubmitExamResult}
              onBackToOverview={() => handleSelectTab('overview')}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {(currentTab === 'calendar' || currentTab === 'countdown') && (
            <CalendarView
              events={events}
              tasks={tasks}
              role={role}
              onSaveEvent={handleSaveEvent}
              onDeleteEvent={handleDeleteEvent}
              countdowns={countdowns}
              onAddCountdown={handleAddCountdown}
              onUpdateCountdown={handleUpdateCountdown}
              onDeleteCountdown={handleDeleteCountdown}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              studentProfile={studentProfile}
              onOpenStudentProfile={() => setIsStudentProfileModalOpen(true)}
              onSaveStudentProfile={handleSaveStudentProfile}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              role={role}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTab={handleSelectTab}
              sessions={sessions}
              studentProfile={studentProfile}
            />
          )}

          {currentTab === 'focus' && (
            <FocusView
              sessions={sessions}
              onUpdateSessions={setSessions}
            />
          )}

          {currentTab === 'stats' && (
            <StatsView
              tasks={tasks}
              library={library}
              sessions={sessions}
              submissions={submissions}
              events={events}
              studentProfile={studentProfile}
            />
          )}

          {currentTab === 'flashcards' && (
            <FlashcardsView
              decks={decks}
              onAddDeck={handleAddDeck}
              onUpdateDeck={handleUpdateDeck}
              onDeleteDeck={handleDeleteDeck}
            />
          )}

          {currentTab === 'ai_studio' && (
            <AIHubView
              onAddDeck={handleAddDeck}
              onToast={showToast}
              onNavigateToCalendar={() => setCurrentTab('calendar')}
            />
          )}

          {currentTab === 'library' && (
            <LibraryView
              library={library}
              role={role}
              onAddResource={handleAddResource}
              onUpdateResource={handleUpdateResource}
              onDeleteResource={handleDeleteResource}
              onToggleFavorite={handleToggleFavoriteResource}
              initialSearch={searchQuery}
            />
          )}

          {currentTab === 'notices' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Trang NEWS & Thông báo</h2>
              <NoticeBoardView
                notices={notices}
                role={role}
                onAddNotice={handleAddNotice}
                onPinNotice={handlePinNotice}
                onDeleteNotice={handleDeleteNotice}
                onReact={handleReactNotice}
              />
            </div>
          )}

          {currentTab === 'group_study' && (
            <GroupStudyModal
              isOpen={true}
              isView={true}
              studentProfile={studentProfile}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1">
        {[
          { id: 'overview' as ViewTab, label: 'Tổng quan', icon: LayoutDashboard },
          { id: 'vnedu' as any, label: 'VNEDU', icon: Globe, isExternal: true },
          { id: 'exams' as ViewTab, label: 'Thi cử', icon: FileCheck2 },
          { id: 'calendar' as ViewTab, label: 'Lịch học', icon: CalendarDays },
          { id: 'tasks' as ViewTab, label: 'Bài tập', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
          { id: 'notices' as ViewTab, label: 'NEWS', icon: MessageCircle, badge: unreadNoticeCount > 0 ? unreadNoticeCount : undefined },
          { id: 'library' as ViewTab, label: 'Thư viện', icon: BookOpen }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.isExternal) {
                  window.open('https://user.vnedu.vn/sso//?use_cache=0&continue=tracuu.vnedu.vn/kqht/', '_blank', 'noopener,noreferrer');
                } else {
                  handleSelectTab(tab.id as ViewTab);
                }
              }}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-semibold relative transition ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${tab.isExternal ? 'text-blue-500' : ''}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Modals */}
      <TeacherLoginModal
        isOpen={isTeacherLoginModalOpen}
        onClose={() => setIsTeacherLoginModalOpen(false)}
        profile={teacherProfile}
        noticeMessage={loginNoticeMessage}
        onLoginSuccess={handleTeacherLoginSuccess}
      />
      <StudentProfileModal
        isOpen={isStudentProfileModalOpen}
        onClose={() => setIsStudentProfileModalOpen(false)}
        profile={studentProfile}
        onSaveProfile={handleSaveStudentProfile}
      />
      <JoinClassModal
        isOpen={isJoinClassModalOpen}
        onClose={() => setIsJoinClassModalOpen(false)}
        availableClasses={teacherClasses}
        onSendJoinRequest={handleSendJoinRequest}
      />
      <CreateClassModal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
        defaultSubject={teacherProfile.subject}
        nextNumber={teacherClasses.length + 1}
        onCreateClass={handleCreateClass}
      />
      <CopyrightModal
        isOpen={isCopyrightOpen}
        onClose={() => setIsCopyrightOpen(false)}
        events={events}
        tasks={tasks}
        library={library}
        sessions={sessions}
        countdowns={countdowns}
        exams={exams}
        onRestoreData={handleRestoreData}
        onResetToDefault={handleResetToDefault}
      />

      {/* Floating Chatbot Assistant */}
      <ChatGptMiniBubble studentName={studentProfile.name} />

      {/* Toast Notification / Deadline Alert */}
      {toastMessage && (
        <div className={`fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 w-full max-w-[320px] sm:max-w-md px-4`}>
          {isDeadlineToast ? (
            <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-4 flex gap-4 items-start ring-4 ring-amber-500/10">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 animate-bounce">
                <BellRing className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Cảnh báo Deadline</h4>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {toastMessage}
                </div>
              </div>
              <button 
                onClick={() => setToastMessage(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="mx-auto w-fit px-6 py-3 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold rounded-2xl shadow-xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

