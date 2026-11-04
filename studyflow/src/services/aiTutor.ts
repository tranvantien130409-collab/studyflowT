import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorResponse {
  reply: string;
  sources?: Array<{ title: string; uri: string }>;
  searchQueries?: string[];
  source?: string;
}

/**
 * Kiểm tra xem câu hỏi của học sinh có cần tìm kiếm thông tin bên ngoài hay không.
 */
function checkIfNeedsExternalSearch(query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  const searchKeywords = [
    'là gì', 'như thế nào', 'tại sao', 'công thức', 'định lý', 'giải bài', 'tính', 'chứng minh',
    'kết quả', 'thông tin', 'tin tức', 'năm', 'sự kiện', 'tác giả', 'tác phẩm', 'nghị luận',
    'đề thi', 'bộ giáo dục', 'sgk', 'chương trình', 'phân tích', 'so sánh', 'vận dụng', 'thống kê',
    'mới nhất', 'tra cứu', 'thực tế', 'số liệu', 'lịch sử', 'địa lý', 'nguyên lý', 'bản chất', 'giải thích'
  ];
  return searchKeywords.some((keyword) => q.includes(keyword)) || q.length > 8;
}

/**
 * Hàm askTutor sử dụng thư viện @google/generative-ai để triển khai gọi Gemini API,
 * cấu hình prompt hệ thống cho Gia sư THPT, bao gồm logic nhận diện khi nào cần tìm kiếm
 * thông tin bằng Google Search để tổng hợp câu trả lời chính xác.
 */
export async function askTutor(
  messages: TutorMessage[],
  subject: string = 'Toán học',
  grade: string = '12',
  systemInstruction?: string
): Promise<TutorResponse> {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const needSearch = checkIfNeedsExternalSearch(lastMsg);

  const defaultSystemPrompt = `Môn: ${subject}. Học sinh lớp ${grade}.\n\nSYSTEM PROMPT: AI GIA SƯ & GIẢI ĐÁP HỌC TẬP STUDYFLOW (CHUYÊN GIA LÝ THUYẾT & BÀI TẬP THPT)

# VAI TRÒ & SỨ MỆNH
Bạn là Gia sư AI cao cấp của StudyFlow, giỏi xuất sắc ở **CẢ HAI MẢNG: LÝ THUYẾT VÀ BÀI TẬP** cho học sinh từ THCS đến THPT (bám sát chương trình GDPT 2018 của Bộ GD&ĐT). Bạn trả lời tường tận, sâu sắc, chính xác tuyệt đối mọi câu hỏi về lý thuyết (định nghĩa, bản chất, cơ chế, phân tích hiện tượng, so sánh...) cũng như hướng dẫn giải bài tập từng bước.

# NGUYÊN TẮC CỐT LÕI
1. **Trả lời trực tiếp và sâu sắc ngay câu đầu tiên**: Không dài dòng, không chào hỏi vô bổ. Đưa ra định nghĩa cốt lõi hoặc kết luận chính xác.
2. **Chính xác hơn tất cả**: Chỉ nêu công thức, định lý, số liệu chắc chắn đúng. Tự kiểm tra lại kết quả trước khi trả lời.
3. **Dạy để hiểu, không chỉ đưa đáp án**: Giải thích "vì sao" ở các bước then chốt.
4. **Tự động tìm kiếm thông tin (Google Search)**: Khi câu hỏi yêu cầu kiến thức thực tế, thông tin cập nhật, sự kiện hoặc tài liệu chuyên sâu, hệ thống sẽ tự động tra cứu để tổng hợp phản hồi chính xác.

# ĐỊNH DẠNG TRẢ LỜI
- Viết tiếng Việt chuẩn mực, sư phạm. Xưng "mình" - gọi "bạn".
- Công thức toán/lý/hóa viết bằng LaTeX: $...$ cho trong dòng, $$...$$ cho riêng dòng.
- Đáp số cuối cùng in đậm, luôn ghi đơn vị.`;

  const promptToUse = systemInstruction || defaultSystemPrompt;
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: promptToUse
      });

      const chatHistory = messages.slice(-20, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({
        history: chatHistory.length > 0 ? chatHistory : undefined
      });

      const result = await chat.sendMessage(lastMsg);
      const response = await result.response;
      const text = response.text();

      return {
        reply: text || 'Xin lỗi, AI chưa có phản hồi.',
        source: 'google-generative-ai-sdk'
      };
    } catch (clientErr: any) {
      console.warn('GoogleGenerativeAI SDK client error, falling back to server proxy:', clientErr?.message);
    }
  }

  try {
    const res = await fetch('/api/ai/chatgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: lastMsg,
        messages: messages.slice(-20),
        persona: 'tutor',
        subject,
        grade,
        autonomousResearch: needSearch,
        systemInstruction: promptToUse
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi kết nối máy chủ AI.');
    }

    return {
      reply: data.reply || data.answer || 'Xin lỗi, AI chưa có phản hồi.',
      sources: data.sources || [],
      searchQueries: data.searchQueries || [],
      source: data.source || 'gemini-1.5-flash-search'
    };
  } catch (error: any) {
    console.warn('askTutor error:', error);
    return {
      reply: `### Hướng dẫn giải đáp sư phạm:\n1. Hệ thống đã tiếp nhận câu hỏi về môn ${subject}.\n2. Vui lòng thử lại sau giây lát để nhận lời giải lý thuyết và bài tập chi tiết từ gia sư AI.`,
      source: 'local_fallback'
    };
  }
}
