'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Note: react-pdf v10+ includes styles automatically, no need to import CSS

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then(async (mod) => {
    // Configure worker IMMEDIATELY when module loads - BEFORE Document is used
    if (typeof window !== 'undefined' && mod.pdfjs) {
      // Use local worker file from public folder - no CDN dependency, always works
      const workerSrc = '/pdf.worker.min.mjs';
      
      // Only set if not already set, or if it's using a CDN URL
      const currentWorkerSrc = mod.pdfjs.GlobalWorkerOptions.workerSrc;
      if (!currentWorkerSrc || currentWorkerSrc.includes('cdnjs') || currentWorkerSrc.includes('unpkg') || currentWorkerSrc.includes('jsdelivr')) {
        // Simply assign - don't try to make it non-configurable
        mod.pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        
        console.log('PDF worker configured to use local file:', {
          previous: currentWorkerSrc,
          new: workerSrc,
          pdfjsVersion: mod.pdfjs.version
        });
      } else {
        console.log('PDF worker already configured:', currentWorkerSrc);
      }
    }
    return mod.Document;
  }),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface PDFViewerProps {
  filePath: string;
  fileName: string;
}

export default function PDFViewer({ filePath, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [documentReady, setDocumentReady] = useState(false);
  const [scale, setScale] = useState(1.0);

  // Ensure we're on the client side and configure PDF worker
  useEffect(() => {
    setIsClient(true);
    
    // Configure PDF worker BEFORE rendering Document
    if (typeof window !== 'undefined') {
      import('react-pdf').then((mod) => {
        if (mod.pdfjs) {
          // Use local worker file from public folder
          const workerSrc = '/pdf.worker.min.mjs';
          
          // Only set if not already set to local file
          const currentWorkerSrc = mod.pdfjs.GlobalWorkerOptions.workerSrc;
          if (currentWorkerSrc !== workerSrc) {
            mod.pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
            console.log('PDF worker configured in useEffect (local file):', {
              previous: currentWorkerSrc,
              new: workerSrc,
              actualPdfjsVersion: mod.pdfjs.version
            });
          }
          
          // Wait a bit to ensure worker is fully initialized
          setTimeout(() => {
            setWorkerReady(true);
          }, 200);
        } else {
          setWorkerReady(true); // If no pdfjs, still try to render
        }
      }).catch((error) => {
        console.error('Failed to import react-pdf:', error);
        setWorkerReady(true); // Still try to render even if worker config fails
      });
    }
  }, []);

  useEffect(() => {
    // Get Supabase signed URL (for private buckets)
    const getPdfUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch signed URL from API
        const response = await fetch(`/api/documents/url?filePath=${encodeURIComponent(filePath)}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to get PDF URL';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        if (!data.url) {
          throw new Error('No URL returned from server');
        }
        
        // Verify the URL is accessible before setting it
        try {
          const testResponse = await fetch(data.url, { method: 'HEAD' });
          if (!testResponse.ok && testResponse.status !== 405) {
            throw new Error('PDF URL is not accessible');
          }
        } catch (testErr) {
          console.warn('URL test failed, but continuing:', testErr);
          // Continue anyway - some servers don't support HEAD requests
        }
        
        setPdfUrl(data.url);
        setLoading(false);
      } catch (err) {
        console.error('Error getting PDF URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    if (filePath) {
      getPdfUrl();
    }
  }, [filePath]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageInput('1');
    setLoading(false);
    setError(null);
    setDocumentReady(true);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    let errorMessage = 'Failed to load PDF document';
    
    if (error.message.includes('network') || error.message.includes('NetworkError')) {
      errorMessage = 'Network error: Unable to load PDF. Please check your connection and try again.';
    } else if (error.message.includes('Invalid PDF')) {
      errorMessage = 'Invalid PDF file. The file may be corrupted.';
    } else if (error.message.includes('password')) {
      errorMessage = 'This PDF is password protected and cannot be displayed.';
    } else {
      errorMessage = `Error loading PDF: ${error.message}`;
    }
    
    setError(errorMessage);
    setLoading(false);
  }

  function goToPrevPage() {
    setPageNumber((prev) => {
      const newPage = Math.max(1, prev - 1);
      setPageInput(newPage.toString());
      return newPage;
    });
  }

  function goToNextPage() {
    setPageNumber((prev) => {
      const newPage = numPages ? Math.min(numPages, prev + 1) : prev;
      setPageInput(newPage.toString());
      return newPage;
    });
  }

  function goToPage(page: number) {
    if (numPages) {
      const targetPage = Math.max(1, Math.min(numPages, page));
      setPageNumber(targetPage);
      setPageInput(targetPage.toString());
    }
  }

  function handlePageInputChange(value: string) {
    setPageInput(value);
    const page = parseInt(value, 10);
    if (!isNaN(page) && numPages && page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  }

  function handlePageInputBlur() {
    if (numPages) {
      const page = parseInt(pageInput, 10);
      if (isNaN(page) || page < 1) {
        setPageInput('1');
        setPageNumber(1);
      } else if (page > numPages) {
        setPageInput(numPages.toString());
        setPageNumber(numPages);
      } else {
        setPageNumber(page);
      }
    }
  }

  function handlePageInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handlePageInputBlur();
      e.currentTarget.blur();
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isClient || !workerReady || !numPages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (numPages) goToPage(numPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClient, workerReady, numPages, pageNumber]);

  // Update page input when page number changes externally
  useEffect(() => {
    setPageInput(pageNumber.toString());
  }, [pageNumber]);

  // Don't render on server
  if (!isClient || !workerReady) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-8 bg-white">
        <div className="text-center text-gray-500">Loading PDF viewer...</div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-8 bg-white">
        <div className="text-center text-gray-500">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">PDF</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Original Document</h3>
              <p className="text-xs text-gray-600 truncate max-w-xs">{fileName}</p>
            </div>
          </div>
          {numPages && (
            <div className="text-xs text-gray-600 font-semibold">
              Page {pageNumber} of {numPages}
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="p-4 bg-gray-100 min-h-[500px]">
        {loading && (
          <div className="flex items-center justify-center h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <div className="text-center space-y-6">
              {/* Animated PDF Icon */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg transform rotate-12 animate-pulse"></div>
                <div className="absolute inset-0 bg-white rounded-xl shadow-xl flex items-center justify-center transform -rotate-6">
                  <span className="text-3xl font-bold text-red-600">PDF</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 rounded-full animate-ping"></div>
              </div>
              
              {/* Loading Spinner */}
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-900 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Text */}
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">Loading PDF Document</p>
                <p className="text-sm text-gray-600">Preparing your file for viewing...</p>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="w-72 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto shadow-inner">
                <div className="h-full bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-base font-bold text-gray-900">Failed to Load PDF</p>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  const getPdfUrl = async () => {
                    try {
                      const response = await fetch(`/api/documents/url?filePath=${encodeURIComponent(filePath)}`);
                      if (!response.ok) throw new Error('Failed to get PDF URL');
                      const data = await response.json();
                      setPdfUrl(data.url);
                      setLoading(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to load PDF');
                      setLoading(false);
                    }
                  };
                  getPdfUrl();
                }}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-2xl">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-[500px] w-full bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center space-y-5">
                      <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg transform rotate-6 animate-pulse"></div>
                        <div className="absolute inset-0 bg-white rounded-lg shadow-xl flex items-center justify-center transform -rotate-3">
                          <span className="text-2xl font-bold text-red-600">PDF</span>
                        </div>
                      </div>
                      <div className="relative w-14 h-14 mx-auto">
                        <div className="absolute inset-0 border-3 border-gray-200 rounded-full"></div>
                        <div className="absolute inset-0 border-3 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-gray-900 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">Loading PDF Document</p>
                        <p className="text-xs text-gray-500">Please wait...</p>
                      </div>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96 w-full">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📄</div>
                      <p className="text-sm text-red-600 font-semibold">Failed to load PDF</p>
                    </div>
                  </div>
                }
              >
                {documentReady && (
                  <div className="transition-all duration-500 ease-in-out transform">
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="max-w-full"
                      width={Math.min(800 * scale, typeof window !== 'undefined' ? (window.innerWidth - 100) * scale : 800)}
                      scale={scale}
                      loading={
                        <div className="flex items-center justify-center h-[600px] w-full bg-gray-50">
                          <div className="text-center space-y-3">
                            <div className="relative w-12 h-12 mx-auto">
                              <div className="absolute inset-0 border-3 border-gray-300 rounded-full"></div>
                              <div className="absolute inset-0 border-3 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">Loading page...</p>
                          </div>
                        </div>
                      }
                    />
                  </div>
                )}
                {!documentReady && (
                  <div className="flex items-center justify-center h-[500px] w-full bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center space-y-5">
                      <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg transform rotate-6 animate-pulse"></div>
                        <div className="absolute inset-0 bg-white rounded-lg shadow-xl flex items-center justify-center transform -rotate-3">
                          <span className="text-2xl font-bold text-blue-600">{pageNumber}</span>
                        </div>
                      </div>
                      <div className="relative w-14 h-14 mx-auto">
                        <div className="absolute inset-0 border-3 border-gray-200 rounded-full"></div>
                        <div className="absolute inset-0 border-3 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-gray-900 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">Rendering Page {pageNumber}</p>
                        <p className="text-xs text-gray-500">Preparing content...</p>
                      </div>
                    </div>
                  </div>
                )}
              </Document>
            </div>

            {/* Enhanced Navigation Controls */}
            {numPages && numPages > 1 && (
              <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Left side - Previous button */}
                  <button
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                      pageNumber <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md active:scale-95'
                    }`}
                    title="Previous page (←)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {/* Center - Page navigation */}
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <span className="text-xs text-gray-500 font-medium">Page</span>
                    <input
                      type="number"
                      min="1"
                      max={numPages}
                      value={pageInput}
                      onChange={(e) => handlePageInputChange(e.target.value)}
                      onBlur={handlePageInputBlur}
                      onKeyDown={handlePageInputKeyDown}
                      className="w-16 px-3 py-2 text-center text-sm font-semibold border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none transition-colors"
                    />
                    <span className="text-sm text-gray-700 font-semibold">of {numPages}</span>
                  </div>

                  {/* Right side - Next button */}
                  <button
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                      pageNumber >= numPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md active:scale-95'
                    }`}
                    title="Next page (→)"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Use arrow keys ← → to navigate • Home/End for first/last page
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

