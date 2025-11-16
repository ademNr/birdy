'use client';

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function DirectionHandler() {
  const { language } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    if (language === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', language === 'fr' ? 'fr' : 'en');
    }
  }, [language]);

  return null;
}

