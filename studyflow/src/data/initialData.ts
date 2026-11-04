import { CalendarEvent, TaskItem, LibraryItem, CountdownItem, TeacherProfile, TeacherClass, StudentProfile, Notice, FlashcardDeck } from '../types';

export const pad = (n: number) => String(n).padStart(2, '0');

export const formatDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const getMonday = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const formatHours = (h: number) => {
  const hr = Math.floor(h);
  const min = Math.round((h % 1) * 60);
  return `${hr}:${pad(min)}`;
};

export const DOW_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const DOW_FULL_LABELS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

export const EVENT_TYPE_MAP: Record<string, { 
  label: string; 
  icon: string; 
  bgClass: string; 
  borderClass: string; 
  textClass: string; 
  color: string;
  gradientClass: string;
  gradientBadge: string;
  glowClass: string;
}> = {
  class: {
    label: 'Lịch học',
    icon: '📚',
    bgClass: 'bg-cyan-50/90 dark:bg-cyan-950/50 text-cyan-950 dark:text-cyan-100',
    borderClass: 'border-cyan-300 dark:border-cyan-700/60',
    textClass: 'text-cyan-900 dark:text-cyan-200',
    color: '#0891b2',
    gradientClass: 'cal-event-class',
    gradientBadge: 'bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-blue-500/20 text-cyan-900 dark:text-cyan-300 border border-cyan-500/35 shadow-xs shadow-cyan-500/15',
    glowClass: 'shadow-cyan-500/25'
  },
  exam: {
    label: 'Thi / Kiểm tra',
    icon: '📝',
    bgClass: 'bg-rose-50/90 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100',
    borderClass: 'border-rose-300 dark:border-rose-700/60',
    textClass: 'text-rose-900 dark:text-rose-200',
    color: '#e11d48',
    gradientClass: 'cal-event-exam',
    gradientBadge: 'bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-violet-500/20 text-rose-900 dark:text-rose-300 border border-rose-500/35 shadow-xs shadow-rose-500/15',
    glowClass: 'shadow-rose-500/25'
  },
  act: {
    label: 'Hoạt động',
    icon: '🎯',
    bgClass: 'bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100',
    borderClass: 'border-indigo-300 dark:border-indigo-700/60',
    textClass: 'text-indigo-900 dark:text-indigo-200',
    color: '#6366f1',
    gradientClass: 'cal-event-act',
    gradientBadge: 'bg-gradient-to-r from-indigo-500/20 via-blue-500/15 to-cyan-500/20 text-indigo-900 dark:text-indigo-300 border border-indigo-500/35 shadow-xs shadow-indigo-500/15',
    glowClass: 'shadow-indigo-500/25'
  },
  due: {
    label: 'Hạn nộp bài',
    icon: '⏳',
    bgClass: 'bg-amber-50/90 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100',
    borderClass: 'border-amber-300 dark:border-amber-700/60',
    textClass: 'text-amber-900 dark:text-amber-200',
    color: '#d97706',
    gradientClass: 'cal-event-due',
    gradientBadge: 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/25 text-amber-900 dark:text-amber-300 border border-amber-500/35 shadow-xs shadow-amber-500/15',
    glowClass: 'shadow-amber-500/25'
  }
};

const today = new Date();
today.setHours(0, 0, 0, 0);
const thisMonday = getMonday(today);

