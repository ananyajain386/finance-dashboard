'use client'

import { useState } from 'react'
import useDashboardStore from '@/store/useDashboardStore'
import { showConfirm, showSuccess, showError } from '@/utils/swal'

export default function ExportImportModal({ isOpen, onClose }) {
  const { exportConfig, importConfig, clearAllWidgets } = useDashboardStore()
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const handleExport = () => {
    const config = exportConfig()
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-dashboard-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      const config = exportConfig()
      await navigator.clipboard.writeText(config)
      showSuccess('Copied!', 'Configuration copied to clipboard', 2000)
    } catch (error) {
      showError('Copy Failed', 'Failed to copy configuration to clipboard')
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) {
      showError('Import Failed', 'Please paste a configuration')
      setImportError('Please paste a configuration')
      return
    }

    setImportError(null)
    setImportSuccess(false)

    const success = importConfig(importText)
    if (success) {
      setImportSuccess(true)
      setImportText('')
      await showSuccess('Configuration Imported!', 'Reloading dashboard...', 1500)
      onClose()
      window.location.reload() 
    } else {
      const errorMsg = 'Invalid configuration format. Please check your JSON.'
      setImportError(errorMsg)
      showError('Import Failed', errorMsg)
    }
  }

  const handleClearAll = async () => {
    const result = await showConfirm({
      title: 'Clear All Widgets?',
      text: 'Are you sure you want to permanently delete all widgets? This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    })

    if (result.isConfirmed) {
      clearAllWidgets()
      showSuccess('All Widgets Cleared', 'All widgets have been removed from your dashboard.', 2000)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export/Import Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Configuration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download or copy your dashboard configuration to backup or share it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Configuration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Paste a previously exported configuration to restore your dashboard.
            </p>
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value)
                setImportError(null)
                setImportSuccess(false)
              }}
              placeholder="Paste your configuration JSON here..."
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {importError && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                Configuration imported successfully! Reloading...
              </div>
            )}
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Configuration
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Permanently delete all widgets from your dashboard.
            </p>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear All Widgets
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

