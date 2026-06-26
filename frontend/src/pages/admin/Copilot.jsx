import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, Trash2, Loader2, User } from 'lucide-react';
import api from '../../api/axios';

// ── Suggested queries ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Show top unresolved road issues',
  'Which city has the most complaints?',
  'Generate a monthly summary',
  'Show high priority complaints pending for over 7 days',
  'Which departments are underperforming?',
  'Predict areas with high flood risk',
  'Show complaints with highest impact score',
  'List all approved complaints not yet assigned',
  'How many complaints were resolved this month?',
  'Which category has the lowest resolution rate?',
];

const INITIAL_MSG = {
  role:      'model',
  content:   "Hello! I'm your **CivicAlign AI Copilot** powered by Gemini 2.5 Flash.\n\nI have access to live platform data and can help you:\n- Analyse complaint trends and patterns\n- Identify underperforming areas or departments\n- Generate summaries and actionable insights\n- Answer questions about specific categories or cities\n\nWhat would you like to know?",
  timestamp: new Date(),
};

// ── Sub-components ────────────────────────────────────────────────────────────

const TypingDots = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.18}s` }}
      />
    ))}
  </div>
);

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ── Markdown styling overrides for chat bubbles ───────────────────────────────

const AI_PROSE = {
  p:          ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul:         ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li:         ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  strong:     ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em:         ({ children }) => <em className="italic text-gray-700">{children}</em>,
  code:       ({ children }) => (
    <code className="bg-gray-100 text-gray-800 text-xs font-mono px-1.5 py-0.5 rounded">{children}</code>
  ),
  pre:        ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 text-xs font-mono p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>
  ),
  table:      ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead:      ({ children }) => <thead className="bg-[#1e40af] text-white">{children}</thead>,
  tbody:      ({ children }) => <tbody>{children}</tbody>,
  tr:         ({ children }) => <tr className="border-b border-gray-100 even:bg-gray-50">{children}</tr>,
  th:         ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
  td:         ({ children }) => <td className="px-3 py-2 text-gray-700">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#1e40af] pl-3 text-gray-600 italic mb-2">{children}</blockquote>
  ),
  h1: ({ children }) => <h1 className="text-base font-bold text-gray-900 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-gray-800 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mb-1">{children}</h3>,
};

// ── Main component ────────────────────────────────────────────────────────────

const Copilot = () => {
  const [messages,  setMessages]  = useState([INITIAL_MSG]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError('');
    setLoading(true);

    // Send last-10 history (exclude the initial greeting)
    const history = messages.slice(-10).map((m) => ({
      role:    m.role,
      content: m.content,
    }));

    try {
      const { data } = await api.post('/admin/copilot', {
        message:              trimmed,
        conversation_history: history,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'model', content: data.response, timestamp: new Date() },
      ]);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (q) => {
    if (!loading) {
      setInput(q);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MSG]);
    setInput('');
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 -m-6 overflow-hidden">

      {/* ── Left panel: Suggested queries ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-slate-900 border-r border-slate-700">
        <div className="px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-[#1e40af] flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm">AI Copilot</span>
          </div>
          <p className="text-slate-400 text-xs mt-1">Gemini 2.5 Flash · Live data</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Suggested Queries
          </p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                disabled={loading}
                className="text-left text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 rounded-lg px-3 py-2.5 leading-relaxed transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 border-t border-slate-700">
          <button
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors"
          >
            <Trash2 size={13} /> Clear chat
          </button>
        </div>
      </aside>

      {/* ── Right panel: Chat ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 bg-gray-50 min-w-0">

        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1e40af] flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm leading-none">CivicAlign AI</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {loading ? 'Thinking…' : 'Online · Gemini 2.5 Flash'}
              </p>
            </div>
            {loading && <Loader2 size={14} className="animate-spin text-[#1e40af] ml-1" />}
          </div>

          {/* Mobile clear button */}
          <button
            onClick={clearChat}
            className="lg:hidden flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold
                ${msg.role === 'user' ? 'bg-gray-500' : 'bg-[#1e40af]'}`}
              >
                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <span className="text-xs text-gray-400 px-1">
                  {msg.role === 'user' ? 'You' : 'CivicAlign AI'}
                </span>

                <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-[#1e40af] text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={AI_PROSE}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>

                <span className="text-[10px] text-gray-300 px-1">{fmtTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#1e40af] flex items-center justify-center text-white">
                <Bot size={13} />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mx-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Mobile suggestions strip */}
        <div className="lg:hidden px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {SUGGESTIONS.slice(0, 5).map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                disabled={loading}
                className="text-xs text-[#1e40af] bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 whitespace-nowrap hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about complaints, trends, departments… (Enter to send)"
              rows={1}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] resize-none leading-relaxed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-[#1e40af] text-white flex items-center justify-center hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />
              }
            </button>
          </form>
          <p className="text-[10px] text-gray-300 mt-1.5 text-center">
            Shift+Enter for new line · Enter to send · AI responses may not always be accurate
          </p>
        </div>
      </div>
    </div>
  );
};

export default Copilot;
