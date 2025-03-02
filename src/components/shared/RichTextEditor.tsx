'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
  error?: string;
  locale?: string;
}

// Safer implementation for React 19
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content...',
  dir = 'ltr',
  className,
  error,
  locale = 'default'
}: RichTextEditorProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const quillInstanceRef = useRef<any>(null);
  
  // Create a unique instance ID that includes the locale
  const instanceId = useRef(`quill-${locale}-${Math.random().toString(36).slice(2, 10)}`);
  
  // Initialize editor once when component mounts
  useEffect(() => {
    let quill: any = null;
    
    const initQuill = async () => {
      try {
        // First, clean up any existing instances
        if (quillInstanceRef.current) {
          // Remove listeners
          if (typeof quillInstanceRef.current.off === 'function') {
            quillInstanceRef.current.off('text-change');
          }
          quillInstanceRef.current = null;
        }
        
        // Remove any existing Quill containers with this ID that might be leftover
        const existingContainer = document.getElementById(instanceId.current);
        if (existingContainer) {
          // Clear inner content including toolbar
          while (existingContainer.firstChild) {
            existingContainer.removeChild(existingContainer.firstChild);
          }
        }

        // Look for any other Quill toolbars that might be orphaned
        const allToolbars = document.querySelectorAll(`.quill-editor-container-${locale} .ql-toolbar`);
        for (let i = 0; i < allToolbars.length; i++) {
          const toolbar = allToolbars[i];
          const parent = toolbar.parentElement;
          if (parent && parent.id !== instanceId.current) {
            parent.removeChild(toolbar);
          }
        }
        
        // Dynamic import Quill
        const Quill = (await import('quill')).default;
        
        // Make sure the element exists in DOM
        const editorElement = document.getElementById(instanceId.current);
        if (!editorElement) {
          console.error('Editor container not found:', instanceId.current);
          setErrorMsg('Editor initialization failed. Please try refreshing the page.');
          return;
        }
        
        // Create a new instance
        quill = new Quill(editorElement, {
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              ['bold', 'italic', 'underline', 'strike', 'blockquote'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ indent: '-1' }, { indent: '+1' }],
              [{ direction: dir }],
              [{ color: [] }, { background: [] }],
              ['link', 'image'],
              ['clean']
            ]
          },
          placeholder: placeholder,
          theme: 'snow'
        });
        
        // Set initial content if provided
        if (value) {
          quill.clipboard.dangerouslyPasteHTML(value);
        }
        
        // Set RTL if needed
        if (dir === 'rtl') {
          quill.root.dir = 'rtl';
          quill.root.style.textAlign = 'right';
        }
        
        // Handle content changes
        quill.on('text-change', function() {
          const html = quill.root.innerHTML;
          const cleanHtml = html === '<p><br></p>' ? '' : html;
          onChange(cleanHtml);
        });
        
        // Store the instance
        quillInstanceRef.current = quill;
        setLoading(false);
        setEditorReady(true);
        console.log('Quill initialized successfully for locale:', locale);
      } catch (err) {
        console.error('Failed to initialize Quill:', err);
        setErrorMsg('Failed to load the text editor. Please refresh the page.');
        setLoading(false);
      }
    };
    
    // Wait a tick to ensure DOM is ready
    const timer = setTimeout(() => {
      initQuill();
    }, 0);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      console.log('Cleaning up Quill instance:', instanceId.current);
      
      if (quillInstanceRef.current) {
        try {
          // Remove listeners
          if (typeof quillInstanceRef.current.off === 'function') {
            quillInstanceRef.current.off('text-change');
          }
          
          // Find and remove the toolbar
          const container = document.getElementById(instanceId.current);
          if (container) {
            const toolbar = container.querySelector('.ql-toolbar');
            if (toolbar) {
              container.removeChild(toolbar);
            }
            
            // Clear all container contents
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
          }
        } catch (e) {
          console.error('Error during Quill cleanup:', e);
        }
      }
      
      // Clear reference
      quillInstanceRef.current = null;
    };
  }, [locale, placeholder, dir]); // Re-initialize when these change

  // Handle content updates from props
  useEffect(() => {
    if (editorReady && quillInstanceRef.current && value !== undefined) {
      // Get current content from editor
      const currentContent = quillInstanceRef.current.root.innerHTML;
      
      // Only update if content differs, to prevent loops
      if (currentContent !== value && value !== '' && currentContent !== '<p><br></p>') {
        quillInstanceRef.current.clipboard.dangerouslyPasteHTML(value);
      }
    }
  }, [value, editorReady]);

  return (
    <div className="rich-text-editor-wrapper">
      {errorMsg ? (
        <div className="border border-red-300 rounded-md p-4 text-red-700 bg-red-50 min-h-[200px]">
          {errorMsg}
        </div>
      ) : (
        <div className={cn(
          "quill-wrapper",
          error ? "editor-error" : "",
          className
        )}>
          {/* Empty static container for Quill to initialize into */}
          <div 
            id={instanceId.current} 
            className={`quill-editor-container quill-editor-container-${locale}`}
          ></div>
          
          {/* Loading indicator */}
          {loading && (
            <div className="editor-loading">
              <div className="flex items-center justify-center h-[200px] bg-gray-50">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      
      <style jsx global>{`
        .rich-text-editor-wrapper {
          position: relative;
        }
        .quill-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }
        .quill-editor-container {
          min-height: 250px;
        }
        .editor-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
        }
        .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          min-height: 200px;
        }
        .editor-error .ql-toolbar,
        .editor-error .ql-container {
          border-color: #ef4444;
        }
      `}</style>
    </div>
  );
} 