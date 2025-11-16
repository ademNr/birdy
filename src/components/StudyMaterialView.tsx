'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import VoiceExplanation from './VoiceExplanation';
import ShareModal from './ShareModal';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';

interface StudyMaterialViewProps {
  material: any;
  onMaterialUpdate?: (updatedMaterial: any) => void;
  isOwner?: boolean; // Whether the current user owns this material
}

export default function StudyMaterialView({ material, onMaterialUpdate, isOwner = true }: StudyMaterialViewProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const chapters = material.chapters || [];
  const hasChapters = chapters.length > 0;
  
  // Default to first chapter if chapters exist
  const [selectedChapter, setSelectedChapter] = useState<string | null>(() => {
    if (hasChapters && chapters.length > 0) {
      return chapters[0].order.toString();
    }
    return null;
  });
  
  const [activeTab, setActiveTab] = useState('summary');

  // Get current chapter content
  const getCurrentChapterContent = () => {
    if (!hasChapters || selectedChapter === null) {
      // Single file or no chapters - show overall material content
      return {
        chapter: null,
        content: {
          summary: material.summary,
          keyPoints: material.keyPoints,
          formulas: material.formulas,
          examQuestions: material.examQuestions,
          mcqs: material.mcqs,
          flashcards: material.flashcards,
          studyPlan: material.studyPlan,
          youtubeVideos: null, // Overall material doesn't have videos
        },
      };
    } else {
      // Show selected chapter content
      const chapter = chapters.find((ch: any) => ch.order.toString() === selectedChapter);
      if (!chapter) return null;
      return {
        chapter,
        content: {
          summary: chapter.summary,
          keyPoints: chapter.keyPoints,
          formulas: chapter.formulas,
          examQuestions: chapter.examQuestions,
          mcqs: chapter.mcqs,
          flashcards: chapter.flashcards,
          youtubeVideos: chapter.youtubeVideos,
          studyPlan: null, // Chapters don't have study plans
        },
      };
    }
  };

  const chapterData = getCurrentChapterContent();
  const currentContent = chapterData?.content;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(material.title);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update edited title when material changes
  useEffect(() => {
    setEditedTitle(material.title);
  }, [material.title]);

  const handleUpdateTitle = async () => {
    if (!isOwner) {
      alert('You do not have permission to edit this material');
      return;
    }

    if (!editedTitle.trim() || editedTitle.trim() === material.title) {
      setIsEditingTitle(false);
      setEditedTitle(material.title);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/materials/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: material.id,
          title: editedTitle.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { error: response.statusText || 'Failed to update title' };
        }
        throw new Error(errorData.error || 'Failed to update title');
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);

      // Update local state
      const updatedMaterial = { ...material, title: editedTitle.trim() };
      material.title = editedTitle.trim();
      setIsEditingTitle(false);
      
      // Notify parent component if callback provided
      if (onMaterialUpdate) {
        onMaterialUpdate(updatedMaterial);
      }
    } catch (error: any) {
      console.error('Error updating title:', error);
      alert(error.message || 'Failed to update title');
      setEditedTitle(material.title);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      alert('You do not have permission to delete this material');
      return;
    }

    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/materials/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: material.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { error: response.statusText || 'Failed to delete material' };
        }
        throw new Error(errorData.error || 'Failed to delete material');
      }

      const text = await response.text();
      if (!text) {
        // Delete might return empty response, which is OK
        return;
      }

      const data = JSON.parse(text);

      router.push('/dashboard/materials');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting material:', error);
      alert(error.message || 'Failed to delete material');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Material Title */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          {isEditingTitle ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateTitle();
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setEditedTitle(material.title);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-lg font-bold border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900"
                autoFocus
                disabled={isUpdating}
              />
              <button
                onClick={handleUpdateTitle}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? '...' : '✓'}
              </button>
              <button
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditedTitle(material.title);
                }}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 flex-1">{material.title}</h2>
              <div className="flex items-center gap-2">
                {isOwner ? (
                  <>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
                      title={t('share.title')}
                    >
                      {t('common.share')}
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                      title="Edit title"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete material"
                    >
                      {isDeleting ? '...' : '🗑️'}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md font-medium">
                    {t('materials.sharedWithYou')}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {hasChapters && (
          <p className="text-xs text-gray-600 mt-1">
            {chapters.length} chapter{chapters.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Chapter Selection Row - Always show if chapters exist */}
      {hasChapters && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Chapter</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {chapters.map((chapter: any) => (
              <button
                key={chapter.order}
                onClick={() => {
                  setSelectedChapter(chapter.order.toString());
                  setActiveTab('summary'); // Reset to summary when switching chapters
                }}
                className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedChapter === chapter.order.toString()
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <span className="text-xs opacity-75 mr-1.5">Ch. {chapter.order}</span>
                <span>{chapter.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Chapter Header */}
      {chapterData?.chapter && (
        <div className="mb-4 pb-3 border-b border-gray-200 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-700 mb-1 block">Current Chapter</span>
              <h3 className="text-base font-bold text-gray-900">
                Chapter {chapterData.chapter.order}: {chapterData.chapter.title}
              </h3>
            </div>
          </div>
        </div>
      )}

      {!currentContent && (
        <div className="text-center py-8 text-gray-600">
          <p className="text-sm">No content available. Please select a chapter.</p>
        </div>
      )}

      {currentContent && (
        <>
          {/* Content Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-4 overflow-x-auto">
              {currentContent.summary && (
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'summary'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('material.summary')}
                </button>
              )}
              {currentContent.keyPoints && (
                <button
                  onClick={() => setActiveTab('keyPoints')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'keyPoints'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('material.keyPoints')}
                </button>
              )}
              {currentContent.formulas && (
                <button
                  onClick={() => setActiveTab('formulas')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'formulas'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('material.formulas')}
                </button>
              )}
              {currentContent.examQuestions && (
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'questions'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('material.questions')}
                </button>
              )}
              {currentContent.mcqs && (
                <button
                  onClick={() => setActiveTab('mcqs')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'mcqs'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('material.mcqs')}
                </button>
              )}
              {currentContent.flashcards && (
                <button
                  onClick={() => setActiveTab('flashcards')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'flashcards'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('material.flashcards')}
                </button>
              )}
              {currentContent.youtubeVideos && currentContent.youtubeVideos.length > 0 && (
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'videos'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📺 {t('material.videos')}
                </button>
              )}
              {currentContent.studyPlan && (
                <button
                  onClick={() => setActiveTab('studyPlan')}
                  className={`pb-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'studyPlan'
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Study Plan
                </button>
              )}
            </div>
          </div>

          {/* Content Display */}
          <div className="mt-4">
            {activeTab === 'summary' && currentContent.summary && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">
                    {chapterData?.chapter ? 'Chapter Summary' : 'Summary'}
                  </h3>
                  <VoiceExplanation 
                    text={currentContent.summary} 
                    language={material.outputLanguage || 'english'} 
                  />
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {highlightImportantParts(currentContent.summary)}
                </div>
              </div>
            )}

            {activeTab === 'keyPoints' && currentContent.keyPoints && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">
                    {chapterData?.chapter ? 'Chapter Key Points' : 'Key Points'}
                  </h3>
                  <VoiceExplanation 
                    text={currentContent.keyPoints.join('. ')} 
                    language={material.outputLanguage || 'english'} 
                  />
                </div>
                <ul className="space-y-2">
                  {currentContent.keyPoints.map((point: string, index: number) => {
                    return (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-gray-700 font-bold flex-shrink-0 mt-0.5">•</span>
                        <span className="text-sm text-gray-800 flex-1">
                          {highlightKeyPoint(point)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {activeTab === 'formulas' && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  {chapterData?.chapter ? 'Chapter Formulas' : 'Formulas'}
                </h3>
                {currentContent.formulas && currentContent.formulas.length > 0 ? (
                  <div className="space-y-3">
                    {currentContent.formulas.map((formula: any, index: number) => (
                      <div key={index} className="border-l-4 border-gray-900 pl-3 py-2 bg-gray-50 rounded-r-md">
                        <div className="font-mono text-sm mb-1 font-bold text-gray-900">{formula.formula}</div>
                        <p className="text-gray-800 text-xs mb-1">{formula.description}</p>
                        <p className="text-gray-700 text-xs italic">{formula.context}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 font-medium">No formulas exist in this chapter.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'questions' && currentContent.examQuestions && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  {chapterData?.chapter ? 'Chapter Exam Questions' : 'Exam Questions'}
                </h3>
                <div className="space-y-3">
                  {currentContent.examQuestions.map((q: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">{q.question}</h4>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-bold">
                          {q.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-2 leading-relaxed">{q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'mcqs' && currentContent.mcqs && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  {chapterData?.chapter ? 'Chapter MCQs' : 'Multiple Choice Questions'}
                </h3>
                <div className="space-y-4">
                  {currentContent.mcqs.map((mcq: any, index: number) => (
                    <MCQCard key={index} mcq={mcq} index={index} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'videos' && currentContent.youtubeVideos && currentContent.youtubeVideos.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  {chapterData?.chapter ? 'Chapter Revision Videos' : 'Revision Videos'}
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Suggested YouTube videos to help you understand and revise the main topics in this chapter.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {currentContent.youtubeVideos.map((video: any, index: number) => (
                    <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-gray-400 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-24 h-16 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white text-2xl">▶</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2">
                            {video.title || 'Video Suggestion'}
                          </h4>
                          <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                            {video.description || 'Educational video for this topic'}
                          </p>
                          <p className="text-xs text-gray-600 mb-3">
                            <span className="font-semibold">Why relevant:</span> {video.relevance || 'Covers key concepts from this chapter'}
                          </p>
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery || video.title || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors shadow-sm"
                          >
                            <span>🔍</span>
                            <span>Search on YouTube</span>
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'flashcards' && currentContent.flashcards && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  {chapterData?.chapter ? 'Chapter Flashcards' : 'Flashcards'}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentContent.flashcards.map((card: any, index: number) => (
                    <Flashcard key={index} card={card} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'studyPlan' && currentContent.studyPlan && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Study Plan</h3>
                {currentContent.studyPlan.examDate && (
                  <p className="text-sm text-gray-800 mb-4 font-semibold">
                    Exam Date: {new Date(currentContent.studyPlan.examDate).toLocaleDateString()}
                  </p>
                )}
                <div className="space-y-3">
                  {currentContent.studyPlan.schedule.map((day: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">
                          Day {index + 1} - {new Date(day.date).toLocaleDateString()}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-bold ${
                            day.difficulty === 'easy'
                              ? 'bg-green-100 text-green-700'
                              : day.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {day.difficulty}
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-gray-800 space-y-0.5 text-sm">
                        {day.topics.map((topic: string, topicIndex: number) => (
                          <li key={topicIndex}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </>
      )}

      {/* Share Modal */}
      <ShareModal
        materialId={material.id}
        materialTitle={material.title}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShareSuccess={() => {
          // Optionally refresh materials list
        }}
      />
    </div>
  );
}

function MCQCard({ mcq, index }: { mcq: any; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  const isCorrect = (optIndex: number) => {
    return Array.isArray(mcq.correctAnswer)
      ? mcq.correctAnswer.includes(optIndex)
      : optIndex === mcq.correctAnswer;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-all">
      <h4 className="font-bold text-gray-900 mb-3 text-sm">{mcq.question}</h4>
      <div className="space-y-2 mb-3">
        {mcq.options.map((option: string, optIndex: number) => {
          const correct = isCorrect(optIndex);
          return (
            <div
              key={optIndex}
              className={`p-2.5 rounded-md border text-sm transition-all ${
                showAnswer && correct
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className="font-bold mr-2 text-gray-900">
                {String.fromCharCode(65 + optIndex)}.
              </span>
              <span className="text-gray-800">{option}</span>
              {showAnswer && correct && (
                <span className="ml-2 text-green-700 text-xs font-bold animate-fade-in">
                  ✓ Correct
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-all"
      >
        {showAnswer ? 'Hide Answer' : 'Show Answer'}
      </button>
      {showAnswer && mcq.explanation && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 animate-fade-in">
          <p className="text-xs text-gray-700 font-semibold mb-1">Explanation:</p>
          <p className="text-xs text-gray-800">{mcq.explanation}</p>
        </div>
      )}
    </div>
  );
}

function Flashcard({ card }: { card: any }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="relative min-h-[200px] border border-gray-200 rounded-lg p-4 cursor-pointer perspective-1000"
    >
      <div
        className={`absolute inset-0 rounded-lg p-4 backface-hidden transition-all duration-500 ease-in-out ${
          flipped ? 'opacity-0 rotate-y-180' : 'opacity-100 rotate-y-0'
        }`}
      >
        <div className="h-full min-h-[200px] flex flex-col justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm p-4">
          {card.category && (
            <span className="text-xs text-gray-700 font-bold mb-2 block text-center">
              {card.category}
            </span>
          )}
          <p className="text-sm text-gray-900 font-bold text-center break-words overflow-wrap-anywhere w-full px-2 flex-1 flex items-center justify-center">{card.front}</p>
          <p className="text-xs text-gray-500 text-center mt-2 flex-shrink-0">Click to flip</p>
        </div>
      </div>
      <div
        className={`absolute inset-0 rounded-lg p-4 backface-hidden transition-all duration-500 ease-in-out ${
          flipped ? 'opacity-100 rotate-y-0' : 'opacity-0 rotate-y-180'
        }`}
      >
        <div className="h-full min-h-[200px] flex flex-col justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-800 text-center break-words overflow-wrap-anywhere w-full px-2 flex-1 flex items-center justify-center">{card.back}</p>
          <p className="text-xs text-gray-500 text-center mt-2 flex-shrink-0">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to highlight important parts in summary and key points
function highlightText(text: string) {
  if (!text) return text;
  
  const importantKeywords = [
    // Definitions
    /\b(?:definition|defined as|refers to|means|denotes|defines?|can be defined as|is|are)\b/gi,
    // Important keywords
    /\b(?:important|key|critical|essential|crucial|significant|main|primary|fundamental|vital)\b/gi,
    // Concepts
    /\b(?:concept|principle|theory|method|process|function|structure|mechanism|system|approach)\b/gi,
    // Action words
    /\b(?:enables|allows|ensures|provides|creates|generates|produces|forms|builds|develops)\b/gi,
  ];
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const matches: Array<{ start: number; end: number; text: string }> = [];
  
  // Find all matches
  importantKeywords.forEach((pattern) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }
  });
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (keep the longest)
  const nonOverlapping: Array<{ start: number; end: number; text: string }> = [];
  matches.forEach((match) => {
    const overlapping = nonOverlapping.find(m => 
      (match.start >= m.start && match.start < m.end) ||
      (match.end > m.start && match.end <= m.end) ||
      (match.start <= m.start && match.end >= m.end)
    );
    
    if (!overlapping) {
      nonOverlapping.push(match);
    } else if (match.end - match.start > overlapping.end - overlapping.start) {
      // Replace with longer match
      const index = nonOverlapping.indexOf(overlapping);
      nonOverlapping[index] = match;
    }
  });
  
  // Sort again after removing overlaps
  nonOverlapping.sort((a, b) => a.start - b.start);
  
  // Build React elements
  nonOverlapping.forEach((match, idx) => {
    // Add text before match
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start));
    }
    // Add highlighted match
    parts.push(
      <mark key={`highlight-${idx}`} className="marker-highlight">
        {match.text}
      </mark>
    );
    lastIndex = match.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

function highlightImportantParts(text: string) {
  return highlightText(text);
}

function highlightKeyPoint(point: string) {
  if (!point) return point;
  
  // Patterns to identify definition/topic titles:
  // 1. "Topic: definition" or "Topic - definition"
  // 2. "Topic (definition)"
  // 3. "Topic is/are/refers to..."
  // 4. "Topic, definition"
  // 5. First few words before common definition markers
  
  const definitionMarkers = [
    { pattern: /^([^:—–\-\(]+?)[:—–\-]\s*(.+)$/, type: 'colon-dash' },
    { pattern: /^([^\(]+?)\s*\((.+?)\)\s*(.*)$/, type: 'parentheses' },
    { pattern: /^(.+?)\s+(?:is|are|was|were|refers to|means|denotes|defines|can be defined as)\s+(.+)$/i, type: 'verb' },
  ];
  
  let titleText = '';
  let restText = '';
  
  // Try each pattern
  for (const marker of definitionMarkers) {
    const match = point.match(marker.pattern);
    if (match) {
      if (marker.type === 'parentheses') {
        // Title is before parentheses, definition is inside
        titleText = match[1].trim();
        restText = (match[2] + (match[3] ? ' ' + match[3] : '')).trim();
      } else {
        // Title is first part, rest is definition
        titleText = match[1].trim();
        restText = match[2].trim();
      }
      
      // Validate title (should be 1-8 words, reasonable length)
      const titleWords = titleText.split(/\s+/);
      if (titleWords.length >= 1 && titleWords.length <= 8 && titleText.length <= 60) {
        break;
      } else {
        titleText = '';
        restText = '';
      }
    }
  }
  
  // If no pattern matched, try to identify first phrase (usually 2-5 words)
  if (!titleText) {
    const words = point.split(/\s+/);
    // Check if first 2-5 words could be a title (before common connecting words)
    const connectingWords = ['is', 'are', 'was', 'were', 'refers', 'means', 'denotes', 'defines', 'can', 'the', 'a', 'an', 'of', 'in', 'on', 'at'];
    let titleWordCount = 0;
    for (let i = 0; i < Math.min(words.length, 6); i++) {
      const word = words[i].toLowerCase().replace(/[.,;:!?]$/, '');
      if (i > 0 && connectingWords.includes(word)) {
        // If we have at least 1 word before connecting word, use it
        if (titleWordCount >= 1) break;
      }
      titleWordCount++;
    }
    
    if (titleWordCount >= 1 && titleWordCount <= 5) {
      titleText = words.slice(0, titleWordCount).join(' ').replace(/[.,;:!?]$/, '');
      restText = words.slice(titleWordCount).join(' ');
    }
  }
  
  // If we found a title, format it
  if (titleText && titleText.length > 0) {
    return (
      <>
        <span className="font-bold text-gray-900">{titleText}</span>
        {restText && (
          <span className="text-gray-800">
            {' '}{restText}
          </span>
        )}
      </>
    );
  }
  
  // Fallback: highlight important parts
  return highlightText(point);
}
