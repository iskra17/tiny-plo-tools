import { useState } from 'react';
import type { FormEvent } from 'react';

interface FeedbackModalProps {
  onClose: () => void;
}

type FeedbackType = 'Bug' | 'Feature' | 'Other';

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<FeedbackType>('Bug');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const body = new URLSearchParams();
      body.append('form-name', 'feedback');
      body.append('name', name);
      body.append('email', email);
      body.append('type', type);
      body.append('message', message);

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Failed to submit. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-white mb-2">
              감사합니다! / Thank you!
            </p>
            <p className="text-sm text-slate-400 mb-4">
              피드백이 성공적으로 전송되었습니다.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors cursor-pointer"
            >
              닫기 / Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-bold text-white mb-4">
              Feedback
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Name */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  이름 / Name (선택)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  이메일 / Email (선택)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
                  placeholder="your@email.com"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  유형 / Type
                </label>
                <div className="flex gap-2">
                  {(['Bug', 'Feature', 'Other'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                        type === t
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  메시지 / Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 resize-y"
                  placeholder="버그 리포트, 기능 요청, 또는 의견을 남겨주세요..."
                />
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  취소 / Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {submitting ? '전송 중...' : '제출 / Submit'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
