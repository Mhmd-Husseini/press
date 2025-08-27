'use client';

import React, { useState } from 'react';
import TiptapEditor from '@/components/shared/TiptapEditor';

export default function TiptapDemoPage() {
  const [content, setContent] = useState<string>('');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');

  const handleContentChange = (value: string) => {
    setContent(value);
    console.log('Content changed:', value);
  };

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  const getLocaleInfo = () => {
    if (locale === 'ar') {
      return {
        name: 'Arabic',
        direction: 'RTL (Right-to-Left)',
        defaultAlign: 'Right',
        sampleText: 'مرحباً! هذا مثال على النص العربي مع دعم الكتابة من اليمين إلى اليسار.'
      };
    }
    return {
      name: 'English',
      direction: 'LTR (Left-to-Right)',
      defaultAlign: 'Left',
      sampleText: 'Hello! This is an example of English text with left-to-right writing support.'
    };
  };

  const localeInfo = getLocaleInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 Tiptap Rich Text Editor - Advanced Features Demo
          </h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={toggleLocale}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Switch to {locale === 'en' ? 'Arabic' : 'English'}
            </button>
            
            <button
              onClick={() => setContent('')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Content
            </button>
          </div>

          {/* Locale Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Current Language: {localeInfo.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div>
                <strong>Direction:</strong> {localeInfo.direction}
              </div>
              <div>
                <strong>Default Alignment:</strong> {localeInfo.defaultAlign}
              </div>
              <div>
                <strong>Font:</strong> {locale === 'ar' ? 'Cairo' : 'Geist'}
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded border border-blue-300">
              <strong>Sample Text:</strong> {localeInfo.sampleText}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Editor ({localeInfo.name}) - Try All Features!
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Use the comprehensive toolbar above to format your content. All features are fully functional!
            </p>
            <TiptapEditor
              value={content}
              onChange={handleContentChange}
              placeholder={locale === 'ar' ? 'ابدأ الكتابة هنا...' : 'Start writing your content here...'}
              locale={locale}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
              className="w-full"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              HTML Output
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {content || '<p>No content yet...</p>'}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Rendered Output
            </h2>
            <div 
              className="bg-gray-100 p-4 rounded-lg prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ✨ Tiptap Advanced Features & Capabilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🎨 Text Formatting</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ <strong>Bold</strong>: Make text bold</li>
                <li>✅ <em>Italic</em>: Make text italic</li>
                <li>✅ <u>Underline</u>: Underline text</li>
                <li>✅ <s>Strikethrough</s>: Strikethrough text</li>
                <li>✅ <code>Code</code>: Inline code formatting</li>
                <li>✅ <sub>Subscript</sub>: Subscript text</li>
                <li>✅ <sup>Superscript</sup>: Superscript text</li>
              </ul>
            </div>
            
                         <div>
               <h3 className="text-lg font-semibold text-gray-800 mb-3">🔤 Font Controls</h3>
               <ul className="space-y-2 text-gray-700">
                 <li>✅ <strong>Font Family</strong>: Arial, Times, Courier, Georgia, etc.</li>
                 <li>✅ <strong>Font Size</strong>: Small (12px) to Huge (32px)</li>
                 <li>✅ <strong>Text Color</strong>: 10 preset colors + custom color picker</li>
                 <li>✅ <strong>Text Highlighting</strong>: 8 highlight colors + custom highlight picker</li>
               </ul>
             </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">📐 Text Alignment</h3>
              <ul className="space-y-2 text-gray-700">
                <li>⬅️ <strong>Left</strong>: Align text to the left</li>
                <li>↔️ <strong>Center</strong>: Center align text</li>
                <li>➡️ <strong>Right</strong>: Align text to the right</li>
                <li>↔️↔️ <strong>Justify</strong>: Justify text alignment</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🏗️ Structure</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ <strong>H1 (2.5rem)</strong>: Large headings with predefined size</li>
                <li>✅ <strong>H2 (2rem)</strong>: Medium headings with predefined size</li>
                <li>✅ <strong>H3 (1.5rem)</strong>: Small headings with predefined size</li>
                <li>✅ • List: Create unordered lists</li>
                <li>✅ 1. List: Create ordered lists</li>
                <li>✅ ☑️ Task List: Create checkable task lists</li>
                <li>✅ 🔗: Insert and manage links</li>
                <li>✅ 📷: Insert images</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🎭 Block Elements</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ 💬: Insert blockquotes</li>
                <li>✅ &lt;/&gt;: Code blocks with syntax highlighting</li>
                <li>✅ ➖: Insert horizontal rules</li>
                <li>✅ ⊞: Insert tables with headers</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">⚡ Advanced Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ ↩️↪️: Undo/Redo functionality</li>
                <li>✅ 🌍: Full RTL support (Arabic)</li>
                <li>✅ 🎨: Color picker with presets</li>
                <li>✅ ✨: Text highlighting</li>
                <li>✅ 📱: Responsive design</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🚀 Why This Tiptap Editor?</h3>
            <ul className="text-green-800 space-y-1">
              <li>• <strong>Production Ready</strong>: Used by companies like Notion, Linear, and many others</li>
              <li>• <strong>Feature Complete</strong>: Font sizes, colors, highlighting, and much more</li>
              <li>• <strong>Extensible</strong>: Easy to add custom extensions and features</li>
              <li>• <strong>Modern</strong>: Built with modern web technologies and best practices</li>
              <li>• <strong>Accessible</strong>: Built with accessibility in mind</li>
              <li>• <strong>Collaborative</strong>: Built-in support for real-time collaboration</li>
              <li>• <strong>TypeScript</strong>: Full TypeScript support</li>
            </ul>
          </div>

                     <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
             <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Pro Tips & New Features</h3>
             <ul className="text-yellow-800 space-y-1">
               <li>• <strong>Font Controls</strong>: Use the dropdowns to change font family and size</li>
               <li>• <strong>Text Colors</strong>: Click the color square to open color picker with 10 presets + custom</li>
               <li>• <strong>Text Highlighting</strong>: Click the highlight square for 8 highlight colors + custom</li>
               <li>• <strong>Advanced Formatting</strong>: Try subscript, superscript, and more</li>
               <li>• <strong>Task Lists</strong>: Create checkable task lists with the checkbox icon</li>
               <li>• <strong>Enhanced Code Blocks</strong>: Better syntax highlighting for code</li>
               <li>• Switch between English and Arabic to see full RTL support</li>
             </ul>
           </div>

                     <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
             <h3 className="text-lg font-semibold text-purple-800 mb-2">🎯 Try These Examples</h3>
             <ul className="text-purple-800 space-y-1">
               <li>• Change font size to "Huge" and see the difference</li>
               <li>• Try different font families like "Comic Sans MS" or "Impact"</li>
               <li>• Use the text color picker to make text red, blue, or any custom color</li>
               <li>• Highlight important text with the highlight picker</li>
               <li>• Create a task list with checkboxes</li>
               <li>• Insert a table and format it</li>
               <li>• Use all text alignment options</li>
               <li>• Combine colors and highlighting for rich text</li>
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
