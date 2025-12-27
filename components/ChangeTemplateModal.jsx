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

      if (!result.isConfirmed) {
        return
      }
    }

    clearAllWidgets()
    loadTemplate(template)
    await showSuccess('Template Applied!', `"${template.name}" template has been loaded.`, 2000)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Change Template</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select a template to replace your current dashboard.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {defaultTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                    {template.icon === 'cards' && (
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                    {template.icon === 'table' && (
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {template.icon === 'chart' && (
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                  {template.description}
                </p>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors w-full"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

