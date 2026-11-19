import {
  GoogleGenAI,
  ThinkingLevel,
  type Content,
} from '@google/genai';
import { STORE_POLICIES } from '../src/data/catalog.ts';
import type { AiChatbotConfig, Product } from '../src/types/store.ts';
import {
  getAiSettingsFromDb,
  getCatalogStats,
  getFullCmsPayload,
  getProductsByIds,
  listCategories,
  parseNaturalLanguageDbSearch,
  retrieveCandidateProductsFromDb,
  saveChatLogToDb,
} from './db.ts';

let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your API key in Settings > Secrets.'
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

export interface IncomingChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConciergeResponse {
  reply: string;
  products: Product[];
  suggestedFollowUps: string[];
}

interface CacheEntry {
  reply: string;
  products: Product[];
  suggestedFollowUps: string[];
  expiresAt: number;
}

const RESPONSE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_SIZE = 64;

export function clearConciergeCache(): void {
  RESPONSE_CACHE.clear();
}

function getCachedEntry(key: string): CacheEntry | null {
  const entry = RESPONSE_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    RESPONSE_CACHE.delete(key);
    return null;
  }
  return entry;
}

function setCachedEntry(key: string, value: Omit<CacheEntry, 'expiresAt'>) {
  if (RESPONSE_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = RESPONSE_CACHE.keys().next().value;
    if (oldestKey) RESPONSE_CACHE.delete(oldestKey);
  }
  RESPONSE_CACHE.set(key, {
    ...value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function getCompactPolicyContext(): string {
  const cms = getFullCmsPayload();
  return JSON.stringify({
    storeName: cms.settings.websiteName || STORE_POLICIES.brandName,
    freeShippingOver: STORE_POLICIES.freeShippingThreshold,
    standardShippingFee: STORE_POLICIES.standardShippingFee,
    shipping: cms.about.shippingPolicy || STORE_POLICIES.shipping,
    returns: cms.about.returnsPolicy || STORE_POLICIES.returns,
    warranty: cms.about.warrantyStatement || STORE_POLICIES.warranty,
    contact: cms.contact,
  });
}

function filterCandidatesForAi(products: Product[], aiConfig: AiChatbotConfig): Product[] {
  const excludedSet = new Set(aiConfig.excludedCategories.map((c) => c.toLowerCase()));
  const visibleCategorySet = new Set(
    listCategories(false).map((c) => c.name.toLowerCase())
  );
  return products.filter((p) => {
    if (!aiConfig.includeOutOfStock && (!p.inStock || p.stockCount <= 0)) return false;
    if (excludedSet.has(p.category.toLowerCase())) return false;
    if (visibleCategorySet.size > 0 && !visibleCategorySet.has(p.category.toLowerCase())) {
      return false;
    }
    return true;
  });
}

function serializeCandidateContext(candidates: Product[]): string {
  return JSON.stringify(
    candidates.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      cat: p.category,
      sub: p.subcategory,
      price: p.price,
      ...(p.compareAtPrice ? { was: p.compareAtPrice } : {}),
      rating: p.rating,
      stock: p.stockCount,
      colors: p.colors.map((c) => c.name),
      specs: p.specs,
    }))
  );
}