export const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 1, t: 'Sinh học', type: 'class', date: formatDate(addDays(thisMonday, 3)), dow: 3, h: 7, d: 1.5, room: 'Phòng 204 – Dãy B' },
  { id: 2, t: 'Thi giữa kỳ Toán', type: 'exam', date: formatDate(addDays(thisMonday, 3)), dow: 3, h: 9, d: 1.5, room: 'Hội trường A' },
  { id: 3, t: 'Họp BCH Đoàn trường', type: 'act', date: formatDate(addDays(thisMonday, 3)), dow: 3, h: 14, d: 1.5, room: 'Phòng Hội đồng' },
  { id: 4, t: 'Lịch sử', type: 'class', date: formatDate(addDays(thisMonday, 4)), dow: 4, h: 8, d: 1.5, room: 'Phòng 204' },
  { id: 5, t: 'Hạn nộp bài tập', type: 'due', date: formatDate(addDays(thisMonday, 5)), dow: 5, h: 23, d: 0.5, room: 'Nộp qua Google Classroom' },
  { id: 6, t: 'Toán – Giải tích', type: 'class', date: formatDate(addDays(thisMonday, 0)), dow: 0, h: 7, d: 1.5, room: 'Phòng 204' },
  { id: 7, t: 'Vật lý 12', type: 'class', date: formatDate(addDays(thisMonday, 1)), dow: 1, h: 8, d: 1.5, room: 'Lab 2' },
  { id: 8, t: 'Tiếng Anh', type: 'class', date: formatDate(addDays(thisMonday, 2)), dow: 2, h: 9, d: 1.5, room: 'Phòng 310' }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 1,
    t: 'Thí nghiệm Vật lý: Khảo sát dao động con lắc lò xo',
    sub: 'Vật lý',
    due: '2026-11-07',
    done: false,
    status: 'in_progress',
    priority: 'high',
    hi: true,
    quadrant: 1,
    weight: 'HS 2',
    deadlineLabel: 'Còn 4 ngày nữa',
    actionBadge: '⚡ Xử lý ngay',
    targetGap: 'Vật lý đang thiếu -0.6đ so với mục tiêu...',
    aiReason: '⚡ Điểm số đang dưới mục tiêu (-0.6đ) + Bài thực hành hệ số 2 -> Cần hoàn thành sớm',
    subtasks: [
      { id: 'sub_1_1', text: 'Đo chu kỳ T qua 10 dao động toàn phần', done: true },
      { id: 'sub_1_2', text: 'Tính sai số thực nghiệm', done: false },
      { id: 'sub_1_3', text: 'Hoàn thiện bản báo cáo nộp giáo viên', done: false }
    ],
    dueTime: '16:30',
    note: 'Chú ý công thức tính sai số gián tiếp của gia tốc trọng trường g'
  },
  {
    id: 2,
    t: 'Ôn tập bài thơ Tây Tiến – Quang Dũng',
    sub: 'Ngữ văn',
    due: '2026-11-08',
    done: false,
    status: 'todo',
    priority: 'medium',
    quadrant: 2,
    weight: 'HS 2',
    deadlineLabel: 'Còn 5 ngày nữa',
    targetGap: 'Ngữ văn đang thiếu -0.5đ so với mục tiêu...',
    aiReason: '🎯 Ôn tập chuyên đề trọng tâm chuẩn bị kiểm tra giữa kỳ môn Văn',
    dueTime: '20:00',
    subtasks: [
      { id: 'sub_2_1', text: 'Học thuộc 14 câu đầu', done: false },
      { id: 'sub_2_2', text: 'Phân tích bức tranh thiên nhiên Tây Bắc hùng vĩ', done: false },
      { id: 'sub_2_3', text: 'Viết đoạn văn cảm nhận hình tượng người lính', done: false }
    ],
    note: 'Liên hệ với chất hào hoa, lãng mạn của thanh niên trí thức Hà Thành'
  },
  {
    id: 3,
    t: 'Giải 10 bài Đại số Chương 1 – Khảo sát hàm số',
    sub: 'Toán',
    due: '2026-11-03',
    done: false,
    status: 'in_progress',
    priority: 'high',
    hi: true,
    quadrant: 1,
    weight: 'HS 2',
    deadlineLabel: 'Còn 1 giờ (Hôm nay)',
    actionBadge: '⚡ Xử lý ngay',
    aiReason: '⚡ Sát ngày (Hôm nay) + Trọng số điểm cao (HS 2) -> Ô 1 (Làm ngay)',
    subtasks: [
      { id: 'sub_3_1', text: '5 câu khảo sát và vẽ đồ thị', done: true },
      { id: 'sub_3_2', text: '3 câu bài toán tương giao', done: false },
      { id: 'sub_3_3', text: '2 câu nâng cao min-max tham số m', done: false }
    ],
    note: 'Xem kĩ công thức đạo hàm cấp 2 và điểm cực trị'
  },
  {
    id: 4,
    t: 'Đọc SGK Lịch Sử Chương 3 và vẽ sơ đồ tư duy',
    sub: 'Lịch sử',
    due: '2026-11-02',
    done: true,
    status: 'done',
    priority: 'high',
    quadrant: 2,
    weight: 'HS 1',
    deadlineLabel: 'Hết hạn',
    subtasks: [
      { id: 'sub_4_1', text: 'Đọc 3 lượt SGK phần kháng chiến', done: true },
      { id: 'sub_4_2', text: 'Vẽ mindmap các mốc thời gian lớn', done: true }
    ],
    note: 'Ghi nhớ mốc Đại hội đại biểu toàn quốc lần thứ II (1951)'
  },
  {
    id: 5,
    t: 'Viết bài luận Tiếng Anh Task 2 về Môi trường',
    sub: 'Tiếng Anh',
    due: '2026-11-05',
    done: true,
    status: 'done',
    priority: 'high',
    quadrant: 2,
    weight: 'HS 1',
    deadlineLabel: 'Còn 2 ngày',
    subtasks: [
      { id: 'sub_5_1', text: 'Lập dàn ý 4 đoạn', done: true },
      { id: 'sub_5_2', text: 'Viết phần Body 1 & 2', done: true },
      { id: 'sub_5_3', text: 'Proofread ngữ pháp', done: true }
    ],
    note: 'Tập trung từ vựng C1 về climate change và carbon footprint'
  },
  {
    id: 6,
    t: 'Ôn lý thuyết Este – Lipit và bài tập thủy phân',
    sub: 'Hóa học',
    due: formatDate(addDays(today, 5)),
    done: false,
    status: 'todo',
    priority: 'high',
    quadrant: 2,
    weight: 'HS 2',
    deadlineLabel: 'Còn 5 ngày nữa',
    actionBadge: '🔥 Ưu tiên cao',
    aiReason: '🎯 Ôn tập chuyên đề quan trọng chuẩn bị cho kỳ thi giữa kỳ',
    subtasks: [
      { id: 'sub_6_1', text: 'Ôn tính chất este của phenol', done: false },
      { id: 'sub_6_2', text: 'Làm đề kiểm tra 15 phút online', done: false }
    ],
    note: 'Chú ý bài toán đốt cháy este đơn chức mạch hở'
  },
  {
    id: 7,
    t: 'Photo tài liệu Đề cương ôn thi cho nhóm bạn',
    sub: 'Toán',
    due: formatDate(addDays(today, 1)),
    done: false,
    status: 'todo',
    priority: 'low',
    quadrant: 3,
    weight: 'HS 1',
    deadlineLabel: 'Còn 1 ngày 1h (Ngày mai)',
    aiReason: '🤝 Sát hạn nhưng không tính điểm trực tiếp -> Ô 3 (Ủy quyền / Học nhóm)',
    subtasks: [],
    note: 'Tiệm in cổng trường, in 4 bộ đề cương có lời giải chi tiết'
  },
  {
    id: 8,
    t: 'Đọc thêm sách "Tư Duy Nhanh và Chậm" Chương 4',
    sub: 'Khác',
    due: formatDate(addDays(today, 7)),
    done: false,
    status: 'todo',
    priority: 'low',
    quadrant: 4,
    weight: 'HS 1',
    deadlineLabel: 'Còn 7 ngày nữa',
    aiReason: '🌱 AI NLP: Nhận diện "Đọc thêm sách" -> Ô 4 (Kho lưu trữ ý tưởng Someday/Maybe)',
    subtasks: [],
    note: 'Đọc thêm nâng cao kỹ năng tư duy phản biện'
  }
];

