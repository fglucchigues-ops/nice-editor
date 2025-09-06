import React, { useState } from 'react';
import { Document, Settings } from '../types';
import { 
  MoreHorizontal, 
  Calendar, 
  Edit3, 
  Download, 
  Trash2 
} from 'lucide-react';

interface Props {
  document: Document;
  settings: Settings;
  onOpen: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
}

export function DocumentCard({ 
  document, 
  settings, 
  onOpen, 
  onDelete, 
  formatDate 
}: Props) {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        const target = event.target as Element;
        if (!target.closest('.document-card-menu')) {
          setShowMenu(false);
        }
      }
    };

    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleExportPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    // PDF export logic will be implemented
    console.log('Export PDF:', document.title);
    setShowMenu(false);
  };

  const handleExportWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Word export logic will be implemented
    console.log('Export Word:', document.title);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowMenu(false);
  };

  // Get preview text from content (strip HTML)
  const getPreviewText = (content: string, maxLength: number = 150) => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div
      onClick={onOpen}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-gray-200 dark:hover:shadow-gray-900/50 hover:-translate-y-1"
    >
      {/* Menu Button */}
      <div className="absolute top-3 right-3 md:top-4 md:right-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
        >
          <MoreHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 dark:text-gray-400" />
        </button>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="document-card-menu absolute right-0 top-8 md:top-10 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 py-2 min-w-32 md:min-w-40 z-10">
            <button
              onClick={handleExportPDF}
              className="w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportWord}
              className="w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
              Word
            </button>
            <hr className="my-1.5 border-gray-200 dark:border-gray-600" />
            <button
              onClick={handleDelete}
              className="w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pr-6 md:pr-8">
        <h3 className="font-semibold text-base md:text-lg mb-2 text-gray-900 dark:text-gray-100 truncate">
          {document.title || 'Sans titre'}
        </h3>
        
        {document.content && (
          <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-3">
            {getPreviewText(document.content)}
          </p>
        )}
        
        <div className="space-y-1.5 md:space-y-2 text-xs text-gray-500 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>Créé: {formatDate(document.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Edit3 className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>Modifié: {formatDate(document.updatedAt)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}