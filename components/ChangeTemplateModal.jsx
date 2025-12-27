'use client'

import { defaultTemplates } from '@/utils/templates'
import useDashboardStore from '@/store/useDashboardStore'
import { showSuccess, showConfirm } from '@/utils/swal'

export default function ChangeTemplateModal({ isOpen, onClose }) {
  const { widgets, loadTemplate, clearAllWidgets } = useDashboardStore()

  const handleUseTemplate = async (template) => {
    if (widgets.length > 0) {
      const result = await showConfirm({
        title: 'Replace Current Dashboard?',
        text: `This will replace all existing widgets with the "${template.name}" template. This action cannot be undone.`,
        icon: 'warning',
        confirmButtonText: 'Yes, replace it',
        cancelButtonText: 'Cancel',
      })

      if (!result.isConfirmed) return
    }

    clearAllWidgets()
    loadTemplate(template)
    await showSuccess(
      'Template Applied!',
      `"${template.name}" template has been loaded.`,
      2000
    )
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Change Template
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select a template to replace your current dashboard.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {defaultTemplates.map((template) => (
              <div
                key={template.id}
                className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center">
                    {template.icon === 'cards' && (
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                    {template.icon === 'table' && (
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {template.icon === 'chart' && (
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-grow">
                  {template.description}
                </p>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors">
                  Use Template
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end px-8 py-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
