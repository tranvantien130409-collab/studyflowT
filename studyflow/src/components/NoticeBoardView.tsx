import React, { useState } from 'react';
import { Pin, Trash2, Send, MessageCircle, BellRing, Sparkles, Clock, CheckCircle2, ShieldCheck, Megaphone } from 'lucide-react';
import { Notice, UserRole } from '../types';

interface NoticeBoardViewProps {
  notices: Notice[];
  role: UserRole;
  onAddNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'reactions'>) => void;
  onPinNotice: (id: number) => void;
  onDeleteNotice: (id: number) => void;
  onReact: (id: number, reaction: string) => void;
}

export const NoticeBoardView: React.FC<NoticeBoardViewProps> = ({
  notices,
  role,
  onAddNotice,
  onPinNotice,
  onDeleteNotice,
  onReact
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinnedNew, setIsPinnedNew] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'pinned'>('all');

  const filteredNotices = notices.filter((n) => {
    if (filterType === 'pinned') return n.pinned;
    return true;
  });

  const sortedNotices = [...filteredNotices].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.id - a.id);

  const reactionList = ['❤️', '👍', '🔥', '🎉', '👏', '💡'];

  const formatDateLabel = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return 'Vừa xong';
    }
  };

  const totalPinned = notices.filter((n) => n.pinned).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. TOP HEADER - Modern Luxury Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/40 shrink-0">
            <Megaphone className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-white dark:via-cyan-100 dark:to-blue-200 bg-clip-text text-transparent tracking-tight">
                News & Alerts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                Trực tiếp
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bảng tin chính thức, thông báo khẩn và các sự kiện trường học quan trọng
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100/90 dark:bg-[#071328]/90 backdrop-blur-md p-1 rounded-full border border-slate-200/80 dark:border-cyan-500/25 shadow-inner self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/35 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300'
            }`}
          >
            Tất cả ({notices.length})
          </button>
          <button
            onClick={() => setFilterType('pinned')}
            className={`flex items-center gap-1 px-3.5 py-1 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
              filterType === 'pinned'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/35 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
            }`}
          >
            <Pin className="w-3 h-3 fill-current" />
            <span>Đã ghim ({totalPinned})</span>
          </button>
        </div>
      </div>

      {/* 2. TEACHER CREATION FORM (Glassmorphism & Depth Shadow) */}
      {role === 'teacher' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !content.trim()) return;
            onAddNotice({ title: title.trim(), content: content.trim(), pinned: isPinnedNew });
            setTitle('');
            setContent('');
            setIsPinnedNew(false);
          }}
          className="notice-card-glass p-5 sm:p-6 rounded-3xl relative overflow-hidden space-y-4"
        >
          {/* Ambient soft glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-cyan-500/15 pb-3 relative z-10">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <BellRing className="w-4 h-4" />
              </div>
              <span>Đăng thông báo mới cho toàn trường & lớp</span>
            </h3>

            <label className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-bold cursor-pointer px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-500/30 hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={isPinnedNew}
                onChange={(e) => setIsPinnedNew(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                Ghim bài lên đầu
              </span>
            </label>
          </div>

          <div className="space-y-3 relative z-10">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề thông báo quan trọng..."
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200/90 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-[#060c18]/90 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all shadow-inner"
              required
            />
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung chi tiết thông báo gửi đến các em học sinh..."
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200/90 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-[#060c18]/90 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all shadow-inner resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1 relative z-10">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
              Thông báo sẽ được đồng bộ tức thì lên bảng tin học sinh
            </span>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white text-xs font-bold rounded-2xl shadow-lg shadow-cyan-600/30 hover:shadow-[0_0_22px_rgba(6,182,212,0.45)] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Đăng thông báo</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. FEED LIST WITH LUXURY GRADIENTS & FROSTED DEPTH */}
      <div className="space-y-4">
        {sortedNotices.length > 0 ? (
          sortedNotices.map((notice) => {
            const reactionsObj = notice.reactions || {};
            const totalReactions = (Object.values(reactionsObj) as number[]).reduce((a: number, b: number) => a + b, 0);

            return (
              <article
                key={notice.id}
                className={`p-5 sm:p-6 rounded-3xl relative overflow-hidden transition-all duration-300 ${
                  notice.pinned ? 'notice-card-pinned' : 'notice-card-glass'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Teacher / School Avatar */}
                    <div className="relative group shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black text-xs shadow-md shadow-cyan-500/20 border-2 border-cyan-400/40">
                        BGH
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white dark:border-[#071328] shadow-[0_0_6px_#22d3ee]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                          {notice.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-bold text-slate-700 dark:text-cyan-300">Giáo viên BGH</span>
                        <span>·</span>
                        <div className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3 text-cyan-500" />
                          <span>{formatDateLabel(notice.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Pinned Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {notice.pinned && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.4)] uppercase tracking-wider">
                        <Pin className="w-3 h-3 fill-current" />
                        Đã ghim
                      </span>
                    )}

                    {role === 'teacher' && (
                      <div className="flex items-center gap-1 bg-white/60 dark:bg-[#071428]/80 backdrop-blur-xs p-1 rounded-xl border border-slate-200/80 dark:border-cyan-500/20 shadow-2xs">
                        <button
                          onClick={() => onPinNotice(notice.id)}
                          className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                            notice.pinned
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/70'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={notice.pinned ? 'Bỏ ghim' : 'Ghim bài lên đầu'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteNotice(notice.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-3.5 pl-0 sm:pl-14">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                    {notice.content}
                  </p>
                </div>

                {/* Social Reactions Footer */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-cyan-500/15 flex items-center justify-between flex-wrap gap-2.5 sm:pl-14">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> Cảm xúc:
                    </span>
                    {reactionList.map((icon) => {
                      const count = reactionsObj[icon] || 0;
                      const hasReacted = count > 0;
                      return (
                        <button
                          key={icon}
                          onClick={() => onReact(notice.id, icon)}
                          className={`reaction-pill flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer select-none ${
                            hasReacted
                              ? 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/15 border-cyan-400/60 dark:border-cyan-400/50 text-cyan-800 dark:text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                              : 'bg-slate-50/80 dark:bg-[#071328]/80 border-slate-200/80 dark:border-cyan-500/20 text-slate-600 dark:text-slate-400 hover:border-cyan-400/40 hover:text-cyan-300'
                          }`}
                        >
                          <span className="text-sm drop-shadow-xs">{icon}</span>
                          <span className="font-mono text-[11px] font-black tabular-nums">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-auto tabular-nums">
                    {totalReactions > 0 ? `🔥 ${totalReactions} lượt tương tác` : 'Chưa có tương tác'}
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <div className="notice-card-glass p-12 rounded-3xl text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center mx-auto border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              {filterType === 'pinned' ? 'Không có thông báo được ghim' : 'Chưa có thông báo nào'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filterType === 'pinned'
                ? 'Hiện chưa có thông báo quan trọng nào được ghim lên đầu.'
                : 'Mọi thông báo, lịch thi và quyết định từ ban giám hiệu hoặc giáo viên sẽ hiển thị tại đây.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
