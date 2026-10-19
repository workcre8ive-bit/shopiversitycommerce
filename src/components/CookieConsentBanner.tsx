import React, { useState, useEffect } from "react";
import { Cookie, ShieldCheck, X, Settings, Check, ExternalLink } from "lucide-react";

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "shopiversity_cookie_consent";

interface CookieConsentBannerProps {
  onNavigateCookies?: () => void;
  onNavigatePrivacy?: () => void;
  isOpenModalExplicitly?: boolean;
  onCloseModalExplicitly?: () => void;
}

export default function CookieConsentBanner({
  onNavigateCookies,
  onNavigatePrivacy,
  isOpenModalExplicitly = false,
  onCloseModalExplicitly
}: CookieConsentBannerProps) {
  const [hasConsented, setHasConsented] = useState<boolean>(true); // default true until checked to avoid flash
  const [showModal, setShowModal] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: true,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setHasConsented(false);
      } else {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setHasConsented(true);
      }
    } catch {
      setHasConsented(false);
    }
  }, []);

  // Sync external open request
  useEffect(() => {
    if (isOpenModalExplicitly) {
      setShowModal(true);
    }
  }, [isOpenModalExplicitly]);

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setPreferences(prefs);
      setHasConsented(true);
      setShowModal(false);
      if (onCloseModalExplicitly) {
        onCloseModalExplicitly();
      }
      window.dispatchEvent(new CustomEvent("shopiversity_cookie_updated", { detail: prefs }));
    } catch (e) {
      console.warn("Could not save cookie preferences:", e);
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString()
    };
    savePreferences(allAccepted);
  };

  const handleEssentialOnly = () => {
    const essentialOnly: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString()
    };
    savePreferences(essentialOnly);
  };

  const handleSaveCustom = () => {
    savePreferences({
      ...preferences,
      necessary: true, // always true
      timestamp: new Date().toISOString()
    });
  };

  return (
    <>
      {/* Non-intrusive Floating Cookie Consent Banner */}
      {!hasConsented && !showModal && (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[99990] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#ff6b00] flex items-center justify-center shrink-0 border border-orange-200/50 dark:border-orange-900/30">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Student Privacy & Cookies
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                We use strictly necessary cookies to keep your session secure, preserve your cart, and safeguard your Paystack escrow transactions. No intrusive 3rd-party ad trackers.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {onNavigateCookies && (
                  <button
                    type="button"
                    onClick={onNavigateCookies}
                    className="hover:text-[#ff6b00] underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Cookies Policy
                  </button>
                )}
                <span>•</span>
                {onNavigatePrivacy && (
                  <button
                    type="button"
                    onClick={onNavigatePrivacy}
                    className="hover:text-[#ff6b00] underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Privacy Policy
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 py-2 px-3.5 bg-[#ff6b00] hover:bg-[#e05e00] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-500/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              aria-label="Customize cookie preferences"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
              title="Customize preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Detailed Granular Cookie Preferences Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 font-sans"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#ff6b00] flex items-center justify-center">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="cookie-modal-title" className="text-base font-black text-slate-900 dark:text-white">
                    Cookie & Storage Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Customize which data storage categories are enabled
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  if (onCloseModalExplicitly) onCloseModalExplicitly();
                }}
                aria-label="Close cookie preferences modal"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Options */}
            <div className="space-y-4">
              {/* Necessary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Strictly Necessary
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                    Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Crucial for authentication, CSRF tokens, persistent cart state, and securing Paystack escrow payment tokens. Cannot be disabled.
                </p>
              </div>

              {/* Functional */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Functional Preferences
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                      className="sr-only peer"
                      aria-label="Toggle functional cookies"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff6b00]"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Saves your chosen university campus filter, dark/light theme, and sound alert toggles.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Performance & Diagnostics
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                      aria-label="Toggle analytics cookies"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff6b00]"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Anonymous performance metrics used to debug page load speeds and API errors across Nigerian university networks.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
              >
                Accept All
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="flex-1 sm:flex-initial py-2.5 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex-1 sm:flex-initial py-2.5 px-5 bg-[#ff6b00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b00] outline-none"
                >
                  Save Choices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
