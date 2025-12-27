'use client'

import { useState, useEffect } from 'react'
import { getNestedValue, extractFields } from '@/utils/api'
import { autoFormat } from '@/utils/format'

export default function WidgetCard({ widget, data }) {
  const [autoFields, setAutoFields] = useState([])

  useEffect(() => {
    if ((!widget.selectedFields || widget.selectedFields.length === 0) && data) {
      const fields = extractFields(data)
      const topFields = fields
        .filter(f => f.type !== 'object' && f.type !== 'array' && f.value !== null && f.value !== undefined)
        .slice(0, 4)
        .map(f => ({
          path: f.path,
          type: f.type,
          value: f.value,
          label: f.path.split('_').pop().replace(/\d+\.\s*/, '') || f.path
        }))
      setAutoFields(topFields)
    } else {
      setAutoFields([])
    }
  }, [data, widget.selectedFields])

  const fieldsToDisplay = (widget.selectedFields && widget.selectedFields.length > 0) 
    ? widget.selectedFields 
    : autoFields

  if (!fieldsToDisplay || fieldsToDisplay.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No fields available. Configure the widget to select fields.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fieldsToDisplay.map((field, index) => {
        const value = getNestedValue(data, field.path)
        const label = field.label || field.path.split('_').pop().replace(/\d+\.\s*/, '') || 'Field'

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