export const INITIAL_LIBRARY: LibraryItem[] = [
  {
    id: 1,
    t: 'Tổng hợp công thức Đại số 10',
    sub: 'Toán',
    type: 'Ghi chú',
    d: 'Hằng đẳng thức, phương trình bậc hai, hệ thức Vi-ét và các dạng bài thường gặp.',
    url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BA%A1i_s%E1%BB%91',
    fileType: 'text',
    fileContent: `# TỔNG HỢP CÔNG THỨC ĐẠI SỐ 10

## 1. 7 Hằng đẳng thức đáng nhớ:
1. (a + b)² = a² + 2ab + b²
2. (a - b)² = a² - 2ab + b²
3. a² - b² = (a - b)(a + b)
4. (a + b)³ = a³ + 3a²b + 3ab² + b³
5. (a - b)³ = a³ - 3a²b + 3ab² - b³
6. a³ + b³ = (a + b)(a² - ab + b²)
7. a³ - b³ = (a - b)(a² + ab + b²)

## 2. Phương trình bậc hai: ax² + bx + c = 0 (a ≠ 0)
- Biệt thức Delta: Δ = b² - 4ac
  - Nếu Δ > 0: Phương trình có 2 nghiệm phân biệt: x₁,₂ = (-b ± √Δ) / (2a)
  - Nếu Δ = 0: Phương trình có nghiệm kép: x = -b / (2a)
  - Nếu Δ < 0: Phương trình vô nghiệm trên tập số thực ℝ

## 3. Hệ thức Vi-ét:
- Tổng hai nghiệm: S = x₁ + x₂ = -b / a
- Tích hai nghiệm: P = x₁ · x₂ = c / a

*Lưu ý: Luôn kiểm tra điều kiện xác định trước khi giải phương trình.*`,
    fav: true
  },
  {
    id: 2,
    t: 'Bảng tuần hoàn và hóa trị các nguyên tố',
    sub: 'Hóa học',
    type: 'Tài liệu',
    d: 'Bảng tuần hoàn rút gọn kèm hóa trị thường gặp của các nguyên tố kim loại & phi kim.',
    url: 'https://vi.wikipedia.org/wiki/B%E1%BA%A3ng_tu%E1%BA%A7n_ho%C3%A0n',
    fileType: 'text',
    fileContent: `# BẢNG HÓA TRỊ CÁC NGUYÊN TỐ THƯỜNG GẶP

## Bài ca Hóa Trị:
Kali (K), Iot (I), Hidro (H)
Natri (Na) với Bạc (Ag), Clo (Cl) một loài
Là hóa trị I bạn ơi
Nhớ ghi cho rõ kẻo rồi phân vân!

Magiê (Mg), Kẽm (Zn) với Thủy ngân (Hg)
Oxi (O), Đồng (Cu), Thiếc (Sn) thêm phần Bari (Ba)
Cuối cùng thêm chú Canxi (Ca)
Hóa trị II nhớ có gì khó khăn!

Nhôm (Al) hóa trị III lần
In sâu trí óc khi cần có ngay
Cacbon (C), Silic (Si) này đây
Là hóa trị IV không ngày nào quên!

Sắt (Fe) lắm lúc phiền hà
Khi thì hai (II), lúc lại ba (III) mới tài!`,
    fav: false
  },
  {
    id: 3,
    t: 'Định luật Newton: tóm tắt & ứng dụng',
    sub: 'Vật lý',
    type: 'Ghi chú',
    d: 'Ba định luật Newton, ví dụ minh họa và bài tập vận dụng cơ bản.',
    url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BB%8Bnh_lu%E1%BA%ADt_chuy%E1%BB%83n_%C4%91%E1%BB%99ng_c%E1%BB%A7a_Newton',
    fileType: 'text',
    fileContent: `# BA ĐỊNH LUẬT NEWTON VỀ CHUYỂN ĐỘNG

## 1. Định luật I Newton (Quán tính):
Nếu một vật không chịu tác dụng của lực nào hoặc chịu tác dụng của các lực có hợp lực bằng không, thì vật đang đứng yên sẽ tiếp tục đứng yên, vật đang chuyển động sẽ tiếp tục chuyển động thẳng đều.

## 2. Định luật II Newton:
Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật:
👉 **F = m · a**  (hay a = F / m)

## 3. Định luật III Newton (Tương tác):
Trong mọi trường hợp, khi vật A tác dụng lên vật B một lực, thì vật B cũng tác dụng lại vật A một lực. Hai lực này là hai lực trực đối: cùng giá, cùng độ lớn nhưng ngược chiều:
👉 **F_AB = -F_BA**`,
    fav: false
  },
  {
    id: 4,
    t: 'Cấu trúc câu điều kiện (Conditional Sentences)',
    sub: 'Tiếng Anh',
    type: 'Ghi chú',
    d: 'Câu điều kiện loại 0, 1, 2, 3 với công thức và ví dụ sinh động.',
    url: '',
    fileType: 'text',
    fileContent: `# CONDITIONAL SENTENCES (CÂU ĐIỀU KIỆN)

### Type 0: Chân lý, sự thật hiển nhiên
- Cấu trúc: If + S + V(hiện tại đơn), S + V(hiện tại đơn)
- Ví dụ: If you heat water to 100 degrees Celsius, it boils.

### Type 1: Có thể xảy ra ở hiện tại hoặc tương lai
- Cấu trúc: If + S + V(hiện tại đơn), S + will / can + V-infinitive
- Ví dụ: If you study hard, you will pass the exam with high scores.

### Type 2: Không có thật ở hiện tại (Giả định)
- Cấu trúc: If + S + V-ed / were, S + would / could + V-infinitive
- Ví dụ: If I were you, I would take a short break now.

### Type 3: Không có thật trong quá khứ (Tiếc nuối)
- Cấu trúc: If + S + had + V3/ed, S + would have + V3/ed
- Ví dụ: If she had prepared earlier, she would have scored 10 points.`,
    fav: true
  },
  {
    id: 5,
    t: 'Dàn ý nghị luận xã hội chuẩn',
    sub: 'Ngữ văn',
    type: 'Mẫu bài',
    d: 'Khung mở bài, thân bài, kết bài và gợi ý lập luận chuẩn cho đề nghị luận.',
    url: '',
    fileType: 'text',
    fileContent: `# KHUNG DÀN Ý BÀI VĂN NGHỊ LUẬN XÃ HỘI (200 Chữ / 600 Chữ)

## 1. Mở bài (1-2 câu):
- Dẫn dắt vấn đề nghị luận (có thể dùng câu trích dẫn hoặc tình huống đời sống).
- Nêu bật vấn đề tư tưởng đạo lý hoặc hiện tượng đời sống cần bàn luận.

## 2. Thân bài:
- **Giải thích:** Khái niệm cốt lõi của vấn đề là gì?
- **Phân tích & Chứng minh:**
  - Vì sao vấn đề đó lại đúng/quan trọng đối với mỗi cá nhân và xã hội?
  - Dẫn chứng người thật, việc thật tiêu biểu (ví dụ: Chủ tịch Hồ Chí Minh, Nick Vujicic, các tấm gương học sinh vượt khó...).
- **Bình luận & Mở rộng (Phản biện):**
  - Phê phán lối sống ngược lại (thờ ơ, lười biếng, thiếu trách nhiệm).
- **Bài học nhận thức và hành động:**
  - Bản thân nhận thức được điều gì? Sẽ hành động cụ thể ra sao ngay hôm nay?

## 3. Kết bài:
- Khẳng định lại ý nghĩa lâu dài của vấn đề và gửi gắm thông điệp tích cực.`,
    fav: false
  },
  {
    id: 6,
    t: 'Đề cương ôn thi giữa kỳ Sinh học',
    sub: 'Sinh học',
    type: 'Đề thi',
    d: 'Danh sách câu hỏi trọng tâm về tế bào, hô hấp và di truyền.',
    url: '',
    fileType: 'text',
    fileContent: `# ĐỀ CƯƠNG TRỌNG TÂM SINH HỌC

## Chuyên đề 1: Tế bào nhân sơ và nhân thực
- Phân biệt màng sinh chất, tế bào chất, vùng nhân.
- Cấu trúc ribosome 70S ở vi khuẩn so với 80S ở sinh vật nhân thực.

## Chuyên đề 2: Chuyển hóa vật chất và năng lượng
- Quang hợp: Pha sáng tại màng thylakoid và pha tối tại chất nền stroma.
- Hô hấp tế bào: Đường phân -> Chu trình Krebs -> Chuỗi chuyền electron tạo ~36-38 ATP.

## Chuyên đề 3: Phân bào
- Nguyên phân: Kỳ đầu, kỳ giữa, kỳ sau, kỳ cuối (tạo 2 tế bào con 2n giống hệt nhau).
- Giảm phân: Tiếp hợp trao đổi chéo tạo biến dị tổ hợp đa dạng ở giao tử.`,
    fav: false
  }
];

