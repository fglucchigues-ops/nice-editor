import React from 'react';
import { 
  Bold, 
  Italic, 
  Minus 
} from 'lucide-react';

interface Props {
  position: { top: number; left: number };
  onFormatText: (format: string) => void;
  onHighlightText: (color: string) => void;
  onClearFormatting: () => void;
  isFormatActive: (format: string) => boolean;
  getActiveHighlight: () => string | null;
}

export function FormatToolbar({
  position,
  onFormatText,
  onHighlightText,
  onClearFormatting,
  isFormatActive,
  getActiveHighlight
}: Props) {
  const highlightColors = [
    { name: 'yellow', color: 'bg-yellow-200', title: 'Jaune (Ctrl+1)' },
    { name: 'blue', color: 'bg-blue-200', title: 'Bleu (Ctrl+2)' },
    { name: 'green', color: 'bg-green-200', title: 'Vert (Ctrl+3)' },
    { name: 'pink', color: 'bg-pink-200', title: 'Rose (Ctrl+4)' },
    { name: 'purple', color: 'bg-purple-200', title: 'Violet (Ctrl+5)' },
    { name: 'orange', color: 'bg-orange-200', title: 'Orange (Ctrl+6)' }
  ];

  const activeHighlight = getActiveHighlight();

  return (
    <div
      className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-fade-in max-w-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <div className="flex items-center gap-1 flex-nowrap">
        {/* Text Formatting */}
        <button
          onClick={() => onFormatText('bold')}
          className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            isFormatActive('bold') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
          }`}
          title="Gras (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
        
        <button
          onClick={() => onFormatText('italic')}
          className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            isFormatActive('italic') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
          }`}
          title="Italique (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        <div className="w-px h-5 md:h-6 bg-gray-300 dark:bg-gray-600 mx-1 md:mx-2" />

        {/* Headings */}
        {['h1', 'h2', 'h3'].map((heading) => (
          <button
            key={heading}
            onClick={() => onFormatText(heading)}
            className={`px-1.5 md:px-2 py-1 text-xs font-bold rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isFormatActive(heading) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
            }`}
            title={`Titre ${heading.charAt(1)} (Ctrl+Alt+${heading.charAt(1)})`}
          >
            {heading.toUpperCase()}
          </button>
        ))}

        <div className="w-px h-5 md:h-6 bg-gray-300 dark:bg-gray-600 mx-1 md:mx-2" />

        {/* Highlight Colors */}
        {highlightColors.map((color) => (
          <button
            key={color.name}
            onClick={() => onHighlightText(color.name)}
            className={`w-5 h-5 md:w-6 md:h-6 rounded-full ${color.color} border-2 ${
              activeHighlight === color.name ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300 dark:border-gray-600'
            } hover:scale-110 transition-all duration-200`}
            title={color.title}
          />
        ))}

        <div className="w-px h-5 md:h-6 bg-gray-300 dark:bg-gray-600 mx-1 md:mx-2" />

        {/* Clear Formatting */}
        <button
          onClick={onClearFormatting}
          className="p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          title="Effacer le formatage (Ctrl+U)"
        >
          <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>
    </div>
  );
}