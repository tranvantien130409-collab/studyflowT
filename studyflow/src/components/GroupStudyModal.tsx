import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  LogOut,
  Sparkles,
  Shield,
  Monitor,
  Plus,
  Settings,
  AlertCircle,
  RefreshCw,
  Volume2,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';
import { StudentProfile } from '../types';

const ZoomIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M4.5 5A2.5 2.5 0 0 0 2 7.5v9A2.5 2.5 0 0 0 4.5 19h10a2.5 2.5 0 0 0 2.5-2.5v-2.2l3.4 2.267A1 1 0 0 0 22 17.2V6.8a1 1 0 0 0-1.6-.8L17 8.267V7.5A2.5 2.5 0 0 0 14.5 5h-10z" />
  </svg>
);

const GoogleMeetIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M12 5.5v13l7.5-6.5L12 5.5z" fill="#00832d" />
    <path d="M4.5 6A2.5 2.5 0 0 0 2 8.5v7A2.5 2.5 0 0 0 4.5 18h7.5V6H4.5z" fill="#00ac47" />
    <path d="M12 11.5l7.5-6.5v14L12 12.5v-1z" fill="#0066da" opacity="0.9" />
    <path d="M16 8.5L19.5 6v12l-3.5-2.5v-7z" fill="#ffba00" />
    <path d="M12 18h-7.5A2.5 2.5 0 0 1 2 15.5v-1h10v3.5z" fill="#2684fc" />
    <path d="M12 6H4.5A2.5 2.5 0 0 0 2 8.5v1h10V6z" fill="#ea4335" />
  </svg>
);

interface GroupStudyModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  studentProfile?: StudentProfile;
  isView?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface Participant {
  id: string;
  name: string;
  socketId: string;
  peerId?: string;
  isMe?: boolean;
  avatar?: string;
}

