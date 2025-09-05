import React, { useState, useRef, useEffect } from 'react';
import { Settings } from '../types';
import { ExportMenu } from './ExportMenu';
import { 
  Save, 
  FileText, 
  Settings as SettingsIcon, 
  Download, 
  Trash2,
  X
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

  const isSmallScreen = windowWidth < 768;

  // On small screens, show compact floating action bar
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
        
        {/* Compact action bar at bottom */}
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex items-center gap-1">
              <button
                onClick={onSave}
                disabled={!hasUnsavedChanges}
                className={`p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${hasUnsavedChanges ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                title="Sauvegarder (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
              </button>
              
              <button
                onClick={onViewDocuments}
                className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                title="Documents"
              >
                <FileText className="w-4 h-4" />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  title="Exporter"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {showExportMenu && (
                  <ExportMenu
                    onClose={() => setShowExportMenu(false)}
                    settings={settings}
                  />
                )}
              </div>
              
              {hasDocument && (
                <button
                  onClick={onDelete}
                  className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 dark:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
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
      onClick: onDelete,
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