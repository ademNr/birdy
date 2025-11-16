'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { UploadProvider } from '../contexts/UploadContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import DirectionHandler from '../components/DirectionHandler';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          dedupingInterval: 2000,
          errorRetryCount: 3,
          errorRetryInterval: 5000,
        }}
      >
        <LanguageProvider>
          <DirectionHandler />
          <UploadProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </UploadProvider>
        </LanguageProvider>
      </SWRConfig>
    </SessionProvider>
  );
}