export const INITIAL_COUNTDOWNS: CountdownItem[] = [
  {
    id: 1,
    title: 'Kỳ thi Tốt nghiệp THPT Quốc gia',
    targetDate: '2027-06-26',
    targetTime: '07:30',
    category: 'thpt',
    color: 'rose',
    targetScore: 'Mục tiêu: 28.0+ điểm Khối A00 / D01',
    note: 'Kiên trì từng ngày, mỗi bài tập giải hôm nay là một bước vững chắc bước vào giảng đường Đại học mơ ước!'
  },
  {
    id: 2,
    title: 'Kỳ thi Học sinh giỏi (HSG) Cấp Tỉnh',
    targetDate: '2027-01-15',
    targetTime: '07:00',
    category: 'hsg',
    color: 'emerald',
    targetScore: 'Mục tiêu: Đạt giải Nhất môn Toán / Tin học',
    note: 'Vượt qua giới hạn bản thân, tự tin vào những tháng ngày ôn luyện bền bỉ.'
  },
  {
    id: 3,
    title: 'Kỳ thi Giữa Học Kỳ',
    targetDate: '2026-11-20',
    targetTime: '07:30',
    category: 'term',
    color: 'amber',
    targetScore: 'Mục tiêu: Điểm trung bình các môn ≥ 9.0',
    note: 'Nắm chắc kiến thức cơ bản trong sách giáo khoa và luyện các dạng bài tập thầy cô đã giao.'
  },
  {
    id: 4,
    title: 'Kỳ thi Chứng chỉ IELTS / Tin học quốc tế',
    targetDate: '2027-04-10',
    targetTime: '08:00',
    category: 'cert',
    color: 'blue',
    targetScore: 'Mục tiêu: IELTS Band 7.5+',
    note: 'Duy trì luyện nghe và đọc tiếng Anh 30 phút mỗi sáng.'
  }
];

