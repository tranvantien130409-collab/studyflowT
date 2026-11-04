import React, { useState, useEffect, useRef } from 'react';
import { X, KeyRound, User, Lock, Save, Upload, Image as ImageIcon, Sparkles, Check, RefreshCw, BookOpen } from 'lucide-react';
import { TeacherProfile } from '../types';
import { Avatar } from './Avatar';
import { compressAvatarImage, TEACHER_AVATAR_PRESETS, isImageAvatar } from '../utils/avatarUtils';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TeacherProfile;
  onSaveProfile: (profile: TeacherProfile) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [name, setName] = useState(profile?.name || 'Cô Phượng');
  const [username, setUsername] = useState(profile?.username || 'giaovien');
  const [backupCode, setBackupCode] = useState(profile?.backupCode || 'giaovien');
  const [subject, setSubject] = useState(profile?.subject || 'Vật lí');
  const [password, setPassword] = useState(profile?.password || '123456');
  const [avatar, setAvatar] = useState(profile?.avatar || 'CP');
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [imgSuccessNotice, setImgSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal is opened or profile prop updates
  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || 'Cô Phượng');
      setUsername(profile?.username || 'giaovien');
      setBackupCode(profile?.backupCode || 'giaovien');
      setSubject(profile?.subject || 'Vật lí');
      setPassword(profile?.password || '123456');
      setAvatar(profile?.avatar || 'CP');
      setImgSuccessNotice(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleImageFileChange = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file định dạng hình ảnh (PNG, JPG, JPEG, WEBP)!');
      return;
    }

    try {
      setIsProcessingImg(true);
      const compressedDataUrl = await compressAvatarImage(file, 220, 0.88);
      setAvatar(compressedDataUrl);
      setImgSuccessNotice('Đã tải và tối ưu hóa ảnh giáo viên thành công!');
      setTimeout(() => setImgSuccessNotice(null), 3500);
    } catch (err: any) {
      console.error('Lỗi nén ảnh giáo viên:', err);
      alert('Không thể tải ảnh. Vui lòng thử lại với file ảnh khác.');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleUseInitials = () => {
    const finalName = name.trim() || 'Cô Phượng';
    const initials = finalName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CP';
    setAvatar(initials);
    setImgSuccessNotice(`Đã chuyển sang viết tắt: ${initials}`);
    setTimeout(() => setImgSuccessNotice(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Cô Phượng';
    let finalAvatar = avatar;

    if (!finalAvatar || (!isImageAvatar(finalAvatar) && finalAvatar.trim().length === 0)) {
      finalAvatar = finalName
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CP';
    }

    onSaveProfile({
      name: finalName,
      username: username.trim() || 'giaovien',
      backupCode: backupCode.trim() || 'giaovien',
      subject: subject.trim() || 'Vật lí',
      password: password.trim() || '123456',
      avatar: finalAvatar
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              src={avatar}
              fallbackText={name || 'CP'}
              sizeClassName="w-11 h-11 rounded-2xl shadow-md shadow-amber-500/20"
              bgClassName="bg-amber-500"
            />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Hồ sơ & Tài khoản Giáo viên
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu tên vĩnh viễn, đổi mật khẩu & Tải ảnh đại diện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Avatar Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Ảnh đại diện Giáo viên (Avatar)</span>
              </label>
              <button
                type="button"
                onClick={handleUseInitials}
                className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Dùng chữ cái đầu</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <Avatar
                  src={avatar}
                  fallbackText={name || 'CP'}
                  sizeClassName="w-16 h-16 rounded-2xl shadow-md border-2 border-amber-500"
                  bgClassName="bg-amber-500"
                />
                {isProcessingImg && (
                  <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileChange(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-500/30 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn ảnh từ máy tính / điện thoại</span>
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Tự động cắt vuông và nén ảnh siêu nhẹ ~12KB, lưu trữ vĩnh viễn không bị mất khi thoát trang.
                </p>
              </div>
            </div>

            {imgSuccessNotice && (
              <div className="p-2 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{imgSuccessNotice}</span>
              </div>
            )}

            {/* Presets */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Hoặc chọn hình đại diện sư phạm:</span>
              </p>
              <div className="grid grid-cols-4 gap-2">
                {TEACHER_AVATAR_PRESETS.map((preset) => {
                  const isSelected = avatar === preset.svg;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatar(preset.svg);
                        setImgSuccessNotice(`Đã chọn: ${preset.label}`);
                        setTimeout(() => setImgSuccessNotice(null), 2500);
                      }}
                      className={`relative p-1.5 rounded-2xl border-2 transition transform hover:scale-105 cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50 dark:bg-amber-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.svg} alt={preset.label} className="w-10 h-10 rounded-xl object-contain" />
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Teacher Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Họ và tên Giáo viên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cô Phượng / Thầy Tiến"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                required
              />
            </div>
          </div>

          {/* Username & Backup Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Mã dự phòng (Khôi phục) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Subject & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Môn giảng dạy
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="VD: Vật lí, Toán..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Mật khẩu đăng nhập
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/30 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thông tin Giáo viên</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