function buildDynamicSystemInstruction(
  userQuery: string,
  history: IncomingChatTurn[],
  cartItemCount: number,
  aiConfig: AiChatbotConfig
): string {
  const recentTexts = history.slice(-6).map((t) => t.content);
  const rawCandidates = retrieveCandidateProductsFromDb(userQuery, recentTexts, 18);
  const candidates = filterCandidatesForAi(rawCandidates, aiConfig).slice(0, 14);
  const stats = getCatalogStats();
  const cms = getFullCmsPayload();
  const candidateJson = serializeCandidateContext(candidates);

  return `You are the Intelligent Marketplace Shopping Concierge for ${cms.settings.websiteName || 'MAISON KOVA'}.
Use ONLY the verified live SQLite catalog summary, retrieved matching products, and store policies below. Never invent products, prices, discounts, specs, or stock numbers, and never recommend deleted or unavailable products as in stock.
${aiConfig.customInstructions ? `\nADMIN CUSTOM INSTRUCTIONS:\n${aiConfig.customInstructions}\n` : ''}
LIVE MARKETPLACE STATS:
${JSON.stringify({
  totalProducts: stats.totalProducts,
  totalCategories: stats.totalCategories,
  minPrice: stats.minPrice,
  maxPrice: stats.maxPrice,
  onSaleCount: stats.onSaleCount,
  flashSaleCount: stats.flashSaleCount,
})}

RETRIEVED MATCHING CATALOG PRODUCTS (from full ${stats.totalProducts}-product SQLite archive):
${candidateJson}

STORE POLICIES JSON:
${getCompactPolicyContext()}
${cartItemCount > 0 ? `\nShopper currently has ${cartItemCount} item(s) in their bag.` : ''}

Response rules:
1. Keep replies crisp, helpful, and concise (2-4 short sentences or up to 3 compact bullet points—never verbose walls of text).
2. Accurately state prices, savings (if "was" price exists), star ratings, and stock availability (explicitly note if stock is 0 / out of stock).
3. Compare specs or prices clearly when asked to compare brands, find cheapest items, or recommend within a budget.
4. At the VERY END of your response on a new line, ALWAYS append the exact matching product IDs from the retrieved products above in this strict format:
[[IDS:id1,id2]]
or [[IDS:NONE]] if no products apply (such as pure shipping/return policy questions). Never explain or mention this tag.`;
}

function buildFollowUps(products: Product[], userText: string): string[] {
  const lower = userText.toLowerCase();
  if (products.length >= 2) {
    return [
      `Compare ${products[0].name} and ${products[1].name}`,
      'Show me products with discounts',
      'What is your shipping and return policy?',
    ];
  }
  if (products.length === 1) {
    return [
      `Tell me the specs of ${products[0].name}`,
      'Show me laptops under $500',
      'Find Nike Air Max shoes',
    ];
  }
  if (lower.includes('ship') || lower.includes('return')) {
    return [
      'Find me an iPhone 17 Pro Max',
      'Show me the cheapest gaming laptop',
      'Smart watches under $100',
    ];
  }
  return [
    'Find me an iPhone',
    'Show me laptops under $500',
    'Compare Samsung and Apple phones',
  ];
}

function resolveProductsFromIds(
  idsText: string,
  fallbackQuery: string,
  aiConfig: AiChatbotConfig
): Product[] {
  if (idsText.trim().toUpperCase() === 'NONE') {
    return [];
  }
  const rawIds = idsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const matched = filterCandidatesForAi(getProductsByIds(rawIds), aiConfig);
  if (matched.length > 0) {
    return matched.slice(0, 6);
  }

  return filterCandidatesForAi(parseNaturalLanguageDbSearch(fallbackQuery, 10), aiConfig).slice(
    0,
    6
  );
}

function stripProductTag(fullText: string): { cleanText: string; idsText: string | null } {
  const match = fullText.match(/\[\[IDS:([^\]]*)\]\]\s*$/i);
  if (!match) {
    return { cleanText: fullText.trim(), idsText: null };
  }
  const cleanText = fullText.slice(0, match.index).trim();
  return { cleanText, idsText: match[1] };
}

function formatGeminiError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
    return new Error(
      'Our AI Concierge is experiencing temporary high demand. Please retry in a moment.'
    );
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
    return new Error(
      'Unable to authenticate the AI Concierge. Please verify GEMINI_API_KEY in Settings > Secrets.'
    );
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return new Error('AI Concierge rate limit reached briefly. Please try again in a few seconds.');
  }
  return err instanceof Error ? err : new Error('Unable to reach the AI shopping assistant.');
}

function buildContents(history: IncomingChatTurn[]): Content[] {
  const sanitized = history
    .filter((turn) => turn.content && turn.content.trim().length > 0)
    .slice(-8);

  if (sanitized.length === 0) {
    throw new Error('Please enter a message for the shopping concierge.');
  }

  return sanitized.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }],
  }));
}

