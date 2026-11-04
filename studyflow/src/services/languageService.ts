// StudyFlow Language Service
// Supports full system translation between Vietnamese and English while strictly preserving the StudyFlow logo

export type AppLanguage = 'vi' | 'en';

const STORAGE_KEY = 'sf-language';

// Comprehensive dictionary for StudyFlow
export const DICTIONARY: Array<{ vi: string; en: string }> = [
  // Brand & navigation
  { vi: 'Tổng quan', en: 'Overview' },
  { vi: 'Thi cử & Đề thi', en: 'Exams & Tests' },
  { vi: 'Thi cử', en: 'Exams' },
  { vi: 'Lịch học', en: 'Study Calendar' },
  { vi: 'Thời khóa biểu', en: 'Class Schedule' },
  { vi: 'Danh sách bài tập', en: 'Tasks & Assignments' },
  { vi: 'Bài tập', en: 'Tasks' },
  { vi: 'Sổ điểm & Học tập', en: 'Gradebook & Academics' },
  { vi: 'Sổ điểm', en: 'Gradebook' },
  { vi: 'Flashcards ghi nhớ', en: 'Memorization Flashcards' },
  { vi: 'Flashcards', en: 'Flashcards' },
  { vi: 'Phân tích & Thống kê', en: 'Analytics & Stats' },
  { vi: 'Thống kê', en: 'Analytics' },
  { vi: 'Phòng học nhóm', en: 'Group Study Room' },
  { vi: 'Thư viện tài liệu', en: 'Document Library' },
  { vi: 'Thư viện', en: 'Library' },
  { vi: 'Tin tức & Bảng tin', en: 'News & Notice Board' },
  { vi: 'Bảng tin', en: 'Notice Board' },
  { vi: 'Trợ lý AI Assistant', en: 'AI Assistant Hub' },
  { vi: 'Trợ lý AI', en: 'AI Assistant' },
  { vi: 'Không gian AI Studio', en: 'AI Studio Workspace' },
  { vi: 'Gia nhập lớp học', en: 'Join Classroom' },
  { vi: 'Bản quyền & HD', en: 'Copyright & Guide' },
  { vi: 'Tiện ích mở rộng', en: 'Extended Utilities' },
  { vi: 'Chính', en: 'Main Menu' },
  { vi: 'Mục tiêu tuần', en: 'Weekly Goal' },
  { vi: 'Mẹo học hôm nay', en: "Today's Study Tip" },

  // AI Hub & Assistants
  { vi: 'Tâm lí học đường', en: 'School Psychology' },
  { vi: 'Tâm Lý Học Đường', en: 'School Psychology' },
  { vi: 'Gia sư T&T AI', en: 'T&T AI Tutor' },
  { vi: 'Tóm Tắt Video', en: 'Video Summary' },
  { vi: 'Tạo Trắc Nghiệm', en: 'Create Quiz' },
  { vi: 'Lập Lịch Calendar', en: 'Schedule Calendar' },
  { vi: 'AI School Counselor', en: 'AI School Counselor' },
  { vi: 'Trợ Lý Gia Sư Toàn Năng', en: 'All-in-One AI Academic Tutor' },
  { vi: 'Hỏi Gia sư', en: 'Ask Tutor' },
  { vi: 'Gửi tâm sự', en: 'Send Thoughts' },
  { vi: 'Gửi bài tập', en: 'Send Question' },
  { vi: 'KỸ THUẬT THỞ ĐIỀU HÒA 4-7-8', en: '4-7-8 RELAXATION BREATHING' },
  { vi: 'ÂM THANH THƯ GIÃN & TẬP TRUNG', en: 'RELAXATION & FOCUS SOUNDS' },
  { vi: 'LỜI NHẮC NHỞ TÍCH CỰC HÔM NAY', en: "TODAY'S POSITIVE AFFIRMATION" },
  { vi: 'HÍT MŨI SÂU...', en: 'INHALE DEEPLY...' },
  { vi: 'GIỮ HƠI THỞ...', en: 'HOLD BREATH...' },
  { vi: 'THỞ TỪ TỪ RA...', en: 'EXHALE SLOWLY...' },
  { vi: 'BẤM NÚT ĐỂ THỞ', en: 'TAP TO BREATHE' },
  { vi: 'Mưa rơi nhẹ', en: 'Gentle Rain' },
  { vi: 'Sóng biển dạt dào', en: 'Ocean Waves' },
  { vi: 'Quán cà phê ấm', en: 'Cozy Cafe' },
  { vi: 'Tiếng ồn trắng', en: 'White Noise' },
  { vi: 'Đang phát', en: 'Playing' },
  { vi: 'Nhấp để bật', en: 'Click to play' },
  { vi: 'Giọng điệu:', en: 'Tone:' },
  { vi: 'Thấu hiểu, ân cần', en: 'Empathetic & Caring' },
  { vi: 'Phân tích, giải pháp', en: 'Analytical & Solutions' },
  { vi: 'Khích lệ, tạo động lực', en: 'Encouraging & Motivating' },
  { vi: 'Ngắn gọn, trọng tâm', en: 'Concise & Direct' },

  // Header & Common Actions
  { vi: 'Tìm kiếm bài tập, ghi chú, môn học...', en: 'Search tasks, notes, subjects...' },
  { vi: 'Học sinh', en: 'Student' },
  { vi: 'Giáo viên', en: 'Teacher' },
  { vi: 'Chế độ Tập trung', en: 'Focus Mode' },
  { vi: 'Điểm danh hôm nay', en: 'Check-in Today' },
  { vi: 'Đã điểm danh', en: 'Checked In' },
  { vi: 'Chưa điểm danh', en: 'Not Checked In' },
  { vi: 'Thông báo', en: 'Notifications' },
  { vi: 'Chế độ tối', en: 'Dark Mode' },
  { vi: 'Chế độ sáng', en: 'Light Mode' },
  { vi: 'Cài đặt', en: 'Settings' },
  { vi: 'Đăng xuất', en: 'Log Out' },
  { vi: 'Đóng', en: 'Close' },
  { vi: 'Lưu', en: 'Save' },
  { vi: 'Hủy', en: 'Cancel' },
  { vi: 'Xóa', en: 'Delete' },
  { vi: 'Chỉnh sửa', en: 'Edit' },
  { vi: 'Thêm mới', en: 'Add New' },
  { vi: 'Tạo mới', en: 'Create' },
  { vi: 'Hoàn thành', en: 'Completed' },
  { vi: 'Chưa hoàn thành', en: 'Pending' },
  { vi: 'Hết hạn', en: 'Overdue' },
  { vi: 'Hôm nay', en: 'Today' },
  { vi: 'Ngày mai', en: 'Tomorrow' },
  { vi: 'Tuần này', en: 'This Week' },
  { vi: 'Tháng này', en: 'This Month' },

  // Tasks & Grades
  { vi: 'Nhiệm vụ cần làm', en: 'Tasks To Do' },
  { vi: 'Ưu tiên cao', en: 'High Priority' },
  { vi: 'Ưu tiên trung bình', en: 'Medium Priority' },
  { vi: 'Ưu tiên thấp', en: 'Low Priority' },
  { vi: 'Hạn chót', en: 'Deadline' },
  { vi: 'Môn học', en: 'Subject' },
  { vi: 'Điểm trung bình', en: 'Grade Point Average (GPA)' },
  { vi: 'Học lực', en: 'Academic Standing' },
  { vi: 'Giỏi', en: 'Excellent' },
  { vi: 'Khá', en: 'Good' },
  { vi: 'Trung bình', en: 'Average' },
  { vi: 'Học kỳ 1', en: 'Semester 1' },
  { vi: 'Học kỳ 2', en: 'Semester 2' },
  { vi: 'Cả năm', en: 'Full Year' },

  // Group Study
  { vi: 'Sẵn sàng học nhóm?', en: 'Ready for Group Study?' },
  { vi: 'Mã phòng:', en: 'Room Code:' },
  { vi: 'Tạo phòng mới', en: 'Create New Room' },
  { vi: 'Vào phòng', en: 'Join Room' },
  { vi: 'RỜI PHÒNG', en: 'LEAVE ROOM' },
  { vi: 'Thảo luận', en: 'Discussion' },
  { vi: 'Bật Camera', en: 'Turn On Camera' },
  { vi: 'Tắt Camera', en: 'Turn Off Camera' },
  { vi: 'Bật Micro', en: 'Unmute Mic' },
  { vi: 'Tắt Micro', en: 'Mute Mic' },
  { vi: 'Chia sẻ màn hình', en: 'Share Screen' },

  // Copyright Modal & Language
  { vi: 'Chủ sở hữu & Bản quyền', en: 'Owner & Copyright' },
  { vi: 'Tuyên bố sở hữu trí tuệ', en: 'Intellectual Property Declaration' },
  { vi: 'Sao lưu & Khôi phục dữ liệu', en: 'Backup & Restore Data' },
  { vi: 'Xuất tệp JSON', en: 'Export JSON File' },
  { vi: 'Nhập từ tệp JSON', en: 'Import from JSON' },
  { vi: 'Khôi phục dữ liệu mẫu ban đầu', en: 'Reset to Sample Data' },
  { vi: 'Sao chép thông tin', en: 'Copy Info' },
  { vi: 'Đã sao chép', en: 'Copied' },
  { vi: 'Ngôn ngữ giao diện', en: 'Display Language' },
  { vi: 'Chuyển toàn bộ sang Tiếng Anh', en: 'Switch everything to English' },
  { vi: 'Chuyển toàn bộ sang Tiếng Việt', en: 'Switch everything to Vietnamese' },
  { vi: 'Ngoại trừ Logo StudyFlow được giữ nguyên', en: 'Except StudyFlow Logo which is preserved' }
];

