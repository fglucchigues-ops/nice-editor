import React from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  const shortcuts = [
    {
      category: 'Formatage',
      items: [
        { name: 'Gras', shortcut: 'Ctrl+B' },
        { name: 'Italique', shortcut: 'Ctrl+I' },
        { name: 'Titre 1', shortcut: 'Ctrl+Alt+1' },
        { name: 'Titre 2', shortcut: 'Ctrl+Alt+2' },
        { name: 'Titre 3', shortcut: 'Ctrl+Alt+3' },
        { name: 'Effacer formatage', shortcut: 'Ctrl+U' },
      ]
    },
    {
      category: 'Surlignage',
      items: [
        { name: 'Jaune', shortcut: 'Ctrl+1' },
        { name: 'Bleu', shortcut: 'Ctrl+2' },
        { name: 'Vert', shortcut: 'Ctrl+3' },
        { name: 'Rose', shortcut: 'Ctrl+4' },
        { name: 'Violet', shortcut: 'Ctrl+5' },
        { name: 'Orange', shortcut: 'Ctrl+6' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { name: 'Sauvegarder', shortcut: 'Ctrl+S' },
        { name: 'Annuler', shortcut: 'Ctrl+Z' },
        { name: 'Rétablir', shortcut: 'Ctrl+Shift+Z' },
        { name: 'Rétablir (alt)', shortcut: 'Ctrl+Y' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Raccourcis clavier
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {item.name}
                      </span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">
                        {item.shortcut}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              💡 <strong>Astuce :</strong> Sélectionnez du texte pour faire apparaître la barre d'outils de formatage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}