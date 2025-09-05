import React, { useState, useEffect } from 'react';
import { WritingEditor } from './components/WritingEditor';
import { DocumentsList } from './components/DocumentsList';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { useDocuments } from './hooks/useDocuments';
import { useSettings } from './hooks/useSettings';
import { Document, Settings, View } from './types';
import { HelpCircle } from 'lucide-react';

// Toast component
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

function Toast({ message, type = 'info', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-slide-up opacity-90 text-sm" style={{ transform: 'translateX(-50%)' }}>
      {message}
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<View>('write');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const { settings, updateSetting } = useSettings();
  const {
    documents,
    currentDocument,
    hasUnsavedChanges,
    createDocument,
    openDocument,
    saveDocument,
    deleteDocument,
    updateDocument
  } = useDocuments();

  // Apply theme class to body
  useEffect(() => {
    document.body.className = settings.theme === 'dark' ? 'dark' : '';
  }, [settings.theme]);

  const handleCreateNew = () => {
    createDocument();
    setCurrentView('write');
  };

  const handleOpenDocument = (doc: Document) => {
    openDocument(doc);
    setCurrentView('write');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleSave = async () => {
    await saveDocument();
    showToast('Document sauvegardé');
  };

  // Show toast for auto-save
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && currentDocument) {
        saveDocument().then(() => {
          showToast('Sauvegarde automatique');
        });
      }
    }, 10000); // Auto-save every 10 seconds
    
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, currentDocument, saveDocument]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      settings.theme === 'dark' 
        ? 'bg-dark-paper text-gray-100' 
        : 'bg-paper text-gray-900'
    }`}>
      {/* Help Button */}
      {currentView === 'write' && <button
        onClick={() => setShowHelp(true)}
        className="fixed top-4 right-4 md:top-5 md:right-5 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center opacity-40 hover:opacity-100 hover:scale-105 z-40"
        title="Aide"
      >
        <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-300" />
      </button>}

      {/* Main Content */}
      {currentView === 'write' ? (
        <WritingEditor
          document={currentDocument}
          settings={settings}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onUpdate={updateDocument}
          onDelete={deleteDocument}
          onViewDocuments={() => setCurrentView('documents')}
          onOpenSettings={() => setShowSettings(true)}
        />
      ) : (
        <DocumentsList
          documents={documents}
          settings={settings}
          onCreateNew={handleCreateNew}
          onOpenDocument={handleOpenDocument}
          onDeleteDocument={deleteDocument}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSetting={updateSetting}
          onClose={() => setShowSettings(false)}
          onSave={handleSave}
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;