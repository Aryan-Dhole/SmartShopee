import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/api-client';

const SUGGESTED_PROMPTS = [
  'Find the best laptop under ₹50,000',
  'Compare iPhone 16 vs Samsung S25',
  'Best wireless earbuds for gym',
  'Is this a good time to buy a MacBook?',
  'Trending deals in electronics today',
];

export default function AIChatPanel() {
  const { darkMode } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 Hey! I'm your PriceWise AI shopping assistant. Ask me anything about products, prices, deals, or comparisons across Indian e-commerce platforms.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(content.trim());

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "I couldn't process that request. Please try rephrasing your question.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I'm having trouble connecting right now. Please try again in a moment. In the meantime, you can use the search bar to find products directly!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-neutral-800 text-white scale-90'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105'
        }`}
        whileHover={{ scale: isOpen ? 0.95 : 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ boxShadow: isOpen ? undefined : '0 8px 32px rgba(99, 102, 241, 0.3)' }}
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed bottom-24 right-6 z-40 w-[380px] max-h-[560px] rounded-[24px] border shadow-2xl flex flex-col overflow-hidden ${
              darkMode
                ? 'bg-[#0a0a0c] border-white/10 text-white'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
                darkMode ? 'border-white/5' : 'border-neutral-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">AI Shopping Assistant</h4>
                  <p
                    className={`text-[9px] font-mono uppercase tracking-wider ${
                      darkMode ? 'text-white/35' : 'text-neutral-400'
                    }`}
                  >
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#22c55e]" />
                <span
                  className={`text-[9px] font-mono ${
                    darkMode ? 'text-white/30' : 'text-neutral-400'
                  }`}
                >
                  Online
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        : darkMode
                        ? 'bg-white/10 text-white/60'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : darkMode
                        ? 'bg-white/[0.06] text-white/80 rounded-bl-sm border border-white/5'
                        : 'bg-neutral-50 text-neutral-700 rounded-bl-sm border border-neutral-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div
                    className={`rounded-2xl rounded-bl-sm px-4 py-3 ${
                      darkMode ? 'bg-white/[0.06] border border-white/5' : 'bg-neutral-50 border border-neutral-200'
                    }`}
                  >
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
              <div className={`px-4 pb-2 shrink-0`}>
                <p
                  className={`text-[9px] font-mono uppercase tracking-wider mb-2 ${
                    darkMode ? 'text-white/25' : 'text-neutral-400'
                  }`}
                >
                  Try asking
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                        darkMode
                          ? 'border-white/5 text-white/40 hover:text-white/70 hover:bg-white/5'
                          : 'border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className={`px-4 py-3 border-t flex gap-2 shrink-0 ${
                darkMode ? 'border-white/5' : 'border-neutral-100'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any product..."
                disabled={isLoading}
                className={`flex-1 rounded-xl px-4 py-2.5 text-xs border transition-all focus:outline-none ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-1 focus:ring-indigo-500/30'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:ring-indigo-500/20'
                }`}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
