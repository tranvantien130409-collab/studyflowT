import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  Send, 
  RotateCcw, 
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ExamItem, QuestionItem, ExamSubmission } from '../types';
import { pad } from '../data/initialData';
import { playChime } from '../utils/audio';

interface TakeExamModalProps {
  exam: ExamItem | null;
  onClose: () => void;
  onSubmitResult: (submission: ExamSubmission) => void;
}

export const TakeExamModal: React.FC<TakeExamModalProps> = ({
  exam,
  onClose,
  onSubmitResult
}) => {
  if (!exam) return null;

  const totalQuestions = exam.questions.length;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);

  // Timer Countdown
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const currentQ: QuestionItem | undefined = exam.questions[currentIdx];

  const handleSelectOption = (optionIdx: number) => {
    if (isSubmitted || !currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIdx
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlagged((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id]
    }));
  };

  const handleSubmitExam = () => {
    if (isSubmitted) return;

    // Calculate score
    let correct = 0;
    exam.questions.forEach((q) => {
      if (answers[q.id] === q.correctOption) {
        correct += 1;
      }
    });

    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 10 * 10) / 10 : 0;
    const timeSpent = exam.durationMinutes * 60 - secondsLeft;

    const submission: ExamSubmission = {
      id: Date.now(),
      examId: exam.id,
      examTitle: exam.title,
      studentName: 'Trần Văn Tiến',
      score,
      correctCount: correct,
      totalQuestions,
      submittedAt: new Date().toLocaleString('vi-VN'),
      timeSpentSeconds: timeSpent,
      answers
    };

    setSubmissionResult(submission);
    setIsSubmitted(true);
    onSubmitResult(submission);
    playChime(score >= 5);
  };

  const answeredCount = Object.keys(answers).length;
  const timerMin = Math.floor(secondsLeft / 60);
  const timerSec = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              ĐỀ
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {exam.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {exam.subject} • Thời gian: {exam.durationMinutes} phút • {totalQuestions} câu hỏi
              </p>
            </div>
          </div>

          {/* Right Controls: Timer & Submit button */}
          <div className="flex items-center gap-3">
            {!isSubmitted ? (
              <>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                  secondsLeft <= 300 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>{pad(timerMin)}:{pad(timerSec)}</span>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Bạn đã làm ${answeredCount}/${totalQuestions} câu. Bạn có chắc chắn muốn nộp bài không?`)) {
                      handleSubmitExam();
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Nộp bài</span>
                </button>
              </>
            ) : (
              <span className="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                Đã nộp bài
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isSubmitted ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Main Question Pane */}
            <div className="flex-1 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between">
              {currentQ ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Câu hỏi {currentIdx + 1} / {totalQuestions}
                    </span>
                    <button
                      onClick={handleToggleFlag}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition ${
                        flagged[currentQ.id]
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flagged[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu này'}</span>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.questionText}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = answers[currentQ.id] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(oIdx)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm transition flex items-start gap-3 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-800'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">Không có câu hỏi trong đề này.</div>
              )}

              {/* Prev / Next Bottom Toolbar */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs text-slate-400">
                  Đã trả lời {answeredCount} / {totalQuestions}
                </span>

                <button
                  disabled={currentIdx === totalQuestions - 1}
                  onClick={() => setCurrentIdx((i) => Math.min(totalQuestions - 1, i + 1))}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-40 transition shadow-xs"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Question Palette / Navigation Grid */}
            <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 shrink-0 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Danh sách câu hỏi ({answeredCount}/{totalQuestions})
                </h3>

                <div className="grid grid-cols-5 gap-2 max-h-80 md:max-h-none overflow-y-auto pr-1">
                  {exam.questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = currentIdx === idx;
                    const isFlag = flagged[q.id];

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-9 rounded-xl text-xs font-bold relative transition flex items-center justify-center ${
                          isCurrent
                            ? 'ring-2 ring-emerald-500 scale-105'
                            : ''
                        } ${
                          isAnswered
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isFlag
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {idx + 1}
                        {isFlag && (
                          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
                  <span>Đã trả lời ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-400"></span>
                  <span>Đánh dấu xem lại</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-white border border-slate-300 dark:bg-slate-800"></span>
                  <span>Chưa làm ({totalQuestions - answeredCount})</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Submission Results & Review View */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Score Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 text-center shadow-lg relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-3">
                <Award className="w-4 h-4 text-amber-300" />
                <span>KẾT QUẢ THI TRỰC TUYẾN</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">
                {submissionResult?.score ?? 0} / 10 Điểm
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 mt-2">
                Bạn đã làm đúng <strong>{submissionResult?.correctCount}</strong> / {totalQuestions} câu hỏi • Thời gian làm bài: {Math.floor((submissionResult?.timeSpentSeconds ?? 0) / 60)} phút {(submissionResult?.timeSpentSeconds ?? 0) % 60} giây
              </p>
            </div>

            {/* Answer Key & Explanations Review */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Đáp án chi tiết và Lời giải thích</span>
              </h3>

              <div className="space-y-4">
                {exam.questions.map((q, idx) => {
                  const studentChoice = answers[q.id];
                  const isCorrect = studentChoice === q.correctOption;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                          : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Câu {idx + 1}:
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                          }`}
                        >
                          {isCorrect ? '✓ Chính xác (+2 điểm)' : studentChoice !== undefined ? '✗ Sai' : 'Chưa trả lời'}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        {q.questionText}
                      </p>

                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, oIdx) => {
                          const isKey = oIdx === q.correctOption;
                          const isStudentSelected = oIdx === studentChoice;

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                isKey
                                  ? 'border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : isStudentSelected
                                  ? 'border-rose-500 bg-rose-100/60 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 line-through'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong className="text-emerald-600 block mb-0.5">💡 Lời giải chi tiết:</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Close */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
