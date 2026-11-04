// @ai-studio-protected-block
// This file contains core AI Chat logic and personas.
// DO NOT MODIFY this file during general UI/UX or feature updates unless explicitly asked to change AI chat/persona behavior.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Bot, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  ChevronDown,
  Calculator, 
  BookOpen, 
  Code2, 
  Lightbulb,
  Paperclip,
  ArrowUp,
  Heart,
  GraduationCap,
  Video,
  FileQuestion,
  Search,
  Globe,
  ShieldCheck,
  Wind,
  CloudRain,
  Waves,
  Coffee,
  Smile,
  RefreshCw,
  Play,
  Pause,
  Music,
  Brain,
  GripVertical,
  Move,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  persona?: string;
  sources?: Array<{ uri: string; title: string }>;
  searchQueries?: string[];
  isResearched?: boolean;
  source?: string;
  error?: string;
}

interface ChatGptMiniBubbleProps {
  studentName?: string;
}

const CHATGPT_EXACT_URL = 'https://chatgpt.com/?utm_source=google&utm_medium=paid_search&c_id=22196290286&c_agid=176486813258&c_crid=792780730549&c_kwid=kwd-1927051708782&c_ims=&c_pms=9266652&c_nw=g&c_dvc=c&gad_source=1&gad_campaignid=22196290286&gbraid=0AAAAA-I0E5fewqdnFndWKA0BP_zz7ofPd&gclid=CjwKCAjwgJHXBhBGEiwAHohJq14NUUfB2xUxo9Fv-hl676qzpblwqrhsRq-CPC6UbpQUOkeZc8JJ2xoC1SMQAvD_BwE';

const POSITIVE_QUOTES = [
  "Mỗi nỗ lực nhỏ hôm nay đều là nền tảng cho thành công lớn ngày mai. Hãy kiên nhẫn với chính mình!",
  "Bạn không cần phải hoàn hảo để bắt đầu, nhưng bạn cần bắt đầu để trở nên hoàn hảo.",
  "Ngày mai là một tờ giấy trắng, và bạn là người cầm bút. Hãy viết nên một câu chuyện tuyệt vời.",
  "Khó khăn không phải để dừng bước, mà là để thử thách bản lĩnh của bạn.",
  "Hãy tử tế với chính mình, bạn đang làm rất tốt rồi!",
  "Sự kiên trì chính là chìa khóa mở cánh cửa của mọi thành công.",
  "Mỗi ngày là một cơ hội mới để bạn học hỏi và trưởng thành hơn.",
  "Đừng so sánh chương 1 của mình với chương 20 của người khác.",
  "Hơi thở là cầu nối giữa tâm trí và cơ thể. Hãy hít sâu và cảm nhận sự bình yên.",
];

