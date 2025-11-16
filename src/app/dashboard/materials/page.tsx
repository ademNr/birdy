'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import StudyMaterialView from '../../../components/StudyMaterialView';
import ProcessingLoader from '../../../components/ProcessingLoader';
import { useUpload } from '../../../contexts/UploadContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { MaterialsListShimmer, MaterialCardShimmer } from '../../../components/Shimmer';
import Link from 'next/link';

export default function MaterialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { uploadState } = useUpload();
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMaterialsList, setShowMaterialsList] = useState(true);
  const [processingDocuments, setProcessingDocuments] = useState<Array<{ id: string; originalName: string; fileType: string }>>([]);
  const [processingProgress, setProcessingProgress] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Update processing documents when processing state changes
  useEffect(() => {
    setProcessingProgress(uploadState.processingProgress);
  }, [uploadState.processingProgress]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMaterials();
    }
  }, [session]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      if (response.ok) {
        setMaterials(data.materials);
        // Set selected material from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const materialId = urlParams.get('materialId');
        if (materialId) {
          const material = data.materials.find((m: any) => m.id === materialId);
          if (material) {
            setSelectedMaterial(material);
            // Hide list on mobile after selection
            if (window.innerWidth < 768) {
              setShowMaterialsList(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = materials.filter((material) =>
    material.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{t('materials.title')}</h1>
          <Link
            href="/dashboard/generate"
            className="bg-gray-900 text-white px-4 py-1.5 rounded-md font-bold hover:bg-gray-800 transition-colors text-sm"
          >
            {t('materials.newMaterial')}
          </Link>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Processing Loader - Show if processing */}
            {uploadState.isProcessing && processingDocuments.length > 0 && (
              <div className="mb-4">
                <ProcessingLoader
                  isProcessing={uploadState.isProcessing}
                  progress={processingProgress || uploadState.processingProgress}
                  documentIds={processingDocuments.map(d => d.id)}
                  documents={processingDocuments}
                />
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                <MaterialCardShimmer />
                <MaterialCardShimmer />
                <MaterialCardShimmer />
              </div>
            ) : materials.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="text-5xl mb-3">📚</div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">{t('materials.noMaterials')}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {t('materials.startGenerating')}
                </p>
                <Link
                  href="/dashboard/generate"
                  className="inline-block bg-gray-900 text-white px-4 py-2 rounded-md font-bold hover:bg-gray-800 transition-colors text-sm"
                >
                  {t('materials.generateNew')}
                </Link>
              </div>
            ) : (
              <div className="flex gap-4">
                {/* Collapsible Materials List */}
                {showMaterialsList && (
                  <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-gray-900">
                          {t('materials.materials')} ({filteredMaterials.length})
                        </h2>
                        <button
                          onClick={() => setShowMaterialsList(false)}
                          className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                          title={t('materials.hideList')}
                        >
                          ←
                        </button>
                      </div>
                      
                      {/* Search Bar - Only visible when list is shown */}
                      <div className="relative mb-3">
                        <input
                          type="text"
                          placeholder={t('materials.search')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 placeholder-gray-400"
                        />
                        <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {isLoading ? (
                          <MaterialsListShimmer />
                        ) : (
                          filteredMaterials.map((material) => (
                          <button
                            key={material.id}
                            onClick={() => {
                              setSelectedMaterial(material);
                              // On mobile, hide list after selection
                              if (window.innerWidth < 1024) {
                                setShowMaterialsList(false);
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-md border transition-all text-sm ${
                              selectedMaterial?.id === material.id
                                ? 'bg-gray-100 border-gray-300'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-xs">
                              {material.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-600">
                                {new Date(material.createdAt).toLocaleDateString()}
                              </p>
                              {material.summary && (
                                <span className="text-xs text-gray-700 font-bold">✓</span>
                              )}
                            </div>
                          </button>
                        ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                  {selectedMaterial ? (
                    <div>
                      {/* Show/Hide Button - only visible when list is hidden, sticky at top, aligned with title */}
                      {!showMaterialsList && (
                        <div className="sticky top-4 z-20 mb-2" style={{ marginLeft: '-32px' }}>
                          <button
                            onClick={() => setShowMaterialsList(true)}
                            className="bg-white border border-gray-400 rounded-r-md px-2.5 py-2 shadow-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900 text-sm font-bold"
                            title="Show materials list"
                          >
                            →
                          </button>
                        </div>
                      )}
                    <StudyMaterialView 
                      material={selectedMaterial}
                      isOwner={selectedMaterial.isOwner === true}
                      onMaterialUpdate={(updatedMaterial) => {
                        // Update the material in the list
                        setMaterials(prev => 
                          prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m)
                        );
                        setSelectedMaterial(updatedMaterial);
                      }}
                    />
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <div className="text-4xl mb-3">👈</div>
                      <h2 className="text-base font-bold text-gray-900 mb-1">{t('materials.selectMaterial')}</h2>
                      <p className="text-sm text-gray-600 mb-4">
                        {showMaterialsList 
                          ? t('materials.chooseFromList')
                          : t('materials.clickArrow')}
                      </p>
                      {!showMaterialsList && (
                        <button
                          onClick={() => setShowMaterialsList(true)}
                          className="bg-gray-900 text-white px-4 py-2 rounded-md font-bold hover:bg-gray-800 transition-colors text-sm"
                        >
                          {t('materials.showList')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