export async function runAIConcierge(
  history: IncomingChatTurn[],
  cartItemCount = 0
): Promise<ConciergeResponse> {
  const aiConfig = getAiSettingsFromDb();
  if (!aiConfig.enabled) {
    throw new Error('The AI Shopping Assistant is currently disabled by the store administrator.');
  }

  const contents = buildContents(history);
  const lastUserMessage =
    history.filter((m) => m.role === 'user').pop()?.content.trim() ?? '';

  const cacheKey =
    history.length === 1
      ? `${aiConfig.model}::${lastUserMessage.toLowerCase()}::${cartItemCount > 0 ? 1 : 0}`
      : null;

  if (cacheKey) {
    const cached = getCachedEntry(cacheKey);
    if (cached) {
      return {
        reply: cached.reply,
        products: cached.products,
        suggestedFollowUps: cached.suggestedFollowUps,
      };
    }
  }

  const ai = getGeminiClient();
  const systemInstruction = buildDynamicSystemInstruction(
    lastUserMessage,
    history,
    cartItemCount,
    aiConfig
  );

  const primaryModel = aiConfig.model;
  const attempts =
    primaryModel === 'gemini-3.1-flash-lite'
      ? [
          { model: 'gemini-3.1-flash-lite', thinking: false, delayMs: 400 },
          { model: 'gemini-4-hydrogen', thinking: true, delayMs: 0 },
        ]
      : [
          { model: 'gemini-4-hydrogen', thinking: true, delayMs: 400 },
          { model: 'gemini-3.1-flash-lite', thinking: false, delayMs: 800 },
          { model: 'gemini-3.1-flash-lite', thinking: false, delayMs: 0 },
        ];
  let responseText = '';
  let usedModel: string = primaryModel;

  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    try {
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents,
        config: {
          systemInstruction,
          ...(attempt.thinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        },
      });
      responseText = response.text ?? '';
      usedModel = attempt.model;
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED');
      if (!isTransient || i === attempts.length - 1) {
        throw formatGeminiError(err);
      }
      if (attempt.delayMs > 0) {
        await new Promise((r) => setTimeout(r, attempt.delayMs));
      }
    }
  }

  const { cleanText, idsText } = stripProductTag(responseText);
  const products = idsText
    ? resolveProductsFromIds(idsText, lastUserMessage, aiConfig)
    : filterCandidatesForAi(parseNaturalLanguageDbSearch(lastUserMessage, 10), aiConfig).slice(0, 6);
  const suggestedFollowUps = buildFollowUps(products, lastUserMessage);

  const result: ConciergeResponse = {
    reply:
      cleanText ||
      'Here are the matching products from our live marketplace catalog.',
    products,
    suggestedFollowUps,
  };

  saveChatLogToDb({
    userMessage: lastUserMessage,
    assistantReply: result.reply,
    matchedProductIds: result.products.map((p) => p.id),
    modelUsed: usedModel,
  });

  if (cacheKey && result.reply) {
    setCachedEntry(cacheKey, result);
  }

  return result;
}

export interface StreamCallbacks {
  onDelta: (textChunk: string) => void;
  onProducts: (products: Product[], isFinal: boolean) => void;
  onDone: (followUps: string[]) => void;
  signal?: AbortSignal;
}