const PERSONAS_BASE = {
  psy: `# SYSTEM PROMPT – TÂM LÍ
## TRỢ LÝ TÂM LÝ HỌC ĐƯỜNG CHUYÊN BIỆT

### I. VAI TRÒ VÀ SỨ MỆNH

Bạn là TÂM LÍ – một trợ lý trí tuệ nhân tạo chuyên hỗ trợ tâm lý học đường dành cho học sinh THCS và THPT.

Bạn được thiết kế với phong cách giao tiếp của một người bạn đồng hành đáng tin cậy, một người lắng nghe kiên nhẫn, thấu hiểu và không phán xét.

Sứ mệnh của bạn:
- Lắng nghe và thấu hiểu những khó khăn tâm lý của học sinh.
- Giúp học sinh nhận diện, gọi tên và hiểu rõ cảm xúc của bản thân.
- Hỗ trợ học sinh giải quyết những vấn đề trong học tập, gia đình, tình bạn và các mối quan hệ.
- Giúp học sinh xây dựng sự tự tin, lòng tự trọng và khả năng kiểm soát cảm xúc.
- Hướng dẫn học sinh tìm kiếm sự hỗ trợ phù hợp khi gặp vấn đề vượt quá khả năng tự giải quyết.
- Xây dựng môi trường trò chuyện an toàn, tích cực và không phán xét.

Bạn không phải bác sĩ tâm thần, nhà tâm lý lâm sàng hay chuyên gia chẩn đoán bệnh. Bạn không được tự nhận mình là người có giấy phép hành nghề.

### II. 5 NGUYÊN TẮC CỐT LÕI

Mọi câu trả lời phải tuân thủ 5 nguyên tắc:

1. THẤU HIỂU: Hiểu cảm xúc trước khi đưa ra lời khuyên.
2. NHẸ NHÀNG: Không trách móc, không áp đặt, không làm học sinh cảm thấy tội lỗi.
3. TÔN TRỌNG: Tôn trọng suy nghĩ, cảm xúc và hoàn cảnh riêng của từng học sinh.
4. THỰC TẾ: Đưa ra hướng giải quyết có thể áp dụng trong đời sống.
5. AN TOÀN: Luôn đặt sự an toàn thể chất và tinh thần của học sinh lên hàng đầu.

### III. PHONG CÁCH GIAO TIẾP

Bạn phải giao tiếp như một người bạn trưởng thành, ấm áp, tinh tế và đáng tin cậy.

Yêu cầu:
- Sử dụng tiếng Việt tự nhiên, gần gũi, dễ hiểu.
- Giọng điệu nhẹ nhàng, chân thành, không giáo điều.
- Không sử dụng ngôn ngữ máy móc, khô khan.
- Không trả lời như đang đọc sách giáo khoa.
- Không dùng những câu sáo rỗng như "hãy vui lên", "mọi chuyện rồi sẽ ổn".
- Không phủ nhận cảm xúc của học sinh.
- Không so sánh nỗi đau của học sinh với người khác.
- Không vội vàng đưa ra lời khuyên khi chưa hiểu vấn đề.

Hãy ưu tiên những cách nói:
- "Mình hiểu rằng chuyện này có thể khiến bạn rất buồn."
- "Cảm xúc của bạn là điều đáng được lắng nghe."
- "Bạn không cần phải giải quyết tất cả mọi thứ ngay lập tức."
- "Nếu bạn cảm thấy thoải mái, bạn có thể kể thêm cho mình."
- "Chúng ta có thể cùng tìm một cách giải quyết phù hợp nhé."

### IV. KHẢ NĂNG HỖ TRỢ TÂM LÝ

Bạn phải có khả năng hỗ trợ các nhóm vấn đề sau:

1. ÁP LỰC HỌC TẬP
- Lo lắng về điểm số và thi cử.
- Sợ thất bại, sợ bị so sánh.
- Mất động lực học tập.
- Căng thẳng vì kỳ vọng của cha mẹ.
- Khó tập trung và quản lý thời gian.

2. TÌNH BẠN VÀ QUAN HỆ XÃ HỘI
- Bị bạn bè cô lập.
- Bị nói xấu, phản bội.
- Mâu thuẫn với bạn thân.
- Khó hòa nhập với tập thể.
- Bị bắt nạt trực tiếp hoặc trên mạng.

3. GIA ĐÌNH
- Bố mẹ thường xuyên cãi nhau.
- Không được cha mẹ thấu hiểu.
- Bị áp đặt và kiểm soát.
- Thiếu sự quan tâm, chia sẻ.
- Khó khăn trong giao tiếp với người thân.

4. CẢM XÚC VÀ TÂM LÝ
- Buồn bã, cô đơn.
- Lo âu và căng thẳng.
- Tự ti về ngoại hình và năng lực.
- Sợ giao tiếp.
- Cảm giác bản thân vô dụng.
- Khó kiểm soát cảm xúc.
- Mất phương hướng trong cuộc sống.

5. TÌNH CẢM TUỔI HỌC TRÒ
- Rung động và tình yêu đầu đời.
- Chia tay và tổn thương tình cảm.
- Ghen tuông, hiểu lầm.
- Áp lực trong các mối quan hệ.
- Khó cân bằng tình cảm và học tập.

### V. PHONG CÁCH PHẢN HỒI: TỰ NHIÊN – ĐỒNG CẢM – KHÔNG MÁY MÓC

Trong mọi câu trả lời, bạn phải thực hiện quy trình xử lý thông minh (Lắng nghe, Nhận diện, Đồng cảm, Làm rõ, Hỗ trợ, Động viên) một cách mượt mà và tự nhiên nhất.

YÊU CẦU CỐT LÕI:
1. TRẢ LỜI NHƯ NGƯỜI BÌNH THƯỜNG: Trò chuyện như một người bạn lớn, ấm áp và tinh tế. Tuyệt đối không dùng phong cách robot, không liệt kê các bước theo kiểu máy móc.
2. KHÔNG TÓM TẮT DÀI DÒNG: Không tóm tắt lại vấn đề theo kiểu danh sách nếu không cần thiết. Hãy lồng ghép sự thấu hiểu vào lời nói.
3. HẠN CHẾ CÁC CÂU TRÁCH NHIỆM/MIỄN TRỪ: Không lặp lại các câu "Tôi không phải bác sĩ..." hay các cảnh báo y tế trong mọi câu trả lời trừ khi tình huống thực sự nguy hiểm đến tính mạng. Hãy tập trung vào việc lắng nghe và xoa dịu.
4. TỰ TỔNG HỢP KIẾN THỨC: Tự mình suy luận và đưa ra lời khuyên dựa trên sự thấu hiểu sâu sắc, không cần trích dẫn sách giáo khoa hay quy trình cứng nhắc.
5. NGÔN NGỮ GẦN GŨI: Sử dụng tiếng Việt đời thường, nhẹ nhàng, không sáo rỗng.

### VI. NGUYÊN TẮC HÌNH THỨC: PHẢN HỒI NHƯ NGƯỜI BÌNH THƯỜNG, TUYỆT ĐỐI KHÔNG MÁY MÓC

Đây là yêu cầu phong cách cốt tử:
- CHỈ PHẢN HỒI NHƯ MỘT NGƯỜI BÌNH THƯỜNG: Trò chuyện tự nhiên, ấm áp, sâu sắc, gần gũi như một người bạn lớn, người anh/chị hay chuyên viên tâm lý dịu dàng đang ngồi lắng nghe trực tiếp bên cạnh học sinh.
- TUYỆT ĐỐI KHÔNG in tiêu đề hoặc nhãn máy móc như "Bước 1: Lắng nghe", "Bước 2: Nhận diện", "Bước 3: Đồng cảm"...
- TUYỆT ĐỐI KHÔNG trả lời theo khuôn mẫu robot hay biểu mẫu thủ tục.
- Toàn bộ 6 bước trên phải được lồng ghép mượt mà, uyển chuyển vào 2 đến 4 đoạn văn đàm thoại tự nhiên, có nhịp điệu cảm xúc, nhẹ nhàng và chữa lành.

### VII. CƠ CHẾ XỬ LÝ TÌNH HUỐNG NGUY HIỂM

Đây là nguyên tắc ưu tiên cao nhất.

Nếu học sinh đề cập đến:
- Muốn tự tử hoặc không muốn sống.
- Muốn tự làm đau bản thân.
- Có kế hoạch hoặc ý định tự sát.
- Bị bạo lực, xâm hại tình dục hoặc đe dọa.
- Có nguy cơ bị người khác gây thương tích.
- Không cảm thấy an toàn khi ở nhà hoặc trường học.

Bạn phải chuyển sang chế độ hỗ trợ an toàn.

Yêu cầu:
1. Không phán xét, không trách móc và không khiến học sinh cảm thấy xấu hổ.
2. Thể hiện sự quan tâm và xem những lời chia sẻ đó là nghiêm túc.
3. Hỏi trực tiếp, nhẹ nhàng để xác định học sinh có đang gặp nguy hiểm ngay lúc này hay không.
4. Nếu có nguy cơ tự làm hại bản thân, hỏi liệu các em có ý định, kế hoạch hoặc phương tiện thực hiện hay không.
5. Khuyến khích học sinh lập tức tìm đến người lớn đáng tin cậy như cha mẹ an toàn, giáo viên, nhân viên tư vấn tâm lý hoặc người thân.
6. Nếu có nguy hiểm trước mắt, hướng dẫn học sinh không ở một mình, tránh xa phương tiện có thể gây thương tích và đến nơi có người hỗ trợ.
7. Trường hợp khẩn cấp, hướng dẫn liên hệ cấp cứu 115 tại Việt Nam hoặc dịch vụ khẩn cấp phù hợp tại địa phương.
8. Nếu học sinh là trẻ em bị bạo lực hoặc xâm hại, có thể hướng dẫn liên hệ Tổng đài quốc gia bảo vệ trẻ em 111.
9. Không hứa giữ bí mật tuyệt đối khi có nguy cơ gây hại cho học sinh hoặc người khác.
10. Không tự ý chẩn đoán bệnh hoặc đưa ra kết luận về tình trạng tâm thần.

### VIII. NGUYÊN TẮC BẢO MẬT VÀ QUYỀN RIÊNG TƯ

- Không yêu cầu học sinh cung cấp mật khẩu, địa chỉ nhà, số căn cước hoặc thông tin định danh không cần thiết.
- Không chủ động thu thập thông tin nhạy cảm.
- Không tiết lộ nội dung trò chuyện cho người không có thẩm quyền.
- Không tuyên bố rằng cuộc trò chuyện được bảo mật tuyệt đối nếu hệ thống chưa có cơ chế bảo mật được xác minh.
- Khi cần sự hỗ trợ của người lớn để bảo vệ học sinh, giải thích nhẹ nhàng lý do cần tìm sự giúp đỡ.

### IX. CƠ CHẾ TƯ DUY VÀ ĐỘ CHÍNH XÁC

Trước mỗi câu trả lời, hãy tự kiểm tra:

1. Mình đã hiểu đúng vấn đề học sinh muốn chia sẻ chưa?
2. Mình có đang vô tình phán xét hoặc phủ nhận cảm xúc của các em không?
3. Cả 6 bước (Lắng nghe, Nhận diện, Đồng cảm, Làm rõ, Hỗ trợ, Động viên) đã được hòa quyện tự nhiên như người thật chưa, có bị lộ tiêu đề máy móc không?
4. Có dấu hiệu nguy hiểm cần ưu tiên xử lý không?
5. Câu trả lời có thực sự nhẹ nhàng, dễ đón nhận và xoa dịu tâm trí không?

Không bịa đặt kiến thức tâm lý học.
Không tự nhận đã đọc hoặc nghiên cứu tài liệu nếu chưa thực sự truy cập.
Khi sử dụng thông tin chuyên môn, ưu tiên nguồn khoa học và tổ chức uy tín như WHO, UNICEF và các cơ quan chuyên môn.
Nếu không chắc chắn, hãy nói rõ giới hạn hiểu biết thay vì đoán.

### X. MỤC TIÊU CUỐI CÙNG

Hãy luôn ghi nhớ:

Bạn không tồn tại để phán xét học sinh.
Bạn không tồn tại để ép học sinh phải mạnh mẽ.
Bạn không tồn tại để thay thế gia đình, giáo viên hoặc chuyên gia tâm lý.

Bạn tồn tại để giúp các em cảm thấy được lắng nghe, được tôn trọng, thấu hiểu và biết rằng mình luôn có một điểm tựa an toàn để sẻ chia.

PHƯƠNG CHÂM:

"Mỗi cảm xúc đều xứng đáng được lắng nghe. Mỗi học sinh đều xứng đáng được thấu hiểu."`
};

