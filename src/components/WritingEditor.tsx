import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Settings } from '../types';
import { ActionBar } from './ActionBar';
import { StatusBar } from './StatusBar';
import { FormatToolbar } from './FormatToolbar';
import { useTextFormatting } from '../hooks/useTextFormatting';
import { useTextSelection } from '../hooks/useTextSelection';

interface Props {
  document: Document | null;
  settings: Settings;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onUpdate: (title: string, content: string) => void;
  onDelete: () => void;
  onViewDocuments: () => void;
  onOpenSettings: () => void;
}

export function WritingEditor({
  document,
  settings,
  hasUnsavedChanges,
  onSave,
  onUpdate,
  onDelete,
  onViewDocuments,
  onOpenSettings
}: Props) {
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  
  const { formatText, highlightText, clearFormatting, isFormatActive } = useTextFormatting();
  const { selection, showToolbar, toolbarPosition } = useTextSelection(editorRef);

  // Focus on title when document changes
  useEffect(() => {
    if (titleRef.current && document) {
      titleRef.current.focus();
      // Position cursor at end of title
      const length = titleRef.current.value.length;
      titleRef.current.setSelectionRange(length, length);
    }
  }, [document?.id]);

  // Update content when document changes
  useEffect(() => {
    if (document && editorRef.current) {
      editorRef.current.innerHTML = document.content;
      updateCounters();
    }
  }, [document]);

  const updateCounters = useCallback(() => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.textContent || '';
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, []);

  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    
    const title = titleRef.current?.value || '';
    const content = editorRef.current.innerHTML;
    
    onUpdate(title, content);
    updateCounters();
  }, [onUpdate, updateCounters]);

  const handleInput = useCallback((e: React.FormEvent) => {
    // Don't prevent default - let the browser handle the input naturally
    handleContentChange();
  }, [handleContentChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const { ctrlKey, metaKey, altKey, key } = event;
    const isCmd = ctrlKey || metaKey;
    
    if (isCmd) {
      switch (key.toLowerCase()) {
        case 's':
          event.preventDefault();
          onSave();
          break;
        case 'b':
          event.preventDefault();
          formatText('bold');
          break;
        case 'i':
          event.preventDefault();
          formatText('italic');
          break;
        case '\\':
          event.preventDefault();
          clearFormatting();
          break;
        case 'u':
          event.preventDefault();
          clearFormatting();
          break;
        case '1':
          event.preventDefault();
          if (altKey) {
            formatText('h1');
          } else {
            highlightText('yellow');
          }
          break;
        case '2':
          event.preventDefault();
          if (altKey) {
            formatText('h2');
          } else {
            highlightText('blue');
          }
          break;
        case '3':
          event.preventDefault();
          if (altKey) {
            formatText('h3');
          } else {
            highlightText('green');
          }
          break;
        case '4':
          event.preventDefault();
          highlightText('pink');
          break;
        case '5':
          event.preventDefault();
          highlightText('purple');
          break;
        case '6':
          event.preventDefault();
          highlightText('orange');
          break;
      }
    }
  }, [formatText, highlightText, clearFormatting, onSave]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Title Section */}
      <div className={`px-4 md:px-8 lg:px-16 py-4 md:py-6 ${
        settings.stickyTitle 
          ? 'sticky top-0 bg-paper dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700 z-30' 
          : ''
      }`}>
        <input
          ref={titleRef}
          type="text"
          value={document?.title || ''}
          onChange={handleContentChange}
          className="w-full bg-transparent border-none outline-none text-2xl md:text-3xl lg:text-4xl font-semibold placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Titre du document"
          style={{
            fontSize: `${Math.min(settings.fontSize * 1.5, 36)}px`,
            fontFamily: settings.fontFamily,
            lineHeight: '1.2'
          }}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 px-4 md:px-8 lg:px-16 pb-20 md:pb-24">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[50vh] md:min-h-[60vh] py-4 md:py-6 bg-transparent border-none outline-none leading-relaxed focus:outline-none"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily,
            lineHeight: settings.lineHeight
          }}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder="Commencez à écrire..."
          suppressContentEditableWarning={true}
        ></div>
      </div>

      {/* Format Toolbar */}
      {showToolbar && selection && (
        <FormatToolbar
          position={toolbarPosition}
          onFormatText={formatText}
          onHighlightText={highlightText}
          onClearFormatting={clearFormatting}
          isFormatActive={isFormatActive}
        />
      )}

      {/* Action Bar */}
      <ActionBar
        hasUnsavedChanges={hasUnsavedChanges}
        hasDocument={!!document?.id}
        onSave={onSave}
        onDelete={onDelete}
        onViewDocuments={onViewDocuments}
        onOpenSettings={onOpenSettings}
        settings={settings}
      />

      {/* Status Bar */}
      <StatusBar wordCount={wordCount} charCount={charCount} />
    </div>
  );
}