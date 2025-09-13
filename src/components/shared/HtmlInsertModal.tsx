'use client';

import { useState } from 'react';
import { X, Code } from 'lucide-react';

interface HtmlInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

export default function HtmlInsertModal({ isOpen, onClose, onInsert }: HtmlInsertModalProps) {
  const [html, setHtml] = useState('');

  const handleSubmit = () => {
    if (html.trim()) {
      onInsert(html.trim());
      setHtml('');
      onClose();
    }
  };

  const handleClose = () => {
    setHtml('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Insert HTML / Embed Code
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
              HTML / Embed Code
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Paste your HTML or embed code here (e.g., Twitter embed, Instagram embed, etc.)"
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Examples:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Twitter:</strong> Paste the entire embed code from Twitter</p>
              <p><strong>Instagram:</strong> Paste the Instagram embed code</p>
              <p><strong>YouTube:</strong> Paste YouTube iframe embed code</p>
              <p><strong>Any HTML:</strong> Custom HTML, videos, widgets, etc.</p>
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
              disabled={!html.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Insert HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
