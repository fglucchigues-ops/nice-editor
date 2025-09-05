import { useCallback, RefObject } from 'react';

export function useTextFormatting(editorRef: RefObject<HTMLElement>) {
  // Fonction pour obtenir les couleurs selon le thème actuel
  const getColors = useCallback(() => {
    return {
      colors: {
        yellow: '#ca8a04',
        blue: '#2563eb',
        green: '#16a34a',
        pink: '#db2777',
        purple: '#9333ea',
        orange: '#f97316'
      },
      textColor: '#ffffff' // Texte blanc pour tous les surlignages
    };
  }, []);

  const formatText = useCallback((format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Si pas de sélection, on prépare le formatage pour le texte suivant
    if (selection.isCollapsed) {
      if (format === 'bold' || format === 'italic') {
        document.execCommand(format, false);
      } else if (format.startsWith('h')) {
        // Pour les titres sans sélection, on change le bloc courant
        document.execCommand('formatBlock', false, format);
      }
    } else {
      // Avec sélection, formatage normal
      if (format === 'bold' || format === 'italic') {
        document.execCommand(format, false);
      } else if (format.startsWith('h')) {
        formatAsHeading(parseInt(format.charAt(1)));
      }
    }
  }, []);

  const formatAsHeading = useCallback((level: number) => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      if (selection.isCollapsed) {
        // Sans sélection, changer le bloc courant
        document.execCommand('formatBlock', false, `h${level}`);
      } else {
        // Avec sélection, formatBlock sur la sélection
        document.execCommand('formatBlock', false, `h${level}`);
      }
      
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
    const { colors, textColor } = getColors();
    const colorToUse = colors[color];
    
    if (colorToUse) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      // Fonctionne avec ou sans sélection
      document.execCommand('hiliteColor', false, colorToUse);
      
      // Appliquer la couleur de texte blanche pour tous les surlignages
      if (textColor) {
        document.execCommand('foreColor', false, textColor);
      }
    }
  }, [getColors]);

  const clearFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    try {
      // Si pas de sélection, appliquer le formatage de paragraphe
      if (selection.isCollapsed) {
        document.execCommand('formatBlock', false, 'p');
      } else {
        // Pour une sélection, nettoyage complet et multiple
        // 1. Convertir en paragraphe
        document.execCommand('formatBlock', false, 'p');
        
        // 2. Supprimer tous les formatages (répéter pour être sûr)
        for (let i = 0; i < 3; i++) {
          document.execCommand('removeFormat', false);
          document.execCommand('unlink', false);
          document.execCommand('hiliteColor', false, 'transparent');
          document.execCommand('backColor', false, 'transparent');
          // Remettre la couleur par défaut selon le thème
          const isDark = document.body.classList.contains('dark');
          const defaultColor = isDark ? '#f3f4f6' : '#111827'; // gray-100 pour dark, gray-900 pour light
          document.execCommand('foreColor', false, defaultColor);
        }
        
        // 3. Forcer le retour à un paragraphe normal
        document.execCommand('formatBlock', false, 'p');
      }
    } catch (error) {
      console.error('Error clearing formatting:', error);
    }
  }, []);

  // Fonction pour gérer le nettoyage du formatage (sans blink)
  const handleSmartClearFormatting = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Si du texte est sélectionné, appliquer le nettoyage standard
    if (!selection.isCollapsed) {
      // Nettoyage complet pour les sélections
      clearFormatting();
      return;
    }
    
    // Pas de sélection, convertir en paragraphe et créer un point de rupture
    try {
      document.execCommand('formatBlock', false, 'p');
      
      const range = selection.getRangeAt(0);
      
      // Créer un span neutre invisible
      const neutralSpan = document.createElement('span');
      // Remettre la couleur par défaut selon le thème
      const isDark = document.body.classList.contains('dark');
      const defaultColor = isDark ? '#f3f4f6' : '#111827'; // gray-100 pour dark, gray-900 pour light
      neutralSpan.style.cssText = `font-weight: normal !important; font-style: normal !important; text-decoration: none !important; background: transparent !important; color: ${defaultColor} !important;`;
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
      // Remettre la couleur par défaut
      const isDark = document.body.classList.contains('dark');
      const defaultColor = isDark ? '#f3f4f6' : '#111827';
      document.execCommand('foreColor', false, defaultColor);
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
      const { colors } = getColors();
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
      
      // Créer le mapping des couleurs basé sur le thème actuel
      const colorMap: Record<string, string> = {};
      
      Object.entries(colors).forEach(([colorName, colorValue]) => {
        // Convertir hex en rgb pour la comparaison
        const hex = colorValue.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const rgbString = `rgb(${r}, ${g}, ${b})`;
        const rgbaString = `rgba(${r}, ${g}, ${b}, 1)`;
        
        colorMap[rgbString] = colorName;
        colorMap[rgbaString] = colorName;
      });
      
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
  }, [editorRef, getColors]);

  return {
    formatText,
    formatAsHeading,
    highlightText,
    clearFormatting,
    isFormatActive,
    getActiveHighlight
  };
}