export interface RoadmapMilestone {
  title: string;
  desc?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface RoadmapBranch {
  id: string;
  stageName: string;
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  icon: string;
  milestones: RoadmapMilestone[];
}

export interface SubjectRoadmap {
  subject: string;
  code: string;
  icon: string;
  summary: string;
  branches: RoadmapBranch[];
}

export const SUBJECT_ROADMAPS: Record<string, SubjectRoadmap> = {
  'Toán': {
    subject: 'Toán',
    code: 'math',
    icon: '🧮',
    summary: 'Lộ trình Chinh phục 9+ môn Toán: Hàm số & Đạo hàm, Khối không gian Oxyz, Nguyên hàm Tích phân và Luyện đề chuẩn Bộ Giáo Dục.',
    branches: [
      {
        id: 'toan-b1',
        stageName: 'Chuyên đề 1',
        title: 'Hàm số & Ứng dụng Đạo hàm',
        tag: 'Nền tảng 8+',
        tagColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        description: 'Khảo sát đồ thị, cực trị, giá trị lớn nhất - nhỏ nhất và bài toán tương giao đồ thị chứa tham số m.',
        icon: '📈',
        milestones: [
          { title: 'Sự đồng biến & nghịch biến của hàm số', priority: 'high' },
          { title: 'Cực trị hàm bậc ba & hàm trùng phương', priority: 'high' },
          { title: 'Tiệm cận đứng, ngang & Tương giao đồ thị', priority: 'medium' },
          { title: 'Bài toán min-max ứng dụng thực tế', priority: 'medium' }
        ]
      },
      {
        id: 'toan-b2',
        stageName: 'Chuyên đề 2',
        title: 'Hình học Không gian & Oxyz',
        tag: 'Hình học trọng tâm',
        tagColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        description: 'Thể tích khối đa diện, góc và khoảng cách không gian, phương trình mặt cầu, mặt phẳng và đường thẳng trong Oxyz.',
        icon: '📐',
        milestones: [
          { title: 'Thể tích khối chóp & khối lăng trụ', priority: 'high' },
          { title: 'Góc giữa đường thẳng - mặt phẳng & Khoảng cách', priority: 'high' },
          { title: 'Hệ trục tọa độ Oxyz & Phương trình mặt cầu', priority: 'medium' },
          { title: 'Vị trí tương đối mặt phẳng và đường thẳng', priority: 'medium' }
        ]
      },
      {
        id: 'toan-b3',
        stageName: 'Chuyên đề 3',
        title: 'Nguyên hàm, Tích phân & Số phức',
        tag: 'Giải tích nâng cao',
        tagColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        description: 'Kỹ thuật đổi biến, tích phân từng phần, ứng dụng tính diện tích - thể tích và số phức vận dụng cao.',
        icon: '♾️',
        milestones: [
          { title: 'Bảng nguyên hàm cơ bản & Phương pháp đổi biến số', priority: 'high' },
          { title: 'Ứng dụng tích phân tính diện tích hình phẳng', priority: 'high' },
          { title: 'Dạng đại số số phức, môđun & số phức liên hợp', priority: 'medium' },
          { title: 'Tập hợp điểm biểu diễn số phức và cực trị số phức', priority: 'medium' }
        ]
      },
      {
        id: 'toan-b4',
        stageName: 'Chuyên đề 4',
        title: 'Xác suất & Luyện Đề Thi Thử 9+',
        tag: 'Bứt phá 9-10',
        tagColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        description: 'Tổ hợp xác suất, phân loại câu hỏi vận dụng cao 8.5 - 10 điểm và luyện đề thi thử bám sát đề minh họa.',
        icon: '🎯',
        milestones: [
          { title: 'Quy tắc đếm, Hoán vị - Chỉnh hợp - Tổ hợp', priority: 'high' },
          { title: 'Xác suất cổ điển & Quy tắc nhân xác suất', priority: 'high' },
          { title: 'Luyện 15 đề thi thử chuẩn cấu trúc Bộ GD', priority: 'high' },
          { title: 'Rèn tốc độ bấm máy Casio & Tránh bẫy đề thi', priority: 'medium' }
        ]
      }
    ]
  },
  'Vật lý': {
    subject: 'Vật lý',
    code: 'physics',
    icon: '⚡',
    summary: 'Lộ trình Bứt phá Vật lý 12: Dao động điều hòa, Sóng cơ, Dòng điện xoay chiều RLC và Vật lý Hạt nhân hiện đại.',
    branches: [
      {
        id: 'ly-b1',
        stageName: 'Chuyên đề 1',
        title: 'Dao động Cơ & Con lắc',
        tag: 'Cốt lõi điểm 8+',
        tagColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        description: 'Phương trình dao động điều hòa, con lắc lò xo, con lắc đơn, đồ thị dao động và dao động cưỡng bức.',
        icon: '🔄',
        milestones: [
          { title: 'Phương trình dao động x, v, a & Vecto quay Fresnel', priority: 'high' },
          { title: 'Con lắc lò xo: Chu kỳ, năng lượng & cắt ghép lò xo', priority: 'high' },
          { title: 'Con lắc đơn & Vận tốc dao động góc lớn', priority: 'medium' },
          { title: 'Hiện tượng cộng hưởng & Dao động tắt dần', priority: 'medium' }
        ]
      },
      {
        id: 'ly-b2',
        stageName: 'Chuyên đề 2',
        title: 'Sóng cơ học & Sóng âm',
        tag: 'Giao thoa & Sóng',
        tagColor: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        description: 'Phương trình truyền sóng, độ lệch pha, giao thoa sóng hai nguồn kết hợp, sóng dừng và đặc trưng âm.',
        icon: '🌊',
        milestones: [
          { title: 'Phương trình sóng & Độ lệch pha giữa 2 điểm', priority: 'high' },
          { title: 'Giao thoa hai nguồn kết hợp: Cực đại, cực tiểu', priority: 'high' },
          { title: 'Sóng dừng: Nút sóng, bụng sóng & Điều kiện có sóng dừng', priority: 'medium' },
          { title: 'Đặc trưng vật lý & Sinh lý của âm thanh', priority: 'medium' }
        ]
      },
      {
        id: 'ly-b3',
        stageName: 'Chuyên đề 3',
        title: 'Dòng điện xoay chiều RLC',
        tag: 'Trọng tâm bài thi',
        tagColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        description: 'Mạch xoay chiều RLC không phân nhánh, hiện tượng cộng hưởng, công suất tiêu thụ và máy biến áp.',
        icon: '🔌',
        milestones: [
          { title: 'Định luật Ohm cho mạch RLC nối tiếp', priority: 'high' },
          { title: 'Giản đồ vecto buộc & Chuẩn hóa số liệu điện xoay chiều', priority: 'high' },
          { title: 'Hiện tượng cộng hưởng điện & Công suất tiêu thụ P = UIcosφ', priority: 'high' },
          { title: 'Máy biến áp & Truyền tải điện năng đi xa', priority: 'medium' }
        ]
      },
      {
        id: 'ly-b4',
        stageName: 'Chuyên đề 4',
        title: 'Lượng tử ánh sáng & Hạt nhân',
        tag: 'Lý thuyết & Vận dụng',
        tagColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        description: 'Hiện tượng quang điện, thuyết photon, mẫu nguyên tử Bo, năng lượng liên kết hạt nhân và phản ứng hạt nhân.',
        icon: '⚛️',
        milestones: [
          { title: 'Hiện tượng quang điện ngoài & Giới hạn quang điện', priority: 'high' },
          { title: 'Mẫu nguyên tử Bo & Quang phổ vạch phát xạ Hydro', priority: 'medium' },
          { title: 'Độ hụt khối & Năng lượng liên kết riêng hạt nhân', priority: 'high' },
          { title: 'Định luật phóng xạ & Năng lượng phản ứng nhiệt hạch', priority: 'medium' }
        ]
      }
    ]
  },
  'Hóa học': {
    subject: 'Hóa học',
    code: 'chemistry',
    icon: '🧪',
    summary: 'Lộ trình Chinh phục Hóa học: Este - Lipit, Cacbohiđrat, Amin - Peptit, Đại cương Kim loại và Thực hành thí nghiệm.',
    branches: [
      {
        id: 'hoa-b1',
        stageName: 'Chuyên đề 1',
        title: 'Este - Lipit & Cacbohiđrat',
        tag: 'Hữu cơ cơ bản',
        tagColor: 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
        description: 'Cấu tạo, đồng phân este, phản ứng thủy phân, chất béo xà phòng hóa, glucozơ, tinh bột và xenlulozơ.',
        icon: '🧫',
        milestones: [
          { title: 'Đồng phân & Danh pháp este no đơn chức mạch hở', priority: 'high' },
          { title: 'Phản ứng xà phòng hóa & Thủy phân chất béo', priority: 'high' },
          { title: 'Glucozơ, Fructozơ & Phản ứng tráng bạc Ag', priority: 'medium' },
          { title: 'Tinh bột & Xenlulozơ: Phản ứng thủy phân & este hóa', priority: 'medium' }
        ]
      },
      {
        id: 'hoa-b2',
        stageName: 'Chuyên đề 2',
        title: 'Amin, Amino Axit & Peptit',
        tag: 'Trọng tâm phân loại',
        tagColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        description: 'Tính bazơ của amin, tính chất lưỡng tính của amino axit, liên kết peptit và bài toán quy đổi peptit.',
        icon: '🧬',
        milestones: [
          { title: 'Phân loại & Tính bazơ của các gốc Amin', priority: 'high' },
          { title: 'Amino axit: Tính lưỡng tính & Phản ứng trùng ngưng', priority: 'high' },
          { title: 'Peptit & Phản ứng màu Biure đặc trưng', priority: 'medium' },
          { title: 'Kỹ thuật đồng đẳng hóa và thủy phân peptit', priority: 'high' }
        ]
      },
      {
        id: 'hoa-b3',
        stageName: 'Chuyên đề 3',
        title: 'Đại cương Kim loại & Sắt - Nhôm',
        tag: 'Vô cơ cốt lõi',
        tagColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        description: 'Dãy điện hóa, ăn mòn kim loại, kim loại kiềm, kiềm thổ, hợp chất nhôm lưỡng tính và hợp chất sắt Crom.',
        icon: '⚙️',
        milestones: [
          { title: 'Dãy điện hóa kim loại & Ăn mòn điện hóa học', priority: 'high' },
          { title: 'Kim loại kiềm, kiềm thổ & Hợp chất Nhôm lưỡng tính', priority: 'high' },
          { title: 'Hợp chất Sắt (II, III) & Phản ứng với HNO3/H2SO4 đặc', priority: 'high' },
          { title: 'Điện phân dung dịch & Định luật Faraday', priority: 'medium' }
        ]
      },
      {
        id: 'hoa-b4',
        stageName: 'Chuyên đề 4',
        title: 'Thực nghiệm & Luyện Đề Chuẩn 9+',
        tag: 'Vận dụng cao 9+',
        tagColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        description: 'Hiện tượng thí nghiệm, nhận biết hóa chất, bài toán đồ thị vô cơ và kỹ thuật giải đề 50 phút.',
        icon: '🏆',
        milestones: [
          { title: 'Hiện tượng thực hành thí nghiệm & Nhận biết chất', priority: 'high' },
          { title: 'Đồ thị phản ứng kết tủa Al(OH)3 & BaSO4', priority: 'medium' },
          { title: 'Phương pháp bảo toàn e, điện tích & khối lượng', priority: 'high' },
          { title: 'Luyện 20 đề thi thử THPT Quốc Gia chuẩn cấu trúc', priority: 'high' }
        ]
      }
    ]
  },
  'Ngữ văn': {
    subject: 'Ngữ văn',
    code: 'literature',
    icon: '📖',
    summary: 'Lộ trình Làm chủ Môn Văn: Đọc hiểu 3 điểm tuyệt đối, NLXH 200 chữ sắc bén và Hệ thống tác phẩm văn học 12 trọng tâm.',
    branches: [
      {
        id: 'van-b1',
        stageName: 'Chuyên đề 1',
        title: 'Kỹ năng Đọc hiểu Văn bản',
        tag: 'Ăn chắc 3 điểm',
        tagColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        description: 'Nhận diện phương thức biểu đạt, biện pháp tu từ, thông điệp cốt lõi và kỹ năng trả lời trọn vẹn điểm số.',
        icon: '📜',
        milestones: [
          { title: 'Nhận diện 6 phương thức biểu đạt & Thể thơ chính xác', priority: 'high' },
          { title: 'Phân tích tác dụng biện pháp tu từ (Điệp, ẩn dụ, so sánh)', priority: 'high' },
          { title: 'Giải thích ý nghĩa câu văn/từ ngữ trong ngữ cảnh', priority: 'medium' },
          { title: 'Rút ra bài học nhận thức và hành động cá nhân', priority: 'high' }
        ]
      },
      {
        id: 'van-b2',
        stageName: 'Chuyên đề 2',
        title: 'Nghị luận Xã hội 200 chữ',
        tag: 'Sắc bén 2 điểm',
        tagColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        description: 'Cấu trúc 4 bước: Giải thích - Bình luận - Dẫn chứng thực tế - Bài học liên hệ bản thân.',
        icon: '✍️',
        milestones: [
          { title: 'Nắm vững cấu trúc 4 bước chuẩn đoạn văn 200 chữ', priority: 'high' },
          { title: 'Xây dựng sổ tay dẫn chứng người thật, việc thật thời sự', priority: 'high' },
          { title: 'Mở đoạn trực tiếp, ấn tượng & Tránh diễn giải lan man', priority: 'medium' },
          { title: 'Rèn luyện tốc độ viết đoạn văn trong tối đa 15-20 phút', priority: 'medium' }
        ]
      },
      {
        id: 'van-b3',
        stageName: 'Chuyên đề 3',
        title: 'Chuyên đề Thơ ca Kháng chiến',
        tag: 'Trọng tâm nghị luận',
        tagColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        description: 'Tây Tiến (Quang Dũng), Việt Bắc (Tố Hữu), Đất Nước (Nguyễn Khoa Điềm) và Sóng (Xuân Quỳnh).',
        icon: '🌿',
        milestones: [
          { title: 'Tây Tiến: Bức tranh thiên nhiên miền Tây & Vẻ đẹp người lính', priority: 'high' },
          { title: 'Việt Bắc: Khúc ca ân tình cách mạng quân dân thắm thiết', priority: 'high' },
          { title: 'Đất Nước: Định nghĩa Đất Nước từ ca dao, lịch sử, văn hóa', priority: 'high' },
          { title: 'Sóng: Vẻ đẹp tâm hồn người phụ nữ trong tình yêu thủy chung', priority: 'medium' }
        ]
      },
      {
        id: 'van-b4',
        stageName: 'Chuyên đề 4',
        title: 'Văn xuôi Hiện thực & Nhân đạo',
        tag: 'Bứt phá 8.5+',
        tagColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        description: 'Vợ chồng A Phủ, Vợ nhặt, Chiếc thuyền ngoài xa, Người lái đò Sông Đà và rèn kỹ năng so sánh văn học.',
        icon: '📚',
        milestones: [
          { title: 'Vợ chồng A Phủ: Sức sống tiềm tàng và khát vọng tự do của Mị', priority: 'high' },
          { title: 'Vợ nhặt: Tình người & Niềm tin tương lai giữa nạn đói 1945', priority: 'high' },
          { title: 'Chiếc thuyền ngoài xa: Nghịch lý nghệ thuật và hiện thực cuộc đời', priority: 'high' },
          { title: 'Kỹ năng đưa lý luận văn học & Mở bài nâng cao', priority: 'medium' }
        ]
      }
    ]
  },
  'Tiếng Anh': {
    subject: 'Tiếng Anh',
    code: 'english',
    icon: '🔤',
    summary: 'Lộ trình Bứt phá 9+ Tiếng Anh: Hệ thống ngữ pháp, Từ vựng theo chủ đề, Đọc hiểu chuyên sâu & Bộ 30 đề thi chuẩn.',
    branches: [
      {
        id: 'anh-b1',
        stageName: 'Chuyên đề 1',
        title: 'Ngữ pháp Cốt lõi & Cấu trúc câu',
        tag: 'Nền tảng chắc chắn',
        tagColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        description: '12 thì, hòa hợp chủ ngữ - vị ngữ, câu điều kiện, câu bị động, mệnh đề quan hệ và đảo ngữ nâng cao.',
        icon: '📑',
        milestones: [
          { title: '12 Thì tiếng Anh & Quy tắc hòa hợp Chủ ngữ - Động từ', priority: 'high' },
          { title: 'Mệnh đề quan hệ & Rút gọn mệnh đề bằng V-ing/V-ed/To-V', priority: 'high' },
          { title: 'Câu điều kiện 1, 2, 3, hỗn hợp & Đảo ngữ câu điều kiện', priority: 'high' },
          { title: 'Câu bị động đặc biệt & Thể sai khiến (have/get something done)', priority: 'medium' }
        ]
      },
      {
        id: 'anh-b2',
        stageName: 'Chuyên đề 2',
        title: 'Từ vựng Chủ đề & Collocations',
        tag: 'Mở rộng vốn từ 8+',
        tagColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        description: 'Từ vựng trọng tâm về Môi trường, Giáo dục, Công nghệ, Phrasal verbs và Idioms thông dụng trong bài thi.',
        icon: '💬',
        milestones: [
          { title: 'Chủ đề Từ vựng: Environment, Technology & Education', priority: 'high' },
          { title: 'Bộ 200 Collocations & Cụm từ cố định thường gặp trong đề', priority: 'high' },
          { title: 'Top 100 Phrasal Verbs thông dụng & Dễ gây nhầm lẫn', priority: 'medium' },
          { title: 'Idioms quen thuộc & Cặp từ đồng nghĩa - trái nghĩa', priority: 'medium' }
        ]
      },
      {
        id: 'anh-b3',
        stageName: 'Chuyên đề 3',
        title: 'Kỹ năng Đọc hiểu & Điền từ',
        tag: 'Chiến thuật bứt phá',
        tagColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        description: 'Kỹ thuật Skim & Scan, xác định ý chính, suy luận từ ngữ cảnh và chiến thuật làm bài đọc hiểu 5-7 câu.',
        icon: '📖',
        milestones: [
          { title: 'Kỹ thuật Skimming & Scanning định vị từ khóa nhanh', priority: 'high' },
          { title: 'Suy đoán nghĩa từ mới dựa vào văn cảnh xung quanh', priority: 'high' },
          { title: 'Xác định đại từ quy chiếu & Thái độ / Ý định của tác giả', priority: 'medium' },
          { title: 'Chiến thuật làm bài Cloze Test (Điền từ vào đoạn văn)', priority: 'high' }
        ]
      },
      {
        id: 'anh-b4',
        stageName: 'Chuyên đề 4',
        title: 'Luyện Đề Chuẩn Bộ & Tối ưu tốc độ',
        tag: 'Về đích 9.5+',
        tagColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        description: 'Ngữ âm - Trọng âm, sửa lỗi sai, câu đồng nghĩa, giao tiếp tình huống và luyện 30 đề thi bấm giờ.',
        icon: '🎯',
        milestones: [
          { title: 'Quy tắc phát âm đuôi -s/es, -ed & Quy tắc đánh trọng âm', priority: 'high' },
          { title: 'Tìm lỗi sai về thì, từ vựng và cấu trúc song song', priority: 'high' },
          { title: 'Luyện 30 bộ đề thi thử phân hóa cao có giải chi tiết', priority: 'high' },
          { title: 'Quản lý thời gian làm bài dưới 45 phút không bị cuống', priority: 'medium' }
        ]
      }
    ]
  },
  'Sinh học': {
    subject: 'Sinh học',
    code: 'biology',
    icon: '🧬',
    summary: 'Lộ trình Chinh phục Sinh học: Cơ chế di truyền cấp phân tử & tế bào, Quy luật Mendel, Di truyền học người và Sinh thái.',
    branches: [
      {
        id: 'sinh-b1',
        stageName: 'Chuyên đề 1',
        title: 'Cơ chế Di truyền & Biến dị Cấp phân tử',
        tag: 'Nền tảng cốt lõi',
        tagColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        description: 'Cấu tạo ADN, ARN, cơ chế nhân đôi, phiên mã, dịch mã, điều hòa hoạt động gen và đột biến gen.',
        icon: '🔬',
        milestones: [
          { title: 'Cấu trúc ADN, ARN & Cơ chế nhân đôi bán bảo tồn', priority: 'high' },
          { title: 'Quá trình Phiên mã tổng hợp mARN & Dịch mã chuỗi Polipeptit', priority: 'high' },
          { title: 'Mô hình Operon Lac điều hòa hoạt động của gen', priority: 'medium' },
          { title: 'Đột biến gen: Thay thế, thêm, bớt 1 cặp nucleotit', priority: 'high' }
        ]
      },
      {
        id: 'sinh-b2',
        stageName: 'Chuyên đề 2',
        title: 'Quy luật Di truyền Mendel & Moocgan',
        tag: 'Trọng tâm bài tập',
        tagColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        description: 'Phân li độc lập, tương tác gen, liên kết gen hoàn toàn, hoán vị gen và di truyền liên kết giới tính.',
        icon: '🌱',
        milestones: [
          { title: 'Quy luật phân li độc lập của Menđen & Tỉ lệ kiểu hình', priority: 'high' },
          { title: 'Tương tác gen không alen (Bổ sung, át chế, cộng gộp)', priority: 'high' },
          { title: 'Hoán vị gen & Tần số hoán vị gen f <= 50%', priority: 'high' },
          { title: 'Di truyền liên kết với giới tính NST X, Y', priority: 'medium' }
        ]
      },
      {
        id: 'sinh-b3',
        stageName: 'Chuyên đề 3',
        title: 'Di truyền Quần thể & Ứng dụng Chọn giống',
        tag: 'Lý thuyết & Tính toán',
        tagColor: 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
        description: 'Cấu trúc di truyền quần thể, định luật Hardy-Weinberg, phương pháp tạo giống mới và công nghệ tế bào.',
        icon: '🧪',
        milestones: [
          { title: 'Định luật Hacđi - Vanbec & Điều kiện nghiệm đúng', priority: 'high' },
          { title: 'Cấu trúc di truyền quần thể tự phối qua các thế hệ', priority: 'high' },
          { title: 'Tạo giống bằng phương pháp lai & Gây đột biến nhân tạo', priority: 'medium' },
          { title: 'Công nghệ gen: Kỹ thuật ADN tái tổ hợp & Thể truyền Plasmid', priority: 'medium' }
        ]
      },
      {
        id: 'sinh-b4',
        stageName: 'Chuyên đề 4',
        title: 'Tiến hóa, Sinh thái học & Luyện Đề',
        tag: 'Về đích 9+',
        tagColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        description: 'Các nhân tố tiến hóa, quần thể, quần xã, chuỗi lưới thức ăn và giải các bài toán phả hệ di truyền phức tạp.',
        icon: '🌳',
        milestones: [
          { title: '5 Nhân tố tiến hóa theo thuyết tiến hóa hiện đại', priority: 'high' },
          { title: 'Chuỗi thức ăn, lưới thức ăn & Bậc dinh dưỡng sinh thái', priority: 'high' },
          { title: 'Giải phương pháp bài toán Phả hệ di truyền 9+', priority: 'high' },
          { title: 'Luyện 15 đề thi thử chuẩn cấu trúc đề thi chính thức', priority: 'high' }
        ]
      }
    ]
  },
  'Lịch sử': {
    subject: 'Lịch sử',
    code: 'history',
    icon: '🏛️',
    summary: 'Lộ trình Làm chủ Môn Lịch sử: Mốc son dân tộc Việt Nam 1919-1975, Lịch sử Thế giới Hiện đại & Sơ đồ hóa kiến thức.',
    branches: [
      {
        id: 'su-b1',
        stageName: 'Chuyên đề 1',
        title: 'Lịch sử Việt Nam (1919 – 1930)',
        tag: 'Khai sinh mốc son',
        tagColor: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        description: 'Chính sách khai thác thuộc địa lần 2 của Pháp, phong trào yêu nước và Hội nghị thành lập Đảng Cộng sản Việt Nam 1930.',
        icon: '🚩',
        milestones: [
          { title: 'Chương trình khai thác thuộc địa lần thứ hai của thực dân Pháp', priority: 'high' },
          { title: 'Hoạt động cứu nước của Nguyễn Ái Quốc tại Pháp, Liên Xô, TQ', priority: 'high' },
          { title: 'Sự xuất hiện 3 tổ chức cộng sản năm 1929 tại Việt Nam', priority: 'medium' },
          { title: 'Hội nghị thành lập Đảng CSVN & Cương lĩnh chính trị đầu tiên', priority: 'high' }
        ]
      },
      {
        id: 'su-b2',
        stageName: 'Chuyên đề 2',
        title: 'Cách mạng Tháng Tám & Kháng chiến Pháp',
        tag: 'Kháng chiến trường kỳ',
        tagColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        description: 'Phong trào 1930-1931, Tổng khởi nghĩa Tháng Tám 1945, Chiến dịch Việt Bắc 1947, Biên giới 1950 và Điện Biên Phủ 1954.',
        icon: '⚔️',
        milestones: [
          { title: 'Phong trào 1930-1931 đỉnh cao Xô Viết Nghệ Tĩnh', priority: 'high' },
          { title: 'Thời cơ & Diễn biến Tổng khởi nghĩa Tháng Tám năm 1945', priority: 'high' },
          { title: 'Chiến dịch Biên giới Thu - Đông 1950 giành thế chủ động', priority: 'medium' },
          { title: 'Chiến dịch Điện Biên Phủ 1954 & Hiệp định Giơ-ne-vơ', priority: 'high' }
        ]
      },
      {
        id: 'su-b3',
        stageName: 'Chuyên đề 3',
        title: 'Kháng chiến Chống Mỹ (1954 – 1975)',
        tag: 'Trọng tâm đề thi',
        tagColor: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        description: 'Phong trào Đồng Khởi, đánh bại các chiến lược chiến tranh của Mỹ, Tổng tiến công Tết Mậu Thân 1968 và Mùa Xuân 1975.',
        icon: '🎖️',
        milestones: [
          { title: 'Phong trào Đồng Khởi 1959-1960 chuyển cách mạng sang tiến công', priority: 'high' },
          { title: 'Đánh bại Chiến tranh đặc biệt & Chiến tranh cục bộ của Mỹ', priority: 'high' },
          { title: 'Tổng tiến công Tết Mậu Thân 1968 & Hiệp định Paris 1973', priority: 'high' },
          { title: 'Chiến dịch Hồ Chí Minh lịch sử giải phóng hoàn toàn miền Nam 1975', priority: 'high' }
        ]
      },
      {
        id: 'su-b4',
        stageName: 'Chuyên đề 4',
        title: 'Lịch sử Thế giới Hiện đại (1945 – 2000)',
        tag: 'Quan hệ quốc tế',
        tagColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        description: 'Trật tự 2 cực Ianta, Liên Hợp Quốc, Liên Xô - Đông Âu, phong trào giải phóng dân tộc Á - Phi và xu thế toàn cầu hóa.',
        icon: '🌐',
        milestones: [
          { title: 'Hội nghị Ianta 1945 & Sự hình thành trật tự thế giới hai cực', priority: 'high' },
          { title: 'Liên Hợp Quốc: Mục tiêu, nguyên tắc hoạt động & Vai trò', priority: 'medium' },
          { title: 'Phong trào giải phóng dân tộc tại Đông Nam Á, Châu Phi, Mỹ Latinh', priority: 'medium' },
          { title: 'Xu thế Toàn cầu hóa & Quan hệ quốc tế thời kỳ sau Chiến tranh Lạnh', priority: 'high' }
        ]
      }
    ]
  },
  'Địa lí': {
    subject: 'Địa lí',
    code: 'geography',
    icon: '🌍',
    summary: 'Lộ trình Chinh phục Địa lí 12: Địa lí Tự nhiên, Dân cư lao động, Cơ cấu ngành kinh tế và 7 Vùng kinh tế trọng điểm kết hợp Atlat.',
    branches: [
      {
        id: 'dia-b1',
        stageName: 'Chuyên đề 1',
        title: 'Địa lí Tự nhiên Việt Nam',
        tag: 'Tự nhiên & Atlat',
        tagColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        description: 'Vị trí địa lý, phạm vi lãnh thổ, địa hình đồi núi, khí hậu nhiệt đới ẩm gió mùa và tài nguyên thiên nhiên.',
        icon: '⛰️',
        milestones: [
          { title: 'Vị trí địa lý, vùng đất, vùng biển, vùng trời & Ý nghĩa chiến lược', priority: 'high' },
          { title: 'Đặc điểm 4 vùng núi chính: Đông Bắc, Tây Bắc, Trường Sơn Bắc - Nam', priority: 'high' },
          { title: 'Gió mùa mùa đông & Gió mùa mùa hạ tác động đến khí hậu VN', priority: 'high' },
          { title: 'Sử dụng Atlat Địa lý trang 4-5, 6-7, 8, 9, 10 thành thạo', priority: 'medium' }
        ]
      },
      {
        id: 'dia-b2',
        stageName: 'Chuyên đề 2',
        title: 'Địa lí Dân cư & Lao động',
        tag: 'Kinh tế - Xã hội',
        tagColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        description: 'Quy mô dân số, cơ cấu dân số vàng, phân bố dân cư, chất lượng lao động và quá trình đô thị hóa.',
        icon: '👥',
        milestones: [
          { title: 'Quy mô dân số đông, cơ cấu tuổi & Gia tăng dân số tự nhiên', priority: 'high' },
          { title: 'Cơ cấu lao động theo ngành, thành phần kinh tế & Trình độ', priority: 'high' },
          { title: 'Quá trình đô thị hóa diễn ra nhanh nhưng trình độ còn thấp', priority: 'medium' },
          { title: 'Giải pháp nâng cao chất lượng nguồn nhân lực và giải quyết việc làm', priority: 'medium' }
        ]
      },
      {
        id: 'dia-b3',
        stageName: 'Chuyên đề 3',
        title: 'Chuyển dịch Cơ cấu Ngành Kinh tế',
        tag: 'Trọng tâm điểm cao',
        tagColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        description: 'Chuyển dịch cơ cấu ngành (Nông - Công nghiệp - Dịch vụ), công nghiệp trọng điểm năng lượng, chế biến và giao thông vận tải.',
        icon: '🏭',
        milestones: [
          { title: 'Chuyển dịch cơ cấu ngành kinh tế theo hướng CNH - HĐH', priority: 'high' },
          { title: 'Phát triển ngành Nông nghiệp nhiệt đới & Thủy hải sản', priority: 'high' },
          { title: 'Các ngành công nghiệp trọng điểm: Năng lượng, Chế biến lương thực', priority: 'high' },
          { title: 'Ngành Giao thông vận tải, Bưu chính viễn thông & Du lịch', priority: 'medium' }
        ]
      },
      {
        id: 'dia-b4',
        stageName: 'Chuyên đề 4',
        title: 'Các Vùng Kinh tế Trọng điểm & Biển đảo',
        tag: 'Vận dụng Atlat',
        tagColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        description: 'Đồng bằng sông Hồng, Đông Nam Bộ, ĐBSCL, Tây Nguyên và bảo vệ chủ quyền biên giới, hải đảo Hoàng Sa - Trường Sa.',
        icon: '🚢',
        milestones: [
          { title: 'Vấn đề phát triển nông nghiệp hàng hóa ở ĐBSCL & Tây Nguyên', priority: 'high' },
          { title: 'Khai thác thế mạnh kinh tế vùng Đông Nam Bộ & ĐBS Hồng', priority: 'high' },
          { title: 'Phát triển kinh tế biển đảo & Bảo vệ chủ quyền Hoàng Sa, Trường Sa', priority: 'high' },
          { title: 'Luyện 20 đề thi trắc nghiệm kết hợp khai thác Atlat toàn diện', priority: 'high' }
        ]
      }
    ]
  },
  'GDCD': {
    subject: 'GDCD',
    code: 'civics',
    icon: '⚖️',
    summary: 'Lộ trình Chinh phục GDCD: Quy luật kinh tế thị trường, Thực hiện pháp luật, Quyền bình đẳng, Quyền tự do cơ bản và Dân chủ.',
    branches: [
      {
        id: 'gdcd-b1',
        stageName: 'Chuyên đề 1',
        title: 'Công dân với Kinh tế & Quy luật Thị trường',
        tag: 'Kinh tế nền tảng',
        tagColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        description: 'Sản xuất của cải vật chất, quy luật giá trị, cạnh tranh trong sản xuất và lưu thông hàng hóa, cung - cầu thị trường.',
        icon: '🪙',
        milestones: [
          { title: 'Sản xuất của cải vật chất & Các yếu tố cơ bản của sản xuất', priority: 'medium' },
          { title: 'Nội dung và tác động điều tiết của Quy luật giá trị', priority: 'high' },
          { title: 'Cạnh tranh lành mạnh & Quy luật Cung - Cầu trên thị trường', priority: 'high' },
          { title: 'Thị trường, chức năng của thị trường và lưu thông tiền tệ', priority: 'medium' }
        ]
      },
      {
        id: 'gdcd-b2',
        stageName: 'Chuyên đề 2',
        title: 'Thực hiện Pháp luật & Quyền Bình đẳng',
        tag: 'Trọng tâm trắc nghiệm',
        tagColor: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        description: '4 hình thức thực hiện pháp luật, vi phạm pháp luật và trách nhiệm pháp lý, quyền bình đẳng trong gia đình, lao động và kinh doanh.',
        icon: '📜',
        milestones: [
          { title: '4 Hình thức thực hiện: Sử dụng, Thi hành, Tuân thủ, Áp dụng PL', priority: 'high' },
          { title: 'Dấu hiệu vi phạm pháp luật & 4 loại Trách nhiệm pháp lý', priority: 'high' },
          { title: 'Quyền bình đẳng của công dân trước pháp luật & Bình đẳng giới', priority: 'medium' },
          { title: 'Bình đẳng trong hôn nhân gia đình, lao động và hoạt động kinh doanh', priority: 'high' }
        ]
      },
      {
        id: 'gdcd-b3',
        stageName: 'Chuyên đề 3',
        title: 'Quyền Tự do Cơ bản của Công dân',
        tag: 'Xử lý tình huống',
        tagColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        description: 'Bất khả xâm phạm thân thể, tính mạng, sức khỏe, danh dự, chỗ ở, bí mật thư tín và quyền tự do ngôn luận.',
        icon: '🛡️',
        milestones: [
          { title: 'Quyền bất khả xâm phạm về thân thể của công dân', priority: 'high' },
          { title: 'Quyền được pháp luật bảo hộ về tính mạng, sức khỏe, danh dự', priority: 'high' },
          { title: 'Quyền bất khả xâm phạm về chỗ ở & Bảo đảm an toàn thư tín', priority: 'high' },
          { title: 'Quyền tự do ngôn luận, báo chí và tiếp cận thông tin', priority: 'medium' }
        ]
      },
      {
        id: 'gdcd-b4',
        stageName: 'Chuyên đề 4',
        title: 'Quyền Dân chủ & Phát triển Bền vững',
        tag: 'Vận dụng cao 9+',
        tagColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        description: 'Quyền bầu cử, ứng cử, tham gia quản lý nhà nước, quyền khiếu nại, tố cáo và pháp luật với sự phát triển kinh tế.',
        icon: '🗳️',
        milestones: [
          { title: 'Quyền bầu cử & Ứng cử: Nguyên tắc phổ thông, bình đẳng, trực tiếp, kín', priority: 'high' },
          { title: 'Quyền tham gia quản lý nhà nước & Xã hội ở cấp cơ sở và trung ương', priority: 'high' },
          { title: 'Phân biệt Quyền Khiếu nại và Quyền Tố cáo của công dân', priority: 'high' },
          { title: 'Pháp luật với sự phát triển kinh tế, văn hóa & Bảo vệ môi trường', priority: 'medium' }
        ]
      }
    ]
  }
};
