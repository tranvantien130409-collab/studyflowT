import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize GoogleGenAI SDK with environment variables MY_GEMINI_API_KEY or GEMINI_API_KEY
const activeKeyName = process.env.MY_GEMINI_API_KEY ? 'MY_GEMINI_API_KEY' : (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'NONE');
const apiKey = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// Persistent file-backed storage for user profiles so switching pages or reloading never resets data
const PROFILES_FILE = path.resolve('profiles_db.json');
let cachedProfiles: { student?: any; teacher?: any } = {};

try {
  if (fs.existsSync(PROFILES_FILE)) {
    const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
    cachedProfiles = JSON.parse(data);
  }
} catch (e) {
  console.warn('Could not read profiles_db.json:', e);
}

const saveProfilesToFile = () => {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(cachedProfiles, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write profiles_db.json:', e);
  }
};

// Endpoints for profile persistence
app.get('/api/profile/student', (_req, res) => {
  return res.json({ profile: cachedProfiles.student || null });
});

app.post('/api/profile/student', (req, res) => {
  if (req.body && req.body.name) {
    cachedProfiles.student = req.body;
    saveProfilesToFile();
    return res.json({ success: true, profile: cachedProfiles.student });
  }
  return res.status(400).json({ error: 'Dữ liệu học sinh không hợp lệ' });
});

app.get('/api/profile/teacher', (_req, res) => {
  return res.json({ profile: cachedProfiles.teacher || null });
});

app.post('/api/profile/teacher', (req, res) => {
  if (req.body && req.body.name) {
    cachedProfiles.teacher = req.body;
    saveProfilesToFile();
    return res.json({ success: true, profile: cachedProfiles.teacher });
  }
  return res.status(400).json({ error: 'Dữ liệu giáo viên không hợp lệ' });
});

// Helper: Robust callGemini function supporting OpenAI-compatible AI provider (Groq) first, then Gemini
async function callGemini(contents: any, config?: any, timeoutMs = 25000) {
  const fallbackKey = process.env.FALLBACK_API_KEY;
  const fallbackBase = process.env.FALLBACK_BASE_URL;
  const fallbackModel = process.env.FALLBACK_MODEL;

  const needsJson = config?.responseMimeType === 'application/json' || config?.response_format || (typeof contents === 'string' && contents.toLowerCase().includes('json'));
  let lastGroqErr: any = null;

  if (fallbackKey && fallbackBase && fallbackModel) {
    let attempts = needsJson ? 2 : 1;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const messages: any[] = [];
        const sysInst = config?.systemInstruction;
        if (sysInst) {
          messages.push({ role: 'system', content: sysInst });
        }
        if (needsJson && sysInst && !sysInst.toLowerCase().includes('json')) {
          messages[0].content += ' Hãy trả về kết quả hoàn toàn bằng định dạng JSON.';
        } else if (needsJson && !sysInst) {
          messages.push({ role: 'system', content: 'Hãy trả về kết quả hoàn toàn bằng định dạng JSON.' });
        }

        if (typeof contents === 'string') {
          messages.push({ role: 'user', content: contents + (needsJson ? ' (Chỉ trả về JSON hợp lệ)' : '') });
        } else if (Array.isArray(contents)) {
          for (const c of contents) {
            const role = c.role === 'model' ? 'assistant' : (c.role === 'user' ? 'user' : 'system');
            const text = c.parts?.[0]?.text || c.content || '';
            if (text) {
              messages.push({ role, content: text });
            }
          }
        }

        const body: any = {
          model: fallbackModel,
          messages,
          temperature: 0.6
        };

        if (needsJson) {
          body.response_format = { type: 'json_object' };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(`${fallbackBase.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fallbackKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Groq lỗi (Mã: ${res.status}): ${res.statusText}`);
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Groq trả về phản hồi rỗng');
        }

        if (needsJson) {
          try {
            JSON.parse(content.replace(/```json\n?|```/g, '').trim());
          } catch (jsonErr) {
            if (attempt < attempts) {
              continue;
            } else {
              throw new Error('Groq trả về JSON không hợp lệ');
            }
          }
        }

        return {
          text: content,
          source: 'groq'
        };
      } catch (groqErr: any) {
        lastGroqErr = groqErr;
        console.error(`Groq attempt ${attempt} error:`, groqErr?.message || groqErr);
        if (!needsJson || attempt >= attempts) break;
      }
    }
  }

  // Fallback to Gemini
  if (!ai) {
    throw new Error(`GEMINI_API_KEY chưa được cấu hình (Biến khóa: ${activeKeyName})`);
  }
  const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
  let all429 = true;

  for (const model of models) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Hết thời gian chờ Gemini (${model})`)), timeoutMs)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          ...(config ? { config } : {})
        }),
        timeoutPromise
      ]);

      if (response && (response.text !== undefined || response.candidates)) {
        return {
          text: response.text,
          source: 'gemini',
          ...response
        };
      }
      throw new Error(`Mô hình ${model} trả về phản hồi rỗng`);
    } catch (err: any) {
      const errStr = String(err?.message || err || '');
      const is429 = err?.status === 429 || err?.code === 429 || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('Quota exceeded');
      
      if (!is429) {
        all429 = false;
        console.error(`Gemini model ${model} error:`, err);
      } else {
        console.error(`Gemini model ${model} rate-limited (429)`);
      }
      lastError = err;
    }
  }

  const groqMsg = lastGroqErr ? `Groq: lỗi ${lastGroqErr.message || 'kết nối'}` : 'Groq: chưa cấu hình';
  const lastErrStr = String(lastError?.message || lastError || '');
  const isLast429 = lastError?.status === 429 || lastError?.code === 429 || lastErrStr.includes('429') || lastErrStr.includes('RESOURCE_EXHAUSTED') || lastErrStr.includes('Quota exceeded') || all429;
  
  const geminiMsg = lastError ? `Gemini: lỗi ${lastErrStr}` : 'Gemini: chưa thử';

  if (isLast429) {
    throw new Error(`AI đang hết hạn mức, vui lòng thử lại sau ít phút (${groqMsg}; ${geminiMsg})`);
  }

  const lastMsg = lastError?.message || String(lastError);
  throw new Error(`${lastMsg} (${groqMsg}; ${geminiMsg})`);
}

// Route: AI Chat / Pedagogical Assistant for Teachers
app.post('/api/ai/chat', async (req, res) => {
  try {
    let { messages, message, prompt, systemInstruction } = req.body;

    // Chấp nhận cả body { messages: [...] } lẫn { message: "..." } hoặc { prompt: "..." }; nếu thiếu thì tự chuyển thành mảng messages
    if (!Array.isArray(messages) || messages.length === 0) {
      const userText = message || prompt || '';
      if (!userText.trim()) {
        return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống (Cần messages, message hoặc prompt)' });
      }
      messages = [{ role: 'user', content: userText.trim() }];
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user' || m.content)?.content || message || prompt || '';

    let contents: any[] = [];
    const recent = messages.slice(-20);
    for (const m of recent) {
      if (!m || !m.content || typeof m.content !== 'string' || !m.content.trim()) continue;
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (contents.length === 0 && role === 'model') continue;
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n\n' + m.content;
      } else {
        contents.push({ role, parts: [{ text: m.content }] });
      }
    }
    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: lastUserMessage }] }];
    }

    const sysInstruction = systemInstruction || 'Bạn là Trợ lý AI sư phạm cao cấp dành cho Giáo viên (Cô Phượng / Thầy Tiến) trên nền tảng giáo dục StudyFlow. Hãy trả lời bằng tiếng Việt chuẩn mực, ân cần, mang tính sư phạm cao, có phân tích số liệu học sinh, nhận diện lỗ hổng kiến thức và gợi ý phương án bài tập phân hóa theo ma trận nhận thức.';

    if (!ai) {
      return res.json({
        reply: getFallbackAssistantReply(lastUserMessage),
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    try {
      const response = await callGemini(contents, {
        systemInstruction: sysInstruction,
        maxOutputTokens: 2000
      });

      return res.json({
        reply: response.text || 'Không có phản hồi từ trợ lý AI.',
        source: response.source || 'gemini'
      });
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      return res.json({
        reply: getFallbackAssistantReply(lastUserMessage),
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    return res.status(500).json({
      reply: getFallbackAssistantReply(''),
      source: 'fallback',
      error: errMsg
    });
  }
});

// Route: AI Stats Analysis & Study Plan Generator
app.post('/api/ai/analyze-stats', async (req, res) => {
  try {
    const { 
      tasks = [], 
      events = [], 
      studentProfile = {}, 
      gpaGoal = 8.8, 
      currentAvg = 8.58, 
      subjects = [],
      surveyData = null,
      currentDate = new Date().toISOString() 
    } = req.body;
    
    if (ai) {
      try {
        let surveyPrompt = '';
        if (surveyData) {
          surveyPrompt = `
DỮ LIỆU KHẢO SÁT LỘ TRÌNH HỌC TẬP:
- Môn học muốn tập trung nhất: ${surveyData.focusSubject || 'Chưa chọn'}
- Tổng số giờ mục tiêu: ${surveyData.targetHours || 0} giờ
- Thời gian thực hiện dự kiến: ${surveyData.durationWeeks || 0} tuần
- Các khung giờ rảnh hàng tuần: ${Array.isArray(surveyData.freeTimeSlots) ? surveyData.freeTimeSlots.join(', ') : (surveyData.freeTimeSlots || 'Chưa rõ')}
`;
        }

        const prompt = `Bạn là Chuyên gia AI Phân tích Giáo dục & Cố vấn Chiến lược Học tập cấp cao của hệ thống StudyFlow.
Hãy thực hiện phân tích sâu toàn diện dữ liệu học tập của học sinh ${studentProfile?.name || 'Học sinh'} (Lớp ${studentProfile?.className || '12'}):

DỮ LIỆU ĐẦU VÀO:
1. NGÀY HIỆN TẠI (CLIENT TIME): ${currentDate}
2. MỤC TIÊU GPA: Mục tiêu: ${gpaGoal}/10 | Điểm trung bình hiện tại: ${Number(currentAvg).toFixed(2)}/10.
3. BẢNG ĐIỂM CÁC MÔN HỌC (Hiện tại vs Mục tiêu):
${JSON.stringify(subjects, null, 2)}
4. LỊCH HỌC TRÊN LỚP HIỆN TẠI (Tránh trùng):
${JSON.stringify(events, null, 2)}
5. DANH SÁCH BÀI TẬP (TASKS):
${JSON.stringify(tasks, null, 2)}
${surveyPrompt}
(Lưu ý: Hôm nay là ${new Date(currentDate).toLocaleDateString('vi-VN', { weekday: 'long' })})


YÊU CẦU BẮT BUỘC:
1. ✨ TỰ ĐỘNG NHẬN DIỆN MÔN ƯU TIÊN: Dựa trên khoảng cách điểm giữa hiện tại và mục tiêu, hãy chỉ rõ môn nào cần học nhiều nhất.
2. PHÂN BỔ THỜI GIAN: Dựa trên số giờ mục tiêu (${surveyData?.targetHours || 0}h) và khung giờ rảnh, hãy lập lộ trình học tập chi tiết.
3. PHÂN BỐ LỊCH CHÍNH XÁC: Hãy tạo các sự kiện học tập rải đều các ngày trong tuần tới (từ ngày mai trở đi dựa trên ${currentDate}). 
      - TUYỆT ĐỐI KHÔNG dồn tất cả sự kiện vào 1 hoặc 2 ngày. 
      - Mỗi ngày tối đa 2 sự kiện học tập. 
      - Ưu tiên các khung giờ rảnh (freeTimeSlots) đã cung cấp. Nếu khung giờ rảnh là "Buổi tối", hãy đặt h (giờ) trong khoảng 18.0 - 21.0. Nếu là "Buổi sáng", đặt h trong khoảng 8.0 - 11.0.
      - Phải tính toán chính xác giá trị "date" (YYYY-MM-DD) tương ứng với các ngày trong tuần tới.
4. Trả về phản hồi bằng Markdown chuyên nghiệp với tiêu đề, danh sách và bảng phân tích.
5. ĐỊNH DẠNG JSON ĐỒNG BỘ LỊCH: Ở cuối phản hồi, hãy LUÔN kèm theo một khối JSON (bọc trong thẻ \`\`\`json_calendar_events ... \`\`\`) chứa mảng các đối tượng sự kiện.
Cấu trúc JSON: { "events": [ { "id": "ai_evt_...", "t": "Tên môn: Nội dung học", "date": "YYYY-MM-DD", "h": 19.5, "d": 1.5, "type": "study", "room": "Tự học AI" } ] }. 
Hãy tạo từ 6-10 buổi học (mỗi buổi 1-2 giờ) rải đều suốt tuần tới. Môn ưu tiên phải xuất hiện ít nhất 3-4 lần.`;

        const response = await callGemini(prompt, { maxOutputTokens: 3000 });

        if (response.text) {
          return res.json({
            reply: response.text,
            source: 'gemini'
          });
        }
      } catch (geminiErr: any) {
        const errMsg = geminiErr?.message || String(geminiErr);
        return res.json({
          reply: generateSmartStudyScheduleFallback({ tasks, events, studentProfile, gpaGoal, currentAvg, subjects }),
          source: 'fallback',
          error: errMsg
        });
      }
    }

    const localReply = generateSmartStudyScheduleFallback({ tasks, events, studentProfile, gpaGoal, currentAvg, subjects });
    return res.json({
      reply: localReply,
      source: 'fallback',
      error: 'GEMINI_API_KEY chưa được cấu hình'
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi hệ thống khi phân tích' });
  }
});

