'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ShareModalProps {
  materialId: string;
  materialTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess: () => void;
}

interface SelectedUser {
  email: string;
  name: string;
}

export default function ShareModal({ materialId, materialTitle, isOpen, onClose, onShareSuccess }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ email: string; name: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      const response = await fetch(`/api/users/suggestions?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        // Filter out already selected users
        const selectedEmails = selectedUsers.map(u => u.email.toLowerCase());
        const filtered = (data.suggestions || []).filter(
          (s: { email: string }) => !selectedEmails.includes(s.email.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0 && query.length >= 2);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, [selectedUsers]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Debounce the suggestions fetch
      const timeoutId = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSearchQuery('');
      setSuggestions([]);
      setSelectedUsers([]);
      setShowSuggestions(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);


  const handleAddUser = (user: { email: string; name: string }) => {
    // Check if user is already selected
    if (!selectedUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const handleRemoveUser = (email: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.email !== email));
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to share with');
      return;
    }

    setIsSharing(true);
    setError('');
    setSuccess('');

    try {
      // Share with all selected users
      const emails = selectedUsers.map(u => u.email);
      const response = await fetch('/api/materials/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId,
          emails: emails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share material');
      }

      setSuccess(`Material shared successfully with ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}!`);
      
      setTimeout(() => {
        onShareSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to share material');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSuggestionClick = (user: { email: string; name: string }) => {
    handleAddUser(user);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Share Material</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Share <span className="font-semibold text-gray-900">"{materialTitle}"</span> with friends or colleagues
        </p>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Selected Users ({selectedUsers.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.email}
                  className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-700">({user.email})</span>
                  <button
                    onClick={() => handleRemoveUser(user.email)}
                    className="text-gray-700 hover:text-gray-900 ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-300 transition-colors"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Search Users by Email
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setError('');
                setSuccess('');
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Type email to search..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 placeholder-gray-400 transition-all"
              disabled={isSharing}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-gray-900">{suggestion.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{suggestion.email}</div>
                </button>
              ))}
            </div>
          )}
          {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-sm text-gray-500 text-center">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            disabled={isSharing}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || selectedUsers.length === 0}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isSharing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sharing...
              </span>
            ) : (
              `Share with ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
