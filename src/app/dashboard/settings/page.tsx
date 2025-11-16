'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [materialsCount, setMaterialsCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMaterialsCount();
    }
  }, [session]);

  const fetchMaterialsCount = async () => {
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        setMaterialsCount(data.materials?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching materials count:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar materialsCount={materialsCount} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar materialsCount={materialsCount} />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">{t('settings.title')}</h1>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">{t('settings.language')}</h2>
                <p className="text-sm text-gray-600 mb-4">{t('settings.selectLanguage')}</p>
                
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 min-w-[140px] px-4 py-3 rounded-md border-2 transition-all font-semibold ${
                      language === 'en'
                        ? 'border-gray-900 bg-gray-100 text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🇬🇧</span>
                      <span>English</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setLanguage('fr')}
                    className={`flex-1 min-w-[140px] px-4 py-3 rounded-md border-2 transition-all font-semibold ${
                      language === 'fr'
                        ? 'border-gray-900 bg-gray-100 text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🇫🇷</span>
                      <span>Français</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setLanguage('ar')}
                    className={`flex-1 min-w-[140px] px-4 py-3 rounded-md border-2 transition-all font-semibold ${
                      language === 'ar'
                        ? 'border-gray-900 bg-gray-100 text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🇸🇦</span>
                      <span>العربية</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

