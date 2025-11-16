'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import { useLanguage } from '../../contexts/LanguageContext';
import { DashboardCardShimmer, StatsShimmer } from '../../components/Shimmer';
import { useMaterials } from '../../../lib/hooks/useMaterials';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { materials, isLoading } = useMaterials();
  const { t } = useLanguage();

  // Memoize recent materials
  const recentMaterials = useMemo(() => {
    return materials.slice(0, 3);
  }, [materials]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar materialsCount={materials.length} />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">{t('dashboard.title')}</h1>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t('dashboard.welcome')}</h2>
              <p className="text-sm text-gray-600">
                {t('dashboard.ready')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/generate"
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                    <span className="text-xl">✨</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900">{t('dashboard.generateNew')}</h3>
                    <p className="text-xs text-gray-600">{t('dashboard.uploadProcess')}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {t('dashboard.uploadDescription')}
                </p>
              </Link>

              <Link
                href="/dashboard/materials"
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                    <span className="text-xl">📚</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900">{t('dashboard.myMaterials')}</h3>
                    <p className="text-xs text-gray-600">{t('dashboard.savedMaterials', { count: materials.length })}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {t('dashboard.viewManage')}
                </p>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{materials.length}</p>
                    <p className="text-xs text-gray-600 font-medium">{t('dashboard.totalMaterials')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {materials.filter((m: any) => m.summary).length}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">{t('dashboard.processed')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎴</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {materials.reduce((acc: number, m: any) => acc + (m.flashcards?.length || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">{t('dashboard.flashcards')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Materials */}
            {recentMaterials.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">{t('dashboard.recentMaterials')}</h2>
                  <Link
                    href="/dashboard/materials"
                    className="text-xs text-gray-700 hover:text-gray-900 font-semibold"
                  >
                    {t('dashboard.viewAll')}
                  </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  {recentMaterials.map((material: any) => (
                    <Link
                      key={material.id}
                      href="/dashboard/materials"
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                        {material.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2">
                        {material.summary && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                            {t('dashboard.processed')}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

