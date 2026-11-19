import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Eye,
  Maximize2,
  MessageSquare,
  Minimize2,
  Plus,
  RefreshCw,
  Scale,
  Send,
  Square,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext.tsx';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { getDiscountPercentage } from '../lib/searchProducts.ts';
import type { ChatMessage, Product } from '../types/store.ts';
import { ProductImage } from './ProductImage.tsx';

const SUGGESTED_PROMPTS = [
  'Find me an iPhone 17 Pro Max',
  'Show me laptops under $500',
  'Find Nike Air Max shoes',
  'Compare Samsung and Apple phones',
  'Show me the cheapest gaming laptop',
  'Smart watches under $100',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Welcome to MAISON KOVA Marketplace. I search across all 1,500+ live products and 20 categories—smartphones, gaming laptops, Nike Air Max, smart watches, fashion, furniture, and appliances. Ask me to find, filter, or compare anything.',
  timestamp: new Date().toISOString(),
  suggestedFollowUps: SUGGESTED_PROMPTS.slice(0, 4),
};

export function AIChatWidget() {
  const {
    isChatOpen,
    setIsChatOpen,
    addToCart,
    openProductDetail,
    cartCount,
    toggleCompare,
    isCompared,
    storefrontConfig,
  } = useStore();

  const liveAi = storefrontConfig?.ai;
  const activePrompts =
    liveAi?.suggestedPrompts && liveAi.suggestedPrompts.length > 0
      ? liveAi.suggestedPrompts
      : SUGGESTED_PROMPTS;
  const activeWelcomeText = liveAi?.welcomeMessage || WELCOME_MESSAGE.content;

  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('mk_chat_history_v1', [
    {
      ...WELCOME_MESSAGE,
      content: activeWelcomeText,
      suggestedFollowUps: activePrompts.slice(0, 4),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'searching' | 'streaming'>('searching');
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSubmittedRef = useRef<{ text: string; at: number } | null>(null);

  useEffect(() => {
    if (!liveAi) return;
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [
          {
            ...prev[0],
            content: liveAi.welcomeMessage || prev[0].content,
            suggestedFollowUps:
              liveAi.suggestedPrompts?.slice(0, 4) || prev[0].suggestedFollowUps,
          },
        ];
      }
      return prev;
    });
  }, [liveAi, setMessages]);

  useEffect(() => {
    if (isChatOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isChatOpen, messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setStreamingMsgId(null);
  };

  const sendMessage = async (textOverride?: string) => {
    const query = (textOverride ?? input).trim();
    if (!query) return;

    // Prevent rapid duplicate submissions (< 700ms)
    const now = Date.now();
    if (
      lastSubmittedRef.current &&
      lastSubmittedRef.current.text === query &&
      now - lastSubmittedRef.current.at < 700
    ) {
      return;
    }
    lastSubmittedRef.current = { text: query, at: now };

    // Cancel any outdated in-flight request when user submits a new query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);

    const userMsg: ChatMessage = {
      id: `user-${now}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const assistantId = `assistant-${now + 1}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      products: [],
    };

    const nextMessages = [...messages, userMsg, placeholderAssistant];
    setMessages(nextMessages);
    if (!textOverride) setInput('');
    setIsStreaming(true);
    setLoadingStage('searching');
    setStreamingMsgId(assistantId);

    try {
      const apiHistory = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome' && !m.error && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: apiHistory,
          cartItemCount: cartCount,
        }),
      });

      if (!res.ok || !res.body) {
        let errorMessage = 'Unable to reach AI Concierge.';
        try {
          const errData = (await res.json()) as { error?: string };
          if (errData.error) errorMessage = errData.error;
        } catch {
          // Ignore JSON parse fallback
        }
        throw new Error(errorMessage);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistant = (updater: (msg: ChatMessage) => ChatMessage) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? updater(m) : m))
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const lines = rawEvent.split('\n');
          let eventName = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr += line.slice(5).trim();
            }
          }

          if (!dataStr) continue;
          const payload = JSON.parse(dataStr) as {
            text?: string;
            products?: Product[];
            suggestedFollowUps?: string[];
            error?: string;
          };

          if (eventName === 'delta' && payload.text) {
            setLoadingStage('streaming');
            updateAssistant((msg) => ({
              ...msg,
              content: msg.content + payload.text,
            }));
          } else if (eventName === 'products' && Array.isArray(payload.products)) {
            updateAssistant((msg) => ({
              ...msg,
              products: payload.products,
            }));
          } else if (eventName === 'done') {
            updateAssistant((msg) => ({
              ...msg,
              content:
                msg.content.trim() ||
                'Here are the matching pieces from our archive.',
              suggestedFollowUps: payload.suggestedFollowUps,
            }));
          } else if (eventName === 'error') {
            throw new Error(payload.error || 'Unable to complete response.');
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // If aborted manually or replaced by a new query, clean empty placeholder if nothing streamed
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && !m.content && (!m.products || m.products.length === 0)))
        );
        return;
      }

      const errorText =
        err instanceof Error ? err.message : 'Something went wrong reaching the concierge.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: errorText,
                error: true,
              }
            : m
        )
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsStreaming(false);
        setStreamingMsgId(null);
      }
    }
  };

  const handleClearChat = () => {
    stopStreaming();
    setMessages([
      {
        ...WELCOME_MESSAGE,
        content: activeWelcomeText,
        suggestedFollowUps: activePrompts.slice(0, 4),
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleQuickAddFromChat = (product: Product) => {
    addToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    window.setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  if (liveAi && !liveAi.enabled) {
    return null;
  }

  return (
    <>
      {/* Floating Concierge Trigger */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            type="button"
            onClick={() => setIsChatOpen(true)}
            aria-label="Open AI Shopping Concierge"
            className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-xl border border-stone-700/40 dark:border-stone-300/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B42]"
          >
            <MessageSquare className="w-4 h-4 text-[#C89B6E] dark:text-[#9A6B42]" />
            <span className="text-xs font-medium tracking-wide whitespace-nowrap">
              AI Shopping Assistant
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            aria-label="MAISON KOVA AI Shopping Assistant"
            className={`fixed bottom-4 right-4 z-50 flex flex-col bg-[#FAF9F6] dark:bg-[#141312] border border-stone-300/90 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden transition-[width] duration-200 ${
              isExpanded
                ? 'w-[600px] max-w-[calc(100vw-2rem)] h-[700px] max-h-[calc(100vh-3rem)]'
                : 'w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-3rem)]'
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-white dark:bg-[#191816] border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-medium text-stone-900 dark:text-stone-100 leading-none">
                  Shopping Concierge
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate">
                  {isStreaming
                    ? loadingStage === 'searching'
                      ? 'Searching live catalog...'
                      : 'Streaming recommendation...'
                    : 'Instant Catalog Search & Styling Advice'}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear conversation"
                  aria-label="Clear chat history"
                  className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded((v) => !v)}
                  title={isExpanded ? 'Compact width' : 'Expand width'}
                  aria-label={isExpanded ? 'Compact chat width' : 'Expand chat width'}
                  className="hidden sm:inline-flex p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close AI Shopping Assistant"
                  className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg) => {
                const isActiveStream = isStreaming && msg.id === streamingMsgId;
                const showTypingBubble = isActiveStream && !msg.content;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {showTypingBubble ? (
                      <div className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          Searching catalog
                        </span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.1s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" />
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[90%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                            : msg.error
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900'
                              : 'bg-white dark:bg-[#191816] text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800'
                        }`}
                      >
                        {msg.content}
                        {isActiveStream && (
                          <span
                            aria-hidden="true"
                            className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-[#9A6B42] dark:bg-[#C89B6E] animate-pulse"
                          />
                        )}

                        {msg.error && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const lastUser = [...messages]
                                  .reverse()
                                  .find((m) => m.role === 'user');
                                if (lastUser) void sendMessage(lastUser.content);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-medium underline cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry request</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Product Cards Inside Chat */}
                    {msg.products && msg.products.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full mt-2.5 grid grid-cols-1 gap-2.5"
                      >
                        {msg.products.map((product) => {
                          const discount = getDiscountPercentage(product);
                          const justAdded = Boolean(addedIds[product.id]);
                          const compared = isCompared(product.id);

                          return (
                            <div
                              key={product.id}
                              className="flex gap-3 p-2.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => openProductDetail(product)}
                                className="w-20 aspect-[4/3] rounded-md overflow-hidden bg-[#EFECE6] dark:bg-[#22211E] shrink-0 cursor-pointer"
                              >
                                <ProductImage
                                  src={product.image}
                                  alt={product.name}
                                  title={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </button>

                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                                      {product.name}
                                    </p>
                                    <span className="inline-flex items-center gap-0.5 text-[11px] font-mono-tabular text-stone-700 dark:text-stone-300 shrink-0">
                                      <Star className="w-3 h-3 fill-[#9A6B42] text-[#9A6B42] dark:fill-[#C89B6E] dark:text-[#C89B6E]" />
                                      {product.rating.toFixed(1)}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-baseline gap-2 mt-0.5 text-xs font-mono-tabular">
                                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                                      ${product.price.toLocaleString()}
                                    </span>
                                    {product.compareAtPrice && (
                                      <span className="text-[11px] text-stone-400 line-through">
                                        ${product.compareAtPrice.toLocaleString()}
                                      </span>
                                    )}
                                    {discount && (
                                      <span className="text-[11px] text-[#9A6B42] dark:text-[#C89B6E] font-medium">
                                        -{discount}%
                                      </span>
                                    )}
                                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                                      · {product.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => openProductDetail(product)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-stone-500 rounded transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Product</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleCompare(product.id)}
                                    aria-pressed={compared}
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium border rounded transition-colors cursor-pointer ${
                                      compared
                                        ? 'border-[#9A6B42] text-[#9A6B42] dark:border-[#C89B6E] dark:text-[#C89B6E] bg-[#9A6B42]/10'
                                        : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-500'
                                    }`}
                                  >
                                    <Scale className="w-3 h-3" />
                                    <span>{compared ? 'Comparing' : 'Compare'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!product.inStock}
                                    onClick={() => handleQuickAddFromChat(product)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                                      !product.inStock
                                        ? 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500 cursor-not-allowed'
                                        : justAdded
                                          ? 'bg-emerald-700 text-white cursor-pointer'
                                          : 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 cursor-pointer'
                                    }`}
                                  >
                                    {justAdded ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Added</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>{product.inStock ? 'Add to Cart' : 'Sold Out'}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Suggested Follow-Ups */}
                    {msg.role === 'assistant' &&
                      msg.suggestedFollowUps &&
                      msg.suggestedFollowUps.length > 0 &&
                      msg.id === messages[messages.length - 1]?.id &&
                      !isStreaming && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {msg.suggestedFollowUps.map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => void sendMessage(prompt)}
                              className="text-left px-2.5 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 bg-[#EFECE6] dark:bg-[#1E1D1A] hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md transition-colors cursor-pointer"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>

            {/* Quick Prompt Strip & Input Bar */}
            <div className="p-3 bg-white dark:bg-[#191816] border-t border-stone-200 dark:border-stone-800 space-y-2.5">
              {messages.length <= 1 && activePrompts.length > 4 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {activePrompts.slice(4).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="px-2.5 py-1 text-[11px] text-stone-600 dark:text-stone-300 bg-[#FAF9F6] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-md whitespace-nowrap shrink-0 hover:border-stone-400 cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask: iPhone 17 Pro Max, laptops under $500, Nike Air Max..."
                  aria-label="Message AI Shopping Concierge"
                  className="flex-1 px-3.5 py-2.5 text-sm bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    aria-label="Stop response"
                    title="Stop generating"
                    className="p-2.5 rounded-md bg-stone-200 text-stone-900 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer shrink-0"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send message"
                    className="p-2.5 rounded-md bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
