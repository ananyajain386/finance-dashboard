'use client'

import { defaultTemplates } from '@/utils/templates'
import useDashboardStore from '@/store/useDashboardStore'
import { showSuccess } from '@/utils/swal'

export default function TemplateSelector({ onTemplateSelect }) {
  const { loadTemplate } = useDashboardStore()

  const handleUseTemplate = async (template) => {
    loadTemplate(template)
    await showSuccess(
      'Template Applied!',
      `"${template.name}" template has been loaded.`,
      2000
    )
    onTemplateSelect?.()
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
        Build Your Dashboard
      </h2>
      <p className="text-base text-gray-600 dark:text-gray-400 mb-14 max-w-xl text-center">
        Start quickly with a pre-built template or customize everything from scratch.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
        {defaultTemplates.map((template) => (
          <div
            key={template.id}
            className="group relative flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800">
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
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-grow">
              {template.description}
            </p>
            <button
              onClick={() => handleUseTemplate(template)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors">
              Use Template
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
