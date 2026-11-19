import { useEffect, useState } from 'react';
import { Bot, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import type {
  AiChatbotConfig,
  CategorySummary,
  ChatConversationLog,
  GeminiConciergeModel,
} from '../../types/store.ts';
import { adminFetch, formatDateTime } from './adminApi.ts';

interface AdminAiSectionProps {
  onStorefrontMutated: () => void;
  showToast: (msg: string) => void;
}

export function AdminAiSection({ onStorefrontMutated, showToast }: AdminAiSectionProps) {
  const [config, setConfig] = useState<AiChatbotConfig | null>(null);
  const [logs, setLogs] = useState<ChatConversationLog[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');

  const loadAiData = async () => {
    setLoading(true);
    try {
      const [aiRes, catRes] = await Promise.all([
        adminFetch<{ config: AiChatbotConfig; logs: ChatConversationLog[] }>('/api/admin/ai'),
        adminFetch<{ categories: CategorySummary[] }>('/api/admin/categories'),
      ]);
      setConfig(aiRes.config);
      setLogs(aiRes.logs);
      setCategories(catRes.categories);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load AI assistant settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAiData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const res = await adminFetch<{ config: AiChatbotConfig }>('/api/admin/ai', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setConfig(res.config);
      onStorefrontMutated();
      showToast('AI Concierge configuration saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save AI configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    try {
      const res = await adminFetch<{ totalProducts: number; totalCategories: number }>(
        '/api/admin/ai/sync',
        { method: 'POST' }
      );
      showToast(
        `AI catalog cache synced across ${res.totalProducts.toLocaleString()} products and ${res.totalCategories} categories.`
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Catalog sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleExcludedCategory = (catName: string) => {
    if (!config) return;
    const exists = config.excludedCategories.includes(catName);
    setConfig({
      ...config,
      excludedCategories: exists
        ? config.excludedCategories.filter((c) => c !== catName)
        : [...config.excludedCategories, catName],
    });
  };

  if (loading || !config) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
        Loading AI Concierge configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
            AI Shopping Assistant Management
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Control storefront availability, Gemini concierge model selection, custom persona guidance, catalog indexing scope, and inspect conversation logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => void handleSyncCatalog()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#191816] rounded-md hover:border-stone-500 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Index...' : 'Sync Product Data & Clear Cache'}</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save AI Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        {/* Main Configuration */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-[#9A6B42] dark:text-[#C89B6E]" />
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  Enable Storefront AI Shopping Assistant
                </p>
                <p className="text-[11px] text-stone-500">
                  When disabled, the floating concierge widget and chat endpoints are deactivated immediately.
                </p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              <span>{config.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Active Gemini Model</label>
              <select
                value={config.model}
                onChange={(e) =>
                  setConfig({ ...config, model: e.target.value as GeminiConciergeModel })
                }
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              >
                <option value="gemini-4-hydrogen">gemini-4-hydrogen (Flagship Precision)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-Low Latency)</option>
              </select>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeOutOfStock}
                  onChange={(e) =>
                    setConfig({ ...config, includeOutOfStock: e.target.checked })
                  }
                />
                <span>Allow recommending out-of-stock products</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Welcome Greeting Message</label>
            <textarea
              rows={2}
              value={config.welcomeMessage}
              onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Custom System Instructions (Tone & Merchandising Rules)
            </label>
            <textarea
              rows={4}
              value={config.customInstructions}
              onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
              placeholder="e.g., Always highlight free shipping over $150 and recommend seasonal accessories."
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          {/* Suggested Prompts */}
          <div className="space-y-2">
            <label className="block font-medium">Suggested Quick Prompts</label>
            <div className="space-y-2">
              {config.suggestedPrompts.map((prompt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => {
                      const next = [...config.suggestedPrompts];
                      next[idx] = e.target.value;
                      setConfig({ ...config, suggestedPrompts: next });
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        suggestedPrompts: config.suggestedPrompts.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Add new starter prompt..."
                  className="flex-1 px-3 py-1.5 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newPrompt.trim()) return;
                    setConfig({
                      ...config,
                      suggestedPrompts: [...config.suggestedPrompts, newPrompt.trim()],
                    });
                    setNewPrompt('');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Excluded Categories & Knowledge Scope */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Excluded Categories from AI Scope</h3>
              <p className="text-[11px] text-stone-500">
                Checked categories are omitted when retrieving AI product recommendations.
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {categories.map((cat) => (
                <label
                  key={cat.slug}
                  className="inline-flex items-center gap-2 p-1.5 rounded hover:bg-[#FAF9F6] dark:hover:bg-stone-900/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.excludedCategories.includes(cat.name)}
                    onChange={() => toggleExcludedCategory(cat.name)}
                  />
                  <span className="truncate">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recent Chat Logs */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Customer Chat Logs</h3>
              <button
                type="button"
                onClick={() => void loadAiData()}
                className="text-[11px] text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
              >
                Refresh
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="text-stone-500 py-6 text-center">
                No AI shopping conversations logged yet.
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                {logs.slice(0, 25).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono-tabular">
                      <span>{log.modelUsed}</span>
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      Customer: {log.userMessage}
                    </p>
                    <p className="text-stone-600 dark:text-stone-300 line-clamp-3">
                      Concierge: {log.assistantReply}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Matched {log.matchedProductIds.length} product(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