export const INITIAL_FOLDERS: { id: string; name: string; tag?: string; examCount?: number }[] = [];

export const INITIAL_EXAMS: any[] = [
  {
    id: 101,
    title: 'vantien1304-SỬ',
    subject: 'Lịch sử',
    durationMinutes: 90,
    submissionsCount: 7,
    status: 'published',
    assignedTo: 'Tất cả mọi người',
    assignedAt: '27/10/2026 19:13',
    createdAt: '27/10/2026 19:13',
    price: 'Miễn phí',
    isRecommended: true,
    description: 'Đề thi thử khảo sát kiến thức Lịch sử Việt Nam và Lịch sử Thế giới hiện đại - Phân hóa mức độ nhận biết, thông hiểu và vận dụng.',
    questions: [
      {
        id: 1,
        questionText: 'Hội nghị Ban Chấp hành Trung ương Đảng Cộng sản Đông Dương tháng 5/1941 đã chủ trương thành lập mặt trận nào?',
        options: [
          'A. Mặt trận Việt Minh (Việt Nam Độc lập Đồng minh)',
          'B. Mặt trận Thống nhất Dân tộc Phản đế Đông Dương',
          'C. Mặt trận Liên Việt',
          'D. Mặt trận Dân chủ Đông Dương'
        ],
        correctOption: 0,
        explanation: 'Tháng 5/1941, tại Pác Bó (Cao Bằng), Hội nghị Trung ương 8 do Nguyễn Ái Quốc chủ trì quyết định thành lập Mặt trận Việt Nam Độc lập Đồng minh (gọi tắt là Việt Minh).'
      },
      {
        id: 2,
        questionText: 'Thắng lợi nào của quân dân ta đã buộc thực dân Pháp phải ký Hiệp định Giơ-ne-vơ năm 1954 về Đông Dương?',
        options: [
          'A. Chiến thắng Việt Bắc thu - đông 1947',
          'B. Chiến dịch Biên giới thu - đông 1950',
          'C. Chiến thắng lịch sử Điện Biên Phủ 1954',
          'D. Cuộc tiến công chiến lược Đông - Xuân 1953 - 1954'
        ],
        correctOption: 2,
        explanation: 'Chiến thắng Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" ngày 7/5/1954 đã đập tan kế hoạch Nava và buộc Pháp ký Hiệp định Giơ-ne-vơ chấm dứt chiến tranh xâm lược.'
      },
      {
        id: 3,
        questionText: 'Sự kiện nào đánh dấu bước ngoặt chấm dứt hoàn toàn sự thống trị của chủ nghĩa thực dân cũ ở Việt Nam?',
        options: [
          'A. Cách mạng tháng Tám năm 1945 thành công',
          'B. Chiến dịch Hồ Chí Minh lịch sử 1975 toàn thắng',
          'C. Hiệp định Paris năm 1973 được ký kết',
          'D. Tổng tuyển cử bầu Quốc hội khóa I năm 1946'
        ],
        correctOption: 0,
        explanation: 'Cách mạng tháng Tám 1945 đã lật đổ ách thống trị của phát xít Nhật và thực dân Pháp hơn 80 năm, xóa bỏ chế độ phong kiến ngàn năm.'
      },
      {
        id: 4,
        questionText: 'Năm 1945, nhân dân Việt Nam giành được chính quyền từ tay lực lượng nào?',
        options: [
          'A. Thực dân Pháp',
          'B. Phát xít Nhật',
          'C. Quân đội Tưởng Giới Thạch',
          'D. Quân đội Anh'
        ],
        correctOption: 1,
        explanation: 'Ngày 9/3/1945 Nhật đảo chính Pháp. Trong Tổng khởi nghĩa tháng Tám năm 1945, nhân dân ta đứng lên giành chính quyền từ tay phát xít Nhật và chính phủ bù nhìn tay sai.'
      },
      {
        id: 5,
        questionText: 'Mục tiêu cao nhất của Đảng và nhân dân ta trong giai đoạn 1939 - 1945 là gì?',
        options: [
          'A. Đấu tranh đòi tự do, dân chủ, cơm áo, hòa bình',
          'B. Tạm gác khẩu hiệu cách mạng ruộng đất, tập trung giải phóng dân tộc',
          'C. Cải cách văn hóa giáo dục',
          'D. Xây dựng chủ nghĩa xã hội'
        ],
        correctOption: 1,
        explanation: 'Tại Hội nghị Trung ương 6 (1939) và Hội nghị Trung ương 8 (1941), Đảng ta xác định nhiệm vụ giải phóng dân tộc là bức thiết nhất, hàng đầu của cách mạng.'
      }
    ]
  },
  {
    id: 102,
    title: 'Đề thi thử THPT Quốc Gia - Môn Toán (Mã đề 102)',
    subject: 'Toán học',
    durationMinutes: 90,
    submissionsCount: 19,
    status: 'published',
    assignedTo: 'Tất cả mọi người',
    assignedAt: '25/10/2026 08:00',
    createdAt: '25/10/2026 08:00',
    price: 'Miễn phí',
    isRecommended: false,
    description: 'Bộ đề thi chuẩn hóa bám sát cấu trúc đề minh họa Bộ Giáo dục và Đào tạo gồm hàm số, tích phân, hình học không gian Oxyz và xác suất.',
    questions: [
      {
        id: 11,
        questionText: 'Cho hàm số y = f(x) có bảng biến thiên với f\'(x) > 0 trên khoảng (1; 3). Mệnh đề nào sau đây đúng?',
        options: [
          'A. Hàm số nghịch biến trên khoảng (1; 3)',
          'B. Hàm số đồng biến trên khoảng (1; 3)',
          'C. Hàm số đạt cực đại tại x = 2',
          'D. Hàm số không đổi trên khoảng (1; 3)'
        ],
        correctOption: 1,
        explanation: 'Đạo hàm f\'(x) > 0 trên khoảng (a; b) suy ra hàm số đồng biến trên khoảng đó.'
      },
      {
        id: 12,
        questionText: 'Tập nghiệm của bất phương trình log₂(x - 1) < 3 là:',
        options: [
          'A. (1; 9)',
          'B. (-∞; 9)',
          'C. (1; 8)',
          'D. (2; 9)'
        ],
        correctOption: 0,
        explanation: 'Điều kiện: x - 1 > 0 ⇔ x > 1. Khi đó x - 1 < 2³ = 8 ⇔ x < 9. Kết hợp điều kiện ta được tập nghiệm (1; 9).'
      }
    ]
  },
  {
    id: 103,
    title: 'Đề kiểm tra Tiếng Anh THPT - Reading & Grammar',
    subject: 'Tiếng Anh',
    durationMinutes: 60,
    submissionsCount: 14,
    status: 'published',
    assignedTo: 'Tất cả mọi người',
    assignedAt: '26/10/2026 14:00',
    createdAt: '26/10/2026 14:00',
    price: 'Miễn phí',
    isRecommended: false,
    description: 'Kiểm tra ngữ pháp trọng điểm: thì của động từ, mệnh đề quan hệ, câu bị động và đọc hiểu.',
    questions: [
      {
        id: 21,
        questionText: 'If she had studied harder for the exam, she ______ higher grades.',
        options: [
          'A. would get',
          'B. would have got',
          'C. will get',
          'D. had got'
        ],
        correctOption: 1,
        explanation: 'Câu điều kiện loại 3 diễn tả sự việc trái ngược với thực tế quá khứ: If + had + P2, S + would have + P2.'
      }
    ]
  }
];

