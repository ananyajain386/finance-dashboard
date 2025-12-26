'use client'

import { getNestedValue } from '@/utils/api'
import { autoFormat } from '@/utils/format'

export default function WidgetCard({ widget, data }) {
  if (!widget.selectedFields || widget.selectedFields.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No fields selected. Configure the widget to select fields.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {widget.selectedFields.map((field, index) => {
        const value = getNestedValue(data, field.path)
        const label = field.label || field.path.split('.').pop() || 'Field'

        return (
          <div
            key={index}
            className="flex flex-col justify-between p-4 bg-gray-50 dark:bg-[#101828] rounded-lg gap-2"
          >
            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
              {label}
            </span>
            <p className="text-md leading-relaxed font-semibold text-gray-900 dark:text-white">
              {value !== undefined && value !== null
                ? autoFormat(value, field.format || 'auto')
                : 'N/A'}
            </p>
          </div>
        )
      })}
    </div>
  )
}

