import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { WritingEditor } from './components/WritingEditor';
import { DocumentsList } from './components/DocumentsList';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { useDocuments } from './hooks/useDocuments';
import { useSettings } from './hooks/useSettings';
import { Document, Settings } from './types';
import { HelpCircle } from 'lucide-react';

// Apply theme immediately on app load to prevent flicker
const applyThemeImmediately = () => {
  const savedSettings = localStorage.getItem('writing-app-settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }
};

// Call immediately
applyThemeImmediately();

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  }
};

const pageTransition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1], // Elegant ease-out
  duration: 0.1
};

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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-slide-up opacity-90 text-sm">
      {message}
    </div>
  );
}

// Component for document editor route
function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Apply theme immediately on component mount
  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };
    applyTheme();
  }, [settings.theme]);

  // Load document when ID changes
  useEffect(() => {
    if (id === 'new') {
      createDocument();
    } else if (id) {
      const docId = parseInt(id);
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        openDocument(doc);
      } else if (documents.length > 0) {
        // Document not found, redirect to documents list
        navigate('/');
      }
    } else {
      // Pas d'ID, créer un nouveau document
      createDocument();
    }
  }, [id, documents]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleSave = async () => {
    const savedDoc = await saveDocument();
    // If we were on /document/new and document was saved successfully, redirect to the saved document's URL
    if (id === 'new' && savedDoc && savedDoc.id) {
      navigate(`/document/${savedDoc.id}`, { replace: true });
    }
    showToast('Document sauvegardé');
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer "${currentDocument?.title || 'ce document'}" ?\n\nCette action est irréversible.`
    );
    
    if (confirmDelete) {
      await deleteDocument();
      showToast('Document supprimé');
      navigate('/');
    }
  };

  // Confirmation avant fermeture si changements non sauvegardés
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      settings.theme === 'dark' 
        ? 'bg-dark-paper text-gray-100' 
        : 'bg-paper text-gray-900'
    }`}>
      {/* Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed top-4 right-4 md:top-5 md:right-5 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center opacity-40 hover:opacity-100 hover:scale-105 z-40"
        title="Aide"
      >
        <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Main Content */}
      <WritingEditor
        document={currentDocument}
        settings={settings}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onUpdate={updateDocument}
        onDelete={handleDelete}
        onViewDocuments={() => navigate('/')}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSetting={updateSetting}
          onClose={() => setShowSettings(false)}
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

// Component for documents list route
function DocumentsListPage() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const { settings, updateSetting } = useSettings();
  const { documents, deleteDocument } = useDocuments();

  // Apply theme immediately on component mount
  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };
    applyTheme();
  }, [settings.theme]);

  const handleCreateNew = () => {
    navigate('/document/new');
  };

  const handleOpenDocument = (doc: Document) => {
    navigate(`/document/${doc.id}`);
  };

  const handleDeleteDocument = async (id: number) => {
    await deleteDocument(id);
    setToast({ message: 'Document supprimé', type: 'success' });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      settings.theme === 'dark' 
        ? 'bg-dark-paper text-gray-100' 
        : 'bg-paper text-gray-900'
    }`}>
      <DocumentsList
        documents={documents}
        settings={settings}
        onCreateNew={handleCreateNew}
        onOpenDocument={handleOpenDocument}
        onDeleteDocument={handleDeleteDocument}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSetting={updateSetting}
          onClose={() => setShowSettings(false)}
        />
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

function App() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <DocumentsListPage />
            </motion.div>
          } 
        />
        <Route 
          path="/document/:id" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <DocumentEditor />
            </motion.div>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;