export const STUDY_TIPS = [
  'Kỹ thuật Pomodoro: Học 25 phút, nghỉ 5 phút giúp não duy trì sự tập trung tối ưu.',
  'Chủ động gợi nhớ (Active Recall) hiệu quả gấp 3 lần việc chỉ đọc lại tài liệu nhiều lần.',
  'Giải thích lại kiến thức cho một người khác (Kỹ thuật Feynman) là cách tốt nhất để hiểu sâu.',
  'Uống đủ nước và ngủ đủ 7-8 tiếng trước ngày thi để não lưu trữ ký ức dài hạn tốt nhất.',
  'Ôn ngắt quãng (Spaced Repetition): Ôn lại sau 1 ngày, 3 ngày, 1 tuần để nhớ lâu hơn gấp nhiều lần.'
];

export const COPYRIGHT_INFO = {
  appName: 'StudyFlow – Quản lý học tập',
  version: '2.5.0 Pro Edition',
  author: 'Trần Văn Tiến',
  email: 'tranvantien13042009@gmail.com',
  year: '2026',
  license: 'Bản quyền được đăng ký & bảo lưu bởi tác giả.',
  description: 'Hệ thống quản lý học tập đa năng dành cho học sinh, sinh viên và giáo viên Việt Nam.'
};

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  name: 'Văn An',
  className: '12A1',
  schoolName: 'THPT Chuyên',
  avatar: 'VA',
  subjects: [
    { name: 'Toán học', currentScore: 8.5, targetScore: 9.5 },
    { name: 'Vật lí', currentScore: 7.2, targetScore: 9.0 },
    { name: 'Hóa học', currentScore: 8.0, targetScore: 9.0 },
    { name: 'Tiếng Anh', currentScore: 9.2, targetScore: 9.5 },
    { name: 'Ngữ văn', currentScore: 7.5, targetScore: 8.5 }
  ]
};

export const INITIAL_TEACHER_PROFILE: TeacherProfile = {
  name: 'Cô Phượng',
  username: 'giaovien',
  backupCode: 'giaovien',
  subject: 'Vật lí',
  password: '123456',
  avatar: 'CP'
};

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 1,
    title: '📢 Lịch ôn tập kiểm tra Giữa Kỳ 1 môn Vật lí & Toán',
    content: 'Các em học sinh lưu ý: Tuần tới chúng ta sẽ có bài kiểm tra khảo sát chất lượng giữa kỳ. Đề nghị các em ôn tập kỹ chuyên đề Dao động cơ và Đại số chương 2.',
    pinned: true,
    createdAt: '2026-10-28T08:00:00.000Z',
    reactions: { '❤️': 12, '👍': 18, '🔥': 9 }
  },
  {
    id: 2,
    title: '🎉 Lịch nộp bài tập lớn và Danh sách chia nhóm',
    content: 'Hạn nộp bài tập lớn nhóm là 23h59 ngày Chủ Nhật. Các nhóm nộp qua hệ thống StudyFlow hoặc gửi trực tiếp cho giáo viên bộ môn.',
    pinned: false,
    createdAt: '2026-10-29T10:30:00.000Z',
    reactions: { '❤️': 8, '👍': 14 }
  }
];

