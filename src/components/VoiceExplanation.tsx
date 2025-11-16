'use client';

import { useState, useEffect } from 'react';

interface VoiceExplanationProps {
  text: string;
  language?: 'english' | 'french';
}

export default function VoiceExplanation({ text, language = 'english' }: VoiceExplanationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSynth(window.speechSynthesis);
      // Load voices (some browsers need this)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          // Voices loaded
        };
      }
    }
  }, []);

  const handlePlay = () => {
    if (!synth) {
      alert('Text-to-speech is not supported in your browser');
      return;
    }

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      // Set language based on prop
      utterance.lang = language === 'french' ? 'fr-FR' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Try to get a voice that matches the language
      const voices = synth.getVoices();
      const preferredVoice = voices.find(voice => 
        language === 'french' 
          ? voice.lang.startsWith('fr')
          : voice.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      synth.speak(utterance);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  return (
    <button
      onClick={handlePlay}
      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 text-sm"
      title="Listen to explanation"
    >
      {isPlaying ? (
        <>
          <span className="animate-pulse">🔊</span>
          <span>Stop</span>
        </>
      ) : (
        <>
          <span>🔊</span>
          <span>Listen</span>
        </>
      )}
    </button>
  );
}

