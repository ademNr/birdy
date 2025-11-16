'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import FileUpload from '../../../components/FileUpload';
import StudyMaterialView from '../../../components/StudyMaterialView';
import ProcessingLoader from '../../../components/ProcessingLoader';
import { useUpload } from '../../../contexts/UploadContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Document {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
}

export default function GeneratePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const { uploadState, setProcessing, reset } = useUpload();
  const { t } = useLanguage();
  // All features are automatically selected - no checkboxes needed
  const [features] = useState({
    summary: true,
    keyPoints: true,
    formulas: true,
    examQuestions: true,
    mcqs: true,
    flashcards: true,
    studyPlan: true, // Always enabled, user only selects difficulty
  });
  const [studyPlanConfig, setStudyPlanConfig] = useState({
    difficulty: 'medium',
  });
  const [studyMaterial, setStudyMaterial] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [outputLanguage, setOutputLanguage] = useState<'english' | 'french'>('english');
  const [processingProgress, setProcessingProgress] = useState('');

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
    try {
      const response = await fetch('/api/materials');
      if (!response.ok) {
        console.error('Error fetching materials:', response.statusText);
        return;
      }
      
      const text = await response.text();
      if (!text) {
        console.error('Error fetching materials: Empty response');
        return;
      }

      const data = JSON.parse(text);
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleUploadComplete = (uploadedDocs: Document[]) => {
    setDocuments((prev) => {
      const updated = [...prev, ...uploadedDocs];
      return updated;
    });
    if (uploadedDocs.length > 0) {
      const fileNames = [...documents, ...uploadedDocs].map(d => d.originalName);
      const suggestedTitle = suggestTitleFromFiles(fileNames);
      setMaterialTitle(suggestedTitle);
    }
  };

  const suggestTitleFromFiles = (fileNames: string[]): string => {
    if (fileNames.length === 1) {
      const name = fileNames[0].replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim();
      return name || '';
    }
    const first = fileNames[0].replace(/\.[^/.]+$/, '');
    let prefix = '';
    for (let i = 0; i < first.length; i++) {
      if (fileNames.every(f => f.replace(/\.[^/.]+$/, '').startsWith(prefix + first[i]))) {
        prefix += first[i];
      } else {
        break;
      }
    }
    return prefix.replace(/[_-]/g, ' ').trim() || `Study Material - ${fileNames.length} files`;
  };

  const handleProcess = async () => {
    if (documents.length === 0) {
      alert('Please upload files first');
      return;
    }

    const documentIds = documents.map((d) => d.id);

    setProcessing(true, 'Starting processing...');
    setProcessingProgress('Extracting text from files...');

    try {
      const processFeatures = {
        ...features,
        studyPlan: {
          difficulty: studyPlanConfig.difficulty,
        },
      };

      // Start processing in background - don't wait for response
      fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: documentIds,
          features: processFeatures,
          title: materialTitle || undefined,
          outputLanguage: outputLanguage,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = errorText ? JSON.parse(errorText) : {};
            } catch {
              errorData = { error: response.statusText || 'Processing failed' };
            }
            const errorMessage = errorData.error || 'Processing failed';
            console.error('Processing error:', errorMessage, errorData);
            alert(`Error: ${errorMessage}`);
            setProcessing(false);
            setProcessingProgress('');
            return;
          }

          const text = await response.text();
          if (!text) {
            alert('Error: Empty response from server');
            setProcessing(false);
            setProcessingProgress('');
            return;
          }

          const data = JSON.parse(text);

          setProcessingProgress('Complete!');
          setStudyMaterial(data.studyMaterial);
          setDocuments([]);
          setMaterialTitle('');
          
          reset(); // Reset upload state
          fetchMaterials();
          
          // Small delay then redirect
          setTimeout(() => {
            setProcessing(false);
            setProcessingProgress('');
            router.push('/dashboard/materials');
          }, 1000);
        })
        .catch((error) => {
          console.error('Processing error:', error);
          alert(error.message || 'Processing failed. Please check the console for details.');
          setProcessing(false);
          setProcessingProgress('');
        });

      // Update progress messages
      setTimeout(() => setProcessingProgress('Extracting text content...'), 5000);
      setTimeout(() => setProcessingProgress('Analyzing document structure...'), 10000);
      setTimeout(() => setProcessingProgress('Processing with AI...'), 15000);
      setTimeout(() => setProcessingProgress('Generating study materials...'), 20000);
    } catch (error: any) {
      console.error('Processing error:', error);
      alert(error.message || 'Processing failed. Please check the console for details.');
      setProcessing(false);
      setProcessingProgress('');
    }
  };

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
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">{t('generate.title')}</h1>
        </div>

        {/* Processing Loader - Inline, non-blocking */}
        {uploadState.isProcessing && (
          <ProcessingLoader
            isProcessing={uploadState.isProcessing}
            progress={processingProgress || uploadState.processingProgress}
            documentIds={documents.map(d => d.id)}
            documents={documents}
          />
        )}

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">{t('generate.upload')}</h2>
                <span className="text-xs text-gray-600">{t('generate.fileTypes')}</span>
              </div>
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>

            {documents.length > 0 && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-base font-bold mb-4 text-gray-900">{t('generate.uploadedFiles')}</h2>
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">
                            {doc.fileType === 'pdf' ? '📄' : doc.fileType === 'word' ? '📝' : doc.fileType === 'powerpoint' ? '📊' : '📋'}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{doc.originalName}</p>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updated = documents.filter((_, i) => i !== index);
                            setDocuments(updated);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                        >
                          {t('generate.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-base font-bold mb-4 text-gray-900">{t('generate.processingOptions')}</h2>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                      {t('generate.materialTitle')}
                    </label>
                    <input
                      type="text"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      placeholder={t('generate.titlePlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all text-gray-900 placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {t('generate.titleHint')}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                      {t('generate.outputLanguage')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOutputLanguage('english')}
                        className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all font-semibold ${
                          outputLanguage === 'english'
                            ? 'border-gray-900 bg-gray-100 text-gray-900'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutputLanguage('french')}
                        className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all font-semibold ${
                          outputLanguage === 'french'
                            ? 'border-gray-900 bg-gray-100 text-gray-900'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        🇫🇷 French
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {t('generate.languageHint')}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">{t('generate.features')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2 p-2.5 rounded-md border border-gray-200 bg-gray-50/30">
                        <span className="text-xs font-semibold text-gray-900">{t('generate.featureSummary')}</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2.5 rounded-md border border-gray-200 bg-gray-50/30">
                        <span className="text-xs font-semibold text-gray-900">{t('generate.featureKeyPoints')}</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2.5 rounded-md border border-gray-200 bg-gray-50/30">
                        <span className="text-xs font-semibold text-gray-900">{t('generate.featureFormulas')}</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2.5 rounded-md border border-gray-200 bg-gray-50/30">
                        <span className="text-xs font-semibold text-gray-900">{t('generate.featureQuestions')}</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2.5 rounded-md border border-gray-200 bg-gray-50/30">
                        <span className="text-xs font-semibold text-gray-900">{t('generate.featureMCQs')}</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2.5 rounded-md border border-gray-200 bg-gray-50/30">
                        <span className="text-xs font-semibold text-gray-900">{t('generate.featureFlashcards')}</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2.5 rounded-md border border-gray-200 bg-gray-50/30">
                        <span className="text-xs font-semibold text-gray-900">{t('generate.featureStudyPlan')}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {t('generate.featuresHint')}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">{t('generate.studyPlanDifficulty')}</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStudyPlanConfig({ ...studyPlanConfig, difficulty: 'easy' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all font-semibold ${
                          studyPlanConfig.difficulty === 'easy'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        🟢 {t('generate.difficulty.easy')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudyPlanConfig({ ...studyPlanConfig, difficulty: 'medium' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all font-semibold ${
                          studyPlanConfig.difficulty === 'medium'
                            ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        🟡 {t('generate.difficulty.medium')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudyPlanConfig({ ...studyPlanConfig, difficulty: 'hard' })}
                        className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all font-semibold ${
                          studyPlanConfig.difficulty === 'hard'
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        🔴 {t('generate.difficulty.hard')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleProcess}
                      disabled={uploadState.isProcessing || documents.length === 0}
                      className="w-full bg-gray-900 text-white py-3 px-4 rounded-md font-bold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {uploadState.isProcessing ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {uploadState.processingProgress || t('processing.processingAI')}
                        </> 
                      ) : (
                        <>
                          {t('generate.process')}
                        </>
                      )}
                    </button>
                    {documents.length > 0 && (
                      <div className="text-center text-sm text-gray-700 font-medium">
                        {documents.length} file{documents.length > 1 ? 's' : ''} ready to process
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {studyMaterial && (
              <StudyMaterialView material={studyMaterial} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

