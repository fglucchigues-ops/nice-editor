import React, { useState, useMemo } from 'react';
import { Document, Settings } from '../types';
import { DocumentCard } from './DocumentCard';
import { 
  Plus, 
  Search, 
  FileText, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface Props {
  documents: Document[];
  settings: Settings;
  onCreateNew: () => void;
  onOpenDocument: (doc: Document) => void;
  onDeleteDocument: (id: number) => void;
  onOpenSettings: () => void;
}

export function DocumentsList({
  documents,
  settings,
  onCreateNew,
  onOpenDocument,
  onDeleteDocument,
  onOpenSettings
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents;
    
    const term = searchTerm.toLowerCase();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(term) ||
      doc.content.toLowerCase().includes(term)
    );
  }, [documents, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)}h`;
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-gray-100">
            Mes Documents
          </h1>
          <div className="flex gap-4">
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau document
            </button>
            <button
              onClick={onOpenSettings}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <SettingsIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Storage Warning */}
        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5">
              ⚠️
            </div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Stockage local uniquement</p>
              <p>
                Vos documents sont sauvegardés dans ce navigateur. Si vous changez de navigateur, 
                videz le cache ou supprimez les données de navigation, vous perdrez tous vos documents. 
                Pensez à exporter régulièrement vos textes importants.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans les documents..."
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && documents.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl md:text-2xl font-medium text-gray-500 dark:text-gray-400 mb-2 md:mb-3">
              Aucun document
            </h3>
            <p className="text-sm md:text-base text-gray-400 dark:text-gray-500 mb-6 md:mb-8 max-w-md mx-auto px-4">
              Créez votre premier document pour commencer à écrire vos idées et histoires.
            </p>
            <button
              onClick={onCreateNew}
              className="px-8 py-4 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Créer mon premier document
            </button>
          </div>
        )}

        {/* No Search Results */}
        {filteredDocuments.length === 0 && documents.length > 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg md:text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
              Aucun résultat
            </h3>
            <p className="text-sm md:text-base text-gray-400 dark:text-gray-500 px-4">
              Essayez avec d'autres mots-clés
            </p>
          </div>
        )}

        {/* Documents Grid */}
        {filteredDocuments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                settings={settings}
                onOpen={() => onOpenDocument(doc)}
                onDelete={() => doc.id && onDeleteDocument(doc.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}