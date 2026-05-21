import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en } from '../locales/en';
import { bn } from '../locales/bn';

const translations = { en, bn };

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

// Resolve a dot-notation key like "nav.dashboard" from a nested object
const resolve = (obj, key) => {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
};

// Bengali numeral map
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBanglaNumber = (num) => {
  return String(num).replace(/[0-9]/g, d => BN_DIGITS[parseInt(d)]);
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('krishak_lang') || 'en';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('krishak_lang', newLang);
  };

  // Apply/remove Bangla font class on <html>
  useEffect(() => {
    if (lang === 'bn') {
      document.documentElement.classList.add('lang-bn');
    } else {
      document.documentElement.classList.remove('lang-bn');
    }
  }, [lang]);

  // t(key, vars?) — translate a key with optional {{var}} interpolation
  const t = useCallback((key, vars) => {
    const dict = translations[lang] || translations.en;
    let str = resolve(dict, key);
    // Fallback to English if key is missing in current language
    if (str === null) {
      str = resolve(translations.en, key);
    }
    // Last resort: return the key itself
    if (str === null) return key;

    // Variable interpolation: {{name}} → vars.name
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });
    }
    return str;
  }, [lang]);

  // n(number) — convert to Bangla numerals when lang is 'bn'
  const n = useCallback((num) => {
    if (lang === 'bn') return toBanglaNumber(num);
    return String(num);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, n }}>
      {children}
    </LanguageContext.Provider>
  );
};
