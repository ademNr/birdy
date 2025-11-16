'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '../contexts/UploadContext';
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadProps {
  onUploadComplete: (documents: any[]) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { uploadState, setUploading, setUploadedFiles } = useUpload();
  const { t, language } = useLanguage();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError(t('upload.selectFile'));
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const response = await new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ ok: true, data });
            } catch {
              reject(new Error('Invalid response'));
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || 'Upload failed'));
            } catch {
              reject(new Error('Upload failed'));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      setUploadProgress(100);
      setUploadedFiles(response.data.documents.length);
      onUploadComplete(response.data.documents);
      setFiles([]);
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err: any) {
      setError(err.message || t('upload.failed'));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-5">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-gray-500 bg-gray-50 scale-[1.01]'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-6xl">📚</div>
          {isDragActive ? (
            <p className="text-gray-700 font-bold text-lg">{t('upload.dropFiles')}</p>
          ) : (
            <>
              <p className="text-gray-900 font-semibold text-base">
                {t('upload.dragDrop').replace('click to browse', '').trim()}
                {' '}
                <span className="text-gray-700">{language === 'en' ? 'click to browse' : 'cliquez pour parcourir'}</span>
              </p>
              <p className="text-sm text-gray-600 font-medium">
                {t('upload.fileTypes')}
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">{t('upload.selectedFiles')} ({files.length})</h3>
            <button
              onClick={() => setFiles([])}
              className="text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              {t('upload.clearAll')}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {file.name.endsWith('.pdf') ? '📄' : 
                     file.name.endsWith('.doc') || file.name.endsWith('.docx') ? '📝' : 
                     file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ? '📊' : '📋'}
                  </span>
                  <div>
                    <span className="text-sm text-gray-900 font-semibold block truncate max-w-xs">{file.name}</span>
                    <span className="text-xs text-gray-600 font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-bold px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {/* Upload Progress Bar */}
          {uploadState.isUploading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gray-900 h-full transition-all duration-300 ease-out rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={uploadState.isUploading}
            className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {uploadState.isUploading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('upload.uploading')}
              </>
            ) : (
              <>
                {t('upload.uploadFiles', { count: files.length })}
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl flex items-center gap-3 font-semibold">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