export const INITIAL_TEACHER_CLASSES: TeacherClass[] = [
  {
    id: 'class_1',
    number: 1,
    name: '12A2 - ( Vật Lí Cơ Bản )',
    subject: 'Vật lí',
    grade: 12,
    studentsCount: 22,
    lessonsCount: 14,
    examsCount: 4,
    avgScore: 7.6,
    room: 'Phòng 204',
    schedule: 'Thứ 2, Thứ 4 (Tiết 1-2)',
    students: [
      { id: 's1', name: 'Nguyễn Hoàng Nam', rollNumber: '12A2-01', avgScore: 8.8, completedTasks: 9, totalTasks: 10, status: 'good' },
      { id: 's2', name: 'Trần Thị Mai Anh', rollNumber: '12A2-02', avgScore: 9.2, completedTasks: 10, totalTasks: 10, status: 'good' },
      { id: 's3', name: 'Lê Minh Quân', rollNumber: '12A2-03', avgScore: 6.4, completedTasks: 6, totalTasks: 10, status: 'needs_attention', weaknesses: ['Đồ thị dao động', 'Mạch RLC'] },
      { id: 's4', name: 'Phạm Thu Trang', rollNumber: '12A2-04', avgScore: 7.8, completedTasks: 8, totalTasks: 10, status: 'average' },
      { id: 's5', name: 'Đỗ Đức Thắng', rollNumber: '12A2-05', avgScore: 5.5, completedTasks: 5, totalTasks: 10, status: 'needs_attention', weaknesses: ['Hiện tượng sóng dừng', 'Định luật Ôm'] }
    ]
  },
  {
    id: 'class_2',
    number: 2,
    name: '12A5 Vật Lí - ( Vật Lí Cơ Bản )',
    subject: 'Vật lí',
    grade: 12,
    studentsCount: 18,
    lessonsCount: 12,
    examsCount: 3,
    avgScore: 7.2,
    room: 'Phòng 305',
    schedule: 'Thứ 3, Thứ 6 (Tiết 3-4)',
    students: [
      { id: 's6', name: 'Vũ Quốc Bảo', rollNumber: '12A5-01', avgScore: 8.5, completedTasks: 8, totalTasks: 8, status: 'good' },
      { id: 's7', name: 'Ngô Mỹ Linh', rollNumber: '12A5-02', avgScore: 6.8, completedTasks: 6, totalTasks: 8, status: 'average' },
      { id: 's8', name: 'Hoàng Văn Dũng', rollNumber: '12A5-03', avgScore: 5.8, completedTasks: 4, totalTasks: 8, status: 'needs_attention', weaknesses: ['Con lắc đơn'] }
    ]
  },
  {
    id: 'class_3',
    number: 3,
    name: '12A2 Luyện Thi Đại Học',
    subject: 'Vật lí',
    grade: 12,
    studentsCount: 18,
    lessonsCount: 20,
    examsCount: 6,
    avgScore: 8.4,
    room: 'Phòng Đa năng A',
    schedule: 'Thứ 5, Thứ 7 (Tiết 1-3)',
    students: [
      { id: 's9', name: 'Bùi Gia Huy', rollNumber: '12LT-01', avgScore: 9.4, completedTasks: 12, totalTasks: 12, status: 'good' },
      { id: 's10', name: 'Đặng Thanh Thảo', rollNumber: '12LT-02', avgScore: 8.9, completedTasks: 11, totalTasks: 12, status: 'good' }
    ]
  },
  {
    id: 'class_4',
    number: 4,
    name: '12A5 Luyện THI Đại Học',
    subject: 'Vật lí',
    grade: 12,
    studentsCount: 15,
    lessonsCount: 18,
    examsCount: 5,
    avgScore: 8.1,
    room: 'Phòng Đa năng B',
    schedule: 'Thứ 4, Chủ Nhật (Tiết 4-6)',
    students: [
      { id: 's11', name: 'Nguyễn Văn Tiến', rollNumber: '12LT5-01', avgScore: 9.6, completedTasks: 10, totalTasks: 10, status: 'good' }
    ]
  },
  {
    id: 'class_5',
    number: 5,
    name: '10A1 Vật Lý Nâng Cao',
    subject: 'Vật lí',
    grade: 10,
    studentsCount: 20,
    lessonsCount: 10,
    examsCount: 2,
    avgScore: 8.6,
    room: 'Lab 1',
    schedule: 'Thứ 2 (Tiết 3-5)',
    students: [
      { id: 's12', name: 'Lê Khánh Linh', rollNumber: '10NC-01', avgScore: 9.0, completedTasks: 6, totalTasks: 6, status: 'good' }
    ]
  }
];


