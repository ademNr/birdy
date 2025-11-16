'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUpload } from '../contexts/UploadContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  materialsCount: number;
}

export default function Sidebar({ materialsCount }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { uploadState } = useUpload();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      // Refresh unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        return;
      }
      
      const text = await response.text();
      if (!text) {
        return;
      }

      const data = JSON.parse(text);
      setUnreadCount(data.notifications?.filter((n: any) => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: '🏠',
      path: '/dashboard',
    },
    {
      id: 'materials',
      label: t('nav.materials'),
      icon: '📚',
      path: '/dashboard/materials',
      badge: materialsCount,
    },
    {
      id: 'notifications',
      label: t('nav.notifications'),
      icon: '🔔',
      path: '/dashboard/notifications',
      badge: unreadCount,
    },
    {
      id: 'generate',
      label: t('nav.generate'),
      icon: '✨',
      path: '/dashboard/generate',
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: '⚙️',
      path: '/dashboard/settings',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(path);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear all session data and sign out
      await signOut({ 
        redirect: true,
        callbackUrl: '/auth/signin'
      });
      // Clear any local storage or cache if needed
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if signOut fails
      window.location.href = '/auth/signin';
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/examlyBird.png"
            alt="Birdy"
            width={32}
            height={32}
            className="w-8 h-8 flex-shrink-0"
          />
          <h1 className="text-lg font-bold text-gray-900">Birdy</h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const active = isActive(item.path);
          const isGenerateItem = item.id === 'generate';
          const showLoading = isGenerateItem && (uploadState.isUploading || uploadState.isProcessing);
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-left text-sm relative ${
                active
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 font-medium'
              }`}
            >
              {showLoading && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-900 animate-pulse rounded-l-md"></div>
              )}
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {showLoading ? (
                <div className="relative flex items-center justify-center">
                  <svg 
                    className="h-5 w-5 text-gray-900 animate-pulse" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-900 rounded-full animate-ping opacity-60"></div>
                  </div>
                </div>
              ) : (
                item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      active
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )
              )}
            </button>
          );
                })}
              </nav>

      {/* User Section */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-2 bg-gray-50 rounded-md">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gray-700 font-semibold text-xs">
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {session?.user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500">Student</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging out...
            </>
          ) : (
            <>
              <span>🚪</span>
              {t('common.logout')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

