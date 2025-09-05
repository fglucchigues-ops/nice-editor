import { useState, useEffect, useRef, RefObject } from 'react';
import { TextSelection } from '../types';

export function useTextSelection(editorRef: RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const windowSelection = window.getSelection();
      if (!windowSelection || windowSelection.rangeCount === 0 || windowSelection.isCollapsed) {
        setSelection(null);
        setShowToolbar(false);
        return;
      }

      // Check if selection is within our editor
      const range = windowSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) {
        setSelection(null);
        setShowToolbar(false);
        return;
      }

      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        const textSelection: TextSelection = {
          range,
          rect
        };
        
        setSelection(textSelection);
        setShowToolbar(true);

        // Calculate toolbar position
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const toolbarWidth = 350; // Approximate width for single line
        const toolbarHeight = 50; // Approximate height
        
        let top = rect.top - toolbarHeight - 10;
        let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
        
        // Adjust for viewport boundaries
        if (top < 10) {
          top = rect.bottom + 10;
        }
        if (left < 10) {
          left = 10;
        }
        if (left + toolbarWidth > viewportWidth - 10) {
          left = viewportWidth - toolbarWidth - 10;
        }
        
        setToolbarPosition({ top, left });
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editorRef]);

  // Hide toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShowToolbar(false);
        setSelection(null);
      }
    };

    if (showToolbar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolbar]);

  return {
    selection,
    showToolbar,
    toolbarPosition,
    toolbarRef
  };
}