import React, { useEffect, useState } from 'react';
import { Lock, Save, Upload } from 'lucide-react';
import type { FullCmsPayload, SiteSettings } from '../../types/store.ts';
import { ProductImage } from '../ProductImage.tsx';
import { adminFetch, uploadAdminImage } from './adminApi.ts';

interface AdminSettingsSectionProps {
  onStorefrontMutated: () => void;
  showToast: (msg: string) => void;
  adminEmail: string;
}

export function AdminSettingsSection({
  onStorefrontMutated,
  showToast,
  adminEmail,
}: AdminSettingsSectionProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminFetch<FullCmsPayload>('/api/admin/cms')
      .then((data) => setSettings(data.settings))
      .catch((err) => showToast(err instanceof Error ? err.message : 'Unable to load settings.'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleUploadAsset = async (
    field: 'logoUrl' | 'faviconUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    try {
      const url = await uploadAdminImage(file);
      setSettings({ ...settings, [field]: url });
      showToast(`${field === 'logoUrl' ? 'Brand logo' : 'Favicon'} uploaded.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const updated = await adminFetch<FullCmsPayload>('/api/admin/cms/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings(updated.settings);
      onStorefrontMutated();
      showToast('Store settings saved and live across storefront.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Enter your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await adminFetch('/api/admin/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Administrator password updated securely.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
          Global Website Settings & Security
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Configure brand identity, SEO metadata, currency, default storefront theme, maintenance mode, and administrator credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
        {/* Global Store Settings Form */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-8 p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4"
        >
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Storefront Identity & SEO
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Website Name</label>
              <input
                type="text"
                required
                value={settings.websiteName}
                onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Logo Wordmark Text</label>
              <input
                type="text"
                value={settings.logoText}
                onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Brand Logo Image (Optional)</label>
              <div className="flex items-center gap-2">
                {settings.logoUrl && (
                  <div className="w-8 h-8 rounded overflow-hidden bg-stone-100 shrink-0">
                    <ProductImage
                      src={settings.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="/uploads/..."
                  className="flex-1 px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                />
                <label className="inline-flex items-center gap-1 px-2.5 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => void handleUploadAsset('logoUrl', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Favicon URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.faviconUrl}
                  onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                  placeholder="/uploads/..."
                  className="flex-1 px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                />
                <label className="inline-flex items-center gap-1 px-2.5 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => void handleUploadAsset('faviconUrl', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Primary Currency</label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    currency: e.target.value as SiteSettings['currency'],
                  })
                }
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Default Storefront Theme</label>
              <select
                value={settings.defaultTheme}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultTheme: e.target.value as 'light' | 'dark',
                  })
                }
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              >
                <option value="light">Warm Atelier Light</option>
                <option value="dark">Obsidian Dark</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">SEO Meta Title</label>
              <input
                type="text"
                value={settings.seoTitle}
                onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">SEO Meta Description</label>
              <textarea
                rows={2}
                value={settings.seoDescription}
                onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            {/* Maintenance Mode */}
            <div className="sm:col-span-2 p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-100">
                    Storefront Maintenance Mode
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Temporarily replaces the public storefront with a notice while keeping the Admin Console accessible.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) =>
                      setSettings({ ...settings, maintenanceMode: e.target.checked })
                    }
                  />
                  <span>{settings.maintenanceMode ? 'Active' : 'Off'}</span>
                </label>
              </div>
              <input
                type="text"
                value={settings.maintenanceMessage}
                onChange={(e) =>
                  setSettings({ ...settings, maintenanceMessage: e.target.value })
                }
                placeholder="Maintenance message shown to visitors..."
                className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? 'Saving...' : 'Save Store Settings'}</span>
            </button>
          </div>
        </form>

        {/* Change Admin Password Card */}
        <form
          onSubmit={handlePasswordChange}
          className="lg:col-span-4 p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#9A6B42] dark:text-[#C89B6E]" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Admin Password Security
            </h3>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Signed in as <span className="font-medium text-stone-800 dark:text-stone-200">{adminEmail}</span>. Changing your password hashes with scrypt and rotates other sessions.
          </p>

          <div>
            <label className="block font-medium mb-1">Current Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full py-2.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md font-medium cursor-pointer disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating Password...' : 'Update Admin Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
