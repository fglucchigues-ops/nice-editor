import React from 'react';
import { Settings } from '../types';

interface Props {
  onClose: () => void;
  settings: Settings;
}

export function ExportMenu({ onClose, settings }: Props) {
  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.export-menu')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleExportPDF = () => {
    console.log('Export PDF');
    onClose();
  };

  const handleExportWord = () => {
    console.log('Export Word');
    onClose();
  };

  return (
    <div className="export-menu absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 py-2 min-w-32 z-10">
      <button
        onClick={handleExportPDF}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
      >
        PDF
      </button>
      <button
        onClick={handleExportWord}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
      >
        Word
      </button>
    </div>
  );
}