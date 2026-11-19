import { STORE_POLICIES } from '../data/catalog.ts';
import { useStore } from '../context/StoreContext.tsx';

export function Footer() {
  const { setActivePolicy, openCategory, openSearch, openAdmin, storefrontConfig } = useStore();
  const cms = storefrontConfig?.cms;
  const brandName = cms?.settings.websiteName || STORE_POLICIES.brandName;
  const tagline =
    cms?.footer.tagline ||
    `${STORE_POLICIES.tagline}. 1,500+ curated products across 20 specialized marketplace departments.`;
  const contact = cms?.contact || STORE_POLICIES.contact;
  const copyright =
    cms?.footer.copyrightText ||
    `© ${new Date().getFullYear()} ${brandName} Marketplace. All rights reserved.`;
  const shippingNotice =
    cms?.footer.shippingNotice || 'Complimentary Express Delivery on Orders Over $150';
  const socialLinks = cms?.footer.socialLinks || cms?.settings.socialUrls;

  const topCategories =
    storefrontConfig?.categories && storefrontConfig.categories.length > 0
      ? storefrontConfig.categories.slice(0, 5).map((c) => c.name)
      : [
          'Mobile Phones',
          'Laptops & Computers',
          'Shoes & Sneakers',
          'Headphones & Audio',
          'Home Appliances',
        ];

  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-[#F3F0EA] dark:bg-[#161513] text-stone-700 dark:text-stone-300">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Contact */}
          <div className="space-y-3">
            <p className="font-display text-2xl font-semibold tracking-[0.06em] text-stone-900 dark:text-stone-100">
              {brandName}
            </p>
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {tagline}
            </p>
            <div className="pt-2 text-xs space-y-1 text-stone-600 dark:text-stone-400">
              <p>{contact.showroom}</p>
              <p>
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-4"
                >
                  {contact.email}
                </a>
              </p>
              <p className="font-mono-tabular">{contact.phone}</p>
            </div>
            {socialLinks && (
              <div className="flex flex-wrap gap-3 pt-1 text-xs">
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 underline underline-offset-4"
                  >
                    Instagram
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 underline underline-offset-4"
                  >
                    X / Twitter
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 underline underline-offset-4"
                  >
                    YouTube
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Marketplace Departments */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-900 dark:text-stone-100 mb-4">
              Top Departments
            </h3>
            <ul className="space-y-2 text-sm">
              {topCategories.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => openCategory(cat)}
                    className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Care */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-900 dark:text-stone-100 mb-4">
              Client Care
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('shipping')}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  Shipping &amp; Returns
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('returns')}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  2-Year Hardware Warranty
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('contact')}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  Contact Information
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openSearch('', { flashSaleOnly: true })}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  Flash Sale Deals
                </button>
              </li>
            </ul>
          </div>

          {/* Maison & Seller Portal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-900 dark:text-stone-100 mb-4">
              Marketplace
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={openAdmin}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  Admin &amp; Seller Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('about')}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  About {brandName}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('privacy')}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePolicy('terms')}
                  className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                >
                  Terms &amp; Conditions
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <p>{copyright}</p>
          <p>{shippingNotice}</p>
        </div>
      </div>
    </footer>
  );
}
