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
  const isInitializedRef = useRef(false);

  const { formatText, highlightText, clearFormatting, isFormatActive, getActiveHighlight } = useTextFormatting(editorRef);
  const { selection, showToolbar, toolbarPosition } = useTextSelection(editorRef);

  // Fonction pour mettre à jour les compteurs
  const updateCounters = useCallback(() => {
    if (!editorRef.current) return;
    
    // Obtenir le texte brut en préservant les espaces et retours à la ligne
    const text = editorRef.current.innerText || '';
    setCharCount(text.length);
    
    // Comptage des mots amélioré
    const cleanText = text.trim();
    if (!cleanText) {
      setWordCount(0);
    } else {
      // Diviser par tous types d'espaces et retours à la ligne
      const words = cleanText.split(/[\s\n\r\t]+/).filter(word => word.length > 0);
      setWordCount(words.length);
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
        setIsInternalUpdate(true);
        editorRef.current.innerHTML = newContent;
        lastContentRef.current = newContent;
        requestAnimationFrame(() => {
          updateCounters();
          setIsInternalUpdate(false);
        });
      }
    }
  }, [document?.content, updateCounters]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInternalUpdate) return;
    
    const title = e.target.value;
    const content = editorRef.current?.innerHTML || '';
    onUpdate(title, content);
  }, [onUpdate, isInternalUpdate]);

  const handleContentInput = useCallback(() => {
    if (isInternalUpdate || !editorRef.current) return;
    
    const content = editorRef.current.innerHTML;
    const title = titleRef.current?.value || '';
    
    // Mettre à jour la référence pour éviter les boucles
    lastContentRef.current = content;
    
    // Utiliser setTimeout pour éviter les conflits avec la position du curseur
    setTimeout(() => {
      onUpdate(title, content);
      updateCounters();
    }, 0);
  }, [onUpdate, updateCounters, isInternalUpdate]);

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
  }, [formatText, highlightText, clearFormatting, handleSmartClearFormatting, onSave]);

  const handleViewDocuments = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldSave = confirm('Vous avez des modifications non sauvegardées. Voulez-vous sauvegarder avant de continuer ?');
      if (shouldSave) {
        onSave();
        onViewDocuments();
      } else {
        // Si l'utilisateur clique sur "Annuler", on ne fait rien (on reste sur la page)
        return;
      }
    } else {
      // Pas de modifications non sauvegardées, on peut naviguer
      onViewDocuments();
    }
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
          tabIndex={0}
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