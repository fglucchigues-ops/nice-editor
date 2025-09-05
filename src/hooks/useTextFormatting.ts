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

  const formatAsHeading = useCallback((level: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    
    // Get the selected content
    const selectedContent = range.extractContents();
    
    // Check if we're already inside a heading and remove it
    let parentElement = range.commonAncestorContainer;
    if (parentElement.nodeType === Node.TEXT_NODE) {
      parentElement = parentElement.parentElement;
    }
    
    // Remove existing heading tags
    while (parentElement && parentElement !== editorRef.current) {
      if (/^H[1-6]$/i.test(parentElement.tagName)) {
        // Replace the heading with its content
        const headingContent = parentElement.innerHTML;
        const textNode = document.createTextNode(parentElement.textContent || '');
        parentElement.parentNode?.replaceChild(textNode, parentElement);
        
        // Create new range for the text
        const newRange = document.createRange();
        newRange.selectNodeContents(textNode);
        selection.removeAllRanges();
        selection.addRange(newRange);
        break;
      }
      parentElement = parentElement.parentElement;
    }
    
    // Create new heading
    const headingTag = `h${level}`;
    const heading = document.createElement(headingTag);
    heading.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
    heading.style.fontWeight = 'bold';
    heading.style.lineHeight = '1.2';
    heading.style.margin = '1em 0 0.5em 0';
    heading.style.display = 'block';
    
    // Add the selected content to the heading
    heading.appendChild(selectedContent);
    
    // Insert the heading
    range.insertNode(heading);
    
    // Clear selection and position cursor after heading
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(heading);
    newRange.collapse(true);
    selection.addRange(newRange);
  }, [editorRef]);

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

  // Fonction pour gérer le nettoyage intelligent du formatage
  const handleSmartClearFormatting = useCallback(() => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Cas 1: Si du texte est sélectionné, appliquer le nettoyage standard
    if (!selection.isCollapsed) {
      clearFormatting();
      return;
    }
    
    // Cas 2: Pas de sélection, créer un point de rupture de formatage
    try {
      const range = selection.getRangeAt(0);
      
      // Créer un span invisible qui force un formatage neutre
      const neutralSpan = window.document.createElement('span');
      neutralSpan.style.cssText = `
        font-weight: normal !important; 
        font-style: normal !important; 
        text-decoration: none !important; 
        background: transparent !important;
        color: inherit !important;
        font-size: inherit !important;
      `;
      neutralSpan.setAttribute('data-neutral-format', 'true');
      
      // Ajouter un espace invisible comme ancre
      const anchor = window.document.createTextNode('\u200B');
      neutralSpan.appendChild(anchor);
      
      // Insérer le span dans le document
      range.insertNode(neutralSpan);
      
      // Positionner le curseur après l'ancre
      const newRange = window.document.createRange();
      newRange.setStartAfter(anchor);
      newRange.setEndAfter(anchor);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Nettoyer le span dès qu'on tape quelque chose
      const cleanupHandler = () => {
        if (neutralSpan.parentNode) {
          // Remplacer le span par son contenu
          const parent = neutralSpan.parentNode;
          while (neutralSpan.firstChild) {
            parent.insertBefore(neutralSpan.firstChild, neutralSpan);
          }
          parent.removeChild(neutralSpan);
        }
        editorRef.current?.removeEventListener('input', cleanupHandler);
      };
      
      editorRef.current?.addEventListener('input', cleanupHandler, { once: true });
      
    } catch (error) {
      // Fallback simple
      clearFormatting();
    }
  }, [clearFormatting]);

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