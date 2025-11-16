'use client';

import { SessionProvider } from 'next-auth/react';
import { UploadProvider } from '../contexts/UploadContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <UploadProvider>{children}</UploadProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

