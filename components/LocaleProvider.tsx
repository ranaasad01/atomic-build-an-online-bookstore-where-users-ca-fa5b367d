"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

function toAbstractMessages(obj: unknown): AbstractIntlMessages {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return {};
  }
  const result: AbstractIntlMessages = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === "string") {
      result[key] = value;
    } else if (Array.isArray(value)) {
      // Convert arrays to indexed string records or skip non-string arrays
      const arrayResult: AbstractIntlMessages = {};
      value.forEach((item, index) => {
        if (typeof item === "string") {
          arrayResult[String(index)] = item;
        } else if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          arrayResult[String(index)] = toAbstractMessages(item);
        }
      });
      result[key] = arrayResult;
    } else if (typeof value === "object" && value !== null) {
      result[key] = toAbstractMessages(value);
    }
  }
  return result;
}

const MESSAGES: Record<string, AbstractIntlMessages> = {
  en: toAbstractMessages(en),
  es: toAbstractMessages(es),
};

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";
const LOCALES = (process.env.NEXT_PUBLIC_LOCALES || "en,es")
  .split(",").map((s) => s.trim()).filter(Boolean);

type Ctx = { locale: string; setLocale: (l: string) => void; locales: string[] };
const LocaleCtx = createContext<Ctx>({ locale: DEFAULT_LOCALE, setLocale: () => {}, locales: LOCALES });
export const useSiteLocale = () => useContext(LocaleCtx);

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  useEffect(() => {
    try {
      const s = localStorage.getItem("site_locale");
      if (s && LOCALES.includes(s)) setLocaleState(s);
    } catch {}
  }, []);
  const setLocale = (l: string) => {
    setLocaleState(l);
    try { localStorage.setItem("site_locale", l); } catch {}
  };
  const messages = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE] || {};
  return (
    <LocaleCtx.Provider value={{ locale, setLocale, locales: LOCALES }}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="UTC"
        onError={() => {}}
        getMessageFallback={({ key }) => key.split(".").pop() || key}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleCtx.Provider>
  );
}
