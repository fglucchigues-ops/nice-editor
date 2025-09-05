import React, { useState, useRef, useEffect } from 'react';
import { Settings } from '../types';
import { ExportMenu } from './ExportMenu';
import { 
  Save, 
  FileText, 
  Settings as SettingsIcon, 
  Download, 
  Trash2,
  X,
  MoreHorizontal
} from 'lucide-react';

interface Props {
  hasUnsavedChanges: boolean;
  hasDocument: boolean;
  onSave: () => void;
  onDelete: () => void;
  onViewDocuments: () => void;
  onOpenSettings: () => void;
  settings: Settings;
}

export function ActionBar({
  hasUnsavedChanges,
  hasDocument,
  onSave,
  onDelete,
  onViewDocuments,
  onOpenSettings,
  settings
}: Props) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track window width changes
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSmallScreen = windowWidth < 640;
  const isVerySmallScreen = windowWidth < 480;

  const handleDelete = () => {
    if (hasDocument && confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      onDelete();
    }
  };

  const handleExportPDF = async () => {
    try {
      // Get current document content
      const titleElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      const editorElement = document.querySelector('[contenteditable="true"]') as HTMLElement;
      
      if (!titleElement || !editorElement) return;
      
      const title = titleElement.value || 'Document';
      const content = editorElement.innerHTML;
      
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a temporary container for export
      const exportContainer = window.document.createElement('div');
      exportContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 210mm;
        padding: 10mm;
        background: white;
        color: black;
        font-family: ${settings.fontFamily};
        font-size: ${settings.fontSize}px;
        line-height: ${settings.lineHeight};
      `;
      
      exportContainer.innerHTML = `
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">${title}</h1>
        ${content}
      `;
      
      window.document.body.appendChild(exportContainer);
      
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      window.document.body.removeChild(exportContainer);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      
      setShowExportMenu(false);
      setShowActionMenu(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  const handleExportWord = () => {
    try {
      // Get current document content
      const titleElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      const editorElement = document.querySelector('[contenteditable="true"]') as HTMLElement;
      
      if (!titleElement || !editorElement) return;
      
      const title = titleElement.value || 'Document';
      const content = editorElement.innerHTML;
      
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${title}</title>
          <style>
            body { font-family: ${settings.fontFamily}; font-size: ${settings.fontSize}px; line-height: ${settings.lineHeight}; margin: 0.5in; }
            h1, h2, h3, h4, h5, h6 { margin: 1.5em 0 0.5em 0; line-height: 1.3; }
            .title { font-size: 24pt; font-weight: bold; text-align: center; margin-bottom: 2em; border-bottom: 2pt solid black; padding-bottom: 12pt; }
          </style>
        </head>
        <body>
          <div class="title">${title}</div>
          ${content}
        </body>
        </html>
      `;
      
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.doc`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportMenu(false);
      setShowActionMenu(false);
    } catch (error) {
      console.error('Error exporting Word:', error);
      alert('Erreur lors de l\'export Word');
    }
  };

  // On very small screens, show only settings button
  if (isVerySmallScreen) {
    return (
      <>
        {/* Settings button in top-right */}
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title="Paramètres"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  // On small screens, show collapsible action menu
  if (isSmallScreen) {
    return (
      <>
        {/* Settings button in top-right */}
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title="Paramètres"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Collapsible action menu at bottom */}
        <div className="fixed bottom-4 right-4 z-40">
          <div className="relative">
            {/* Action Menu */}
            {showActionMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-48">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onSave();
                      setShowActionMenu(false);
                    }}
                    disabled={!hasUnsavedChanges}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-left ${hasUnsavedChanges ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                  >
                    <Save className="w-4 h-4" />
                    <span className="text-sm">Sauvegarder</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onViewDocuments();
                      setShowActionMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-left"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Documents</span>
                  </button>
                  
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-left"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export PDF</span>
                  </button>
                  
                  <button
                    onClick={handleExportWord}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-left"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export Word</span>
                  </button>
                  
                  {hasDocument && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowActionMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 dark:text-red-400 text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Menu Button */}
            <div className="bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="p-3 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                title="Actions"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Click outside to close menu */}
        {showActionMenu && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowActionMenu(false)}
          />
        )}
      </>
    );
  }

  // Full action bar for larger screens
  const actions = [
    {
      icon: Save,
      onClick: onSave,
      disabled: !hasUnsavedChanges,
      className: hasUnsavedChanges ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400',
      title: 'Sauvegarder (Ctrl+S)'
    },
    {
      icon: FileText,
      onClick: onViewDocuments,
      title: 'Documents'
    },
    {
      icon: SettingsIcon,
      onClick: onOpenSettings,
      title: 'Paramètres'
    },
    {
      icon: Download,
      onClick: () => setShowExportMenu(!showExportMenu),
      title: 'Exporter',
      hasMenu: true
    },
    ...(hasDocument ? [{
      icon: Trash2,
      onClick: handleDelete,
      className: 'text-red-500 dark:text-red-400',
      title: 'Supprimer'
    }] : [])
  ];

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center gap-1">
          {actions.map((action, index) => (
            <div key={index} className="relative">
              <button
                onClick={action.onClick}
                disabled={action.disabled}
                className={`p-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${action.className || 'text-gray-600 dark:text-gray-300'}`}
                title={action.title}
              >
                <action.icon className="w-5 h-5" />
              </button>
              
              {action.hasMenu && showExportMenu && (
                <ExportMenu
                  onClose={() => setShowExportMenu(false)}
                  settings={settings}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}