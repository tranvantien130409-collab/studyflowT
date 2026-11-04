import React, { useState, useEffect, useRef } from 'react';
import { X, User, Save, GraduationCap, School, Upload, Image as ImageIcon, Sparkles, Check, RefreshCw } from 'lucide-react';
import { StudentProfile } from '../types';
import { Avatar } from './Avatar';
import { compressAvatarImage, STUDENT_AVATAR_PRESETS, isImageAvatar } from '../utils/avatarUtils';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [name, setName] = useState(profile?.name || 'Văn An');
  const [className, setClassName] = useState(profile?.className || '12A1');
  const [schoolName, setSchoolName] = useState(profile?.schoolName || 'THPT Chuyên');
  const [avatar, setAvatar] = useState(profile?.avatar || 'VA');
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [imgSuccessNotice, setImgSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize incoming profile when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || 'Văn An');
      setClassName(profile?.className || '12A1');
      setSchoolName(profile?.schoolName || 'THPT Chuyên');
      setAvatar(profile?.avatar || 'VA');
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
      // Compress to optimal square avatar ~12KB
      const compressedDataUrl = await compressAvatarImage(file, 220, 0.88);
      setAvatar(compressedDataUrl);
      setImgSuccessNotice('Đã tải và tối ưu hóa hình ảnh thành công!');
      setTimeout(() => setImgSuccessNotice(null), 3500);
    } catch (err: any) {
      console.error('Lỗi nén ảnh:', err);
      alert('Không thể tải ảnh. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleUseInitials = () => {
    const finalName = name.trim() || 'Văn An';
    const initials = finalName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'VA';
    setAvatar(initials);
    setImgSuccessNotice(`Đã chuyển sang viết tắt: ${initials}`);
    setTimeout(() => setImgSuccessNotice(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Văn An';
    const finalClass = className.trim() || '12A1';
    const finalSchool = schoolName.trim() || 'THPT Chuyên';

    let finalAvatar = avatar;
    if (!finalAvatar || (!isImageAvatar(finalAvatar) && finalAvatar.trim().length === 0)) {
      finalAvatar = finalName
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'VA';
    }

    onSaveProfile({
      name: finalName,
      className: finalClass,
      schoolName: finalSchool,
      avatar: finalAvatar,
      subjects: profile?.subjects
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              src={avatar}
              fallbackText={name || 'VA'}
              sizeClassName="w-11 h-11 rounded-2xl shadow-md shadow-emerald-600/20"
              bgClassName="bg-emerald-600"
            />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Chỉnh sửa hồ sơ Học sinh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu tên vĩnh viễn & Tải ảnh đại diện trực tiếp từ máy
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Avatar Section - Tải ảnh từ máy / điện thoại */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Ảnh đại diện (Avatar)</span>
              </label>
              <button
                type="button"
                onClick={handleUseInitials}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Dùng chữ viết tắt</span>
              </button>
            </div>

            {/* Avatar Preview & File Upload Button */}
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <Avatar
                  src={avatar}
                  fallbackText={name || 'VA'}
                  sizeClassName="w-16 h-16 rounded-2xl shadow-md border-2 border-emerald-500"
                  bgClassName="bg-emerald-600"
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
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn hình ảnh từ máy / điện thoại</span>
                </button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Tự động cắt vuông và nén ảnh siêu nhẹ ~12KB, lưu trữ vĩnh viễn không sợ mất.
                </p>
              </div>
            </div>

            {imgSuccessNotice && (
              <div className="p-2 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{imgSuccessNotice}</span>
              </div>
            )}

            {/* Preset Avatar Gallery */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Hoặc chọn nhanh avatar có sẵn:</span>
              </p>
              <div className="grid grid-cols-6 gap-2">
                {STUDENT_AVATAR_PRESETS.map((preset) => {
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
                      className={`relative p-1 rounded-2xl border-2 transition transform hover:scale-105 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50 dark:bg-emerald-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.svg} alt={preset.label} className="w-full h-auto aspect-square rounded-xl object-contain" />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Họ và tên học sinh <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn Tiến / Văn An"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tên sẽ được lưu đồng bộ trên mọi trang: Tổng quan, Lịch học, Điểm số và Bài tập.
            </p>
          </div>

          {/* Class & School Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Lớp học <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="VD: 12A1 / 12 Chuyên Lý"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Trường học <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="VD: THPT Chuyên"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thông tin học sinh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
