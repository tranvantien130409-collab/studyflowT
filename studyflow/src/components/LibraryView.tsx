import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Star, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  FileText, 
  Paperclip,
  Check,
  Eye,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  FolderOpen,
  Layers
} from 'lucide-react';
import { LibraryItem, UserRole } from '../types';
import { DocumentViewerModal } from './DocumentViewerModal';

interface LibraryViewProps {
  library: LibraryItem[];
  role: UserRole;
  onAddResource: (item: Omit<LibraryItem, 'id'>) => void;
  onUpdateResource: (item: LibraryItem) => void;
  onDeleteResource: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  initialSearch?: string;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  library,
  role,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onToggleFavorite,
  initialSearch = ''
}) => {
  const isTeacher = role === 'teacher';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedSubject, setSelectedSubject] = useState<string>('Tất cả');

  // Preview Document Modal state
  const [viewingItem, setViewingItem] = useState<LibraryItem | null>(null);

  // Add / Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formType, setFormType] = useState('Ghi chú');
  const [formDesc, setFormDesc] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileContent, setFormFileContent] = useState('');
  const [formFileType, setFormFileType] = useState<'pdf' | 'image' | 'text' | 'video' | 'audio' | 'link'>('text');

  // Extract subjects
  const subjects = ['Tất cả', '★ Yêu thích', ...Array.from(new Set(library.map((l) => l.sub).filter(Boolean)))];

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormSubject('');
    setFormType('Ghi chú');
    setFormDesc('');
    setFormUrl('');
    setFormFileName('');
    setFormFileContent('');
    setFormFileType('text');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: LibraryItem) => {
    setEditingItem(item);
    setFormTitle(item.t);
    setFormSubject(item.sub);
    setFormType(item.type);
    setFormDesc(item.d);
    setFormUrl(item.url || '');
    setFormFileName(item.fileName || '');
    setFormFileContent(item.fileContent || '');
    setFormFileType(item.fileType || 'text');
    setIsModalOpen(true);
  };

  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let processedUrl = formUrl.trim();
    if (processedUrl && !/^https?:\/\//i.test(processedUrl) && !processedUrl.startsWith('data:')) {
      processedUrl = 'https://' + processedUrl;
    }

    if (editingItem) {
      onUpdateResource({
        ...editingItem,
        t: formTitle.trim(),
        sub: formSubject.trim() || 'Khác',
        type: formType,
        d: formDesc.trim() || 'Chưa có mô tả chi tiết.',
        url: processedUrl,
        fileName: formFileName.trim() || undefined,
        fileContent: formFileContent.trim() || undefined,
        fileType: formFileType
      });
    } else {
      onAddResource({
        t: formTitle.trim(),
        sub: formSubject.trim() || 'Khác',
        type: formType,
        d: formDesc.trim() || 'Chưa có mô tả chi tiết.',
        url: processedUrl,
        fav: false,
        fileName: formFileName.trim() || undefined,
        fileContent: formFileContent.trim() || undefined,
        fileType: formFileType
      });
    }

    setIsModalOpen(false);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormFileName(file.name);
    const fname = file.name.toLowerCase();

    if (file.type.includes('pdf') || fname.endsWith('.pdf')) {
      setFormFileType('pdf');
    } else if (file.type.includes('image') || fname.match(/\.(png|jpe?g|gif|webp|svg)$/)) {
      setFormFileType('image');
    } else if (file.type.includes('video') || fname.match(/\.(mp4|webm)$/)) {
      setFormFileType('video');
    } else if (file.type.includes('text') || fname.match(/\.(txt|md|csv)$/)) {
      setFormFileType('text');
    }

    // Convert file to Data URL for instant in-browser viewing
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormUrl(result);

      // If text file, also extract fileContent
      if (file.type.includes('text') || fname.endsWith('.txt') || fname.endsWith('.md')) {
        setFormFileContent(result);
      }
    };

    if (file.type.includes('text') || fname.endsWith('.txt') || fname.endsWith('.md')) {
      const textReader = new FileReader();
      textReader.onload = (te) => {
        setFormFileContent(te.target?.result as string);
      };
      textReader.readAsText(file);
    }

    reader.readAsDataURL(file);
  };

  // Filter items
  const filteredLibrary = library.filter((item) => {
    // Subject filter
    if (selectedSubject === '★ Yêu thích') {
      if (!item.fav) return false;
    } else if (selectedSubject !== 'Tất cả' && item.sub !== selectedSubject) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.t.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.d.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const totalFavorites = library.filter((l) => l.fav).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HEADER - Luxury Sapphire Gradient & Ambient Glow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/40 shrink-0">
            <BookOpen className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-white dark:via-cyan-100 dark:to-blue-200 bg-clip-text text-transparent tracking-tight">
                Library
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)]">
                Kho học liệu
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lưu trữ ghi chú, đề thi mẫu, công thức và liên kết học liệu theo từng môn học
            </p>
          </div>
        </div>

        {/* Action Button: Thêm tài liệu */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#071328]/80 backdrop-blur-md border border-slate-200/80 dark:border-cyan-500/20 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-2xs">
            <span className="text-cyan-600 dark:text-cyan-400 font-mono font-black">{library.length}</span> tài liệu
            <span>·</span>
            <span className="text-amber-500 font-mono font-black">{totalFavorites}</span> yêu thích
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 rounded-2xl transition-all shadow-md shadow-cyan-600/30 hover:shadow-[0_0_22px_rgba(6,182,212,0.45)] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài liệu</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER SECTION (Frosted Depth & Smooth Pills) */}
      <div className="space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài học, môn học, công thức hoặc loại tài liệu..."
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-white/80 dark:bg-[#060c18]/90 backdrop-blur-md border border-slate-200/90 dark:border-cyan-500/25 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 shadow-sm transition-all"
          />
        </div>

        {/* Subject Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {subjects.map((sub) => {
            const isSelected = selectedSubject === sub;
            const isFav = sub === '★ Yêu thích';
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? isFav
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/35 scale-[1.03]'
                      : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/35 scale-[1.03]'
                    : 'bg-white/80 dark:bg-[#071328]/80 backdrop-blur-xs border border-slate-200/80 dark:border-cyan-500/20 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-500/40 shadow-2xs hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] active:scale-95'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RESOURCE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredLibrary.length > 0 ? (
          filteredLibrary.map((item) => (
            <article
              key={item.id}
              className="library-card-glass rounded-3xl p-5 sm:p-6 flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Card Top: Subject Badge & Star Favorite */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-2xs">
                    {item.sub}
                  </span>

                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all hover:scale-110 active:scale-90 cursor-pointer"
                    title={item.fav ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        item.fav ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Card Title & Desc */}
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                  {item.t}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                  {item.d}
                </p>
              </div>

              {/* Card Bottom: Type label, Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-cyan-500/15 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 truncate">
                  {item.fileType === 'pdf' ? (
                    <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/30">
                      <FileText className="w-3 h-3" />
                    </div>
                  ) : item.fileType === 'image' ? (
                    <div className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/30">
                      <ImageIcon className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0 border border-cyan-500/30">
                      <FileCode className="w-3 h-3" />
                    </div>
                  )}
                  <span className="font-bold text-slate-600 dark:text-slate-300">{item.type}</span>
                  {item.fileName && <span className="truncate text-slate-400">• {item.fileName}</span>}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Direct in-app preview button */}
                  <button
                    onClick={() => setViewingItem(item)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 text-white rounded-xl transition-all shadow-xs hover:shadow-[0_0_14px_rgba(6,182,212,0.35)] active:scale-95 cursor-pointer"
                    title="Xem tài liệu trực tiếp trên trang"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem</span>
                  </button>

                  {item.url && !item.url.startsWith('data:') && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-xl transition"
                      title="Mở liên kết gốc"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-xl transition cursor-pointer"
                    title="Chỉnh sửa tài liệu"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteResource(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full library-card-glass rounded-3xl py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center mx-auto border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              Không tìm thấy tài liệu phù hợp
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Không tìm thấy học liệu nào phù hợp với bộ lọc hiện tại. Bạn có thể thêm tài liệu mới hoặc chọn bộ lọc môn khác.
            </p>
          </div>
        )}
      </div>

      {/* 4. ADD / EDIT RESOURCE MODAL (Multi-layered blurred depth & Spring) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl">
          <div className="calendar-modal-shadow animate-modal-spring relative w-full max-w-lg bg-white/95 dark:bg-[#071328]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-cyan-500/30 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-cyan-500/15 mb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>{editingItem ? 'Chỉnh sửa tài liệu học tập' : 'Thêm tài liệu học tập mới'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tiêu đề tài liệu *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Tổng hợp công thức Toán 10, Từ vựng Unit 7..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Môn học
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Toán, Văn, Anh..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Thể loại
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner cursor-pointer"
                  >
                    <option value="Ghi chú">Ghi chú</option>
                    <option value="Tài liệu">Tài liệu</option>
                    <option value="Đề thi">Đề thi</option>
                    <option value="Mẫu bài">Mẫu bài</option>
                    <option value="Video">Video bài giảng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mô tả nội dung tóm tắt
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Điểm chính cần ghi nhớ trong tài liệu này..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                />
              </div>

              {/* Rich Content / Text Notes for in-page viewing */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nội dung ghi chú trực tiếp (Hỗ trợ Markdown & KaTeX)
                  </label>
                  <span className="text-[10px] text-cyan-500 font-bold">Xem được ngay trong trang</span>
                </div>
                <textarea
                  rows={4}
                  value={formFileContent}
                  onChange={(e) => setFormFileContent(e.target.value)}
                  placeholder="Dán nội dung bài học, dàn ý, công thức tại đây để học sinh xem trực tiếp không cần tải về..."
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50/80 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner resize-none"
                />
              </div>

              {/* Upload file directly */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tải tệp lên để xem trực tiếp (PDF, Ảnh, Văn bản...)
                </label>
                <label className="flex items-center gap-2 px-3.5 py-2.5 border border-dashed border-cyan-400/50 dark:border-cyan-500/40 bg-cyan-50/40 dark:bg-cyan-950/20 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-950/40 cursor-pointer text-xs text-slate-700 dark:text-slate-300 transition shadow-xs">
                  <Paperclip className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="truncate flex-1 font-medium">
                    {formFileName ? `Đã chọn: ${formFileName}` : 'Chọn tệp từ máy tính để nhúng xem trực tiếp'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.md,.csv,.mp4"
                    className="hidden"
                    onChange={handleFileAttach}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hoặc đường dẫn liên kết ngoài (URL)
                </label>
                <input
                  type="text"
                  value={formUrl.startsWith('data:') ? '' : formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://drive.google.com/... hoặc trang web"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50/80 dark:bg-[#040c1a]/80 border border-slate-200 dark:border-cyan-500/25 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-cyan-500/15">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 rounded-xl transition-all shadow-md shadow-cyan-600/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Lưu thay đổi' : 'Lưu tài liệu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DIRECT IN-APP DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        item={viewingItem}
        onClose={() => setViewingItem(null)}
      />
    </div>
  );
};