// Listener callbacks
type LanguageListener = (lang: AppLanguage) => void;
const listeners = new Set<LanguageListener>();

let currentLang: AppLanguage = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
})();

export const getCurrentLanguage = (): AppLanguage => currentLang;

export const setAppLanguage = (lang: AppLanguage) => {
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}

  applyTranslationToDOM(lang);
  listeners.forEach(cb => cb(lang));
};

export const subscribeLanguage = (listener: LanguageListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Check if a node is part of the logo or should not be translated
function isLogoOrIgnored(element: HTMLElement | null): boolean {
  if (!element) return false;
  
  // Element attributes or class check
  if (
    element.hasAttribute('data-no-translate') ||
    element.hasAttribute('data-logo') ||
    element.classList.contains('logo') ||
    element.classList.contains('app-logo') ||
    element.id === 'logo'
  ) {
    return true;
  }

  // Preserve StudyFlow branded gradient text
  if (
    element.textContent?.trim() === 'StudyFlow' ||
    element.textContent?.trim() === 'Study' ||
    element.textContent?.trim() === 'Flow'
  ) {
    return true;
  }

  // Parent logo container
  let parent = element.parentElement;
  while (parent) {
    if (
      parent.hasAttribute('data-no-translate') ||
      parent.hasAttribute('data-logo') ||
      parent.classList.contains('logo') ||
      parent.classList.contains('app-logo')
    ) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

// Function to translate a single text chunk
export function translateText(text: string, targetLang: AppLanguage): string {
  if (!text || !text.trim()) return text;

  // Never translate StudyFlow brand name
  if (text.includes('StudyFlow')) {
    const parts = text.split('StudyFlow');
    return parts.map(p => translateText(p, targetLang)).join('StudyFlow');
  }

  let result = text;

  if (targetLang === 'en') {
    for (const item of DICTIONARY) {
      if (result.includes(item.vi)) {
        result = result.replaceAll(item.vi, item.en);
      }
    }
  } else {
    for (const item of DICTIONARY) {
      if (result.includes(item.en)) {
        result = result.replaceAll(item.en, item.vi);
      }
    }
  }

  return result;
}

// Translate all text nodes in the DOM
export function applyTranslationToDOM(targetLang: AppLanguage) {
  if (typeof document === 'undefined') return;

  const root = document.getElementById('root') || document.body;
  if (!root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        // Ignore scripts, styles, pre, code, math, and logo elements
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'code', 'pre', 'svg', 'math', 'noscript'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (isLogoOrIgnored(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const original = textNode.nodeValue;
    if (original && original.trim()) {
      const translated = translateText(original, targetLang);
      if (translated !== original) {
        textNode.nodeValue = translated;
      }
    }
  }

  // Also translate common input placeholders
  const inputs = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
  inputs.forEach(input => {
    if (isLogoOrIgnored(input)) return;
    if (input.placeholder) {
      const translated = translateText(input.placeholder, targetLang);
      if (translated !== input.placeholder) {
        input.placeholder = translated;
      }
    }
  });
}

// Setup a passive observer so whenever view or modal changes, new nodes get translated if active language is 'en'
let observerStarted = false;
let timeoutId: any = null;

export function initLanguageAutoTranslator() {
  if (typeof window === 'undefined' || observerStarted) return;
  observerStarted = true;

  // Initial run if English
  if (currentLang === 'en') {
    setTimeout(() => applyTranslationToDOM('en'), 200);
  }

  const observer = new MutationObserver(() => {
    if (currentLang !== 'en') return;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      applyTranslationToDOM('en');
    }, 150);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false
  });
}
