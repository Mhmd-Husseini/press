'use client';

import { useState } from 'react';
import { X, Video } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (src: string, type: string) => void;
}

export default function EmbedModal({ isOpen, onClose, onInsert }: EmbedModalProps) {
  const [url, setUrl] = useState('');
  const [embedType, setEmbedType] = useState<'twitter' | 'facebook' | 'instagram' | 'youtube' | 'iframe'>('twitter');

  const detectEmbedType = (inputUrl: string): string => {
    if (inputUrl.includes('twitter.com') || inputUrl.includes('x.com')) {
      return 'twitter';
    } else if (inputUrl.includes('facebook.com')) {
      return 'facebook';
    } else if (inputUrl.includes('instagram.com')) {
      return 'instagram';
    } else if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      return 'youtube';
    }
    return 'iframe';
  };

  const extractTwitterUrl = (input: string): string => {
    // First, try to extract the actual tweet URL (username/status/id pattern)
    const tweetUrlMatch = input.match(/https:\/\/(twitter|x)\.com\/([^\/\s"'<>]+)\/status\/(\d+)/);
    if (tweetUrlMatch) {
      return tweetUrlMatch[0].split('?')[0]; // Remove query parameters
    }
    
    // Fallback: extract any twitter.com URL
    const urlMatch = input.match(/https:\/\/(twitter|x)\.com\/[^\s"'<>]+/);
    if (urlMatch) {
      // If it's a hashtag or other non-tweet URL, return as-is
      return urlMatch[0].split('?')[0];
    }
    
    return input;
  };

  const extractFacebookUrl = (input: string): string => {
    // Extract URL from Facebook embed code or direct URL
    const urlMatch = input.match(/https:\/\/www\.facebook\.com\/[^\s"'<>]+/);
    return urlMatch ? urlMatch[0] : input;
  };

  const extractYouTubeUrl = (input: string): string => {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    return input;
  };

  const handleSubmit = () => {
    if (url.trim()) {
      const type = detectEmbedType(url);
      let cleanUrl = url.trim();

      // Extract clean URLs based on type
      if (type === 'twitter') {
        cleanUrl = extractTwitterUrl(url);
      } else if (type === 'facebook') {
        cleanUrl = extractFacebookUrl(url);
      } else if (type === 'youtube') {
        cleanUrl = extractYouTubeUrl(url);
      }

      onInsert(cleanUrl, type);
      setUrl('');
      onClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Insert Social Media Embed
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Embed URL or Code
            </label>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Twitter URL, Facebook post URL, YouTube link, or full embed code..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">✨ Supported Platforms:</h3>
            <div className="text-xs text-blue-700 space-y-2">
              <div>
                <strong>Twitter/X:</strong> Paste tweet URL or full embed code
                <div className="text-blue-600 mt-1">Example: https://twitter.com/username/status/123...</div>
              </div>
              <div>
                <strong>Facebook:</strong> Paste post URL
                <div className="text-blue-600 mt-1">Example: https://facebook.com/username/posts/123...</div>
              </div>
              <div>
                <strong>YouTube:</strong> Paste video URL
                <div className="text-blue-600 mt-1">Example: https://youtube.com/watch?v=...</div>
              </div>
              <div>
                <strong>Instagram:</strong> Paste post URL
                <div className="text-blue-600 mt-1">Example: https://instagram.com/p/...</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!url.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Insert Embed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

