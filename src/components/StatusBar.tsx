import React from 'react';

interface Props {
  wordCount: number;
  charCount: number;
}

export function StatusBar({ wordCount, charCount }: Props) {
  return (
    <div className="fixed bottom-6 left-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100 transition-opacity duration-300 z-40">
      <span className="font-medium">{wordCount}</span> mots • {' '}
      <span className="font-medium">{charCount}</span> caractères
    </div>
  );
}