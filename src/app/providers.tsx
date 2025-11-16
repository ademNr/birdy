'use client';

import { SessionProvider } from 'next-auth/react';
import { UploadProvider } from '../contexts/UploadContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import DirectionHandler from '../components/DirectionHandler';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <DirectionHandler />
        <UploadProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </UploadProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

