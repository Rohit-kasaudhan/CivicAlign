import React, { useRef, useEffect, useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES } from '../../utils/constants';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { updateLanguage } from '../../api/auth';

// Language groups shown in dropdown with section headers
const GROUPS = [
  { label: 'Global',         codes: ['en'] },
  { label: 'Indian',         codes: ['hi', 'mr', 'bn', 'ta', 'te', 'gu', 'pa', 'ur'] },
  { label: 'Middle Eastern', codes: ['ar'] },
  { label: 'European',       codes: ['fr', 'de', 'es', 'ru'] },
  { label: 'Asian',          codes: ['zh', 'ja', 'ko'] },
];

const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();
  const { user, updateUser }         = useAuth();
  const [open, setOpen]              = useState(false);
  const dropRef                      = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = async (code) => {
    changeLanguage(code);
    setOpen(false);
    if (user) {
      try {
        const data = await updateLanguage(code);
        updateUser(data.user);
      } catch {}
    }
  };

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={15} className="text-gray-500 shrink-0" />
        <span className="font-medium hidden sm:inline">{currentLang.native}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto"
          role="listbox"
        >
          {GROUPS.map((group) => {
            const langs = LANGUAGES.filter((l) => group.codes.includes(l.code));
            if (!langs.length) return null;
            return (
              <div key={group.label}>
                {/* Group header */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {group.label}
                </p>

                {langs.map((lang) => {
                  const active = lang.code === language;
                  return (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={active}
                      onClick={() => handleSelect(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-2 transition-colors
                        ${active
                          ? 'bg-blue-50 text-[#1e40af] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="font-medium shrink-0">{lang.native}</span>
                        <span className="text-gray-400 text-xs truncate">{lang.label}</span>
                      </span>
                      {active && <Check size={13} className="text-[#1e40af] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