export async function streamAIConcierge(
  history: IncomingChatTurn[],
  cartItemCount: number,
  callbacks: StreamCallbacks
): Promise<void> {
  const aiConfig = getAiSettingsFromDb();
  if (!aiConfig.enabled) {
    throw new Error('The AI Shopping Assistant is currently disabled by the store administrator.');
  }

  const contents = buildContents(history);
  const lastUserMessage =
    history.filter((m) => m.role === 'user').pop()?.content.trim() ?? '';

  // Step 1: Zero-latency deterministic pre-match across all live SQLite FTS5 products
  const instantMatches = filterCandidatesForAi(
    retrieveCandidateProductsFromDb(lastUserMessage, [], 10, false),
    aiConfig
  ).slice(0, 6);
  if (instantMatches.length > 0) {
    callbacks.onProducts(instantMatches, false);
  }

  // Step 2: Fast cache hit for repeated single-turn prompts
  const cacheKey =
    history.length === 1
      ? `${aiConfig.model}::${lastUserMessage.toLowerCase()}::${cartItemCount > 0 ? 1 : 0}`
      : null;

  if (cacheKey) {
    const cached = getCachedEntry(cacheKey);
    if (cached) {
      callbacks.onDelta(cached.reply);
      callbacks.onProducts(cached.products, true);
      callbacks.onDone(cached.suggestedFollowUps);
      return;
    }
  }

  const ai = getGeminiClient();
  const systemInstruction = buildDynamicSystemInstruction(
    lastUserMessage,
    history,
    cartItemCount,
    aiConfig
  );

  const primaryModel = aiConfig.model;
  const attempts =
    primaryModel === 'gemini-3.1-flash-lite'
      ? [
          { model: 'gemini-3.1-flash-lite', thinking: false, delayMs: 400 },
          { model: 'gemini-4-hydrogen', thinking: true, delayMs: 0 },
        ]
      : [
          { model: 'gemini-4-hydrogen', thinking: true, delayMs: 400 },
          { model: 'gemini-3.1-flash-lite', thinking: false, delayMs: 800 },
          { model: 'gemini-3.1-flash-lite', thinking: false, delayMs: 0 },
        ];
  let stream: AsyncGenerator<{ text?: string }> | null = null;
  let usedModel: string = primaryModel;

  for (let i = 0; i < attempts.length; i += 1) {
    if (callbacks.signal?.aborted) return;
    const attempt = attempts[i];
    try {
      stream = await ai.models.generateContentStream({
        model: attempt.model,
        contents,
        config: {
          systemInstruction,
          ...(attempt.thinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        },
      });
      usedModel = attempt.model;
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED');
      if (!isTransient || i === attempts.length - 1) {
        throw formatGeminiError(err);
      }
      if (attempt.delayMs > 0) {
        await new Promise((r) => setTimeout(r, attempt.delayMs));
      }
    }
  }

  if (!stream) {
    throw new Error('Unable to start AI response stream.');
  }

  let accumulated = '';
  let emittedLength = 0;

  for await (const chunk of stream) {
    if (callbacks.signal?.aborted) return;
    const textPart = chunk.text ?? '';
    if (!textPart) continue;
    accumulated += textPart;

    const tagStart = accumulated.indexOf('[[');
    if (tagStart !== -1) {
      if (tagStart > emittedLength) {
        callbacks.onDelta(accumulated.slice(emittedLength, tagStart));
        emittedLength = tagStart;
      }
    } else {
      const safeEnd = Math.max(emittedLength, accumulated.length - 2);
      if (safeEnd > emittedLength) {
        callbacks.onDelta(accumulated.slice(emittedLength, safeEnd));
        emittedLength = safeEnd;
      }
    }
  }

  if (callbacks.signal?.aborted) return;

  const { cleanText, idsText } = stripProductTag(accumulated);
  if (cleanText.length > emittedLength) {
    callbacks.onDelta(cleanText.slice(emittedLength));
  }

  const finalProducts = idsText
    ? resolveProductsFromIds(idsText, lastUserMessage, aiConfig)
    : instantMatches;
  const followUps = buildFollowUps(finalProducts, lastUserMessage);

  callbacks.onProducts(finalProducts, true);
  callbacks.onDone(followUps);

  saveChatLogToDb({
    userMessage: lastUserMessage,
    assistantReply: cleanText || 'Here are the matching products from our live marketplace catalog.',
    matchedProductIds: finalProducts.map((p) => p.id),
    modelUsed: usedModel,
  });

  if (cacheKey && cleanText) {
    setCachedEntry(cacheKey, {
      reply: cleanText,
      products: finalProducts,
      suggestedFollowUps: followUps,
    });
  }
}
