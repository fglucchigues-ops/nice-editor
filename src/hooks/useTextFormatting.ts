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
    try {
      // Méthode simple et efficace avec formatBlock
      document.execCommand('formatBlock', false, `h${level}`);
      
      // Appliquer les styles CSS pour assurer la cohérence visuelle
      setTimeout(() => {
        if (editorRef.current) {
          const headings = editorRef.current.querySelectorAll(`h${level}`);
          headings.forEach(heading => {
            const h = heading as HTMLElement;
            h.style.fontSize = level === 1 ? '2em' : level === 2 ? '1.5em' : '1.25em';
            h.style.fontWeight = 'bold';
            h.style.lineHeight = '1.2';
            h.style.margin = '1em 0 0.5em 0';
            h.style.display = 'block';
          });
        }
      }, 0);
    } catch (error) {
      console.error('Error formatting heading:', error);
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
    
    // Couleurs pour le mode sombre avec meilleur contraste
    const darkColors: Record<string, string> = {
      yellow: '#92400e', // Brun foncé pour le jaune
      blue: '#1e40af',   // Bleu foncé
      green: '#065f46',  // Vert foncé
      pink: '#be185d',   // Rose foncé
      purple: '#6b21a8', // Violet foncé
      orange: '#c2410c'  // Orange foncé
    };
    
    // Détecter le mode sombre
    const isDarkMode = document.body.classList.contains('dark');
    const colorToUse = isDarkMode ? darkColors[color] : colors[color];
    
    document.execCommand('hiliteColor', false, colorToUse);
  }, []);

  const clearFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Si pas de sélection, appliquer le formatage de paragraphe
    if (selection.isCollapsed) {
      document.execCommand('formatBlock', false, 'p');
    } else {
      // Pour une sélection, d'abord convertir en paragraphe puis nettoyer
      document.execCommand('formatBlock', false, 'p');
      document.execCommand('removeFormat', false);
      document.execCommand('unlink', false);
    }
  }, []);

  // Fonction pour gérer le nettoyage du formatage (sans blink)
  const handleSmartClearFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Si du texte est sélectionné, appliquer le nettoyage standard
    if (!selection.isCollapsed) {
      // Convertir en paragraphe puis nettoyer le formatage
      document.execCommand('formatBlock', false, 'p');
      document.execCommand('removeFormat', false);
      document.execCommand('unlink', false);
      return;
    }
    
    // Pas de sélection, convertir en paragraphe et créer un point de rupture
    try {
      document.execCommand('formatBlock', false, 'p');
      
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
      document.execCommand('formatBlock', false, 'p');
      document.execCommand('removeFormat', false);
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
      
      // Pour les sélections multi-lignes, vérifier tous les éléments dans la sélection
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      const colorMap = {
        'rgb(254, 243, 199)': 'yellow',
        'rgba(254, 243, 199, 1)': 'yellow',
        'rgb(219, 234, 254)': 'blue',
        'rgba(219, 234, 254, 1)': 'blue',
        'rgb(209, 250, 229)': 'green',
        'rgba(209, 250, 229, 1)': 'green',
        'rgb(252, 231, 243)': 'pink',
        'rgba(252, 231, 243, 1)': 'pink',
        'rgb(237, 233, 254)': 'purple',
        'rgba(237, 233, 254, 1)': 'purple',
        'rgb(254, 215, 170)': 'orange',
        'rgba(254, 215, 170, 1)': 'orange'
      };
      
      // Vérifier l'élément de départ
      let element = range.startContainer;
      
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }
      
      // Vérifier l'élément courant et ses parents
      while (element && element !== editorRef.current) {
        const bgColor = window.getComputedStyle(element).backgroundColor;
        if (colorMap[bgColor]) {
          return colorMap[bgColor];
        }
        element = element.parentElement;
      }
      
      // Vérifier les éléments dans la sélection
      let node = walker.nextNode();
      while (node) {
        const bgColor = window.getComputedStyle(node).backgroundColor;
        if (colorMap[bgColor]) {
          return colorMap[bgColor];
        }
        node = walker.nextNode();
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