export const INITIAL_DECKS: FlashcardDeck[] = [
  {
    id: 'deck_1',
    title: 'Từ vựng IELTS Academic Band 7.5+',
    subject: 'Tiếng Anh',
    description: 'Bộ từ vựng học thuật C1/C2 nâng cao bám sát đề thi IELTS, kèm câu ví dụ ngữ cảnh thực tế.',
    cardCount: 8,
    remainingCount: 4,
    goodCount: 4,
    againCount: 2,
    createdAt: new Date().toISOString(),
    lastStudyDate: '2026-11-03T14:21:55.956Z',
    streak: 1,
    cards: [
      { id: 'c1', front: 'Ubiquitous', back: 'Phổ biến khắp nơi, đâu đâu cũng thấy', hint: 'Smartphones have become ubiquitous in modern society.', status: 'mastered', interval: 6, easiness: 2.6, repetitions: 2, isStarred: true },
      { id: 'c2', front: 'Mitigate', back: 'Làm giảm nhẹ, giảm bớt tác động tiêu cực', hint: 'Governments must act quickly to mitigate the impact of climate change.', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'c3', front: 'Pernicious', back: 'Có tác hại nguy hiểm, độc hại ngầm ngẫm', hint: 'The pernicious influence of disinformation on social media.', status: 'learning', interval: 1, easiness: 2.4, repetitions: 1, isStarred: false },
      { id: 'c4', front: 'Catalyst', back: 'Chất xúc tác, tác nhân thúc đẩy sự thay đổi', hint: 'Technological innovation acted as a catalyst for economic growth.', status: 'mastered', interval: 4, easiness: 2.5, repetitions: 2, isStarred: false },
      { id: 'c5', front: 'Resilience', back: 'Khả năng phục hồi, kiên cường vượt qua nghịch cảnh', hint: 'Students demonstrated remarkable resilience during the pandemic.', status: 'mastered', interval: 6, easiness: 2.6, repetitions: 2, isStarred: true },
      { id: 'c6', front: 'Pragmatic', back: 'Thực tế, thực dụng, dựa trên tính khả thi', hint: 'We need to adopt a pragmatic approach to solve this dilemma.', status: 'mastered', interval: 4, easiness: 2.5, repetitions: 2, isStarred: false },
      { id: 'c7', front: 'Exacerbate', back: 'Làm trầm trọng thêm, làm tồi tệ hơn', hint: 'Deforestation will exacerbate global warming and soil erosion.', status: 'again', interval: 0, easiness: 2.2, repetitions: 0, isStarred: false },
      { id: 'c8', front: 'Prevalent', back: 'Thịnh hành, phổ biến rộng rãi trong cộng đồng', hint: 'This health concern is especially prevalent among teenagers.', status: 'again', interval: 0, easiness: 2.2, repetitions: 0, isStarred: false }
    ]
  },
  {
    id: 'deck_2',
    title: 'Công thức Giải tích & Đạo hàm 12',
    subject: 'Toán',
    description: 'Tổng hợp các công thức đạo hàm cơ bản, đạo hàm hàm hợp, tích phân và nguyên hàm chuẩn THPTQG.',
    cardCount: 8,
    remainingCount: 7,
    goodCount: 1,
    againCount: 1,
    createdAt: new Date().toISOString(),
    lastStudyDate: '2 ngày trước',
    streak: 1,
    cards: [
      { id: 'm1', front: '(u · v)\'', back: 'u\'·v + u·v\' (Đạo hàm tích hai hàm số)', hint: 'Quy tắc nhân cơ bản', status: 'mastered', interval: 4, easiness: 2.5, repetitions: 1, isStarred: true },
      { id: 'm2', front: '(u / v)\'', back: '(u\'·v - u·v\') / v² (với v ≠ 0)', hint: 'Quy tắc chia hai hàm số', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'm3', front: '(sin x)\'', back: 'cos x', hint: 'Đạo hàm lượng giác cơ bản', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'm4', front: '(cos x)\'', back: '-sin x', hint: 'Lưu ý dấu âm đằng trước', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'm5', front: '(tan x)\'', back: '1 / cos²x = 1 + tan²x', hint: 'Đạo hàm hàm lượng giác', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'm6', front: '(ln x)\'', back: '1 / x (với điều kiện x > 0)', hint: 'Đạo hàm logarit tự nhiên', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'm7', front: '(e^x)\'', back: 'e^x', hint: 'Hàm số mũ cơ số e', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'm8', front: '∫ x^α dx', back: '(x^(α+1))/(α+1) + C (với α ≠ -1)', hint: 'Nguyên hàm hàm lũy thừa', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false }
    ]
  },
  {
    id: 'deck_3',
    title: 'Thuật ngữ Sinh học Di truyền & Gen',
    subject: 'Sinh Học',
    description: 'Bộ khái niệm trọng tâm về ADN, ARN, đột biến gen và quy luật di truyền Men-đen.',
    cardCount: 6,
    remainingCount: 5,
    goodCount: 1,
    againCount: 0,
    createdAt: new Date().toISOString(),
    lastStudyDate: 'Tuần trước',
    streak: 1,
    cards: [
      { id: 'b1', front: 'Đột biến điểm (Point mutation)', back: 'Là những biến đổi trong cấu trúc của gen liên quan đến một cặp nuclêôtit (thay thế, thêm hoặc mất).', hint: 'Liên quan đến đúng 1 cặp nu', status: 'mastered', interval: 5, easiness: 2.5, repetitions: 1, isStarred: true },
      { id: 'b2', front: 'Mã di truyền có tính thoái hóa', back: 'Nhiều bộ ba khác nhau cùng mã hóa cho một loại axit amin (trừ hai bộ ba AUG và UGG).', hint: 'Tính dư thừa của mã di truyền', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'b3', front: 'Nguyên tắc bổ sung trong ADN', back: 'A liên kết với T bằng 2 liên kết hiđrô, G liên kết với X bằng 3 liên kết hiđrô.', hint: 'A-T, G-X', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'b4', front: 'Alen (Allele)', back: 'Các trạng thái khác nhau của cùng một gen, chiếm cùng một locus trên cặp nhiễm sắc thể tương đồng.', hint: 'Trạng thái biểu hiện của gen', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'b5', front: 'Phiên mã (Transcription)', back: 'Quá trình tổng hợp phân tử ARN trên mạch khuôn ADN do enzim ARN polimeraza xúc tác.', hint: 'ADN -> mARN', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false },
      { id: 'b6', front: 'Dịch mã (Translation)', back: 'Quá trình tổng hợp chuỗi pôlipeptit (protein) dựa trên thông tin di truyền chứa trong mARN.', hint: 'mARN -> Protein tại Ribosome', status: 'learning', interval: 1, easiness: 2.5, repetitions: 1, isStarred: false }
    ]
  }
];

