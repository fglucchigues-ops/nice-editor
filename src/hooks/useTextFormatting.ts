import { useCallback, RefObject } from 'react';

export function useTextFormatting(editorRef: RefObject<HTMLElement>) {
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
    
    // Sauvegarder le texte sélectionné
    const selectedText = range.toString();
    
    // Supprimer le contenu sélectionné
    range.deleteContents();
    
    // Créer le nouveau titre avec le texte
    const headingTag = `h${level}`;
    const heading = document.createElement(headingTag);
    heading.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
    heading.style.fontWeight = 'bold';
    heading.style.lineHeight = '1.2';
    heading.style.margin = '1em 0 0.5em 0';
    heading.style.display = 'block';
    heading.textContent = selectedText;
    
    // Insérer le titre
    range.insertNode(heading);
    
    // Positionner le curseur après le titre
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(heading);
    newRange.collapse(true);
    selection.addRange(newRange);
    
    // Nettoyer les titres orphelins dans l'éditeur
    if (editorRef.current) {
      const allHeadings = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      allHeadings.forEach(h => {
        // Si le titre est vide ou contient seulement des espaces
        if (!h.textContent?.trim()) {
          h.remove();
        }
        // Si le titre est imbriqué dans un autre titre
        const parentHeading = h.closest('h1, h2, h3, h4, h5, h6');
        if (parentHeading && parentHeading !== h) {
          // Extraire le contenu du titre imbriqué
          const textContent = h.textContent || '';
          h.replaceWith(document.createTextNode(textContent));
        }
      });
    }
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

  // Fonction pour gérer le nettoyage du formatage (sans blink)
  const handleSmartClearFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Si du texte est sélectionné, appliquer le nettoyage standard
    if (!selection.isCollapsed) {
      clearFormatting();
      return;
    }
    
    // Pas de sélection, créer un point de rupture simple
    try {
      const range = selection.getRangeAt(0);
      
      // Créer un span neutre invisible
      const neutralSpan = document.createElement('span');
      neutralSpan.style.cssText = 'font-weight: normal !important; font-style: normal !important; text-decoration: none !important; background: transparent !important;';
      neutralSpan.setAttribute('data-neutral-format', 'true');
      
      // Ajouter un espace invisible
      const anchor = document.createTextNode('\u200B');
      neutralSpan.appendChild(anchor);
      
      range.insertNode(neutralSpan);
      
      // Positionner le curseur
      const newRange = document.createRange();
      newRange.setStartAfter(anchor);
      newRange.setEndAfter(anchor);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Nettoyer automatiquement
      if (editorRef.current) {
        const cleanupHandler = () => {
          if (neutralSpan.parentNode) {
            neutralSpan.replaceWith(document.createTextNode(''));
          }
          editorRef.current?.removeEventListener('input', cleanupHandler);
        };
        
        editorRef.current.addEventListener('input', cleanupHandler, { once: true });
      }
      
    } catch (error) {
      clearFormatting();
    }
  }, [clearFormatting, editorRef]);

  // Fonction améliorée pour détecter les formats actifs
  const isFormatActive = useCallback((format: string) => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      
      if (format === 'bold' || format === 'italic') {
        return document.queryCommandState(format);
      }
      
      // Pour les titres, vérifier si la sélection est dans un élément de titre
      if (format.startsWith('h')) {
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }
        
        while (element && element !== editorRef.current) {
          if (element.tagName && element.tagName.toLowerCase() === format) {
            return true;
          }
          element = element.parentElement;
        }
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }, [editorRef]);

  // Fonction pour détecter la couleur de surlignage active
  const getActiveHighlight = useCallback(() => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      
      const range = selection.getRangeAt(0);
      let element = range.commonAncestorContainer;
      
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }
      
      while (element && element !== editorRef.current) {
        const bgColor = window.getComputedStyle(element).backgroundColor;
        
        // Mapper les couleurs RGB vers les noms
        const colorMap = {
          'rgb(254, 243, 199)': 'yellow',
          'rgb(219, 234, 254)': 'blue', 
          'rgb(209, 250, 229)': 'green',
          'rgb(252, 231, 243)': 'pink',
          'rgb(237, 233, 254)': 'purple',
          'rgb(254, 215, 170)': 'orange'
        };
        
        if (colorMap[bgColor]) {
          return colorMap[bgColor];
        }
        
        element = element.parentElement;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }, [editorRef]);

  return {
    formatText,
    formatAsHeading,
    highlightText,
    clearFormatting,
    isFormatActive,
    getActiveHighlight
  };
}