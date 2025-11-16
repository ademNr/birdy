'use client';

import { useState, useEffect } from 'react';

interface ProcessingLoaderProps {
  isProcessing: boolean;
  progress: string;
  documentIds: string[];
  documents: Array<{ id: string; originalName: string; fileType: string }>;
}

interface DocumentStatus {
  id: string;
  originalName: string;
  fileType: string;
  extractedText: string;
  processed: boolean;
}

export default function ProcessingLoader({ isProcessing, progress, documentIds, documents }: ProcessingLoaderProps) {
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Poll for document extraction status
  useEffect(() => {
    if (!isProcessing || documentIds.length === 0) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/documents/extract-status?documentIds=${documentIds.join(',')}`);
        if (!response.ok) {
          return;
        }
        
        const text = await response.text();
        if (!text) {
          return;
        }

        const data = JSON.parse(text);
        setDocumentStatuses(data.documents || []);
        
        // Update current file index based on which files have text
        const documents = data.documents || [];
        const firstUnprocessedIndex = documents.findIndex((d: DocumentStatus) => !d.extractedText || d.extractedText.length === 0);
        if (firstUnprocessedIndex >= 0) {
          setCurrentFileIndex(firstUnprocessedIndex);
        } else if (documents.length > 0) {
          setCurrentFileIndex(documents.length);
        }
      } catch (error) {
        console.error('Error fetching document status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [isProcessing, documentIds]);

  if (!isProcessing) return null;

  // Merge document info with status
  const mergedDocuments = documents.map(doc => {
    const status = documentStatuses.find(s => s.id === doc.id);
    return {
      ...doc,
      extractedText: status?.extractedText || '',
      processed: status?.processed || false,
    };
  });

  const currentDoc = mergedDocuments[currentFileIndex];
  const hasExtractedText = currentDoc?.extractedText && currentDoc.extractedText.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Processing Your Materials</h3>
          <p className="text-xs text-gray-600 mt-1">{progress || 'Extracting content from files...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-900">Processing</span>
        </div>
      </div>

      {/* Files Status */}
      <div className="mb-4 space-y-2">
        {mergedDocuments.map((doc, index) => {
          const isCurrent = index === currentFileIndex;
          const isCompleted = doc.extractedText && doc.extractedText.length > 0;
          
          return (
            <div
              key={doc.id}
              className={`flex items-center gap-3 p-3 rounded-md border transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : isCurrent
                  ? 'bg-gray-100 border-gray-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className="text-xl">
                {doc.fileType === 'pdf' ? '📄' : doc.fileType === 'word' ? '📝' : '📊'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{doc.originalName}</p>
                {isCurrent && !isCompleted && (
                  <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                )}
                {isCompleted && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✓ Extracted {doc.extractedText.length.toLocaleString()} characters
                  </p>
                )}
              </div>
              {isCompleted && (
                <span className="text-green-600 text-lg flex-shrink-0">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time Content Display */}
      {hasExtractedText && currentDoc && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-900">
              Content from: {currentDoc.originalName}
            </h4>
            <span className="text-xs text-gray-500">
              {currentDoc.extractedText.length.toLocaleString()} characters
            </span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {currentDoc.extractedText.substring(0, 2000)}
              {currentDoc.extractedText.length > 2000 && (
                <span className="text-gray-500 italic">... (showing first 2000 characters)</span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            📖 Reading and analyzing document content. This will be processed by AI shortly...
          </p>
        </div>
      )}

      {!hasExtractedText && currentDoc && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
            <span>Extracting text from {currentDoc.originalName}...</span>
          </div>
        </div>
      )}
    </div>
  );
}

