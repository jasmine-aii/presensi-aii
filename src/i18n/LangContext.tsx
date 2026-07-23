import React, { createContext, useContext, useMemo, useState } from 'react';
import { strings, langName, type Lang, type Dict } from './strings';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** The active-language dictionary — access copy as `s.home.greeting`. */
  s: Dict;
  langName: string;
}

const LangContext = createContext<LangContextValue | null>(null);

/** Runtime language switcher (the design's `S = { id, en }` dictionary). */
export function LangProvider({ initial = 'id', children }: { initial?: Lang; children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial);
  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === 'id' ? 'en' : 'id')),
      s: strings[lang],
      langName: langName[lang],
    }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a <LangProvider>');
  return ctx;
}
