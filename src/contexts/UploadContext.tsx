'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface UploadState {
  isUploading: boolean;
  isProcessing: boolean;
  uploadedFiles: number;
  processingProgress: string;
  processingDocumentIds?: string[];
}

interface UploadContextType {
  uploadState: UploadState;
  setUploading: (uploading: boolean) => void;
  setProcessing: (processing: boolean, progress?: string) => void;
  setUploadedFiles: (count: number) => void;
  reset: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isProcessing: false,
    uploadedFiles: 0,
    processingProgress: '',
    processingDocumentIds: [],
  });

  const setUploading = (uploading: boolean) => {
    setUploadState((prev) => ({
      ...prev,
      isUploading: uploading,
      uploadedFiles: uploading ? prev.uploadedFiles : 0,
      // If turning off uploading, also clear processing state
      isProcessing: !uploading ? false : prev.isProcessing,
      processingProgress: !uploading ? '' : prev.processingProgress,
    }));
  };

  const setProcessing = (processing: boolean, progress: string = '') => {
    setUploadState((prev) => ({
      ...prev,
      isProcessing: processing,
      processingProgress: progress || '',
      // If starting processing, ensure uploading is false
      isUploading: processing ? false : prev.isUploading,
    }));
  };

  const setUploadedFiles = (count: number) => {
    setUploadState((prev) => ({
      ...prev,
      uploadedFiles: count,
    }));
  };

  const reset = () => {
    setUploadState({
      isUploading: false,
      isProcessing: false,
      uploadedFiles: 0,
      processingProgress: '',
      processingDocumentIds: [],
    });
  };

  return (
    <UploadContext.Provider
      value={{
        uploadState,
        setUploading,
        setProcessing,
        setUploadedFiles,
        reset,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}

