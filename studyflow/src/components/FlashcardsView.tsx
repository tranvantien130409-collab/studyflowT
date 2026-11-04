import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  RefreshCw, 
  HelpCircle, 
  Edit3, 
  FileUp, 
  Zap, 
  Radio, 
  Star, 
  Volume2, 
  Shuffle, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Plus, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Trophy, 
  Crown, 
  Flame, 
  Clock, 
  Users, 
  Play, 
  Sparkles, 
  Copy, 
  CheckCheck, 
  RotateCcw, 
  Layers, 
  Search, 
  Bot, 
  BarChart3, 
  ChevronDown, 
  CheckCircle2, 
  XCircle, 
  Lightbulb,
  X,
  Target,
  Mic,
  SlidersHorizontal,
  Folder,
  LayoutGrid,
  CalendarCheck,
  Pencil,
  Globe,
  Image as ImageIcon,
  Lock,
  ArrowLeftRight,
  Keyboard,
  GripHorizontal,
  Palette
} from 'lucide-react';
import { FlashcardDeck, Flashcard } from '../types';

interface FlashcardsViewProps {
  decks: FlashcardDeck[];
  onAddDeck: (deck: FlashcardDeck) => void;
  onUpdateDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (id: string) => void;
}

type SubTab = 'flashcards' | 'learn' | 'test' | 'edit' | 'import' | 'match' | 'live';
type CategoryFilter = 'created' | 'studying' | 'starred';

// Simulated Kahoot / Quizlet Live Friends
interface LivePlayer {
  id: string;
  name: string;
  avatar: string;
  location: string;
  score: number;
  streak: number;
  isHost?: boolean;
  lastDelta?: number;
}

const DEFAULT_LIVE_PLAYERS: LivePlayer[] = [
  { id: 'p_me', name: 'Bạn (Đội trưởng)', avatar: '👑', location: 'Trực tuyến', score: 0, streak: 0, isHost: true },
  { id: 'p_1', name: 'Minh Anh', avatar: '🦊', location: 'Hà Nội', score: 0, streak: 0 },
  { id: 'p_2', name: 'Hoàng Long', avatar: '🚀', location: 'Đà Nẵng', score: 0, streak: 0 },
  { id: 'p_3', name: 'Bảo Trâm', avatar: '🌸', location: 'TP.HCM', score: 0, streak: 0 },
  { id: 'p_4', name: 'Đức Thắng', avatar: '⚡', location: 'Hải Phòng', score: 0, streak: 0 }
];

