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
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);
  const lastContentRef = useRef<string>('');
  const [history, setHistory] = useState<Array<{title: string, content: string}>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const { formatText, highlightText, clearFormatting, isFormatActive, getActiveHighlight } = useTextFormatting(editorRef);
  const { formatAsHeading } = useTextFormatting(editorRef);
  const { selection, showToolbar, toolbarPosition } = useTextSelection(editorRef);

  // Fonction pour mettre à jour les compteurs (définie en premier)
  const updateCounters = useCallback(() => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.textContent || '';
    setCharCount(text.length);
    // Amélioration du comptage des mots
    const cleanText = text.trim();
    if (!cleanText) {
      setWordCount(0);
    } else {
      // Diviser par tous types d'espaces et filtrer les chaînes vides
      const words = cleanText.split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, []);

  // Fonction pour sauvegarder la position du curseur
  const saveCaretPosition = useCallback(() => {
    if (!editorRef.current) return null;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    return {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    };
  }, []);

  // Fonction pour restaurer la position du curseur
  const restoreCaretPosition = useCallback((caretPos: any) => {
    if (!caretPos || !editorRef.current) return;
    
    try {
      const selection = window.getSelection();
      const range = window.document.createRange();
      
      // Vérifier si les nœuds existent toujours
      if (editorRef.current.contains(caretPos.startContainer) && 
          editorRef.current.contains(caretPos.endContainer)) {
        range.setStart(caretPos.startContainer, caretPos.startOffset);
        range.setEnd(caretPos.endContainer, caretPos.endOffset);
        
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Si les nœuds n'existent plus, placer le curseur à la fin
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (error) {
      // En cas d'erreur, placer le curseur à la fin
      const selection = window.getSelection();
      const range = window.document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
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
    
    // Cas 2: Pas de sélection, forcer une rupture de formatage avec indicateur visuel
    try {
      const range = selection.getRangeAt(0);
      
      // Créer un span qui force un formatage neutre
      const neutralSpan = window.document.createElement('span');
      neutralSpan.style.cssText = 'font-weight: normal !important; font-style: normal !important; text-decoration: none !important; background: transparent !important;';
      neutralSpan.setAttribute('data-neutral-format', 'true');
      
      // Créer l'indicateur visuel clignotant
      const blinkIndicator = window.document.createElement('span');
      blinkIndicator.style.cssText = 'animation: blink 1s ease-in-out 3; color: #3b82f6; font-weight: bold;';
      blinkIndicator.textContent = '|';
      
      // Ajouter l'indicateur et un espace invisible
      neutralSpan.appendChild(blinkIndicator);
      const anchor = window.document.createTextNode('\u200B'); // Zero-width space
      neutralSpan.appendChild(anchor);
      
      // Insérer le span dans le document
      range.insertNode(neutralSpan);
      
      // Positionner le curseur après l'ancre
      const newRange = window.document.createRange();
      newRange.setStartAfter(anchor);
      newRange.setEndAfter(anchor);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Supprimer l'indicateur après l'animation (3 secondes)
      setTimeout(() => {
        if (blinkIndicator.parentNode) {
          blinkIndicator.remove();
        }
      }, 3000);
      
      // Nettoyer le span dès qu'on tape quelque chose
      const cleanupHandler = () => {
        if (neutralSpan.parentNode) {
          // Remplacer par un espace normal si besoin
          neutralSpan.replaceWith(window.document.createTextNode(''));
        }
        editorRef.current?.removeEventListener('input', cleanupHandler);
      };
      
      editorRef.current?.addEventListener('input', cleanupHandler, { once: true });
      
    } catch (error) {
      // Fallback simple
      clearFormatting();
    }
  }, [clearFormatting]);

  // Fonction pour sauvegarder l'état dans l'historique
  const saveToHistory = useCallback((title: string, content: string) => {
    if (isUndoRedoRef.current) return; // Ne pas sauvegarder pendant undo/redo
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ title, content });
      // Limiter l'historique à 50 entrées
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Fonction undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const prevState = history[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      
      // Mettre à jour le titre
      if (titleRef.current) {
        titleRef.current.value = prevState.title;
      }
      
      // Mettre à jour le contenu
      if (editorRef.current) {
        const caretPos = saveCaretPosition();
        editorRef.current.innerHTML = prevState.content;
        restoreCaretPosition(caretPos);
      }
      
      // Mettre à jour le document
      onUpdate(prevState.title, prevState.content);
      updateCounters();
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [historyIndex, history, saveCaretPosition, restoreCaretPosition, onUpdate, updateCounters]);

  // Fonction redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const nextState = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      
      // Mettre à jour le titre
      if (titleRef.current) {
        titleRef.current.value = nextState.title;
      }
      
      // Mettre à jour le contenu
      if (editorRef.current) {
        const caretPos = saveCaretPosition();
        editorRef.current.innerHTML = nextState.content;
        restoreCaretPosition(caretPos);
      }
      
      // Mettre à jour le document
      onUpdate(nextState.title, nextState.content);
      updateCounters();
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [historyIndex, history, saveCaretPosition, restoreCaretPosition, onUpdate, updateCounters]);

  // Focus sur le titre lors du chargement d'un document
  useEffect(() => {
    if (titleRef.current && document && !document.content) {
      const timer = setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
          const length = titleRef.current.value.length;
          titleRef.current.setSelectionRange(length, length);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [document?.id]); // Seulement quand l'ID du document change

  // Mise à jour du contenu quand le document change
  useEffect(() => {
    if (document && editorRef.current && !isInternalUpdate) {
      const newContent = document.content || '';
      
      // Ne mettre à jour que si le contenu a vraiment changé
      if (lastContentRef.current !== newContent) {
        // Sauvegarder la position du curseur
        const caretPos = saveCaretPosition();
        
        setIsInternalUpdate(true);
        editorRef.current.innerHTML = newContent;
        lastContentRef.current = newContent;
        
        // Initialiser l'historique avec le document actuel
        if (document.title || document.content) {
          setHistory([{ title: document.title, content: document.content }]);
          setHistoryIndex(0);
        }
        
        // Restaurer la position du curseur après un court délai
        requestAnimationFrame(() => {
          restoreCaretPosition(caretPos);
          updateCounters();
          setIsInternalUpdate(false);
        });
      }
    }
  }, [document?.content, saveCaretPosition, restoreCaretPosition, updateCounters]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInternalUpdate) return;
    
    const title = e.target.value;
    const content = editorRef.current?.innerHTML || '';
    
    // Sauvegarder dans l'historique
    saveToHistory(title, content);
    
    onUpdate(title, content);
  }, [onUpdate, isInternalUpdate, saveToHistory]);

  const handleContentInput = useCallback(() => {
    if (isInternalUpdate || !editorRef.current) return;
    
    const content = editorRef.current.innerHTML;
    const title = titleRef.current?.value || '';
    
    // Mettre à jour la référence pour éviter les boucles
    lastContentRef.current = content;
    
    // Sauvegarder dans l'historique (avec debounce)
    const timeoutId = setTimeout(() => {
      saveToHistory(title, content);
    }, 500);
    
    // Utiliser setTimeout pour éviter les conflits avec la position du curseur
    setTimeout(() => {
      onUpdate(title, content);
      updateCounters();
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [onUpdate, updateCounters, isInternalUpdate, saveToHistory]);

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
          handleSmartClearFormatting();
          break;
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
        case 'y':
          event.preventDefault();
          handleRedo();
          break;
        
      case '1':
        event.preventDefault();
        if (altKey) {
          formatAsHeading(1); // h1
        } else {
          highlightText('yellow');
        }
        break;
      case '2':
        event.preventDefault();
        if (altKey) {
          formatAsHeading(2); // h2
        } else {
          highlightText('blue');
        }
        break;
      case '3':
        event.preventDefault();
        if (altKey) {
          formatAsHeading(3); // h3
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
  }, [formatText, highlightText, clearFormatting, handleSmartClearFormatting, onSave, handleUndo, handleRedo, formatAsHeading]);

  const handleViewDocuments = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous sauvegarder avant de continuer ?')) {
        onSave();
      }
    }
    onViewDocuments();
  }, [hasUnsavedChanges, onSave, onViewDocuments]);
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
          onChange={handleTitleChange}
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
            lineHeight: `${settings.lineHeight}`,
            direction: 'ltr',
            unicodeBidi: 'normal',
            writingMode: 'horizontal-tb'
          }}
          onInput={handleContentInput}
          onKeyDown={handleKeyDown}
          data-placeholder="Commencez à écrire..."
          suppressContentEditableWarning={true}
        />
      </div>

      {/* Format Toolbar */}
      {showToolbar && selection && (
        <FormatToolbar
          position={toolbarPosition}
          onFormatText={formatText}
          onHighlightText={highlightText}
          onClearFormatting={clearFormatting}
          isFormatActive={isFormatActive}
          getActiveHighlight={getActiveHighlight}
        />
      )}

      {/* Action Bar */}
      <ActionBar
        hasUnsavedChanges={hasUnsavedChanges}
        hasDocument={!!document?.id}
        onSave={onSave}
        onDelete={onDelete}
        onViewDocuments={handleViewDocuments}
        onOpenSettings={onOpenSettings}
        settings={settings}
      />

      {/* Status Bar */}
      <StatusBar wordCount={wordCount} charCount={charCount} />
    </div>
  );
}