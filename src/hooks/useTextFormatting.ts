import { useCallback } from 'react';

export function useTextFormatting() {
  const formatText = useCallback((format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    
    if (format === 'bold' || format === 'italic') {
      document.execCommand(format, false);
    } else if (format.startsWith('h')) {
      const level = format.charAt(1);
      const fontSize = level === '1' ? '2em' : level === '2' ? '1.5em' : '1.25em';
      
      const range = selection.getRangeAt(0);
      const heading = document.createElement(format);
      heading.style.fontSize = fontSize;
      heading.style.fontWeight = 'bold';
      heading.style.lineHeight = '1.2';
      heading.style.margin = '1em 0 0.5em 0';
      heading.style.display = 'block';
      
      try {
        const contents = range.extractContents();
        heading.appendChild(contents);
        range.insertNode(heading);
        
        // Clear selection and position cursor after heading
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(heading);
        newRange.collapse(true);
        selection.addRange(newRange);
      } catch (e) {
        console.error('Error formatting text:', e);
      }
    }
  }, []);

  const highlightText = useCallback((color: string) => {
    const colors: Record<string, string> = {
      yellow: '#fef3c7',
      blue: '#dbeafe',
      green: '#d1fae5',
      pink: '#fce7f3',
      purple: '#ede9fe',
      orange: '#fed7aa'
    };
    
    document.execCommand('hiliteColor', false, colors[color]);
  }, []);

  const clearFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    document.execCommand('removeFormat', false);
    document.execCommand('unlink', false);
  }, []);

  const isFormatActive = useCallback((format: string) => {
    try {
      return document.queryCommandState(format);
    } catch (e) {
      return false;
    }
  }, []);

  return {
    formatText,
    highlightText,
    clearFormatting,
    isFormatActive
  };
}