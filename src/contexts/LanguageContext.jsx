/**
 * LANGUAGE CONTEXT - Veta Creativa Láser
 *
 * Contexto de idioma (castellano / catalán) con persistencia en localStorage.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'veta-language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // ignorar errores de almacenamiento
    }
  }, []);

  // Función de traducción: cae al español si no hay traducción
  const t = useCallback((key) => {
    const dict = language && translations[language] ? translations[language] : translations.es;
    return dict[key] ?? translations.es[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Si no hay provider, devolver un fallback seguro
    return { language: 'es', setLanguage: () => {}, t: (k) => k };
  }
  return ctx;
}