const PERSONAS = {
  psy: {
    title: 'Tâm lí học đường',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    greeting: 'Xin chào, mình là Tâm lí học đường – người bạn đồng hành luôn lắng nghe và thấu hiểu mọi tâm tư của bạn. Hôm nay bạn cảm thấy thế nào?',
    systemInstruction: PERSONAS_BASE.psy
  },
  psy2: {
    title: 'Gia sư T&T AI',
    icon: GraduationCap,
    color: 'from-indigo-500 to-purple-600',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    greeting: 'Xin chào em! 🎓 Mình là Gia sư T&T AI (Trợ lý tâm lí học đường) luôn ở đây để sẻ chia cùng em. Những áp lực học tập, chuyện bạn bè, gia đình hay bất cứ cảm xúc khó nói nào... em đều có thể thoải mái tâm sự nhé! ✨',
    systemInstruction: PERSONAS_BASE.psy
  }
};

const PERSONA_SUGGESTIONS: Record<string, string[]> = {
  psy: [
    'Mình cảm thấy rất áp lực về điểm số và kỳ thi sắp tới',
    'Bố mẹ hay so sánh mình với người khác, mình rất buồn',
    'Mình cảm thấy bị bạn bè cô lập, khó hòa nhập trong lớp',
    'Dạo này mình cảm thấy buồn và mất phương hướng',
    'Cách giảm lo âu và lấy lại bình tĩnh khi bị căng thẳng'
  ],
  psy2: [
    'Hướng dẫn giải bài toán hình học không gian từng bước',
    'Tóm tắt các công thức Vật Lý chương Dao động cơ',
    'Cách cân bằng phương trình phản ứng oxi hóa khử',
    'Lập dàn ý phân tích nhân vật tác phẩm văn học',
    'Phương pháp học từ vựng và ngữ pháp Tiếng Anh hiệu quả'
  ]
};

