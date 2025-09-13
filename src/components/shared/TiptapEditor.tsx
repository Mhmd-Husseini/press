'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Link } from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Code as CodeIcon
} from 'lucide-react';
import HtmlInsertModal from './HtmlInsertModal';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { Node } from '@tiptap/core';

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

// Custom Heading Extension with predefined sizes
const CustomHeading = Extension.create({
  name: 'customHeading',
  addGlobalAttributes() {
    return [
      {
        types: ['heading'],
        attributes: {
          level: {
            default: 1,
            parseHTML: element => {
              const level = parseInt(element.tagName.charAt(1));
              return level || 1;
            },
            renderHTML: attributes => {
              return {};
            },
          },
        },
      },
    ];
  },
});


interface TiptapEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
}

export default function TiptapEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  locale = 'en',
  dir = 'ltr',
  className = ''
}: TiptapEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isHighlightPickerOpen, setIsHighlightPickerOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');
  const [customHighlight, setCustomHighlight] = useState('#ffff00');
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextStyle,
      FontSize,
      CustomHeading,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        dir: dir,
        style: `font-family: ${locale === 'ar' ? 'Cairo, Arial, sans-serif' : 'Geist, Arial, sans-serif'}; text-align: ${locale === 'ar' ? 'right' : 'left'};`
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    // Enable mark persistence when typing
    enableInputRules: true,
    enablePasteRules: true,
  });

  useEffect(() => {
    if (editor && value && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(event.target as Node)) {
        setIsHighlightPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setIsLinkModalOpen(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    editor.chain().focus().setTextAlign(align).run();
  };

  const setFontSize = (fontSize: string) => {
    if (fontSize === 'inherit') {
      // Reset to default by removing fontSize attribute
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      // Apply font size using the fontSize attribute
      editor.chain().focus().setMark('textStyle', { fontSize }).run();
    }
  };

  const setTextColor = (color: string) => {
    if (color === 'inherit') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  };

  const setTextHighlight = (color: string) => {
    if (color === 'inherit') {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
  };

  const insertHtml = (html: string) => {
    // Get current content
    const currentContent = editor.getHTML();
    
    // Insert HTML at the end of current content
    const newContent = currentContent + html;
    
    // Set the new content directly
    editor.commands.setContent(newContent);
  };

  const fontSizes = [
    { name: 'Default', value: 'inherit' },
    { name: 'Small', value: '12px' },
    { name: 'Normal', value: '16px' },
    { name: 'Large', value: '18px' },
    { name: 'Extra Large', value: '24px' },
    { name: 'Huge', value: '32px' },
  ];

  const colorPresets = [
    { name: 'Default', value: 'inherit', color: '#000000' },
    { name: 'Red', value: '#ef4444', color: '#ef4444' },
    { name: 'Orange', value: '#f97316', color: '#f97316' },
    { name: 'Yellow', value: '#eab308', color: '#eab308' },
    { name: 'Green', value: '#22c55e', color: '#22c55e' },
    { name: 'Blue', value: '#3b82f6', color: '#3b82f6' },
    { name: 'Purple', value: '#a855f7', color: '#a855f7' },
    { name: 'Pink', value: '#ec4899', color: '#ec4899' },
    { name: 'Gray', value: '#6b7280', color: '#6b7280' },
    { name: 'Black', value: '#000000', color: '#000000' },
  ];

  const highlightPresets = [
    { name: 'Default', value: 'inherit', color: 'transparent' },
    { name: 'Yellow', value: '#fef3c7', color: '#fef3c7' },
    { name: 'Green', value: '#dcfce7', color: '#dcfce7' },
    { name: 'Blue', value: '#dbeafe', color: '#dbeafe' },
    { name: 'Pink', value: '#fce7f3', color: '#fce7f3' },
    { name: 'Orange', value: '#fed7aa', color: '#fed7aa' },
    { name: 'Purple', value: '#f3e8ff', color: '#f3e8ff' },
    { name: 'Red', value: '#fee2e2', color: '#fee2e2' },
  ];

  const MenuBar = () => (
    <div className="border-b border-gray-200 bg-white p-3">
      <div className="flex flex-wrap gap-2">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('code') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Code"
          >
            <Code size={16} />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={() => setTextAlign('left')}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onClick={() => setTextAlign('center')}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onClick={() => setTextAlign('right')}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          <button
            onClick={() => setTextAlign('justify')}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Justify"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        {/* Heading Controls */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === '0') {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(value) as 1 | 2 | 3;
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
            value={(() => {
              if (editor.isActive('heading', { level: 1 })) return '1';
              if (editor.isActive('heading', { level: 2 })) return '2';
              if (editor.isActive('heading', { level: 3 })) return '3';
              return '0';
            })()}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            title="Heading Level"
          >
            <option value="0">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
        </div>

        {/* Font Size Controls */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <select
            onChange={(e) => setFontSize(e.target.value)}
            value={editor.getAttributes('textStyle').fontSize || 'inherit'}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            title="Font Size"
          >
            {fontSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color Controls */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          {/* Text Color */}
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('textStyle', { color: true }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              title="Text Color"
            >
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }} />
            </button>
            
            {isColorPickerOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setTextColor(preset.value);
                        setIsColorPickerOpen(false);
                      }}
                      className="w-8 h-8 rounded border border-gray-300 hover:border-gray-400 flex items-center justify-center text-xs"
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    >
                      {preset.value === 'inherit' && 'D'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    title="Custom Color"
                  />
                  <button
                    onClick={() => {
                      setTextColor(customColor);
                      setIsColorPickerOpen(false);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Text Highlight */}
          <div className="relative" ref={highlightPickerRef}>
            <button
              onClick={() => setIsHighlightPickerOpen(!isHighlightPickerOpen)}
              className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('highlight') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              title="Text Highlight"
            >
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: editor.getAttributes('highlight')?.color || 'transparent' }} />
            </button>
            
            {isHighlightPickerOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {highlightPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setTextHighlight(preset.value);
                        setIsHighlightPickerOpen(false);
                      }}
                      className="w-8 h-8 rounded border border-gray-300 hover:border-gray-400 flex items-center justify-center text-xs"
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    >
                      {preset.value === 'inherit' && 'D'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customHighlight}
                    onChange={(e) => setCustomHighlight(e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    title="Custom Highlight"
                  />
                  <button
                    onClick={() => {
                      setTextHighlight(customHighlight);
                      setIsHighlightPickerOpen(false);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        {/* Block Elements */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Blockquote"
          >
            <Quote size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Code Block"
          >
            <Code2 size={16} />
          </button>
          <button
            onClick={addHorizontalRule}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Horizontal Rule"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Media & Links */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Add Link"
          >
            <LinkIcon size={16} />
          </button>
          {editor.isActive('link') && (
            <button
              onClick={removeLink}
              className="p-2 rounded hover:bg-gray-100 text-red-600"
              title="Remove Link"
            >
              <LinkIcon size={16} />
            </button>
          )}
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Add Image"
          >
            <ImageIcon size={16} />
          </button>
          <button
            onClick={addTable}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Add Table"
          >
            <TableIcon size={16} />
          </button>
          <button
            onClick={() => setIsHtmlModalOpen(true)}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Insert HTML / Embed Code"
          >
            <CodeIcon size={16} />
          </button>
        </div>

        {/* History */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add Link</h3>
            <input
              type="url"
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
            />
            <div className="flex gap-2">
              <button
                onClick={addLink}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Link
              </button>
              <button
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Insert Modal */}
      <HtmlInsertModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        onInsert={insertHtml}
      />
    </div>
  );

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`} dir={dir}>
      <MenuBar />
      <div className="p-4 min-h-[300px]">
        <EditorContent 
          editor={editor} 
          className="min-h-[250px] focus:outline-none"
        />
        {!editor.getText() && (
          <div className="text-gray-400 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
      
      {/* Custom Styles for Headings and Colors */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .ProseMirror h1 {
            font-size: 2.5rem !important;
            font-weight: 700 !important;
            color: #111827 !important;
            margin: 1rem 0 0.5rem 0 !important;
            line-height: 1.2 !important;
          }
          .ProseMirror h2 {
            font-size: 2rem !important;
            font-weight: 700 !important;
            color: #111827 !important;
            margin: 1rem 0 0.5rem 0 !important;
            line-height: 1.2 !important;
          }
          .ProseMirror h3 {
            font-size: 1.5rem !important;
            font-weight: 700 !important;
            color: #111827 !important;
            margin: 1rem 0 0.5rem 0 !important;
            line-height: 1.2 !important;
          }
          .ProseMirror mark {
            border-radius: 0.25rem;
            padding: 0.125rem 0.25rem;
          }
          
          /* List Styles - Force bullets to show in editor */
          .ProseMirror ul {
            list-style-type: disc !important;
            padding-left: 2rem !important;
            margin: 1rem 0 !important;
          }
          
          .ProseMirror ol {
            list-style-type: decimal !important;
            padding-left: 2rem !important;
            margin: 1rem 0 !important;
          }
          
          .ProseMirror li {
            margin: 0.5rem 0 !important;
            display: list-item !important;
            list-style-position: outside !important;
          }
          
          /* Nested list styles in editor */
          .ProseMirror ul ul {
            list-style-type: circle !important;
            padding-left: 2rem !important;
          }
          
          .ProseMirror ul ul ul {
            list-style-type: square !important;
            padding-left: 2rem !important;
          }
          
          .ProseMirror ol ol {
            list-style-type: lower-alpha !important;
            padding-left: 2rem !important;
          }
          
          .ProseMirror ol ol ol {
            list-style-type: lower-roman !important;
            padding-left: 2rem !important;
          }
          
          /* RTL support in editor */
          .ProseMirror[dir="rtl"] ul,
          .ProseMirror[dir="rtl"] ol {
            padding-left: 0 !important;
            padding-right: 2rem !important;
          }
          
          .ProseMirror[dir="rtl"] li {
            text-align: right;
          }
          
          /* Force list markers to be visible */
          .ProseMirror ul li::marker,
          .ProseMirror ol li::marker {
            color: currentColor !important;
            font-weight: normal !important;
          }
          
          /* Override any conflicting prose styles */
          .ProseMirror ul,
          .ProseMirror ol {
            list-style-image: none !important;
          }
        `,
      }} />
    </div>
  );
}
