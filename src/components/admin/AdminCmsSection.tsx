import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { AVAILABLE_STUDIO_ASSETS } from '../../data/catalog.ts';
import type {
  AboutCmsConfig,
  BannerItem,
  ContactCmsConfig,
  FaqItem,
  FooterCmsConfig,
  FullCmsPayload,
  HomepageCmsConfig,
  NavMenuItem,
} from '../../types/store.ts';
import { ProductImage } from '../ProductImage.tsx';
import { adminFetch, uploadAdminImage } from './adminApi.ts';

interface AdminCmsSectionProps {
  onStorefrontMutated: () => void;
  showToast: (msg: string) => void;
}

type CmsTab = 'homepage' | 'navigation' | 'footer' | 'about' | 'contact' | 'faqs' | 'banners';

export function AdminCmsSection({ onStorefrontMutated, showToast }: AdminCmsSectionProps) {
  const [activeTab, setActiveTab] = useState<CmsTab>('homepage');
  const [cms, setCms] = useState<FullCmsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    adminFetch<FullCmsPayload>('/api/admin/cms')
      .then((data) => setCms(data))
      .catch((err) => showToast(err instanceof Error ? err.message : 'Unable to load CMS.'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const saveSection = async <T,>(section: CmsTab, payload: T, label: string) => {
    setSavingSection(section);
    try {
      const updated = await adminFetch<FullCmsPayload>(`/api/admin/cms/${section}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setCms(updated);
      onStorefrontMutated();
      showToast(`${label} saved and published to storefront.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to save ${label}.`);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading || !cms) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
        Loading Website Content Manager...
      </div>
    );
  }

  const updateHomepage = (patch: Partial<HomepageCmsConfig>) =>
    setCms({ ...cms, homepage: { ...cms.homepage, ...patch } });

  const moveHomepageSection = (index: number, delta: -1 | 1) => {
    const next = [...cms.homepage.sections];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    updateHomepage({ sections: next });
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAdminImage(file);
      updateHomepage({ heroImage: url });
      showToast('Hero artwork uploaded.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  const handleBannerImageUpload = async (
    bannerId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAdminImage(file);
      setCms({
        ...cms,
        banners: cms.banners.map((b) => (b.id === bannerId ? { ...b, image: url } : b)),
      });
      showToast('Banner artwork uploaded.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
          Website Content Management (CMS)
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Edit storefront hero banners, section visibility & ordering, navigation menus, footer links, brand policies, FAQs, and promo campaigns live.
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-stone-200 dark:border-stone-800 pb-3">
        {(
          [
            ['homepage', 'Homepage & Hero'],
            ['banners', 'Promo Banners'],
            ['navigation', 'Navigation Menu'],
            ['footer', 'Footer'],
            ['about', 'About & Policies'],
            ['contact', 'Contact Info'],
            ['faqs', 'FAQs'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-3.5 py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              activeTab === key
                ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                : 'bg-white dark:bg-[#191816] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: HOMEPAGE */}
      {activeTab === 'homepage' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Hero Eyebrow</label>
              <input
                type="text"
                value={cms.homepage.heroEyebrow}
                onChange={(e) => updateHomepage({ heroEyebrow: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Hero Headline</label>
              <input
                type="text"
                value={cms.homepage.heroTitle}
                onChange={(e) => updateHomepage({ heroTitle: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">Hero Subtitle</label>
              <textarea
                rows={2}
                value={cms.homepage.heroSubtitle}
                onChange={(e) => updateHomepage({ heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Primary CTA Label</label>
              <input
                type="text"
                value={cms.homepage.primaryCtaLabel}
                onChange={(e) => updateHomepage({ primaryCtaLabel: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Secondary AI CTA Label</label>
              <input
                type="text"
                value={cms.homepage.secondaryCtaLabel}
                onChange={(e) => updateHomepage({ secondaryCtaLabel: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block font-medium">Hero Image URL & Upload</label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-16 h-11 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                  <ProductImage
                    src={cms.homepage.heroImage}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  value={cms.homepage.heroImage}
                  onChange={(e) => updateHomepage({ heroImage: e.target.value })}
                  className="flex-1 min-w-[200px] px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Hero</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => void handleHeroImageUpload(e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Top Announcement Ribbon</span>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cms.homepage.promoBannerActive}
                    onChange={(e) => updateHomepage({ promoBannerActive: e.target.checked })}
                  />
                  <span>Active on storefront</span>
                </label>
              </div>
              <input
                type="text"
                value={cms.homepage.promoBannerText}
                onChange={(e) => updateHomepage({ promoBannerText: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <p className="font-semibold">Homepage Sections Order & Visibility</p>
              <div className="divide-y divide-stone-200 dark:divide-stone-800 rounded-lg border border-stone-200 dark:border-stone-800">
                {cms.homepage.sections.map((sec, idx) => (
                  <div key={sec.key} className="flex items-center justify-between p-3">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sec.visible}
                        onChange={(e) => {
                          const next = cms.homepage.sections.map((item, i) =>
                            i === idx ? { ...item, visible: e.target.checked } : item
                          );
                          updateHomepage({ sections: next });
                        }}
                      />
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {sec.label}
                      </span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveHomepageSection(idx, -1)}
                        className="p-1.5 rounded border border-stone-200 dark:border-stone-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === cms.homepage.sections.length - 1}
                        onClick={() => moveHomepageSection(idx, 1)}
                        className="p-1.5 rounded border border-stone-200 dark:border-stone-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={savingSection === 'homepage'}
              onClick={() => void saveSection('homepage', cms.homepage, 'Homepage Settings')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === 'homepage' ? 'Saving...' : 'Save Homepage CMS'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PROMOTIONAL BANNERS */}
      {activeTab === 'banners' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Promotional Campaigns & Banners</h3>
              <p className="text-stone-500">Active banners display directly on the marketplace homepage.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setCms({
                  ...cms,
                  banners: [
                    ...cms.banners,
                    {
                      id: `bnr-${Date.now().toString(36)}`,
                      title: 'Seasonal Atelier Showcase',
                      subtitle: 'Curated discounts across flagship essentials.',
                      ctaLabel: 'Shop Collection',
                      ctaQuery: 'sale',
                      image: AVAILABLE_STUDIO_ASSETS[0],
                      active: true,
                      sortOrder: cms.banners.length + 1,
                    } satisfies BannerItem,
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Banner</span>
            </button>
          </div>

          <div className="space-y-4">
            {cms.banners.map((banner, idx) => (
              <div
                key={banner.id}
                className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.active}
                      onChange={(e) => {
                        const next = [...cms.banners];
                        next[idx] = { ...banner, active: e.target.checked };
                        setCms({ ...cms, banners: next });
                      }}
                    />
                    <span>Active Banner #{idx + 1}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCms({
                        ...cms,
                        banners: cms.banners.filter((b) => b.id !== banner.id),
                      })
                    }
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => {
                        const next = [...cms.banners];
                        next[idx] = { ...banner, title: e.target.value };
                        setCms({ ...cms, banners: next });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">CTA Button Label</label>
                    <input
                      type="text"
                      value={banner.ctaLabel}
                      onChange={(e) => {
                        const next = [...cms.banners];
                        next[idx] = { ...banner, ctaLabel: e.target.value };
                        setCms({ ...cms, banners: next });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) => {
                        const next = [...cms.banners];
                        next[idx] = { ...banner, subtitle: e.target.value };
                        setCms({ ...cms, banners: next });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Search Keyword / Query Target</label>
                    <input
                      type="text"
                      value={banner.ctaQuery}
                      onChange={(e) => {
                        const next = [...cms.banners];
                        next[idx] = { ...banner, ctaQuery: e.target.value };
                        setCms({ ...cms, banners: next });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                    <div className="w-14 h-10 rounded overflow-hidden bg-stone-200 dark:bg-stone-800 shrink-0">
                      <ProductImage
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <input
                      type="text"
                      value={banner.image}
                      onChange={(e) => {
                        const next = [...cms.banners];
                        next[idx] = { ...banner, image: e.target.value };
                        setCms({ ...cms, banners: next });
                      }}
                      className="flex-1 min-w-[200px] px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#191816] rounded-md cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => void handleBannerImageUpload(banner.id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={savingSection === 'banners'}
              onClick={() => void saveSection('banners', cms.banners, 'Promotional Banners')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === 'banners' ? 'Saving...' : 'Save Banners'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: NAVIGATION */}
      {activeTab === 'navigation' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Header Navigation Menu</h3>
              <p className="text-stone-500">Customize top storefront bar links, visibility, and action targets.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setCms({
                  ...cms,
                  navigation: [
                    ...cms.navigation,
                    {
                      id: `nav-${Date.now().toString(36)}`,
                      label: 'New Link',
                      actionType: 'search',
                      targetValue: 'featured',
                      visible: true,
                    } satisfies NavMenuItem,
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Nav Item</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {cms.navigation.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800"
              >
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...cms.navigation];
                      next[idx] = { ...item, label: e.target.value };
                      setCms({ ...cms, navigation: next });
                    }}
                    placeholder="Label"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={item.actionType}
                    onChange={(e) => {
                      const next = [...cms.navigation];
                      next[idx] = {
                        ...item,
                        actionType: e.target.value as NavMenuItem['actionType'],
                      };
                      setCms({ ...cms, navigation: next });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded"
                  >
                    <option value="home">Home</option>
                    <option value="categories">Categories Drawer</option>
                    <option value="flashDeals">Flash Deals</option>
                    <option value="allProducts">All Products</option>
                    <option value="category">Specific Category</option>
                    <option value="search">Search Keyword</option>
                    <option value="policy">Info / Policy Modal</option>
                    <option value="admin">Admin Portal</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={item.targetValue || ''}
                    onChange={(e) => {
                      const next = [...cms.navigation];
                      next[idx] = { ...item, targetValue: e.target.value };
                      setCms({ ...cms, navigation: next });
                    }}
                    placeholder="Target (category / query / about)"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={(e) => {
                        const next = [...cms.navigation];
                        next[idx] = { ...item, visible: e.target.checked };
                        setCms({ ...cms, navigation: next });
                      }}
                    />
                    <span>Visible</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCms({
                        ...cms,
                        navigation: cms.navigation.filter((n) => n.id !== item.id),
                      })
                    }
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={savingSection === 'navigation'}
              onClick={() => void saveSection('navigation', cms.navigation, 'Navigation Menu')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === 'navigation' ? 'Saving...' : 'Save Navigation'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: FOOTER */}
      {activeTab === 'footer' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4 text-xs">
          {(() => {
            const updateFooter = (patch: Partial<FooterCmsConfig>) =>
              setCms({ ...cms, footer: { ...cms.footer, ...patch } });
            return (
              <>
                <div>
                  <label className="block font-medium mb-1">Footer Brand Tagline</label>
                  <textarea
                    rows={2}
                    value={cms.footer.tagline}
                    onChange={(e) => updateFooter({ tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Copyright Line</label>
                    <input
                      type="text"
                      value={cms.footer.copyrightText}
                      onChange={(e) => updateFooter({ copyrightText: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Shipping / Authenticity Notice</label>
                    <input
                      type="text"
                      value={cms.footer.shippingNotice}
                      onChange={(e) => updateFooter({ shippingNotice: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={cms.footer.socialLinks.instagram}
                      onChange={(e) =>
                        updateFooter({
                          socialLinks: { ...cms.footer.socialLinks, instagram: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Twitter / X URL</label>
                    <input
                      type="text"
                      value={cms.footer.socialLinks.twitter}
                      onChange={(e) =>
                        updateFooter({
                          socialLinks: { ...cms.footer.socialLinks, twitter: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">YouTube URL</label>
                    <input
                      type="text"
                      value={cms.footer.socialLinks.youtube}
                      onChange={(e) =>
                        updateFooter({
                          socialLinks: { ...cms.footer.socialLinks, youtube: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={savingSection === 'footer'}
                    onClick={() => void saveSection('footer', cms.footer, 'Footer Settings')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'footer' ? 'Saving...' : 'Save Footer'}</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* TAB 5: ABOUT & POLICIES */}
      {activeTab === 'about' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4 text-xs">
          {(() => {
            const updateAbout = (patch: Partial<AboutCmsConfig>) =>
              setCms({ ...cms, about: { ...cms.about, ...patch } });
            return (
              <>
                <div>
                  <label className="block font-medium mb-1">About Us Headline</label>
                  <input
                    type="text"
                    value={cms.about.headline}
                    onChange={(e) => updateAbout({ headline: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Brand Story</label>
                  <textarea
                    rows={3}
                    value={cms.about.story}
                    onChange={(e) => updateAbout({ story: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Warranty Statement</label>
                    <textarea
                      rows={2}
                      value={cms.about.warrantyStatement}
                      onChange={(e) => updateAbout({ warrantyStatement: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Shipping Policy</label>
                    <textarea
                      rows={2}
                      value={cms.about.shippingPolicy}
                      onChange={(e) => updateAbout({ shippingPolicy: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Returns & Exchanges Policy</label>
                    <textarea
                      rows={2}
                      value={cms.about.returnsPolicy}
                      onChange={(e) => updateAbout({ returnsPolicy: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Privacy Policy</label>
                    <textarea
                      rows={2}
                      value={cms.about.privacyPolicy}
                      onChange={(e) => updateAbout({ privacyPolicy: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Terms of Service</label>
                  <textarea
                    rows={2}
                    value={cms.about.termsPolicy}
                    onChange={(e) => updateAbout({ termsPolicy: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={savingSection === 'about'}
                    onClick={() => void saveSection('about', cms.about, 'About & Policies')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'about' ? 'Saving...' : 'Save Policies'}</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* TAB 6: CONTACT */}
      {activeTab === 'contact' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4 text-xs">
          {(() => {
            const updateContact = (patch: Partial<ContactCmsConfig>) =>
              setCms({ ...cms, contact: { ...cms.contact, ...patch } });
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Concierge Support Email</label>
                    <input
                      type="email"
                      value={cms.contact.email}
                      onChange={(e) => updateContact({ email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={cms.contact.phone}
                      onChange={(e) => updateContact({ phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Showroom / Flagship Address</label>
                    <input
                      type="text"
                      value={cms.contact.showroom}
                      onChange={(e) => updateContact({ showroom: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Client Hours</label>
                    <input
                      type="text"
                      value={cms.contact.hours}
                      onChange={(e) => updateContact({ hours: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={savingSection === 'contact'}
                    onClick={() => void saveSection('contact', cms.contact, 'Contact Information')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSection === 'contact' ? 'Saving...' : 'Save Contact Info'}</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* TAB 7: FAQs */}
      {activeTab === 'faqs' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Frequently Asked Questions</h3>
              <p className="text-stone-500">Shown in the Storefront Help & Policy drawer.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setCms({
                  ...cms,
                  faqs: [
                    ...cms.faqs,
                    {
                      id: `faq-${Date.now().toString(36)}`,
                      question: 'New question',
                      answer: 'Detailed customer response.',
                    } satisfies FaqItem,
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add FAQ</span>
            </button>
          </div>

          <div className="space-y-3">
            {cms.faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-stone-500">FAQ #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCms({ ...cms, faqs: cms.faqs.filter((f) => f.id !== faq.id) })
                    }
                    className="p-1 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => {
                    const next = [...cms.faqs];
                    next[idx] = { ...faq, question: e.target.value };
                    setCms({ ...cms, faqs: next });
                  }}
                  placeholder="Question"
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md font-medium"
                />
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => {
                    const next = [...cms.faqs];
                    next[idx] = { ...faq, answer: e.target.value };
                    setCms({ ...cms, faqs: next });
                  }}
                  placeholder="Answer"
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={savingSection === 'faqs'}
              onClick={() => void saveSection('faqs', cms.faqs, 'FAQs')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSection === 'faqs' ? 'Saving...' : 'Save FAQs'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