export const ChatGptMiniBubble: React.FC<ChatGptMiniBubbleProps> = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentPersona, setCurrentPersona] = useState<'psy' | 'psy2'>('psy');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'relax'>('chat');

  // Floating bubble absolute position coordinates (clamped to screen)
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const dragStart = useRef({ pointerX: 0, pointerY: 0, bubbleX: 0, bubbleY: 0 });
  const hasDragged = useRef(false);

  // Chat window drag offset for when open
  const [windowOffset, setWindowOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const windowDragStart = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });

  // Initialize position and clamp on screen resize
  useEffect(() => {
    const initOrClampPos = () => {
      const BUBBLE_SIZE = 56;
      const PADDING = 16;
      const maxX = Math.max(PADDING, window.innerWidth - BUBBLE_SIZE - PADDING);
      const maxY = Math.max(PADDING, window.innerHeight - BUBBLE_SIZE - PADDING);

      setBubblePos((prev) => {
        if (!prev) {
          // Default to bottom right (leave margin for bottom mobile nav if present)
          const defaultY = window.innerWidth < 768 ? Math.max(PADDING, maxY - 72) : maxY;
          return { x: maxX, y: defaultY };
        }
        return {
          x: Math.min(Math.max(PADDING, prev.x), maxX),
          y: Math.min(Math.max(PADDING, prev.y), maxY)
        };
      });
    };

    initOrClampPos();
    window.addEventListener('resize', initOrClampPos);
    return () => window.removeEventListener('resize', initOrClampPos);
  }, []);

  // Pointer drag for floating bubble
  const handleBubblePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      bubbleX: bubblePos?.x ?? (window.innerWidth - 72),
      bubbleY: bubblePos?.y ?? (window.innerHeight - 80)
    };
    hasDragged.current = false;
    setIsDraggingBubble(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleBubblePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingBubble) return;
    const dx = e.clientX - dragStart.current.pointerX;
    const dy = e.clientY - dragStart.current.pointerY;

    if (Math.hypot(dx, dy) > 4) {
      hasDragged.current = true;
    }

    const BUBBLE_SIZE = 56;
    const PADDING = 10;
    const maxX = Math.max(PADDING, window.innerWidth - BUBBLE_SIZE - PADDING);
    const maxY = Math.max(PADDING, window.innerHeight - BUBBLE_SIZE - PADDING);

    const nextX = Math.min(Math.max(PADDING, dragStart.current.bubbleX + dx), maxX);
    const nextY = Math.min(Math.max(PADDING, dragStart.current.bubbleY + dy), maxY);

    setBubblePos({ x: nextX, y: nextY });
  };

  const handleBubblePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingBubble) return;
    setIsDraggingBubble(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (!hasDragged.current) {
      handleToggleOpen();
    }
  };

  // Dragging the chat window header
  const handleWindowPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if ((e.target as HTMLElement).closest('button, select, input, textarea, a')) return;

    windowDragStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: windowOffset.x,
      startY: windowOffset.y
    };
    setIsDraggingWindow(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleWindowPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingWindow) return;
    const dx = e.clientX - windowDragStart.current.pointerX;
    const dy = e.clientY - windowDragStart.current.pointerY;

    setWindowOffset({
      x: windowDragStart.current.startX + dx,
      y: windowDragStart.current.startY + dy
    });
  };

  const handleWindowPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingWindow) return;
    setIsDraggingWindow(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Breathing Technique State
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Sound State
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Quote State
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const activePersonaData = PERSONAS[currentPersona];
  const PersonaIcon = activePersonaData.icon;

  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({
    psy: [{ id: 'psy-1', role: 'assistant', content: PERSONAS.psy.greeting, timestamp: 'Vừa xong', persona: 'psy' }],
    psy2: [{ id: 'psy2-1', role: 'assistant', content: PERSONAS.psy2.greeting, timestamp: 'Vừa xong', persona: 'psy2' }]
  });

  const messages = messagesMap[currentPersona] || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Breathing Logic
  useEffect(() => {
    let interval: any;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          const next = prev + 1;
          if (breathingPhase === 'inhale' && next > 4) {
            setTimeout(() => setBreathingPhase('hold'), 0);
            return 0;
          }
          if (breathingPhase === 'hold' && next > 7) {
            setTimeout(() => setBreathingPhase('exhale'), 0);
            return 0;
          }
          if (breathingPhase === 'exhale' && next > 8) {
            setTimeout(() => setBreathingPhase('inhale'), 0);
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathingPhase]);

  const startBreathing = () => {
    setIsBreathingActive(true);
    setBreathingPhase('inhale');
    setBreathingTimer(0);
  };

  const stopBreathing = () => {
    setIsBreathingActive(false);
    setBreathingPhase('idle');
    setBreathingTimer(0);
  };

  // Sound Generation Logic
  const stopSound = useCallback(() => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    setActiveSound(null);
  }, []);

  const playSound = useCallback((type: string) => {
    if (activeSound === type) {
      stopSound();
      return;
    }

    stopSound();
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate White Noise
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter for different sounds
      const filter = ctx.createBiquadFilter();
      
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1;
      } else if (type === 'waves') {
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else if (type === 'coffee') {
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 0.5;
      } else {
        filter.type = 'allpass';
      }

      const gain = ctx.createGain();
      gain.gain.value = 0.05;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;
      setActiveSound(type);
    } catch (err) {
      console.warn('Audio context error:', err);
    }
  }, [activeSound, stopSound]);

  const refreshQuote = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * POSITIVE_QUOTES.length);
    } while (nextIndex === currentQuoteIndex);
    setCurrentQuoteIndex(nextIndex);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`>-]/g, ' ').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/\n+/g, '. ').trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      stopSpeaking();
      stopSound();
      stopBreathing();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      persona: currentPersona
    };

    setMessagesMap((prev) => ({
      ...prev,
      [currentPersona]: [...(prev[currentPersona] || []), userMsg]
    }));
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          messages: messages.concat(userMsg).map((m) => ({ role: m.role, content: m.content })),
          systemInstruction: activePersonaData.systemInstruction,
          persona: currentPersona,
          autonomousResearch: false
        })
      });

      const data = await response.json();
      const reply = data.reply || (data.error ? `Lỗi: ${data.error}` : 'Xin lỗi, tôi chưa thể xử lý yêu cầu lúc này. Bạn thử lại nhé!');
      const sources = data.sources || [];
      const searchQueries = data.searchQueries || [];
      const isResearched = Boolean(data.isAutonomousResearched || sources.length > 0);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        persona: currentPersona,
        sources,
        searchQueries,
        isResearched,
        source: data.source || (data.error ? 'fallback' : undefined),
        error: data.error
      };

      setMessagesMap((prev) => ({
        ...prev,
        [currentPersona]: [...(prev[currentPersona] || []), botMsg]
      }));


    } catch (err: any) {
      console.error('AI error:', err);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Rất tiếc, đã có gián đoạn kết nối. Bạn hãy thử gửi lại câu hỏi nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        persona: currentPersona,
        isResearched: false,
        source: 'fallback',
        error: err?.message || 'Gián đoạn kết nối mạng'
      };
      setMessagesMap((prev) => ({
        ...prev,
        [currentPersona]: [...(prev[currentPersona] || []), fallbackMsg]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm(`Làm mới cuộc trò chuyện với ${activePersonaData.title}?`)) {
      stopSpeaking();
      setMessagesMap((prev) => ({
        ...prev,
        [currentPersona]: [{ id: `${currentPersona}-init`, role: 'assistant', content: activePersonaData.greeting, timestamp: 'Vừa xong', persona: currentPersona }]
      }));
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (content: string) => {
    return (
      <div className="text-[13.5px] leading-relaxed break-words font-sans text-slate-100 prose prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5 prose-pre:my-2 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Calculate anchored desktop position for chat window
  const bubbleX = bubblePos?.x ?? (typeof window !== 'undefined' ? window.innerWidth - 76 : 500);
  const bubbleY = bubblePos?.y ?? (typeof window !== 'undefined' ? window.innerHeight - 80 : 600);
  const windowW = 490;
  const windowH = 640;
  const rawLeft = bubbleX > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) ? bubbleX - windowW + 56 : bubbleX;
  const rawTop = bubbleY > (typeof window !== 'undefined' ? window.innerHeight / 2 : 500) ? bubbleY - windowH : bubbleY + 64;

  const chatLeft = typeof window !== 'undefined' ? Math.min(Math.max(12, rawLeft + windowOffset.x), window.innerWidth - windowW - 12) : 100;
  const chatTop = typeof window !== 'undefined' ? Math.min(Math.max(12, rawTop + windowOffset.y), window.innerHeight - windowH - 12) : 100;

  return (
    <>
      {/* Floating Draggable AI Bubble Button with Navy & Subtle Neon Cyan Glow */}
      <div 
        onPointerDown={handleBubblePointerDown}
        onPointerMove={handleBubblePointerMove}
        onPointerUp={handleBubblePointerUp}
        onPointerCancel={() => setIsDraggingBubble(false)}
        style={{ 
          position: 'fixed',
          left: bubblePos ? `${bubblePos.x}px` : undefined,
          top: bubblePos ? `${bubblePos.y}px` : undefined,
          bottom: bubblePos ? undefined : '24px',
          right: bubblePos ? undefined : '20px',
          touchAction: 'none',
          zIndex: 9999,
          cursor: isDraggingBubble ? 'grabbing' : 'grab'
        }}
        className="select-none flex flex-col items-end group"
        title="Trợ lý AI • Nhấn để mở • Giữ và kéo để di chuyển vị trí tự do"
      >
        {/* Subtle Drag Handle Tooltip */}
        <div className="hidden group-hover:flex items-center gap-1.5 absolute -top-8 right-0 bg-[#030914]/95 text-cyan-100 text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-2xl border border-cyan-500/40 pointer-events-none animate-in fade-in backdrop-blur-md">
          <Move className="w-3 h-3 text-cyan-400" />
          <span>Kéo tự do • Bấm để mở</span>
        </div>

        <button
          type="button"
          aria-label="Trợ lý AI 2 Chức Năng"
          className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 active:scale-95 cursor-pointer ${
            isDraggingBubble ? 'scale-110 shadow-[0_0_40px_rgba(6,182,212,0.85)]' : 'hover:scale-105'
          } ${
            isOpen
              ? 'bg-[#040a18] text-cyan-300 rotate-90 border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/25'
              : 'bg-gradient-to-tr from-[#020713] via-[#091a38] to-[#04334d] text-white border-2 border-cyan-400/80 bubble-neon-glow hover:border-cyan-300 ring-2 ring-cyan-500/20'
          }`}
        >
          {/* Subtle Ambient Pulse Ring when closed */}
          {!isOpen && (
            <span className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-indigo-500/30 blur-md opacity-70 animate-pulse pointer-events-none"></span>
          )}

          {isOpen ? (
            <X className="w-6 h-6 transition-transform drop-shadow-[0_0_6px_rgba(6,182,212,0.7)]" />
          ) : (
            <div className="relative flex items-center justify-center pointer-events-none">
              <Bot className="w-7 h-7 text-cyan-100 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-spin drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" style={{ animationDuration: '6s' }} />
              <span className="absolute top-0 right-0 flex h-4 w-4 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-400 border-2 border-[#020713] shadow-[0_0_10px_#22d3ee]"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Independent Floating AI Chat Window with Deep Navy & Spatial Blur Shadow */}
      {isOpen && (
        <div
          className={`fixed z-[9998] flex flex-col bg-[#050c1a]/95 backdrop-blur-2xl text-slate-100 rounded-3xl border border-cyan-500/30 dialog-depth-shadow overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
            isExpanded
              ? 'inset-3 sm:inset-6 md:inset-10 max-w-5xl mx-auto h-auto'
              : 'max-sm:inset-x-2 max-sm:bottom-3 max-sm:top-16 max-sm:w-auto max-sm:h-auto sm:w-[480px] sm:h-[640px] max-h-[92vh]'
          }`}
          style={
            isExpanded
              ? { boxShadow: '0 30px 100px -15px rgba(1, 6, 18, 0.95), 0 0 50px -5px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }
              : typeof window !== 'undefined' && window.innerWidth >= 640
              ? {
                  position: 'fixed',
                  left: `${chatLeft}px`,
                  top: `${chatTop}px`,
                  boxShadow: '0 30px 100px -15px rgba(1, 6, 18, 0.95), 0 0 50px -5px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }
              : { boxShadow: '0 30px 100px -15px rgba(1, 6, 18, 0.95), 0 0 50px -5px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }
          }
        >
          {/* Header - Also draggable */}
          <div 
            onPointerDown={handleWindowPointerDown}
            onPointerMove={handleWindowPointerMove}
            onPointerUp={handleWindowPointerUp}
            className="flex flex-col bg-[#030713]/95 border-b border-cyan-500/20 select-none cursor-grab active:cursor-grabbing"
            title="Kéo thanh tiêu đề để di chuyển cửa sổ chat"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-4 h-4 text-cyan-500/50 shrink-0" />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${activePersonaData.color} flex items-center justify-center text-white shadow-md shadow-cyan-500/25 border border-cyan-400/30`}>
                  <PersonaIcon className="w-5 h-5 drop-shadow-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white tracking-tight">{activePersonaData.title}</span>
                    {(currentPersona === 'psy' || currentPersona === 'psy2') && (
                      <div className="flex bg-[#071328] rounded-lg p-0.5 ml-1 border border-cyan-500/20">
                        <button 
                          onClick={() => setActiveTab('chat')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'chat' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-cyan-200'}`}
                        >
                          Chat
                        </button>
                        <button 
                          onClick={() => setActiveTab('relax')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'relax' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-cyan-200'}`}
                        >
                          Thư giãn
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-[10.5px] text-cyan-200/70 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]"></span>
                    <span>StudyFlow AI • Chuyển đổi linh hoạt 2 tính năng</span>
                  </div>
                </div>
              </div>

              {/* Top Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const next = !isVoiceEnabled;
                    setIsVoiceEnabled(next);
                    if (!next) stopSpeaking();
                  }}
                  title={isVoiceEnabled ? 'Tắt giọng nói' : 'Bật giọng nói'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2f2f2f] transition"
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleResetChat}
                  title="Làm mới cuộc trò chuyện"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2f2f2f] transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2f2f2f] transition hidden sm:inline-flex"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsOpen(false);
                  }}
                  title="Đóng cửa sổ"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2 Persona Tab Selector Buttons */}
            <div className="grid grid-cols-2 gap-1.5 px-3 pb-2.5 pt-1.5 bg-[#020612]/95 border-t border-cyan-500/20">
              {(Object.keys(PERSONAS) as Array<keyof typeof PERSONAS>).map((key) => {
                const p = PERSONAS[key];
                const Icon = p.icon;
                const isActive = currentPersona === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (currentPersona !== key) {
                        stopSpeaking();
                        stopSound();
                        stopBreathing();
                      }
                      setCurrentPersona(key);
                      // Keep relax tab for both psychological personas
                      if (key !== 'psy' && key !== 'psy2') setActiveTab('chat');
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10.5px] font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0d2252] via-[#1d4ed8] to-[#0284c7] text-white shadow-[0_0_16px_rgba(6,182,212,0.4)] border border-cyan-400/50'
                        : 'bg-[#060e20]/80 text-cyan-200/60 hover:text-white hover:bg-[#091733] border border-cyan-500/15'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]' : ''}`} />
                    <span className="truncate w-full text-center">
                      {key === 'psy' ? 'Tâm lí học đường' : 'Gia sư T&T AI'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Autonomous Research Banner removed for clean pedagogy */}
          </div>

          {/* Voice Speaking Indicator */}
          {isSpeaking && (
            <div className="px-3.5 py-1.5 bg-cyan-950/60 border-b border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse drop-shadow-[0_0_6px_#22d3ee]" />
                <span>Trợ lý AI đang đọc kết quả...</span>
              </span>
              <button onClick={stopSpeaking} className="text-[10px] font-bold underline text-cyan-400 hover:text-cyan-200">
                Dừng đọc
              </button>
            </div>
          )}

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#040916]/95">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                      {isAssistant && (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-cyan-500/30 border border-cyan-400/30">
                          <PersonaIcon className="w-4 h-4 drop-shadow-sm" />
                        </div>
                      )}

                      <div className={`relative max-w-[88%] sm:max-w-[85%] group ${isAssistant ? '' : 'order-1'}`}>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
                            isAssistant
                              ? 'bg-[#081224]/95 text-slate-100 border border-cyan-500/25 rounded-tl-xs shadow-[0_4px_20px_rgba(1,6,18,0.6)]'
                              : 'bg-gradient-to-r from-[#091f52] via-[#1d4ed8] to-[#0284c7] text-white rounded-tr-xs font-sans border border-cyan-400/40 shadow-[0_4px_16px_rgba(6,182,212,0.22)]'
                          }`}
                        >
                          {isAssistant ? (
                            <div>
                              {renderMessageContent(msg.content)}
                              {/* Autonomous Research & Verification Citations Card */}
                              {(msg.persona === 'tutor' || msg.isResearched || (msg.sources && msg.sources.length > 0) || (msg.searchQueries && msg.searchQueries.length > 0)) && (
                                <div className="mt-3 pt-2.5 border-t border-cyan-500/25 text-xs font-sans">
                                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1.5">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(6,182,212,0.7)]" />
                                    <span>Autonomous Research • Đối chiếu tri thức đa nguồn</span>
                                  </div>

                                  {msg.searchQueries && msg.searchQueries.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                      <span className="text-[10px] text-cyan-200/70 font-medium">Truy vấn tra cứu:</span>
                                      {msg.searchQueries.map((q, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 text-[10px] font-mono">
                                          {q}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {msg.sources && msg.sources.length > 0 ? (
                                    <div className="space-y-1.5 mt-1.5">
                                      <span className="text-[10.5px] text-cyan-200/80 font-medium flex items-center gap-1">
                                        <Globe className="w-3 h-3 text-cyan-400" />
                                        <span>Tài liệu & Nguồn kiểm chứng đã đối chiếu:</span>
                                      </span>
                                      <div className="grid grid-cols-1 gap-1.5 mt-1">
                                        {msg.sources.slice(0, 4).map((source, sIdx) => {
                                          let domain = '';
                                          try {
                                            domain = new URL(source.uri).hostname.replace('www.', '');
                                          } catch {
                                            domain = 'Học liệu chuẩn';
                                          }
                                          return (
                                            <a
                                              key={sIdx}
                                              href={source.uri}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#030814]/90 hover:bg-[#071328] border border-cyan-500/25 text-slate-200 hover:text-cyan-300 transition text-[11px] group"
                                            >
                                              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                              <span className="truncate flex-1 font-medium">{source.title || domain}</span>
                                              <span className="text-[10px] text-cyan-300/60 group-hover:text-cyan-400 shrink-0 font-mono">({domain})</span>
                                              <ExternalLink className="w-3 h-3 text-cyan-300/60 group-hover:text-cyan-300 shrink-0" />
                                            </a>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/90 bg-[#030814]/90 px-2.5 py-1.5 rounded-lg border border-cyan-500/20">
                                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_4px_#22d3ee]" />
                                      <span>Đã đối chiếu chuẩn kiến thức SGK Bộ GD&ĐT (CT GDPT 2018) & Giáo trình Đại học Sư phạm.</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap font-sans">{msg.content}</div>
                          )}
                        </div>

                        {isAssistant && (
                          <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
                            <span>{msg.timestamp}</span>
                            <button
                              onClick={() => handleCopyText(msg.id, msg.content)}
                              title="Sao chép"
                              className="hover:text-slate-200 transition p-0.5 rounded ml-auto flex items-center gap-1"
                            >
                              {copiedId === msg.id ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Đã chép
                                </span>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Sao chép</span>
                                </>
                              )}
                            </button>
                            <button onClick={() => speakText(msg.content)} title="Đọc to" className="hover:text-slate-200 transition p-0.5 rounded">
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {!isAssistant && (
                          <div className="text-right text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#2f2f2f] border border-slate-700/80 flex items-center gap-2 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-xs text-slate-300 ml-2 font-sans">
                        Trợ lý AI đang phân tích & tổng hợp dữ liệu...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
                {/* Breathing Technique 4-7-8 */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <Wind className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Kỹ thuật thở điều hòa 4-7-8</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Giảm nhịp tim, tan biến căng thẳng chỉ sau 2 phút</p>
                      </div>
                    </div>
                    <button 
                      onClick={isBreathingActive ? stopBreathing : startBreathing}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isBreathingActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-500'}`}
                    >
                      {isBreathingActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                      <div 
                        className={`absolute rounded-full transition-all duration-1000 ease-in-out ${
                          breathingPhase === 'inhale' ? 'bg-rose-500/10 scale-100' : 
                          breathingPhase === 'hold' ? 'bg-rose-500/20 scale-[1.05]' : 
                          breathingPhase === 'exhale' ? 'bg-rose-500/5 scale-[0.8]' : 
                          'bg-slate-50 dark:bg-slate-800 scale-[0.8]'
                        }`}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          animation: isBreathingActive && breathingPhase === 'hold' ? 'pulse 2s infinite ease-in-out' : 'none'
                        }}
                      ></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                          {isBreathingActive ? (breathingPhase === 'inhale' ? 4 - breathingTimer : breathingPhase === 'hold' ? 7 - breathingTimer : 8 - breathingTimer) : '4-7-8'}
                        </span>
                        <span className="text-[11px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-1">
                          {isBreathingActive ? (breathingPhase === 'inhale' ? 'Hít mũi' : breathingPhase === 'hold' ? 'Giữ hơi' : 'Thở miệng') : 'BẤM NÚT ĐỂ THỞ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    {[
                      { label: 'Hít mũi (4s)', active: breathingPhase === 'inhale' },
                      { label: 'Giữ hơi (7s)', active: breathingPhase === 'hold' },
                      { label: 'Thở miệng (8s)', active: breathingPhase === 'exhale' }
                    ].map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all ${step.active ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                      >
                        {idx + 1}. {step.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relaxation Sounds */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Âm thanh thư giãn & tập trung</h3>
                      <p className="text-[11px] text-slate-500 font-medium tracking-tight">Web Audio tổng hợp tự nhiên, giúp định tâm</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'rain', label: 'Mưa rơi nhẹ', icon: CloudRain },
                      { id: 'waves', label: 'Sóng biển dạt dào', icon: Waves },
                      { id: 'coffee', label: 'Quán cà phê ấm', icon: Coffee },
                      { id: 'white', label: 'Tiếng ồn trắng', icon: Brain }
                    ].map((sound) => {
                      const isActive = activeSound === sound.id;
                      const Icon = sound.icon;
                      return (
                        <button
                          key={sound.id}
                          onClick={() => playSound(sound.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isActive ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                          <span className="text-xs font-bold text-left leading-tight">{sound.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Reminders */}
                <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl p-6 border border-amber-100 dark:border-amber-900/50 relative group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Smile className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                      <h3 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-widest">Lời nhắc nhở tích cực hôm nay</h3>
                    </div>
                    <button 
                      onClick={refreshQuote}
                      className="p-1.5 rounded-full hover:bg-amber-200/50 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-500 transition-transform active:rotate-180 duration-500"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-amber-900/90 dark:text-amber-200 italic leading-relaxed">
                    "{POSITIVE_QUOTES[currentQuoteIndex]}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Area with Navy Glass & Neon Glow */}
          {activeTab === 'chat' && (
            <div className="p-3 bg-[#030713]/98 border-t border-cyan-500/20">
              {/* Quick empathetic / persona suggestions */}
              {PERSONA_SUGGESTIONS[currentPersona] && (
                <div className="px-1 py-1.5 mb-2.5 flex items-center gap-1.5 overflow-x-auto invisible-scrollbar">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
                  {PERSONA_SUGGESTIONS[currentPersona].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sug)}
                      disabled={isLoading}
                      className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-[#08152b] hover:bg-[#0d2244] text-cyan-200/90 hover:text-white border border-cyan-500/25 hover:border-cyan-400/60 shadow-xs hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all duration-200 shrink-0 active:scale-95 cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex items-end rounded-2xl bg-[#061021] border border-cyan-500/30 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/25 transition-all p-1.5 shadow-inner">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Nhập nội dung cho ${activePersonaData.title}...`}
                  rows={1}
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none resize-none max-h-28 overflow-y-auto"
                  style={{ minHeight: '36px' }}
                />

                <div className="flex items-center gap-1 shrink-0 pb-1 pr-1">
                  <label
                    title="Tải ảnh bài tập để chẩn đoán & giải nhanh (hoặc đính kèm tài liệu)"
                    className="p-1.5 rounded-lg text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-950/40 transition cursor-pointer flex items-center justify-center"
                  >
                    <input
                      type="file"
                      accept="image/*,.txt,.md,.pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type.startsWith('image/')) {
                          setInputMessage((prev) => 
                            (prev ? prev + '\n' : '') + `[Chẩn đoán nhanh từ ảnh: ${file.name}] - Nhờ Gia sư AI đọc và giải chi tiết từng bước bài tập trong ảnh này.`
                          );
                        } else {
                          try {
                            const text = await file.text();
                            setInputMessage((prev) => (prev ? prev + '\n' : '') + text.slice(0, 2000));
                          } catch {
                            setInputMessage((prev) => (prev ? prev + '\n' : '') + `[Tài liệu đính kèm: ${file.name}]`);
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                    <ImageIcon className="w-4 h-4" />
                  </label>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    title="Gửi câu hỏi (Enter)"
                    className={`p-2 rounded-full transition-all duration-200 shadow-sm cursor-pointer ${
                      inputMessage.trim() && !isLoading
                        ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.6)] hover:shadow-[0_0_26px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95'
                        : 'bg-[#09152b] text-slate-600 cursor-not-allowed border border-cyan-900/30'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400 select-none">
                <span>Đang hoạt động: <strong className="text-cyan-400">{activePersonaData.title}</strong></span>
                <span>Nhấn <kbd className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 text-[9px] text-cyan-300">Enter</kbd> để gửi</span>
              </div>
            </div>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .invisible-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .invisible-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </>
  );
};
