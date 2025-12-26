'use client'

import { useState, useMemo } from 'react'
import { getNestedValue } from '@/utils/api'
import { autoFormat } from '@/utils/format'

export default function WidgetTable({ widget, data }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const itemsPerPage = 10

  const extractArrayData = (data) => {
    if (Array.isArray(data)) {
      return { array: data, arrayKey: null }
    }

    if (widget.selectedFields && widget.selectedFields.length > 0) {
      const firstField = widget.selectedFields[0]?.path
      if (firstField) {
        const parts = firstField.split('_')
        if (parts.length >= 2) {
          const possibleArrayKey = parts[0]
          if (data[possibleArrayKey] && Array.isArray(data[possibleArrayKey])) {
            return { array: data[possibleArrayKey], arrayKey: possibleArrayKey }
          }
        }
      }
    }

    const findArray = (obj, key = null) => {
      if (Array.isArray(obj)) {
        return { array: obj, arrayKey: key }
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const k in obj) {
          const result = findArray(obj[k], k)
          if (result) return result
        }
      }
      return null
    }

    const result = findArray(data)
    return result || { array: [], arrayKey: null }
  }

  const { array: arrayData, arrayKey } = extractArrayData(data)

  const columns = useMemo(() => {
    if (widget.selectedFields && widget.selectedFields.length > 0) {
      return widget.selectedFields.map((field) => {
        let propertyPath = field.path
        let label = field.path.split('_').pop() || 'Field'
        
        if (arrayKey && field.path.startsWith(`${arrayKey}_`)) {
          const pathParts = field.path.split('_')
          if (pathParts[0] === arrayKey && pathParts.length >= 3) {
            propertyPath = pathParts.slice(2).join('.')
            label = `${arrayKey}.${pathParts.slice(2).join('.')}`
          } else if (pathParts[0] === arrayKey && pathParts.length === 2) {
            propertyPath = ''
            label = `${arrayKey}[${pathParts[1]}]`
          }
        } else {
          label = field.label || label
        }
        
        return {
          key: field.path, 
          propertyPath: propertyPath, 
          label: label,
          format: field.format || 'auto',
        }
      })
    }

    if (arrayData.length > 0 && typeof arrayData[0] === 'object') {
      return Object.keys(arrayData[0]).map((key) => ({
        key,
        propertyPath: key,
        label: arrayKey ? `${arrayKey}.${key}` : (key.charAt(0).toUpperCase() + key.slice(1)),
        format: 'auto',
      }))
    }

    return []
  }, [widget.selectedFields, arrayData, arrayKey])

  const processedData = useMemo(() => {
    let filtered = arrayData

    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const column = columns.find(col => col.key === sortField)
        const path = column?.propertyPath || sortField
        const aVal = getNestedValue(a, path)
        const bVal = getNestedValue(b, path)
        
        if (aVal === bVal) return 0
        
        const comparison = aVal > bVal ? 1 : -1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [arrayData, searchTerm, sortField, sortDirection, columns])

  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (arrayData.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No array data found. Make sure your API returns an array or select array fields.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <svg
          className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortField === column.key && (
                      <svg
                        className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                {columns.map((column) => {
                  
                  let value = getNestedValue(item, column.propertyPath)
                  if (Array.isArray(value)) {
                    if (value.length === 0) {
                      value = 'N/A'
                    } else if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
                      value = value.join(', ')
                    } else if (value.every(v => typeof v === 'object' && v !== null)) {
                      if (value.length <= 3) {
                        value = value.map((v, idx) => {
                          if (v.topic) return v.topic
                          if (v.ticker) return v.ticker
                          return `Item ${idx + 1}`
                        }).join(', ')
                      } else {
                        value = `${value.length} items`
                      }
                    } else {
                      value = `${value.length} items`
                    }
                  } else if (typeof value === 'object' && value !== null) {
                    if (value.topic) value = value.topic
                    else if (value.ticker) value = value.ticker
                    else value = JSON.stringify(value).slice(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                  }
                  
                  return (
                    <td key={column.key} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {value !== undefined && value !== null
                        ? (typeof value === 'string' ? value : autoFormat(value, column.format))
                        : 'N/A'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

