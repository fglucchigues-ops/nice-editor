import { useCallback, RefObject } from 'react';

export function useTextFormatting(editorRef: RefObject<HTMLElement>) {
  const formatText = useCallback((format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    
    if (format === 'bold' || format === 'italic') {
      document.execCommand(format, false);
    } else if (format.startsWith('h')) {
      formatAsHeading(parseInt(format.charAt(1)));
    }
  }, []);

  const formatAsHeading = useCallback((level: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    
    try {
      // 1. RESET COMPLET : Supprimer tous les formatages de titre existants
      const fragment = range.extractContents();
      
      // Fonction récursive pour nettoyer tous les titres
      const cleanTitles = (node: Node): DocumentFragment => {
        const cleanFragment = document.createDocumentFragment();
        
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child as Element;
            // Si c'est un titre (h1, h2, h3, etc.), extraire le contenu
            if (/^h[1-6]$/i.test(element.tagName)) {
              // Récursivement nettoyer le contenu du titre
              const cleanedContent = cleanTitles(element);
              cleanFragment.appendChild(cleanedContent);
            } else {
              // Pour les autres éléments, les garder mais nettoyer leur contenu
              const newElement = element.cloneNode(false) as Element;
              const cleanedContent = cleanTitles(element);
              newElement.appendChild(cleanedContent);
              cleanFragment.appendChild(newElement);
            }
          } else {
            // Nœuds de texte : les garder tels quels
            cleanFragment.appendChild(child.cloneNode(true));
          }
        });
        
        return cleanFragment;
      };
      
      // Nettoyer le fragment de tous les titres
      const cleanedFragment = cleanTitles(fragment);
      
      // 2. Extraire le texte pur
      const textContent = cleanedFragment.textContent || '';
      
      // 3. Créer le nouveau titre avec le texte nettoyé
      const headingTag = `h${level}`;
      const heading = document.createElement(headingTag);
      heading.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
      heading.style.fontWeight = 'bold';
      heading.style.lineHeight = '1.2';
      heading.style.margin = '1em 0 0.5em 0';
      heading.style.display = 'block';
      heading.textContent = textContent;
      
      // 4. Insérer le nouveau titre
      range.insertNode(heading);
      
      // 5. Positionner le curseur après le titre
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(heading);
      newRange.collapse(true);
      selection.addRange(newRange);
      
      // 6. Nettoyage final du DOM
      if (editorRef.current) {
        // Supprimer les titres vides
        const emptyHeadings = editorRef.current.querySelectorAll('h1:empty, h2:empty, h3:empty, h4:empty, h5:empty, h6:empty');
        emptyHeadings.forEach(h => h.remove());
        
        // Supprimer les titres imbriqués restants
        const nestedHeadings = editorRef.current.querySelectorAll('h1 h1, h1 h2, h1 h3, h2 h1, h2 h2, h2 h3, h3 h1, h3 h2, h3 h3');
        nestedHeadings.forEach(nested => {
          const textContent = nested.textContent || '';
          nested.replaceWith(document.createTextNode(textContent));
        });
      }
      
    } catch (error) {
      console.error('Error formatting heading:', error);
      // Fallback : formatage simple
      const selectedText = range.toString();
      range.deleteContents();
      
      const heading = document.createElement(`h${level}`);
      heading.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
      heading.style.fontWeight = 'bold';
      heading.style.lineHeight = '1.2';
      heading.style.margin = '1em 0 0.5em 0';
      heading.style.display = 'block';
      heading.textContent = selectedText;
      
      range.insertNode(heading);
      
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(heading);
      newRange.collapse(true);
      selection.addRange(newRange);
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