export const GroupStudyModal: React.FC<GroupStudyModalProps> = ({
  isOpen = true,
  onClose,
  studentProfile,
  isView = false
}) => {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Media states
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Device lists
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isOpen && !socketRef.current) {
      // Connect to socket server
      socketRef.current = io(window.location.origin);

      socketRef.current.on('room-users', (users: any[]) => {
        setParticipants(users.map(u => ({ ...u, isMe: u.id === studentProfile?.name })));
      });

      socketRef.current.on('user-joined', ({ user, users }) => {
        setParticipants(users.map((u: any) => ({ ...u, isMe: u.id === studentProfile?.name })));
        addSystemMessage(`${user.name} đã tham gia phòng.`);
      });

      socketRef.current.on('user-left', (userId) => {
        setParticipants(prev => prev.filter(p => p.id !== userId));
        addSystemMessage(`Một người học đã rời phòng.`);
      });

      socketRef.current.on('new-message', (msg: ChatMessage) => {
        setMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      if (!isOpen && socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen, studentProfile]);

  // Handle device enumeration
  useEffect(() => {
    if (inRoom) {
      refreshDevices();
    }
  }, [inRoom]);

  const refreshDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
      setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
    } catch (err) {
      console.error('Error enumerating devices', err);
    }
  };

  const addSystemMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: 'Hệ thống',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    joinRoom(newRoomId);
  };

  const handleJoinRoom = () => {
    if (roomId.length >= 4) {
      joinRoom(roomId.toUpperCase());
    }
  };

  const joinRoom = (id: string) => {
    if (!socketRef.current || !studentProfile) return;
    
    socketRef.current.emit('join-room', {
      roomId: id,
      user: {
        id: studentProfile.name, 
        name: studentProfile.name,
        avatar: studentProfile.avatar,
        role: 'student'
      }
    });

    setInRoom(true);
    addSystemMessage(`Bạn đã tham gia phòng ${id}`);
    
    initMedia(id);
  };

  const initMedia = async (id: string, vId?: string, aId?: string) => {
    setErrorMsg(null);

    // Iframe check
    if (window.self !== window.top) {
      setErrorMsg('Bạn đang chạy app trong khung (iframe). Vui lòng mở StudyFlow ở Tab mới để cấp quyền Camera/Micro.');
      return;
    }

    try {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        video: vId ? { deviceId: { exact: vId } } : true,
        audio: aId ? { deviceId: { exact: aId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Update UI enabled states based on track states
      setVideoEnabled(stream.getVideoTracks()[0]?.enabled ?? false);
      setAudioEnabled(stream.getAudioTracks()[0]?.enabled ?? false);

      if (!peerRef.current) {
        peerRef.current = new Peer();
        
        peerRef.current.on('open', (peerId) => {
          socketRef.current?.emit('signal', { roomId: id, signal: { type: 'peerId', peerId }, from: socketRef.current.id });
        });

        peerRef.current.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            console.log('Received remote stream');
          });
        });
      } else {
        // If peer already exists, we might need to replace tracks in ongoing calls
        // For simplicity in this mock, we focus on local media working
      }

    } catch (err: any) {
      console.error('Failed to get media devices', err);
      let msg = 'Không thể truy cập Camera/Micro. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg += 'Bạn đã từ chối cấp quyền. Vui lòng bấm vào icon ổ khóa trên thanh địa chỉ để cấp lại quyền.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg += 'Không tìm thấy thiết bị Camera hoặc Micro trên máy của bạn.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg += 'Thiết bị đang bị một ứng dụng khác sử dụng (như Zoom, Zalo...). Vui lòng tắt các app đó và thử lại.';
      } else {
        msg += `Lỗi hệ thống: ${err.message || 'Không rõ nguyên nhân'}`;
      }
      
      setErrorMsg(msg);
      addSystemMessage(msg);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;

    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: studentProfile?.name || 'anonymous',
      senderName: studentProfile?.name || 'Học sinh',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socketRef.current.emit('send-message', { roomId, message: msg });
    setInputText('');
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId, userId: studentProfile?.name });
    }
    setInRoom(false);
    setRoomId('');
    setParticipants([]);
    setMessages([]);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setVideoEnabled(nextState);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !audioTrack.enabled;
        audioTrack.enabled = nextState;
        setAudioEnabled(nextState);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      initMedia(roomId, selectedVideoId, selectedAudioInputId);
      return;
    }

    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
      
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      
      setLocalStream(screenStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
      
      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        initMedia(roomId, selectedVideoId, selectedAudioInputId);
      };
      
    } catch (err: any) {
      console.error('Screen share error', err);
      if (err.name !== 'NotAllowedError') {
        setErrorMsg('Lỗi khi chia sẻ màn hình: ' + err.message);
      }
    }
  };

  const changeVideoSource = (id: string) => {
    setSelectedVideoId(id);
    initMedia(roomId, id, selectedAudioInputId);
  };

  const changeAudioSource = (id: string) => {
    setSelectedAudioInputId(id);
    initMedia(roomId, selectedVideoId, id);
  };

  if (!isOpen && !isView) return null;

  const modalContent = (
    <div className={`relative w-full ${isView ? 'h-[calc(100vh-140px)] min-h-[640px]' : 'max-w-5xl h-[85vh]'} bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col`}>
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Phòng học nhóm ảo</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Học cùng nhau • Tiến bộ cùng nhau</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick External Video Call Links */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href="https://zoom.us/vi/join"
              target="_blank"
              rel="noopener noreferrer"
              title="Mở phòng họp Zoom (https://zoom.us/vi/join)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D8CFF]/10 hover:bg-[#2D8CFF]/20 text-[#2D8CFF] border border-[#2D8CFF]/30 text-xs font-bold transition-all shadow-xs group"
            >
              <div className="w-4 h-4 rounded-full bg-[#2D8CFF] text-white flex items-center justify-center">
                <ZoomIcon className="w-2.5 h-2.5" />
              </div>
              <span className="hidden sm:inline">Zoom</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform opacity-70" />
            </a>

            <a
              href="https://meet.google.com/home"
              target="_blank"
              rel="noopener noreferrer"
              title="Mở Google Meet (https://meet.google.com/home)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-xs group"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center">
                <GoogleMeetIcon className="w-2.5 h-2.5" />
              </div>
              <span className="hidden sm:inline">Google Meet</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform opacity-70" />
            </a>
          </div>

          {inRoom && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-black text-slate-400 uppercase">Mã phòng:</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-widest">{roomId}</span>
              <button onClick={copyRoomCode} className="p-1 hover:text-indigo-600 transition" title="Sao chép mã phòng">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {!inRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-y-auto custom-scrollbar">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-indigo-600/20 rotate-3 shrink-0">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-pulse" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Sẵn sàng học nhóm?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md text-center">Tạo phòng và mời bạn bè tham gia bằng mã phòng để cùng nhau trao đổi bài vở trực tuyến qua Video & Chat.</p>
            
            <div className="w-full max-w-sm space-y-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="NHẬP MÃ PHÒNG (VD: ABCXYZ)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-sm font-black tracking-widest text-center transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleJoinRoom}
                  disabled={roomId.length < 4}
                  className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  GIA NHẬP
                </button>
                <button 
                  onClick={handleCreateRoom}
                  className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-300 font-black text-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  TẠO PHÒNG MỚI
                </button>
              </div>

              {/* External Video Meeting Platforms */}
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-[1px] w-8 bg-slate-200 dark:bg-slate-700"></span>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Học trực tuyến qua nền tảng khác
                  </span>
                  <span className="h-[1px] w-8 bg-slate-200 dark:bg-slate-700"></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href="https://zoom.us/vi/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#2D8CFF]/10 hover:bg-[#2D8CFF]/15 border border-[#2D8CFF]/30 text-[#2D8CFF] transition-all group shadow-xs active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#2D8CFF] text-white flex items-center justify-center shadow-md shrink-0">
                        <ZoomIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left truncate">
                        <p className="text-xs font-black tracking-tight">Zoom Meeting</p>
                        <p className="text-[10px] opacity-80 font-medium truncate">zoom.us/vi/join</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-1" />
                  </a>

                  <a
                    href="https://meet.google.com/home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-all group shadow-xs active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
                        <GoogleMeetIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left truncate">
                        <p className="text-xs font-black tracking-tight">Google Meet</p>
                        <p className="text-[10px] opacity-80 font-medium truncate">meet.google.com</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-4 relative overflow-hidden flex flex-col">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
                <div className="relative rounded-3xl bg-slate-800 overflow-hidden shadow-xl border-2 border-indigo-500/50">
                  {errorMsg && (
                    <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                      <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                      <h4 className="text-white font-bold mb-2">Lỗi thiết bị</h4>
                      <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{errorMsg}</p>
                      <button 
                        onClick={() => initMedia(roomId, selectedVideoId, selectedAudioInputId)}
                        className="mt-6 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition"
                      >
                        Thử lại
                      </button>
                    </div>
                  )}

                  {videoEnabled || isScreenSharing ? (
                    <video 
                      autoPlay 
                      muted 
                      playsInline 
                      ref={localVideoRef} 
                      className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-3 text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-black">
                        {studentProfile?.avatar || 'H'}
                      </div>
                      <span className="text-[10px] font-black uppercase">Camera đang tắt</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md">
                    <div className={`w-2 h-2 rounded-full ${audioEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[10px] font-black text-white uppercase">
                      {isScreenSharing ? '🖥️ Đang chia sẻ màn hình' : `${studentProfile?.name} (Bạn)`}
                    </span>
                  </div>
                </div>

                {participants.filter(p => !p.isMe).map((p, idx) => (
                  <div key={idx} className="relative rounded-3xl bg-slate-800 overflow-hidden shadow-xl">
                    <div className="w-full h-full flex items-center justify-center flex-col gap-3 text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-black">
                        {p.avatar || (p.name ? p.name[0] : '?')}
                      </div>
                      <span className="text-[10px] font-black uppercase">Chờ kết nối video...</span>
                    </div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md">
                      <span className="text-[10px] font-black text-white uppercase">{p.name}</span>
                    </div>
                  </div>
                ))}
                
                {participants.length === 1 && (
                  <div className="relative rounded-3xl bg-white/5 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                      <Users className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">Đang chờ bạn bè tham gia...</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Chia sẻ mã {roomId} để bắt đầu học nhóm</p>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block w-full mb-1">
                        Hoặc chuyển sang học nhóm qua:
                      </span>
                      <a
                        href="https://zoom.us/vi/join"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D8CFF]/15 hover:bg-[#2D8CFF]/25 text-[#2D8CFF] border border-[#2D8CFF]/30 text-[11px] font-bold transition shadow-xs active:scale-95"
                      >
                        <ZoomIcon className="w-3.5 h-3.5" />
                        <span>Phòng Zoom</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <a
                        href="https://meet.google.com/home"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition shadow-xs active:scale-95"
                      >
                        <GoogleMeetIcon className="w-3.5 h-3.5" />
                        <span>Google Meet</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-[28px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/40 z-30">
                <button 
                  onClick={toggleAudio}
                  title={audioEnabled ? 'Tắt mic' : 'Bật mic'}
                  className={`p-4 rounded-2xl transition-all ${audioEnabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-rose-500 text-white'}`}
                >
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={toggleVideo}
                  title={videoEnabled ? 'Tắt camera' : 'Bật camera'}
                  className={`p-4 rounded-2xl transition-all ${videoEnabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-rose-500 text-white'}`}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={toggleScreenShare}
                  title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
                  className={`p-4 rounded-2xl transition-all ${isScreenSharing ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                  <Monitor className="w-5 h-5" />
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    title="Cài đặt thiết bị"
                    className={`p-4 rounded-2xl transition-all ${showSettings ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400">Cài đặt thiết bị</h4>
                        <button onClick={refreshDevices} className="text-indigo-600 hover:rotate-180 transition-transform duration-500">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5 uppercase">
                            <Video className="w-3 h-3" /> Camera
                          </label>
                          <select 
                            value={selectedVideoId}
                            onChange={(e) => changeVideoSource(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold outline-none"
                          >
                            <option value="">Mặc định</option>
                            {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5 uppercase">
                            <Mic className="w-3 h-3" /> Micro
                          </label>
                          <select 
                            value={selectedAudioInputId}
                            onChange={(e) => changeAudioSource(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold outline-none"
                          >
                            <option value="">Mặc định</option>
                            {audioInputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Micro ${d.deviceId.slice(0, 5)}`}</option>)}
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="w-full mt-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300"
                      >
                        Đóng
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button 
                  onClick={handleLeaveRoom}
                  className="px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  RỜI PHÒNG
                </button>
              </div>
            </div>

            <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Thảo luận</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href="https://zoom.us/vi/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mở phòng họp Zoom (https://zoom.us/vi/join)"
                    className="p-1.5 rounded-lg bg-[#2D8CFF]/10 text-[#2D8CFF] hover:bg-[#2D8CFF]/20 transition"
                  >
                    <ZoomIcon className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://meet.google.com/home"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mở Google Meet (https://meet.google.com/home)"
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    <GoogleMeetIcon className="w-3.5 h-3.5" />
                  </a>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 text-[10px] font-black">
                    {messages.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => {
                  const isSystem = msg.senderId === 'system';
                  const isMe = msg.senderId === studentProfile?.name;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <span className="text-[10px] font-black text-slate-500 mb-1 ml-1">{msg.senderName}</span>}
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 mr-1">{msg.timestamp}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    placeholder="Gửi tin nhắn..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-xs font-bold transition-all shadow-sm"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (isView) {
    return (
      <div className="w-full pb-6 animate-in fade-in duration-300">
        {modalContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      {modalContent}
    </div>
  );
};
