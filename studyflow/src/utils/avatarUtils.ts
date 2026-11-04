import { StudentProfile, TeacherProfile } from '../types';

/**
 * Check if the given avatar string represents an actual image (data URL, HTTP link, blob, or asset path)
 */
export const isImageAvatar = (avatar?: string): boolean => {
  if (!avatar || typeof avatar !== 'string') return false;
  const trimmed = avatar.trim();
  return (
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
};

/**
 * Resize and compress any uploaded image file to max 200x200px JPEG
 * Output is typically 8KB - 16KB, which completely prevents localStorage QuotaExceededError.
 */
export const compressAvatarImage = (file: File | Blob, maxSize = 200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('File không phải là định dạng hình ảnh hợp lệ'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Crop to square aspect ratio (center crop)
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = Math.min(minDim, maxSize);
          canvas.height = Math.min(minDim, maxSize);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped & scaled square
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, canvas.width, canvas.height);

          // Export as compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// Preset SVG avatars for students
export const STUDENT_AVATAR_PRESETS = [
  {
    id: 'st_boy_glasses',
    label: 'Nam sinh kính cận',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%2310b981"/><circle cx="50" cy="40" r="20" fill="%23fde047"/><path d="M22 88c0-15 13-26 28-26s28 11 28 26" fill="%23047857"/><circle cx="43" cy="38" r="6" fill="none" stroke="%231e293b" stroke-width="2.5"/><circle cx="57" cy="38" r="6" fill="none" stroke="%231e293b" stroke-width="2.5"/><path d="M49 38h2" stroke="%231e293b" stroke-width="2"/><path d="M44 48q6 4 12 0" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  {
    id: 'st_girl_bright',
    label: 'Nữ sinh thông thái',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%2306b6d4"/><circle cx="50" cy="40" r="20" fill="%23fecdd3"/><path d="M22 88c0-15 13-26 28-26s28 11 28 26" fill="%230891b2"/><path d="M28 32q22-16 44 0c0 14-8 26-22 26S28 46 28 32z" fill="%23854d0e"/><circle cx="43" cy="40" r="2.5" fill="%231e293b"/><circle cx="57" cy="40" r="2.5" fill="%231e293b"/><path d="M45 49q5 3 10 0" fill="none" stroke="%23e11d48" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  {
    id: 'st_boy_dynamic',
    label: 'Nam sinh năng động',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%233b82f6"/><circle cx="50" cy="40" r="20" fill="%23fed7aa"/><path d="M22 88c0-15 13-26 28-26s28 11 28 26" fill="%231d4ed8"/><path d="M30 35c2-12 16-16 28-10 8 4 12 14 12 14s-8-4-18-2c-8 1-14 6-22-2z" fill="%231e293b"/><circle cx="43" cy="40" r="2.5" fill="%231e293b"/><circle cx="57" cy="40" r="2.5" fill="%231e293b"/><path d="M44 48q6 4 12 0" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  {
    id: 'st_grad_cap',
    label: 'Thủ khoa tốt nghiệp',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%238b5cf6"/><circle cx="50" cy="48" r="18" fill="%23fed7aa"/><path d="M22 90c0-16 13-26 28-26s28 10 28 26" fill="%236d28d9"/><path d="M50 18l26 10-26 10-26-10z" fill="%231e1b4b"/><path d="M36 32v12c0 8 6 12 14 12s14-4 14-12V32" fill="none" stroke="%231e1b4b" stroke-width="2"/><circle cx="76" cy="38" r="3" fill="%23f59e0b"/></svg>`
  },
  {
    id: 'st_star',
    label: 'Ngôi sao học tập',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%23f59e0b"/><polygon points="50,15 61,38 86,41 68,59 72,84 50,72 28,84 32,59 14,41 39,38" fill="%23ffffff"/><circle cx="42" cy="50" r="3" fill="%23d97706"/><circle cx="58" cy="50" r="3" fill="%23d97706"/><path d="M45 58q5 4 10 0" fill="none" stroke="%23d97706" stroke-width="2.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'st_cat',
    label: 'Mèo chăm học',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%23ec4899"/><polygon points="32,20 44,36 24,38" fill="%23f472b6"/><polygon points="68,20 76,38 56,36" fill="%23f472b6"/><circle cx="50" cy="52" r="26" fill="%23ffffff"/><circle cx="40" cy="48" r="3.5" fill="%231e293b"/><circle cx="60" cy="48" r="3.5" fill="%231e293b"/><polygon points="50,55 46,59 54,59" fill="%23f43f5e"/><path d="M44 63q6 4 12 0" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/></svg>`
  }
];

// Preset SVG avatars for teachers
export const TEACHER_AVATAR_PRESETS = [
  {
    id: 'tc_aodai',
    label: 'Cô giáo áo dài',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%230ea5e9"/><circle cx="50" cy="38" r="18" fill="%23fde047"/><path d="M22 88c0-16 13-26 28-26s28 10 28 26" fill="%23e11d48"/><path d="M30 30c0-10 9-16 20-16s20 6 20 16c0 14-8 24-20 24s-20-10-20-24z" fill="%231e293b"/><circle cx="50" cy="39" r="14" fill="%23fde047"/><circle cx="44" cy="38" r="2.5" fill="%231e293b"/><circle cx="56" cy="38" r="2.5" fill="%231e293b"/><path d="M45 46q5 3 10 0" fill="none" stroke="%23e11d48" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  {
    id: 'tc_suit',
    label: 'Thầy giáo thanh lịch',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%232563eb"/><circle cx="50" cy="38" r="18" fill="%23fed7aa"/><path d="M22 88c0-16 13-26 28-26s28 10 28 26" fill="%231e293b"/><polygon points="50,62 44,76 50,90 56,76" fill="%23dc2626"/><polygon points="44,62 50,72 56,62" fill="%23ffffff"/><circle cx="43" cy="36" r="5" fill="none" stroke="%231e293b" stroke-width="2"/><circle cx="57" cy="36" r="5" fill="none" stroke="%231e293b" stroke-width="2"/><path d="M48 36h4" stroke="%231e293b" stroke-width="1.5"/></svg>`
  },
  {
    id: 'tc_science',
    label: 'Giáo viên Khoa học',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%23059669"/><circle cx="50" cy="40" r="18" fill="%23fed7aa"/><path d="M22 88c0-15 13-26 28-26s28 11 28 26" fill="%23065f46"/><circle cx="43" cy="38" r="2.5" fill="%231e293b"/><circle cx="57" cy="38" r="2.5" fill="%231e293b"/><path d="M44 48q6 4 12 0" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/><path d="M68 65l6 14M74 65l-6 14" stroke="%23fde047" stroke-width="2.5" stroke-linecap="round"/></svg>`
  },
  {
    id: 'tc_academic',
    label: 'Học vị Giảng viên',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="%23d97706"/><circle cx="50" cy="42" r="18" fill="%23fed7aa"/><path d="M22 88c0-15 13-26 28-26s28 11 28 26" fill="%2378350f"/><path d="M50 16l22 8-22 8-22-8z" fill="%231e1b4b"/><circle cx="43" cy="40" r="2.5" fill="%231e293b"/><circle cx="57" cy="40" r="2.5" fill="%231e293b"/><path d="M45 49q5 3 10 0" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/></svg>`
  }
];

/**
 * Safely save student profile across localStorage and sync with server
 */
export const saveStudentProfileSafe = (profile: StudentProfile) => {
  try {
    localStorage.setItem('studyflow_student_profile', JSON.stringify(profile));
    // Also sync the calendar header info key so they never diverge!
    localStorage.setItem('studyflow_student_info', JSON.stringify({
      name: profile.name,
      className: profile.className,
      school: profile.schoolName
    }));
  } catch (err) {
    console.warn('LocalStorage save student profile failed, attempting recovery:', err);
    // If quota error, retry with stripped avatar
    try {
      const stripped = { ...profile, avatar: profile.name.slice(0, 2).toUpperCase() };
      localStorage.setItem('studyflow_student_profile', JSON.stringify(stripped));
    } catch {}
  }

  // Backup to server async
  try {
    fetch('/api/profile/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }).catch(() => {});
  } catch {}

  // Broadcast event in current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studyflow_profile_updated', { detail: { type: 'student', profile } }));
  }
};

/**
 * Safely save teacher profile across localStorage and sync with server
 */
export const saveTeacherProfileSafe = (profile: TeacherProfile) => {
  try {
    localStorage.setItem('studyflow_teacher_profile', JSON.stringify(profile));
  } catch (err) {
    console.warn('LocalStorage save teacher profile failed, attempting recovery:', err);
    try {
      const stripped = { ...profile, avatar: (profile.name || 'CP').slice(0, 2).toUpperCase() };
      localStorage.setItem('studyflow_teacher_profile', JSON.stringify(stripped));
    } catch {}
  }

  // Backup to server async
  try {
    fetch('/api/profile/teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }).catch(() => {});
  } catch {}

  // Broadcast event in current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studyflow_profile_updated', { detail: { type: 'teacher', profile } }));
  }
};
