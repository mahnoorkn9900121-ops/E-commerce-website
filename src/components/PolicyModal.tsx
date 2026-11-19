import { X } from 'lucide-react';
import { STORE_POLICIES } from '../data/catalog.ts';
import { useStore } from '../context/StoreContext.tsx';

const POLICY_TITLES = {
  about: 'About MAISON KOVA',
  shipping: 'Shipping & Delivery',
  returns: 'Returns & Exchanges',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  contact: 'Showroom & Client Contact',
} as const;

export function PolicyModal() {
  const { activePolicy, setActivePolicy, storefrontConfig } = useStore();

  if (!activePolicy) return null;

  const cms = storefrontConfig?.cms;
  const brandName = cms?.settings.websiteName || 'MAISON KOVA';
  const about = cms?.about;
  const contact = cms?.contact || STORE_POLICIES.contact;
  const faqs =
    cms?.faqs && cms.faqs.length > 0
      ? cms.faqs
      : STORE_POLICIES.faqs.map((f, i) => ({ id: `f-${i}`, question: f.q, answer: f.a }));

  const title =
    activePolicy === 'about' ? `About ${brandName}` : POLICY_TITLES[activePolicy];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0" onClick={() => setActivePolicy(null)} />

      <div className="relative z-10 w-full max-w-xl bg-[#FAF9F6] dark:bg-[#141312] rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <h2 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => setActivePolicy(null)}
            aria-label="Close modal"
            className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-stone-700 dark:text-stone-300 leading-relaxed max-h-[75vh] overflow-y-auto">
          {activePolicy === 'about' && (
            <>
              {about?.headline && (
                <p className="font-display text-xl text-stone-900 dark:text-stone-100">
                  {about.headline}
                </p>
              )}
              <p>{about?.story || STORE_POLICIES.about}</p>
              <p>{about?.warrantyStatement || STORE_POLICIES.warranty}</p>
            </>
          )}

          {activePolicy === 'shipping' && (
            <>
              <p>{about?.shippingPolicy || STORE_POLICIES.shipping}</p>
              <p>{about?.returnsPolicy || STORE_POLICIES.returns}</p>
            </>
          )}

          {activePolicy === 'returns' && (
            <>
              <p>{about?.returnsPolicy || STORE_POLICIES.returns}</p>
              <p>{about?.warrantyStatement || STORE_POLICIES.warranty}</p>
            </>
          )}

          {activePolicy === 'privacy' && <p>{about?.privacyPolicy || STORE_POLICIES.privacy}</p>}

          {activePolicy === 'terms' && <p>{about?.termsPolicy || STORE_POLICIES.terms}</p>}

          {activePolicy === 'contact' && (
            <div className="space-y-3">
              <p>
                <strong className="text-stone-900 dark:text-stone-100">Client Concierge:</strong>{' '}
                {contact.email}
              </p>
              <p>
                <strong className="text-stone-900 dark:text-stone-100">Telephone:</strong>{' '}
                <span className="font-mono-tabular">{contact.phone}</span>
              </p>
              <p>
                <strong className="text-stone-900 dark:text-stone-100">Flagship Showroom:</strong>{' '}
                {contact.showroom}
              </p>
              <p>
                <strong className="text-stone-900 dark:text-stone-100">Hours:</strong>{' '}
                {contact.hours}
              </p>
            </div>
          )}

          {(activePolicy === 'shipping' || activePolicy === 'returns' || activePolicy === 'about') &&
            faqs.length > 0 && (
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100">
                  Frequently Asked Questions
                </p>
                {faqs.map((faq) => (
                  <div key={faq.id}>
                    <p className="font-medium text-stone-900 dark:text-stone-100">{faq.question}</p>
                    <p className="text-stone-600 dark:text-stone-400 mt-0.5">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
