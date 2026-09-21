'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getFullAnalytics } from '@/lib/supabase/analytics';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatWidget() {
  const { store } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! 👋 Saya asisten AI Sikasep. Tanyakan apa saja tentang bisnis Anda — omzet, menu terlaris, tren penjualan, atau saran bisnis.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsContext, setAnalyticsContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadContext() {
      if (store) {
        const data = await getFullAnalytics(store.id);
        setAnalyticsContext(data);
      }
    }
    loadContext();
  }, [store]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          context: analyticsContext,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Maaf, saya tidak bisa menjawab saat ini.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan. Coba lagi ya! 🙏',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, analyticsContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    'Berapa omzet hari ini?',
    'Menu apa yang paling laris?',
    'Beri saran untuk tingkatkan penjualan',
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-surface-700 text-text-primary border border-white/10'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-purple-500/30'
        }`}
        aria-label={isOpen ? 'Tutup chat' : 'Buka chat AI'}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-40 md:bottom-22 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm animate-slide-up">
          <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  AI
                </div>
                <div>
                  <p className="text-sm font-semibold">Sikasep AI</p>
                  <p className="text-[10px] text-text-muted flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                    Siap membantu
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '50vh', minHeight: '200px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-surface-700 text-text-primary rounded-bl-md border border-white/5'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-surface-700 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => {
                        sendMessage();
                      }, 100);
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-surface-700 border border-white/5 text-text-secondary hover:text-primary-400 hover:border-primary-500/30 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="px-3 py-3 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanya tentang bisnis Anda..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/5 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 rounded-xl gradient-primary text-white disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
