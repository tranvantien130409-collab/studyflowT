import React, { useState } from 'react';
import { X, Lock, LogIn, KeyRound, ShieldAlert, User } from 'lucide-react';
import { TeacherProfile } from '../types';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TeacherProfile;
  noticeMessage?: string;
  onLoginSuccess: (remember: boolean) => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  profile,
  noticeMessage,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cố định tài khoản: giaovien / 123456
    const FIXED_USERNAME = 'giaovien';
    const FIXED_PASSWORD = '123456';

    const isUsernameCorrect = 
      username.trim().toLowerCase() === FIXED_USERNAME ||
      username.trim().toLowerCase() === profile.username.trim().toLowerCase() ||
      username.trim().toLowerCase() === profile.backupCode.trim().toLowerCase();

    const isPasswordCorrect = 
      password === FIXED_PASSWORD || 
      password === profile.password;

    if (isUsernameCorrect && isPasswordCorrect) {
      onLoginSuccess(rememberMe);
      onClose();
      setUsername('');
      setPassword('');
      setError('');
    } else if (!isUsernameCorrect && !isPasswordCorrect) {
      setError('Tên đăng nhập và mật khẩu không chính xác!');
    } else if (!isUsernameCorrect) {
      setError('Tên đăng nhập không chính xác!');
    } else {
      setError('Mật khẩu không chính xác!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/60 dark:bg-blue-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Đăng nhập Giáo viên
              </h2>
              <p className="text-[11px] text-slate-500">
                Xác thực quyền truy cập trang quản lý
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {noticeMessage && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{noticeMessage}</span>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-[11px] text-rose-500 font-semibold mt-1.5">{error}</p>}
            <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
              <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium text-center">
                Tài khoản cố định: <span className="font-bold">giaovien</span> | Mật khẩu: <span className="font-bold">123456</span>
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Lưu đăng nhập để chuyển trang nhanh (Tối đa 8 lần)</span>
          </label>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Xác nhận Đăng nhập</span>
          </button>
        </form>
      </div>
    </div>
  );
};
