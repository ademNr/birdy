'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface Document {
  id: string;
  originalName: string;
  fileType: string;
  chapterOrder?: number;
  chapterTitle?: string;
  extractedText: string;
}

interface DocumentViewerProps {
  materialId: string;
  chapters?: Array<{ order: number; title: string; documentId: string }>;
}

export default function DocumentViewer({ materialId, chapters = [] }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightMode, setHighlightMode] = useState<'important' | 'all' | 'none'>('important');

  useEffect(() => {
    fetchDocuments();
  }, [materialId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/materials/documents?materialId=${materialId}`);
      if (!response.ok) {
        console.error('Error fetching documents:', response.statusText);
        return;
      }
      
      const text = await response.text();
      if (!text) {
        console.error('Error fetching documents: Empty response');
        return;
      }

      const data = JSON.parse(text);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDocument = documents[selectedDocIndex];

  // Extract important sections from the FULL document text
  const importantSections = useMemo(() => {
    if (!currentDocument?.extractedText) return [];

    const fullText = currentDocument.extractedText;
    const sections: Array<{ text: string; type: 'heading' | 'definition' | 'formula' | 'important'; start: number; end: number }> = [];
    const seenTexts = new Set<string>(); // To avoid duplicates

    // Split into lines for analysis
    const lines = fullText.split('\n');
    let currentPosition = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        currentPosition += line.length + 1; // +1 for newline
        return;
      }

      const lineStart = fullText.indexOf(trimmed, currentPosition);
      if (lineStart === -1) {
        currentPosition += line.length + 1;
        return;
      }

      // Find headings
      if (trimmed.length > 0 && trimmed.length < 100) {
        if (
          (/^[A-Z][A-Z\s]{5,}/.test(trimmed) && trimmed.length < 80) || // All caps short lines
          /^(Chapter|Section|Part|Unit|Chapitre|Section)\s*\d+/i.test(trimmed) || // Chapter/Section headers
          /^\d+\.\s+[A-Z]/.test(trimmed) || // Numbered headings
          (/^[A-Z][^.!?]{0,80}$/.test(trimmed) && !trimmed.includes(' ') === false) // Short lines starting with capital
        ) {
          const key = `heading-${lineStart}`;
          if (!seenTexts.has(key)) {
            seenTexts.add(key);
            sections.push({
              text: trimmed,
              type: 'heading',
              start: lineStart,
              end: lineStart + trimmed.length,
            });
          }
        }
      }

      // Find definitions
      const definitionPattern = /^([A-Z][A-Za-z\s]{2,40}):?\s+(is|are|refers to|means|denotes|defines?|est|sont|signifie)/i;
      const defMatch = trimmed.match(definitionPattern);
      if (defMatch) {
        const key = `def-${lineStart}`;
        if (!seenTexts.has(key)) {
          seenTexts.add(key);
          sections.push({
            text: trimmed,
            type: 'definition',
            start: lineStart,
            end: lineStart + trimmed.length,
          });
        }
      }

      // Find formulas (lines with mathematical expressions)
      if (/[=+\-*/^()\[\]{}]/.test(trimmed) && /[0-9a-zA-Z]/.test(trimmed) && trimmed.length < 200) {
        const key = `formula-${lineStart}`;
        if (!seenTexts.has(key)) {
          seenTexts.add(key);
          sections.push({
            text: trimmed,
            type: 'formula',
            start: lineStart,
            end: lineStart + trimmed.length,
          });
        }
      }

      currentPosition = lineStart + line.length;
    });

    return sections.sort((a, b) => a.start - b.start);
  }, [currentDocument]);

  // Highlight the FULL document text
  const renderHighlightedText = (text: string): React.ReactNode[] => {
    if (!text) return [];

    if (highlightMode === 'none' && !searchTerm) {
      // No highlighting - just return the text with proper formatting
      return formatPlainText(text);
    }

    const highlights: Array<{ start: number; end: number; type: string }> = [];

    // Add important section highlights
    if (highlightMode === 'important' || highlightMode === 'all') {
      importantSections.forEach((section) => {
        // Find all occurrences of this section text in the full document
        let searchStart = 0;
        while (true) {
          const index = text.indexOf(section.text, searchStart);
          if (index === -1) break;
          
          highlights.push({
            start: index,
            end: index + section.text.length,
            type: section.type,
          });
          searchStart = index + 1;
        }
      });
    }

    // Add search term highlights
    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'search',
        });
      }
    }

    // Remove overlapping highlights (keep the first one)
    highlights.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });

    const filteredHighlights: Array<{ start: number; end: number; type: string }> = [];
    highlights.forEach((highlight) => {
      const overlaps = filteredHighlights.some(
        (existing) =>
          (highlight.start >= existing.start && highlight.start < existing.end) ||
          (highlight.end > existing.start && highlight.end <= existing.end) ||
          (highlight.start <= existing.start && highlight.end >= existing.end)
      );
      if (!overlaps) {
        filteredHighlights.push(highlight);
      }
    });

    // Build React elements
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    filteredHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        const beforeText = text.substring(lastIndex, highlight.start);
        elements.push(...formatPlainText(beforeText, `before-${index}`));
      }

      // Add highlighted text
      const highlightedText = text.substring(highlight.start, highlight.end);
      let className = '';
      if (highlight.type === 'search') {
        className = 'bg-yellow-200 font-semibold px-0.5 rounded';
      } else if (highlight.type === 'heading') {
        className = 'bg-gray-100 text-gray-900 font-bold px-1 rounded';
      } else if (highlight.type === 'definition') {
        className = 'bg-green-100 text-green-900 font-semibold px-1 rounded';
      } else if (highlight.type === 'formula') {
        className = 'bg-purple-100 text-purple-900 font-mono font-semibold px-1 rounded';
      }

      elements.push(
        <mark key={`highlight-${index}-${highlight.start}-${highlight.end}-${highlight.type}`} className={className}>
          {highlightedText}
        </mark>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      elements.push(...formatPlainText(remainingText, 'remaining'));
    }

    return elements.length > 0 ? elements : formatPlainText(text);
  };

  // Format plain text preserving structure (no duplication)
  const formatPlainText = (text: string, keyPrefix: string = 'text'): React.ReactNode[] => {
    if (!text) return [];

    // Split by newlines but preserve them
    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        parts.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);
      }
      if (line.trim().length > 0) {
        parts.push(
          <React.Fragment key={`${keyPrefix}-line-${lineIndex}`}>
            {line}
          </React.Fragment>
        );
      } else if (lineIndex < lines.length - 1) {
        // Empty line - add extra spacing
        parts.push(<br key={`${keyPrefix}-empty-${lineIndex}`} />);
      }
    });

    return parts;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-600">No documents available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with document selector and controls */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900">Document Viewer</h3>
          <div className="flex items-center gap-2">
            <select
              value={highlightMode}
              onChange={(e) => setHighlightMode(e.target.value as any)}
              className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900"
            >
              <option value="important">Highlight Important</option>
              <option value="all">Highlight All</option>
              <option value="none">No Highlighting</option>
            </select>
          </div>
        </div>

        {/* Document selector */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto">
          {documents.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocIndex(index)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDocIndex === index
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {doc.chapterTitle || doc.originalName}
              {doc.chapterOrder && (
                <span className="ml-1 text-xs opacity-75">({doc.chapterOrder})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in document..."
            className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 placeholder-gray-400"
          />
          <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {currentDocument && (
          <div>
            <div className="mb-4 pb-3 border-b border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                {currentDocument.chapterTitle || currentDocument.originalName}
              </h4>
              {currentDocument.chapterOrder && (
                <p className="text-xs text-gray-600">Chapter {currentDocument.chapterOrder}</p>
              )}
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {renderHighlightedText(currentDocument.extractedText)}
              </div>
            </div>

            {currentDocument.extractedText.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No text content available for this document.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {highlightMode !== 'none' && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="font-semibold text-gray-700">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300"></span>
              <span className="text-gray-600">Headings</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-green-100 border border-green-300"></span>
              <span className="text-gray-600">Definitions</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-purple-100 border border-purple-300"></span>
              <span className="text-gray-600">Formulas</span>
            </div>
            {searchTerm && (
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 bg-yellow-200 border border-yellow-300"></span>
                <span className="text-gray-600">Search Results</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
