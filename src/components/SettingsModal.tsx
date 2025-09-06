import React from 'react';
import { Settings } from '../types';
import { X, Sun, Moon, Pin, Scroll, Plus, Minus } from 'lucide-react';

interface Props {
  settings: Settings;
  onUpdateSetting: (key: keyof Settings, value: any) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdateSetting, onClose }: Props) {
  const fontOptions = [
    { value: "'Inter', sans-serif", label: 'Inter (Sans-serif)' },
    { value: "'Libre Baskerville', serif", label: 'Libre Baskerville (Serif)' },
    { value: "'Courier New', monospace", label: 'Courier New (Monospace)' },
    { value: "Georgia, serif", label: 'Georgia (Serif)' },
    { value: "system-ui, sans-serif", label: 'Système' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Paramètres
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
        <div className="p-6 space-y-8">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Thème
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onUpdateSetting('theme', 'light')}
                className={`flex-1 p-4 border-2 rounded-xl transition-all duration-200 ${
                  settings.theme === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Clair</div>
              </button>
              <button
                onClick={() => onUpdateSetting('theme', 'dark')}
                className={`flex-1 p-4 border-2 rounded-xl transition-all duration-200 ${
                  settings.theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Moon className="w-5 h-5 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Sombre</div>
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Police
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => onUpdateSetting('fontFamily', e.target.value)}
              className="w-full p-3 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] bg-[position:right_12px_center]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`
              }}
            >
              {fontOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Taille de police
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onUpdateSetting('fontSize', Math.max(12, settings.fontSize - 2))}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="flex-1 text-center font-medium text-gray-900 dark:text-gray-100">
                {settings.fontSize}px
              </span>
              <button
                onClick={() => onUpdateSetting('fontSize', Math.min(24, settings.fontSize + 2))}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Line Height */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Espacement des lignes
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onUpdateSetting('lineHeight', Math.max(1.2, parseFloat((settings.lineHeight - 0.1).toFixed(1))))}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="flex-1 text-center font-medium text-gray-900 dark:text-gray-100">
                {settings.lineHeight.toFixed(1)}
              </span>
              <button
                onClick={() => onUpdateSetting('lineHeight', Math.min(2.5, parseFloat((settings.lineHeight + 0.1).toFixed(1))))}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Sticky Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Position du titre
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onUpdateSetting('stickyTitle', true)}
                className={`flex-1 p-4 border-2 rounded-xl transition-all duration-200 ${
                  settings.stickyTitle 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Pin className="w-5 h-5 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Fixé</div>
              </button>
              <button
                onClick={() => onUpdateSetting('stickyTitle', false)}
                className={`flex-1 p-4 border-2 rounded-xl transition-all duration-200 ${
                  !settings.stickyTitle 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Scroll className="w-5 h-5 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Normal</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}