// SM-2 Spaced Repetition Algorithm
const calculateSM2 = (card: Flashcard, quality: number) => {
  let repetitions = card.repetitions ?? 0;
  let easiness = card.easiness ?? 2.5;
  let interval = card.interval ?? 0;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easiness < 1.3) easiness = 1.3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    repetitions,
    easiness,
    interval,
    nextReview: nextReviewDate.toISOString(),
    lastReviewed: new Date().toISOString(),
    status: quality >= 4 ? 'mastered' : quality >= 2 ? 'learning' : 'again'
  } as Partial<Flashcard>;
};

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  decks,
  onAddDeck,
  onUpdateDeck,
  onDeleteDeck
}) => {
  // Navigation Mode: 'catalog' (Overview matching reference screenshots) or 'study' (Card player mode)
  const [viewMode, setViewMode] = useState<'catalog' | 'study'>('catalog');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(() => decks[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('flashcards');

  // Overview / Catalog Filters & Controls
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('created');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'Tiếng Anh' | 'Toán' | 'Sinh Học'>('all');
  const [heatmapYear, setHeatmapYear] = useState(2026);
  const [freezeCount, setFreezeCount] = useState(1);

  // Study states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [termSearchQuery, setTermSearchQuery] = useState('');
  const [statsView, setStatsView] = useState<'original' | 'alphabetical' | 'stats'>('original');
  const [isStatsDropdownOpen, setIsStatsDropdownOpen] = useState(false);

  // Modals state
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckSubject, setNewDeckSubject] = useState('Tiếng Anh');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // AI & Explaining states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiCreating, setIsAiCreating] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiSubject, setAiSubject] = useState('Tiếng Anh');
  const [aiTitle, setAiTitle] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Edit Deck states
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');
  const [editDeckTitle, setEditDeckTitle] = useState('');
  const [editDeckDesc, setEditDeckDesc] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [showEditSearch, setShowEditSearch] = useState(false);
  const [keyboardModalOpen, setKeyboardModalOpen] = useState(false);

  // Import states
  const [importText, setImportText] = useState('');
  const [termDefSeparator, setTermDefSeparator] = useState<'tab' | 'comma' | 'custom'>('tab');
  const [customTermDefSep, setCustomTermDefSep] = useState('');
  const [cardSeparator, setCardSeparator] = useState<'newline' | 'semicolon' | 'custom'>('newline');
  const [customCardSep, setCustomCardSep] = useState('');

  // Test Mode states
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizEndTime, setQuizEndTime] = useState<number>(0);

  // Match Game states
  const [matchPlaying, setMatchPlaying] = useState(false);
  const [matchTiles, setMatchTiles] = useState<{ id: string; cardId: string; type: 'front' | 'back'; text: string; isMatched: boolean }[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [mismatchedTileIds, setMismatchedTileIds] = useState<string[]>([]);
  const [matchElapsedTime, setMatchElapsedTime] = useState(0);
  const [isMatchWon, setIsMatchWon] = useState(false);
  const [matchPenaltyNotice, setMatchPenaltyNotice] = useState(false);

  // Learn Mode feedback state
  const [learnFeedback, setLearnFeedback] = useState<{ isCorrect: boolean; message: string; cardId?: string } | null>(null);

  // Live Game states
  const [liveStage, setLiveStage] = useState<'lobby' | 'playing' | 'round_recap' | 'podium'>('lobby');
  const [liveQuestionIndex, setLiveQuestionIndex] = useState(0);
  const [liveCountdown, setLiveCountdown] = useState(10);
  const [liveUserScore, setLiveUserScore] = useState(0);
  const [liveStreak, setLiveStreak] = useState(0);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>(DEFAULT_LIVE_PLAYERS);
  const [liveSelectedAnswer, setLiveSelectedAnswer] = useState<string | null>(null);
  const [liveAnswerState, setLiveAnswerState] = useState<'pending' | 'correct' | 'wrong' | null>(null);
  const [pinCopied, setPinCopied] = useState(false);
  const liveTimerRef = useRef<any>(null);

  // Ensure activeDeck is always valid
  const activeDeck = useMemo(() => {
    if (!activeDeckId && decks.length > 0) {
      return decks[0];
    }
    return decks.find(d => d.id === activeDeckId) || decks[0] || null;
  }, [decks, activeDeckId]);

  // Sync edit deck fields when activeDeck changes
  useEffect(() => {
    if (activeDeck) {
      setEditDeckTitle(activeDeck.title);
      setEditDeckDesc(activeDeck.description || '');
    }
  }, [activeDeck?.id]);

  // Filter cards by starred status
  const filteredCards = useMemo(() => {
    if (!activeDeck) return [];
    if (onlyStarred) {
      return activeDeck.cards.filter(c => c.isStarred);
    }
    return activeDeck.cards;
  }, [activeDeck, onlyStarred]);

  const starredCount = useMemo(() => {
    if (!activeDeck) return 0;
    return activeDeck.cards.filter(c => c.isStarred).length;
  }, [activeDeck]);

  const totalStarredAllDecks = useMemo(() => {
    return decks.reduce((acc, d) => acc + d.cards.filter(c => c.isStarred).length, 0);
  }, [decks]);

  // Safe current card
  const safeIndex = filteredCards.length > 0 ? Math.min(currentCardIndex, filteredCards.length - 1) : 0;
  const currentCard = filteredCards[safeIndex] || activeDeck?.cards[0] || null;

  // Toggle Star Card
  const toggleStarCard = (cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeDeck) return;
    const updatedCards = activeDeck.cards.map(c => 
      c.id === cardId ? { ...c, isStarred: !c.isStarred } : c
    );
    const updatedDeck: FlashcardDeck = {
      ...activeDeck,
      cards: updatedCards
    };
    onUpdateDeck(updatedDeck);
  };

  // Match Game Timer
  useEffect(() => {
    let interval: any = null;
    if (matchPlaying && !isMatchWon) {
      interval = setInterval(() => {
        setMatchElapsedTime(prev => +(prev + 0.1).toFixed(1));
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchPlaying, isMatchWon]);

  // Keyboard navigation for Study Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (viewMode !== 'study' || !activeDeck || activeSubTab !== 'flashcards') return;
      
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        handlePrevCard();
      } else if (e.key === 's' || e.key === 'S') {
        if (currentCard) {
          toggleStarCard(currentCard.id);
        }
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard(0);
        else if (e.key === '2') handleRateCard(2);
        else if (e.key === '3') handleRateCard(4);
        else if (e.key === '4') handleRateCard(5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, activeDeck, activeSubTab, currentCardIndex, isFlipped, currentCard]);

  // Speech Pronunciation with language detection
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isEnglish = /^[A-Za-z0-9\s.,!?'"()-]+$/.test(text);
      utterance.lang = isEnglish ? 'en-US' : 'vi-VN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      handleSpeak(currentCard?.front || '');
      setMicNotice('Đang phát âm giọng đọc AI chuẩn bản xứ');
      setTimeout(() => setMicNotice(null), 2500);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setIsRecording(true);
      setMicNotice('Đang lắng nghe bạn phát âm...');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        const match = transcript.toLowerCase().includes((currentCard?.front || '').toLowerCase().trim());
        if (match) {
          setMicNotice(`🎉 Phát âm chuẩn xác: "${transcript}"!`);
        } else {
          setMicNotice(`Bạn phát âm: "${transcript}". Hãy thử lại nhé!`);
        }
        setTimeout(() => setMicNotice(null), 3500);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setMicNotice('Không thể ghi âm. Vui lòng thử lại.');
        setTimeout(() => setMicNotice(null), 2500);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      handleSpeak(currentCard?.front || '');
      setMicNotice('Đang phát âm từ vựng');
      setTimeout(() => setMicNotice(null), 2000);
    }
  };

  const handleNextCard = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setAiExplanation(null);
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrevCard = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setAiExplanation(null);
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleRateCard = (quality: number) => {
    if (!activeDeck || !currentCard) return;
    const updates = calculateSM2(currentCard, quality);
    
    const updatedCards = activeDeck.cards.map(c => 
      c.id === currentCard.id ? { ...c, ...updates } : c
    );

    const updatedDeck: FlashcardDeck = {
      ...activeDeck,
      cards: updatedCards,
      goodCount: quality >= 3 ? activeDeck.goodCount + 1 : activeDeck.goodCount,
      againCount: quality < 3 ? activeDeck.againCount + 1 : activeDeck.againCount,
      lastStudyDate: new Date().toISOString(),
      streak: activeDeck.streak + (quality >= 3 ? 1 : 0)
    };

    onUpdateDeck(updatedDeck);
    handleNextCard();
  };

  const handleShuffleDeck = () => {
    if (!activeDeck) return;
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    const updated = { ...activeDeck, cards: shuffled };
    onUpdateDeck(updated);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleExplainWithAi = async () => {
    if (!activeDeck || !currentCard) return;
    setIsExplaining(true);
    setAiExplanation(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Giải thích chi tiết thuật ngữ "${currentCard.front}" với nghĩa là "${currentCard.back}". Hãy đưa ra ví dụ minh họa và mẹo ghi nhớ (mnemonics) bằng tiếng Việt.`,
          systemInstruction: "Bạn là Gia sư AI Flashcard thông minh. Hãy giải thích kiến thức một cách ngắn gọn, súc tích, dễ hiểu, có ví dụ thực tế và mẹo ghi nhớ độc đáo. Trả lời bằng Markdown gọn gàng."
        })
      });
      const data = await response.json();
      setAiExplanation(data.reply || 'Đã phân tích xong nội dung.');
    } catch (err) {
      console.error('AI Tutor Error:', err);
      setAiExplanation('Không thể kết nối với AI Tutor lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsExplaining(false);
    }
  };

  // AI Create Deck
  const handleCreateFlashcards = async () => {
    if (!aiInput.trim()) return;
    setIsAiCreating(true);
    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: aiInput,
          subject: aiSubject || 'Tổng hợp',
          title: aiTitle || 'Học phần Flashcard mới'
        })
      });
      const data = await response.json();
      if (data.deck) {
        const initializedCards = data.deck.cards.map((c: any) => ({
          ...c,
          easiness: 2.5,
          interval: 0,
          repetitions: 0,
          status: 'new',
          isStarred: false
        }));
        const newDeck: FlashcardDeck = {
          ...data.deck,
          cards: initializedCards,
          streak: 0,
          cardCount: initializedCards.length,
          remainingCount: initializedCards.length,
          goodCount: 0,
          againCount: 0
        };
        onAddDeck(newDeck);
        setActiveDeckId(newDeck.id);
        setViewMode('study');
        setActiveSubTab('flashcards');
        setIsAiModalOpen(false);
        setAiInput('');
        setAiSubject('Tiếng Anh');
        setAiTitle('');
      }
    } catch (err) {
      console.error('AI Error:', err);
    } finally {
      setIsAiCreating(false);
    }
  };

  // Manual Create Deck
  const handleCreateManualDeck = () => {
    if (!newDeckTitle.trim()) return;
    const newDeck: FlashcardDeck = {
      id: `deck_${Date.now()}`,
      title: newDeckTitle.trim(),
      subject: newDeckSubject.trim() || 'Tổng hợp',
      description: newDeckDesc.trim() || 'Bộ flashcard tự tạo.',
      cardCount: 1,
      remainingCount: 1,
      goodCount: 0,
      againCount: 0,
      createdAt: new Date().toISOString(),
      streak: 0,
      cards: [
        {
          id: `c_${Date.now()}`,
          front: 'Thuật ngữ mẫu 1',
          back: 'Định nghĩa hoặc giải thích mẫu 1.',
          hint: 'Gợi ý ghi nhớ',
          status: 'new',
          interval: 0,
          easiness: 2.5,
          repetitions: 0,
          isStarred: false
        }
      ]
    };
    onAddDeck(newDeck);
    setActiveDeckId(newDeck.id);
    setViewMode('study');
    setActiveSubTab('edit');
    setIsCreateDeckModalOpen(false);
    setNewDeckTitle('');
    setNewDeckDesc('');
  };

  // Match Game Handlers
  const handleStartMatchGame = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    const sampleCards = [...activeDeck.cards].sort(() => Math.random() - 0.5).slice(0, 6);
    const tiles: { id: string; cardId: string; type: 'front' | 'back'; text: string; isMatched: boolean }[] = [];
    sampleCards.forEach(c => {
      tiles.push({
        id: `f_${c.id}`,
        cardId: c.id,
        type: 'front',
        text: c.front,
        isMatched: false
      });
      tiles.push({
        id: `b_${c.id}`,
        cardId: c.id,
        type: 'back',
        text: c.back,
        isMatched: false
      });
    });
    setMatchTiles(tiles.sort(() => Math.random() - 0.5));
    setSelectedTileId(null);
    setMismatchedTileIds([]);
    setIsMatchWon(false);
    setMatchElapsedTime(0);
    setMatchPenaltyNotice(false);
    setMatchPlaying(true);
  };

  const handleTileClick = (tile: { id: string; cardId: string; type: 'front' | 'back'; text: string; isMatched: boolean }) => {
    if (tile.isMatched || mismatchedTileIds.length > 0) return;

    if (!selectedTileId) {
      setSelectedTileId(tile.id);
      return;
    }

    if (selectedTileId === tile.id) {
      setSelectedTileId(null);
      return;
    }

    const firstTile = matchTiles.find(t => t.id === selectedTileId);
    if (!firstTile) {
      setSelectedTileId(tile.id);
      return;
    }

    if (firstTile.cardId === tile.cardId && firstTile.type !== tile.type) {
      // Match found!
      const updated = matchTiles.map(t => 
        (t.id === firstTile.id || t.id === tile.id) ? { ...t, isMatched: true } : t
      );
      setMatchTiles(updated);
      setSelectedTileId(null);
      if (updated.every(t => t.isMatched)) {
        setIsMatchWon(true);
      }
    } else {
      // Mismatch penalty
      setMismatchedTileIds([firstTile.id, tile.id]);
      setMatchPenaltyNotice(true);
      setMatchElapsedTime(prev => +(prev + 1.0).toFixed(1));
      setTimeout(() => {
        setMismatchedTileIds([]);
        setSelectedTileId(null);
        setMatchPenaltyNotice(false);
      }, 700);
    }
  };

  // Filtered decks for catalog
  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      // Search
      const matchesSearch = searchQuery.trim() === '' || 
        deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.cards.some(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()));

      // Subject filter
      const matchesSubject = selectedSubject === 'all' || 
        deck.subject.toLowerCase().trim() === selectedSubject.toLowerCase().trim();

      // Category tab
      if (categoryFilter === 'starred') {
        const hasStarred = deck.cards.some(c => c.isStarred);
        return matchesSearch && matchesSubject && hasStarred;
      }

      return matchesSearch && matchesSubject;
    });
  }, [decks, searchQuery, selectedSubject, categoryFilter]);

  // Bulk Import
  const parsedImportCards = useMemo(() => {
    if (!importText.trim()) return [];

    // Determine card splitter
    let cardDelimiter = '\n';
    if (cardSeparator === 'semicolon') {
      cardDelimiter = ';';
    } else if (cardSeparator === 'custom') {
      cardDelimiter = customCardSep || '\n';
    }

    const rawCards = importText
      .split(cardDelimiter)
      .map(s => s.trim())
      .filter(Boolean);

    const result: { front: string; back: string; hint?: string }[] = [];

    rawCards.forEach(rawCard => {
      let front = '';
      let back = '';

      if (termDefSeparator === 'tab') {
        if (rawCard.includes('\t')) {
          const parts = rawCard.split('\t');
          front = parts[0]?.trim() || '';
          back = parts.slice(1).join('\t').trim();
        } else if (/\s{2,}/.test(rawCard)) {
          const parts = rawCard.split(/\s{2,}/);
          front = parts[0]?.trim() || '';
          back = parts.slice(1).join(' ').trim();
        } else if (rawCard.includes(' - ')) {
          const parts = rawCard.split(' - ');
          front = parts[0]?.trim() || '';
          back = parts.slice(1).join(' - ').trim();
        } else if (rawCard.includes('|')) {
          const parts = rawCard.split('|');
          front = parts[0]?.trim() || '';
          back = parts.slice(1).join('|').trim();
        }
      } else if (termDefSeparator === 'comma') {
        if (rawCard.includes(',')) {
          const firstComma = rawCard.indexOf(',');
          front = rawCard.substring(0, firstComma).trim();
          back = rawCard.substring(firstComma + 1).trim();
        }
      } else if (termDefSeparator === 'custom') {
        const sep = customTermDefSep || '-';
        if (rawCard.includes(sep)) {
          const idx = rawCard.indexOf(sep);
          front = rawCard.substring(0, idx).trim();
          back = rawCard.substring(idx + sep.length).trim();
        }
      }

      if (front && back) {
        result.push({
          front,
          back
        });
      }
    });

    return result;
  }, [importText, termDefSeparator, customTermDefSep, cardSeparator, customCardSep]);

  const handleExecuteImport = () => {
    if (!activeDeck || parsedImportCards.length === 0) return;
    const newCards: Flashcard[] = parsedImportCards.map((c, idx) => ({
      id: 'imp_' + Date.now() + '_' + idx,
      front: c.front,
      back: c.back,
      hint: c.hint,
      status: 'new',
      isStarred: false,
      easiness: 2.5,
      interval: 0,
      repetitions: 0
    }));

    const updated: FlashcardDeck = {
      ...activeDeck,
      cards: [...activeDeck.cards, ...newCards],
      cardCount: activeDeck.cards.length + newCards.length,
      remainingCount: activeDeck.remainingCount + newCards.length
    };
    onUpdateDeck(updated);
    setImportText('');
    setActiveSubTab('flashcards');
  };

  const handleUpdateDeckMetadata = () => {
    if (!activeDeck || !editDeckTitle.trim()) return;
    const updated: FlashcardDeck = {
      ...activeDeck,
      title: editDeckTitle.trim(),
      description: editDeckDesc.trim()
    };
    onUpdateDeck(updated);
  };

  const handleUpdateCardField = (cardId: string, field: 'front' | 'back', val: string) => {
    if (!activeDeck) return;
    const updatedCards = activeDeck.cards.map(c => 
      c.id === cardId ? { ...c, [field]: val } : c
    );
    onUpdateDeck({ ...activeDeck, cards: updatedCards });
  };

  const handleDeleteCard = (cardId: string) => {
    if (!activeDeck) return;
    const updatedCards = activeDeck.cards.filter(c => c.id !== cardId);
    onUpdateDeck({
      ...activeDeck,
      cards: updatedCards,
      cardCount: updatedCards.length,
      remainingCount: Math.min(activeDeck.remainingCount, updatedCards.length)
    });
  };

  const handleSwapAllCards = () => {
    if (!activeDeck) return;
    const swapped = activeDeck.cards.map(c => ({
      ...c,
      front: c.back,
      back: c.front
    }));
    onUpdateDeck({ ...activeDeck, cards: swapped });
    setMicNotice('⇄ Đã đảo vị trí Thuật ngữ và Định nghĩa!');
    setTimeout(() => setMicNotice(null), 2000);
  };

  const handleAddCardAtBottom = () => {
    if (!activeDeck) return;
    const newCard: Flashcard = {
      id: 'c_' + Date.now(),
      front: '',
      back: '',
      status: 'new',
      isStarred: false,
      easiness: 2.5,
      interval: 0,
      repetitions: 0
    };
    const updatedCards = [...activeDeck.cards, newCard];
    onUpdateDeck({
      ...activeDeck,
      cards: updatedCards,
      cardCount: updatedCards.length,
      remainingCount: activeDeck.remainingCount + 1
    });
    setEditingCardId(newCard.id);
  };

  const handleAppendSpecialChar = (cardId: string, char: string) => {
    if (!activeDeck) return;
    const card = activeDeck.cards.find(c => c.id === cardId);
    if (!card) return;
    handleUpdateCardField(cardId, 'back', (card.back || '') + char);
  };

  const handleSmartAssistAll = async () => {
    if (!activeDeck) return;
    const emptyCard = activeDeck.cards.find(c => c.front.trim() && !c.back.trim());
    if (!emptyCard) {
      setMicNotice('✨ Tất cả thẻ đã có đầy đủ định nghĩa!');
      setTimeout(() => setMicNotice(null), 2000);
      return;
    }
    setMicNotice(`✨ Đang tìm định nghĩa tự động cho "${emptyCard.front}"...`);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Dịch ngắn gọn sang tiếng Việt và đưa 1 ví dụ thực tế cho thuật ngữ: "${emptyCard.front}". Viết 1 dòng ngắn gọn súc tích.`
        })
      });
      const data = await response.json();
      if (data.reply) {
        handleUpdateCardField(emptyCard.id, 'back', data.reply.trim());
        setMicNotice('✨ Đã điền định nghĩa thông minh!');
        setTimeout(() => setMicNotice(null), 2500);
      }
    } catch {
      setMicNotice('Không thể lấy gợi ý lúc này');
      setTimeout(() => setMicNotice(null), 2000);
    }
  };

  const handleAddNewCardToDeck = () => {
    if (!activeDeck || !newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: 'c_' + Date.now(),
      front: newFront.trim(),
      back: newBack.trim(),
      hint: newHint.trim() || undefined,
      status: 'new',
      isStarred: false,
      easiness: 2.5,
      interval: 0,
      repetitions: 0
    };
    const updated: FlashcardDeck = {
      ...activeDeck,
      cards: [newCard, ...activeDeck.cards],
      cardCount: activeDeck.cardCount + 1,
      remainingCount: activeDeck.remainingCount + 1
    };
    onUpdateDeck(updated);
    setNewFront('');
    setNewBack('');
    setNewHint('');
  };

  // Learn Mode multiple-choice options generator
  const currentLearnOptions = useMemo(() => {
    if (!activeDeck || !currentCard) return [];
    const others = activeDeck.cards.filter(c => c.id !== currentCard.id).map(c => c.back);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    while (shuffledOthers.length < 3) {
      shuffledOthers.push(`Lựa chọn bổ sung ${shuffledOthers.length + 1}`);
    }
    const combined = [currentCard.back, ...shuffledOthers];
    return combined.sort(() => Math.random() - 0.5);
  }, [activeDeck, currentCard]);

  // Test Mode options map
  const testOptionsMap = useMemo(() => {
    if (!activeDeck) return {};
    const map: Record<string, string[]> = {};
    activeDeck.cards.forEach(card => {
      const others = activeDeck.cards.filter(c => c.id !== card.id).map(c => c.back);
      const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
      while (shuffledOthers.length < 3) {
        shuffledOthers.push(`Lựa chọn dự phòng ${shuffledOthers.length + 1}`);
      }
      map[card.id] = [card.back, ...shuffledOthers].sort(() => Math.random() - 0.5);
    });
    return map;
  }, [activeDeck]);

  // Live Game handlers
  const handleStartLiveGame = () => {
    setLiveUserScore(0);
    setLiveStreak(0);
    setLiveQuestionIndex(0);
    setLiveSelectedAnswer(null);
    setLiveAnswerState(null);
    setLiveCountdown(10);
    setLiveStage('playing');
  };

  useEffect(() => {
    if (liveStage === 'playing') {
      liveTimerRef.current = setInterval(() => {
        setLiveCountdown(prev => {
          if (prev <= 1) {
            clearInterval(liveTimerRef.current);
            setLiveStage('round_recap');
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [liveStage, liveQuestionIndex]);

  const handleLiveAnswer = (chosenAnswer: string) => {
    if (liveAnswerState !== null || !activeDeck) return;
    if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    const questionCard = activeDeck.cards[liveQuestionIndex] || activeDeck.cards[0];
    const isCorrect = chosenAnswer === questionCard.back;
    setLiveSelectedAnswer(chosenAnswer);
    setLiveAnswerState(isCorrect ? 'correct' : 'wrong');

    const points = isCorrect ? Math.round(750 + liveCountdown * 25 + liveStreak * 50) : 0;
    if (isCorrect) {
      setLiveUserScore(s => s + points);
      setLiveStreak(st => st + 1);
    } else {
      setLiveStreak(0);
    }

    setLivePlayers(prev => {
      const updated = prev.map(p => {
        if (p.isHost) {
          return { ...p, score: p.score + points, streak: isCorrect ? p.streak + 1 : 0, lastDelta: points };
        }
        const botGotCorrect = Math.random() > 0.35;
        const botPoints = botGotCorrect ? Math.round(600 + Math.random() * 300) : 0;
        return { ...p, score: p.score + botPoints, streak: botGotCorrect ? p.streak + 1 : 0, lastDelta: botPoints };
      });
      return updated.sort((a, b) => b.score - a.score);
    });

    setTimeout(() => {
      setLiveStage('round_recap');
    }, 1200);
  };

  const handleNextLiveQuestion = () => {
    if (!activeDeck) return;
    const maxQ = Math.min(activeDeck.cards.length, 5);
    if (liveQuestionIndex + 1 < maxQ) {
      setLiveQuestionIndex(prev => prev + 1);
      setLiveSelectedAnswer(null);
      setLiveAnswerState(null);
      setLiveCountdown(10);
      setLiveStage('playing');
    } else {
      setLiveStage('podium');
    }
  };

  const currentLiveOptions = useMemo(() => {
    if (!activeDeck) return [];
    const questionCard = activeDeck.cards[liveQuestionIndex] || activeDeck.cards[0];
    const others = activeDeck.cards.filter(c => c.id !== questionCard.id).map(c => c.back);
    const distractors = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(`Lựa chọn bổ trợ ${distractors.length + 1}`);
    }
    const combined = [
      { text: questionCard.back, symbol: '▲', color: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 border border-rose-400/40 active:scale-[0.98]', name: 'red' },
      { text: distractors[0], symbol: '◆', color: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 active:scale-[0.98]', name: 'blue' },
      { text: distractors[1], symbol: '●', color: 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 border border-amber-300/60 active:scale-[0.98]', name: 'yellow' },
      { text: distractors[2], symbol: '■', color: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40 active:scale-[0.98]', name: 'green' }
    ];
    return combined.sort(() => Math.random() - 0.5);
  }, [activeDeck, liveQuestionIndex]);

  // Color helper for deck top borders & badges based on subject
  const getSubjectColorStyles = (subject: string) => {
    const s = subject.toLowerCase().trim();
    if (s.includes('anh') || s.includes('english')) {
      return {
        topGradient: 'from-blue-600 via-indigo-600 to-violet-600',
        badgeBg: 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30',
        progressBar: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600',
        accentText: 'text-indigo-600 dark:text-indigo-400',
        glowHover: 'group-hover:shadow-[0_20px_45px_-10px_rgba(99,102,241,0.22)]'
      };
    }
    if (s.includes('toán') || s.includes('math')) {
      return {
        topGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        badgeBg: 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30',
        progressBar: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500',
        accentText: 'text-emerald-600 dark:text-emerald-400',
        glowHover: 'group-hover:shadow-[0_20px_45px_-10px_rgba(16,185,129,0.22)]'
      };
    }
    if (s.includes('sinh') || s.includes('bio')) {
      return {
        topGradient: 'from-amber-500 via-orange-500 to-rose-500',
        badgeBg: 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30',
        progressBar: 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500',
        accentText: 'text-amber-600 dark:text-amber-400',
        glowHover: 'group-hover:shadow-[0_20px_45px_-10px_rgba(245,158,11,0.22)]'
      };
    }
    return {
      topGradient: 'from-sky-500 via-blue-600 to-indigo-600',
      badgeBg: 'bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/30',
      progressBar: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600',
      accentText: 'text-sky-600 dark:text-sky-400',
      glowHover: 'group-hover:shadow-[0_20px_45px_-10px_rgba(59,130,246,0.22)]'
    };
  };

  const renderTermCard = (card: Flashcard) => {
    const cardIdx = activeDeck?.cards.findIndex(c => c.id === card.id) ?? 0;
    const isSelected = safeIndex === cardIdx;
    return (
      <div
        key={card.id}
        onClick={() => {
          const idx = activeDeck?.cards.findIndex(c => c.id === card.id) ?? 0;
          setCurrentCardIndex(idx);
          setIsFlipped(false);
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
        className={`relative bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-[#0d1629] dark:via-[#090f1e] dark:to-[#070b16] rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_15px_35px_-8px_rgba(79,70,229,0.14)] dark:hover:shadow-[0_15px_40px_-10px_rgba(2,6,23,0.9)] transition-all duration-300 cursor-pointer group border overflow-hidden ${
          isSelected
            ? 'border-indigo-500/80 dark:border-indigo-400/80 ring-2 ring-indigo-500/20'
            : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600/50'
        }`}
      >
        {/* Active glowing indicator stripe */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-violet-600 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
        )}

        {/* Ambient subtle hover glow */}
        <div className="absolute -right-20 -top-20 w-44 h-44 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

        {/* Icons Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => toggleStarCard(card.id, e)}
            className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition text-slate-400 hover:text-amber-500 cursor-pointer"
            title="Gắn sao"
          >
            <Star className={`w-4 h-4 ${card.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSpeak(card.front);
            }}
            className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            title="Phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveSubTab('edit');
            }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            title="Chỉnh sửa"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Term | Definition */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative z-10">
          {/* Term (Left) */}
          <div className="md:w-1/3">
            <h5 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words tracking-tight">
              {card.front}
            </h5>
          </div>

          {/* Divider line for desktop */}
          <div className="hidden md:block w-px bg-slate-200/80 dark:bg-slate-800 self-stretch" />

          {/* Definition (Right) */}
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed break-words">
              {card.back}
            </p>
            {card.hint && (
              <p className="text-xs italic text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <span className="font-bold not-italic px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                  Ví dụ
                </span>
                <span>{card.hint}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 pb-20 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 text-white p-6 overflow-y-auto' : ''}`}>
      {/* Toast Notice for mic speech or interactions */}
      {micNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{micNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OVERVIEW / CATALOG STATE (Matching Reference Screenshots 2, 3, 4)      */}
      {/* ========================================================================= */}
      {viewMode === 'catalog' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* TOP WIDGET: Biểu Đồ Tiến Độ Học Tập & Day Streak (Flashcard) */}
          <div className="relative bg-gradient-to-br from-white via-slate-50/60 to-indigo-50/20 dark:from-[#0b1426] dark:via-[#080e1b] dark:to-[#050912] border border-slate-200/90 dark:border-indigo-500/20 rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_-15px_rgba(15,23,42,0.08)] overflow-hidden">
            {/* Ambient decorative glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />

            {/* Header: Title + Year Switcher */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
                  <BarChart3 className="w-5 h-5 drop-shadow-xs" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Biểu Đồ Tiến Độ Học Tập & Day Streak</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                      FSRS V4
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Thống kê chuỗi ngày học thẻ, thuật toán lặp lại ngắt quãng SM-2 / FSRS và tần suất ôn tập
                  </p>
                </div>
              </div>

              {/* Year Switcher */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs">
                <button 
                  onClick={() => setHeatmapYear(y => y - 1)}
                  className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  title="Năm trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-black">{heatmapYear}</span>
                <button 
                  onClick={() => setHeatmapYear(y => y + 1)}
                  className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  title="Năm sau"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Heatmap Grid & Day Streak Card Columns */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
              {/* Left Column: Heatmap (Months Jul - Dec) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Month labels header */}
                <div className="flex justify-between text-[11px] font-bold text-slate-400 pl-8 pr-2">
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>

                {/* Heatmap 7x26 Grid with Day of week labels */}
                <div className="flex gap-2">
                  {/* Day labels (Tue, Thu, Sat) */}
                  <div className="flex flex-col justify-between py-1 text-[10px] font-semibold text-slate-400 select-none w-7 text-right pr-1">
                    <span className="opacity-0">Mon</span>
                    <span>Tue</span>
                    <span className="opacity-0">Wed</span>
                    <span>Thu</span>
                    <span className="opacity-0">Fri</span>
                    <span>Sat</span>
                    <span className="opacity-0">Sun</span>
                  </div>

                  {/* 26 Week Columns */}
                  <div className="flex-1 overflow-x-auto pb-1 no-scrollbar">
                    <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
                      {Array.from({ length: 26 * 7 }).map((_, idx) => {
                        const col = Math.floor(idx / 7);
                        const row = idx % 7;
                        const isToday = col === 18 && row === 1;
                        const isPreviousActive = (col === 17 && row === 1) || (col === 16 && row === 4) || (col === 15 && row === 2);

                        if (isToday) {
                          return (
                            <div
                              key={idx}
                              title="Hôm nay (3/11/2026): Đã hoàn thành phiên học!"
                              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[4px] bg-gradient-to-tr from-emerald-500 to-teal-400 ring-2 ring-emerald-400 ring-offset-1 flex items-center justify-center shadow-xs"
                            >
                              <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                            </div>
                          );
                        }

                        if (isPreviousActive) {
                          return (
                            <div
                              key={idx}
                              title="Đã học trong ngày"
                              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[4px] bg-gradient-to-tr from-emerald-400 to-teal-400"
                            />
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[4px] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Row under Heatmap: Freeze Pill & Legend */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-800 shadow-2xs">
                      <span>Đông 🧊 x{freezeCount} ❄️</span>
                    </span>
                  </div>

                  {/* Legend: Ít -> Nhiều */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <span>Ít</span>
                    <span className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-slate-800 inline-block" />
                    <span className="w-3 h-3 rounded-[3px] bg-[#a7f3d0] inline-block" />
                    <span className="w-3 h-3 rounded-[3px] bg-[#34d399] inline-block" />
                    <span className="w-3 h-3 rounded-[3px] bg-[#059669] inline-block" />
                    <span className="w-3 h-3 rounded-[3px] bg-gradient-to-tr from-indigo-500 to-purple-600 inline-block" />
                    <span>Nhiều</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Day Streak Card */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 border-t lg:border-t-0 lg:border-l border-amber-500/20 dark:border-amber-400/20 text-center space-y-2 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/15 dark:from-[#170e28]/80 dark:via-[#0e162d]/90 dark:to-[#081022]/95 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 border border-amber-300/40 mb-1">
                  <Flame className="w-8 h-8 fill-white text-white animate-pulse drop-shadow-sm" />
                </div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 via-orange-500 to-rose-500 drop-shadow-sm tracking-tight">
                  1
                </div>
                <div className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest">
                  DAY STREAK
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium italic max-w-[210px] leading-relaxed pt-1">
                  *Mỗi ngày trả lời đủ 25 câu hoặc hoàn thành 1 phiên học để giữ streak, ngày mới tính từ 0h giờ VN*
                </p>
              </div>
            </div>
          </div>

          {/* CATEGORY BAR: 📁 Đã tạo | 📖 Đang học (3) | ⭐ Thẻ đã gắn sao (4) + Button Tạo Bộ thẻ */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Đã tạo */}
              <button
                onClick={() => setCategoryFilter('created')}
                className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  categoryFilter === 'created'
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-blue-600 text-white shadow-md shadow-slate-900/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Folder className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                <span>Đã tạo</span>
              </button>

              {/* Đang học (3) */}
              <button
                onClick={() => setCategoryFilter('studying')}
                className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  categoryFilter === 'studying'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Đang học ({decks.length})</span>
              </button>

              {/* Thẻ đã gắn sao */}
              <button
                onClick={() => setCategoryFilter('starred')}
                className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  categoryFilter === 'starred'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/30'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>Thẻ đã gắn sao ({totalStarredAllDecks})</span>
              </button>
            </div>

            {/* Right Action: + Tạo Bộ thẻ */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsCreateDeckModalOpen(true)}
                className="px-4 py-2 rounded-2xl text-xs font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>+ Tạo Bộ thẻ</span>
              </button>

              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-4 py-2 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ Tạo bằng AI</span>
              </button>
            </div>
          </div>

          {/* SEARCH & SUBJECT FILTER ROW */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bộ từ vựng, môn học..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            {/* Subject Pills: Tất cả môn | Tiếng Anh | Toán | Sinh Học */}
            <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${
                  selectedSubject === 'all'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                Tất cả môn
              </button>

              <button
                onClick={() => setSelectedSubject('Tiếng Anh')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${
                  selectedSubject === 'Tiếng Anh'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                Tiếng Anh
              </button>

              <button
                onClick={() => setSelectedSubject('Toán')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${
                  selectedSubject === 'Toán'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                Toán
              </button>

              <button
                onClick={() => setSelectedSubject('Sinh Học')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${
                  selectedSubject === 'Sinh Học'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-amber-500/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                Sinh Học
              </button>
            </div>
          </div>

          {/* SECTION HEADING: ⊞ Bộ thẻ đang học | Xem tất cả → */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Bộ thẻ đang học</span>
            </h3>

            <button
              onClick={() => {
                setSelectedSubject('all');
                setCategoryFilter('created');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* DECK CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDecks.map(deck => {
              const styles = getSubjectColorStyles(deck.subject);
              const starredInDeck = deck.cards.filter(c => c.isStarred).length;
              const masteredCount = deck.cards.filter(c => c.status === 'mastered').length;
              const totalCards = deck.cards.length;
              const progressPct = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
              const lastStudy = deck.lastStudyDate || '2 ngày trước';

              return (
                <div
                  key={deck.id}
                  onClick={() => {
                    setActiveDeckId(deck.id);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setViewMode('study');
                    setActiveSubTab('flashcards');
                  }}
                  className={`relative bg-gradient-to-b from-white via-slate-50/40 to-slate-100/30 dark:from-[#0d1629] dark:via-[#090f1d] dark:to-[#060a14] rounded-[30px] border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400/60 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-2xl transition-all duration-300 p-6 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 overflow-hidden ${styles.glowHover}`}
                >
                  {/* Top radiant gradient stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${styles.topGradient}`} />

                  {/* Ambient hover light orb */}
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-indigo-500/10 to-transparent dark:from-indigo-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    {/* Top Row: Subject badge, Starred badge, Action icons */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${styles.badgeBg}`}>
                          {deck.subject}
                        </span>

                        {starredInDeck > 0 && (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/50 flex items-center gap-1">
                            <span>⭐</span>
                            <span>{starredInDeck} thẻ gắn sao</span>
                          </span>
                        )}
                      </div>

                      {/* Top Right Action Icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deck.cards[0]) toggleStarCard(deck.cards[0].id, e);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Gắn sao bộ thẻ"
                        >
                          <Star className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDeckId(deck.id);
                            setViewMode('study');
                            setActiveSubTab('edit');
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Chỉnh sửa bộ thẻ"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDeck(deck.id);
                          }}
                          className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-500 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
                          title="Xóa bộ thẻ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 tracking-tight">
                      {deck.title}
                    </h4>

                    {/* Progress Bar & Label */}
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 shadow-xs ${styles.progressBar}`}
                          style={{ width: `${Math.max(5, progressPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>Tiến độ ghi nhớ</span>
                        <span className="text-slate-700 dark:text-slate-200 font-extrabold">
                          {masteredCount}/{totalCards} thẻ ({progressPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Language & Last Studied */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 tracking-wider">
                        GB — VN
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[190px]">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">Học lần cuối: {lastStudy}</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer Pills: [8 thẻ] [⭐ 2 gắn sao] [👤 Văn An] */}
                  <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs relative z-10">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {totalCards} thẻ
                    </span>

                    {starredInDeck > 0 && (
                      <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 font-bold flex items-center gap-1">
                        <span>⭐</span>
                        <span>{starredInDeck} gắn sao</span>
                      </span>
                    )}

                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1 ml-auto">
                      <span>👤</span>
                      <span>Văn An</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STUDY / CARD PLAYER STATE (Matching Reference Screenshots 5, 6)        */}
      {/* ========================================================================= */}
      {viewMode === 'study' && activeDeck && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* STUDY HEADER: Back button, Badges, Title, Deck dropdown, Actions */}
          <div className="bg-gradient-to-r from-white via-indigo-50/20 to-white dark:from-[#0b1328] dark:via-[#0e1935] dark:to-[#080f22] border border-slate-200/90 dark:border-indigo-500/20 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left group: Back button, Subject badge, card count, record, Title */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setViewMode('catalog')}
                  className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer mt-0.5 shadow-2xs active:scale-95"
                  title="Quay lại danh sách bộ thẻ"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-[11px] shadow-xs">
                      {activeDeck.subject}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      {activeDeck.cards.length} thẻ ghi nhớ
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                      🏆 Kỷ lục: 18.4s
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeDeck.title}
                  </h2>
                </div>
              </div>

              {/* Right group: Deck selector dropdown, edit, trash, AI button, New deck button */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                <div className="relative">
                  <select
                    value={activeDeckId || ''}
                    onChange={(e) => {
                      if (e.target.value === '__catalog__') {
                        setViewMode('catalog');
                      } else {
                        setActiveDeckId(e.target.value);
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }
                    }}
                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm py-2.5 pl-3.5 pr-8 rounded-2xl cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 max-w-[260px] truncate shadow-2xs"
                  >
                    {decks.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.cards.length} thẻ)
                      </option>
                    ))}
                    <option value="__catalog__">📚 Quay về danh sách bộ thẻ</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={() => setActiveSubTab('edit')}
                  className="p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-2xl transition cursor-pointer shadow-2xs active:scale-95"
                  title="Chỉnh sửa bộ thẻ"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    onDeleteDeck(activeDeck.id);
                    setViewMode('catalog');
                  }}
                  className="p-2.5 text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-2xl transition cursor-pointer shadow-2xs active:scale-95"
                  title="Xóa bộ thẻ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Tạo bằng AI</span>
                </button>

                <button
                  onClick={() => setIsCreateDeckModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 transition flex items-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Bộ thẻ mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* SUB-TOOLBAR (Mode switcher & special actions) */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left modes: Flashcards | Learn | Test | Edit */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'flashcards', label: 'Flashcards', icon: Layers, gradient: 'from-blue-600 via-indigo-600 to-violet-600' },
                  { id: 'learn', label: 'Learn', icon: Radio, gradient: 'from-purple-600 via-fuchsia-600 to-pink-600' },
                  { id: 'test', label: 'Test', icon: HelpCircle, gradient: 'from-emerald-600 via-teal-600 to-cyan-600' },
                  { id: 'edit', label: 'Edit', icon: Pencil, gradient: 'from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveSubTab(tab.id as SubTab);
                        if (tab.id === 'learn') setLearnFeedback(null);
                        if (tab.id === 'test') { setTestSubmitted(false); setQuizStartTime(Date.now()); }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md shadow-indigo-600/25`
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right tools: + Import | ⚡ Ghép thẻ (Match) | ((•)) Play live games */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveSubTab('import')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    activeSubTab === 'import'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>

                <button
                  onClick={() => {
                    setActiveSubTab('match');
                    handleStartMatchGame();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    activeSubTab === 'match'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Ghép thẻ (Match)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveSubTab('live');
                    setLiveStage('lobby');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    activeSubTab === 'live'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800 hover:bg-purple-100'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Play live games</span>
                </button>
              </div>
            </div>
          </div>

          {/* SUBTAB 1: FLASHCARDS */}
          {activeSubTab === 'flashcards' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Third Row: Card Counter | Star Filter | Shuffle | Fullscreen */}
              <div className="flex items-center justify-between text-xs px-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                    Thẻ {filteredCards.length > 0 ? safeIndex + 1 : 0} / {filteredCards.length}
                  </span>

                  <button
                    onClick={() => setOnlyStarred(!onlyStarred)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer active:scale-95 ${
                      onlyStarred
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                        : 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100/60'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-white' : 'fill-amber-400 text-amber-500'}`} />
                    <span>Chỉ thẻ gắn sao ({starredCount})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <button
                    onClick={handleShuffleDeck}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
                    title="Xáo trộn thứ tự thẻ"
                  >
                    <Shuffle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>

                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
                    title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3D FLIP FLASHCARD: REVOLUTIONARY COLOR-SHIFTING EXPERIENCE */}
              {filteredCards.length > 0 && currentCard ? (
                <div className="space-y-6">
                  {/* Outer 3D Perspective Container */}
                  <div
                    onClick={() => {
                      setIsFlipped(prev => !prev);
                      if (autoPlayAudio) {
                        setTimeout(() => {
                          handleSpeak(isFlipped ? currentCard.front : currentCard.back);
                        }, 250);
                      }
                    }}
                    className={`relative perspective-1000 min-h-[480px] h-[480px] w-full cursor-pointer select-none group transition-all duration-500 hover:scale-[1.008]`}
                  >
                    {/* Inner Flipper with 3D Transform */}
                    <div className={`relative w-full h-full flip-card-transition transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* FRONT FACE (MẶT TRƯỚC: COSMIC SAPPHIRE & ELECTRIC INDIGO) */}
                      <div className="absolute inset-0 backface-hidden flashcard-surface-front rounded-[36px] p-8 sm:p-12 flex flex-col justify-between overflow-hidden">
                        {/* Ambient decorative radiant blur orbs */}
                        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-indigo-500/15 via-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse" />
                        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-tl from-cyan-400/15 via-indigo-500/10 to-transparent rounded-full blur-3xl" />

                        {/* Top row: Sliders (left) | Pill badge (center) | Star button (right) */}
                        <div className="flex items-center justify-between relative z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeak(currentCard.front);
                            }}
                            className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xs text-slate-500 hover:text-indigo-600 dark:hover:text-cyan-400 border border-slate-200/80 dark:border-slate-700/80 transition shadow-2xs active:scale-95"
                            title="Tùy chọn đọc"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          <div className="px-5 py-1.5 rounded-full border border-indigo-200/80 dark:border-cyan-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 text-indigo-700 dark:text-cyan-300 text-[10px] font-black uppercase tracking-widest shadow-2xs flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
                            <span>THUẬT NGỮ (MẶT TRƯỚC)</span>
                          </div>

                          <button
                            onClick={(e) => toggleStarCard(currentCard.id, e)}
                            className="w-10 h-10 rounded-2xl bg-amber-50/90 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Gắn sao thẻ này"
                          >
                            <Star className={`w-5 h-5 ${currentCard.isStarred ? 'fill-amber-400 text-amber-500' : 'text-amber-400'}`} />
                          </button>
                        </div>

                        {/* Center: Word */}
                        <div className="my-auto py-8 text-center max-w-2xl mx-auto space-y-4 relative z-10">
                          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-cyan-400 flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Thuật ngữ chính</span>
                          </span>
                          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight drop-shadow-xs">
                            {currentCard.front}
                          </h2>
                          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5 pt-2">
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Nhấn vào thẻ hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300">Space</kbd> để lật đổi màu</span>
                          </p>
                        </div>

                        {/* Bottom bar: Phím tắt guide (left) | Mic, Toggle, Speaker (right) */}
                        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>Phím tắt:</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">←</kbd>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">→</kbd>
                            <span>chuyển thẻ •</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Space</kbd>
                            <span>lật thẻ</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMicClick();
                              }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm cursor-pointer active:scale-95 ${
                                isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800'
                              }`}
                              title="Luyện phát âm qua Micro"
                            >
                              <Mic className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAutoPlayAudio(p => !p);
                              }}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                autoPlayAudio ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                              title={autoPlayAudio ? 'Tự động phát âm khi lật: BẬT' : 'Tự động phát âm: TẮT'}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  autoPlayAudio ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpeak(currentCard.front);
                              }}
                              className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                              title="Phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* BACK FACE (MẶT SAU - ĐỔI MÀU SANG TRỌNG: SUNSET AMETHYST & ROYAL GOLD) */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 flashcard-surface-back rounded-[36px] p-8 sm:p-12 flex flex-col justify-between overflow-y-auto">
                        {/* Ambient decorative radiant blur orbs (Warm Sunset Amethyst & Gold) */}
                        <div className="pointer-events-none absolute -top-32 -right-32 w-88 h-88 bg-gradient-to-br from-amber-400/20 via-rose-500/15 to-transparent rounded-full blur-3xl animate-pulse" />
                        <div className="pointer-events-none absolute -bottom-32 -left-32 w-88 h-88 bg-gradient-to-tr from-fuchsia-600/20 via-purple-500/15 to-transparent rounded-full blur-3xl" />

                        {/* Top row: Sliders (left) | Pill badge (center) | Star button (right) */}
                        <div className="flex items-center justify-between relative z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeak(currentCard.back);
                            }}
                            className="p-2.5 rounded-2xl bg-white/70 dark:bg-purple-950/60 backdrop-blur-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 border border-amber-200/80 dark:border-purple-800 transition shadow-2xs active:scale-95"
                            title="Tùy chọn đọc"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          <div className="px-5 py-1.5 rounded-full border border-amber-300/80 dark:border-purple-400/40 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-black uppercase tracking-widest shadow-2xs flex items-center gap-1.5">
                            <Trophy className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                            <span>ĐỊNH NGHĨA (MẶT SAU • ĐÃ ĐỔI MÀU)</span>
                          </div>

                          <button
                            onClick={(e) => toggleStarCard(currentCard.id, e)}
                            className="w-10 h-10 rounded-2xl bg-amber-100/80 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-500 flex items-center justify-center hover:bg-amber-200 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Gắn sao thẻ này"
                          >
                            <Star className={`w-5 h-5 ${currentCard.isStarred ? 'fill-amber-400 text-amber-500' : 'text-amber-400'}`} />
                          </button>
                        </div>

                        {/* Center: Meaning & AI explanation */}
                        <div className="my-auto py-8 text-center max-w-2xl mx-auto space-y-4 relative z-10">
                          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>Nội dung định nghĩa chuẩn</span>
                          </span>

                          <p className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-amber-50 leading-relaxed tracking-tight">
                            {currentCard.back}
                          </p>

                          {currentCard.hint && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100/70 dark:bg-purple-950/40 border border-amber-300/80 dark:border-purple-800/60 text-xs text-amber-900 dark:text-amber-200 font-medium">
                              <span className="font-black text-amber-600 dark:text-amber-400">Ví dụ:</span>
                              <span>{currentCard.hint}</span>
                            </div>
                          )}

                          {/* AI Explain button & result */}
                          {!aiExplanation && (
                            <div className="pt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExplainWithAi();
                                }}
                                disabled={isExplaining}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-purple-600/25 active:scale-95 transition-all"
                              >
                                {isExplaining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                <span>{isExplaining ? 'Gia sư AI đang giải thích...' : '✨ Nhờ Gia sư AI giải thích thêm'}</span>
                              </button>
                            </div>
                          )}

                          {aiExplanation && (
                            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-purple-50/80 dark:from-purple-950/50 dark:to-amber-950/40 border border-amber-300/60 dark:border-purple-700/60 text-left text-xs text-slate-800 dark:text-amber-100 animate-in fade-in shadow-sm">
                              <span className="font-bold text-purple-700 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" /> Gia sư AI giải thích:
                              </span>
                              <p className="leading-relaxed">{aiExplanation}</p>
                            </div>
                          )}
                        </div>

                        {/* Bottom bar inside back card */}
                        <div className="pt-4 border-t border-amber-200/80 dark:border-purple-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-amber-200/70 relative z-10">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>Phím tắt:</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-purple-900/60 text-[11px] font-bold border border-amber-200 dark:border-purple-800 text-amber-900 dark:text-amber-200">←</kbd>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-purple-900/60 text-[11px] font-bold border border-amber-200 dark:border-purple-800 text-amber-900 dark:text-amber-200">→</kbd>
                            <span>chuyển •</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-purple-900/60 text-[11px] font-bold border border-amber-200 dark:border-purple-800 text-amber-900 dark:text-amber-200">Space</kbd>
                            <span>lật lại</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMicClick();
                              }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm cursor-pointer active:scale-95 ${
                                isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-900 dark:bg-purple-900 text-white hover:bg-slate-800'
                              }`}
                              title="Luyện phát âm qua Micro"
                            >
                              <Mic className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAutoPlayAudio(p => !p);
                              }}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                autoPlayAudio ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                              title={autoPlayAudio ? 'Tự động phát âm khi lật: BẬT' : 'Tự động phát âm: TẮT'}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  autoPlayAudio ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpeak(currentCard.back);
                              }}
                              className="w-9 h-9 rounded-full bg-white/80 dark:bg-purple-950/70 text-amber-800 dark:text-amber-200 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-purple-900 border border-amber-200 dark:border-purple-800 flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                              title="Phát âm định nghĩa"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS: < Thẻ trước | Xem đáp án ↺ (Dynamic Color Shift) | Thẻ tiếp > */}
                  <div className="flex items-center justify-between w-full pt-2">
                    <button
                      onClick={handlePrevCard}
                      className="px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Thẻ trước</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsFlipped(prev => !prev);
                        if (autoPlayAudio) {
                          setTimeout(() => {
                            handleSpeak(isFlipped ? currentCard.front : currentCard.back);
                          }, 250);
                        }
                      }}
                      className={`px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm text-white shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2.5 ${
                        isFlipped
                          ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-amber-500 shadow-fuchsia-500/25 ring-2 ring-amber-400/40'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-indigo-500/25 ring-2 ring-indigo-400/40'
                      }`}
                    >
                      <span>{isFlipped ? 'Xem thuật ngữ (Mặt trước)' : 'Xem đáp án (Lật thẻ)'}</span>
                      <RotateCcw className={`w-4 h-4 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      onClick={handleNextCard}
                      className="px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>Thẻ tiếp</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* SUB-PROGRESS & RATING BAR (Spaced Repetition / FSRS) */}
                  <div className="bg-white/90 dark:bg-[#0c1424]/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-[26px] p-2 flex items-center justify-between shadow-sm mt-4">
                    {/* Left: Tiến độ button */}
                    <button
                      onClick={() => setViewMode('catalog')}
                      className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                    >
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span>Tiến độ</span>
                    </button>

                    {/* Center: [X] Thẻ 1 / 8 [✓] */}
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => handleRateCard(1)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Chưa thuộc (Nhắc lại ngay)"
                      >
                        <X className="w-5 h-5 drop-shadow-xs" />
                      </button>

                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono">
                        Thẻ {filteredCards.length > 0 ? safeIndex + 1 : 0} / {filteredCards.length}
                      </span>

                      <button
                        onClick={() => handleRateCard(5)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Đã thuộc thành thạo (FSRS +Interval)"
                      >
                        <Check className="w-5 h-5 drop-shadow-xs" />
                      </button>
                    </div>

                    {/* Right: Shuffle button */}
                    <button
                      onClick={handleShuffleDeck}
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer shadow-2xs active:scale-95"
                      title="Xáo trộn thứ tự thẻ"
                    >
                      <Shuffle className="w-4 h-4 text-indigo-500" />
                    </button>
                  </div>

                  {/* SECTION: THUẬT NGỮ TRONG HỌC PHẦN (Matching image_2c95f478.png) */}
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
                    {/* Header: Terms in this set + Your stats dropdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          Terms in this set <span className="text-slate-400 font-bold text-sm">({activeDeck.cards.length})</span>
                        </h3>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setIsStatsDropdownOpen(!isStatsDropdownOpen)}
                          className="px-4 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
                        >
                          <span>{statsView === 'original' ? 'Original' : statsView === 'alphabetical' ? 'Alphabetical' : 'Your stats'}</span>
                          <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform duration-200 ${isStatsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isStatsDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xl z-20 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                            {[
                              { id: 'original', label: 'Original' },
                              { id: 'alphabetical', label: 'Alphabetical' },
                              { id: 'stats', label: 'Your stats' }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setStatsView(opt.id as any);
                                  setIsStatsDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-xs font-bold transition flex items-center justify-between ${
                                  statsView === opt.id
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                              >
                                <span>{opt.label}</span>
                                {statsView === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Groups Rendering */}
                    <div className="space-y-10">
                      {(() => {
                        let baseCards = [...activeDeck.cards].filter(card => {
                          const matchesSearch = !termSearchQuery.trim() || 
                            card.front.toLowerCase().includes(termSearchQuery.toLowerCase()) || 
                            card.back.toLowerCase().includes(termSearchQuery.toLowerCase());
                          const matchesStarred = !onlyStarred || card.isStarred;
                          return matchesSearch && matchesStarred;
                        });

                        if (statsView === 'alphabetical') {
                          baseCards.sort((a, b) => a.front.localeCompare(b.front));
                        }

                        if (statsView === 'stats') {
                          const learning = baseCards.filter(c => c.status !== 'mastered');
                          const mastered = baseCards.filter(c => c.status === 'mastered');
                          
                          return (
                            <>
                              {/* Still learning group */}
                              {learning.length > 0 && (
                                <div className="space-y-4">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                                        Still learning ({learning.length})
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                      You've started learning these terms. Keep it up!
                                    </p>
                                  </div>
                                  <div className="space-y-3">
                                    {learning.map((card) => renderTermCard(card))}
                                  </div>
                                </div>
                              )}

                              {/* Mastered group */}
                              {mastered.length > 0 && (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                                          Mastered ({mastered.length})
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        You've been getting these terms right!
                                      </p>
                                    </div>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                      <span>Select these {mastered.length}</span>
                                    </button>
                                  </div>
                                  <div className="space-y-3">
                                    {mastered.map((card) => renderTermCard(card))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        }

                        // Original View
                        return (
                          <div className="space-y-3">
                            {baseCards.map((card) => renderTermCard(card))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                    <Star className="w-8 h-8 fill-amber-500 drop-shadow-xs" />
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Chưa có thẻ nào được gắn sao
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hãy bấm vào biểu tượng ngôi sao trên bất kỳ thẻ nào để đánh dấu các thuật ngữ cần ôn tập đặc biệt.
                  </p>
                  <button
                    onClick={() => setOnlyStarred(false)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Xem tất cả thẻ ({activeDeck.cards.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: LEARN MODE */}
          {activeSubTab === 'learn' && currentCard && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in shadow-xl shadow-slate-200/40 dark:shadow-black/40">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Chế độ Học thích ứng (Learn)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chọn định nghĩa tương ứng với thuật ngữ dưới đây</p>
                  </div>
                </div>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 px-3.5 py-1.5 rounded-xl font-mono shadow-xs">
                  Câu {safeIndex + 1} / {filteredCards.length}
                </span>
              </div>

              {/* Radiant Question Surface */}
              <div className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 text-center space-y-3 shadow-2xl shadow-indigo-950/30">
                <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <span className="relative z-10 inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                  ĐÂU LÀ NGHĨA CHÍNH XÁC CỦA THUẬT NGỮ:
                </span>
                <h2 className="relative z-10 text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                  {currentCard.front}
                </h2>
              </div>

              {learnFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
                  learnFeedback.isCorrect
                    ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-rose-500/10 to-pink-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {learnFeedback.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm">{learnFeedback.message}</span>
                  </div>
                  <button
                    onClick={() => {
                      setLearnFeedback(null);
                      handleNextCard();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Câu tiếp →
                  </button>
                </div>
              )}

              {/* Radiant Multiple Choice Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentLearnOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (opt === currentCard.back) {
                        handleRateCard(5);
                        setLearnFeedback({ isCorrect: true, message: 'Chính xác! Trí nhớ của bạn rất xuất sắc.' });
                      } else {
                        handleRateCard(0);
                        setLearnFeedback({ isCorrect: false, message: `Chưa chính xác! Đáp án đúng: ${currentCard.back}` });
                      }
                    }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 text-left text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-500 hover:bg-gradient-to-r hover:from-indigo-50/40 hover:to-purple-50/40 dark:hover:from-indigo-950/30 dark:hover:to-purple-950/30 transition-all duration-200 flex items-start gap-3.5 cursor-pointer group shadow-sm hover:shadow-md hover:shadow-indigo-500/10 active:scale-[0.99]"
                  >
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-gradient-to-tr group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 transition-all shadow-2xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug pt-1 text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {opt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 3: TEST MODE */}
          {activeSubTab === 'test' && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
              {!testSubmitted ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Bài kiểm tra tổng hợp</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kiểm tra khả năng ghi nhớ toàn bộ học phần</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTestSubmitted(true);
                        setQuizEndTime(Date.now());
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                    >
                      Nộp bài thi
                    </button>
                  </div>

                  <div className="space-y-6 max-w-3xl mx-auto">
                    {activeDeck.cards.map((card, qIdx) => (
                      <div key={card.id} className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-md font-mono">
                            CÂU {qIdx + 1}
                          </span>
                        </div>
                        <p className="text-base font-extrabold text-slate-900 dark:text-white">{card.front}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(testOptionsMap[card.id] || []).map((ans, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                testAnswers[qIdx] === optIdx
                                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm'
                                  : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`test_${qIdx}`}
                                checked={testAnswers[qIdx] === optIdx}
                                onChange={() => setTestAnswers({ ...testAnswers, [qIdx]: optIdx })}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className="leading-snug">{ans}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 shadow-lg shadow-emerald-500/10">
                    <Trophy className="w-8 h-8 drop-shadow-xs" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Hoàn thành bài kiểm tra!</h3>
                  <p className="text-xs text-slate-500 font-medium">Thời gian hoàn tất: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{Math.max(1, Math.round((quizEndTime - quizStartTime) / 1000))}</span> giây</p>
                  <button
                    onClick={() => {
                      setTestSubmitted(false);
                      setTestAnswers({});
                      setQuizStartTime(Date.now());
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    Làm lại bài kiểm tra
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 4: EDIT DECK & CARDS (Matching Image 3 & Image 4) */}
          {activeSubTab === 'edit' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* TOP HEADER: < Back to set | Done (Image 3) */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateDeckMetadata();
                    setActiveSubTab('flashcards');
                  }}
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base hover:underline cursor-pointer group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to set</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleUpdateDeckMetadata();
                    setActiveSubTab('flashcards');
                  }}
                  className="px-7 py-2.5 rounded-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold text-sm transition shadow-sm hover:shadow cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Status Row: 🌐 Public | Saved just now (Image 3) */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Public</span>
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Saved just now
                </span>
              </div>

              {/* Title Input Card (Image 3) */}
              <div className="bg-[#f6f7fb] dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition shadow-2xs">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editDeckTitle}
                  onChange={(e) => {
                    setEditDeckTitle(e.target.value);
                    if (activeDeck) {
                      onUpdateDeck({ ...activeDeck, title: e.target.value });
                    }
                  }}
                  placeholder="Title of set..."
                  className="w-full bg-transparent text-base sm:text-lg font-black text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Description Input Card (Image 3) */}
              <div className="bg-[#f6f7fb] dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition shadow-2xs">
                <input
                  type="text"
                  value={editDeckDesc}
                  onChange={(e) => {
                    setEditDeckDesc(e.target.value);
                    if (activeDeck) {
                      onUpdateDeck({ ...activeDeck, description: e.target.value });
                    }
                  }}
                  placeholder="Add a description..."
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none"
                />
              </div>

              {/* Toolbar Row (Image 3) */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                {/* Left Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('import')}
                    className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Import</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMicNotice('Tính năng sơ đồ (Add diagram) yêu cầu gói nâng cao');
                      setTimeout(() => setMicNotice(null), 2500);
                    }}
                    className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add diagram</span>
                    <span className="w-4 h-4 rounded bg-amber-400 text-slate-900 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSmartAssistAll}
                    className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 transition cursor-pointer shadow-2xs group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span>Smart Assist</span>
                  </button>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Suggestions</span>
                    <button
                      type="button"
                      onClick={() => setSuggestionsEnabled(p => !p)}
                      className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        suggestionsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                          suggestionsEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Search Icon */}
                  <button
                    type="button"
                    onClick={() => setShowEditSearch(p => !p)}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                    title="Tìm kiếm thẻ"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Swap Icon */}
                  <button
                    type="button"
                    onClick={handleSwapAllCards}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                    title="Hoán đổi Thuật ngữ ⇄ Định nghĩa"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>

                  {/* Keyboard Shortcuts */}
                  <button
                    type="button"
                    onClick={() => setKeyboardModalOpen(true)}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                    title="Phím tắt bàn phím"
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>

                  {/* Delete All (Red Circle) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa tất cả thẻ trong học phần này không?')) {
                        onUpdateDeck({ ...activeDeck, cards: [], cardCount: 0, remainingCount: 0 });
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-[#dc2626] hover:bg-rose-700 text-white flex items-center justify-center transition shadow-xs cursor-pointer"
                    title="Xóa tất cả các thẻ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Optional Search Filter */}
              {showEditSearch && (
                <div className="relative animate-in fade-in">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editSearchQuery}
                    onChange={(e) => setEditSearchQuery(e.target.value)}
                    placeholder="Lọc danh sách thẻ đang chỉnh sửa..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              )}

              {/* Cards List (Image 3 & Image 4) */}
              <div className="space-y-4">
                {activeDeck.cards
                  .filter(c => !editSearchQuery.trim() || c.front.toLowerCase().includes(editSearchQuery.toLowerCase()) || c.back.toLowerCase().includes(editSearchQuery.toLowerCase()))
                  .map((card, idx) => {
                    const isCurrentFocused = editingCardId === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={() => setEditingCardId(card.id)}
                        className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4 transition-all ${
                          isCurrentFocused ? 'ring-2 ring-indigo-500/50 shadow-md' : 'hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Header: Number on Left | Drag & Delete on Right */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                          <span className="text-base font-black text-slate-700 dark:text-slate-300">
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab p-1"
                              title="Kéo thả vị trí"
                            >
                              <GripHorizontal className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(card.id);
                              }}
                              className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                              title="Xóa thẻ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Floating Toolbar when focused/active (Image 4!) */}
                        {isCurrentFocused && (
                          <div className="flex justify-center -mt-1 pb-1">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#fef3c7] dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-slate-700 dark:text-slate-200 shadow-2xs animate-in fade-in">
                              <button
                                type="button"
                                onClick={() => handleUpdateCardField(card.id, 'front', card.front.toUpperCase())}
                                className="hover:text-amber-600 font-black text-xs px-1"
                                title="Viết hoa"
                              >
                                A
                              </button>
                              <span
                                className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-blue-400 inline-block"
                                title="Bảng màu"
                              />
                              <button
                                type="button"
                                onClick={() => handleSpeak(card.front || card.back)}
                                className="hover:text-indigo-600 transition"
                                title="Phát âm"
                              >
                                <Mic className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-4 h-4 rounded bg-amber-400 text-slate-900 flex items-center justify-center">
                                <Lock className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Main Inputs Row */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4">
                          {/* Left Image Placeholder */}
                          <button
                            type="button"
                            onClick={() => {
                              setMicNotice('🖼️ Bạn có thể thêm link ảnh hoặc tạo bằng AI');
                              setTimeout(() => setMicNotice(null), 2500);
                            }}
                            className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 flex flex-col items-center justify-center gap-1 transition shrink-0 cursor-pointer"
                            title="Thêm hình ảnh cho Thuật ngữ"
                          >
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[10px] font-bold">Image</span>
                          </button>

                          {/* Term Input */}
                          <div className="flex-1 space-y-1">
                            <div className="bg-[#f6f7fb] dark:bg-slate-800/60 rounded-xl p-3 border-b-2 border-slate-300 dark:border-slate-700 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition">
                              <input
                                type="text"
                                value={card.front}
                                onFocus={() => setEditingCardId(card.id)}
                                onChange={(e) => handleUpdateCardField(card.id, 'front', e.target.value)}
                                placeholder="Nhập thuật ngữ..."
                                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
                              />
                            </div>
                            <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              <span>TERM</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">ENGLISH</span>
                            </div>
                          </div>

                          {/* Definition Input */}
                          <div className="flex-1 space-y-1">
                            <div className="bg-[#f6f7fb] dark:bg-slate-800/60 rounded-xl p-3 border-b-2 border-slate-300 dark:border-slate-700 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition relative">
                              <textarea
                                rows={2}
                                value={card.back}
                                onFocus={() => setEditingCardId(card.id)}
                                onChange={(e) => handleUpdateCardField(card.id, 'back', e.target.value)}
                                placeholder="Nhập định nghĩa, câu ví dụ..."
                                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none resize-none pr-4"
                              />
                              <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="px-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              <span>DEFINITION</span>
                            </div>

                            {/* Vietnamese Accent Buttons Bar (Image 4!) */}
                            {isCurrentFocused && (
                              <div className="flex items-center gap-1.5 pt-2 overflow-x-auto pb-1 no-scrollbar animate-in fade-in">
                                {['á', 'â', 'ă', 'đ', 'ê', 'ô', 'ơ', 'ư', '^'].map((char) => (
                                  <button
                                    key={char}
                                    type="button"
                                    onClick={() => handleAppendSpecialChar(card.id, char === '^' ? '' : char)}
                                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer shrink-0 shadow-2xs"
                                  >
                                    {char}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right Image Placeholder */}
                          <button
                            type="button"
                            onClick={() => {
                              setMicNotice('🖼️ Bạn có thể thêm link ảnh hoặc tạo bằng AI');
                              setTimeout(() => setMicNotice(null), 2500);
                            }}
                            className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 flex flex-col items-center justify-center gap-1 transition shrink-0 cursor-pointer"
                            title="Thêm hình ảnh cho Định nghĩa"
                          >
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[10px] font-bold">Image</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Bottom "+ Add card" Button (Image 3 & Image 4) */}
              <button
                type="button"
                onClick={handleAddCardAtBottom}
                className="w-full py-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-5 h-5" />
                <span>+ THÊM THẺ MỚI (ADD CARD)</span>
              </button>

              {/* Bottom Done Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateDeckMetadata();
                    setActiveSubTab('flashcards');
                  }}
                  className="px-8 py-3 rounded-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Keyboard Shortcuts Modal */}
              {keyboardModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-indigo-600" />
                        <span>Phím tắt chỉnh sửa thẻ</span>
                      </h4>
                      <button
                        onClick={() => setKeyboardModalOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span>Chuyển giữa các ô nhập</span>
                        <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold">Tab</kbd>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span>Thêm thẻ mới tiếp theo</span>
                        <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold">Tab ở ô cuối</kbd>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span>Lưu & hoàn tất chỉnh sửa</span>
                        <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold">Ctrl + Enter</kbd>
                      </div>
                    </div>
                    <button
                      onClick={() => setKeyboardModalOpen(false)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 5: IMPORT (Quizlet Style - image_58c0afc0.png) */}
          {activeSubTab === 'import' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              {/* Header: Title + Subtitle on Left | Close X on Right */}
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">Import your data.</span>{' '}
                  <span className="text-slate-600 dark:text-slate-400 font-normal">
                    Copy and Paste your data here (from Word, Excel, Google Docs, etc.)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('flashcards')}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Word 1\tDefinition 1\nWord 2\tDefinition 2\nWord 3\tDefinition 3`}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed font-mono"
                />
              </div>

              {/* Two Column Separator Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-1">
                {/* Column 1: Between term and definition */}
                <div className="space-y-3.5">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Between term and definition</div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <input
                        type="radio"
                        name="termDefSeparator"
                        checked={termDefSeparator === 'tab'}
                        onChange={() => setTermDefSeparator('tab')}
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                        Tab
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <input
                        type="radio"
                        name="termDefSeparator"
                        checked={termDefSeparator === 'comma'}
                        onChange={() => setTermDefSeparator('comma')}
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                        Comma
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          type="radio"
                          name="termDefSeparator"
                          checked={termDefSeparator === 'custom'}
                          onChange={() => setTermDefSeparator('custom')}
                          className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                      <input
                        type="text"
                        value={customTermDefSep}
                        onFocus={() => setTermDefSeparator('custom')}
                        onChange={(e) => {
                          setCustomTermDefSep(e.target.value);
                          setTermDefSeparator('custom');
                        }}
                        placeholder="Custom"
                        className="w-44 px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Between cards */}
                <div className="space-y-3.5">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Between cards</div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <input
                        type="radio"
                        name="cardSeparator"
                        checked={cardSeparator === 'newline'}
                        onChange={() => setCardSeparator('newline')}
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                        New line
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <input
                        type="radio"
                        name="cardSeparator"
                        checked={cardSeparator === 'semicolon'}
                        onChange={() => setCardSeparator('semicolon')}
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                        Semicolon
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center cursor-pointer select-none">
                        <input
                          type="radio"
                          name="cardSeparator"
                          checked={cardSeparator === 'custom'}
                          onChange={() => setCardSeparator('custom')}
                          className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                      <input
                        type="text"
                        value={customCardSep}
                        onFocus={() => setCardSeparator('custom')}
                        onChange={(e) => {
                          setCustomCardSep(e.target.value);
                          setCardSeparator('custom');
                        }}
                        placeholder="Custom"
                        className="w-44 px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-2 pt-2">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  Preview <span className="font-normal text-xs text-slate-500 dark:text-slate-400">{parsedImportCards.length} cards</span>
                </div>

                {parsedImportCards.length === 0 ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400 py-1">
                    Nothing to preview yet.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 divide-y divide-slate-200/60 dark:divide-slate-800">
                    {parsedImportCards.map((c, i) => (
                      <div key={i} className="flex items-start gap-4 pt-2.5 first:pt-0 text-xs">
                        <span className="w-6 text-slate-400 font-mono font-bold shrink-0">{i + 1}</span>
                        <div className="w-1/2 font-bold text-slate-900 dark:text-white break-words pr-2">
                          {c.front}
                        </div>
                        <div className="w-1/2 text-slate-600 dark:text-slate-300 break-words">
                          {c.back}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setImportText('');
                    setActiveSubTab('flashcards');
                  }}
                  className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel Import
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={parsedImportCards.length === 0}
                  className={`px-6 py-2.5 rounded-full font-bold text-xs transition shadow-xs ${
                    parsedImportCards.length > 0
                      ? 'bg-[#3b82f6] hover:bg-blue-600 text-white cursor-pointer'
                      : 'bg-[#f0f2f5] dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  Import
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB 6: MATCH GAME */}
          {activeSubTab === 'match' && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 min-h-[440px] flex flex-col justify-between shadow-xl shadow-slate-200/40 dark:shadow-black/40">
              {!matchPlaying ? (
                <div className="text-center my-auto py-10 space-y-5 max-w-md mx-auto">
                  <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25">
                    <Zap className="w-9 h-9 drop-shadow-sm fill-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Trò chơi Ghép thẻ (Match)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ghép các cặp thuật ngữ và định nghĩa tương ứng nhanh nhất có thể để xác lập kỷ lục!
                    </p>
                  </div>
                  <button
                    onClick={handleStartMatchGame}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
                  >
                    Bắt đầu chơi ngay →
                  </button>
                </div>
              ) : isMatchWon ? (
                <div className="text-center my-auto py-10 space-y-5 max-w-md mx-auto">
                  <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                    <Trophy className="w-9 h-9 drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">Chiến thắng xuất sắc!</h3>
                    <p className="text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mt-1">
                      {matchElapsedTime}s
                    </p>
                  </div>
                  <button
                    onClick={handleStartMatchGame}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    Chơi lại vòng mới
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Thời gian: {matchElapsedTime}s</span>
                    </span>
                    <button 
                      onClick={() => setMatchPlaying(false)} 
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition cursor-pointer"
                    >
                      Thoát trò chơi
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {matchTiles.map((tile) => {
                      if (tile.isMatched) {
                        return <div key={tile.id} className="h-24 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 opacity-40 transition-opacity" />;
                      }
                      const isSel = selectedTileId === tile.id;
                      const isBad = mismatchedTileIds.includes(tile.id);
                      return (
                        <button
                          key={tile.id}
                          onClick={() => handleTileClick(tile)}
                          className={`h-24 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center text-center transition-all duration-200 cursor-pointer shadow-xs hover:scale-102 active:scale-95 ${
                            isBad
                              ? 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/70 dark:to-pink-950/70 border-rose-500 text-rose-600 ring-2 ring-rose-500/50 shadow-md shadow-rose-500/20'
                              : isSel
                              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/80 dark:to-purple-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500 shadow-md shadow-indigo-500/25 scale-102'
                              : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-indigo-400 hover:shadow-md'
                          }`}
                        >
                          <span className="line-clamp-3 leading-snug">{tile.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 7: LIVE GAME */}
          {activeSubTab === 'live' && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 min-h-[440px] flex flex-col justify-between shadow-xl shadow-slate-200/40 dark:shadow-black/40">
              {liveStage === 'lobby' ? (
                <div className="text-center my-auto py-8 space-y-6 max-w-md mx-auto">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/15 via-fuchsia-500/15 to-pink-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-black uppercase tracking-wider">
                    ĐẤU TRƯỜNG LIVE
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Phòng đấu trực tiếp</h3>
                  <div className="p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-2 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
                    <span className="text-[10px] uppercase text-purple-300 font-black tracking-widest">MÃ PIN PHÒNG THI</span>
                    <p className="text-4xl sm:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                      839-204
                    </p>
                  </div>
                  <button
                    onClick={handleStartLiveGame}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
                  >
                    Bắt đầu trận đấu
                  </button>
                </div>
              ) : liveStage === 'playing' ? (
                <div className="space-y-6 max-w-2xl mx-auto w-full my-auto">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                      Đếm ngược: {liveCountdown}s
                    </span>
                    <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-mono font-black text-sm">
                      {liveUserScore} điểm
                    </span>
                  </div>
                  <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white text-center border border-indigo-500/20 shadow-2xl">
                    <h3 className="text-2xl sm:text-3xl font-black">{activeDeck.cards[liveQuestionIndex]?.front}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {currentLiveOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleLiveAnswer(opt.text)}
                        className={`p-5 rounded-2xl font-bold text-sm text-left flex items-center gap-3.5 cursor-pointer ${opt.color}`}
                      >
                        <span className="text-xl drop-shadow-xs">{opt.symbol}</span>
                        <span className="leading-snug">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center my-auto py-8 space-y-5 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 shadow-lg shadow-amber-500/15">
                    <Crown className="w-8 h-8 drop-shadow-xs" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Kết quả trận đấu</h3>
                    <p className="font-mono text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mt-1">
                      {liveUserScore} điểm
                    </p>
                  </div>
                  <button
                    onClick={() => setLiveStage('lobby')}
                    className="px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black shadow-lg shadow-purple-500/25 active:scale-95 transition cursor-pointer"
                  >
                    Chơi lại
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: + Tạo Bộ thẻ mới                                                */}
      {/* ========================================================================= */}
      {isCreateDeckModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Tạo Bộ thẻ mới
                </h3>
              </div>
              <button onClick={() => setIsCreateDeckModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Môn học</label>
                <select
                  value={newDeckSubject}
                  onChange={(e) => setNewDeckSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Toán">Toán</option>
                  <option value="Sinh Học">Sinh Học</option>
                  <option value="Vật lí">Vật lí</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Địa lí">Địa lí</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tiêu đề Bộ thẻ</label>
                <input
                  type="text"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="Ví dụ: Từ vựng Chuyên đề Môi trường C1"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={3}
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="Mô tả mục tiêu học tập của bộ thẻ này..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none resize-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateManualDeck}
                disabled={!newDeckTitle.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
              >
                Tạo và thêm thẻ ngay
              </button>
              <button
                onClick={() => setIsCreateDeckModalOpen(false)}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: ✨ Tạo bằng AI                                                  */}
      {/* ========================================================================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Sinh Bộ thẻ tự động bằng AI</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Môn học</label>
                  <input
                    type="text"
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    placeholder="Tiếng Anh, Toán, Sinh..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tên bộ thẻ</label>
                  <input
                    type="text"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    placeholder="Tên học phần..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Dán nội dung tài liệu / Ghi chú</label>
                <textarea
                  rows={6}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Dán đoạn văn bản SGK, ghi chú bài giảng hoặc từ vựng vào đây để AI tự động trích xuất các cặp thuật ngữ - định nghĩa..."
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none resize-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateFlashcards}
                disabled={isAiCreating || !aiInput.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                {isAiCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isAiCreating ? 'Đang phân tích & tạo thẻ...' : 'Trích xuất & Tạo bộ thẻ ngay'}</span>
              </button>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