// Route: Direct In-Page ChatGPT Engine / Tâm Lí / Gia sư
app.post('/api/ai/chatgpt', async (req, res) => {
  try {
    let { messages, message, prompt, model = 'gpt-4o', systemInstruction: clientSystemInstruction, persona, subject, grade, moodLogs = [], autonomousResearch } = req.body;

    // Chấp nhận cả body { messages: [...] } lẫn { message: "..." } hoặc { prompt: "..." }
    if (!Array.isArray(messages) || messages.length === 0) {
      const userText = message || prompt || '';
      if (userText.trim()) {
        messages = [{ role: 'user', content: userText.trim() }];
      }
    }

    const query = (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content : message || prompt || '').trim();

    if (!query) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
    }

    const isTamAn = persona === 'psy' || (clientSystemInstruction && (clientSystemInstruction.includes('TÂM LÍ') || clientSystemInstruction.includes('TÂM LÝ')));
    const isTutor = persona === 'tutor' || (clientSystemInstruction && (clientSystemInstruction.includes('ACADEMIC TUTOR') || clientSystemInstruction.includes('Gia sư')));
    const isArchitect = persona === 'architect' || (clientSystemInstruction && clientSystemInstruction.includes('AI Architect'));
    const enableSearch = isTutor || (autonomousResearch === true);

    const subjectName = subject || 'Toán học';
    const studentGrade = grade || '12A1';

    const temperature = isTutor ? 0.3 : isArchitect ? 0.4 : 0.7;
    const topP = 0.9;

    // Immediate Crisis Intervention Guard (Highest Priority for Tâm Lí)
    if (isTamAn) {
      const dangerKeywords = ['tự tử', 'tự sát', 'không muốn sống', 'muốn chết', 'tự làm đau', 'cắt tay', 'rạch tay', 'làm hại bản thân', 'bị đánh', 'xâm hại', 'bạo lực', 'đe dọa'];
      const qLower = query.toLowerCase();
      if (dangerKeywords.some((k) => qLower.includes(k))) {
        return res.json({
          reply: getFallbackTamAnReply(query, moodLogs),
          model: model,
          source: 'gemini'
        });
      }
    }

    const defaultSystemPrompt = `Bạn là một GIÁO VIÊN ƯU TÚ và GIẢNG VIÊN ĐẠI HỌC XUẤT SẮC, được vận hành trên nền tảng học tập StudyFlow.
MỤC TIÊU SỨ MỆNH: Luôn trả lời theo tiêu chuẩn "ĐÚNG - ĐỦ - SÂU SẮC - SƯ PHẠM ĐỈNH CAO" như một giảng viên uyên bác và tận tụy nhất.`;

    let systemPrompt = clientSystemInstruction || defaultSystemPrompt;

    if (isTamAn) {
      let moodContextText = '';
      if (Array.isArray(moodLogs) && moodLogs.length > 0) {
        const recentLogs = moodLogs.slice(0, 3).map((m: any) => 
          `- Ngày ${m.date || ''} (${m.time || ''}): Tâm trạng [${m.emoji || ''} ${m.label || m.mood || ''}] - Ghi chú: "${m.note || 'Không có ghi chú'}"`
        ).join('\n');
        moodContextText = `\n\n## DỮ LIỆU NHẬT KÝ TÂM TRẠNG (MOOD LOGS) MỚI NHẤT CỦA HỌC SINH:\n${recentLogs}\n`;
      }

      systemPrompt = `SYSTEM PROMPT: AI ĐỒNG HÀNH TÂM LÝ HỌC ĐƯỜNG (TÂM LÍ)
Bạn là AI đồng hành tâm lý học đường. Bạn lắng nghe ân cần, đồng cảm, không phán xét và hỗ trợ tinh thần cho học sinh THCS/THPT.
Luôn trả lời bằng tiếng Việt nhẹ nhàng, tinh tế, gần gũi.
${moodContextText}`;
    }

    if (isTutor) {
      systemPrompt = `Môn: ${subjectName}. Học sinh lớp ${studentGrade}.\n\nSYSTEM PROMPT: AI GIA SƯ & GIẢI ĐÁP HỌC TẬP STUDYFLOW
Bạn là Gia sư AI cao cấp của StudyFlow, giỏi xuất sắc cả lý thuyết và bài tập môn ${subjectName} (Lớp ${studentGrade}). Trả lời trực tiếp, rõ ràng, chính xác tuyệt đối, giải thích sâu sắc từng bước, dùng LaTeX cho công thức ($...$ và $$...$$).`;
    }

    if (isArchitect) {
      systemPrompt = `SYSTEM PROMPT: AI ARCHITECT - LẬP KẾ HOẠCH HỌC TẬP & ĐỒNG BỘ CALENDAR
Bạn là AI Architect 🎓 trên nền tảng StudyFlow. Bạn là chuyên gia khảo sát nhu cầu, thói quen học tập và thiết kế lộ trình, thời gian biểu thông minh, tối ưu hóa để đồng bộ với Google Calendar.
Khi học sinh trả lời khảo sát hoặc yêu cầu lập kế hoạch:
- Lắng nghe và xác nhận các thông tin: môn học ưu tiên, số giờ mục tiêu (Study Goal), khoảng thời gian bắt đầu - kết thúc, khung giờ rảnh.
- Thiết kế lộ trình chi tiết theo từng ngày hoặc từng tuần rõ ràng, khoa học, có phân bổ thời gian nghỉ ngơi (Pomodoro) và ôn tập ngắt quãng (Spaced Repetition).
- Trình bày mạch lạc, sử dụng bảng Markdown hoặc các mốc thời gian rõ ràng để học sinh dễ theo dõi và áp dụng vào lịch học.
- Động viên học sinh với phong cách chuyên nghiệp, nhiệt tình, truyền cảm hứng.`;
    }

    if (!ai) {
      const reply = isTamAn ? getFallbackTamAnReply(query, moodLogs) : isTutor ? getFallbackTutorReply(query) : isArchitect ? `Chào bạn! Mình là AI Architect 🎓. Mình đã ghi nhận yêu cầu lập kế hoạch cho môn ${subjectName}. Lộ trình đề xuất: Phân bổ các phiên học 45-60 phút vào khung giờ rảnh mỗi ngày, tập trung ôn lý thuyết và luyện bài tập trọng tâm. Bạn có thể điều chỉnh thời gian và mục tiêu trong khung Cài đặt thủ công!` : getFallbackChatGptReply(query);
      return res.json({
        reply,
        model: model,
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    let contents: any[] = [];
    const recentMessages = Array.isArray(messages) ? messages.slice(-20) : [];
    if (recentMessages.length > 0) {
      for (const m of recentMessages) {
        if (!m || !m.content || typeof m.content !== 'string' || !m.content.trim()) continue;
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (contents.length === 0 && role === 'model') continue;
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += '\n\n' + m.content;
        } else {
          contents.push({ role, parts: [{ text: m.content }] });
        }
      }
    }

    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: query }] }];
    } else if (contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{ text: query }] });
    }

    const maxOutputTokens = isTutor ? 3500 : isTamAn ? 2048 : 2000;
    const geminiTools = enableSearch ? [{ googleSearch: {} }] : undefined;

    try {
      const response = await callGemini(contents, {
        systemInstruction: systemPrompt,
        temperature,
        topP,
        maxOutputTokens,
        tools: geminiTools
      });

      const grounding = response?.candidates?.[0]?.groundingMetadata;
      const searchQueries: string[] = grounding?.webSearchQueries || [];
      const searchChunks: Array<{ uri: string; title: string }> = (grounding?.groundingChunks || [])
        .map((chunk: any) => ({
          title: chunk?.web?.title || 'Tài liệu tham khảo',
          uri: chunk?.web?.uri || ''
        }))
        .filter((c: any) => Boolean(c.uri));

      return res.json({
        reply: response.text || (isTamAn ? 'Mình luôn ở đây để lắng nghe bạn.' : isTutor ? 'Mình đã ghi nhận câu hỏi và giải thích chi tiết cho bạn.' : 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?'),
        model: model,
        source: response.source || 'gemini',
        sources: searchChunks,
        searchQueries: searchQueries,
        isAutonomousResearched: enableSearch
      });
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      console.warn('Gemini chatgpt error:', errMsg);

      // Requirement 5: Với chế độ tâm lý và gia sư: nếu có GEMINI_API_KEY mà Gemini lỗi, trả lỗi rõ ràng thay vì câu trả lời soạn sẵn.
      if (isTamAn || isTutor) {
        return res.json({
          reply: errMsg,
          model: model,
          source: 'fallback',
          error: errMsg
        });
      }

      return res.json({
        reply: getFallbackChatGptReply(query),
        model: model,
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const isTamAn = req.body?.persona === 'psy' || (req.body?.systemInstruction && (req.body.systemInstruction.includes('TÂM LÍ') || req.body.systemInstruction.includes('TÂM LÝ')));
    const isTutor = req.body?.persona === 'tutor' || (req.body?.systemInstruction && (req.body.systemInstruction.includes('ACADEMIC TUTOR') || req.body.systemInstruction.includes('Gia sư')));

    if (isTamAn || isTutor) {
      return res.json({
        reply: errMsg,
        model: req.body?.model || 'gpt-4o',
        source: 'fallback',
        error: errMsg
      });
    }

    return res.json({
      reply: getFallbackChatGptReply(req.body?.message || ''),
      model: req.body?.model || 'gpt-4o',
      source: 'fallback',
      error: errMsg
    });
  }
});

// Route: AI Exam Matrix Generator
app.post('/api/ai/generate-exam', async (req, res) => {
  try {
    const { subject, grade, topic, count, matrix, durationMinutes } = req.body;
    const numQuestions = Math.min(40, Math.max(2, parseInt(count, 10) || 5));

    if (!ai) {
      return res.json({
        questions: getFallbackQuestions(subject, grade, topic, numQuestions),
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    const prompt = `Bạn là chuyên gia khảo thí và ra đề thi chuẩn Bộ Giáo dục & Đào tạo. Hãy tạo một đề thi trắc nghiệm môn ${subject || 'Vật lí'} khối ${grade || 12}, chuyên đề: "${topic || 'Dao động điều hòa & Sóng cơ'}".
Số câu hỏi: ${numQuestions} câu. Thời gian: ${durationMinutes || 45} phút.
Tỉ lệ ma trận nhận thức:
- Nhận biết: ${matrix?.nb || 40}%
- Thông hiểu: ${matrix?.th || 30}%
- Vận dụng: ${matrix?.vd || 20}%
- Vận dụng cao: ${matrix?.vdc || 10}%

YÊU CẦU: Trả về kết quả JSON CHÍNH XÁC là một mảng gồm ${numQuestions} câu hỏi theo cấu trúc:
[
  {
    "id": 1,
    "questionText": "Nội dung câu hỏi rõ ràng, chính xác...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctOption": 0,
    "explanation": "Lời giải thích ngắn gọn, xúc tích vì sao phương án đó đúng..."
  }
]`;

    try {
      const response = await callGemini(prompt, { responseMimeType: 'application/json' });
      const raw = response.text || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ questions: parsed, source: 'gemini' });
      }
      throw new Error('Dữ liệu JSON đề thi trả về không hợp lệ');
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      return res.json({
        questions: getFallbackQuestions(subject, grade, topic, numQuestions),
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    return res.json({
      questions: getFallbackQuestions(req.body.subject, req.body.grade, req.body.topic, req.body.count || 5),
      source: 'fallback',
      error: errMsg
    });
  }
});

// Route: AI Material Generator
app.post('/api/ai/generate-material', async (req, res) => {
  try {
    const { subject, grade, topic, materialType } = req.body;

    if (!ai) {
      return res.json({
        content: getFallbackMaterial(subject, grade, topic, materialType),
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    const prompt = `Bạn là giáo viên giỏi môn ${subject || 'Vật lí'} cấp THPT. Hãy biên soạn học liệu loại "${materialType || 'Tóm tắt lý thuyết & Sơ đồ tư duy'}" cho học sinh khối ${grade || 12}, chủ đề: "${topic || 'Dao động điều hòa'}".
Yêu cầu: Viết chi tiết bằng Markdown, trình bày đẹp mắt, có bảng công thức, ví dụ minh họa và chú ý những lỗi học sinh hay sai.`;

    try {
      const response = await callGemini(prompt);
      return res.json({
        content: response.text || getFallbackMaterial(subject, grade, topic, materialType),
        source: 'gemini'
      });
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      return res.json({
        content: getFallbackMaterial(subject, grade, topic, materialType),
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    return res.json({
      content: getFallbackMaterial(req.body.subject, req.body.grade, req.body.topic, req.body.materialType),
      source: 'fallback',
      error: errMsg
    });
  }
});

// Route: AI Flashcard Generator
app.post('/api/ai/generate-flashcards', async (req, res) => {
  try {
    const { content = '', subject, title } = req.body;
    
    if (!ai) {
      return res.json({
        deck: {
          id: 'deck_' + Date.now(),
          title: title || 'Bộ Flashcard mới',
          subject: subject || 'Tổng hợp',
          cardCount: 2,
          remainingCount: 2,
          goodCount: 0,
          againCount: 0,
          cards: [
            { id: '1', front: 'Flashcard là gì?', back: 'Thẻ ghi nhớ giúp ôn tập kiến thức hiệu quả.', hint: 'Công cụ học tập', status: 'new' },
            { id: '2', front: 'AI StudyFlow giúp ích gì?', back: 'Tự động tạo học liệu và đề thi thông minh.', hint: 'Ứng dụng giáo dục', status: 'new' }
          ],
          createdAt: new Date().toISOString()
        },
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    const prompt = `Bạn là chuyên gia giáo dục và thiết kế phương pháp Spaced Repetition (Lặp lại ngắt quãng). Hãy đọc nội dung sau và tạo một bộ Flashcard học tập:
---
NỘI DUNG: ${content.slice(0, 20000)}
MÔN HỌC: ${subject || 'Tổng hợp'}
---
YÊU CẦU:
1. Xác định các kiến thức quan trọng nhất.
2. Tạo tối thiểu 5-10 thẻ ghi nhớ.
3. Mỗi thẻ gồm: front, back, hint
Trải về JSON:
{
  "title": "Tên bộ flashcard",
  "subject": "Tên môn học",
  "cards": [
    { "front": "...", "back": "...", "hint": "..." }
  ]
}`;

    try {
      const response = await callGemini(prompt, { responseMimeType: 'application/json' });
      const raw = response.text || '{}';
      const parsed = JSON.parse(raw);
      
      const cards = (parsed.cards || []).map((c: any, idx: number) => ({
        ...c,
        id: 'c_' + Date.now() + '_' + idx,
        status: 'new'
      }));

      return res.json({
        deck: {
          id: 'deck_' + Date.now(),
          title: parsed.title || title || 'Bộ Flashcard mới',
          subject: parsed.subject || subject || 'Tổng hợp',
          cardCount: cards.length,
          remainingCount: cards.length,
          goodCount: 0,
          againCount: 0,
          cards,
          createdAt: new Date().toISOString()
        },
        source: 'gemini'
      });
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      return res.json({
        deck: {
          id: 'deck_' + Date.now(),
          title: title || 'Bộ Flashcard dự phòng',
          subject: subject || 'Tổng hợp',
          cardCount: 2,
          remainingCount: 2,
          goodCount: 0,
          againCount: 0,
          cards: [
            { id: '1', front: 'Thành phần chính', back: 'Tóm tắt nội dung tài liệu', hint: 'Lý thuyết', status: 'new' },
            { id: '2', front: 'Ứng dụng chính', back: 'Phương pháp áp dụng', hint: 'Thực hành', status: 'new' }
          ],
          createdAt: new Date().toISOString()
        },
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    return res.status(500).json({ error: errMsg, source: 'fallback' });
  }
});

// Route: AI Document Tools (Summarize chapters, Generate Review Quiz, Answer with Citations)
app.post('/api/ai/document-tools', async (req, res) => {
  try {
    const { action, documentTitle, documentContent, userQuestion, numQuestions = 5, difficulty = 'medium', subject = 'Tổng hợp' } = req.body;
    const docText = (documentContent || '').slice(0, 30000);

    if (action === 'summarize') {
      if (!ai) {
        return res.json({
          summary: `### 📌 Tóm tắt từng chương: ${documentTitle || 'Tài liệu'}\n\n#### 📖 Chương 1: Kiến thức tổng quan (Trích dẫn: Trang 1)\n- **Nội dung chính:** Tổng hợp các khái niệm cơ bản và nền tảng lý thuyết.\n- **Kiến thức cốt lõi:** Nắm chắc định nghĩa và quy tắc vận dụng [Trích dẫn: Trang 1, Đoạn 2].\n\n#### 📖 Chương 2: Công thức & Ứng dụng thực tế (Trích dẫn: Trang 2)\n- **Nội dung chính:** Các công thức biến đổi chính và phương pháp giải nhanh bài tập.`,
          source: 'fallback',
          error: 'GEMINI_API_KEY chưa được cấu hình'
        });
      }

      const prompt = `Bạn là Trợ lý AI Phân tích Tài liệu Học tập. Hãy đọc nội dung tài liệu sau và tạo bản TÓM TẮT THEO TỪNG CHƯƠNG / MỤC:

TIÊU ĐỀ: "${documentTitle || 'Tài liệu học tập'}"
NỘI DUNG:
${docText}

YÊU CẦU BẮT BUỘC:
1. Chia tài liệu thành các Chương/Mục rõ ràng (Chương 1, Chương 2...).
2. Tóm tắt các ý chính ngắn gọn, súc tích.
3. BẮT BUỘC: Sau mỗi luận điểm chính, hãy ghi rõ trích dẫn đoạn/trang tương ứng dưới dạng "[Trích dẫn: Trang X, Đoạn Y]" hoặc "[Trích dẫn: Chương X - Mục Y]" để học sinh đối chiếu.
4. Xuất ra định dạng Markdown đẹp mắt.`;

      try {
        const response = await callGemini(prompt);
        return res.json({
          summary: response.text || 'Không thể tạo tóm tắt lúc này.',
          source: 'gemini'
        });
      } catch (geminiErr: any) {
        const errMsg = geminiErr?.message || String(geminiErr);
        return res.json({
          summary: `### 📌 Tóm tắt dự phòng: ${documentTitle || 'Tài liệu'}\n\n${docText.slice(0, 500)}...`,
          source: 'fallback',
          error: errMsg
        });
      }
    }

    if (action === 'generate_quiz') {
      const fallbackQuiz = [
        {
          id: 1,
          questionText: `Nội dung cốt lõi của bài học "${documentTitle || 'Tài liệu'}" là gì?`,
          options: ['Nắm vững định nghĩa và bài tập vận dụng', 'Học thuộc lòng không cần hiểu', 'Chỉ làm bài tập nâng cao', 'Bỏ qua lý thuyết'],
          correctOption: 0,
          explanation: 'Nắm vững định nghĩa giúp xây dựng nền tảng tư duy vững chắc.',
          sourceCitation: '[Trích dẫn: Trang 1, Đoạn 1]'
        },
        {
          id: 2,
          questionText: 'Khi giải các bài toán vận dụng trong tài liệu, bước đầu tiên cần làm là:',
          options: ['Đọc kỹ đề bài và xác định đại lượng đã biết', 'Chọn ngẫu nhiên công thức', 'Bỏ qua bước đổi đơn vị', 'Đoán đáp án'],
          correctOption: 0,
          explanation: 'Đọc kỹ đề và đổi đơn vị chuẩn giúp tránh các sai sót đáng tiếc.',
          sourceCitation: '[Trích dẫn: Trang 2, Đoạn 3]'
        }
      ];

      if (!ai) {
        return res.json({
          quiz: fallbackQuiz,
          questions: fallbackQuiz,
          source: 'fallback',
          error: 'GEMINI_API_KEY chưa được cấu hình'
        });
      }

      const requestedCount = Math.min(30, Math.max(1, Number(numQuestions) || 5));
      const prompt = `Bạn là chuyên gia ra đề thi ôn tập từ tài liệu học tập. Dựa trên tài liệu dưới đây, hãy tạo ${requestedCount} câu hỏi ôn tập trắc nghiệm. Môn học: ${subject}. Độ khó: ${difficulty}:

TIÊU ĐỀ: "${documentTitle || 'Tài liệu'}"
NỘI DUNG:
${docText}

YÊU CẦU: Trả về JSON gồm mảng "quiz" gồm đúng ${requestedCount} câu hỏi:
[
  {
    "id": 1,
    "questionText": "...",
    "options": ["A...", "B...", "C...", "D..."],
    "correctOption": 0,
    "explanation": "...",
    "sourceCitation": "[Trích dẫn: Trang X, Đoạn Y]"
  }
]
Chú ý: BẮT BUỘC có trường "sourceCitation" chỉ rõ đoạn/trang trong tài liệu chứa đáp án!`;

      try {
        const response = await callGemini(prompt, { responseMimeType: 'application/json' });
        const raw = response.text || '{}';
        const parsed = JSON.parse(raw);
        const quizList = parsed.quiz || parsed.questions || parsed || [];
        return res.json({
          quiz: quizList,
          questions: quizList,
          source: 'gemini'
        });
      } catch (geminiErr: any) {
        const errMsg = geminiErr?.message || String(geminiErr);
        return res.json({
          quiz: fallbackQuiz,
          questions: fallbackQuiz,
          source: 'fallback',
          error: errMsg
        });
      }
    }

    if (action === 'ask_question') {
      const q = userQuestion || 'Hãy tóm tắt và trích dẫn ý chính.';

      if (!ai) {
        return res.json({
          answer: `Dựa trên tài liệu "${documentTitle || 'học tập'}":\n\nNội dung trả lời cho câu hỏi: "${q}".`,
          sourceCitation: '[Trích dẫn: Trang 1, Đoạn 2]',
          source: 'fallback',
          error: 'GEMINI_API_KEY chưa được cấu hình'
        });
      }

      const prompt = `Bạn là Trợ lý AI Hỏi đáp & Kiểm chứng Tài liệu. Hãy trả lời câu hỏi của học sinh DỰA TRÊN NỘI DUNG TÀI LIỆU SAU:

TÀI LIỆU: "${documentTitle || 'Tài liệu học tập'}"
${docText}

CÂU HỎI HỌC SINH: "${q}"

YÊU CẦU QUAN TRỌNG:
1. Trả lời chính xác, dễ hiểu, ân cần.
2. BẮT BUỘC TRÍCH DẪN: Trong câu trả lời, bạn BẮT BUỘC phải ghi trích dẫn nguồn đoạn/trang cụ thể dưới dạng "[Trích dẫn: Trang X, Đoạn Y]".`;

      try {
        const response = await callGemini(prompt);
        return res.json({
          answer: response.text || 'Không tìm thấy câu trả lời trong tài liệu.',
          source: 'gemini'
        });
      } catch (geminiErr: any) {
        const errMsg = geminiErr?.message || String(geminiErr);
        return res.json({
          answer: `Dựa trên tài liệu "${documentTitle || 'học tập'}":\n\nKhông thể kết nối Gemini.`,
          source: 'fallback',
          error: errMsg
        });
      }
    }

    return res.status(400).json({ error: 'Action không hợp lệ' });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    return res.status(500).json({ error: errMsg, source: 'fallback' });
  }
});

// Route: AI Study Goal Quest Map Generator
app.post('/api/ai/generate-goal-map', async (req, res) => {
  try {
    const { goalTitle, subject } = req.body;
    const title = goalTitle || 'Hoàn thành chương trình Toán 11';
    const sub = subject || 'Toán học';

    if (!ai) {
      return res.json({
        goal: buildSmartGoalMapFallback(title, sub),
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    try {
      const prompt = `Bạn là chuyên gia thiết kế lộ trình học tập game hóa (Gamified Learning Path / Quest Map).
Hãy đọc mục tiêu học tập sau và tạo 5 MỐC HÀNH TRÀNH CHINH PHỤC (Milestones):

MỤC TIÊU: "${title}"
MÔN HỌC: "${sub}"

YÊU CẦU: Trả về JSON theo đúng cấu trúc:
{
  "title": "${title}",
  "subject": "${sub}",
  "milestones": [
    {
      "id": "m1",
      "title": "Mốc 1: Khởi đầu & Củng cố nền tảng...",
      "description": "Mô tả ngắn gọn nhiệm vụ trọng tâm...",
      "status": "completed",
      "rewardBadge": "🌱 Khởi đầu",
      "rewardPoints": 100
    },
    {
      "id": "m2",
      "title": "Mốc 2: Nắm chắc phương pháp...",
      "description": "...",
      "status": "in_progress",
      "rewardBadge": "⭐ Nắm chắc",
      "rewardPoints": 150
    },
    {
      "id": "m3",
      "title": "Mốc 3: Luyện kỹ năng thực chiến...",
      "description": "...",
      "status": "locked",
      "rewardBadge": "🛡️ Thực chiến",
      "rewardPoints": 200
    },
    {
      "id": "m4",
      "title": "Mốc 4: Tăng tốc giải đề...",
      "description": "...",
      "status": "locked",
      "rewardBadge": "🔥 Bứt phá",
      "rewardPoints": 250
    },
    {
      "id": "m5",
      "title": "Mốc 5: Chinh phục đỉnh cao...",
      "description": "...",
      "status": "locked",
      "rewardBadge": "👑 Quán quân",
      "rewardPoints": 300
    }
  ]
}`;

      const response = await callGemini(prompt, { responseMimeType: 'application/json' });
      const raw = response.text || '{}';
      const parsed = JSON.parse(raw);

      if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        return res.json({
          goal: {
            id: 'goal_' + Date.now(),
            title: parsed.title || title,
            subject: parsed.subject || sub,
            createdAt: new Date().toISOString(),
            milestones: parsed.milestones.map((m: any, idx: number) => ({
              id: m.id || ('m' + (idx + 1)),
              title: m.title || `Mốc ${idx + 1}`,
              description: m.description || 'Hoàn thành nhiệm vụ học tập',
              status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'locked',
              rewardBadge: m.rewardBadge || (idx === parsed.milestones.length - 1 ? '👑 Quán quân' : '⭐ Bậc thầy'),
              rewardPoints: m.rewardPoints || (100 + idx * 50)
            }))
          },
          source: 'gemini'
        });
      }
      throw new Error('Cấu trúc mốc hành trình không đúng yêu cầu');
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      return res.json({
        goal: buildSmartGoalMapFallback(title, sub),
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const fallbackGoal = buildSmartGoalMapFallback(req.body?.goalTitle || 'Mục tiêu học tập', req.body?.subject || 'Tổng hợp');
    return res.json({
      goal: fallbackGoal,
      source: 'fallback',
      error: errMsg
    });
  }
});

// Route: AI Smart Roadmap Synthesis (Global Performance-based)
app.post('/api/ai/synthesize-roadmap', async (req, res) => {
  try {
    const { studentProfile, subjects, sessions, tasks, currentGoals } = req.body;
    
    if (!ai) {
      return res.json({
        goal: buildSmartGoalMapFallback('Lộ trình Bứt phá Cá nhân hóa', 'Tổng hợp'),
        advice: 'Dựa trên thống kê, bạn đang học tập rất tích cực. Hãy tiếp tục duy trì nhé!',
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    const prompt = `Bạn là Chuyên gia Tư vấn Giáo dục & Thiết kế Lộ trình Học tập Cá nhân hóa của StudyFlow.
Nhiệm vụ của bạn là phân tích dữ liệu hiệu suất của học sinh và TỔNG HỢP một BẢN ĐỒ MỤC TIÊU (Roadmap) tối ưu nhất.

DỮ LIỆU HIỆU SUẤT:
1. Hồ sơ: ${JSON.stringify(studentProfile)}
2. Điểm số các môn: ${JSON.stringify(subjects)}
3. Thời gian tập trung (phút/ngày): ${JSON.stringify(sessions)}
4. Nhiệm vụ tồn đọng: ${JSON.stringify(tasks?.filter((t: any) => !t.done))}
5. Mục tiêu hiện tại: ${JSON.stringify(currentGoals)}

YÊU CẦU: Trả về JSON có "advice" và "goal".`;

    try {
      const response = await callGemini(prompt, { responseMimeType: 'application/json' });
      let cleanedText = (response.text || '{}').replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return res.json({
        ...parsed,
        source: 'gemini'
      });
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      return res.json({
        goal: buildSmartGoalMapFallback('Lộ trình Bứt phá Dự phòng', 'Tổng hợp'),
        advice: 'Chúng tôi đã thiết kế lộ trình cơ bản cho bạn dựa trên các môn học trọng tâm.',
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    return res.json({
      goal: buildSmartGoalMapFallback('Lộ trình Bứt phá Dự phòng', 'Tổng hợp'),
      advice: 'Chúng tôi đã thiết kế lộ trình cơ bản cho bạn dựa trên các môn học trọng tâm.',
      source: 'fallback',
      error: errMsg
    });
  }
});

// Helper: Deterministic Fallback Schedule Generator for server-side
function buildFallbackSchedule(startDateStr: string, events: any[]) {
  const suggestions = [];
  const start = new Date(startDateStr);
  
  // Date formatter for server side (internal)
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dStr = fmt(d);
    
    // Suggest one slot per day in the evening if no event exists
    const hasEventAtNight = events.some(e => e.date === dStr && e.h >= 18);
    if (!hasEventAtNight && suggestions.length < 5) {
      suggestions.push({
        t: `💡 Buổi học tập trung (Đề xuất AI)`,
        type: 'class',
        date: dStr,
        h: 19.5, // 19:30
        d: 1.5,
        room: "🏠 Tự học tại nhà"
      });
    }
  }
  return suggestions;
}

// Route: AI Auto-suggest Schedule allocation
app.post('/api/ai/suggest-schedule', async (req, res) => {
  try {
    const { events = [], tasks = [], countdowns = [], startDate } = req.body;
    
    if (!ai) {
      return res.json({
        suggestions: buildFallbackSchedule(startDate || new Date().toISOString(), events),
        source: 'fallback',
        error: 'GEMINI_API_KEY chưa được cấu hình'
      });
    }

    const prompt = `Bạn là Trợ lý AI Điều phối Thời gian (StudyFlow Schedule Optimizer).
Nhiệm vụ: Dựa trên lịch học hiện tại, danh sách bài tập (tasks) và các kỳ thi sắp tới (countdowns), hãy TỰ ĐỘNG PHÂN BỔ 5-8 buổi tự học (Study Slots) tối ưu nhất vào các khoảng thời gian trống trong tuần tới (bắt đầu từ ${startDate || 'hôm nay'}).

DỮ LIỆU:
1. LỊCH HIỆN TẠI (Events - Tránh trùng giờ): ${JSON.stringify(events.map((e: any) => ({ t: e.t, date: e.date, h: e.h, d: e.d })))}
2. BÀI TẬP CẦN LÀM (Tasks): ${JSON.stringify(tasks.filter((t: any) => !t.done).map((t: any) => ({ t: t.t, sub: t.sub, due: t.due, hi: t.hi })))}
3. KỲ THI SẮP TỚI (Countdowns): ${JSON.stringify(countdowns.map((c: any) => ({ title: c.title, date: c.targetDate })))}

YÊU CẦU:
1. Mỗi buổi học kéo dài 1.5 - 2 giờ.
2. Tránh các khoảng thời gian đã có lịch.
3. Đặt vào các khung giờ vàng: Chiều (14:00-17:00) hoặc Tối (19:00-22:00).
4. Trả về JSON là một mảng các gợi ý sự kiện với cấu trúc:
{
  "suggestions": [
    {
      "t": "Tên buổi học",
      "type": "class",
      "date": "YYYY-MM-DD",
      "h": 19.5,
      "d": 1.5,
      "room": "📍 Tự học tại nhà / Thư viện"
    }
  ]
}`;

    try {
      const response = await callGemini(prompt);
      let cleanedText = response.text || '{}';
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      const parsed = JSON.parse(cleanedText);
      if (parsed.suggestions && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        return res.json({
          suggestions: parsed.suggestions,
          source: 'gemini'
        });
      }
      throw new Error('Dữ liệu phân bổ lịch từ AI không hợp lệ');
    } catch (geminiErr: any) {
      const errMsg = geminiErr?.message || String(geminiErr);
      return res.json({
        suggestions: buildFallbackSchedule(startDate || new Date().toISOString(), events),
        source: 'fallback',
        error: errMsg
      });
    }
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const { events = [], startDate } = req.body;
    return res.json({
      suggestions: buildFallbackSchedule(startDate || new Date().toISOString(), events),
      source: 'fallback',
      error: errMsg
    });
  }
});

// Route: Parse Exam File (Azota Style - Word .docx, PDF, TXT, JSON)
app.post('/api/ai/parse-exam-file', async (req, res) => {
  try {
    const { rawText, fileBase64, mimeType, fileName } = req.body;

    let textToParse = rawText || '';

    // If Word (.docx) file uploaded as base64, extract text with mammoth
    if (fileBase64 && (fileName?.endsWith('.docx') || mimeType?.includes('wordprocessingml') || mimeType?.includes('docx'))) {
      try {
        const buffer = Buffer.from(fileBase64, 'base64');
        const mammothResult = await mammoth.extractRawText({ buffer });
        textToParse = mammothResult.value;
      } catch (err: any) {
        console.warn('Mammoth docx parse error:', err?.message);
      }
    }

    if (ai) {
      try {
        if (fileBase64 && (fileName?.endsWith('.pdf') || mimeType?.includes('pdf'))) {
          const contents = [
            { inlineData: { mimeType: 'application/pdf', data: fileBase64 } },
            { text: `Bạn là hệ thống chuyển đổi đề thi tự động như Azota. Hãy đọc file đề thi PDF này và trích xuất JSON title, subject, durationMinutes, questions.` }
          ];
          const response = await callGemini(contents, { responseMimeType: 'application/json' });
          const raw = response.text || '{}';
          const parsed = JSON.parse(raw);
          if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return res.json({
              success: true,
              source: 'gemini',
              title: parsed.title || fileName?.replace(/\.[^/.]+$/, '') || 'Đề thi nhập từ file PDF',
              subject: parsed.subject || 'Tổng hợp',
              durationMinutes: parsed.durationMinutes || 45,
              questions: parsed.questions
            });
          }
        } else if (textToParse && textToParse.trim().length > 20) {
          const prompt = `Bạn là công cụ chuyển đổi đề thi tự động chuẩn Azota. Hãy phân tích văn bản đề thi dưới đây:
---
${textToParse.slice(0, 30000)}
---
Trải về JSON gồm title, subject, durationMinutes, questions.`;
          const response = await callGemini(prompt, { responseMimeType: 'application/json' });
          const raw = response.text || '{}';
          const parsed = JSON.parse(raw);
          if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return res.json({
              success: true,
              source: 'gemini',
              title: parsed.title || fileName?.replace(/\.[^/.]+$/, '') || 'Đề thi nhập từ file',
              subject: parsed.subject || detectSubjectFromText(textToParse),
              durationMinutes: parsed.durationMinutes || 45,
              questions: parsed.questions
            });
          }
        }
      } catch (geminiError: any) {
        const errMsg = geminiError?.message || String(geminiError);
        console.warn('Gemini exam file parse error, falling back to local Azota regex engine:', errMsg);
        const localResult = parseAzotaText(textToParse, fileName);
        return res.json({
          success: true,
          source: 'fallback',
          error: errMsg,
          ...localResult
        });
      }
    }

    const localResult = parseAzotaText(textToParse, fileName);
    return res.json({
      success: true,
      source: 'fallback',
      error: 'GEMINI_API_KEY chưa được cấu hình',
      ...localResult
    });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error('Parse exam file error:', error);
    return res.status(500).json({
      success: false,
      source: 'fallback',
      error: errMsg
    });
  }
});

// Helper: Detect subject from Vietnamese text
function detectSubjectFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('vật lý') || lower.includes('vật lí') || lower.includes('dao động') || lower.includes('sóng cơ')) return 'Vật lí';
  if (lower.includes('hóa học') || lower.includes('phương trình hóa học') || lower.includes('ancol') || lower.includes('kim loại')) return 'Hóa học';
  if (lower.includes('sinh học') || lower.includes('di truyền') || lower.includes('nhiễm sắc thể') || lower.includes('tế bào')) return 'Sinh học';
  if (lower.includes('ngữ văn') || lower.includes('văn học') || lower.includes('tác phẩm') || lower.includes('bài thơ')) return 'Ngữ văn';
  if (lower.includes('lịch sử') || lower.includes('kháng chiến') || lower.includes('chiến dịch') || lower.includes('hiệp định')) return 'Lịch sử';
  if (lower.includes('địa lý') || lower.includes('địa lí') || lower.includes('khí hậu') || lower.includes('đồng bằng')) return 'Địa lý';
  if (lower.includes('tiếng anh') || lower.includes('english') || lower.includes('grammar') || lower.includes('pronunciation')) return 'Tiếng Anh';
  if (lower.includes('tin học') || lower.includes('thuật toán') || lower.includes('lập trình') || lower.includes('pascal') || lower.includes('python')) return 'Tin học';
  if (lower.includes('toán') || lower.includes('đại số') || lower.includes('hình học') || lower.includes('nghiệm') || lower.includes('đạo hàm')) return 'Toán';
  return 'Tổng hợp';
}

// Vietnamese Azota Format Regex Engine
function parseAzotaText(text: string, fileName?: string) {
  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Detect Title & Subject
  let title = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '';
  const firstFew = lines.slice(0, 8).join(' ');
  const subject = detectSubjectFromText(firstFew + ' ' + title);

  // Look for title headers e.g. "ĐỀ KIỂM TRA..."
  for (const l of lines.slice(0, 5)) {
    if (/^(ĐỀ\s+|BÀI\s+KIỂM\s+TRA|KIỂM\s+TRA|THI\s+)/i.test(l)) {
      title = l;
      break;
    }
  }
  if (!title) {
    title = `Đề thi trắc nghiệm môn ${subject}`;
  }

  // 2. Look for Answer Key section at the bottom (BẢNG ĐÁP ÁN: 1.A 2.B 3.C... or 1A 2B 3C...)
  const answerKeyMap: Record<number, number> = {};
  const answerSectionRegex = /(?:bảng\s+đáp\s+án|đáp\s+án|answer\s+key)[\s\S]*$/i;
  const answerSectionMatch = clean.match(answerSectionRegex);
  if (answerSectionMatch) {
    const sectionText = answerSectionMatch[0];
    const itemRegex = /(\d+)[\s.:\-_]*([A-Da-d])/g;
    let m;
    while ((m = itemRegex.exec(sectionText)) !== null) {
      const qNum = parseInt(m[1], 10);
      const letter = m[2].toUpperCase();
      const optIdx = letter.charCodeAt(0) - 65; // A->0, B->1, C->2, D->3
      if (optIdx >= 0 && optIdx <= 3) {
        answerKeyMap[qNum] = optIdx;
      }
    }
  }

  // 3. Split questions using Azota pattern: "Câu 1:", "Câu 1.", "Question 1:", "1."
  // Strip answer section from question parsing if present
  let questionBody = clean;
  if (answerSectionMatch && answerSectionMatch.index !== undefined && answerSectionMatch.index > 50) {
    questionBody = clean.substring(0, answerSectionMatch.index);
  }

  // Regex to split questions
  const qSplitRegex = /(?:^|\n)(?:Câu|Question|Bài)\s*(\d+)[:.]\s*|(?:^|\n)(\d+)[.:]\s+(?=[A-ZÀ-Ỹ])/gi;
  const matches: { index: number; qNum: number; fullMatch: string }[] = [];
  let match;
  while ((match = qSplitRegex.exec(questionBody)) !== null) {
    const num = parseInt(match[1] || match[2], 10);
    matches.push({ index: match.index, qNum: num, fullMatch: match[0] });
  }

  const questions: any[] = [];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const nextIndex = i + 1 < matches.length ? matches[i + 1].index : questionBody.length;
      const block = questionBody.substring(cur.index, nextIndex).trim();

      // Remove the prefix "Câu X:"
      const textWithoutPrefix = block.replace(/^(?:Câu|Question|Bài)\s*\d+[:.]\s*|^\d+[.:]\s+/i, '').trim();

      // Find options A., B., C., D.
      const optRegex = /(?:^|\n|\t|\s{2,})([*]?[A-Da-d])[.:)]\s*/g;
      const optMatches: { index: number; letter: string }[] = [];
      let om;
      while ((om = optRegex.exec(textWithoutPrefix)) !== null) {
        optMatches.push({ index: om.index, letter: om[1] });
      }

      if (optMatches.length >= 2) {
        const qStem = textWithoutPrefix.substring(0, optMatches[0].index).trim();
        const options: string[] = [];
        let markedCorrect = -1;

        for (let j = 0; j < optMatches.length; j++) {
          const optStart = optMatches[j].index;
          const optEnd = j + 1 < optMatches.length ? optMatches[j + 1].index : textWithoutPrefix.length;
          let optText = textWithoutPrefix.substring(optStart, optEnd).trim();

          // Check if marked with asterisk or [Đúng]
          if (optMatches[j].letter.startsWith('*') || /\[đúng\]|\(đúng\)/i.test(optText)) {
            markedCorrect = j;
          }

          // Clean option text
          optText = optText.replace(/^[*]?([A-Da-d])[.:)]\s*/, '').replace(/\[đúng\]|\(đúng\)/gi, '').trim();
          options.push(optText);
        }

        // Determine correctOption
        let correctOption = 0;
        if (markedCorrect >= 0 && markedCorrect < options.length) {
          correctOption = markedCorrect;
        } else if (answerKeyMap[cur.qNum] !== undefined) {
          correctOption = answerKeyMap[cur.qNum];
        } else {
          // Check if inline answer like "Đáp án: B"
          const inlineAns = block.match(/(?:đáp\s*án|đ\/a)[:\s]*([A-Da-d])/i);
          if (inlineAns) {
            correctOption = inlineAns[1].toUpperCase().charCodeAt(0) - 65;
          }
        }

        // Extract explanation if any
        let explanation = '';
        const expMatch = block.match(/(?:lời\s*giải|hướng\s*dẫn\s*giải|giải\s*thích)[:\s]*([\s\S]*)$/i);
        if (expMatch) {
          explanation = expMatch[1].trim();
        }

        questions.push({
          id: cur.qNum || (i + 1),
          questionText: qStem || `Câu hỏi số ${i + 1}`,
          options: options.slice(0, 4),
          correctOption: Math.min(Math.max(0, correctOption), Math.max(0, options.length - 1)),
          explanation
        });
      }
    }
  }

  // Fallback if no questions detected
  if (questions.length === 0) {
    questions.push(
      {
        id: 1,
        questionText: `Nội dung từ file "${fileName || 'đề thi'}": Vui lòng kiểm tra định dạng Câu 1: ... A. ... B. ... C. ... D. ...`,
        options: ['A. Lựa chọn A', 'B. Lựa chọn B', 'C. Lựa chọn C', 'D. Lựa chọn D'],
        correctOption: 0,
        explanation: 'Hệ thống Azota hỗ trợ chuẩn định dạng: Câu 1: [Nội dung], A. [Lựa chọn], B. [Lựa chọn], C. [Lựa chọn], D. [Lựa chọn].'
      }
    );
  }

  return {
    title,
    subject,
    durationMinutes: 45,
    questions
  };
}
function getFallbackAssistantReply(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('lỗ hổng') || m.includes('12a2') || m.includes('phổ điểm')) {
    return `### 📊 Báo cáo phân tích học tập lớp 12A2 (Vật lí) - Cô Phượng
1. **Tổng quan phổ điểm bài kiểm tra gần nhất:**
   - Điểm Giỏi (8.5 - 10): 28% (chủ yếu đạt điểm phần Dao động điều hòa và Con lắc lò xo).
   - Điểm Khá (6.5 - 8.0): 44% (nắm vững lý thuyết nhưng mất điểm ở bài toán tính thời gian ngắn nhất).
   - Điểm Trung bình & Dưới 5: 28% (sai nhiều ở câu lý thuyết nhiễu sóng và định luật Ôm cho mạch RLC).

2. **Nhận diện lỗ hổng kiến thức chính:**
   - Học sinh chưa phân biệt được pha ban đầu φ và độ lệch pha Δφ giữa u và i.
   - Nhầm lẫn điều kiện xảy ra hiện tượng cộng hưởng điện ($Z_L = Z_C$).
   - Kỹ năng đọc đồ thị dao động theo trục thời gian còn chậm.

3. **Đề xuất giải pháp sư phạm:**
   - Dành 15 phút đầu tiết tới ôn tập dạng bài tập đồ thị kết hợp vòng tròn lượng giác.
   - Sử dụng chức năng **"AI Tạo đề theo Ma trận"** chọn tỷ lệ 50% Nhận biết - 30% Thông hiểu để củng cố nền tảng cho nhóm học sinh dưới 6.5.`;
  }

  if (m.includes('ma trận') || m.includes('đề') || m.includes('kiểm tra')) {
    return `### 🎯 Gợi ý ma trận đề kiểm tra định kỳ môn ${msg.includes('toán') ? 'Toán' : 'Vật lí'}:
- **Nhận biết (40% - 4.0 điểm):** Các định nghĩa, công thức cơ bản, đơn vị đo.
- **Thông hiểu (30% - 3.0 điểm):** Giải thích hiện tượng, so sánh hai đại lượng, tính toán 1 bước.
- **Vận dụng (20% - 2.0 điểm):** Bài toán liên hệ thực tế, ghép mạch hoặc biến đổi 2-3 công thức.
- **Vận dụng cao (10% - 1.0 điểm):** Bài toán cực trị hoặc phân tích đồ thị phức tạp.

💡 Cô có thể bấm nút **"AI Tạo đề theo Ma trận"** ngay trên giao diện để hệ thống tự động sinh 10 - 40 câu hỏi tương ứng kèm đáp án và lời giải chi tiết!`;
  }

  return `Chào Cô Phượng! Trợ lý AI giáo viên StudyFlow sẵn sàng hỗ trợ Cô:
- 📌 **Phân tích dữ liệu học sinh:** Đánh giá phổ điểm, nhận diện lỗ hổng kiến thức của từng lớp (12A2, 12A5, 10A1...).
- 📝 **Tạo đề theo Ma trận:** Tự động sinh trọn bộ câu hỏi trắc nghiệm theo 4 mức độ nhận thức của Bộ GD&ĐT.
- 📚 **Biên soạn học liệu:** Tạo nhanh đề cương ôn tập, tóm tắt lý thuyết và phiếu bài tập phân hóa.
- 💡 **Phương pháp giảng dạy:** Tư vấn kịch bản bài học tích cực và gợi ý câu hỏi phát vấn hấp dẫn.`;
}

function getFallbackQuestions(subject?: string, grade?: string | number, topic?: string, count = 5) {
  const s = subject || 'Vật lí';
  const t = topic || 'Dao động điều hòa';
  return [
    {
      id: 1,
      questionText: `Trong dao động điều hòa của chất điểm môn ${s} (${t}), đại lượng nào sau đây biến thiên cùng tần số với li độ?`,
      options: ['Vận tốc và gia tốc', 'Động năng và thế năng', 'Cơ năng của hệ', 'Biên độ dao động'],
      correctOption: 0,
      explanation: 'Trong dao động điều hòa, vận tốc và gia tốc cùng biến thiên điều hòa với cùng tần số góc ω và chu kỳ T giống như li độ.'
    },
    {
      id: 2,
      questionText: `Một vật nhỏ dao động điều hòa theo phương trình x = A cos(ωt + φ). Vận tốc cực đại của vật có độ lớn là:`,
      options: ['v_max = ωA', 'v_max = ω²A', 'v_max = 2ωA', 'v_max = ωA²'],
      correctOption: 0,
      explanation: 'Vận tốc cực đại của vật đạt được khi vật qua vị trí cân bằng theo chiều dương: v_max = ωA.'
    },
    {
      id: 3,
      questionText: `Khi một vật dao động điều hòa từ vị trí cân bằng ra vị trí biên thì:`,
      options: ['Thế năng tăng dần, động năng giảm dần', 'Cơ năng của vật tăng dần', 'Vận tốc của vật tăng dần', 'Gia tốc của vật bằng 0'],
      correctOption: 0,
      explanation: 'Khi đi từ vị trí cân bằng ra biên, li độ x tăng dần nên thế năng tăng, còn vận tốc giảm về 0 nên động năng giảm dần.'
    },
    {
      id: 4,
      questionText: `Chu kỳ dao động của con lắc lò xo gồm vật nặng m và lò xo nhẹ có độ cứng k là:`,
      options: ['T = 2π√(m/k)', 'T = 2π√(k/m)', 'T = 2π√(l/g)', 'T = 1/(2π)√(m/k)'],
      correctOption: 0,
      explanation: 'Công thức chu kỳ con lắc lò xo chuẩn là T = 2π√(m/k).'
    },
    {
      id: 5,
      questionText: `Đồ thị biểu diễn mối quan hệ giữa gia tốc a và li độ x của một chất điểm dao động điều hòa là:`,
      options: ['Một đoạn thẳng đi qua gốc tọa độ có hệ số góc âm', 'Một đường elip', 'Một đường cong hình sin', 'Một đường parabol'],
      correctOption: 0,
      explanation: 'Do a = -ω²x với -A ≤ x ≤ A, đồ thị a theo x là một đoạn thẳng đi qua gốc tọa độ có hệ số góc âm (-ω²).'
    }
  ].slice(0, count);
}

function getFallbackMaterial(subject?: string, grade?: string | number, topic?: string, type?: string) {
  return `# 📖 TÀI LIỆU HỌC TẬP CHUYÊN ĐỀ: ${(topic || 'DAO ĐỘNG ĐIỀU HÒA').toUpperCase()}
**Môn học:** ${subject || 'Vật lí'} | **Khối:** ${grade || 12}
**Phân loại:** ${type || 'Tóm tắt kiến thức cốt lõi & Sơ đồ tư duy'}
**Biên soạn:** Giáo viên bộ môn (StudyFlow Pro)

---

## I. MỤC TIÊU BÀI HỌC
1. Nắm vững phương trình li độ, vận tốc, gia tốc và mối quan hệ về pha.
2. Hiểu rõ sự chuyển hóa qua lại giữa động năng và thế năng trong một chu kỳ.
3. Vận dụng thành thạo mối liên hệ giữa dao động điều hòa và chuyển động tròn đều.

---

## II. HỆ THỐNG CÔNG THỨC TRỌNG TÂM
| Đại lượng | Ký hiệu & Công thức | Đơn vị | Chú ý sư phạm |
| :--- | :--- | :--- | :--- |
| **Li độ** | $x = A \\cos(\\omega t + \\varphi)$ | $cm, m$ | $-A \\le x \\le A$ |
| **Vận tốc** | $v = x' = -\\omega A \\sin(\\omega t + \\varphi)$ | $cm/s, m/s$ | $v$ sớm pha $\\pi/2$ so với $x$ |
| **Gia tốc** | $a = v' = -\\omega^2 x$ | $m/s^2$ | $a$ ngược pha so với $x$ |
| **Hệ thức độc lập** | $x^2 + \\frac{v^2}{\\omega^2} = A^2$ | - | Vuông pha giữa $x$ và $v$ |

---

## III. CÁC LỖI HỌC SINH THƯỜNG MẮC PHẢI
- ❌ **Lỗi 1:** Nhầm lẫn tần số của động năng/thế năng ($f' = 2f$) với tần số dao động điều hòa ($f$).
- ❌ **Lỗi 2:** Quên đổi đơn vị chiều dài lò xo về mét ($m$) khi tính chu kỳ con lắc đơn hoặc con lắc lò xo treo thẳng đứng.
- ❌ **Lỗi 3:** Nhầm dấu khi xác định pha ban đầu $\\varphi$ theo chiều chuyển động (theo chiều âm thì $\\varphi > 0$, theo chiều dương thì $\\varphi < 0$).

---

## IV. BÀI TẬP VẬN DỤNG MẪU
**Bài toán:** Một vật dao động điều hòa với biên độ $A = 6\\text{ cm}$, tần số $f = 2\\text{ Hz}$. Tính tốc độ của vật khi nó có li độ $x = 3\\text{ cm}$.
**Lời giải:**
1. Tần số góc: $\\omega = 2\\pi f = 4\\pi\\text{ rad/s}$.
2. Áp dụng hệ thức độc lập:
   $$v = \\omega \\sqrt{A^2 - x^2} = 4\\pi \\sqrt{6^2 - 3^2} = 4\\pi \\sqrt{27} \\approx 65.3\\text{ cm/s}$$.
`;
}

function getFallbackTamAnReply(query: string, moodLogs: any[] = []): string {
  const q = (query || '').trim().toLowerCase();
  
  // 1. AN TOÀN TÂM LÝ – ƯU TIÊN CAO NHẤT
  const dangerKeywords = ['tự tử', 'tự sát', 'không muốn sống', 'muốn chết', 'tự làm đau', 'cắt tay', 'rạch tay', 'làm hại bản thân', 'bị đánh', 'xâm hại', 'bạo lực', 'đe dọa'];
  if (dangerKeywords.some((k) => q.includes(k))) {
    return `Mình đang lắng nghe bạn đây. Mình cảm nhận được nỗi đau và sự mệt mỏi cùng cực mà bạn đang phải gánh chịu một mình lúc này. 

Cảm xúc đau đớn đến nghẹt thở hay muốn từ bỏ là điều có thể hiểu được khi bạn phải chịu đựng quá nhiều tổn thương vượt quá sức chịu đựng. Nhưng sự an toàn và tính mạng của bạn là điều quan trọng và quý giá nhất đối với mình lúc này. Bạn xứng đáng được bảo vệ và sống một cuộc đời bình yên.

Bây giờ bạn đang ở đâu? Bạn có đang an toàn ngay lúc này không?

Hãy làm theo hướng dẫn an toàn này ngay cùng mình:
- Hít thở thật chậm, không ở một mình trong phòng kín.
- Tìm đến cha mẹ, thầy cô hoặc người lớn đáng tin cậy cạnh bạn để chia sẻ ngay.
- Gọi ngay tới các đường dây hỗ trợ khẩn cấp (miễn phí 24/7):
  + 📞 **111**: Tổng đài Quốc gia Bảo vệ Trẻ em.
  + 🚑 **115**: Cấp cứu y tế | 👮 **113**: Công an bảo vệ an toàn.

Mình luôn ở đây lắng nghe bạn. Bạn hãy giữ an toàn cho bản thân trước tiên nhé!`;
  }

  const isNegative = /(buồn|mệt|chán|nản|áp lực|căng thẳng|stress|bế tắc|lo lắng|sợ|khóc|tủi thân|đuối|thất vọng|tự ti|quá tải|bất an|suy sụp|bỏ cuộc|khó khăn|rớt|trượt)/i.test(q);

  let moodReferenceText = '';
  let moodActionAdvice = '';
  if (isNegative && Array.isArray(moodLogs) && moodLogs.length > 0) {
    const latest = moodLogs[0];
    const label = latest.label || latest.mood || 'Căng thẳng';
    const emoji = latest.emoji || '💭';
    const noteText = latest.note ? ` ("${latest.note}")` : '';
    moodReferenceText = `\n\n*(Mình có thấy gần đây trong nhật ký tâm trạng, bạn đã ghi nhận trạng thái **[${emoji} ${label}]**${noteText}. Việc bạn chủ động quan sát và theo dõi cảm xúc của mình là một điểm tựa rất tích cực để tụi mình cùng tìm cách vượt qua.)*`;

    const lowerLabel = String(label).toLowerCase();
    const moodType = String(latest.mood || '').toLowerCase();
    if (moodType === 'stressed' || lowerLabel.includes('căng thẳng')) {
      moodActionAdvice = `\n- **Gợi ý riêng theo trạng thái Căng thẳng:** Vì nhật ký ghi nhận mức độ căng thẳng của bạn đang cao, hãy thực hiện thở xả tải trong 3 phút trước khi làm bất cứ việc gì tiếp theo.`;
    } else if (moodType === 'tired' || lowerLabel.includes('mệt mỏi')) {
      moodActionAdvice = `\n- **Gợi ý riêng theo trạng thái Mệt mỏi:** Cơ thể bạn đang cạn kiệt năng lượng. Đừng ép bản thân học khuya; hãy chợp mắt 15-20 phút.`;
    }
  }

  if (/^(chào|hi|hello|xin chào|tâm lí ơi|tâm lý ơi|tâm an|bạn ơi|ơi)/i.test(q) || q.length < 8) {
    return `Chào bạn! Mình là AI đồng hành tâm lý học đường, luôn ở đây để lắng nghe và thấu hiểu mọi điều bạn chia sẻ.

Hôm nay của bạn thế nào? Bạn đang cảm thấy thoải mái hay có điều gì bận lòng không?`;
  }

  if (q.includes('áp lực') || q.includes('điểm') || q.includes('kỳ thi') || q.includes('thi') || q.includes('mệt') || q.includes('nản') || q.includes('quá tải')) {
    return `Mình nghe được rằng dạo gần đây bạn đang phải chịu khá nhiều áp lực về bài vở và điểm số. Có lẽ mọi chuyện thật sự không hề dễ dàng.${moodReferenceText}

Hãy kiên nhẫn với chính mình, tụi mình sẽ cùng giải quyết từng việc nhỏ một nhé!${moodActionAdvice}`;
  }

  return `Mình đang lắng nghe bạn đây. Mình nhận thấy bạn đang có những băn khoăn và cảm xúc chưa thể giải tỏa hoàn toàn trong lòng.${moodReferenceText}

Điều gì đang làm bạn cảm thấy trăn trở hay khó khăn nhất ngay lúc này?${moodActionAdvice}`;
}

function getFallbackTutorReply(query: string): string {
  const q = query.toLowerCase().trim();

  // Test 1: Diện tích hình vuông hoặc công thức ngắn
  if (q.includes('diện tích hình vuông') || (q.includes('hình vuông') && q.includes('diện tích'))) {
    return `Diện tích hình vuông bằng cạnh nhân cạnh:

$$S = a \\times a = a^2$$

Vì hình vuông có 4 cạnh bằng nhau, nên nó giống hình chữ nhật có chiều dài = chiều rộng = $a$.

**Ví dụ:** Hình vuông cạnh 5 cm thì $S = 5^2 = \\mathbf{25\\ cm^2}$.

**Lưu ý hay sai:** Diện tích tính bằng đơn vị bình phương (cm², m²), đừng nhầm với chu vi $P = 4a$ (đơn vị cm, m).

Bạn muốn thử một bài tập nhỏ không? Ví dụ: một sân vuông có chu vi 36 m, diện tích là bao nhiêu?`;
  }

  // Hằng đẳng thức (hằng đẳng thức, hằng đẳng thức61, v.v.)
  if (q.includes('hằng đẳng thức') || q.includes('hang dang thuc')) {
    return `Dưới đây là 7 hằng đẳng thức đáng nhớ cốt lõi:

1. **Bình phương của một tổng:**
$$(a + b)^2 = a^2 + 2ab + b^2$$

2. **Bình phương của một hiệu:**
$$(a - b)^2 = a^2 - 2ab + b^2$$

3. **Hiệu hai bình phương:**
$$a^2 - b^2 = (a - b)(a + b)$$

4. **Lập phương của một tổng:**
$$(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$$

5. **Lập phương của một hiệu:**
$$(a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3$$

6. **Tổng hai lập phương:**
$$a^3 + b^3 = (a + b)(a^2 - ab + b^2)$$

7. **Hiệu hai lập phương:**
$$a^3 - b^3 = (a - b)(a^2 + ab + b^2)$$

**Ví dụ:** Khai triển $(x + 3)^2 = x^2 + 2 \\cdot x \\cdot 3 + 3^2 = \\mathbf{x^2 + 6x + 9}$.

**Lưu ý hay sai:** $(a + b)^2 \\neq a^2 + b^2$ (học sinh rất hay quên số hạng $2ab$).

Bạn muốn thử một bài tập nhỏ không? Ví dụ: khai triển $(2x - 1)^2$ bằng bao nhiêu?`;
  }

  // Test 2: Giải phương trình bậc 2 (x^2 - 5x + 6 = 0)
  if (q.includes('x^2 - 5x + 6') || q.includes('x^2-5x+6') || (q.includes('phương trình') && q.includes('5x') && q.includes('6'))) {
    return `Phương trình $x^2 - 5x + 6 = 0$ được giải bằng cách phân tích thành nhân tử:

**Bước 1: Phân tích thành tích**
Tìm hai số có tích bằng 6 và tổng bằng $-5$, đó là $-2$ và $-3$:
$$x^2 - 2x - 3x + 6 = 0 \\Leftrightarrow x(x - 2) - 3(x - 2) = 0 \\Leftrightarrow (x - 2)(x - 3) = 0$$

**Bước 2: Giải các phương trình bậc nhất**
$$\\left[\\begin{array}{l} x - 2 = 0 \\\\ x - 3 = 0 \\end{array}\\right. \\Leftrightarrow \\left[\\begin{array}{l} x = 2 \\\\ x = 3 \\end{array}\\right.$$

**Đáp số:** Phương trình có 2 nghiệm phân biệt là $\\mathbf{x = 2}$ và $\\mathbf{x = 3}$.

**Kiểm tra lại:**
- Với $x = 2$: $2^2 - 5(2) + 6 = 4 - 10 + 6 = 0$ (Đúng).
- Với $x = 3$: $3^2 - 5(3) + 6 = 9 - 15 + 6 = 0$ (Đúng).

**Lưu ý hay sai:** Biệt thức $\\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1 > 0$, chú ý mẫu số nghiệm là $2a = 2$.`;
  }

  // Test 3: Gợi ý thôi, đừng cho đáp án
  if (q.includes('gợi ý') || q.includes('đừng cho đáp án') || q.includes('dung cho dap an')) {
    return `Được nhé! Mình sẽ chỉ đưa ra gợi ý từng bước nhỏ để bạn tự làm:

- Bạn hãy quan sát kỹ biểu thức xem có thể phân tích thành nhân tử hay rút gọn đại lượng chung được không?
- Bạn đã viết nháp bước đầu tiên chưa? Hãy nhắn dòng nháp đầu tiên của bạn cho mình xem nhé!`;
  }

  // Test 4: Hôm nay buồn quá / mệt mỏi
  if (q.includes('buồn quá') || q.includes('mệt quá') || q.includes('áp lực') || q.includes('chán học') || q.includes('buon qua')) {
    return `Mình hiểu, đôi khi việc học hành và áp lực thi cử làm chúng ta thấy rất kiệt sức. Bạn hãy uống một ngụm nước ấm, hít sâu thở chậm vài nhịp và nghỉ ngơi 5-10 phút nhé. Khi nào sẵn sàng, mình sẽ cùng bạn giải quyết một bài tập nhỏ thật nhẹ nhàng!`;
  }

  // Test 5: Thi hộ / làm bài thi hộ
  if (q.includes('hộ mình') && (q.includes('đề thi') || q.includes('kiểm tra') || q.includes('bài thi'))) {
    return `Mình không thể làm bài hộ bạn trong giờ kiểm tra được vì điều đó vi phạm quy chế thi. Sau khi nộp bài xong hoặc với một bài toán tương tự, bạn cứ gửi sang đây, mình sẽ hướng dẫn cặn kẽ từng bước để bạn hiểu sâu nhé!`;
  }

  // Diện tích hình tròn / tam giác
  if (q.includes('diện tích hình tròn') || (q.includes('hình tròn') && q.includes('diện tích'))) {
    return `Diện tích hình tròn bán kính $r$ được tính theo công thức:

$$S = \\pi r^2$$

Trong đó $r$ là bán kính hình tròn, $\\pi \\approx 3{,}14$.

**Ví dụ:** Hình tròn có bán kính $r = 3\\text{ cm}$ thì $S = \\pi \\times 3^2 = 9\\pi \\approx \\mathbf{28{,}26\\ cm^2}$.

**Lưu ý hay sai:** Nếu đề bài cho đường kính $d$, phải lấy $r = \\frac{d}{2}$ trước khi tính, không được lấy $d^2$ trực tiếp.

Bạn muốn thử tính diện tích của một hình tròn có đường kính 10 cm không?`;
  }

  // Kế hoạch giải tỏa bài vở & quá tải
  if (q.includes('quá tải') || q.includes('kế hoạch') || q.includes('dồn bài') || q.includes('nhiều bài') || q.includes('nhiệm vụ')) {
    return `Mình hiểu cảm giác khi bài vở dồn lại có thể khiến bạn thấy ngột ngạt. Chúng ta hãy chia nhỏ và xử lý theo các chặng Pomodoro cụ thể:

1. **Chặng 1 (25 phút - Ưu tiên khẩn cấp):** Làm bài tập về nhà của ngày mai. Cất điện thoại xa tầm tay.
2. **Nghỉ giải lao (5 phút):** Uống nước, thư giãn mắt.
3. **Chặng 2 (25 phút - Môn quan trọng):** Xem lại lý thuyết và làm 3-5 bài tập của môn bạn lo lắng nhất.
4. **Chặng 3 (25 phút - Chuẩn bị bài):** Đọc trước tài liệu hoặc soạn bài cho tiết học kế tiếp.
5. **Chặng 4 (15 phút - Tổng kết):** Đánh dấu việc đã hoàn thành vào To-do list.

Bạn muốn mình cùng bạn lập thời gian biểu chi tiết cho môn học nào trước?`;
  }

  // 2. ÔN THI & KỸ NĂNG HỌC TẬP (Lộ trình, Pomodoro, phương pháp ôn tập)
  if (q.includes('ôn thi') || q.includes('lộ trình') || q.includes('30 ngày') || q.includes('kỳ thi') || q.includes('luyện đề') || q.includes('học kỳ') || q.includes('pomodoro') || q.includes('quản lý thời gian')) {
    return `Chiến lược ôn thi hiệu quả nhất là chia nhỏ theo chu kỳ ôn ngắt quãng (Spaced Repetition) và phương pháp Pomodoro:

1. **Phân bổ thời gian (Pomodoro):** Học tập trung 25 phút, nghỉ 5 phút. Sau 4 chu kỳ thì nghỉ dài 15-20 phút.
2. **Quy tắc 80/20:** Dành 70% thời gian làm bài tập và giải đề thực tế (Active Recall), chỉ 30% để đọc lại lý thuyết.
3. **Sổ tay lỗi sai (Error Log):** Mỗi khi giải sai một câu, ghi chú lại nguyên nhân (quên công thức hay nhầm dấu) để rà soát trước ngày thi.

**Ví dụ lộ trình 7 ngày nước rút:**
- **Ngày 1-3:** Tổng hợp sơ đồ tư duy các chuyên đề trọng tâm và công thức cốt lõi.
- **Ngày 4-5:** Giải 3-4 đề thi thử chuẩn cấu trúc, bấm đúng thời gian thực tế.
- **Ngày 6-7:** Đọc lại sổ tay lỗi sai, thư giãn tinh thần và ngủ đủ 8 tiếng.

Bạn muốn mình lên kế hoạch chi tiết cho môn học cụ thể nào?`;
  }



  // 3. TOÁN HỌC (Phương trình, Lượng giác, Đạo hàm, Tích phân, Hình học)
  if (q.includes('toán') || q.includes('phương trình') || q.includes('lượng giác') || q.includes('đạo hàm') || q.includes('tích phân') || q.includes('sin') || q.includes('cos') || q.includes('hình học') || q.includes('nghiệm')) {
    return `Để giải phương trình lượng giác cơ bản, ta đưa về dạng chuẩn hoặc biến đổi thành tích:

- **Công thức lượng giác cơ bản:** $\\sin(2x) = 2\\sin(x)\\cos(x)$ và $\\cos(2x) = 2\\cos^2(x) - 1$.
- **Nghiệm cơ bản:**
  $$\\sin x = \\sin \\alpha \\Leftrightarrow \\left[\\begin{array}{l} x = \\alpha + k2\\pi \\\\ x = \\pi - \\alpha + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$$
  $$\\cos x = \\cos \\alpha \\Leftrightarrow x = \\pm \\alpha + k2\\pi \\quad (k \\in \\mathbb{Z})$$

**Ví dụ:** Giải phương trình $2\\sin(x) - 1 = 0$:
$$2\\sin(x) - 1 = 0 \\Leftrightarrow \\sin(x) = \\frac{1}{2} = \\sin\\left(\\frac{\\pi}{6}\\right)$$
$$\\Leftrightarrow \\left[\\begin{array}{l} x = \\frac{\\pi}{6} + k2\\pi \\\\ x = \\frac{5\\pi}{6} + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$$

**Đáp số:** $\\mathbf{x \\in \\left\\{ \\frac{\\pi}{6} + k2\\pi; \\frac{5\\pi}{6} + k2\\pi \\right\\}}$ ($k \\in \\mathbb{Z}$).

**Lưu ý hay sai:** Khi giải phương trình hàm $\\sin$, đừng quên họ nghiệm thứ hai $\\pi - \\alpha + k2\\pi$ và điều kiện $k \\in \\mathbb{Z}$.

Bạn có bài toán cụ thể nào cần giải từng bước không?`;
  }

  // 4. VẬT LÝ (Dao động điều hòa, Sóng cơ, Cơ năng, Con lắc)
  if (q.includes('vật lý') || q.includes('vật lí') || q.includes('cơ năng') || q.includes('dao động') || q.includes('sóng') || q.includes('lực') || q.includes('vận tốc') || q.includes('gia tốc') || q.includes('chu kỳ')) {
    return `Phương trình dao động điều hòa có dạng chuẩn $x = A\\cos(\\omega t + \\varphi)$:

- **Vận tốc:** $v = -\\omega A \\sin(\\omega t + \\varphi)$, sớm pha $\\frac{\\pi}{2}$ so với li độ $x$.
- **Gia tốc:** $a = -\\omega^2 x$, ngược pha so với li độ $x$.
- **Hệ thức độc lập thời gian:**
  $$A^2 = x^2 + \\frac{v^2}{\\omega^2} = \\frac{a^2}{\\omega^4} + \\frac{v^2}{\\omega^2}$$
- **Cơ năng bảo toàn:** $W = \\frac{1}{2}kA^2 = \\frac{1}{2}m\\omega^2 A^2$.

**Ví dụ:** Một con lắc lò xo có $m = 0{,}2\\text{ kg}$, $k = 50\\text{ N/m}$, dao động với biên độ $A = 4\\text{ cm} = 0{,}04\\text{ m}$.
$$W = \\frac{1}{2} \\times 50 \\times (0{,}04)^2 = \\mathbf{0{,}04\\text{ J}}$$

**Lưu ý hay sai:** Luôn đổi đơn vị biên độ $A$ và li độ $x$ về mét (m) trước khi tính năng lượng.

Bạn muốn thử tính vận tốc cực đại $v_{\\max} = \\omega A$ của con lắc này không?`;
  }

  // 5. HÓA HỌC (Phương trình phản ứng, Oxi hóa khử, Nồng độ mol)
  if (q.includes('hóa học') || q.includes('hóa') || q.includes('oxi hóa') || q.includes('khử') || q.includes('mol') || q.includes('nồng độ') || q.includes('axit') || q.includes('kim loại')) {
    return `Nguyên tắc giải bài toán Hóa học là tính số mol và áp dụng định luật bảo toàn:

- **Số mol:** $n = \\frac{m}{M} = \\frac{V}{24{,}79}$ (ở điều kiện chuẩn GDPT 2018: $25^\\circ\\text{C}, 1\\text{ bar}$).
- **Nồng độ mol:** $C_M = \\frac{n}{V_{\\text{dd}}}$ (mol/lít hoặc M).
- **Định luật bảo toàn electron:** $\\sum n_{\\text{e nhường}} = \\sum n_{\\text{e nhận}}$.

**Ví dụ:** Cho $2{,}4\\text{ g}$ Magie ($\\text{Mg}$) phản ứng với $\\text{HCl}$ dư:
$$\\text{Mg} + 2\\text{HCl} \\rightarrow \\text{MgCl}_2 + \\text{H}_2\\uparrow$$
Số mol $\\text{Mg}$: $n_{\\text{Mg}} = \\frac{2{,}4}{24} = 0{,}1\\text{ mol}$.
Thể tích khí $\\text{H}_2$ thu được ở điều kiện chuẩn: $V = 0{,}1 \\times 24{,}79 = \\mathbf{2{,}479\\text{ lít}}$.

**Lưu ý hay sai:** Nhớ dùng $24{,}79\\text{ L/mol}$ theo chương trình mới GDPT 2018 thay vì $22{,}4\\text{ L/mol}$ cũ.

Bạn có bài tập Hóa học cụ thể nào cần hướng dẫn không?`;
  }

  // 6. TIẾNG ANH (Ngữ pháp, Các thì, Câu điều kiện)
  if (q.includes('tiếng anh') || q.includes('english') || q.includes('ngữ pháp') || q.includes('grammar') || q.includes('thì') || q.includes('từ vựng') || q.includes('ielts') || q.includes('toeic')) {
    return `Quy tắc phân biệt thì Hiện tại hoàn thành và Quá khứ đơn:

- **Hiện tại hoàn thành (Present Perfect):** $\\text{S} + \\text{have/has} + \\text{V}_{3/\\text{ed}}$
  - Diễn tả hành động xảy ra trong quá khứ nhưng kết quả vẫn liên quan đến hiện tại (*since, for, already, yet, just, recently*).
- **Quá khứ đơn (Past Simple):** $\\text{S} + \\text{V}_{2/\\text{ed}}$
  - Diễn tả hành động đã chấm dứt hoàn toàn tại một thời điểm xác định trong quá khứ (*yesterday, 2 days ago, in 2020*).

**Ví dụ:**
- *I lost my key yesterday.* $\\rightarrow$ Hôm qua làm mất chìa khóa (thời điểm cụ thể *yesterday*).
- *I have lost my key!* $\\rightarrow$ Tôi vừa làm mất chìa khóa, hiện giờ không vào nhà được.

**Lưu ý hay sai:** Không dùng thì Hiện tại hoàn thành với mốc thời gian quá khứ xác định (*yesterday, last night*).

Bạn có câu bài tập tiếng Anh nào cần đối chiếu đáp án không?`;
  }

  // 7. NGỮ VĂN & TIN HỌC
  if (q.includes('ngữ văn') || q.includes('văn') || q.includes('nghị luận') || q.includes('dàn ý') || q.includes('đọc hiểu') || q.includes('tác phẩm') || q.includes('phân tích')) {
    return `Dàn ý bài văn nghị luận xã hội chuẩn 3 phần:

1. **Mở bài (0.5 điểm):** Dẫn dắt vấn đề và nêu trực tiếp tư tưởng hoặc hiện tượng cần bàn luận.
2. **Thân bài (1.5 - 2.0 điểm):**
   - **Giải thích:** Cắt nghĩa từ khóa, nêu bản chất của vấn đề.
   - **Phân tích & Chứng minh:** Vì sao vấn đề lại quan trọng? Nêu dẫn chứng thực tế giàu tính thuyết phục.
   - **Mở rộng (Phản đề):** Phê phán lối sống tiêu cực, đi ngược lại các giá trị tốt đẹp.
   - **Bài học nhận thức và hành động:** Rút ra bài học thiết thực cho bản thân trong học tập và rèn luyện.
3. **Kết bài (0.5 điểm):** Khẳng định lại ý nghĩa thông điệp và lời nhắn gửi.

Bạn đang viết về đề tài hay tác phẩm nào? Hãy chia sẻ để mình cùng bạn lập dàn ý nhé!`;
  }

  if (q.includes('tin học') || q.includes('lập trình') || q.includes('python') || q.includes('c++') || q.includes('code') || q.includes('thuật toán') || q.includes('binary search')) {
    return 'Thuật toán Tìm kiếm nhị phân (Binary Search) trên mảng đã sắp xếp:\n\n' +
      '- **Ý tưởng:** So sánh phần tử cần tìm $X$ với phần tử ở chính giữa $A[\\text{mid}]$.\n' +
      '- **Độ phức tạp:** Thời gian $O(\\log N)$, không gian $O(1)$.\n\n' +
      '```python\n' +
      'def binary_search(arr, target):\n' +
      '    left, right = 0, len(arr) - 1\n' +
      '    while left <= right:\n' +
      '        mid = left + (right - left) // 2\n' +
      '        if arr[mid] == target:\n' +
      '            return mid\n' +
      '        elif arr[mid] < target:\n' +
      '            left = mid + 1\n' +
      '        else:\n' +
      '            right = mid - 1\n' +
      '    return -1\n' +
      '```\n\n' +
      '**Lưu ý hay sai:** Mảng bắt buộc phải được sắp xếp trước khi chạy tìm kiếm nhị phân! Dùng `left + (right - left) // 2` để tránh tràn số nguyên.\n\n' +
      'Bạn muốn mình giải thích thêm phần nào trong thuật toán này không?';
  }

  // Phản hồi trực tiếp theo phương pháp sư phạm GDPT 2018
  return `Chào bạn! Để giải đáp chính xác nhất cho câu hỏi "${query}", bạn có thể gửi kèm đề bài cụ thể, biểu thức toán học hoặc yêu cầu cần làm rõ.

Mình sẽ giải thích bản chất lý thuyết, đưa ra công thức $LaTeX$, trình bày bài giải từng bước kèm ví dụ và mẹo tránh lỗi sai cho bạn ngay!`;
}

function getFallbackChatGptReply(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('toán') || q.includes('phương trình') || q.includes('tích phân') || q.includes('đạo hàm')) {
    return `### 📐 Hướng dẫn giải bài tập Toán học

Chào bạn! Dưới đây là phương pháp giải và ví dụ mẫu chuẩn phương pháp sư phạm:

1. **Phương pháp nhận dạng bài toán:**
   - Xác định tập xác định $D$ của bài toán.
   - Sử dụng các hằng đẳng thức hoặc công thức đạo hàm cơ bản: $(u \\cdot v)' = u'v + uv'$ và $(x^n)' = n \\cdot x^{n-1}$.
   - Biến đổi tương đương đưa về dạng tích hoặc phương trình bậc 2 quen thuộc.

2. **Các bước thực hiện:**
   - **Bước 1:** Đặt điều kiện có nghĩa.
   - **Bước 2:** Đưa về cùng cơ số hoặc đặt ẩn phụ thích hợp $t = f(x)$.
   - **Bước 3:** Giải tìm nghiệm và đối chiếu điều kiện để kết luận.

*Nếu bạn có một đề bài cụ thể, hãy dán nguyên văn đề bài vào khung chat để tôi giải chi tiết từng bước cho bạn nhé!*`;
  }

  if (q.includes('văn') || q.includes('nghị luận') || q.includes('dàn ý')) {
    return `### 📝 Dàn ý Nghị luận Văn học & Xã hội chuẩn cấu trúc

Chào bạn! Dưới đây là dàn ý khung 3 phần đạt chuẩn điểm cao:

1. **Mở bài:**
   - Dẫn dắt vấn đề (trích dẫn danh ngôn hoặc hiện tượng đời sống).
   - Nêu trực tiếp luận đề / tác phẩm và tác giả.

2. **Thân bài:**
   - **Giải thích:** Khái niệm cốt lõi của đề tài.
   - **Phân tích & Chứng minh:** Nêu ít nhất 2 luận điểm kèm dẫn chứng tiêu biểu (thực tế hoặc văn học).
   - **Bình luận & Mở rộng:** Lật ngược vấn đề (phê phán hiện tượng tiêu cực tương phản).
   - **Bài học nhận thức & hành động:** Liên hệ bản thân học sinh.

3. **Kết bài:**
   - Khẳng định lại ý nghĩa thông điệp và lời nhắn gửi tương lai.`;
  }

  if (q.includes('vật lí') || q.includes('lý') || q.includes('dao động') || q.includes('sóng')) {
    return `### ⚡ Tổng hợp kiến thức trọng tâm Vật lí 12

1. **Dao động điều hòa:**
   - Phương trình li độ: $x = A \\cos(\\omega t + \\varphi)$
   - Vận tốc: $v = -\\omega A \\sin(\\omega t + \\varphi)$, sớm pha $\\pi/2$ so với $x$.
   - Gia tốc: $a = -\\omega^2 x$, ngược pha với $x$.
   - Hệ thức độc lập: $A^2 = x^2 + \\frac{v^2}{\\omega^2}$.

2. **Con lắc lò xo:**
   - Tần số góc: $\\omega = \\sqrt{\\frac{k}{m}}$, chu kỳ $T = 2\\pi \\sqrt{\\frac{m}{k}}$.
   - Cơ năng bảo toàn: $W = \\frac{1}{2} k A^2 = \\text{hằng số}$.`;
  }

  if (q.includes('tiếng anh') || q.includes('english') || q.includes('grammar') || q.includes('ielts')) {
    return `### 🇬🇧 Hướng dẫn Ngữ pháp Tiếng Anh: Present Perfect (Hiện tại hoàn thành)

1. **Cấu trúc:**
   - Khẳng định: $\\text{S} + \\text{have/has} + \\text{V}_{\\text{ed/3}}$
   - Phủ định: $\\text{S} + \\text{haven't/hasn't} + \\text{V}_{\\text{ed/3}}$
   - Nghi vấn: $\\text{Have/Has} + \\text{S} + \\text{V}_{\\text{ed/3}}?$

2. **Dấu hiệu nhận biết:**
   - *Since* (mốc thời gian), *For* (khoảng thời gian), *Already, Yet, Just, Ever, Never, Recently*.

3. **Ví dụ thực tế:**
   - *I have studied on StudyFlow for 3 months.* (Tôi đã học trên StudyFlow được 3 tháng).`;
  }

  return `### 💡 Trợ lý AI ChatGPT sẵn sàng hỗ trợ bạn!

Tôi đã nhận được câu hỏi: **"${query}"**. 

Tôi có thể hỗ trợ bạn mọi lĩnh vực học tập:
- 📚 Giải chi tiết đề thi trắc nghiệm & tự luận.
- 💡 Giải thích bản chất lý thuyết, công thức nhớ nhanh.
- ✍️ Viết đoạn văn, sửa lỗi ngữ pháp, dịch thuật.
- 💻 Hướng dẫn lập trình và sửa lỗi code.

Hãy gửi cụ thể đề bài hoặc câu hỏi chi tiết, tôi sẽ giải thích từng bước cho bạn ngay!`;
}

// Fallback Study Schedule Generator
function generateSmartStudyScheduleFallback(data: any): string {
  const {
    tasks = [],
    events = [],
    studentProfile = {},
    gpaGoal = 8.8,
    currentAvg = 8.58,
    subjects = []
  } = data;

  const name = studentProfile?.name || 'Học sinh';
  const className = studentProfile?.className || '12';
  const numCurrentAvg = typeof currentAvg === 'number' ? currentAvg : parseFloat(currentAvg) || 8.58;
  const numGpaGoal = typeof gpaGoal === 'number' ? gpaGoal : parseFloat(gpaGoal) || 8.8;
  const gapGpa = (numGpaGoal - numCurrentAvg).toFixed(2);

  // Subject analysis
  const subjectList: Array<{ name: string; score: number; target: number; gap: number }> = (subjects && subjects.length > 0 ? subjects : [
    { name: 'Toán học', score: 8.5, target: 9.0 },
    { name: 'Vật lý', score: 8.2, target: 8.8 },
    { name: 'Hóa học', score: 7.8, target: 8.5 },
    { name: 'Ngữ văn', score: 8.0, target: 8.5 },
    { name: 'Tiếng Anh', score: 9.2, target: 9.5 },
    { name: 'Sinh học', score: 8.8, target: 9.0 }
  ]).map((s: any) => ({
    name: s.name,
    score: s.score,
    target: s.target,
    gap: Number((s.target - s.score).toFixed(2))
  }));

  const subjectsToImprove = [...subjectList].sort((a, b) => b.gap - a.gap);
  const topFocus = subjectsToImprove.filter(s => s.gap > 0).slice(0, 3);
  const strongSubjects = subjectsToImprove.filter(s => s.score >= 8.8 || s.gap <= 0);

  const openTasks = (tasks || []).filter((t: any) => !t.done);
  const completedTasks = (tasks || []).filter((t: any) => t.done);
  const topUrgentTasks = openTasks.slice(0, 4);

  return `### 📊 BÁO CÁO PHÂN TÍCH HỌC TẬP & THỜI GIAN BIỂU TỐI ƯU (STUDYFLOW AI)
**Học sinh:** ${name} | **Lớp:** ${className} | **Mục tiêu GPA:** ${numGpaGoal}/10 (Hiện tại: ${numCurrentAvg.toFixed(2)}/10)

---

### 1. 🎯 ĐÁNH GIÁ TỔNG QUAN HIỆN TRẠNG & ĐIỂM SỐ
- **Đánh giá GPA:** Điểm trung bình hiện tại của bạn là **${numCurrentAvg.toFixed(2)}/10**, khoảng cách đến mục tiêu là **${Number(gapGpa) > 0 ? `+${gapGpa} điểm` : 'Đã đạt chuẩn mục tiêu!'}**.
${topFocus.length > 0 ? `- **Môn học trọng tâm cần bứt phá điểm:** ${topFocus.map(s => `**${s.name}** (Hiện tại: ${s.score} ➔ Mục tiêu: ${s.target}, cần tăng ${s.gap > 0 ? '+' : ''}${s.gap} điểm)`).join(', ')}.` : '- Tất cả các môn đều đang bám rất sát chỉ tiêu.'}
${strongSubjects.length > 0 ? `- **Môn thế mạnh phát huy:** ${strongSubjects.map(s => `${s.name} (${s.score} điểm)`).join(', ')}.` : ''}
- **Khối lượng bài tập & nhiệm vụ:** Hiện đang có **${openTasks.length} bài tập chưa hoàn thành** (đã giải quyết ${completedTasks.length} bài).
${topUrgentTasks.length > 0 ? `  * *Nhiệm vụ ưu tiên giải quyết ngay:* ${topUrgentTasks.map((t: any) => `"${t.t}" (môn ${t.sub}, hạn: ${t.due})`).join('; ')}.` : '  * Hiện không có bài tập tồn đọng gấp.'}

---

### 2. 🗓️ THỜI GIAN BIỂU TỰ HỌC TỐI ƯU CẢ TUẦN (LỊCH HỌC HỢP LÝ CHI TIẾT TỪNG NGÀY)
*Kế hoạch được tối ưu hóa theo nhịp sinh học: môn tư duy tính toán xếp vào khung giờ não tỉnh táo nhất, đan xen môn xã hội, áp dụng kỹ thuật Pomodoro (25 phút học / 5 phút nghỉ) và kết thúc trước 22h45.*

#### 🔹 Thứ Hai: Khởi động tuần mới & Ôn tập môn trọng tâm
- **Sáng (07:00 - 11:30):** Học chính khóa trên lớp. Rà soát nhanh các bài tập trước giờ vào lớp.
- **Chiều (14:30 - 16:30):** Xử lý các bài tập về nhà khẩn cấp môn **${topFocus[0]?.name || 'Toán học'}**.
- **Tối (19:30 - 22:30):**
  * *19:30 - 20:45 (Block 1 - Pomodoro x 2):* Ôn tập chuyên đề môn **${topFocus[0]?.name || 'Toán học'}** (giải dạng bài tính toán nâng cao).
  * *20:45 - 21:00:* Giải lao ngắn, uống nước ấm, thư giãn mắt.
  * *21:00 - 22:15 (Block 2 - Pomodoro x 2):* Làm bài tập môn **${topFocus[1]?.name || 'Vật lý'}** hoặc luyện từ vựng Tiếng Anh.
  * *22:15 - 22:45:* Chuẩn bị sách vở ngày mai, thư giãn nhịp thở 4-7-8, đi ngủ trước 23:00.

#### 🔹 Thứ Ba: Rèn luyện kỹ năng & Giải bài tập vận dụng
- **Sáng (07:00 - 11:30):** Học chính khóa trên lớp theo thời khóa biểu.
- **Chiều (15:00 - 17:00):** Tự học tại thư viện hoặc phòng học: giải quyết bài tập môn **Ngữ văn** và các môn đọc hiểu.
- **Tối (19:30 - 22:30):**
  * *19:30 - 20:45:* Trọng tâm môn **${topFocus[1]?.name || 'Hóa học'}** (củng cố lý thuyết và giải 15 bài trắc nghiệm).
  * *21:00 - 22:15:* Luyện kỹ năng đọc hiểu Tiếng Anh hoặc lật Flashcards 20 thẻ ghi nhớ.
  * *22:15 - 22:45:* Thả lỏng não bộ, ghi chú việc cần làm ngày Thứ Tư.

#### 🔹 Thứ Tư: Đan xen môn tự nhiên & Xã hội
- **Sáng (07:00 - 11:30):** Học tập trung trên trường.
- **Chiều (14:30 - 16:30):** Hoàn thành bài tập nộp trên hệ thống StudyFlow.
- **Tối (19:30 - 22:30):**
  * *19:30 - 20:45:* Ôn tập môn **${topFocus[0]?.name || 'Toán học'}** - chuyên đề phương pháp giải nhanh.
  * *21:00 - 22:15:* Đọc văn bản Ngữ văn / Lịch sử, vẽ sơ đồ tư duy (Mindmap).
  * *22:15 - 22:45:* Nghe nhạc Baroque hoặc âm thanh trắng (White Noise), thư giãn toàn thân.

#### 🔹 Thứ Năm: Tăng tốc giải đề & Khắc phục điểm yếu
- **Sáng (07:00 - 11:30):** Học chính khóa trên lớp.
- **Chiều (15:00 - 17:00):** Tự học tự do, làm bài tập thực hành theo nhóm.
- **Tối (19:30 - 22:30):**
  * *19:30 - 20:45:* Tập trung môn có khoảng cách điểm lớn: **${topFocus[2]?.name || 'Sinh học'}**.
  * *21:00 - 22:15:* Rà soát toàn bộ các bài tập sắp đến hạn trong tuần.
  * *22:15 - 22:45:* Chuẩn bị đồng phục và cặp sách cho Thứ Sáu.

#### 🔹 Thứ Sáu: Tổng kết kiến thức trong tuần
- **Sáng (07:00 - 11:30):** Học chính khóa trên lớp.
- **Chiều (15:00 - 17:00):** Xử lý dứt điểm mọi bài tập còn tồn đọng trong tuần.
- **Tối (19:30 - 22:00):**
  * *19:30 - 21:00:* Ôn tập nhẹ nhàng các công thức bằng Flashcards trên StudyFlow.
  * *21:00 - 22:30:* Thư giãn cuối tuần sớm, xem phim hoặc đọc sách bổ trợ.

#### 🔹 Thứ Bảy: Luyện đề kiểm tra thử & Đánh giá năng lực
- **Sáng (08:00 - 10:30):** Làm bài thi thử trắc nghiệm 45 phút trên StudyFlow (Phần Bài thi & Đề trắc nghiệm).
- **Chiều (14:30 - 16:30):** Sửa chi tiết các câu làm sai trong bài thi thử, ghi vào "Sổ tay lỗi sai".
- **Tối (19:30 - 21:30):** Xem trước tài liệu tuần tới hoặc sinh hoạt ngoại khóa cùng gia đình / bạn bè.

#### 🔹 Chủ Nhật: Chuẩn bị chiến lược tuần mới & Tái tạo năng lượng
- **Sáng (08:30 - 11:00):** Lập kế hoạch các mục tiêu tuần mới trên StudyFlow.
- **Chiều:** Vận động thể thao (chạy bộ, bơi lội, cầu lông) giúp kích thích tuần hoàn máu và tái tạo dopamine não bộ.
- **Tối (20:00 - 21:30):** Chuẩn bị bài học cho Thứ Hai, đi ngủ sớm lúc 22:30 để có tinh thần sảng khoái nhất.

---

### 3. 🎯 CHIẾN LƯỢC KÉO ĐIỂM SỐ NÂNG GPA
- **Môn ${topFocus[0]?.name || 'Toán học'}:** Đạt tối thiểu **8.8 - 9.0** ở bài kiểm tra 1 tiết sắp tới bằng cách làm chắc chắn toàn bộ phần Nhận biết & Thông hiểu (không được phép để mất điểm ở các câu hỏi cơ bản).
- **Môn ${topFocus[1]?.name || 'Vật lý'}:** Tận dụng tính năng **Luyện đề AI** trên StudyFlow với ma trận 40% Nhận biết - 30% Thông hiểu - 20% Vận dụng để quen phản xạ làm bài trắc nghiệm dưới áp lực thời gian.
- **Môn ${topFocus[2]?.name || 'Hóa học'}:** Lập sơ đồ tư duy hệ thống hóa các chuỗi phản ứng và giải ít nhất 15 câu trắc nghiệm mỗi tối.

---

### 4. ⚡ 3 NGUYÊN TẮC VÀNG DUY TRÌ HIỆU SUẤT CAO
1. **Quy tắc 25/5 Pomodoro:** Để điện thoại xa tầm tay khi học bài. Mỗi chu kỳ 25 phút tập trung cao độ, 5 phút nghỉ ngơi vươn vai.
2. **Kỹ thuật lặp lại ngắt quãng (Spaced Repetition):** Kiến thức mới học cần được xem lại sau 24h, 3 ngày và 7 ngày để ghi nhớ lâu dài vào tiềm thức.
3. **Thở 4-7-8 trước khi đi ngủ:** Hít vào bằng mũi 4 giây, giữ hơi thở 7 giây, thở ra bằng miệng 8 giây (lặp lại 4 lần) giúp giảm căng thẳng và ngủ sâu giấc.`;
}

// Fallback Goal Roadmap Generator
function buildSmartGoalMapFallback(goalTitle: string, subject?: string) {
  const title = goalTitle || 'Hoàn thành chương trình ôn thi THPT';
  const sub = subject || 'Tổng hợp';
  const tLower = title.toLowerCase();

  let milestones = [
    {
      id: 'm1',
      title: 'Mốc 1: Khởi đầu & Củng cố nền tảng',
      description: 'Tổng hợp toàn bộ công thức và kiến thức trọng tâm',
      status: 'completed',
      rewardBadge: '🌱 Khởi đầu',
      rewardPoints: 100
    },
    {
      id: 'm2',
      title: 'Mốc 2: Nắm chắc phương pháp & Dạng bài cơ bản',
      description: 'Giải thành thạo bài tập nhận biết và thông hiểu',
      status: 'in_progress',
      rewardBadge: '⭐ Nắm chắc',
      rewardPoints: 150
    },
    {
      id: 'm3',
      title: 'Mốc 3: Luyện kỹ năng thực chiến & Xử lý bẫy đề',
      description: 'Khắc phục các lỗi sai thường gặp khi làm bài dưới áp lực thời gian',
      status: 'locked',
      rewardBadge: '🛡️ Thực chiến',
      rewardPoints: 200
    },
    {
      id: 'm4',
      title: 'Mốc 4: Tăng tốc giải đề nâng cao 8.5+',
      description: 'Chinh phục các câu hỏi vận dụng cao và tối ưu tốc độ',
      status: 'locked',
      rewardBadge: '🔥 Bứt phá',
      rewardPoints: 250
    },
    {
      id: 'm5',
      title: 'Mốc 5: Chinh phục đỉnh cao & Nhận Huy hiệu Quán quân',
      description: 'Đạt điểm số mục tiêu trong bài khảo sát toàn diện',
      status: 'locked',
      rewardBadge: '👑 Quán quân',
      rewardPoints: 300
    }
  ];

  if (tLower.includes('toán')) {
    milestones = [
      { id: 'm1', title: 'Mốc 1: Hệ thống hóa công thức & Đạo hàm', description: 'Nắm chắc bảng đạo hàm, tính đơn điệu và cực trị hàm số', status: 'completed', rewardBadge: '📐 Nền tảng Toán', rewardPoints: 100 },
      { id: 'm2', title: 'Mốc 2: Khảo sát hàm số & Tương giao đồ thị', description: 'Làm chủ các dạng toán tiệm cận, bảng biến thiên và tương giao đồ thị', status: 'in_progress', rewardBadge: '📈 Đồ thị bậc thầy', rewardPoints: 150 },
      { id: 'm3', title: 'Mốc 3: Lũy thừa, Mũ & Logarit', description: 'Giải nhanh phương trình, bất phương trình mũ và logarit', status: 'locked', rewardBadge: '🔢 Bậc thầy Mũ - Loga', rewardPoints: 200 },
      { id: 'm4', title: 'Mốc 4: Hình học không gian & Tọa độ Oxyz', description: 'Thành thạo tính góc, khoảng cách và phương trình mặt phẳng', status: 'locked', rewardBadge: '📐 Không gian Oxyz', rewardPoints: 250 },
      { id: 'm5', title: 'Mốc 5: Luyện 10 đề thi tổng hợp đạt 9.0+', description: 'Chinh phục trọn vẹn các câu hỏi phân loại vận dụng cao', status: 'locked', rewardBadge: '👑 Quán quân Toán học', rewardPoints: 300 }
    ];
  } else if (tLower.includes('lí') || tLower.includes('lý')) {
    milestones = [
      { id: 'm1', title: 'Mốc 1: Dao động điều hòa & Vòng tròn lượng giác', description: 'Thuộc làu hệ thức độc lập và phương pháp quét trục thời gian', status: 'completed', rewardBadge: '⚡ Sóng & Dao động', rewardPoints: 100 },
      { id: 'm2', title: 'Mốc 2: Con lắc lò xo & Con lắc đơn', description: 'Tính toán thành thạo năng lượng, chu kỳ và lực đàn hồi', status: 'in_progress', rewardBadge: '🎯 Con lắc chuẩn xác', rewardPoints: 150 },
      { id: 'm3', title: 'Mốc 3: Sóng cơ & Giao thoa sóng', description: 'Xác định số điểm cực đại, cực tiểu và phương trình truyền sóng', status: 'locked', rewardBadge: '🌊 Chuyên gia Sóng', rewardPoints: 200 },
      { id: 'm4', title: 'Mốc 4: Dòng điện xoay chiều RLC', description: 'Vận dụng giản đồ vecto và hiện tượng cộng hưởng điện', status: 'locked', rewardBadge: '💡 Mạch điện RLC', rewardPoints: 250 },
      { id: 'm5', title: 'Mốc 5: Tổng ôn thi thử đạt 8.8+', description: 'Làm trọn vẹn bộ đề thi chuẩn ma trận Bộ GD&ĐT', status: 'locked', rewardBadge: '👑 Bậc thầy Vật lí', rewardPoints: 300 }
    ];
  } else if (tLower.includes('hóa')) {
    milestones = [
      { id: 'm1', title: 'Mốc 1: Este - Lipit & Hóa hữu cơ', description: 'Nắm chắc phản ứng thủy phân este và đồng phân cấu tạo', status: 'completed', rewardBadge: '🧪 Este - Lipit', rewardPoints: 100 },
      { id: 'm2', title: 'Mốc 2: Cacbohidrat & Amin, Amino axit', description: 'Phân biệt Glucozo, Saccarozo và tính chất lưỡng tính amino axit', status: 'in_progress', rewardBadge: '🧬 Hợp chất hữu cơ', rewardPoints: 150 },
      { id: 'm3', title: 'Mốc 3: Đại cương kim loại & Dãy điện hóa', description: 'Áp dụng định luật bảo toàn e và quy tắc alpha', status: 'locked', rewardBadge: '⚙️ Kim loại thực chiến', rewardPoints: 200 },
      { id: 'm4', title: 'Mốc 4: Bài toán đồ thị & Bảo toàn khối lượng', description: 'Giải nhanh bài toán $CO_2$ tác dụng kiềm và nhôm hidroxit', status: 'locked', rewardBadge: '📊 Đồ thị Hóa học', rewardPoints: 250 },
      { id: 'm5', title: 'Mốc 5: Chinh phục điểm 9+ Hóa học', description: 'Hoàn thành 10 đề thi thử đạt tối thiểu 9.0 điểm', status: 'locked', rewardBadge: '👑 Bậc thầy Hóa học', rewardPoints: 300 }
    ];
  } else if (tLower.includes('anh') || tLower.includes('ielts') || tLower.includes('english')) {
    milestones = [
      { id: 'm1', title: 'Mốc 1: 1000 Từ vựng trọng tâm B2-C1', description: 'Thuộc và vận dụng 1000 từ vựng học thuật theo chủ đề', status: 'completed', rewardBadge: '🔤 Thần từ vựng', rewardPoints: 100 },
      { id: 'm2', title: 'Mốc 2: Ngữ pháp nâng cao & Mệnh đề quan hệ', description: 'Làm chủ đảo ngữ, câu điều kiện hỗn hợp và thể giả định', status: 'in_progress', rewardBadge: '✍️ Bậc thầy Ngữ pháp', rewardPoints: 150 },
      { id: 'm3', title: 'Mốc 3: Kỹ năng đọc hiểu & Skimming/Scanning', description: 'Giải quyết các bài đọc dài không bị mất thời gian', status: 'locked', rewardBadge: '📖 Chiến thần Đọc hiểu', rewardPoints: 200 },
      { id: 'm4', title: 'Mốc 4: Luyện đề chuẩn Format THPTQG / IELTS', description: 'Giải 15 đề thi thử đạt tốc độ dưới 50 phút', status: 'locked', rewardBadge: '🎯 Xạ thủ 9+ Anh', rewardPoints: 250 },
      { id: 'm5', title: 'Mốc 5: Chinh phục Band điểm 8.0+ / 9.5+', description: 'Về đích xuất sắc và nhận danh hiệu Ngôn ngữ tinh anh', status: 'locked', rewardBadge: '👑 Quán quân Tiếng Anh', rewardPoints: 300 }
    ];
  }

  return {
    id: 'goal_' + Date.now(),
    title,
    subject: sub,
    createdAt: new Date().toISOString(),
    milestones
  };
}

// Dev & Production serving
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store room information in memory (Source of Truth)
  const rooms: Record<string, { users: Array<{ id: string; name: string; avatar?: string; role: string }> }> = {};

  io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);
      
      if (!rooms[roomId]) {
        rooms[roomId] = { users: [] };
      }
      
      // Prevent duplicate joins from same socket
      const existing = rooms[roomId].users.find(u => u.id === user.id);
      if (!existing) {
        rooms[roomId].users.push({ ...user, socketId: socket.id });
      } else {
        // Update socket ID if user reconnected
        rooms[roomId].users = rooms[roomId].users.map(u => u.id === user.id ? { ...u, socketId: socket.id } : u);
      }

      console.log(`User ${user.name} joined room ${roomId}`);
      
      // Notify others in room
      io.to(roomId).emit('user-joined', { 
        user, 
        users: rooms[roomId].users 
      });

      // Send initial users list to the one who joined
      socket.emit('room-users', rooms[roomId].users);
    });

    socket.on('send-message', ({ roomId, message }) => {
      io.to(roomId).emit('new-message', message);
    });

    // WebRTC Signaling bridge (for PeerJS or manual WebRTC)
    socket.on('signal', ({ roomId, signal, to, from }) => {
      if (to) {
        // Direct signal to specific user
        const targetUser = rooms[roomId]?.users.find(u => (u as any).socketId === to);
        if (targetUser) {
          io.to(to).emit('signal', { signal, from });
        }
      } else {
        // Broadcast signal to everyone else in room
        socket.to(roomId).emit('signal', { signal, from });
      }
    });

    socket.on('leave-room', ({ roomId, userId }) => {
      socket.leave(roomId);
      if (rooms[roomId]) {
        rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== userId);
        io.to(roomId).emit('user-left', userId);
        
        // Clean up empty rooms
        if (rooms[roomId].users.length === 0) {
          delete rooms[roomId];
        }
      }
    });

    socket.on('disconnect', () => {
      // Find which rooms this socket was in and clean up
      Object.keys(rooms).forEach(roomId => {
        const user = rooms[roomId].users.find(u => (u as any).socketId === socket.id);
        if (user) {
          rooms[roomId].users = rooms[roomId].users.filter(u => (u as any).socketId !== socket.id);
          io.to(roomId).emit('user-left', user.id);
          if (rooms[roomId].users.length === 0) {
            delete rooms[roomId];
          }
        }
      });
    });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    const groq = process.env.FALLBACK_API_KEY ? 'có' : 'không';
    const myGemini = process.env.MY_GEMINI_API_KEY ? 'có' : 'không';
    const gemini = process.env.GEMINI_API_KEY ? 'có' : 'không';
    console.log(`Nguồn: groq=${groq}, MY_GEMINI_API_KEY=${myGemini}, GEMINI_API_KEY=${gemini}`);
    console.log(`StudyFlow Real-time Server running on port ${port} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
